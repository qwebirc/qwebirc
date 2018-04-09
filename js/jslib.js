Array.prototype.indexFromEnd = function(d) {
  var p = this;
  
  if(d < 0)
    return p[p.length + d];

  return p[d];
}

qwebirc.util.dictCopy = function(d) {
  var n = {};
  for(var k in d)
    n[k] = d[k];

  return n;
}

/* how horribly inefficient */
String.prototype.replaceAll = function(f, t) {
  //return new RegExp("/" + RegExp.escape(f) + "/g").replace(f, RegExp.escape(t));
  var i = this.indexOf(f);
  var c = this;
 
  while(i > -1) {
    c = c.replace(f, t);
    i = c.indexOf(f);
  }
  return c;
}

/* how horribly inefficient (again) */
String.prototype.splitMax = function(by, max) {
  var items = this.split(by);
  var newitems = items.slice(0, max-1);

  if(items.length >= max)
    newitems.push(items.slice(max-1).join(by));
  
  return newitems;
}

/* returns the arguments */
qwebirc.util.parseURI = function(uri) {
  var result = new QHash();

  var start = uri.indexOf('?');
  if(start == -1)
    return result;
    
  var querystring = uri.substring(start + 1);
  
  var args = querystring.split("&");
  
  for(var i=0;i<args.length;i++) {
    var r = args[i].splitMax("=", 2);
    if(r.length < 2)
      continue;
      
    result.put(unescape(r[0]), unescape(r[1]));
  }
  
  return result;
};

qwebirc.util.DaysOfWeek = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat"
};

qwebirc.util.MonthsOfYear = {
  0: "Jan",
  1: "Feb",
  2: "Mar",
  3: "Apr",
  4: "May",
  5: "Jun",
  6: "Jul",
  7: "Aug",
  8: "Sep",
  9: "Oct",
  10: "Nov",
  11: "Dec"
};

qwebirc.util.NBSPCreate = function(text, element) {
  var e = text.split("  ");
  for(var i=0;i<e.length;i++) {
    var tn = document.createTextNode(e[i]);
    element.appendChild(tn);
    
    if(i != e.length - 1) {
      var e2 = new Element("span");
      e2.set("html", "&nbsp;&nbsp;");
      element.appendChild(e2);
    }
  }
};

qwebirc.util.longtoduration = function(l) {
  var seconds = l % 60;
  var minutes = Math.floor((l % 3600) / 60);
  var hours = Math.floor((l % (3600 * 24)) / 3600);
  var days = Math.floor(l / (24*3600));
  
  return days + " days " + hours + " hours " + minutes + " minutes " + seconds + " seconds";
}

qwebirc.util.pad = function(x) {
  x = "" + x;
  if(x.length == 1)
    return "0" + x;
  return x
}

