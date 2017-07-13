qwebirc.irc.IgnoreController = new Class({
  initialize: function(toIRCLower) {
    this.toIRCLower = toIRCLower;
    this.ignored = new QHash();
  },
  __toHostKey: function(host) {
    if(host.indexOf("!") == -1 && host.indexOf("@") == -1)
      host = host + "!*@*";

    return this.toIRCLower(host);
  },
  ignore: function(host) {
    if(this.isIgnored(host))
      return false;

    var hostKey = this.__toHostKey(host);
    this.ignored.put(hostKey, [host, new RegExp("^" + RegExp.fromIRCPattern(hostKey) + "$")]);

    return hostKey;
  },
  unignore: function(host) {
    if(!this.isIgnored(host))
      return null;

    var hostKey = this.__toHostKey(host);
    this.ignored.remove(hostKey);

    return hostKey;
  },
  get: function() {
    return this.ignored.map(function(k, v) {
      return v[0];
    });
  },
  isIgnored: function(nick, host) {
    if(host === undefined)
      return this.ignored.contains(this.__toHostKey(nick));

    var mask = this.toIRCLower(nick + "!" + host);

    return this.ignored.each(function(k, v) {
//      console.log(k + " (" + v[0] + ")" + " matched against " + mask);
      if(mask.match(v[1]))
        return true;
    }) === true;
  }
});