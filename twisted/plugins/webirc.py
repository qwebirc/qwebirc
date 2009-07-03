from zope.interface import implements

from twisted.python import usage
from twisted.internet import task
from twisted.plugin import IPlugin
from twisted.application.service import IServiceMaker
from twisted.application import internet, strports
from twisted.web import static, server

from qwebirc.root import RootSite

class Options(usage.Options):
  optParameters = [["port", "p", "9090","Port to start the server on."],
    ["ip", "i", "0.0.0.0", "IP address to listen on."],
    ["logfile", "l", None, "Path to web CLF (Combined Log Format) log file."],
    ["https", None, None, "Port to listen on for Secure HTTP."],
    ["certificate", "c", "server.pem", "SSL certificate to use for HTTPS. "],
    ["privkey", "k", "server.pem", "SSL certificate to use for HTTPS."],
    ["staticpath", "s", "static", "Path to static content"],
  ]

  optFlags = [["notracebacks", "n", "Display tracebacks in broken web pages. " +
              "Displaying tracebacks to users may be security risk!"],
             ]
             
  zsh_actions = {"logfile" : "_files -g '*.log'", "certificate" : "_files -g '*.pem'",
                 "privkey" : "_files -g '*.pem'"}  

  def postOptions(self):
    if self['https']:
      try:
        from twisted.internet.ssl import DefaultOpenSSLContextFactory
      except ImportError:
        raise usage.UsageError("SSL support not installed")
        
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
      from twisted.internet.ssl import DefaultOpenSSLContextFactory
      i = internet.SSLServer(int(config['https']), site, DefaultOpenSSLContextFactory(config['privkey'], config['certificate']), interface=config['ip'])
    else:
      i = internet.TCPServer(int(config['port']), site, interface=config['ip'])
      
    return i
  
serviceMaker = QWebIRCServiceMaker()
