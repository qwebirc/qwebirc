import config
import json

def get_options():
  options = dict(
    networkName=config.NETWORK_NAME,
    networkServices=[config.AUTH_SERVICE],
    loginRegex=config.AUTH_OK_REGEX,
    appTitle=config.APP_TITLE,
    baseURL=config.BASE_URL,
    staticBaseURL=config.STATIC_BASE_URL,
    dynamicBaseURL=config.DYNAMIC_BASE_URL,
    dynamicConfiguration=False,
    validateNickname=False,
    customMenuItems=[]
  )
  
  if hasattr(config, "NICKNAME_VALIDATE") and config.NICKNAME_VALIDATE:
    options["nickValidation"] = dict(
      minLen=config.NICKNAME_MINIMUM_LENGTH,
      maxLen=config.NICKNAME_MAXIMUM_LENGTH,
      validFirstChar=config.NICKNAME_VALID_FIRST_CHAR,
      validSubChars=config.NICKNAME_VALID_SUBSEQUENT_CHARS
    )

  if hasattr(config, "HELP_URL") and config.HELP_URL:
    options["helpURL"] = config.HELP_URL

  if hasattr(config, "LOGO_URL"):
    options["logoURL"] = config.LOGO_URL

  if hasattr(config, "CUSTOM_MENU_ITEMS"):
    options["customMenuItems"] = config.CUSTOM_MENU_ITEMS

  if hasattr(config, "ACCOUNT_WHOIS_COMMAND") and config.ACCOUNT_WHOIS_COMMAND:
    options["accountWhoisCommand"] = config.ACCOUNT_WHOIS_COMMAND

  if hasattr(config, "DYNAMIC_CONFIGURATION") and config.DYNAMIC_CONFIGURATION:
    options["dynamicConfiguration"] = True

  return json.dumps(options)
