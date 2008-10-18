qwebirc.irc.NickChanEntry = function() {
  this.prefixes = "";
}

qwebirc.irc.IRCTracker = new Class({
  initialize: function() {
    this.channels = {};
    this.nicknames = {};
  },
  isEmpty: function(hash) {
    for(var x in hash)
      return false;
    return true;
  },
  getNick: function(nick) {
    return this.nicknames[nick];
  },
  getOrCreateNick: function(nick) {
    var n = this.getNick(nick);
    if(!n)
      n = this.nicknames[nick] = {};
    return n;
  },
  getChannel: function(channel) {
    return this.channels[channel];
  },
  getOrCreateChannel: function(channel) {
    var c = this.getChannel(channel);
    if(!c)
      c = this.channels[channel] = {};
    return c;
  },
  getOrCreateNickOnChannel: function(nick, channel) {
    var n = this.getNick(nick);
    
    var nc = n[channel];
    if(!nc)
      return this.addNickToChannel(nick, channel);
      
    return nc;
  },
  addNickToChannel: function(nick, channel) {
    var nc = new qwebirc.irc.NickChanEntry();

    var n = this.getOrCreateNick(nick);
    n[channel] = nc;
    
    var c = this.getOrCreateChannel(channel);
    c[nick] = nc;
    
    return nc;
  },
  removeNick: function(nick) {
    var n = this.getNick(nick);
    if(!n)
      return;
      
    for(var channel in n) {
      var c = this.channels[channel];
      
      delete c[nick];
      if(this.isEmpty(c))
        delete this.channels[channel];
    }
    delete this.nicknames[nick];
  },
  removeChannel: function(channel) {
    var c = this.getChannel(channel);
    if(!c)
      return;
      
    for(var nick in c) {
      var n = this.nicknames[nick];
      
      delete n[channel];
      if(this.isEmpty(n))
        delete this.nicknames[nick];
    }
    delete this.channels[channel];
  },
  removeNickFromChannel: function(nick, channel) {
    var n = this.getNick(nick);
    var c = this.getChannel(channel);
    if(!n || !c)
      return;
      
    delete n[channel];
    delete c[nick];
    
    if(this.isEmpty(n))
      delete this.nicknames[nick];
    if(this.isEmpty(c))
      delete this.channels[channel];
  },
  renameNick: function(oldnick, newnick) {
    var n = this.getNick(oldnick);
    if(!n)
      return;
      
    for(var channel in n) {
      this.channels[channel][newnick] = this.channels[channel][oldnick];
      delete this.channels[channel][oldnick];
    }    
    
    this.nicknames[newnick] = this.nicknames[oldnick];
    delete this.nicknames[oldnick];
  }
});
