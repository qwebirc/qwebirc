from authgate import twisted as authgate
from twisted.web import resource, server, static
import config, urlparse, urllib

class AuthgateEngine(resource.Resource):
  isLeaf = True
  
  def __init__(self, prefix):
    self.__prefix = prefix
    
  def deleteCookie(self, request, key):
    request.addCookie(key, "", path="/", expires="Sat, 29 Jun 1996 01:44:48 GMT")
    
  def render_GET(self, request):
    if request.args.get("logout"):
      self.deleteCookie(request, "user")
      
    a = authgate(request, config.AUTHGATEDOMAIN)
    try:
      ticket = a.login_required(accepting=lambda x: True)
    except a.redirect_exception, e:
      pass
    else:
      # only used for informational purposes, the backend stores this seperately
      # so if the user changes it just their front end will be messed up!
      request.addCookie("user", ticket.username, path="/")
      
      location = request.getCookie("redirect")
      if location is None:
        location = "/"
      else:
        self.deleteCookie(request, "redirect")
        _, _, path, params, query, _ = urlparse.urlparse(urllib.unquote(location))
        location = urlparse.urlunparse(("", "", path, params, query, ""))

      request.redirect(location)
      request.finish()
      
    return server.NOT_DONE_YET
    
def getSessionData(request):
  return authgate.get_session_data(request)
  
def login_optional(request):
  return authgate(request, config.AUTHGATEDOMAIN).login_optional()
 