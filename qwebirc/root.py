from twisted.web import resource, server, static, http
from twisted.internet import error, reactor
import engines
import mimetypes
import config
import sigdebug
import re

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

class ProxyRequest(server.Request):
  ip_re = re.compile(r"^((25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2})[.](25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2})[.](25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2})[.](25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2})|(::|(([a-fA-F0-9]{1,4}):){7}(([a-fA-F0-9]{1,4}))|(:(:([a-fA-F0-9]{1,4})){1,6})|((([a-fA-F0-9]{1,4}):){1,6}:)|((([a-fA-F0-9]{1,4}):)(:([a-fA-F0-9]{1,4})){1,6})|((([a-fA-F0-9]{1,4}):){2}(:([a-fA-F0-9]{1,4})){1,5})|((([a-fA-F0-9]{1,4}):){3}(:([a-fA-F0-9]{1,4})){1,4})|((([a-fA-F0-9]{1,4}):){4}(:([a-fA-F0-9]{1,4})){1,3})|((([a-fA-F0-9]{1,4}):){5}(:([a-fA-F0-9]{1,4})){1,2})))$", re.IGNORECASE)
  def validIP(self, ip):
    m = self.ip_re.match(ip)
    if m is None:
      return False
    return True
    
  def getClientIP(self):
    real_ip = http.Request.getClientIP(self)
    if real_ip not in config.FORWARDED_FOR_IPS:
      return real_ip
      
    fake_ips = self.getHeader(config.FORWARDED_FOR_HEADER)
    if fake_ips is None:
      return real_ip
      
    fake_ip = fake_ips.split(",")[-1].strip()
    if not self.validIP(fake_ip):
      return real_ip
      
    return fake_ip
    
class RootSite(server.Site):
  # we do this ourselves as the built in timeout stuff is really really buggy
  protocol = TimeoutHTTPChannel
  
  if hasattr(config, "FORWARDED_FOR_HEADER"):
    requestFactory = ProxyRequest

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
