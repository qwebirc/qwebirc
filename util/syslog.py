"""
Limited drop in replacement for the syslog module.
To use this symlink it into your PYTHONPATH.
"""

from twisted.internet.protocol import DatagramProtocol
import os

from config import SYSLOG_ADDR as ADDR
IDENT = "syslog"

protocol, opened = None, False

class __SyslogProtocol(DatagramProtocol):
  def __init__(self):
    self.pid = os.getpid() # FORK WARNING

  def send(self, data):
    if self.transport is None: # oh well, it's UDP =)
      return
    self.transport.write(b"<1> %s[%d]: %s\n" % (self.ident, self.pid, data.encode()), ADDR)

  def close(self):
    if self.transport is None:
      return
    self.transport.stopListening()

def __open_protocol():
  global opened

  if opened:
    return

  opened = True
  from twisted.internet import reactor
  reactor.listenUDP(0, protocol)

def __build_protocol(ident=IDENT):
  global protocol

  if protocol is not None:
    return

  protocol = __SyslogProtocol()
  protocol.ident = ident.encode()

def syslog(data):
  __build_protocol()
  __open_protocol()
  protocol.send(data)

def openlog(ident, logopt=None, facility=None):
  __build_protocol(ident)

def closelog():
  global protocol, opened

  opened = False
  if protocol is None:
    return

  protocol.close()
  protocol = None

def setlogmask(maskpri):
  pass

if __name__ == "__main__":
  from twisted.internet import reactor
  openlog("wibble")
  syslog("HI\n")
  closelog()
  reactor.run()

LOG_ALERT = LOG_AUTH = LOG_CONS = LOG_CRIT = LOG_CRON = LOG_DAEMON = LOG_DEBUG = LOG_EMERG = LOG_ERR = LOG_INFO = \
LOG_KERN = LOG_LOCAL0 = LOG_LOCAL1 = LOG_LOCAL2 = LOG_LOCAL3 = LOG_LOCAL4 = LOG_LOCAL5 = LOG_LOCAL6 = LOG_LOCAL7 = \
LOG_LPR = LOG_MAIL = LOG_NDELAY = LOG_NEWS = LOG_NOTICE = LOG_NOWAIT = LOG_PERROR = LOG_PID = LOG_SYSLOG = \
LOG_UPTO = LOG_USER = LOG_UUCP = LOG_WARNING = 0

LOG_MASK = LOG_UPTO = lambda *args, **kwargs: 0
