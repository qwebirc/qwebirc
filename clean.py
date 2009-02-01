#!/usr/bin/env python

import pages, os, cleanpyc
from cleanpyc import tryunlink
  
for x in pages.UIs:
  tryunlink("static", "%s.html" % x)
  tryunlink("static", "%sdebug.html" % x)  
  tryunlink("static", "js", "%s.js" % x)

if __name__ == "__main__":
  tryunlink("static", "js", "qwebirc.js")
  cleanpyc.main()
