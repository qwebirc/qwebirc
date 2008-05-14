from twisted.web import resource, server, static

class AJAXEngine(resource.Resource):
  def render_GET(self, request):        
    return "AJAX page"
