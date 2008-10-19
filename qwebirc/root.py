from ajaxengine import AJAXEngine
import mimetypes
from twisted.web import resource, server, static

class RootResource(resource.Resource):
  def getChild(self, name, request):
    if name == "":
      name = "qui.html"
    return self.primaryChild.getChild(name, request)

class RootSite(server.Site):
  def __init__(self, path, *args, **kwargs):
    root = RootResource()
    server.Site.__init__(self, root, *args, **kwargs)

    root.primaryChild = static.File(path)
    root.putChild("e", AJAXEngine("/e"))

mimetypes.types_map[".ico"] = "image/vnd.microsoft.icon"

