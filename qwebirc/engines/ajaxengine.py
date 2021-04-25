from twisted.web import resource, server, static, error as http_error
from twisted.names import client
from twisted.internet import reactor, error
from .authgateengine import login_optional, getSessionData
import secrets, sys, os, time, config, qwebirc.config_options as config_options, traceback, socket
import qwebirc.ircclient as ircclient
from .adminengine import AdminEngineAction
from qwebirc.util import HitCounter
import qwebirc.dns as qdns
import json
import urllib.parse
import qwebirc.util.autobahn_check as autobahn_check

TRANSPORTS = ["longpoll"]

has_websocket = False
autobahn_status = autobahn_check.check()
if autobahn_status == True:
  import autobahn
  import autobahn.twisted.websocket
  import autobahn.twisted.resource
  has_websocket = True
  TRANSPORTS.append("websocket")
elif autobahn_status == False:
  # they've been warned already
  pass
else:
  print("WARNING:", file=sys.stderr)
  print("  %s" % autobahn_status, file=sys.stderr)
  print("  as a result websocket support is disabled.", file=sys.stderr)
  print("  upgrade your version of autobahn from http://autobahn.ws/python/getstarted/", file=sys.stderr)

BAD_SESSION_MESSAGE = "Invalid session, this most likely means the server has restarted; close this dialog and then try refreshing the page."
MAX_SEQNO = 9223372036854775807  # 2**63 - 1... yeah it doesn't wrap
Sessions = {}

def get_session_id():
  return secrets.token_hex(16).encode()

class BufferOverflowException(Exception):
  pass

class AJAXException(Exception):
  pass
  
class IDGenerationException(Exception):
  pass

class LineTooLongException(Exception):
  pass

EMPTY_JSON_LIST = json.dumps([]).encode()

def cleanupSession(id):
  try:
    del Sessions[id]
  except KeyError:
    pass

class IRCSession:
  def __init__(self, id):
    self.id = id
    self.subscriptions = []
    self.buffer = []
    self.old_buffer = None
    self.buflen = 0
    self.throttle = 0
    self.schedule = None
    self.closed = False
    self.cleanupschedule = None
    self.pubSeqNo = -1
    self.subSeqNo = 0

  def subscribe(self, channel, seqNo=None):
    if len(self.subscriptions) >= config.MAXSUBSCRIPTIONS:
      self.subscriptions.pop(0).close()

    if seqNo is not None and seqNo < self.subSeqNo:
      if self.old_buffer is None or seqNo != self.old_buffer[0]:
        channel.write(json.dumps([False, "Unable to reconnect -- sequence number too old."]).encode(), seqNo + 1)
        return

      if not channel.write(self.old_buffer[1], self.old_buffer[0] + 1):
        return

    self.subscriptions.append(channel)
    self.flush(seqNo)

  def unsubscribe(self, channel):
    try:
      self.subscriptions.remove(channel)
    except ValueError:
      pass

  def timeout(self, channel):
    if self.schedule:
      return

    self.unsubscribe(channel)
    channel.write(EMPTY_JSON_LIST, self.subSeqNo)

  def flush(self, scheduled=False):
    if scheduled:
      self.schedule = None
      
    if not self.buffer or not self.subscriptions:
      return
        
    t = time.time()
    
    if t < self.throttle:
      if not self.schedule:
        self.schedule = reactor.callLater(self.throttle - t, self.flush, True)
      return
    else:
      # process the rest of the packet
      if not scheduled:
        if not self.schedule:
          self.schedule = reactor.callLater(0, self.flush, True)
        return

    self.throttle = t + config.UPDATE_FREQ

    encdata = json.dumps(self.buffer).encode()
    self.old_buffer = (self.subSeqNo, encdata)
    self.subSeqNo+=1
    self.buffer = []
    self.buflen = 0

    subs = self.subscriptions
    self.subscriptions = newsubs = []

    for x in subs:
      if x.write(encdata, self.subSeqNo):
        newsubs.append(x)

    if self.closed and not newsubs:
      cleanupSession(self.id)

  def event(self, data):
    newbuflen = self.buflen + len(data)
    if newbuflen > config.MAXBUFLEN:
      self.buffer = []
      if hasattr(self, "client"):
        self.client.error("Buffer overflow.")
      return

    self.buffer.append(data)
    self.buflen = newbuflen
    self.flush()
    
  def push(self, data, seq_no=None):
    if self.closed:
      return

    if len(data) > config.MAXLINELEN:
      raise LineTooLongException

    if seq_no is not None:
      if seq_no <= self.pubSeqNo:
        return
      self.pubSeqNo = seq_no
    self.client.write(data)

  def disconnect(self):
    # keep the session hanging around for a few seconds so the
    # client has a chance to see what the issue was
    self.closed = True

    reactor.callLater(5, cleanupSession, self.id)

