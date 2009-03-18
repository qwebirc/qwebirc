class DummyImplementation(object):
  def __init__(self, *args, **kwargs):
    pass
    
  def __getattr__(self, *args, **kwargs):
    raise Exception, "Not implemented."
    
  def login_optional(self, *args, **kwargs):
    return None

  @classmethod
  def get_session_data(self, *args, **kwargs):
    return {}
    
twisted = DummyImplementation