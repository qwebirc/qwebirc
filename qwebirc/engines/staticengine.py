from twisted.web import resource, server, static, error
from qwebirc.util.gziprequest import GZipRequest
import qwebirc.util as util
import pprint
from adminengine import AdminEngineAction

# TODO, cache gzip stuff
cache = {}
def clear_cache():
  global cache
  cache = {}

def apply_gzip(request):
  accept_encoding = request.getHeader('accept-encoding')
  if accept_encoding:
    encodings = accept_encoding.split(',')
    for encoding in encodings:
      name = encoding.split(';')[0].strip()
      if name == 'gzip':
        request = GZipRequest(request)
  return request

class StaticEngine(static.File):
  isLeaf = False
  hit = util.HitCounter()
  
  def __init__(self, *args, **kwargs):
    static.File.__init__(self, *args, **kwargs)
    
  def render(self, request):
    self.hit(request)
    request = apply_gzip(request)
    return static.File.render(self, request)
    
  @property
  def adminEngine(self):
    return {
      #"GZip cache": [
        #("Contents: %s" % pprint.pformat(list(cache.keys())),)# AdminEngineAction("clear", d))
      #],
      "Hits": [
        (self.hit,),
      ]
    }

  def directoryListing(self):
    return error.ForbiddenResource()