# DANGER! Breach of encapsulation!
def connect_notice(line):
  return "c", "NOTICE", "", ("AUTH", "*** (qwebirc) %s" % line)

class RequestChannel(object):
  def __init__(self, request):
    self.request = request

  def write(self, data, seqNo):
    self.request.setHeader("n", str(seqNo))
    self.request.write(data)
    self.request.finish()
    return False
    
  def close(self):
    self.request.finish()
    
class AJAXEngine(resource.Resource):
  isLeaf = True
  
  def __init__(self, prefix):
    self.prefix = prefix
    self.__connect_hit = HitCounter()
    self.__total_hit = HitCounter()
    
  def render_POST(self, request):
    path = request.path[len(self.prefix):]
    if path[0:1] == b"/":
      handler = self.COMMANDS.get(path[1:].decode())
      if handler is not None:
        try:
          return handler(self, request)
        except AJAXException as e:
          return json.dumps((False, str(e))).encode()

    return b"404" ## TODO: tidy up

  def newConnection(self, request):
    ticket = login_optional(request)
    
    ip = request.getClientIP()

    nick = request.args.get(b"nick")
    if not nick:
      raise AJAXException("Nickname not supplied.")
    nick = ircclient.irc_decode(nick[0])

    password = request.args.get(b"password")
    if password is not None:
      password = ircclient.irc_decode(password[0])
      
    for i in range(10):
      id = get_session_id()
      if not Sessions.get(id):
        break
    else:
      raise IDGenerationException()

    session = IRCSession(id)

    qticket = getSessionData(request).get("qticket")
    if qticket is None:
      perform = None
    else:
      service_mask = config.AUTH_SERVICE
      msg_mask = service_mask.split("!")[0] + "@" + service_mask.split("@", 1)[1]
      perform = ["PRIVMSG %s :TICKETAUTH %s" % (msg_mask, qticket)]

    ident, realname = config.IDENT, config.REALNAME
    if ident is config_options.IDENT_HEX or ident is None: # latter is legacy
      ident = socket.inet_aton(ip).encode("hex")
    elif ident is config_options.IDENT_NICKNAME:
      ident = nick

    self.__connect_hit()

    def proceed(hostname):
      kwargs = dict(nick=nick, ident=ident, ip=ip, realname=realname, perform=perform, hostname=hostname)
      if password is not None:
        kwargs["password"] = password
        
      client = ircclient.createIRC(session, **kwargs)
      session.client = client

    if not hasattr(config, "WEBIRC_MODE") or config.WEBIRC_MODE == "hmac":
      proceed(None)
    elif config.WEBIRC_MODE != "hmac":
      notice = lambda x: session.event(connect_notice(x))
      notice("Looking up your hostname...")
      def callback(hostname):
        notice("Found your hostname.")
        proceed(hostname)
      def errback(failure):
        notice("Couldn't look up your hostname!")
        proceed(ip)
      qdns.lookupAndVerifyPTR(ip, timeout=[config.DNS_TIMEOUT]).addCallbacks(callback, errback)

    Sessions[id] = session
    
    return json.dumps((True, id.decode(), TRANSPORTS)).encode()

  def getSession(self, request):
    bad_session_message = "Invalid session, this most likely means the server has restarted; close this dialog and then try refreshing the page."
    
    sessionid = request.args.get(b"s")
    if sessionid is None:
      raise AJAXException(bad_session_message)
      
    session = Sessions.get(sessionid[0])
    if not session:
      raise AJAXException(bad_session_message)
    return session
    
  def subscribe(self, request):
    request.channel.setTimeout(None)

    channel = RequestChannel(request)
    session = self.getSession(request)
    notifier = request.notifyFinish()

    seq_no = request.args.get(b"n")
    try:
      if seq_no is not None:
        seq_no = int(seq_no[0])
        if seq_no < 0 or seq_no > MAX_SEQNO:
          raise ValueError
    except ValueError:
      raise AJAXException("Bad sequence number")

    session.subscribe(channel, seq_no)

    timeout_entry = reactor.callLater(config.HTTP_AJAX_REQUEST_TIMEOUT, session.timeout, channel)
    def cancel_timeout(result):
      try:
        timeout_entry.cancel()
      except error.AlreadyCalled:
        pass
      session.unsubscribe(channel)
    notifier.addCallbacks(cancel_timeout, cancel_timeout)
    return server.NOT_DONE_YET

  def push(self, request):
    command = request.args.get(b"c")
    if command is None:
      raise AJAXException("No command specified.")
    self.__total_hit()

    seq_no = request.args.get(b"n")
    try:
      if seq_no is not None:
        seq_no = int(seq_no[0])
        if seq_no < 0 or seq_no > MAX_SEQNO:
          raise ValueError
    except ValueError:
      raise AJAXException("Bad sequence number %r" % seq_no)

    session = self.getSession(request)
    try:
      session.push(ircclient.irc_decode(command[0]), seq_no)
    except AttributeError: # occurs when we haven't noticed an error
      session.disconnect()
      raise AJAXException("Connection closed by server; try reconnecting by reloading the page.")
    except Exception as e: # catch all
      session.disconnect()        
      traceback.print_exc(file=sys.stderr)
      raise AJAXException("Unknown error.")
  
    return json.dumps((True, True)).encode()
  
  def closeById(self, k):
    s = Sessions.get(k)
    if s is None:
      return
    s.client.client.error("Closed by admin interface")
    
  @property
  def adminEngine(self):
    return {
      "Sessions": [(str(v.client.client), AdminEngineAction("close", self.closeById, k)) for k, v in Sessions.items() if not v.closed],
      "Connections": [(self.__connect_hit,)],
      "Total hits": [(self.__total_hit,)],
    }
    
  COMMANDS = dict(p=push, n=newConnection, s=subscribe)
  
