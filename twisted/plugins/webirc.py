from zope.interface import implements

from twisted.python import usage

from twisted.internet import task, protocol
from twisted.protocols import basic, policies
from twisted.plugin import IPlugin
from twisted.application.service import IServiceMaker
from twisted.application import internet, strports
from twisted.web import static, server
import urlparse
import urllib

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

class FlashPolicyProtocol(protocol.Protocol, policies.TimeoutMixin):
  timeOut = 5

  def dataReceived(self, data):
    if data == '<policy-file-request/>\0':
      self.transport.write(self.factory.response_body)
      self.transport.loseConnection()
      return
    else:
      self.setTimeout(None)
      p = self.factory.site.buildProtocol(self.transport.client)
      p.transport = self.transport
      self.transport.protocol = p
      p.connectionMade()
      p.dataReceived(data)


class FlashPolicyFactory(protocol.ServerFactory):
  protocol = FlashPolicyProtocol

  def __init__(self, site):
    import config
    base_url = urlparse.urlparse(config.BASE_URL)
    port = base_url.port
    if port is None:
      if base_url.scheme == "http":
        port = 80
      elif base_url.scheme == "https":
        port = 443
      else:
        raise Exception("Unknown scheme: " + base_url.scheme)

    self.site = site
    self.response_body = """<cross-domain-policy>
    <allow-access-from domain="%s" to-ports="%d" />
</cross-domain-policy>""" % (urllib.quote(base_url.hostname), port) + '\0'

class QWebIRCServiceMaker(object):
  implements(IServiceMaker, IPlugin)
  tapname = "qwebirc"
  description = "QuakeNet web-based IRC client"
  options = Options
  
  def makeService(self, config):
    if config['logfile']:
      site = RootSite(config['staticpath'], logPath=config['logfile'])
    else:
      site = RootSite(config['staticpath'])
    
    site.displayTracebacks = not config["notracebacks"]
    if config['https']:
      ssl_factory = get_ssl_factory_factory()
      i = internet.SSLServer(int(config['https']), FlashPolicyFactory(site), ssl_factory(config['privkey'], config['certificate'], certificateChainFile=config["certificate-chain"]), interface=config['ip'])
    else:
      i = internet.TCPServer(int(config['port']), FlashPolicyFactory(site), interface=config['ip'])
      
    return i

def get_ssl_factory_factory():
  from twisted.internet.ssl import DefaultOpenSSLContextFactory
  class ChainingOpenSSLContextFactory(DefaultOpenSSLContextFactory):
    def __init__(self, *args, **kwargs):
      self.chain = None
      if kwargs.has_key("certificateChainFile"):
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
