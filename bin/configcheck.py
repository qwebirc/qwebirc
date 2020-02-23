import sys

try:
  import config
except ImportError:
  print >>sys.stderr, "No config found.\nCopy config.py.example to config.py and then edit it to meet your needs."
  sys.exit(1)


