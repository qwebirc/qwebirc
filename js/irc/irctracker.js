qwebirc.irc.NickChanEntry = function() {
  this.prefixes = "";
  this.lastSpoke = 0;
}

qwebirc.irc.IRCTracker = new Class({
  initialize: function(owner) {
    this.channels = new QHash();
    this.nicknames = new QHash();
    this.owner = owner;
  },
  toIRCLower: function(value) {
    /* proxied because the method can change after we connect */

    return this.owner.toIRCLower(value);
  },
  getNick: function(nick) {
    return this.nicknames.get(nick);
  },
  getOrCreateNick: function(nick) {
    var n = this.getNick(nick);
    if(!n) {
      n = new QHash();
      this.nicknames.put(nick, n);
    }
    return n;
  },
  getChannel: function(channel) {
    return this.channels.get(this.toIRCLower(channel));
  },
  getOrCreateChannel: function(channel) {
    var c = this.getChannel(channel);
    if (!c) {
      c = new QHash();
      this.channels.put(this.toIRCLower(channel), c);
    }
    return c;
  },
  getOrCreateNickOnChannel: function(nick, channel) {
    var n = this.getOrCreateNick(nick);
    
    var nc = n.get(this.toIRCLower(channel));
    if(!nc)
      return this.addNickToChannel(nick, channel);
      
    return nc;
  },
  getNickOnChannel: function(nick, channel) {
    var n = this.getNick(nick);
    if(!n)
      return;
      
    return n.get(this.toIRCLower(channel));
  },
  addNickToChannel: function(nick, channel) {
    var nc = new qwebirc.irc.NickChanEntry();

    var n = this.getOrCreateNick(nick);
    n.put(this.toIRCLower(channel), nc);
    
    var c = this.getOrCreateChannel(channel);
    c.put(nick, nc);
    
    return nc;
  },
  removeNick: function(nick) {
    var n = this.getNick(nick);
    if(!n)
      return;
      
    n.each(function(channel) {
      var lchannel = this.toIRCLower(channel);
      var c = this.channels.get(lchannel);

      c.remove(nick);
      if(c.isEmpty())
        this.channels.remove(lchannel);
    }, this);
    this.nicknames.remove(nick);
  },
  removeChannel: function(channel) {
    var c = this.getChannel(channel);
    if(!c)
      return;

    var lchannel = this.toIRCLower(channel);

    c.each(function(nick) {
      var n = this.nicknames.get(nick);
      
      n.remove(lchannel);
      if(n.isEmpty())
        this.nicknames.remove(nick);
    }, this);
    this.channels.remove(lchannel);
  },
  removeNickFromChannel: function(nick, channel) {
    var lchannel = this.toIRCLower(channel);

    var n = this.getNick(nick);
    var c = this.getChannel(lchannel);
    if(!n || !c)
      return;
      
    n.remove(lchannel);
    c.remove(nick);
    
    if(n.isEmpty())
      this.nicknames.remove(nick);
    if(c.isEmpty())
      this.channels.remove(lchannel);
  },
  renameNick: function(oldnick, newnick) {
    var n = this.getNick(oldnick);
    if(!n)
      return;
      
    n.each(function(channel) {
      var c = this.channels.get(this.toIRCLower(channel));
      c.put(newnick, c.get(oldnick));
      c.remove[oldnick];
    }, this);
    
    this.nicknames.put(newnick, this.nicknames.get(oldnick));
    this.nicknames.remove(oldnick);
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
      
    var n = c.items();
    n.sort(sorter);

    var n2 = [];
    for(var i=0;i<n.length;i++)
      n2.push(n[i][0]);
    
    return n2;
  }
});
