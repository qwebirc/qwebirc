from twisted.names import client
from twisted.internet import reactor, defer

class LookupException(Exception): pass
class VerificationException(Exception): pass
TimeoutException = defer.TimeoutError

def lookupPTR(ip, *args, **kwargs):
  def callback(result):
    answer, auth, add = result

    if len(answer) == 0:
      raise LookupException, "No ANSWERS in PTR response for %s." % repr(ip)
    return str(answer[0].payload.name)

  ptr = ".".join(ip.split(".")[::-1]) + ".in-addr.arpa."
  return client.lookupPointer(ptr, **kwargs).addCallback(callback)

def lookupAs(hostname, *args, **kwargs):
  def callback(result):
    answer, auth, add = result
    if len(answer) == 0:
      raise LookupException, "No ANSWERS in A response for %s." % repr(hostname)
    return [x.payload.dottedQuad() for x in answer]

  return client.lookupAddress(hostname, *args, **kwargs).addCallback(callback)

def lookupAndVerifyPTR(ip, *args, **kwargs):
  d = defer.Deferred()

  def gotPTRResult(ptr):
    def gotAResult(a_records):
      if ip in a_records:
        d.callback(ptr)
      else:
        raise VerificationException("IP mismatch: %s != %s%s" % (repr(ip), repr(ptr), repr(a_records)))
    lookupAs(ptr, *args, **kwargs).addCallback(gotAResult).addErrback(d.errback)

  lookupPTR(ip, *args, **kwargs).addCallback(gotPTRResult).addErrback(d.errback)
  return d

if __name__ == "__main__":
  import sys

  def callback(x):
    print x
    reactor.stop()

  def errback(x):
    x.printTraceback()
    reactor.stop()

  d = lookupAndVerifyPTR(sys.argv[1], timeout=[.001])
  d.addCallbacks(callback, errback)

  reactor.run()
