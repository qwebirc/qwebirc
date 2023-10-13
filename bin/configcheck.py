import sys

try:
  import config
except ImportError:
  print("No config found.\nCopy config.py.example to config.py and then edit it to meet your needs.", file=sys.stderr)
  sys.exit(1)


