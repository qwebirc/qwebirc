import os, sys

IRC_BASE = ["ircconnection", "irclib", "numerics", "baseircclient", "irctracker", "commandparser", "commands", "ircclient", "commandhistory"]
UI_BASE = ["baseui", "baseuiwindow", "colour", "url", "theme", "hilightcontroller", "menuitems", "tabcompleter", "panes/connect", "panes/embed", "panes/options", "panes/about", "panes/privacypolicy", "panes/feedback"]

DEBUG_BASE = ["qwebirc", "version", "jslib", "crypto", "md5", ["irc/%s" % x for x in IRC_BASE], ["ui/%s" % x for x in UI_BASE], "qwebircinterface", "auth", "sound"]
BUILD_BASE = ["qwebirc"]
JS_BASE = ["mootools-1.2.1-core"]

UIs = {
  "qui": {
    "class": "QUI",
    "uifiles": ["qui"],
    "extra": ["mootools-1.2-more"],
    "buildextra": ["mootools-1.2-more"],
    "doctype": "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\"" + "\n" \
      "  \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\">"
  },
  "mochaui": {
    "class": "MochaUI",
    "uifiles": ["mochaui"],
    "extra": ["mootools-1.2-more", "mochaui/mocha"],
    "buildextra": ["mootools-1.2-more", "mochaui/mocha-compressed"],
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
    "uifiles": ["swmui", "swmuilayout"],
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
  
DEBUG = ["debug/%s" % x for x in flatten(DEBUG_BASE)]

def jslist(name, debug):
  ui = UIs[name]
  if debug:
    x = [JS_BASE, ui.get("extra", []), DEBUG, ["debug/ui/frontends/%s" % y for y in ui["uifiles"]]]
  else:
    x = [JS_BASE, ui.get("buildextra", ui.get("extra", [])), BUILD_BASE, name]
    
  return list("js/%s.js" % y for y in flatten(x))

def csslist(name):
  ui = UIs[name]
  return list("css/%s.css" % x for x in flatten([ui.get("extracss", []), "colours", "dialogs", "%s" % name]))

def producehtml(name, debug):
  ui = UIs[name]
  js = jslist(name, debug)
  css = csslist(name)
  
  csshtml = "\n".join("  <link rel=\"stylesheet\" href=\"%s\" type=\"text/css\"/>" % x for x in css)
  jshtml = "\n".join("  <script type=\"text/javascript\" src=\"%s\"></script>" % x for x in js)

  div = ui.get("div", "")
  customjs = ui.get("customjs", "")

  return """%s
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
<head>
  <title>QuakeNet Web IRC</title>
  <meta http-equiv="Content-Type" content="text/html;charset=utf-8"/>
  <link rel="icon" type="image/png" href="images/favicon.png"/>
%s%s
%s
  <script type="text/javascript">
    var ui = new qwebirc.ui.Interface("ircui", qwebirc.ui.%s);
  </script>
</head>
<body>
  <div id="ircui">
    <noscript>
      <div id="noscript">Javascript is required to use IRC.</div>
    </noscript>%s
  </div>
</body>
</html>
""" % (ui["doctype"], csshtml, customjs, jshtml, ui["class"], div)

def main():
  p = os.path.join(os.path.abspath(os.path.split(sys.argv[0])[0]), "static")
  for x in UIs:
    f = open(os.path.join(p, "%sdebug.html" % x), "wb")
    try:
      f.write(producehtml(x, debug=True))
    finally:
      f.close()
      
    f = open(os.path.join(p, "%s.html" % x), "wb")
    try:
      f.write(producehtml(x, debug=False))
    finally:
      f.close()

if __name__ == "__main__":
  main()
  