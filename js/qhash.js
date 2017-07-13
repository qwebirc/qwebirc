QHash = function(def) {
  this.__map = {};
  this.length = 0;

  if(def !== undefined) {
    var h = Object.prototype.hasOwnProperty;
    for (var k in def) {
      if(!h.call(def, k))
        continue;
      this.put(k, def[k]);
    }
  }
};

QHash.prototype.__toKey = function(key) {
  if(typeof(key) !== "string")
    throw new TypeError("Not a string: " + key);
  return key + "$";
};

QHash.prototype.get = function(key) {
  return this.__map[this.__toKey(key)];
};

QHash.prototype.put = function(key, value) {
  key = this.__toKey(key);

  var exists = key in this.__map;
  var oldValue = this.__map[key];

  this.__map[key] = value;

  if(!exists) {
    this.length++;
    return null;
  }

  return oldValue;
};

QHash.prototype.contains = function(key) {
  return this.__toKey(key) in this.__map;
};

QHash.prototype.remove = function(key) {
  key = this.__toKey(key);

  var exists = key in this.__map;
  if(!exists)
    return null;

  var oldValue = this.__map[key];
  delete this.__map[key];
  this.length--;

  return oldValue;
};

QHash.prototype.each = function(fn, def) {
  var h = Object.prototype.hasOwnProperty;
  var m = this.__map;
  for(var k in m) {
    if(!h.call(m, k))
      continue;

    var break_ = fn.call(def, k.substr(0, k.length - 1), m[k]) !== undefined;
    if(break_)
      return break_;
  }
};

QHash.prototype.isEmpty = function() {
  return this.length == 0;
};

QHash.prototype.map = function(fn, def) {
  var l = [];
  this.each(function(k, v) {
    l.push(fn.call(def, k, v));
  });
  return l;
};

QHash.prototype.keys = function() {
  return this.map(function(k) { return k; });
};

QHash.prototype.values = function() {
  return this.map(function(k, v) { return v; });
};

QHash.prototype.items = function() {
  return this.map(function(k, v) { return [k, v]; });
};

QHash.prototype.toString = function() {
  var m = this.map(function(k, v) {
    return k + "=" + v;
  }, this);

  return "{QHash length=" + this.length + " map={" + m + "}}";
};

QSet = function() {
  this.__map = new QHash();

  this.length = 0;
  for(var i=0;i<arguments.length;i++)
    this.add(arguments[i]);
};

QSet.prototype.add = function(value) {
  var v = this.__map.put(value, true);
  if(v !== true)
    this.length = this.__map.length;

  return v;
};

QSet.prototype.contains = function(value) {
  return this.__map.contains(value);
};

QSet.prototype.remove = function(value) {
  var v = this.__map.remove(value, true);
  if(v)
    this.length = this.__map.length;

  return v;
};

QSet.prototype.each = function(fn, def) {
  return this.__map.each(fn, def);
};

QSet.prototype.values = function() {
  return this.__map.keys();
}

QSet.prototype.isEmpty = function() {
  return this.length == 0;
};

QSet.prototype.map = function(fn, def) {
  return this.__map.map(fn, def);
};

QSet.prototype.toString = function(value) {
  return "{QSet length=" + this.length + " set={" + this.values() + "}}";
};