RegExp.escape = function(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

RegExp.fromIRCPattern = function(t) {
  /* escape everything but ? . and * */
  var t = t.replace(/[-[\]{}()+,\\^$|#\s]/g, "\\$&");
  t = t.split("");
  var out = [];

  /* now process the rest */
  for(var i=0;i<t.length;i++) {
    var c = t[i];
    switch(c) {
      case '.':
        out.push("\\.");
        break;
      case '?':
        out.push(".");
        break;
      case '*':
        out.push(".*");
        break;
      default:
        out.push(c);
    }
  }
  return out.join("");
}

qwebirc.ui.insertAt = function(position, parent, element) {
  if(!parent.childNodes || (position >= parent.childNodes.length)) {
    parent.appendChild(element);
  } else {
    parent.insertBefore(element, parent.childNodes[position]);
  }
}

qwebirc.util.setCaretPos = function(obj, pos) {
  if($defined(obj.selectionStart)) { 
    obj.focus(); 
    obj.setSelectionRange(pos, pos); 
  } else if(obj.createTextRange) { 
    var range = obj.createTextRange(); 
    range.move("character", pos); 
    range.select();
  }
}

qwebirc.util.setAtEnd = function(obj) {
  qwebirc.util.setCaretPos(obj.value.length);
}

qwebirc.util.getCaretPos = function(element) {
  if($defined(element.selectionStart))
    return element.selectionStart;
    
  if(document.selection) {
    element.focus();
    var sel = document.selection.createRange();
    sel.moveStart("character", -element.value.length);
    return sel.text.length;
  }
}

qwebirc.util.browserVersion = function() {
  //return "engine: " + Browser.Engine.name + " platform: " + Browser.Platform.name + " user agent: " + navigator.userAgent;
  return navigator.userAgent;
}

qwebirc.util.getEnclosedWord = function(text, position) {
  var l = text.split("");
  var buf = [];
  
  if(text == "")
    return;

  var start = position - 1;
  if(start < 0) {
    /* special case: starting with space */    
    start = 0;
  } else {
    /* work back until we find the first space */
    for(;start>=0;start--) {
      if(l[start] == ' ') {
        start = start + 1;
        break;
      }
    }
  }
  
  if(start < 0)
    start = 0;
    
  var s = text.substring(start);
  var pos = s.indexOf(" ");
  if(pos != -1)
    s = s.substring(0, pos);
    
  return [start, s];
}

String.prototype.startsWith = function(what) {
  return this.substring(0, what.length) == what;
}

String.prototype.endsWith = function(what) {
  return this.substring(this.length - what.length, this.length) == what;
};

/* NOT cryptographically secure! */
qwebirc.util.randHexString = function(numBytes) {
  var getByte = function() {
    return (((1+Math.random())*0x100)|0).toString(16).substring(1);
  };
  
  var l = [];
  for(var i=0;i<numBytes;i++)
    l.push(getByte());
  
  return l.join("");
}

qwebirc.util.importJS = function(name, watchFor, onload) {
  var script = document.createElement("script");
  script.type = "text/javascript";
  script.src = name;
  
  if(Browser.Engine.trident) {
    /* HORRID */
    var checkFn = function() {
      if(eval("typeof " + watchFor) != "undefined") {
        onload();
      } else {
        checkFn.delay(100);
      }
    }
    checkFn();
  } else {
    script.onload = onload;
  }
  document.getElementsByTagName("head")[0].appendChild(script);
}

qwebirc.util.createInput = function(type, parent, name, selected, id) {
  var created = false;
  var r;
  if (name)
    name = "__input" + name;

  if (Browser.Engine.trident) {
    var name2;
    if (name) {
      name2 = " name=\"" + escape(name) + "\"";
    } else {
      name2 = "";
    }
    try {
      var h = "<input type=\"" + type + "\"" + name2 + "/>";
      r = $(document.createElement(h));
      if (type == "radio") {
        r.addEvent("click", function () {
          $(document.body).getElements("input[name=" + name + "]").forEach(function (x) {
            x.setAttribute("defaultChecked", x.checked ? "defaultChecked" : "");
          });
        });
      }
      created = true;
    } catch (e) {
      /* fallthough, trying it the proper way... */
    }
  }

  if(!created) {
    r = new Element("input");
    r.setAttribute("type", type);
  }
  if(name)
    r.setAttribute("name", name);
  if(id)
    r.setAttribute("id", id);
  if(selected) {
    r.setAttribute("checked", "checked");
    if(type == "radio" && Browser.Engine.trident)
      r.setAttribute("defaultChecked", "defaultChecked");
  }

  parent.appendChild(r);
  return r;
}

qwebirc.util.composeAnd = function() {
 var xargs = arguments;

  return function() {
    for(var i=0;i<xargs.length;i++)
      if(!xargs[i].apply(this, arguments))
        return false;
        
    return true;
  }
}

qwebirc.util.invertFn = function(fn) {
  return function() {
    return !fn.apply(this, arguments);
  }
}

qwebirc.util.deviceHasKeyboard = function() {
  var determine = function() {
    if(Browser.Engine.ipod)
      return true;

    var MOBILE_UAs = ["Nintendo Wii", " PIE", "BlackBerry", "IEMobile", "Windows CE", "Nokia", "Opera Mini", "Mobile", "mobile", "Pocket", "pocket", "Android"];
    /* safari not included because iphones/ipods send that, and we checked for iphone/ipod specifically above */
    var DESKTOP_UAs = ["Chrome", "Firefox", "Camino", "Iceweasel", "K-Meleon", "Konqueror", "SeaMonkey", "Windows NT", "Windows 9"];

    var ua = navigator.userAgent;

    var contains = function(v) {
      return ua.indexOf(v) > -1;
    }

    for(var i=0;i<MOBILE_UAs.length;i++)
      if(contains(MOBILE_UAs[i]))
        return false;
      
    for(var i=0;i<DESKTOP_UAs.length;i++)
      if(contains(DESKTOP_UAs[i]))
        return true;
      
    return false;
  };
  var v = determine();
  
  qwebirc.util.deviceHasKeyboard = function() {
    return v;
  }
  
  return v;
}

qwebirc.util.generateID_ID = 0;
qwebirc.util.generateID = function() {
  return "qqa-" + qwebirc.util.generateID_ID++;
};

qwebirc.util.arrayCmp = function(a, b) {
  for(var p=0;p<a.length;p++) {
    var ap = a[p];
    var bp = b[p];
    if(ap == bp)
      continue;

    if(ap < bp)
      return -1;

    return 1;
  }
  return 0;
};

qwebirc.util.__log = function(x) {
  if(QWEBIRC_DEBUG) {
    if(typeof console == "undefined") {
      alert("log: " + x);
    } else {
      console.log(x);
    }
  }
};

qwebirc.util.logger = {
  log: function(x) { qwebirc.util.__log("L " + x) },
  info: function(x) { qwebirc.util.__log("I " + x) },
  error: function(x) { qwebirc.util.__log("E " + x) },
  warn: function(x) { qwebirc.util.__log("W " + x) }
};

qwebirc.util.log = qwebirc.util.logger.log;
