from twisted.web import resource, server, static
import config, urlparse, urllib, hashlib, re
import qwebirc.util.rijndael, qwebirc.util.ciphers
import qwebirc.util

authgate = config.AUTHGATEPROVIDER.twisted
BLOCK_SIZE = 128/8

class AuthgateEngine(resource.Resource):
  isLeaf = True
  
  def __init__(self, prefix):
    self.__prefix = prefix
    self.__hit = qwebirc.util.HitCounter()
    
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

      qt = ticket.get("qticket")
      if not qt is None:
        getSessionData(request)["qticket"] = decodeQTicket(qt)
      
      self.__hit()
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
  
  @property  
  def adminEngine(self):
    return dict(Logins=((self.__hit,),))
    
def decodeQTicket(qticket, p=re.compile("\x00*$"), cipher=qwebirc.util.rijndael.rijndael(hashlib.sha256(config.QTICKETKEY).digest()[:16])):
  def decrypt(data):
    l = len(data)
    if l < BLOCK_SIZE * 2 or l % BLOCK_SIZE != 0:
      raise Exception("Bad qticket.")
    
    iv, data = data[:16], data[16:]
    cbc = qwebirc.util.ciphers.CBC(cipher, iv)
  
    # technically this is a flawed padding algorithm as it allows chopping at BLOCK_SIZE, we don't
    # care about that though!
    b = range(0, l-BLOCK_SIZE, BLOCK_SIZE)
    for i, v in enumerate(b):
      q = cbc.decrypt(data[v:v+BLOCK_SIZE])
      if i == len(b) - 1:
        yield re.sub(p, "", q)
      else:
        yield q
  return "".join(decrypt(qticket))
  
def getSessionData(request):
  return authgate.get_session_data(request)
  
def login_optional(request):
  return authgate(request, config.AUTHGATEDOMAIN).login_optional()
 