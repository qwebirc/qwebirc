qwebirc.irc.NickChanEntry = function() {
  this.prefixes = "";
  this.lastSpoke = 0;
}

qwebirc.irc.IRCTracker = new Class({
  initialize: function(owner) {
    this.channels = {};
    this.nicknames = {};
    this.owner = owner;
  },
  toIRCLower: function(value) {
    /* proxied because the method can change after we connect */

    return this.owner.toIRCLower(value);
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
    return this.channels[this.toIRCLower(channel)];
  },
  getOrCreateChannel: function(channel) {
    var c = this.getChannel(channel);
    if(!c)
      c = this.channels[this.toIRCLower(channel)] = {};
    return c;
  },
  getOrCreateNickOnChannel: function(nick, channel) {
    var n = this.getOrCreateNick(nick);
    
    var nc = n[this.toIRCLower(channel)];
    if(!nc)
      return this.addNickToChannel(nick, channel);
      
    return nc;
  },
  getNickOnChannel: function(nick, channel) {
    var n = this.getNick(nick);
    if(!n)
      return;
      
    return n[this.toIRCLower(channel)];
  },
  addNickToChannel: function(nick, channel) {
    var nc = new qwebirc.irc.NickChanEntry();

    var n = this.getOrCreateNick(nick);
    n[this.toIRCLower(channel)] = nc;
    
    var c = this.getOrCreateChannel(channel);
    c[nick] = nc;
    
    return nc;
  },
  removeNick: function(nick) {
    var n = this.getNick(nick);
    if(!n)
      return;
      
    for(var channel in n) {
      var lchannel = this.toIRCLower(channel);
      var c = this.channels[lchannel];
      
      delete c[nick];
      if(this.isEmpty(c))
        delete this.channels[lchannel];
    }
    delete this.nicknames[nick];
  },
  removeChannel: function(channel) {
    var c = this.getChannel(channel);
    if(!c)
      return;

    var lchannel = this.toIRCLower(channel);

    for(var nick in c) {
      var n = this.nicknames[nick];
      
      delete n[lchannel];
      if(this.isEmpty(n))
        delete this.nicknames[nick];
    }
    delete this.channels[lchannel];
  },
  removeNickFromChannel: function(nick, channel) {
    var lchannel = this.toIRCLower(channel);

    var n = this.getNick(nick);
    var c = this.getChannel(lchannel);
    if(!n || !c)
      return;
      
    delete n[lchannel];
    delete c[nick];
    
    if(this.isEmpty(n))
      delete this.nicknames[nick];
    if(this.isEmpty(c))
      delete this.channels[lchannel];
  },
  renameNick: function(oldnick, newnick) {
    var n = this.getNick(oldnick);
    if(!n)
      return;
      
    for(var channel in n) {
      var lchannel = this.toIRCLower(channel);
      this.channels[lchannel][newnick] = this.channels[lchannel][oldnick];
      delete this.channels[lchannel][oldnick];
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

