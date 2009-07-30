import os, sys, pages, subprocess, re, optionsgen, config

class HGException(Exception):
  pass
  
def jslist(name, debug):
  ui = pages.UIs[name]
  if debug:
    x = [pages.JS_BASE, ui.get("extra", []), pages.DEBUG, ["debug/ui/frontends/%s" % y for y in ui["uifiles"]]]
    hgid = ""
  else:
    #x = [pages.JS_BASE, ui.get("buildextra", ui.get("extra", [])), pages.BUILD_BASE, name]
    x = [name]
    hgid = "-" + gethgid()  
  
  return list("js/%s%s.js" % (y, hgid) for y in pages.flatten(x))

def csslist(name, debug, gen=False):
  ui = pages.UIs[name]
  nocss = ui.get("nocss")
  if not debug:
    return ["css/%s-%s.css" % (name, gethgid())]
  css = pages.flatten([ui.get("extracss", []), "colours", "dialogs"])
  if not nocss:
    css = list(css) + [name]
  return list("css/%s%s.css" % ("debug/" if gen else "", x) for x in css)

def _gethgid():
  try:
    p = subprocess.Popen(["hg", "id"], stdout=subprocess.PIPE)
  except Exception, e:
    if hasattr(e, "errno") and e.errno == 2:
      raise HGException, "unable to execute"
      
  data = p.communicate()[0]
  if p.wait() != 0:
    raise HGException, "unable to get id"
  return re.match("^([0-9a-f]+).*", data).group(1)

HGID = None
def gethgid():
  global HGID
  if HGID is None:
    try:
      HGID =  _gethgid()
    except HGException, e:
      print >>sys.stderr, "warning: hg: %s (using a random id)." % e
      HGID = os.urandom(10).encode("hex")
  return HGID
    
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
  <title>%s (qwebirc)</title>
  <meta http-equiv="Content-Type" content="text/html;charset=utf-8"/>
  <link rel="icon" type="image/png" href="images/favicon.png"/>
%s%s
%s
  <script type="text/javascript">
    var ui = new qwebirc.ui.Interface("ircui", qwebirc.ui.%s, %s);
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
""" % (ui["doctype"], config.APP_TITLE, csshtml, customjs, jshtml, ui["class"], optionsgen.get_options(), div)

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
  