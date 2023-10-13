import twisted, sys, codecs, traceback
from twisted.words.protocols import irc
from twisted.internet import reactor, protocol, abstract
from twisted.web import resource, server
from twisted.protocols import basic
from twisted.names.client import Resolver
import hmac, time, config, random, qwebirc.config_options as config_options
from config import HMACTEMPORAL

if config.get("CONNECTION_RESOLVER"):
  CONNECTION_RESOLVER = Resolver(servers=config.get("CONNECTION_RESOLVER"))
else:
  CONNECTION_RESOLVER = None

if hasattr(config, "WEBIRC_MODE") and config.WEBIRC_MODE == "hmac":
  HMACKEY = hmac.HMAC(key=config.HMACKEY)

def hmacfn(*args):
  h = HMACKEY.copy()
  h.update("%d %s" % (int(time.time() / HMACTEMPORAL), " ".join(args)))
  return h.hexdigest()

def utf8_iso8859_1(data):
  return (data.object[data.start:data.end].decode("iso-8859-1", "ignore"), data.end)

codecs.register_error("mixed-iso-8859-1", utf8_iso8859_1)

def irc_decode(x):
  return x.decode("utf-8", "mixed-iso-8859-1")

class QWebIRCClient(basic.LineReceiver):
  delimiter = b"\n"
  def __init__(self, *args, **kwargs):
    self.__nickname = "(unregistered)"
    
  def dataReceived(self, data):
    basic.LineReceiver.dataReceived(self, data.replace(b"\r", b""))

  def lineReceived(self, line):
    line = irc.lowDequote(irc_decode(line))
    
    try:
      prefix, command, params = irc.parsemsg(line)
      self.handleCommand(command, prefix, params)
    except irc.IRCBadMessage:
      # emit and ignore
      traceback.print_exc()
      return

    if command == "001":
      self.__nickname = params[0]
      
      if self.__perform is not None:
        for x in self.__perform:
          self.write(x)
        self.__perform = None
    elif command == "NICK":
      nick = prefix.split("!", 1)[0]
      if nick == self.__nickname:
        self.__nickname = params[0]
        
  def handleCommand(self, command, prefix, params):
    self("c", command, prefix, params)
    
  def __call__(self, *args):
    self.factory.publisher.event(args)
    
  def write(self, data):
    self.transport.write(b"%s\r\n" % irc.lowQuote(data).encode("utf-8"))
      
  def connectionMade(self):
    basic.LineReceiver.connectionMade(self)
    
    self.lastError = None
    f = self.factory.ircinit
    nick, ident, ip, realname, hostname, pass_ = f["nick"], f["ident"], f["ip"], f["realname"], f["hostname"], f.get("password")
    self.__nickname = nick
    self.__perform = f.get("perform")

    if not hasattr(config, "WEBIRC_MODE"):
      self.write("USER %s bleh bleh %s :%s" % (ident, ip, realname))
    elif config.WEBIRC_MODE == "hmac":
      hmac = hmacfn(ident, ip)
      self.write("USER %s bleh bleh %s %s :%s" % (ident, ip, hmac, realname))
    elif config.WEBIRC_MODE == "webirc":
      self.write("WEBIRC %s qwebirc %s %s" % (config.WEBIRC_PASSWORD, hostname, ip))
      self.write("USER %s bleh %s :%s" % (ident, ip, realname))
    elif config.WEBIRC_MODE == "cgiirc":
      self.write("PASS %s_%s_%s" % (config.CGIIRC_STRING, ip, hostname))
      self.write("USER %s bleh %s :%s" % (ident, ip, realname))
    elif config.WEBIRC_MODE == config_options.WEBIRC_REALNAME or config.WEBIRC_MODE is None: # last bit is legacy
      if ip == hostname:
        dispip = ip
      else:
        dispip = "%s/%s" % (hostname, ip)

      self.write("USER %s bleh bleh :%s - %s" % (ident, dispip, realname))

    if pass_ is not None:
      self.write("PASS :%s" % pass_)
    self.write("NICK %s" % nick)
    
    self.factory.client = self
    self("connect")

  def __str__(self):
    return "<QWebIRCClient: %s!%s@%s>" % (self.__nickname, self.factory.ircinit["ident"], self.factory.ircinit["ip"])
    
  def connectionLost(self, reason):
    if self.lastError:
      self.disconnect("Connection to IRC server lost: %s" % self.lastError)
    else:
      self.disconnect("Connection to IRC server lost.")
    self.factory.client = None
    basic.LineReceiver.connectionLost(self, reason)

  def error(self, message):
    self.lastError = message
    self.write("QUIT :qwebirc exception: %s" % message)
    self.transport.loseConnection()

  def disconnect(self, reason):
    self("disconnect", reason)
    self.factory.publisher.disconnect()
    
class QWebIRCFactory(protocol.ClientFactory):
  protocol = QWebIRCClient
  def __init__(self, publisher, **kwargs):
    self.client = None
    self.publisher = publisher
    self.ircinit = kwargs
    
  def write(self, data):
    self.client.write(data)

  def error(self, reason):
    self.client.error(reason)

  def clientConnectionFailed(self, connector, reason):
    protocol.ClientFactory.clientConnectionFailed(self, connector, reason)
    self.publisher.event(["disconnect", "Connection to IRC server failed."])
    self.publisher.disconnect()

def createIRC(*args, **kwargs):
  f = QWebIRCFactory(*args, **kwargs)
  
  tcpkwargs = {}
  if hasattr(config, "OUTGOING_IP"):
    tcpkwargs["bindAddress"] = (config.OUTGOING_IP, 0)
  
  if CONNECTION_RESOLVER is None:
    if hasattr(config, "SSLPORT"):
      from twisted.internet import ssl
      reactor.connectSSL(config.IRCSERVER, config.SSLPORT, f, ssl.ClientContextFactory(), **tcpkwargs)
    else:
      reactor.connectTCP(config.IRCSERVER, config.IRCPORT, f, **tcpkwargs)
    return f

  def callback(result):
    name, port = random.choice(sorted((str(x.payload.target), x.payload.port) for x in result[0]))
    reactor.connectTCP(name, port, f, **tcpkwargs)
  def errback(err):
    f.clientConnectionFailed(None, err) # None?!

  d = CONNECTION_RESOLVER.lookupService(config.IRCSERVER, (1, 3, 11))
  d.addCallbacks(callback, errback)
  return f

if __name__ == "__main__":
  e = createIRC(lambda x: 2, nick="slug__moo", ident="mooslug", ip="1.2.3.6", realname="mooooo", hostname="1.2.3.4")
  reactor.run()
