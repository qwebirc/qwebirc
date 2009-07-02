from twisted.web import resource, server, static, http
from twisted.internet import error, reactor
import engines
import mimetypes
import config
import sigdebug

class RootResource(resource.Resource):
  def getChild(self, name, request):
    if name == "":
      name = "qui.html"
    return self.primaryChild.getChild(name, request)

# we do NOT use the built-in timeOut mixin as it's very very buggy!
class TimeoutHTTPChannel(http.HTTPChannel):
  timeout = config.HTTP_REQUEST_TIMEOUT

  def connectionMade(self):
    self.customTimeout = reactor.callLater(self.timeout, self.timeoutOccured)
    http.HTTPChannel.connectionMade(self)
    
  def timeoutOccured(self):
    self.customTimeout = None
    self.transport.loseConnection()
    
  def cancelTimeout(self):
    if self.customTimeout is not None:
      try:
        self.customTimeout.cancel()
        self.customTimeout = None
      except error.AlreadyCalled:
        pass

  def connectionLost(self, reason):
    self.cancelTimeout()
    http.HTTPChannel.connectionLost(self, reason)

class RootSite(server.Site):
  # we do this ourselves as the built in timeout stuff is really really buggy
  protocol = TimeoutHTTPChannel
  
  def __init__(self, path, *args, **kwargs):
    root = RootResource()
    server.Site.__init__(self, root, *args, **kwargs)

    services = {}
    services["StaticEngine"] = root.primaryChild = engines.StaticEngine(path)

    def register(service, path, *args, **kwargs):
      sobj = service("/" + path, *args, **kwargs)
      services[service.__name__] = sobj
      root.putChild(path, sobj)
      
    register(engines.AJAXEngine, "e")
    register(engines.FeedbackEngine, "feedback")
    register(engines.AuthgateEngine, "auth")
    register(engines.AdminEngine, "adminengine", services)
    
mimetypes.types_map[".ico"] = "image/vnd.microsoft.icon"
