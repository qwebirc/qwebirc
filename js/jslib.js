Array.prototype.indexFromEnd = function(d) {
  var p = this;
  
  if(d < 0)
    return p[p.length + d];

  return p[d];
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

qwebirc.util.setAtEnd = function(obj) {
  pos = obj.value.length;
  
  if(obj.createTextRange) { 
    var range = obj.createTextRange(); 
    range.move("character", pos); 
    range.select(); 
  } else if(obj.selectionStart) { 
    obj.focus(); 
    obj.setSelectionRange(pos, pos); 
  } 
}

/* returns the arguments */
qwebirc.util.parseURI = function(uri) {
  var result = {}

  var start = uri.indexOf('?');
  if(start == -1)
    return result;
    
  var querystring = uri.substring(start + 1);
  
  var args = querystring.split("&");
  
  for(i=0;i<args.length;i++) {
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
