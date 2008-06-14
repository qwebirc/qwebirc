function NickChanEntry() {
  this.prefixes = "";
}

function IRCTracker() {
  var self = this;
  
  this.channels = {};
  this.nicknames = {};
  
  this.getNick = function(nick) {
    return self.nicknames[nick];
  }
  
  this.getOrCreateNick = function(nick) {
    var n = self.getNick(nick);
    if(!n)
      n = self.nicknames[nick] = {};
    return n;
  }

  this.getChannel = function(channel) {
    return self.channels[channel];
  }
  
  this.getOrCreateChannel = function(channel) {
    var c = self.getChannel(channel);
    if(!c)
      c = self.channels[channel] = {};
    return c;
  }
  
  this.getOrCreateNickOnChannel = function(nick, channel) {
    var n = self.getNick(nick);
    
    var nc = n[channel];
    if(!nc)
      return self.addNickToChannel(nick, channel);
      
    return nc;
  }

  this.addNickToChannel = function(nick, channel) {
    var nc = new NickChanEntry();

    var n = self.getOrCreateNick(nick);
    n[channel] = nc;
    
    var c = self.getOrCreateChannel(channel);
    c[nick] = nc;
    
    return nc;
  }
  
  this.removeNick = function(nick) {
    var n = self.getNick(nick);
    if(!n)
      return;
      
    for(var channel in n) {
      var c = self.channels[channel];
      
      delete c[nick];
      if(empty(c))
        delete self.channels[channel];
    }
    delete self.nicknames[nick];
  }
  
  this.removeChannel = function(channel) {
    var c = self.getChannel(channel);
    if(!c)
      return;
      
    for(var nick in c) {
      var n = self.nicknames[nick];
      
      delete n[channel];
      if(empty(n))
        delete self.nicknames[nick];
    }
    delete self.channels[channel];
  }
  
  this.removeNickFromChannel = function(nick, channel) {
    var n = self.getNick(nick);
    var c = self.getChannel(channel);
    if(!n || !c)
      return;
      
    delete n[channel];
    delete c[nick];
    
    if(empty(n))
      delete self.nicknames[nick];
    if(empty(c))
      delete self.channels[channel];
  }
  
  this.renameNick = function(oldnick, newnick) {
    var n = self.getNick(oldnick);
    if(!n)
      return;
      
    for(var channel in n) {
      self.channels[channel][newnick] = self.channels[channel][oldnick];
      delete self.channels[channel][oldnick];
    }    
    
    self.nicknames[newnick] = self.nicknames[oldnick];
    delete self.nicknames[oldnick];
  }
}