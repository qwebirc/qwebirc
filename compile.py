#!/usr/bin/env python
import pagegen, os, subprocess

def jarit(src):
  return subprocess.Popen(["java", "-jar", "bin/yuicompressor-2.3.5.jar", src], stdout=subprocess.PIPE).communicate()[0]

def jmerge_files(output, files, *args):
  global copyright
  output = output + ".js"
  o = os.path.join("compiled", output)
  merge_files(o, files, *args)
  compiled = jarit(o)
  os.unlink(o)
  f = open(os.path.join("static", "js", output), "wb")
  f.write(copyright)
  f.write(compiled)
  f.close()
  
def merge_files(output, files, root_path=lambda x: x):
  f = open(output, "wb")

  for x in files:
    f2 = open(root_path(x), "rb")
    f.write(f2.read())
    f2.close()
  f.close()

def compile():  
  pagegen.main()

  try:
    os.mkdir("compiled")
  except:
    pass
  
  copyright = open("js/copyright.js", "rb").read()

  jmerge_files("qwebirc", pagegen.DEBUG_BASE, lambda x: os.path.join("js", x + ".js"))

  for uiname, value in pagegen.UIs.items():
    jmerge_files(uiname, value["uifiles"], lambda x: os.path.join("js", "ui", "frontends", x + ".js"))

  os.rmdir("compiled")
  
if __name__ == "__main__":
  compile()
  