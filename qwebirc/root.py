from twisted.protocols.policies import TimeoutMixin
from twisted.web import resource, server, static, http
from twisted.internet import error, reactor
from . import engines
import mimetypes
import config
from . import sigdebug
import re

class RootResource(resource.Resource):
  def getChild(self, name, request):
    if name == b"":
      name = b"qui.html"
    return self.primaryChild.getChild(name, request)

class WrappedRequest(server.Request):
  ip_re = re.compile(r"^((25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2})[.](25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2})[.](25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2})[.](25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2})|(::|(([a-fA-F0-9]{1,4}):){7}(([a-fA-F0-9]{1,4}))|(:(:([a-fA-F0-9]{1,4})){1,6})|((([a-fA-F0-9]{1,4}):){1,6}:)|((([a-fA-F0-9]{1,4}):)(:([a-fA-F0-9]{1,4})){1,6})|((([a-fA-F0-9]{1,4}):){2}(:([a-fA-F0-9]{1,4})){1,5})|((([a-fA-F0-9]{1,4}):){3}(:([a-fA-F0-9]{1,4})){1,4})|((([a-fA-F0-9]{1,4}):){4}(:([a-fA-F0-9]{1,4})){1,3})|((([a-fA-F0-9]{1,4}):){5}(:([a-fA-F0-9]{1,4})){1,2})))$", re.IGNORECASE)
  def validIP(self, ip):
    m = self.ip_re.match(ip)
    if m is None:
      return False
    return True
    
  def _getClientIP(self):
    # twisted.web.http.Request.getClientIP returns None if not IPv4;
    # client.host has the real address

    if not hasattr(self, "client") or not hasattr(self.client, "host"):
        return None

    real_ip = self.client.host

    if real_ip[:7] == "::ffff:":
      real_ip = real_ip[7:]

    if not hasattr(config, "FORWARDED_FOR_HEADER"):
      return real_ip

    if real_ip not in config.FORWARDED_FOR_IPS:
      return real_ip
      
    fake_ips = self.getHeader(config.FORWARDED_FOR_HEADER)
    if fake_ips is None:
      return real_ip
      
    fake_ip = fake_ips.split(",")[-1].strip()
    if not self.validIP(fake_ip):
      return real_ip
      
    return fake_ip

  def getClientIP(self):
    ip = self._getClientIP()

    if ip is None:
      return None

    # make absolutely sure that the address doesn't start with : before we
    # try to use it as a string to the IRC server!
    return ip.lstrip(":")

class HTTPChannel(http.HTTPChannel):
  def timeoutConnection(self):
    self.transport.abortConnection()

class RootSite(server.Site):
  protocol = HTTPChannel

  requestFactory = WrappedRequest

  def __init__(self, path, *args, **kwargs):
    root = RootResource()
    kwargs["timeout"] = config.HTTP_REQUEST_TIMEOUT
    server.Site.__init__(self, root, *args, **kwargs)
    services = {}
    services["StaticEngine"] = root.primaryChild = engines.StaticEngine(path)

    def register(service, path, *args, **kwargs):
      sobj = service(b"/" + path, *args, **kwargs)
      services[service.__name__] = sobj
      root.putChild(path, sobj)
      
    register(engines.AJAXEngine, b"e")
    try:
      register(engines.WebSocketEngine, b"w")
    except AttributeError:
      pass
    register(engines.AuthgateEngine, b"auth")
    register(engines.AdminEngine, b"adminengine", services)
    
mimetypes.types_map[".ico"] = "image/vnd.microsoft.icon"
