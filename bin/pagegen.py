import os, sys, pages

def jslist(name, debug):
  ui = pages.UIs[name]
  if debug:
    x = [pages.JS_BASE, ui.get("extra", []), pages.DEBUG, ["debug/ui/frontends/%s" % y for y in ui["uifiles"]]]
  else:
    #x = [pages.JS_BASE, ui.get("buildextra", ui.get("extra", [])), pages.BUILD_BASE, name]
    x = [name]
    
  return list("js/%s.js" % y for y in pages.flatten(x))

def csslist(name, debug, gen=False):
  if not debug:
    return ["css/%s.css" % name]
  ui = pages.UIs[name]
  return list("css/%s%s.css" % ("debug/" if gen else "", x) for x in pages.flatten([ui.get("extracss", []), "colours", "dialogs", "%s" % name]))

def producehtml(name, debug):
  ui = pages.UIs[name]
  js = jslist(name, debug)
  css = csslist(name, debug, gen=True)
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

def main(outputdir=".", produce_debug=True):
  p = os.path.join(outputdir, "static")
  for x in pages.UIs:
    if produce_debug:
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
  