from twisted.names import client, dns
from twisted.internet import reactor, defer

class LookupException(Exception): pass
class VerificationException(Exception): pass
TimeoutException = defer.TimeoutError

def lookupPTR(ip, *args, **kwargs):
  def callback(result):
    answer, auth, add = result
    answer = [x for x in answer if x.type == dns.PTR]
    if len(answer) == 0:
      raise LookupException("No ANSWERS in PTR response for %s." % repr(ip))
    return str(answer[0].payload.name)

  ptr = ".".join(ip.split(".")[::-1]) + ".in-addr.arpa."
  return client.lookupPointer(ptr, **kwargs).addCallback(callback)

def expandIPv6(ip):
  expand_sections = ["".join(["{:0>4}".format(group)
      for group in section.split(":")])
        for section in ip.split("::", 1)]
  if len(expand_sections) == 1:
      return expand_sections[0]
  return expand_sections[0] + "".join((32-sum([len(x) for x in expand_sections]))*"0") + expand_sections[1]

def lookupPTRv6(ip, *args, **kwargs):
  def callback(result):
    answer, auth, add = result
    answer = [x for x in answer if x.type == dns.PTR]
    if len(answer) == 0:
      raise LookupException("No ANSWERS in PTR response for %s." % repr(ip))
    return str(answer[0].payload.name)

  ptr = ".".join(reversed(expandIPv6(ip))) + ".ip6.arpa."
  return client.lookupPointer(ptr, **kwargs).addCallback(callback)

def lookupAs(hostname, *args, **kwargs):
  def callback(result):
    answer, auth, add = result
    answer = [x for x in answer if x.type == dns.A]
    if len(answer) == 0:
      raise LookupException("No ANSWERS in A response for %s." % repr(hostname))
    return [x.payload.dottedQuad() for x in answer]

  return client.lookupAddress(hostname, *args, **kwargs).addCallback(callback)

def lookupAAAAs(hostname, *args, **kwargs):
  def callback(result):
    answer, auth, add = result
    answer = [x for x in answer if x.type == dns.AAAA]
    if len(answer) == 0:
      raise LookupException("No ANSWERS in AAAA response for %s." % repr(hostname))
    return [expandIPv6(x.payload._address) for x in answer]

  return client.lookupIPV6Address(hostname, *args, **kwargs).addCallback(callback)

def lookupAndVerifyPTR(ip, *args, **kwargs):
  d = defer.Deferred()

  def gotPTRResult(ptr):
    def gotAResult(a_records):
      if ip in a_records:
        d.callback(ptr)
      else:
        raise VerificationException("IP mismatch: %s != %s%s" % (repr(ip), repr(ptr), repr(a_records)))
    lookupAs(ptr, *args, **kwargs).addCallback(gotAResult).addErrback(d.errback)

  def gotPTRv6Result(ptr):
    def gotAAAAResult(aaaa_records):
      if expandIPv6(ip) in aaaa_records:
        d.callback(ptr)
      else:
        raise VerificationException("IPv6 mismatch: %s != %s%s" % (repr(ip), repr(ptr), repr(aaaa_records)))
    lookupAAAAs(ptr, *args, **kwargs).addCallback(gotAAAAResult).addErrback(d.errback)

  if ":" in ip:
    lookupPTRv6(ip, *args, **kwargs).addCallback(gotPTRv6Result).addErrback(d.errback)
  else:
    lookupPTR(ip, *args, **kwargs).addCallback(gotPTRResult).addErrback(d.errback)
  return d

if __name__ == "__main__":
  import sys

  def callback(x):
    print(x)
    reactor.stop()

  def errback(x):
    x.printTraceback()
    reactor.stop()

  d = lookupAndVerifyPTR(sys.argv[1], timeout=[3])
  d.addCallbacks(callback, errback)

  reactor.run()
