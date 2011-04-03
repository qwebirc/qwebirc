#!/usr/bin/env python
IRC_BASE = ["ircconnection", "irclib", "numerics", "baseircclient", "irctracker", "commandparser", "commands", "ircclient", "commandhistory", "nicknamevalidator"]
PANES = ["connect", "embed", "options", "about", "privacypolicy", "feedback", "faq"]
UI_BASE = ["menuitems", "baseui", "baseuiwindow", "colour", "url", "theme", "notifications", "tabcompleter", "style"]
UI_BASE.extend(["panes/%s" % x for x in PANES])

DEBUG_BASE = ["qwebirc", "version", "jslib", "crypto", "md5", ["irc/%s" % x for x in IRC_BASE], ["ui/%s" % x for x in UI_BASE], "qwebircinterface", "auth", "sound"]
BUILD_BASE = ["qwebirc"]
JS_BASE = ["mootools-1.2.5-core", "mootools-1.2.5.1-more"]
JS_EXTRA = ["soundmanager2"]

UIs = {
  "qui": {
    "class": "QUI",
    "nocss": True,
    "uifiles": ["qui"],
    "doctype": "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\"" + "\n" \
      "  \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\">"
  }
}

def flatten(y):
  for x in y:
    if isinstance(x, list):
      for x in flatten(x):
        yield x
    else:
      yield x

DEBUG_BASE = list(flatten(DEBUG_BASE))
DEBUG = ["debug/%s" % x for x in DEBUG_BASE]
