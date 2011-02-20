import config
import qwebirc.util.qjson as json

def get_options():
  options = dict(
    networkName=config.NETWORK_NAME,
    networkServices=[config.AUTH_SERVICE],
    loginRegex=config.AUTH_OK_REGEX,
    appTitle=config.APP_TITLE,
    baseURL=config.BASE_URL,
    staticBaseURL=config.STATIC_BASE_URL,
    dynamicBaseURL=config.DYNAMIC_BASE_URL,
    validateNickname=False
  )
  
  if hasattr(config, "NICKNAME_VALIDATE") and config.NICKNAME_VALIDATE:
    options["nickValidation"] = dict(
      minLen=config.NICKNAME_MINIMUM_LENGTH,
      maxLen=config.NICKNAME_MAXIMUM_LENGTH,
      validFirstChar=config.NICKNAME_VALID_FIRST_CHAR,
      validSubChars=config.NICKNAME_VALID_SUBSEQUENT_CHARS
    )
    
  return json.dumps(options)
