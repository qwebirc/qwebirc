from twisted.web import resource, server, static
from cgi import escape
from urllib import urlencode
import config, copy, time

HEADER = """
<html><head><link rel="stylesheet" href="/css/qui.css"></link><link rel="stylesheet" href="/css/dialogs.css"></link></head><body class="qwebirc-qui">
<div class="qwebirc-aboutpane lines" style="bottom: 0px; top: 0px; position: absolute; right: 0px; left: 0px;">
<div class="header"> 
  <table> 
    <tr> 
      <td><img src="/images/qwebircsmall.png" alt="qwebirc" title="qwebirc"/></td> 
      <td>&nbsp;&nbsp;&nbsp;&nbsp;</td> 
      <td align="center"><div class="title">qwebirc</div><div class="version">AdminEngine</div></td> 
    </tr> 
  </table> 
</div> 
<div class="mainbody" style="bottom: 100px">
"""

FOOTER = """</div></body></html>"""

class AdminEngineException(Exception):
  pass
  
class AdminEngineAction:
  def __init__(self, link_text, function, uniqid=None):
    self._link_text = link_text
    self.function = function
    self.uniqid = uniqid

  def get_link(self, **kwargs):
    kwargs = copy.deepcopy(kwargs)
    if self.uniqid is not None:
      kwargs["uniqid"] = self.uniqid
    return "<a href=\"?%s\">%s</a>" % (urlencode(kwargs), escape(self._link_text))
  
class AdminEngine(resource.Resource):
  def __init__(self, path, services):
    self.__services = services
    self.__path = path
    self.__creation_time = time.time()

  @property
  def adminEngine(self):
    return {
      "Permitted hosts": (config.ADMIN_ENGINE_HOSTS,),
      "Started": ((time.asctime(time.localtime(self.__creation_time)),),),
      "Running for": (("%d seconds" % int(time.time() - self.__creation_time),),),
      "CPU time used (UNIX only)": (("%.2f seconds" % time.clock(),),)
    }
      
  def process_action(self, args):
    try:  
      engine = args["engine"][0]
      heading = args["heading"][0]
      pos = int(args["pos"][0])
      pos2 = int(args["pos2"][0])
      
      uniqid = args.get("uniqid", [None])[0]
      
      obj = self.__services[engine].adminEngine[heading][pos]
    except KeyError:
      raise AdminEngineException("Bad action description.")
      
    if uniqid is None:
      obj[pos2].function()
    else:
      for x in obj:
        if not isinstance(x, AdminEngineAction):
          continue
        if x.uniqid == uniqid:
          x.function(uniqid)
          break
      else:
        raise AdminEngineException("Action does not exist.")
    
  def render_GET(self, request):
    _, ip, port = request.transport.getPeer()
    if ip not in config.ADMIN_ENGINE_HOSTS:
      raise AdminEngineException("Access denied")
  
    args = request.args.get("engine")
    if args:
      self.process_action(request.args)
      request.redirect("?")
      request.finish()
      return server.NOT_DONE_YET
      
    data = [HEADER]
    
    def add_list(lines):
      data.append("<ul>")
      data.extend(["<li>" + escape(x) + "</li>" for x in lines])
      data.append("</ul>")
      
    def add_text(text, block="p"):
      data.append("<%s>%s</%s>" % (block, escape(text), block))
      
    def brescape(text):
      return escape(text).replace("\n", "<br/>")
      
    for engine, obj in self.__services.items():
      if not hasattr(obj, "adminEngine"):
        continue
      add_text(engine, "h2")
      
      for heading, obj2 in obj.adminEngine.items():
        add_text(heading, "h3")

        for pos, obj3 in enumerate(obj2):
          elements = []
          for pos2, obj4 in enumerate(obj3):
            if isinstance(obj4, AdminEngineAction):
              elements.append(obj4.get_link(engine=engine, heading=heading, pos=pos, pos2=pos2))
            else:
              elements.append(brescape(str(obj4)))

          data+=["<p>", " ".join(elements), "</p>"]

    data.append(FOOTER)
    
    return "".join(data)
