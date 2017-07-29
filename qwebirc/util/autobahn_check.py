# at 0.18.2 the project switched to 17.5.1, so this is correct
MINIMUM_VERSION = 0, 17, 2

import config

def check():
  try:
    import autobahn
    import autobahn.twisted.websocket
    import autobahn.twisted.resource
  except ImportError:
    return False

  x = autobahn.version.split(".")
  if len(x) != 3:
    return "unable to parse autobahn version: %r" % autobahn.version

  major, minor, veryminor = int(x[0]), int(x[1]), int(x[2])
  if major > MINIMUM_VERSION[0]:
    pass # ok
  elif minor > MINIMUM_VERSION[1]:
    pass # ok
  elif veryminor >= MINIMUM_VERSION[2]:
    pass # ok
  elif hasattr(config, "FORCE_AUTOBAHN"):
    pass # ok
  else:
    return "your version of autobahn (v%d.%d.%d) is too old, the minimum is v%d.%d.%d" % tuple([major, minor, veryminor] + list(MINIMUM_VERSION))

  return True
