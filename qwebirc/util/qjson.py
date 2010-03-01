slow = True
try:
  # first try the system module
  import simplejson as json
  try:
    # try to see if the C module is available
    json._speedups
  except AttributeError:
    pass
  else:
    slow = False
except ImportError:
  # try python 2.6's json library as
  # it is 2x as fast as simplejson with no C
  try:
    import json
    json.dumps # we don't want the silly third party version
  except (ImportError, AttributeError):
    # fallback to the embedded
    import esimplejson as json
  
__SEPS = (',', ':')
dumps = lambda x: json.dumps(x, encoding="utf8", ensure_ascii=True, check_circular=False, indent=None, separators=__SEPS)
loads = lambda x: json.loads(x, encoding="utf8")
