qwebirc.irc.NickChanEntry = function() {
  this.prefixes = "";
  this.lastSpoke = 0;
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
    var n = this.getOrCreateNick(nick);
    
    var nc = n[channel];
    if(!nc)
      return this.addNickToChannel(nick, channel);
      
    return nc;
  },
  getNickOnChannel: function(nick, channel) {
    var n = this.getNick(nick);
    if(!n)
      return;
      
    return n[channel];
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
  },
  updateLastSpoke: function(nick, channel, time) {
    var nc = this.getNickOnChannel(nick, channel);
    if($defined(nc))
      nc.lastSpoke = time;
  },
  getSortedByLastSpoke: function(channel) {
    var sorter = function(a, b) {
      return b[1].lastSpoke - a[1].lastSpoke;
    };
    
    var c = this.getChannel(channel);
    if(!c)
      return;
      
    var n = [];
    for(var k in c)
      n.push([k, c[k]]);
    
    n.sort(sorter);

    var n2 = [];
    for(var i=0;i<n.length;i++)
      n2.push(n[i][0]);
    
    return n2;
  }
});
 