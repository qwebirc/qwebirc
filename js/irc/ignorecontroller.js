qwebirc.irc.IgnoreController = new Class({
  initialize: function(toIRCLower) {
    this.toIRCLower = toIRCLower;
    this.ignored = {};
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
    this.ignored[hostKey] = [host, new RegExp("^" + RegExp.fromIRCPattern(hostKey) + "$")];

    return hostKey;
  },
  unignore: function(host) {
    if(!this.isIgnored(host))
      return null;

    var hostKey = this.__toHostKey(host);
    delete this.ignored[hostKey];

    return hostKey;
  },
  get: function() {
    var l = [];
    for(var key in this.ignored)
      if(this.ignored.hasOwnProperty(key))
        l.push(this.ignored[key][0]);
    return l;
  },
  isIgnored: function(nick, host) {
    if(host === undefined) {
      return this.ignored[this.__toHostKey(nick)] !== undefined;
    }

    var mask = this.toIRCLower(nick + "!" + host);
    for(var key in this.ignored) {
      if(!this.ignored.hasOwnProperty(key))
        continue;

      var r = this.ignored[key][1];
      if(mask.match(r)) {
//        console.log(key + " (" + this.ignored[key][0] + ")" + " matched against " + mask);
        return true;
      }
    }
    return false;
  }
});