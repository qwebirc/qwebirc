from zope.interface import implementer

from twisted.python import usage

from twisted.internet import task, protocol
from twisted.protocols import basic, policies
from twisted.plugin import IPlugin
from twisted.application.service import IServiceMaker
from twisted.application import internet, strports, service
from twisted.web import static, server
import urllib.parse
import urllib.request, urllib.parse, urllib.error

from qwebirc.root import RootSite

class Options(usage.Options):
  optParameters = [["port", "p", "9090","Port to start the server on."],
    ["ip", "i", "0.0.0.0", "IP address to listen on."],
    ["logfile", "l", None, "Path to web CLF (Combined Log Format) log file."],
    ["https", None, None, "Port to listen on for Secure HTTP."],
    ["certificate", "c", "server.pem", "SSL certificate to use for HTTPS. "],
    ["privkey", "k", "server.pem", "SSL certificate to use for HTTPS."],
    ["certificate-chain", "C", None, "Chain SSL certificate"],
    ["staticpath", "s", "static", "Path to static content"],
  ]

  optFlags = [["notracebacks", "n", "Display tracebacks in broken web pages. " +
              "Displaying tracebacks to users may be security risk!"],
             ]

  def postOptions(self):
    if self['https']:
      try:
        get_ssl_factory_factory()
      except ImportError:
        raise usage.UsageError("SSL support not installed")

@implementer(IServiceMaker, IPlugin)
class QWebIRCServiceMaker(object):
  tapname = "qwebirc"
  description = "QuakeNet web-based IRC client"
  options = Options
  
  def makeService(self, config):
    if config['logfile']:
      site = RootSite(config['staticpath'], logPath=config['logfile'])
    else:
      site = RootSite(config['staticpath'])

    s = service.MultiService()
    site.displayTracebacks = not config["notracebacks"]
    if config['https']:
      ssl_factory = get_ssl_factory_factory()
      i = internet.SSLServer(int(config['https']), site, ssl_factory(config['privkey'], config['certificate'], certificateChainFile=config["certificate-chain"]), interface=config['ip'])
    else:
      i = internet.TCPServer(int(config['port']), site, interface=config['ip'])

    i.setServiceParent(s)

    return s

def get_ssl_factory_factory():
  from twisted.internet.ssl import DefaultOpenSSLContextFactory
  class ChainingOpenSSLContextFactory(DefaultOpenSSLContextFactory):
    def __init__(self, *args, **kwargs):
      self.chain = None
      if "certificateChainFile" in kwargs:
        self.chain = kwargs["certificateChainFile"]
        del kwargs["certificateChainFile"]

      DefaultOpenSSLContextFactory.__init__(self, *args, **kwargs)

    def cacheContext(self):
      DefaultOpenSSLContextFactory.cacheContext(self)
      if self.chain:
        self._context.use_certificate_chain_file(self.chain)
        self._context.use_privatekey_file(self.privateKeyFileName)

  return ChainingOpenSSLContextFactory

serviceMaker = QWebIRCServiceMaker()
