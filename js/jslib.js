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
  var result = {}

  var start = uri.indexOf('?');
  if(start == -1)
    return result;
    
  var querystring = uri.substring(start + 1);
  
  var args = querystring.split("&");
  
  for(var i=0;i<args.length;i++) {
    var r = args[i].splitMax("=", 2);
    if(r.length < 2)
      continue;
      
    result[unescape(r[0])] = unescape(r[1]);
  }
  
  return result;
}

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
  if(!arguments.callee.sRE) {
    var specials = [
      '/', '.', '*', '+', '?', '|',
      '(', ')', '[', ']', '{', '}', '\\'
    ];
    arguments.callee.sRE = new RegExp('(\\' + specials.join('|\\') + ')', 'g');
  }
  
  return text.replace(arguments.callee.sRE, '\\$1');
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

qwebirc.util.createInput = function(type, parent, name, selected) {
  var r;
  if(Browser.Engine.trident) {
    if(name) {
      name = " name=\"" + escape(name) + "\"";
    } else {
      name = "";
    }
    r = $(document.createElement("<input type=\"" + type + "\"" + name + " " + (selected?" checked":"") + "/>"));
  } else {    
    r = new Element("input");
    r.type = type;
    if(name)
      r.name = name;
      
    if(selected)
      r.checked = true;
  }
    
  parent.appendChild(r);
  return r;
}

/* From: www.webtoolkit.info */
qwebirc.util.b64Table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
qwebirc.util.b64Encode = function(data) {
  var output = [];
  var table = qwebirc.util.b64Table;
  for(var i=0;i<data.length;) {
    var chr1 = data.charCodeAt(i++);
    var chr2 = data.charCodeAt(i++);
    var chr3 = data.charCodeAt(i++);

    var enc1 = chr1 >> 2;
    var enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    var enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
    var enc4 = chr3 & 63;

    if(isNaN(chr2)) {
      enc3 = enc4 = 64;
    } else if(isNaN(chr3)) {
      enc4 = 64;
    }

    output.push(table.charAt(enc1) + table.charAt(enc2) + table.charAt(enc3) + table.charAt(enc4));
  }
  return output.join("");
}

/* From: www.webtoolkit.info */
qwebirc.util.b64Decode = function(data) {
  data = data.replace(/[^A-Za-z0-9\+\/\=]/g, "");

  var output = [];
  var table = qwebirc.util.b64Table;
  for(var i=0;i<data.length;) {
    var enc1 = table.indexOf(data.charAt(i++));
    var enc2 = table.indexOf(data.charAt(i++));
    var enc3 = table.indexOf(data.charAt(i++));
    var enc4 = table.indexOf(data.charAt(i++));

    var chr1 = (enc1 << 2) | (enc2 >> 4);
    var chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    var chr3 = ((enc3 & 3) << 6) | enc4;

    output.push(String.fromCharCode(chr1));
    if (enc3 != 64)
      output.push(String.fromCharCode(chr2));
    if (enc4 != 64)
      output.push(String.fromCharCode(chr3));
  }

  return output.join("");
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
