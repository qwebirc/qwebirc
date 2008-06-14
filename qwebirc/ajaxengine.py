from twisted.web import resource, server, static
from twisted.names import client
from twisted.internet import reactor
import simplejson, md5, sys, os, ircclient, time, config

Sessions = {}

def get_session_id():
  return md5.md5(os.urandom(16)).hexdigest()
  
def jsondump(fn):
  def decorator(*args, **kwargs):
    x = fn(*args, **kwargs)
    if isinstance(x, list):
      return simplejson.dumps(x)
    return x
  return decorator

class IRCSession:
  def __init__(self, id):
    self.id = id
    self.subscriptions = []
    self.buffer = []
    self.throttle = 0
    self.schedule = None
    
  def subscribe(self, channel):
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
    self.throttle = t + config.UPDATE_FREQ

    encdata = simplejson.dumps(self.buffer)
    self.buffer = []
    
    newsubs = []
    for x in self.subscriptions:
      if x.write(encdata):
        newsubs.append(x)

    self.subscriptions = newsubs
     
  def event(self, data):
    self.buffer.append(data)
    self.flush()
    
  def push(self, data):
    self.client.write(data)
 
class Channel:
  def __init__(self, request):
    self.request = request
  
class SingleUseChannel(Channel):
  def write(self, data):
    self.request.write(data)
    self.request.finish()
    return False
    
class MultipleUseChannel(Channel):
  def write(self, data):
    self.request.write(data)
    return True

class AJAXEngine(resource.Resource):
  isLeaf = True
  
  def __init__(self, prefix):
    self.prefix = prefix

  @jsondump
  def render_GET(self, request):
    path = request.path[len(self.prefix):]
    if path == "/n":
      ip = request.transport.getPeer()
      ip = ip[1]

      nick, ident = request.args.get("nick"), "webchat"
      if not nick:
        return [False, "Nickname not supplied"]
        
      nick = nick[0]
      
      id = get_session_id()
      
      session = IRCSession(id)

      client = ircclient.createIRC(session, nick=nick, ident=ident, ip=ip, realname=nick)
      session.client = client
      
      Sessions[id] = session
      
      return [True, id]
          
    if path.startswith("/s/"):
      sessionid = path[3:]
      session = Sessions.get(sessionid)
      
      if not session:
        return [False, "Bad session ID"]

      session.subscribe(SingleUseChannel(request))
      return server.NOT_DONE_YET
    if path.startswith("/p/"):
      command = request.args.get("c")
      if not command:
        return [False, "No command specified"]

      command = command[0]
      
      sessionid = path[3:]
      session = Sessions.get(sessionid)
      if not session:
        return [False, "Bad session ID"]

      try:
        decoded = command.decode("utf-8")
      except UnicodeDecodeError:
        decoded = command.decode("iso-8859-1", "ignore")
      session.push(decoded)
      return [True]

    return [False, "404"]

