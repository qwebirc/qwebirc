Array.prototype.indexFromEnd = function(d) {
  var p = this;
  
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
