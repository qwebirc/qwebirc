IDENT_HEX = object()
IDENT_NICKNAME = object()
WEBIRC_REALNAME = object()

def get(name, default=None):
  import config
  if hasattr(config, name):
    return getattr(config, name)
  return default