if has_websocket:
  class WebSocketChannel(object):
    def __init__(self, channel):
      self.channel = channel

    def write(self, data, seqNo):
      self.channel.send(b"c", b"%d,%s" % (seqNo, data))
      return True

    def close(self):
      self.channel.close()

  class WebSocketEngineProtocol(autobahn.twisted.websocket.WebSocketServerProtocol):
    AWAITING_AUTH, AUTHED = 0, 1

    def __init__(self, *args, **kwargs):
      super(WebSocketEngineProtocol, self).__init__(*args, **kwargs)
      self.__state = self.AWAITING_AUTH
      self.__session = None
      self.__channel = None
      self.__timeout = None

    def onOpen(self):
      self.__timeout = reactor.callLater(5, self.close, "Authentication timeout")

    def onClose(self, wasClean, code, reason):
      self.__cancelTimeout()
      if self.__session:
        self.__session.unsubscribe(self.__channel)
        self.__session = None

    def onMessage(self, msg, isBinary):
      # we don't bother checking the Origin header, as if you can auth then you've been able to pass the browser's
      # normal origin handling (POSTed the new connection request and managed to get the session id)
      state = self.__state
      message_type, message = msg[:1], msg[1:]
      if state == self.AWAITING_AUTH:
        if message_type == b"s":  # subscribe
          tokens = message.split(b",", 1)
          if len(tokens) != 2:
            self.close("Bad tokens")
            return

          seq_no, message = tokens[0], tokens[1]
          try:
            seq_no = int(seq_no)
            if seq_no < 0 or seq_no > MAX_SEQNO:
              raise ValueError
          except ValueError:
            self.close("Bad value")

          session = Sessions.get(message)
          if not session:
            self.close(BAD_SESSION_MESSAGE)
            return

          self.__cancelTimeout()
          self.__session = session
          self.send(b"s", b"True")
          self.__state = self.AUTHED
          self.__channel = WebSocketChannel(self)
          session.subscribe(self.__channel, seq_no)
          return
      elif state == self.AUTHED:
        if message_type == b"p":  # push
          tokens = message.split(b",", 1)
          if len(tokens) != 2:
            self.close("Bad tokens")
            return

          seq_no, message = tokens[0], tokens[1]
          try:
            seq_no = int(seq_no)
            if seq_no < 0 or seq_no > MAX_SEQNO:
              raise ValueError
          except ValueError:
            self.close("Bad value")
          self.__session.push(ircclient.irc_decode(message))
          return

      self.close("Bad message type")

    def __cancelTimeout(self):
      if self.__timeout is not None:
        try:
          self.__timeout.cancel()
        except error.AlreadyCalled:
          pass
        self.__timeout = None

    def close(self, reason=None):
      self.__cancelTimeout()
      if reason:
        self.sendClose(4999, str(reason))
      else:
        self.sendClose(4998)

      if self.__session:
        self.__session.unsubscribe(self.__channel)
        self.__session = None

    def send(self, message_type, message):
      self.sendMessage(message_type + message)

  class WebSocketResource(autobahn.twisted.resource.WebSocketResource):
    def render(self, request):
      request.channel.setTimeout(None)
      return autobahn.twisted.resource.WebSocketResource.render(self, request)

  def WebSocketEngine(path=None):
    factory = autobahn.twisted.websocket.WebSocketServerFactory("ws://localhost")
    factory.externalPort = None
    factory.protocol = WebSocketEngineProtocol
    factory.setProtocolOptions(maxMessagePayloadSize=512, maxFramePayloadSize=512, tcpNoDelay=False)
    resource = WebSocketResource(factory)
    return resource

