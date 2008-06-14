function IRCClient(nickname, ui) {
  var self = this;
  this.prefixes = "@+";
  this.modeprefixes = "ov";
  
  this.rawNumeric = function(numeric, prefix, params) {
    ui.newLine("", params.slice(1));
  }
  
  this.signedOn = function(nickname) {
    self.tracker = new IRCTracker();
    self.nickname = nickname;
    ui.newLine("", "Signed on!");
  }

  this.updateNickList = function(channel) {
    var n1 = self.tracker.getChannel(channel);
    var names = new Array();
    var tff = String.fromCharCode(255);
    var nh = {}
    
    /* MEGAHACK */
    for(var n in n1) {
      var nc = n1[n];
      var nx;
      
      if(nc.prefixes.length > 0) {
        var c = nc.prefixes.charAt(0);
        nx = String.fromCharCode(self.prefixes.indexOf(c)) + toIRCLower(n);
        nh[nx] = c + n;
      } else {
        nx = tff + toIRCLower(n);
        nh[nx] = n;
      }
      names.push(nx);
    };
    
    names.sort();
    
    var sortednames = new Array();
    forEach(names, function(name) {
      sortednames.push(nh[name]);
    });
    ui.updateNickList(channel, sortednames);
  }
  
  this.userJoined = function(user, channel) {
    var nick = hosttonick(user);
    var host = hosttohost(user);
    
    if(nick == self.nickname) {
      /* */
    }
    self.tracker.addNickToChannel(nick, channel);

    ui.newLine(channel, "== " + nick + " [" + host + "] has joined " + channel);
    
    self.updateNickList(channel);
  }
  
  this.userPart = function(user, channel, message) {
    var nick = hosttonick(user);
    var host = hosttohost(user);
        
    if(nick == self.nickname) {
      self.tracker.removeChannel(channel);
    } else {
      self.tracker.removeNickFromChannel(nick, channel);
    }
    
    ui.newLine(channel, "== " + nick + " [" + host + "] left " + channel);
    
    self.updateNickList(channel);
  }

  this.userKicked = function(kicker, channel, kickee, message) {
    if(kickee == self.nickname) {
      self.tracker.removeChannel(channel);
    } else {
      self.tracker.removeNickFromChannel(kickee, channel);
    }
    
    var kickernick = hosttonick(kicker);
    ui.newLine(channel, "== " + kickee + " was kicked from " + channel + " by " + kickernick + " [" + message + "]");
    self.updateNickList(channel);
  }
  
  this.channelMode = function(user, channel, modes, raw) {
    forEach(modes, function(mo) {
      var direction = mo[0];
      var mode = mo[1];

      var prefixindex = self.modeprefixes.indexOf(mode);
      if(prefixindex == -1)
        return;
        
      var nick = mo[2];
      var prefixchar = self.prefixes.charAt(prefixindex);

      var nc = self.tracker.getOrCreateNickOnChannel(nick, channel);
      if(direction == "-") {
        self.removePrefix(nc, prefixchar);
      } else {
        self.addPrefix(nc, prefixchar);
      }
    });
    
    var nick = hosttonick(user);
    
    ui.newLine(channel, "== mode/" + channel + " [" + raw.join(" ") + "] by " + nick);
    
    self.updateNickList(channel);
  }

  this.userQuit = function(user, message) {
    var nick = hosttonick(user);
    var host = hosttohost(user);
    
    var channels = self.tracker.getNick(nick);
    
    var clist = [];
    for(var c in channels) {
      clist.push(c);
      ui.newLine(c, "== " + nick + " [" + host + "] has quit [" + message + "]");
    }
    
    self.tracker.removeNick(nick);
    
    forEach(clist, function(cli) {
      this.updateNickList(cli);
    });
  }

  this.nickChanged = function(user, newnick) {
    var oldnick = hosttonick(user);
    
    if(oldnick == self.nickname)
      self.nickname = newnick;
      
    self.tracker.renameNick(oldnick, newnick);

    var channels = self.tracker.getNick(newnick);
    
    for(var c in channels) {
      ui.newLine(c, "* " + oldnick + " changed nick to " + newnick);
      this.updateNickList(c);
    }
  }
  
  this.channelTopic = function(user, channel, topic) {
    var nick = hosttonick(user);
    
    ui.newLine(channel, "== " + nick + " changed the topic of " + channel + " to: " + topic);
    ui.updateTopic(channel, topic);
  }
  
  this.initialTopic = function(channel, topic) {
    ui.updateTopic(channel, topic);
  }
  
  this.channelPrivmsg = function(user, channel, message) {
    var nick = hosttonick(user);
    
    ui.newLine(channel, "<" + nick + "> " + message);
  }

  this.channelNotice = function(user, channel, message) {
    var nick = hosttonick(user);
    ui.newLine(channel, "-" + nick + "- " + message);
  }

  this.userPrivmsg = function(user, message) {
    var nick = hosttonick(user);
    
    ui.newLine("", "*" + nick + "* " + message);
  }
  
  this.serverNotice = function(message) {
    ui.newLine("", "-server- " + message);
  }
  
  this.userNotice = function(user, message) {
    ui.newLine("", "-(" + user + ")- " + message);
  }
  
  this.userInvite = function(user, channel) {
    var nick = hosttonick(user);
    ui.newLine("", "* " + nick + " invites you to join " + channel);
  }
  
  this.userMode = function(modes) {
    ui.newLine("", "MODE " + self.nickname + " " + modes);
  }
  
  this.addPrefix = function(nickchanentry, prefix) {
    var ncp = nickchanentry.prefixes + prefix;
    var prefixes = new Array();
    
    /* O(n^2) */
    for(var i=0;i<self.prefixes.length;i++) {
      var pc = self.prefixes.charAt(i);
      var index = ncp.indexOf(pc);
      if(index != -1)
        prefixes.push(pc);
    }
    
    nickchanentry.prefixes = prefixes.join("");
  }
  
  this.removePrefix = function(nickchanentry, prefix) {
    nickchanentry.prefixes = nickchanentry.prefixes.replace(prefix, "");
  }

  this.channelNames = function(channel, names) {
    if(names.length == 0) {
      self.updateNickList(channel);
      return;
    }
    
    forEach(names, function(nick) {
      var prefixes = [];
      var splitnick = nick.split("");
      
      var i = 0;
      forEach(splitnick, function(c) {
        if(self.prefixes.indexOf(c) == -1) {
          nick = nick.substr(i);
          return true;
        }
        
        prefixes.push(c);
        i++;
      });

      var nc = self.tracker.addNickToChannel(nick, channel);
      forEach(prefixes, function(p) {
        self.addPrefix(nc, p);
      });
    });
  }
  
  this.disconnected = function() {
    self.tracker = undefined;
    
    ui.newLine("", "== Disconnected");
    self.disconnect();
  }
  
  this.supported = function(key, value) {
    if(key == "PREFIX") {
      var l = (value.length - 2) / 2;

      self.modeprefixes = value.substr(1, l);
      self.prefixes = value.substr(l + 2, l);
    }    
  }
  
  this.connected = function() {
    ui.newLine("", "== Connected!");
  }
  
  this.serverError = function(message) {
    ui.newLine("", "== ERROR: " + message);
  }
  
  this.parent = new BaseIRCClient(nickname, this);
  ui.send = this.parent.send;
  this.connect = this.parent.connect;
  this.disconnect = this.parent.disconnect;
}
