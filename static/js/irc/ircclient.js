function IRCClient(nickname, ui, autojoin) {
  var self = this;
  this.prefixes = "@+";
  this.modeprefixes = "ov";
  
  var newLine = function(window, type, data) {
    if(!data)
      data = {};
      
    ui.newLine(window, type, data);
  }
  
  var newChanLine = function(channel, type, user, extra) {
    if(!extra)
      extra = {};

    extra["n"] = hosttonick(user);
    extra["h"] = hosttohost(user);
    extra["c"] = channel;
    extra["-"] = self.nickname;
    
    newLine(channel, type, extra);
  }
  
  var newServerLine = function(type, data) {
    newLine("", type, data);
  }

  var newActiveLine = function(type, data) {
    newLine(false, type, data);
  }
  
  this.rawNumeric = function(numeric, prefix, params) {
    newServerLine("RAW", {"n": "numeric", "m": params.slice(1).join(" ")});
  }
  
  this.signedOn = function(nickname) {
    self.tracker = new IRCTracker();
    self.nickname = nickname;
    newServerLine("SIGNON");
    
    if(autojoin)
      self.send("JOIN " + autojoin);
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
      ui.newWindow(channel, true);
      ui.selectTab(channel);
    }
    self.tracker.addNickToChannel(nick, channel);

    newChanLine(channel, "JOIN", user);
    
    self.updateNickList(channel);
  }
  
  this.userPart = function(user, channel, message) {
    var nick = hosttonick(user);
    var host = hosttohost(user);
        
    if(nick == self.nickname) {
      self.tracker.removeChannel(channel);
    } else {
      self.tracker.removeNickFromChannel(nick, channel);
      newChanLine(channel, "PART", user, {"m": message});
    }
  
    self.updateNickList(channel);
    
    if(nick == self.nickname)
      ui.closeWindow(channel);      
  }

  this.userKicked = function(kicker, channel, kickee, message) {
    if(kickee == self.nickname) {
      self.tracker.removeChannel(channel);
      ui.closeWindow(channel);
    } else {
      self.tracker.removeNickFromChannel(kickee, channel);
      self.updateNickList(channel);
    }
      
    newChanLine(channel, "KICK", kicker, {"v": kickee, "m": message});
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

    newChanLine(channel, "MODE", user, {"m": raw.join(" ")});
    
    self.updateNickList(channel);
  }

  this.userQuit = function(user, message) {
    var nick = hosttonick(user);
    
    var channels = self.tracker.getNick(nick);
    
    var clist = [];
    for(var c in channels) {
      clist.push(c);
      newChanLine(c, "QUIT", user, {"m": message});
    }
    
    self.tracker.removeNick(nick);
    
    forEach(clist, function(cli) {
      self.updateNickList(cli);
    });
  }

  this.nickChanged = function(user, newnick) {
    var oldnick = hosttonick(user);
    
    if(oldnick == self.nickname)
      self.nickname = newnick;
      
    self.tracker.renameNick(oldnick, newnick);

    var channels = self.tracker.getNick(newnick);
    
    for(var c in channels) {
      newChanLine(c, "NICK", user, {"w": newnick});
      /* TODO: rename queries */
      self.updateNickList(c);
    }
  }
  
  this.channelTopic = function(user, channel, topic) {
    newChanLine(channel, "TOPIC", user, {"m": topic});
    ui.updateTopic(channel, topic);
  }
  
  this.initialTopic = function(channel, topic) {
    ui.updateTopic(channel, topic);
  }
  
  this.chanCTCP = function(user, channel, type, args) {
    if(args == undefined)
      args = "";

    if(type == "ACTION") {
      newChanLine(channel, "CHANACTION", user, {"m": args, "c": channel});
      return;
    }
    
    newChanLine(channel, "CHANCTCP", user, {"x": type, "m": args, "c": channel});
  }
  
  this.userCTCP = function(user, type, args) {
    var nick = hosttonick(user);
    var host = hosttohost(user);
    if(args == undefined)
      args = "";
    
    if(type == "ACTION") {      
      ui.newWindow(nick, false);
      newLine(nick, "PRIVACTION", {"m": args, "x": type, "h": host, "n": nick});
      return;
    }
    
    if(ui.getWindow(nick)) {
      newLine(nick, "PRIVCTCP", {"m": args, "x": type, "h": host, "n": nick, "-": self.nickname});
    } else {
      newActiveLine("PRIVCTCP", {"m": args, "x": type, "h": host, "n": nick, "-": self.nickname});
    }
  }
  
  this.userCTCPReply = function(user, type, args) {
    var nick = hosttonick(user);
    var host = hosttohost(user);
    if(args == undefined)
      args = "";
    
    if(ui.getWindow(nick)) {
      newLine(nick, "CTCPREPLY", {"m": args, "x": type, "h": host, "n": nick, "-": self.nickname});
    } else {
      newActiveLine("CTCPREPLY", {"m": args, "x": type, "h": host, "n": nick, "-": self.nickname});
    }
  }
  
  this.channelPrivmsg = function(user, channel, message) {
    newChanLine(channel, "CHANMSG", user, {"m": message});
  }

  this.channelNotice = function(user, channel, message) {
    newChanLine(channel, "CHANNOTICE", user, {"m": message});
  }

  this.userPrivmsg = function(user, message) {
    var nick = hosttonick(user);
    var host = hosttohost(user);
    ui.newWindow(nick, false);
    newLine(nick, "PRIVMSG", {"m": message, "h": host, "n": nick});
  }
  
  this.serverNotice = function(message) {
    newServerLine("SERVERNOTICE", {"m": message});
  }
  
  this.userNotice = function(user, message) {
    var nick = hosttonick(user);
    var host = hosttohost(user);

    if(ui.getWindow(nick)) {
      newLine(nick, "PRIVNOTICE", {"m": message, "h": host, "n": nick});
    } else {
      newActiveLine("PRIVNOTICE", {"m": message, "h": host, "n": nick});
    }
  }
  
  this.userInvite = function(user, channel) {
    var nick = hosttonick(user);
    var host = hosttohost(user);

    newServerLine("INVITE", {"c": channel, "h": host, "n": nick});
  }
  
  this.userMode = function(modes) {
    newServerLine("UMODE", {"m": modes, "n": self.nickname});
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
    nickchanentry.prefixes = nickchanentry.prefixes.replaceAll(prefix, "");
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
    for(var x in this.parent.channels) {
      ui.closeWindow(x);
    }

    self.tracker = undefined;
    
    newServerLine("DISCONNECT");
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
    newServerLine("CONNECT");
  }
  
  this.serverError = function(message) {
    newServerLine("ERROR", {"m": message});
  }
  
  this.send = this.parent.send;
  this.parent = new BaseIRCClient(nickname, this);
  this.commandparser = new CommandParser(ui, this.parent.send);
  ui.send = this.commandparser.dispatch;
  ui.getNickname = function() {
    return self.nickname;
  }
  
  this.connect = this.parent.connect;
  this.disconnect = this.parent.disconnect;
}
