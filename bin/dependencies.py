import sys

def check_dependencies():
  def fail(message):
    sys.stderr.write(message + "\n")
    sys.stderr.flush()
    sys.exit(1)
    
  major, minor = sys.version_info[:2]
  if major >= 3:
    fail("qwebirc cannot run on python >=3 yet, install python 2.6.X:\nhttp://www.python.org/download/")
    
  if major < 2 or minor < 5:
    fail("qwebirc requires python 2.5, you have: %s, install python 2.6.X:\nhttp://www.python.org/download/" % ".".join(map(str, sys.version_info[:3])))
	
  # this is done so we can use Python 2.5 syntax...
  import dependencies_b
  dependencies_b.check_dependencies()

def has_checked():
  try:
    f = open(".checked", "r")
    f.close()
    return True
  except:
    pass
    
  try:
    f = open(os.path.join("bin", ".checked"), "r")
    f.close()
    return True
  except:
    pass
  
  return False
  
def vcheck():
  if not has_checked():
    sys.stderr.write("first run, checking dependencies...\n")
    sys.stderr.flush()
    check_dependencies()

if __name__ == "__main__":
  check_dependencies()
  