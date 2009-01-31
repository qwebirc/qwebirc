import struct, zlib

class GZipRequest(object):
  """Wrapper for a request that applies a gzip content encoding"""

  def __init__(self, request, compressLevel=6):
    self.request = request
    self.request.setHeader('Content-Encoding', 'gzip')
    # Borrowed from twisted.web2 gzip filter
    self.compress = zlib.compressobj(compressLevel, zlib.DEFLATED, -zlib.MAX_WBITS, zlib.DEF_MEM_LEVEL,0)

  def __getattr__(self, attr):
    if 'request' in self.__dict__:
      return getattr(self.request, attr)
      
    raise AttributeError, attr

  def __setattr__(self, attr, value):
    if 'request' in self.__dict__:
      return setattr(self.request, attr, value)
      
    self.__dict__[attr] = value

  def write(self, data):
    if not self.request.startedWriting:
      self.crc = zlib.crc32('')
      self.size = self.csize = 0
      # XXX: Zap any length for now since we don't know final size
      if 'content-length' in self.request.headers:
        del self.request.headers['content-length']
        # Borrow header information from twisted.web2 gzip filter
      self.request.write('\037\213\010\000' '\0\0\0\0' '\002\377')

    self.crc = zlib.crc32(data, self.crc)
    self.size += len(data)
    cdata = self.compress.compress(data)
    self.csize += len(cdata)
    if cdata:
      self.request.write(cdata)
    elif self.request.producer:
      # Simulate another pull even though it hasn't really made it out to the consumer yet.
      self.request.producer.resumeProducing()

  def finish(self):
    remain = self.compress.flush()
    self.csize += len(remain)
    if remain:
      self.request.write(remain)
      
    self.request.write(struct.pack('<LL', self.crc & 0xFFFFFFFFL, self.size & 0xFFFFFFFFL))
    self.request.finish()
