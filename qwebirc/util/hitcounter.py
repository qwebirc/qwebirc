import time

class HitCounter:
  def __init__(self):
    self.__hits = 0
    self.__start_time = time.time()
    
  def __call__(self, *args):
    self.__hits+=1

  def __str__(self):
    delta = time.time() - self.__start_time
    
    return "Total: %d hits/s: %.2f" % (self.__hits, self.__hits / delta)
    