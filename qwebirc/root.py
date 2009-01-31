import engines
from twisted.web import resource, server, static
import mimetypes

class RootResource(resource.Resource):
  def getChild(self, name, request):
    if name == "":
      name = "qui.html"
    return self.primaryChild.getChild(name, request)

class RootSite(server.Site):
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
