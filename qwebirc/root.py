from ajaxengine import AJAXEngine

from twisted.web import resource, server, static

class RootSite(resource.Resource):
  def getChild(self, name, request):
    if name == '':
      return self
      
    return Resource.getChild(self, name, request)
    
  def render_GET(self, request):
    return "Hi"
