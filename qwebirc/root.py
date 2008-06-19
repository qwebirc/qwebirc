from ajaxengine import AJAXEngine

from twisted.web import resource, server, static

class RootResource(resource.Resource):
  isLeaf = True
  def render_GET(self, request):
    return "moo"
    
class RootSite(server.Site):
  def __init__(self, path, *args, **kwargs):
    root = resource.Resource()
    server.Site.__init__(self, root, *args, **kwargs)
    
    root.putChild("", RootResource())
    root.putChild("e", AJAXEngine("/e"))
    root.putChild("static", static.File(path))
