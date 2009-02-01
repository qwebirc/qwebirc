#!/usr/bin/env python
import pages, os, subprocess, pagegen

COPYRIGHT = open("js/copyright.js", "rb").read()

def jarit(src):
  return subprocess.Popen(["java", "-jar", "bin/yuicompressor-2.3.5.jar", src], stdout=subprocess.PIPE).communicate()[0]

def jmerge_files(prefix, output, files, *args):
  global COPYRIGHT
  output = output + ".js"
  o = os.path.join(prefix, "compiled", output)
  merge_files(o, files, *args)
  compiled = jarit(o)
  os.unlink(o)
  f = open(os.path.join(prefix, "static", "js", output), "wb")
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

def main(outputdir="."):
  pagegen.main(outputdir)

  coutputdir = os.path.join(outputdir, "compiled")
  try:
    os.mkdir(coutputdir)
  except:
    pass
  
  jmerge_files(outputdir, "qwebirc", pages.DEBUG_BASE, lambda x: os.path.join("js", x + ".js"))

  for uiname, value in pages.UIs.items():
    jmerge_files(outputdir, uiname, value["uifiles"], lambda x: os.path.join("js", "ui", "frontends", x + ".js"))

  os.rmdir(coutputdir)
  
if __name__ == "__main__":
  main()
  