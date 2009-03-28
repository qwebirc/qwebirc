import config, simplejson

def get_options():
  options = dict(networkName=config.NETWORK_NAME, networkServices=[config.AUTH_SERVICE], loginRegex=config.  AUTH_OK_REGEX, appTitle=config.APP_TITLE)
  return simplejson.dumps(options)
