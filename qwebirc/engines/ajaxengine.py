from twisted.web import resource, server, static, error as http_error
from twisted.names import client
from twisted.internet import reactor, error
from authgateengine import login_optional, getSessionData
import md5, sys, os, time, config, qwebirc.config_options as config_options, traceback, socket
import qwebirc.ircclient as ircclient
from adminengine import AdminEngineAction
from qwebirc.util import HitCounter
import qwebirc.dns as qdns
import qwebirc.util.qjson as json
import urlparse

TRANSPORTS = ["longpoll"]

try:
  import autobahn.websocket
  import autobahn.resource
  has_websocket = True
  TRANSPORTS.append("websocket")
except ImportError:
  has_websocket = False

BAD_SESSION_MESSAGE = "Invalid session, this most likely means the server has restarted; close this dialog and then try refreshing the page."
Sessions = {}

def get_session_id():
  return md5.md5(os.urandom(16)).hexdigest()

class BufferOverflowException(Exception):
  pass

class AJAXException(Exception):
  pass
  
class IDGenerationException(Exception):
  pass

class LineTooLongException(Exception):
  pass

EMPTY_JSON_LIST = json.dumps([])

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
    self.buflen = 0
    self.throttle = 0
    self.schedule = None
    self.closed = False
    self.cleanupschedule = None

  def subscribe(self, channel):
    if len(self.subscriptions) >= config.MAXSUBSCRIPTIONS:
      self.subscriptions.pop(0).close()

    self.subscriptions.append(channel)
    self.flush()

  def unsubscribe(self, channel):
    try:
      self.subscriptions.remove(channel)
    except ValueError:
      pass

  def timeout(self, channel):
    if self.schedule:
      return
      
    channel.write(EMPTY_JSON_LIST)
    if channel in self.subscriptions:
      self.subscriptions.remove(channel)
      
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

    encdata = json.dumps(self.buffer)
    self.buffer = []
    self.buflen = 0

    newsubs = []
    for x in self.subscriptions:
      if x.write(encdata):
        newsubs.append(x)

    self.subscriptions = newsubs
    if self.closed and not self.subscriptions:
      cleanupSession(self.id)

  def event(self, data):
    newbuflen = self.buflen + len(data)
    if newbuflen > config.MAXBUFLEN:
      self.buffer = []
      self.client.error("Buffer overflow.")
      return

    self.buffer.append(data)
    self.buflen = newbuflen
    self.flush()
    
  def push(self, data):
    if self.closed:
      return

    if len(data) > config.MAXLINELEN:
      raise LineTooLongException

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

  def write(self, data):
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
    if path[0] == "/":
      handler = self.COMMANDS.get(path[1:])
      if handler is not None:
        try:
          return handler(self, request)
        except AJAXException, e:
          return json.dumps((False, e[0]))

    return "404" ## TODO: tidy up

  def newConnection(self, request):
    ticket = login_optional(request)
    
    ip = request.getClientIP()

    nick = request.args.get("nick")
    if not nick:
      raise AJAXException, "Nickname not supplied."
    nick = ircclient.irc_decode(nick[0])

    password = request.args.get("password")
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
    
    return json.dumps((True, id, TRANSPORTS))
  
  def getSession(self, request):
    bad_session_message = "Invalid session, this most likely means the server has restarted; close this dialog and then try refreshing the page."
    
    sessionid = request.args.get("s")
    if sessionid is None:
      raise AJAXException, bad_session_message
      
    session = Sessions.get(sessionid[0])
    if not session:
      raise AJAXException, bad_session_message
    return session
    
  def subscribe(self, request):
    request.channel.cancelTimeout()

    channel = RequestChannel(request)
    session = self.getSession(request)
    notifier = request.notifyFinish()
    session.subscribe(channel)

    timeout_entry = reactor.callLater(config.HTTP_AJAX_REQUEST_TIMEOUT, session.timeout, channel)
    def cancel_timeout(result):
      session.unsubscribe(self)
      try:
        timeout_entry.cancel()
      except error.AlreadyCalled:
        pass
    notifier.addCallbacks(cancel_timeout, cancel_timeout)
    return server.NOT_DONE_YET

  def push(self, request):
    command = request.args.get("c")
    if command is None:
      raise AJAXException, "No command specified."
    self.__total_hit()
    
    session = self.getSession(request)
    try:
      session.push(ircclient.irc_decode(command[0]))
    except AttributeError: # occurs when we haven't noticed an error
      session.disconnect()
      raise AJAXException, "Connection closed by server; try reconnecting by reloading the page."
    except Exception, e: # catch all
      session.disconnect()        
      traceback.print_exc(file=sys.stderr)
      raise AJAXException, "Unknown error."
  
    return json.dumps((True, True))
  
  def closeById(self, k):
    s = Sessions.get(k)
    if s is None:
      return
    s.client.client.error("Closed by admin interface")
    
  @property
  def adminEngine(self):
    return {
      "Sessions": [(str(v.client.client), AdminEngineAction("close", self.closeById, k)) for k, v in Sessions.iteritems() if not v.closed],
      "Connections": [(self.__connect_hit,)],
      "Total hits": [(self.__total_hit,)],
    }
    
  COMMANDS = dict(p=push, n=newConnection, s=subscribe)
  
