# write me

def xor(a, b):
  assert(len(a) == len(b))
  out = []
  for i in range(0, len(a)):
    out.append(chr(ord(a[i]) ^ ord(b[i])))

  return "".join(out)

class CBC:
  def __init__(self, cipher, iv):
    self.__cipher = cipher
    self.__prevblock = False
    self.__iv = iv

  def encrypt(self, block):
    if not self.__prevblock:
      i = self.__iv
    else:
      i = self.__prevblock

    c = xor(block, i)

    self.__prevblock = self.__cipher.encrypt(c)
    return self.__prevblock

  def decrypt(self, block):
    c = self.__cipher.decrypt(block)
    if not self.__prevblock:
      i = self.__iv
    else:
      i = self.__prevblock

    c = xor(c, i)

    self.__prevblock = block
    return c
