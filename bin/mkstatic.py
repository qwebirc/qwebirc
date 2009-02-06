#!/usr/bin/env python
import compile, pages, sys, os, shutil, compileall

def trymkdir(*dir):
  try:
    os.mkdir(os.path.join(*dir))
  except:
    pass

def copywalk(src, dest, visitor):
  for root, dirs, files in os.walk(src):
    if ".hg" in dirs:
      dirs.remove(".hg")
      
    newdir = os.path.join(dest, root)
    if not os.path.exists(newdir):
      os.mkdir(newdir)
    for file in files:
      if not visitor(file):
        continue
        
      destfile = os.path.join(dest, root, file)
      dir, _ = os.path.split(destfile)
      if not os.path.exists(dir):
        os.mkdir(dir)
      shutil.copy2(os.path.join(root, file), destfile)
        
def copypydir(src, dest):
  copywalk(src, dest, lambda file: os.path.splitext(file)[1] == ".py")

def copypycdir(src, dest):
  copywalk(src, dest, lambda file: os.path.splitext(file)[1] == ".py")

def copydir(src, dest):
  copywalk(src, dest, lambda file: os.path.splitext(file)[1] != ".pyc")
  
def copy(src, dest, nojoin=0):
  if not nojoin:
    dest = os.path.join(dest, src)
  shutil.copy2(src, dest)

def compile_python(dest):
  compileall.compile_dir(dest, quiet=1, force=1)
  
def remove_python(dest, ignore=[]):
  ignore = set(ignore)
  for root, dirs, files in os.walk(dest):
    for file in files:
      if file in ignore:
        continue
      if os.path.splitext(file)[1] == ".py":
        rfile = os.path.join(root, file)
        os.unlink(rfile)
        
def main():
  if len(sys.argv) < 2:
    print >>sys.stderr, "syntax: %s [destination directory]" % sys.argv[0]
    sys.exit(0)
  DEST = sys.argv[1]
  
  trymkdir(DEST)
  trymkdir(DEST, "static")
  trymkdir(DEST, "static", "js")
    
  compile.main(DEST, produce_debug=False)
  
  for x in "authgate qwebirc simplejson twisted".split(" "):
    copypydir(x, DEST)
  for x in "images panes sound".split(" "):
    copydir(os.path.join("static", x), DEST)
  for x in pages.JS_EXTRA:
    copy(os.path.join("static", "js", x + ".js"), DEST)
    
  for x in pages.UIs.values():
    e = x.get("extrajs")
    if e is None:
      continue
    for x2 in e:
      file = os.path.join("static", "js", "%s.js" % x2)
      destfile = os.path.join(DEST, file)
      dir, _ = os.path.split(destfile)
      if not os.path.exists(dir):
        os.mkdir(dir)
      copy(file, DEST)
      
  copy(os.path.join("static/favicon.ico"), DEST)
  
  if 0:
    compile_python(DEST)
    remove_python(DEST)
  else:
    copy(os.path.join("bin", "cleanpyc.py"), os.path.join(DEST, "cleanpyc.py"), nojoin=1)
    
  copy("run.py", DEST)
  copy("config.py.example", DEST)
  
  if os.path.exists("config.py"):
    print "NOT copying current config.py!"
    #copy("config.py", DEST)
  
if __name__ == "__main__":
  main()
  