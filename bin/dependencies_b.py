# this is separate to allow us to use python 2.5 syntax without
# the dependency checker breaking on earlier versions.

import sys
import subprocess
import os

def fail(*message):
  print("\n".join(message), file=sys.stderr)
  sys.exit(1)
  
def warn(*message):
  print("warning:", "\nwarning: ".join(message), "\n", file=sys.stderr)

def check_dependencies():
  i = 0

  check_zope()
  check_twisted()
  check_win32()
  i+=check_autobahn()
  i+=check_java()
  i+=check_git()
  
  print("0 errors, %d warnings." % i)
  
  if i == 0:
    print("looks like you've got everything you need to run qwebirc!")
  else:
    print("you can run qwebirc despite these.")

  f = open(".checked", "w")
  f.close()
  
def check_win32():
  if not sys.platform.startswith("win"):
    return
  
  try:
    import win32con
  except ImportError:
    fail("qwebirc requires pywin32, see:", "http://sourceforge.net/project/showfiles.php?group_id=78018")
  
def check_java():
  def java_warn(specific):
    warn(specific, "java is not required, but allows qwebirc to compress output,", "making it faster to download.", "you can get java at http://www.java.com/")
    
  try:
    p = subprocess.Popen(["java", "-version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=os.name == "nt")
    p.communicate()
    if p.wait() != 0:
      java_warn("something went wrong looking for java.")
      return 1
  except: # ugh
    java_warn("couldn't find java.")
    return 1
    
  return 0
  
def check_git():
  def git_warn(specific):
    warn(specific, "git is not required, but allows qwebirc to save bandwidth by versioning.")
    
  try:
    p = subprocess.Popen(["git", "rev-parse", "HEAD"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=os.name == "nt")
    p.communicate()
    if p.wait() != 0:
      git_warn("something went wrong looking for git.")
      return 1
  except: # ugh
    git_warn("couldn't find git.")
    return 1
    
  return 0
  
def check_zope():
  try:
    from zope.interface import Interface
  except ImportError:
    if sys.platform.startswith("win"):
      fail("qwebirc requires zope interface",
           "see pypi: http://pypi.python.org/pypi/zope.interface")
    else:
      fail("qwebirc requires zope interface.",
           "this should normally come with twisted, but can be downloaded",
           "from pypi: http://pypi.python.org/pypi/zope.interface")

def check_twisted():
  try:
    import twisted
  except ImportError:
    fail("qwebirc requires twisted (at least 8.2.0), see http://twistedmatrix.com/")

  def twisted_fail(x, y=None):
    fail("you don't seem to have twisted's %s module." % x,
         "your distro is most likely modular, look for a twisted %s package%s." % (x, " %s" % y if y else "",))

  try:
    import twisted.names
  except ImportError:
    twisted_fail("names")

  try:
    import twisted.mail
  except ImportError:
    twisted_fail("mail")

  try:
    import twisted.web
  except ImportError:
    twisted_fail("web", "(not web2)")

  try:
    import twisted.words
  except ImportError:
    twisted_fail("words")

def check_autobahn():
  import qwebirc.util.autobahn_check as autobahn_check
  v = autobahn_check.check()
  if v == True:
    return 0

  if v == False:
    warn("autobahn not installed; websocket support will be disabled.",
         "consider installing autobahn from:",
         "http://autobahn.ws/python/getstarted/")
    return 1

  warn("error loading autobahn: %s; websocket support will be disabled." % v,
       "consider installing/upgrading autobahn from:",
       "http://autobahn.ws/python/getstarted/")
  return 1

if __name__ == "__main__":
  from . import dependencies
  dependencies.check_dependencies()
