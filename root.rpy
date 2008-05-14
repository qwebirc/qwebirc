import sys

if sys.path[0] != ".":
  sys.path.insert(0, ".")

import qwebirc
from twisted.web import resource, static

resource = static.File("static")
resource.putChild("ajax", qwebirc.AJAXEngine())