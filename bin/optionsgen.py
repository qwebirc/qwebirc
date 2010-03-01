import config
import qwebirc.util.qjson as json

def get_options():
  options = dict(networkName=config.NETWORK_NAME, networkServices=[config.AUTH_SERVICE], loginRegex=config.  AUTH_OK_REGEX, appTitle=config.APP_TITLE, baseURL=config.BASE_URL)
  return json.dumps(options)
