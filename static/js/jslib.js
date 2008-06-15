if( typeof XMLHttpRequest == "undefined" ) XMLHttpRequest = function() {
  try{ return new ActiveXObject("Msxml2.XMLHTTP.6.0") }catch(e){}
  try{ return new ActiveXObject("Msxml2.XMLHTTP.3.0") }catch(e){}
  try{ return new ActiveXObject("Msxml2.XMLHTTP") }catch(e){}
  try{ return new ActiveXObject("Microsoft.XMLHTTP") }catch(e){}
  throw new Error("This browser does not support XMLHttpRequest or XMLHTTP.")
};
 
function jsdecode(data) {
  return eval('(' + data + ')');
}
 
function XHR(url, fn) {
  var r = new XMLHttpRequest();
  r.onreadystatechange = function() {
    if(r.readyState == 4 && r.status == 200) {
      var o = jsdecode(r.responseText);
      fn(o);
    }
  }
  r.open("GET", url, true);
  r.send(null);
}

function empty(y) {
  for(var x in y) {
    return false;
  }
  return true;
}

function ANI(p, d) {
  if(d < 0)
    return p[p.length + d];

  return p[d];
}

var forEach = function(x, fn) {
  for(var i=0;i<x.length;i++)
    if(fn(x[i]))
      return;
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

DaysOfWeek = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat"
}

MonthsOfYear = {
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
}

