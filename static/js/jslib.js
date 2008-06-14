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