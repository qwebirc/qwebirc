#!/usr/bin/env python
import pages, os, subprocess, pagegen

COPYRIGHT = open("js/copyright.js", "rb").read()

def jarit(src):
  return subprocess.Popen(["java", "-jar", "bin/yuicompressor-2.3.5.jar", src], stdout=subprocess.PIPE).communicate()[0]

def jmerge_files(prefix, suffix, output, files, *args):
  global COPYRIGHT
  output = output + "." + suffix
  o = os.path.join(prefix, "compiled", output)
  merge_files(o, files, *args)
  compiled = jarit(o)
  os.unlink(o)
  f = open(os.path.join(prefix, "static", suffix, output), "wb")
  f.write(COPYRIGHT)
  f.write(compiled)
  f.close()
  
def merge_files(output, files, root_path=lambda x: x):
  f = open(output, "wb")

  for x in files:
    f2 = open(root_path(x), "rb")
    f.write(f2.read())
    f2.close()
  f.close()

def main(outputdir=".", produce_debug=True):
  ID = pagegen.gethgid()
  
  pagegen.main(outputdir, produce_debug=produce_debug)

  coutputdir = os.path.join(outputdir, "compiled")
  try:
    os.mkdir(coutputdir)
  except:
    pass
    
  try:
    os.mkdir(os.path.join(outputdir, "static", "css"))
  except:
    pass
  
  #jmerge_files(outputdir, "js", "qwebirc", pages.DEBUG_BASE, lambda x: os.path.join("js", x + ".js"))

  for uiname, value in pages.UIs.items():
    csssrc = pagegen.csslist(uiname, True)
    jmerge_files(outputdir, "css", uiname + "-" + ID, csssrc)
    #jmerge_files(outputdir, "js", uiname, value["uifiles"], lambda x: os.path.join("js", "ui", "frontends", x + ".js"))
    
    alljs = []
    for y in pages.JS_BASE:
      alljs.append(os.path.join("static", "js", y + ".js"))
    for y in value.get("buildextra", []):
      alljs.append(os.path.join("static", "js", "%s.js" % y))
    for y in pages.DEBUG_BASE:
      alljs.append(os.path.join("js", y + ".js"))
    for y in value["uifiles"]:
      alljs.append(os.path.join("js", "ui", "frontends", y + ".js"))
    jmerge_files(outputdir, "js", uiname + "-" + ID, alljs)
    
  os.rmdir(coutputdir)
  
if __name__ == "__main__":
  main()
  