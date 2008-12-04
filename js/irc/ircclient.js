qwebirc.irc.IRCClient = new Class({
  Extends: qwebirc.irc.BaseIRCClient,
  options: {
    nickname: "qwebirc",
    autojoin: "",
    maxnicks: 10
  },
  initialize: function(options, ui) {
    this.parent(options);

    this.ui = ui;

    this.prefixes = "@+";
    this.modeprefixes = "ov";
    this.windows = {};
    
    this.commandparser = new qwebirc.irc.CommandParser(this);
    this.exec = this.commandparser.dispatch.bind(this.commandparser);

    this.statusWindow = this.ui.newClient(this);
    this.lastNicks = [];
  },
  newLine: function(window, type, data) {
    if(!data)
      data = {};
      
    var w = this.getWindow(window);
    if(w) {
      w.addLine(type, data);
    } else {
      this.statusWindow.addLine(type, data);
    }
  },
  newChanLine: function(channel, type, user, extra) {
    if(!extra)
      extra = {};

    extra["n"] = user.hostToNick();
    extra["h"] = user.hostToHost();
    extra["c"] = channel;
    extra["-"] = this.nickname;
    
    this.newLine(channel, type, extra);
  },
  newServerLine: function(type, data) {
    this.statusWindow.addLine(type, data);
  },
  newActiveLine: function(type, data) {
    this.getActiveWindow().addLine(type, data);
  },
  newTargetOrActiveLine: function(target, type, data) {
    if(this.getWindow(target)) {
      this.newLine(target, type, data);
    } else {
      this.newActiveLine(type, data);
    }
  },
  updateNickList: function(channel) {
    var n1 = this.tracker.getChannel(channel);
    var names = new Array();
    var tff = String.fromCharCode(255);
    var nh = {}
    
    /* MEGAHACK */
    for(var n in n1) {
      var nc = n1[n];
      var nx;
      
      if(nc.prefixes.length > 0) {
        var c = nc.prefixes.charAt(0);
        nx = String.fromCharCode(this.prefixes.indexOf(c)) + n.toIRCLower();
        nh[nx] = c + n;
      } else {
        nx = tff + n.toIRCLower();
        nh[nx] = n;
      }
      names.push(nx);
    };
    
    names.sort();
    
    var sortednames = new Array();
    names.each(function(name) {
      sortednames.push(nh[name]);
    });
    
    var w = this.getWindow(channel);
    if(w)
      w.updateNickList(sortednames);
  },
  getWindow: function(name) {
    return this.windows[name];
  },
  newWindow: function(name, type, select) {
    var w = this.getWindow(name);
    if(!w) {
      w = this.windows[name] = this.ui.newWindow(this, type, name);
      
      w.addEvent("close", function(w) {
        delete this.windows[name];
      }.bind(this));
    }
    
    if(select)
      this.ui.selectWindow(w);
      
    return w;
  },
  newQueryWindow: function(name) {
    if(this.ui.uiOptions.DEDICATED_MSG_WINDOW)
      return this.ui.newWindow(this, qwebirc.ui.WINDOW_MESSAGES, "Messages");
    return this.newWindow(name, qwebirc.ui.WINDOW_QUERY, false);
  },
  newQueryLine: function(window, type, data, active) {
    if(this.getWindow(window))
      return this.newLine(window, type, data);
      
    var w = this.ui.getWindow(this, qwebirc.ui.WINDOW_MESSAGES);
    
    if(this.ui.uiOptions.DEDICATED_MSG_WINDOW && w) {
      return w.addLine(type, data);
    } else {
      if(active) {
        return this.newActiveLine(window, type, data);
      } else {
        return this.newLine(window, type, data);
      }
    }
  },
  newQueryOrActiveLine: function(window, type, data) {
    this.newQueryLine(window, type, data, true);
  },
  getActiveWindow: function() {
    return this.ui.getActiveIRCWindow(this);
  },
  getNickname: function() {
    return this.nickname;
  },
  addPrefix: function(nickchanentry, prefix) {
    var ncp = nickchanentry.prefixes + prefix;
    var prefixes = [];
    
    /* O(n^2) */
    for(var i=0;i<this.prefixes.length;i++) {
      var pc = this.prefixes.charAt(i);
      var index = ncp.indexOf(pc);
      if(index != -1)
        prefixes.push(pc);
    }
    
    nickchanentry.prefixes = prefixes.join("");
  },
  stripPrefix: function(nick) {
    var l = nick.charAt(0);
    if(!l)
      return nick;
      
    if(this.prefixes.indexOf(l) != -1)
      return nick.substring(1);
      
    return nick;
  },
  removePrefix: function(nickchanentry, prefix) {
    nickchanentry.prefixes = nickchanentry.prefixes.replaceAll(prefix, "");
  },
  
  /* from here down are events */
  rawNumeric: function(numeric, prefix, params) {
    this.newServerLine("RAW", {"n": "numeric", "m": params.slice(1).join(" ")});
  },
  signedOn: function(nickname) {
    this.tracker = new qwebirc.irc.IRCTracker();
    this.nickname = nickname;
    this.newServerLine("SIGNON");
    
    if(this.options.autojoin)
      this.send("JOIN " + this.options.autojoin);
  },
  userJoined: function(user, channel) {
    var nick = user.hostToNick();
    var host = user.hostToHost();
    
    if((nick == this.nickname) && !this.getWindow(channel))
      this.newWindow(channel, qwebirc.ui.WINDOW_CHANNEL, true);
    this.tracker.addNickToChannel(nick, channel);

    if(nick == this.nickname) {
      this.newChanLine(channel, "OURJOIN", user);
    } else {
      this.newChanLine(channel, "JOIN", user);
    }
    this.updateNickList(channel);
  },
  userPart: function(user, channel, message) {
    var nick = user.hostToNick();
    var host = user.hostToHost();
        
    if(nick == this.nickname) {
      this.tracker.removeChannel(channel);
    } else {
      this.tracker.removeNickFromChannel(nick, channel);
      this.newChanLine(channel, "PART", user, {"m": message});
    }
  
    this.updateNickList(channel);
    
    if(nick == this.nickname) {
      var w = this.getWindow(channel)
      if(w)
        w.close();
    }
  },
  userKicked: function(kicker, channel, kickee, message) {
    if(kickee == this.nickname) {
      this.tracker.removeChannel(channel);
      this.getWindow(channel).close();
    } else {
      this.tracker.removeNickFromChannel(kickee, channel);
      this.updateNickList(channel);
    }
      
    this.newChanLine(channel, "KICK", kicker, {"v": kickee, "m": message});
  },
  channelMode: function(user, channel, modes, raw) {
    modes.each(function(mo) {
      var direction = mo[0];
      var mode = mo[1];

      var prefixindex = this.modeprefixes.indexOf(mode);
      if(prefixindex == -1)
        return;
        
      var nick = mo[2];
      var prefixchar = this.prefixes.charAt(prefixindex);

      var nc = this.tracker.getOrCreateNickOnChannel(nick, channel);
      if(direction == "-") {
        this.removePrefix(nc, prefixchar);
      } else {
        this.addPrefix(nc, prefixchar);
      }
    }, this);

    this.newChanLine(channel, "MODE", user, {"m": raw.join(" ")});
    
    this.updateNickList(channel);
  },
  userQuit: function(user, message) {
    var nick = user.hostToNick();
    
    var channels = this.tracker.getNick(nick);
    
    var clist = [];
    for(var c in channels) {
      clist.push(c);
      this.newChanLine(c, "QUIT", user, {"m": message});
    }
    
    this.tracker.removeNick(nick);
    
    clist.each(function(cli) {
      this.updateNickList(cli);
    }, this);
  },
  nickChanged: function(user, newnick) {
    var oldnick = user.hostToNick();
    
    if(oldnick == this.nickname)
      this.nickname = newnick;
      
    this.tracker.renameNick(oldnick, newnick);

    var channels = this.tracker.getNick(newnick);
    var found = false;
    
    for(var c in channels) {
      var found = true;
      
      this.newChanLine(c, "NICK", user, {"w": newnick});
      /* TODO: rename queries */
      this.updateNickList(c);
    }

    if(!found)
      this.newChanLine(undefined, "NICK", user, {"w": newnick});
  },
  channelTopic: function(user, channel, topic) {
    this.newChanLine(channel, "TOPIC", user, {"m": topic});
    this.getWindow(channel).updateTopic(topic);
  },
  initialTopic: function(channel, topic) {
    this.getWindow(channel).updateTopic(topic);
  },
  channelCTCP: function(user, channel, type, args) {
    if(args == undefined)
      args = "";

    if(type == "ACTION") {
      this.tracker.updateLastSpoke(user.hostToNick(), channel, new Date().getTime()); 
      this.newChanLine(channel, "CHANACTION", user, {"m": args, "c": channel});
      return;
    }
    
    this.newChanLine(channel, "CHANCTCP", user, {"x": type, "m": args, "c": channel});
  },
  userCTCP: function(user, type, args) {
    var nick = user.hostToNick();
    var host = user.hostToHost();
    if(args == undefined)
      args = "";
    
    if(type == "ACTION") {      
      this.newQueryWindow(nick);
      this.newQueryLine(nick, "PRIVACTION", {"m": args, "x": type, "h": host, "n": nick});
      return;
    }
    
    this.newTargetOrActiveLine(nick, "PRIVCTCP", {"m": args, "x": type, "h": host, "n": nick, "-": this.nickname});
  },
  userCTCPReply: function(user, type, args) {
    var nick = user.hostToNick();
    var host = user.hostToHost();
    if(args == undefined)
      args = "";
    
    this.newTargetOrActiveLine(nick, "CTCPREPLY", {"m": args, "x": type, "h": host, "n": nick, "-": this.nickname});
  },
  channelPrivmsg: function(user, channel, message) {
    this.tracker.updateLastSpoke(user.hostToNick(), channel, new Date().getTime()); 
    this.newChanLine(channel, "CHANMSG", user, {"m": message});
  },
  channelNotice: function(user, channel, message) {
    this.newChanLine(channel, "CHANNOTICE", user, {"m": message});
  },
  userPrivmsg: function(user, message) {
    var nick = user.hostToNick();
    var host = user.hostToHost();
    
    this.newQueryWindow(nick);
    this.pushLastNick(nick);
    this.newQueryLine(nick, "PRIVMSG", {"m": message, "h": host, "n": nick});
  },
  serverNotice: function(message) {
    this.newServerLine("SERVERNOTICE", {"m": message});
  },
  userNotice: function(user, message) {
    var nick = user.hostToNick();
    var host = user.hostToHost();

    this.newTargetOrActiveLine(nick, "PRIVNOTICE", {"m": message, "h": host, "n": nick});
  },
  userInvite: function(user, channel) {
    var nick = user.hostToNick();
    var host = user.hostToHost();

    this.newServerLine("INVITE", {"c": channel, "h": host, "n": nick});
  },
  userMode: function(modes) {
    this.newServerLine("UMODE", {"m": modes, "n": this.nickname});
  },
  channelNames: function(channel, names) {
    if(names.length == 0) {
      this.updateNickList(channel);
      return;
    }
    
    names.each(function(nick) {
      var prefixes = [];
      var splitnick = nick.split("");
      
      splitnick.every(function(c, i) {
        if(this.prefixes.indexOf(c) == -1) {
          nick = nick.substr(i);
          return false;
        }
        
        prefixes.push(c);
        return true;
      }, this);

      var nc = this.tracker.addNickToChannel(nick, channel);
      prefixes.each(function(p) {
        this.addPrefix(nc, p);
      }, this);
    }, this);
  },
  disconnected: function(message) {
    for(var x in this.windows) {
      var w = this.windows[x];
      if(w.type == qwebirc.ui.WINDOW_CHANNEL)
        w.close();
    }
    this.tracker = undefined;
    
    this.newServerLine("DISCONNECT", {"m": message});
  },
  supported: function(key, value) {
    if(key == "PREFIX") {
      var l = (value.length - 2) / 2;

      this.modeprefixes = value.substr(1, l);
      this.prefixes = value.substr(l + 2, l);
    }
  },
  connected: function() {
    this.newServerLine("CONNECT");
  },
  serverError: function(message) {
    this.newServerLine("ERROR", {"m": message});
  },
  quit: function(message) {
    this.send("QUIT :" + message);
    this.disconnect();
  },
  awayMessage: function(nick, message) {
    this.newQueryLine(nick, "AWAY", {"n": nick, "m": message});
  },
  whois: function(nick, type, data) {
    var ndata = {"n": nick};
    var mtype;
    
    var xsend = function() {
      this.newTargetOrActiveLine(nick, "WHOIS" + mtype, ndata);
    }.bind(this);
    
    if(type == "user") {
      mtype = "USER";
      ndata.h = data.ident + "@" + data.hostname;
      xsend();
      mtype = "REALNAME";
      ndata.m = data.realname;
    } else if(type == "server") {
      mtype = "SERVER";
      ndata.x = data.server;
      ndata.m = data.serverdesc;
    } else if(type == "oper") {
      mtype = "OPER";
    } else if(type == "idle") {
      mtype = "IDLE";
      ndata.x = qwebirc.util.longtoduration(data.idle);
      ndata.m = qwebirc.irc.IRCDate(new Date(data.connected * 1000));
    } else if(type == "channels") {
      mtype = "CHANNELS";
      ndata.m = data.channels;
    } else if(type == "account") {
      mtype = "ACCOUNT";
      ndata.m = data.account;
    } else if(type == "away") {
      mtype = "AWAY";
      ndata.m = data.away;
    } else if(type == "opername") {
      mtype = "OPERNAME";
      ndata.m = data.opername;
    } else if(type == "actually") {
      mtype = "ACTUALLY";
      ndata.m = data.hostname;
      ndata.x = data.ip;
    } else if(type == "end") {
      mtype = "END";
    } else {
      return false;
    }
    
    xsend();
    return true;
  },
  genericError: function(target, message) {
    this.newTargetOrActiveLine(target, "GENERICERROR", {m: message, t: target});
  },
  genericQueryError: function(target, message) {
    this.newQueryOrActiveLine(target, "GENERICERROR", {m: message, t: target});
  },
  awayStatus: function(state, message) {
    this.newActiveLine("GENERICMESSAGE", {m: message});
  },
  pushLastNick: function(nick) {
    var i = this.lastNicks.indexOf(nick);
    if(i != -1) {
      this.lastNicks.splice(i, 1);
    } else {
      if(this.lastNicks.length == this.options.maxnicks)
        this.lastNicks.pop();
    }
    this.lastNicks.unshift(nick);
  }
});
