#!/usr/bin/env python
import os

def tryunlink(*args):
  fn = os.path.join(*args)
  if os.path.exists(fn):
    os.unlink(fn)
    
def main():
  for root, dirs, files in os.walk("."):
    if ".hg" in dirs:
      dirs.remove(".hg")
    for x in files:
      if os.path.splitext(x)[-1] == ".pyc":
        tryunlink(root, x)

if __name__ == "__main__":
  main()