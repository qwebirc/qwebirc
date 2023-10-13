from . import pages, optionsgen
import os, sys, subprocess, re, config

class GitException(Exception):
  pass
  
def jslist(name, debug):
  ui = pages.UIs[name]
  if debug:
    x = [pages.JS_DEBUG_BASE, ui.get("extra", []), pages.DEBUG, ["debug/ui/frontends/%s" % y for y in ui["uifiles"]]]
    gitid = ""
  else:
    #x = [pages.JS_BASE, ui.get("buildextra", ui.get("extra", [])), pages.BUILD_BASE, name]
    x = [pages.JS_RAW_BASE, name]
    gitid = "-" + getgitid()  

  l = []
  for url in pages.flatten(x):
    if isinstance(url, tuple):
      url, digest = url
    else:
      digest = None
    l.append((url if url.startswith("//") else "js/%s%s.js" % (url, gitid), digest))
  return l

def csslist(name, debug, gen=False):
  ui = pages.UIs[name]
  nocss = ui.get("nocss")
  if not debug:
    return ["css/%s-%s.css" % (name, getgitid())]
  css = list(pages.flatten([ui.get("extracss", []), "colours", "dialogs"]))
  if not nocss:
    css+=[name]
  css = ["%s.css" % x for x in css]
  if hasattr(config, "CUSTOM_CSS"):
    css+=[config.CUSTOM_CSS]
  return list("css/%s%s" % ("debug/" if gen else "", x) for x in css)

def _getgitid():
  try:
    p = subprocess.Popen(["git", "rev-parse", "HEAD"], stdout=subprocess.PIPE, shell=os.name == "nt")
  except Exception as e:
    if hasattr(e, "errno") and e.errno == 2:
      raise GitException("unable to execute")
    raise GitException("unknown exception running git: %s" % repr(e))
    
  data = p.communicate()[0].decode()
  if p.wait() != 0:
    raise GitException("unable to get id")
  return re.match("^([0-9a-f]+).*", data).group(1)

GITID = None
def getgitid():
  global GITID
  if GITID is None:
    try:
      GITID =  _getgitid()
    except GitException as e:
      print("warning: git: %s (using a random id)." % e, file=sys.stderr)
      GITID = os.urandom(10).encode("hex")
  return GITID
    
def producehtml(name, debug):
  ui = pages.UIs[name]
  js = jslist(name, debug)
  css = csslist(name, debug, gen=True)
  csshtml = "\n".join("  <link rel=\"stylesheet\" href=\"%s%s\" type=\"text/css\"/>" % (config.STATIC_BASE_URL, x) for x in css)

  def toscript(url, digest):
    if digest:
      subresource_int = " integrity=\"%s\" crossorigin=\"anonymous\"" % digest
    else:
      subresource_int = ""
    return "  <script type=\"text/javascript\" src=\"%s%s\"%s></script>" % ("" if url.startswith("//") else config.STATIC_BASE_URL, url, subresource_int)

  jshtml = "\n".join(toscript(*x) for x in js)

  if hasattr(config, "ANALYTICS_HTML"):
    jshtml+="\n" + config.ANALYTICS_HTML

  div = ui.get("div", "")
  customjs = ui.get("customjs", "")

  return """%s
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
<head>
  <base />
  <title>%s (qwebirc)</title>
  <meta http-equiv="Content-Type" content="text/html;charset=utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=0" />
  <meta name="mobile-web-app-capable" content="yes" />
  <link rel="icon" sizes="192x192" href="%simages/highresicon.png"/>
  <link rel="shortcut icon" type="image/png" href="%simages/favicon.png"/>
%s<script type="text/javascript">QWEBIRC_DEBUG=%s;</script>%s
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
""" % (ui["doctype"], config.APP_TITLE, config.STATIC_BASE_URL, config.STATIC_BASE_URL, csshtml, debug and "true" or "false", customjs, jshtml, ui["class"], optionsgen.get_options(), div)

def main(outputdir=".", produce_debug=True):
  p = os.path.join(outputdir, "static")
  for x in pages.UIs:
    if produce_debug:
      f = open(os.path.join(p, "%sdebug.html" % x), "w")
      try:
        f.write(producehtml(x, debug=True))
      finally:
        f.close()
      
    f = open(os.path.join(p, "%s.html" % x), "w")
    try:
      f.write(producehtml(x, debug=False))
    finally:
      f.close()

if __name__ == "__main__":
  main()
  