if has_websocket:
  class WebSocketChannel(object):
    def __init__(self, channel):
      self.channel = channel

    def write(self, data):
      self.channel.send("c", data)
      return True

    def close(self):
      self.channel.close()

  class WebSocketEngineProtocol(autobahn.websocket.WebSocketServerProtocol):
    AWAITING_AUTH, AUTHED = 0, 1

    def __init__(self, *args, **kwargs):
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

    def onMessage(self, msg, binary):
      # we don't bother checking the Origin header, as if you can auth then you've been able to pass the browser's
      # normal origin handling (POSTed the new connection request and managed to get the session id)
      state = self.__state
      message_type, message = msg[:1], msg[1:]
      if state == self.AWAITING_AUTH:
        if message_type == "s":  # subscribe
          session = Sessions.get(message)
          if not session:
            self.close(BAD_SESSION_MESSAGE)
            return

          self.__cancelTimeout()
          self.__session = session
          self.send("s", "True")
          self.__state = self.AUTHED
          self.__channel = WebSocketChannel(self)
          session.subscribe(self.__channel)
          return
      elif state == self.AUTHED:
        if message_type == "p":  # push
          self.__session.push(ircclient.irc_decode(message))
          return

      self.close("Bad message type")

    def __cancelTimeout(self):
      if self.__timeout is not None:
        self.__timeout.cancel()
        self.__timeout = None

    def close(self, reason=None):
      self.__cancelTimeout()
      if reason:
        self.sendClose(4999, reason)
      else:
        self.sendClose(4998)

      if self.__session:
        self.__session.unsubscribe(self.__channel)
        self.__session = None

    def send(self, message_type, message):
      self.sendMessage(message_type + message)

  class WebSocketResource(autobahn.resource.WebSocketResource):
    def render(self, request):
      request.channel.cancelTimeout()
      return autobahn.resource.WebSocketResource.render(self, request)

  def WebSocketEngine(path=None):
    parsed = urlparse.urlparse(config.BASE_URL)
    port = parsed.port
    if port is None:
      if parsed.scheme == "http":
        port = 80
      elif parsed.scheme == "https":
        port = 443
      else:
        raise Exception("Unable to determine port from BASE_URL: " + config.BASE_URL)

    factory = autobahn.websocket.WebSocketServerFactory("ws://localhost:%d" % port)
    factory.protocol = WebSocketEngineProtocol
    factory.setProtocolOptions(maxMessagePayloadSize=512, maxFramePayloadSize=512, tcpNoDelay=False)
    resource = WebSocketResource(factory)
    return resource
