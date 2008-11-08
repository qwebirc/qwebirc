from twisted.web import resource, server, static
from twisted.names import client
from twisted.internet import reactor
import traceback
import simplejson, md5, sys, os, ircclient, time, config, weakref

Sessions = {}

def get_session_id():
  return md5.md5(os.urandom(16)).hexdigest()

class BufferOverflowException(Exception):
  pass

class AJAXException(Exception):
  pass
  
class IDGenerationException(Exception):
  pass

NOT_DONE_YET = None

def jsondump(fn):
  def decorator(*args, **kwargs):
    try:
      x = fn(*args, **kwargs)
      if x is None:
        return server.NOT_DONE_YET
      x = (True, x)
    except AJAXException, e:
      x = (False, e[0])
      
    return simplejson.dumps(x)
  return decorator

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
    self.throttle = 0
    self.schedule = None
    self.closed = False
    self.cleanupschedule = None

  def subscribe(self, channel):
    if len(self.subscriptions) >= config.MAXSUBSCRIPTIONS:
      self.subscriptions.pop(0).close()

    self.subscriptions.append(channel)
    self.flush()
      
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

    encdata = simplejson.dumps(self.buffer)
    self.buffer = []
    
    newsubs = []
    for x in self.subscriptions:
      if x.write(encdata):
        newsubs.append(x)

    self.subscriptions = newsubs
    if self.closed and not self.subscriptions:
      cleanupSession(self.id)

  def event(self, data):
    bufferlen = sum(map(len, self.buffer))
    if bufferlen + len(data) > config.MAXBUFLEN:
      self.buffer = []
      self.client.error("Buffer overflow")
      return

    self.buffer.append(data)
    self.flush()
    
  def push(self, data):
    if not self.closed:
      self.client.write(data)

  def disconnect(self):
    # keep the session hanging around for a few seconds so the
    # client has a chance to see what the issue was
    self.closed = True

    reactor.callLater(5, cleanupSession, self.id)

class Channel:
  def __init__(self, request):
    self.request = request
  
class SingleUseChannel(Channel):
  def write(self, data):
    self.request.write(data)
    self.request.finish()
    return False
    
  def close(self):
    self.request.finish()
    
class MultipleUseChannel(Channel):
  def write(self, data):
    self.request.write(data)
    return True

class AJAXEngine(resource.Resource):
  isLeaf = True
  
  def __init__(self, prefix):
    self.prefix = prefix

  @jsondump
  def render_POST(self, request):
    path = request.path[len(self.prefix):]
    if path[0] == "/":
      handler = self.COMMANDS.get(path[1:])
      if handler is not None:
        return handler(self, request)
    raise AJAXException("404")

#  def render_GET(self, request):
#    return self.render_POST(request)
  
  def newConnection(self, request):
    _, ip, port = request.transport.getPeer()

    nick, ident = request.args.get("nick"), "webchat"
    if not nick:
      raise AJAXException("Nickname not supplied")
      
    nick = nick[0]

    for i in xrange(10):
      id = get_session_id()
      if not Sessions.get(id):
        break
    else:
      raise IDGenerationException()

    session = IRCSession(id)

    client = ircclient.createIRC(session, nick=nick, ident=ident, ip=ip, realname=config.REALNAME)
    session.client = client
    
    Sessions[id] = session
    
    return id
  
  def getSession(self, request):
    sessionid = request.args.get("s")
    if sessionid is None:
      raise AJAXException("Bad session ID")
      
    session = Sessions.get(sessionid[0])
    if not session:
      raise AJAXException("Bad session ID")
    return session
    
  def subscribe(self, request):
    self.getSession(request).subscribe(SingleUseChannel(request))
    return NOT_DONE_YET

  def push(self, request):
    command = request.args.get("c")
    if command is None:
      raise AJAXException("No command specified")

    command = command[0]
    
    session = self.getSession(request)

    try:
      decoded = command.decode("utf-8")
    except UnicodeDecodeError:
      decoded = command.decode("iso-8859-1", "ignore")

    if len(decoded) > config.MAXLINELEN:
      session.disconnect()
      raise AJAXException("Line too long")

    try:
      session.push(decoded)
    except AttributeError: # occurs when we haven't noticed an error
      session.disconnect()
      raise AJAXException("Connection closed by server.")
    except Exception, e: # catch all
      session.disconnect()        
      traceback.print_exc(file=sys.stderr)
      raise AJAXException("Unknown error.")
  
    return True
  
  COMMANDS = dict(p=push, n=newConnection, s=subscribe)
  