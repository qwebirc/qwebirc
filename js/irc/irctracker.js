qwebirc.irc.NickChanEntry = function() {
  this.prefixes = "";
  this.lastSpoke = -Infinity;
};

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
      c.remove(oldnick);
    }, this);
    
    this.nicknames.put(newnick, this.nicknames.get(oldnick));
    this.nicknames.remove(oldnick);
  },
  updateLastSpoke: function(nick, channel, time) {
    var nc = this.getNickOnChannel(nick, channel);
    if($defined(nc))
      nc.lastSpoke = time;
  },
  __mapAndSortEntries: function(channel, fn, pos) {
    var c = this.getChannel(channel);
    if(!c)
      return;

    var n = c.map(fn);
    n.sort(qwebirc.util.arrayCmp);

    var n2 = [];
    for(var i=0;i<n.length;i++)
      n2.push(n[i][pos]);

    return n2;
  },
  getSortedByLastSpoke: function(channel) {
    var l = this.toIRCLower.bind(this);
    return this.__mapAndSortEntries(channel, function(nick, nc) {
      return [-nc.lastSpoke, l(nick)];
    }, 2);
  },
  getSortedByLastSpokePrefix: function(channel) {
    var p = this.owner.getPrefixPriority.bind(this.owner);
    var l = this.toIRCLower.bind(this);
    return this.__mapAndSortEntries(channel, function(nick, nc) {
      return [-nc.lastSpoke, p(nc.prefixes), l(nick), nick];
    }, 3);
  }
});
