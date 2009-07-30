#!/usr/bin/env python
IRC_BASE = ["ircconnection", "irclib", "numerics", "baseircclient", "irctracker", "commandparser", "commands", "ircclient", "commandhistory"]
PANES = ["connect", "embed", "options", "about", "privacypolicy", "feedback", "faq"]
UI_BASE = ["menuitems", "baseui", "baseuiwindow", "colour", "url", "theme", "notifications", "tabcompleter", "style"]
UI_BASE.extend(["panes/%s" % x for x in PANES])

DEBUG_BASE = ["qwebirc", "version", "jslib", "crypto", "md5", ["irc/%s" % x for x in IRC_BASE], ["ui/%s" % x for x in UI_BASE], "qwebircinterface", "auth", "sound"]
BUILD_BASE = ["qwebirc"]
JS_BASE = ["mootools-1.2.1-core", "mootools-1.2-more"]
JS_EXTRA = ["soundmanager2"]

UIs = {
  "qui": {
    "class": "QUI",
    "nocss": True,
    "uifiles": ["qui"],
    "doctype": "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\"" + "\n" \
      "  \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\">"
  },
  "mochaui": {
    "class": "MochaUI",
    "uifiles": ["mochaui"],
    "extra": ["mochaui/mocha"],
    "buildextra": ["mochaui/mocha-compressed"],
    "extrajs": ["mochaui/excanvas-compressed"],
    "doctype": "<!DOCTYPE HTML PUBLIC \"-//W3C//DTD HTML 4.01//EN\" \"http://www.w3.org/TR/html4/strict.dtd\">",
    "div": """
    <div id="desktop">
      <div id="dockWrapper">
        <div id="dock">
          <div id="dockPlacement"></div>
          <div id="dockAutoHide"></div>
          <div id="dockSort"><div id="dockClear" class="clear"></div></div>
        </div>
      </div>	
      <div id="pageWrapper"></div>
    </div>""",
    "extracss": ["mochaui/ui", "mochaui/content"],
    "customjs": """
  <!--[if IE]>
    <script type="text/javascript" src="js/mochaui/excanvas-compressed.js"></script>		
  <![endif]-->"""
  },
  "swmui": {
    "class": "SWMUI",
    "uifiles": ["swmui", "swmlayout"],
    "doctype": "<!DOCTYPE HTML PUBLIC \"-//W3C//DTD HTML 4.01//EN\" \"http://www.w3.org/TR/html4/strict.dtd\">"
  },
  "uglyui": {
    "class": "UglyUI",
    "uifiles": ["uglyui"],
    "doctype": "<!DOCTYPE HTML PUBLIC \"-//W3C//DTD HTML 4.01//EN\" \"http://www.w3.org/TR/html4/strict.dtd\">"
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
