#!/usr/bin/env python

import bin.pages as pages, os, bin.cleanpyc as cleanpyc, glob
from bin.cleanpyc import tryunlink
  
for x in pages.UIs:
  for y in glob.glob(os.path.join("static", "js", "%s-*.js" % x)):
    tryunlink(y)
  for y in glob.glob(os.path.join("static", "css", "%s-*.css" % x)):
    tryunlink(y)
  tryunlink("static", "css", x + ".css")
  tryunlink("static", "%s.html" % x)
  tryunlink("static", "%sdebug.html" % x)  
  tryunlink(".checked")
  tryunlink(".compiled")
  tryunlink("bin", ".checked")
  tryunlink("bin", ".compiled")
  
if __name__ == "__main__":
  tryunlink("static", "js", "qwebirc.js")
  cleanpyc.main()
