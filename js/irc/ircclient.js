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
    this.windows = new QHash();
    
    this.commandparser = new qwebirc.irc.Commands(this);
    this.exec = this.commandparser.dispatch.bind(this.commandparser);

    this.statusWindow = this.ui.newClient(this);
    this.lastNicks = [];
    
    this.inviteChanList = [];
    this.activeTimers = {};
    
    this.loginRegex = new RegExp(this.ui.options.loginRegex);
    this.tracker = new qwebirc.irc.IRCTracker(this);

    this.__silenceSupported = false;
    this.__silenced = null;
    this.ignoreController = new qwebirc.irc.IgnoreController(function(x) { return this.toIRCLower(x) }.bind(this));
  },
  connect: function() {
    this.parent();
    this.newServerInfoLine("CONNECTING", "");
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

    if($defined(user)) {
      extra["n"] = user.hostToNick();
      extra["h"] = user.hostToHost();
    }
    extra["c"] = channel;
    extra["-"] = this.nickname;
    
    if(!(this.ui.uiOptions.NICK_OV_STATUS))
      delete extra["@"];
      
    this.newLine(channel, type, extra);
  },
  newServerLine: function(type, data) {
    this.statusWindow.addLine(type, data);
  },
  newServerInfoLine: function(type, data) {
    this.statusWindow.infoMessage(type, data);
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
  getPrefixPriority: function(prefixes) {
    if (prefixes.length > 0) {
      var c = prefixes.charAt(0);
      var p = this.prefixes.indexOf(c);
      if(p > -1)
        return p;
    }
    return Infinity;
  },
  updateNickList: function(channel) {
    var names = [];
    var nh = new QHash();

    var n1 = this.tracker.getChannel(channel);
    if($defined(n1)) {
      n1.each(function (n, nc) {
        var prefix, pri = this.getPrefixPriority(nc.prefixes);
        if(nc.prefixes.length > 0) {
          prefix = nc.prefixes.charAt(0);
        } else {
          prefix = "";
        }
        names.push([pri, this.toIRCLower(n), prefix + n]);
      }, this);
    }
    names.sort(qwebirc.util.arrayCmp);
    
    var sortednames = [];
    names.each(function(name) {
      sortednames.push(name[2]);
    });
    
    var w = this.getWindow(channel);
    if(w)
      w.updateNickList(sortednames);
  },
  getWindow: function(name) {
    return this.windows.get(this.toIRCLower(name));
  },
  renameWindow: function(oldname, newname) {
    var oldwindow = this.getWindow(oldname);
    if(!oldwindow || this.getWindow(newname))
      return;

    var window = this.ui.renameWindow(oldwindow, newname);
    if(window) {
      this.windows.put(this.toIRCLower(newname), window);
      this.windows.remove(this.toIRCLower(oldname));
    }
  },
  newWindow: function(name, type, select) {
    var w = this.getWindow(name);
    if(!w) {
      w = this.ui.newWindow(this, type, name);
      this.windows.put(this.toIRCLower(name), w);
      
      w.addEvent("close", function(w) {
        this.windows.remove(this.toIRCLower(w.name));
      }.bind(this));
    }
    
    if(select)
      this.ui.selectWindow(w);
      
    return w;
  },
  getQueryWindow: function(name) {
    return this.ui.getWindow(this, qwebirc.ui.WINDOW_QUERY, name);
  },
  newQueryWindow: function(name, privmsg) {
    var e;

    if(this.getQueryWindow(name))
      return;
    
    if(privmsg)
      return this.newPrivmsgQueryWindow(name);
    return this.newNoticeQueryWindow(name);
  },
  newPrivmsgQueryWindow: function(name) {
    if(this.ui.uiOptions.DEDICATED_MSG_WINDOW) {
      if(!this.ui.getWindow(this, qwebirc.ui.WINDOW_MESSAGES))
        return this.ui.newWindow(this, qwebirc.ui.WINDOW_MESSAGES, "Messages");
    } else {
      return this.newWindow(name, qwebirc.ui.WINDOW_QUERY, false);
    }
  },
  newNoticeQueryWindow: function(name) {
    if(this.ui.uiOptions.DEDICATED_NOTICE_WINDOW)
      if(!this.ui.getWindow(this, qwebirc.ui.WINDOW_MESSAGES))
        return this.ui.newWindow(this, qwebirc.ui.WINDOW_MESSAGES, "Messages");
  },
  newQueryLine: function(window, type, data, privmsg, active) {
    if(this.getQueryWindow(window))
      return this.newLine(window, type, data);
      
    var w = this.ui.getWindow(this, qwebirc.ui.WINDOW_MESSAGES);
    
    var e;
    if(privmsg) {
      e = this.ui.uiOptions.DEDICATED_MSG_WINDOW;
    } else {
      e = this.ui.uiOptions.DEDICATED_NOTICE_WINDOW;
    }
    if(e && w) {
      return w.addLine(type, data);
    } else {
      if(active) {
        return this.newActiveLine(type, data);
      } else {
        return this.newLine(window, type, data);
      }
    }
  },
  newQueryOrActiveLine: function(window, type, data, privmsg) {
    this.newQueryLine(window, type, data, privmsg, true);
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
    this.tracker = new qwebirc.irc.IRCTracker(this);
    this.nickname = nickname;
    this.newServerLine("SIGNON");
    
    /* we guarantee that +x is sent out before the joins */
    if(this.ui.uiOptions.USE_HIDDENHOST)
      this.exec("/UMODE +x");

    if(this.options.autojoin) {
      if(qwebirc.auth.loggedin(false) && this.ui.uiOptions.USE_HIDDENHOST) {
        var d = function() {
          if($defined(this.activeTimers.autojoin))
            this.ui.getActiveWindow().infoMessage("Waiting for login before joining channels...");
        }.delay(5, this);
        this.activeTimers.autojoin = function() {
          var w = this.ui.getActiveWindow();
          w.errorMessage("No login response in 10 seconds.");
          w.errorMessage("You may want to try authing manually and then type: /autojoin (if you don't auth your host may be visible).");
        }.delay(10000, this);
        return;
      }

      this.exec("/AUTOJOIN");
    } else {
      var d = function() { this.newServerInfoLine("CONNECTED", ""); }.delay(1000, this);
    }

    this.fireEvent("signedOn");
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
      if(!this.ui.uiOptions.HIDE_JOINPARTS) {
        this.newChanLine(channel, "JOIN", user);
      }
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
      if(!this.ui.uiOptions.HIDE_JOINPARTS) {
        this.newChanLine(channel, "PART", user, {"m": message});
      }
    }

    this.updateNickList(channel);

    if(nick == this.nickname) {
      var w = this.getWindow(channel);
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

    var clist = [];
    var channels = this.tracker.getNick(nick);
    if($defined(channels)) {
      channels.each(function (c) {
        clist.push(c);
        if (!this.ui.uiOptions.HIDE_JOINPARTS) {
          this.newChanLine(c, "QUIT", user, {"m": message});
        }
      }, this);
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

    var found = false;

    var channels = this.tracker.getNick(newnick);
    if($defined(channels)) {
      channels.each(function (c) {
        found = true;

        this.newChanLine(c, "NICK", user, {"w": newnick});
        this.updateNickList(c);
      }, this);
    }

    if(this.getQueryWindow(oldnick)) {
      found = true;
      this.renameWindow(oldnick, newnick);
      this.newLine(newnick, "NICK", {"n": oldnick, "w": newnick});
    }
    
    /* this is quite horrible */
    if(!found)
      this.newServerLine("NICK", {"w": newnick, n: user.hostToNick(), h: user.hostToHost(), "-": this.nickname});
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

    var nick = user.hostToNick();
    if(type == "ACTION") {
      this.tracker.updateLastSpoke(nick, channel, new Date().getTime()); 
      this.newChanLine(channel, "CHANACTION", user, {"m": args, "c": channel, "@": this.getNickStatus(channel, nick)});
      return;
    }
    
    this.newChanLine(channel, "CHANCTCP", user, {"x": type, "m": args, "c": channel, "@": this.getNickStatus(channel, nick)});
  },
  userCTCP: function(user, type, args) {
    var nick = user.hostToNick();
    var host = user.hostToHost();
    if(args == undefined)
      args = "";
    
    if(type == "ACTION") {      
      this.newQueryWindow(nick, true);
      this.newQueryLine(nick, "PRIVACTION", {"m": args, "x": type, "h": host, "n": nick}, true);
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
  getNickStatus: function(channel, nick) {
    var n = this.tracker.getNickOnChannel(nick, channel);
    if(!$defined(n))
      return "";
      
    if(n.prefixes.length == 0)
      return "";
      
    return n.prefixes.charAt(0);
  },
  channelPrivmsg: function(user, channel, message) {
    var nick = user.hostToNick();
    var host = user.hostToHost();

    if(this.isIgnored(nick, host))
      return;

    this.tracker.updateLastSpoke(nick, channel, new Date().getTime()); 
    this.newChanLine(channel, "CHANMSG", user, {"m": message, "@": this.getNickStatus(channel, nick)});
  },
  channelNotice: function(user, channel, message) {
    var nick = user.hostToNick();
    var host = user.hostToHost();

    if(this.isIgnored(nick, host))
      return;

    this.newChanLine(channel, "CHANNOTICE", user, {"m": message, "@": this.getNickStatus(channel, user.hostToNick())});
  },
  userPrivmsg: function(user, message) {
    var nick = user.hostToNick();
    var host = user.hostToHost();

    if(this.isIgnored(nick, host))
      return;

    this.newQueryWindow(nick, true);
    this.pushLastNick(nick);
    this.newQueryLine(nick, "PRIVMSG", {"m": message, "h": host, "n": nick}, true);

    this.checkLogin(user, message);
  },
  checkLogin: function(user, message) {
    if(this.isNetworkService(user) && $defined(this.activeTimers.autojoin)) {
      if($defined(this.loginRegex) && message.match(this.loginRegex)) {
        $clear(this.activeTimers.autojoin);
        delete this.activeTimers["autojoin"];
        this.ui.getActiveWindow().infoMessage("Joining channels...");
        this.exec("/AUTOJOIN");
      }
    }
  },
  serverNotice: function(user, message) {
    if(user == "") {
      this.newServerLine("SERVERNOTICE", {"m": message});
    } else {
      this.newServerLine("PRIVNOTICE", {"m": message, "n": user});
    }
  },
  userNotice: function(user, message) {
    var nick = user.hostToNick();
    var host = user.hostToHost();

    if(this.isIgnored(nick, host))
      return;

    if(this.ui.uiOptions.DEDICATED_NOTICE_WINDOW) {
      this.newQueryWindow(nick, false);
      this.newQueryOrActiveLine(nick, "PRIVNOTICE", {"m": message, "h": host, "n": nick}, false);
    } else {
      this.newTargetOrActiveLine(nick, "PRIVNOTICE", {"m": message, "h": host, "n": nick});
    }
    
    this.checkLogin(user, message);
  },
  isNetworkService: function(user) {
    return this.ui.options.networkServices.indexOf(user) > -1;
  },
  __joinInvited: function() {
    this.exec("/JOIN " + this.inviteChanList.join(","));
    this.inviteChanList = [];
    delete this.activeTimers["serviceInvite"];
  },
  userInvite: function(user, channel) {
    var nick = user.hostToNick();
    var host = user.hostToHost();

    if(this.isIgnored(nick, host))
      return;

    this.newServerLine("INVITE", {"c": channel, "h": host, "n": nick});
    if(this.ui.uiOptions.ACCEPT_SERVICE_INVITES && this.isNetworkService(user)) {
      if(this.activeTimers.serviceInvite)
        $clear(this.activeTimers.serviceInvite);
        
      /* we do this so we can batch the joins, i.e. instead of sending 5 JOIN comands we send 1 with 5 channels. */
      this.activeTimers.serviceInvite = this.__joinInvited.delay(100, this);
      
      this.inviteChanList.push(channel);
    }
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
    var toClose = [];
    this.windows.each(function(k, v) {
      if(v.type == qwebirc.ui.WINDOW_CHANNEL)
        toClose.push(v);
    });
    for(var i=0;i<toClose.length;i++)
      toClose[i].close();

    this.tracker = undefined;
    
    qwebirc.connected = false;
    this.newServerLine("DISCONNECT", {"m": message});
  },
  nickOnChanHasPrefix: function(nick, channel, prefix) {
    var entry = this.tracker.getNickOnChannel(nick, channel);
    if(!$defined(entry))
      return false; /* shouldn't happen */
   
    return entry.prefixes.indexOf(prefix) != -1;
  },
  nickOnChanHasAtLeastPrefix: function(nick, channel, prefix) {
    var entry = this.tracker.getNickOnChannel(nick, channel);
    if(!$defined(entry))
      return false; /* shouldn't happen */
   
    /* this array is sorted */
    var pos = this.prefixes.indexOf(prefix);
    if(pos == -1)
      return false;  /* shouldn't happen */

    var modehash = new QSet();
    this.prefixes.slice(0, pos + 1).split("").each(function(x) {
      modehash.add(x);
    });
    
    var prefixes = entry.prefixes;
    for(var i=0;i<prefixes.length;i++)
      if(modehash.contains(prefixes.charAt(i)))
        return true;
        
    return false;
  },
  supported: function(key, value) {
    if(key == "PREFIX") {
      var l = (value.length - 2) / 2;

      this.modeprefixes = value.substr(1, l);
      this.prefixes = value.substr(l + 2, l);
    } else if(key == "SILENCE") {
      this.__silenceSupported = true;
    }

    this.parent(key, value);
  },
  connected: function() {
    qwebirc.connected = true;
    this.newServerInfoLine("CONNECT", "");
  },
  serverError: function(message) {
    this.newServerLine("ERROR", {"m": message});
  },
  quit: function(message) {
    this.send("QUIT :" + message, true);
    this.disconnect();
  },
  disconnect: function() {
    for(var k in this.activeTimers) {
      this.activeTimers[k].cancel();
    };
    this.activeTimers = {};
    
    this.parent();
  },
  awayMessage: function(nick, message) {
    this.newQueryLine(nick, "AWAY", {"n": nick, "m": message}, true);
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
    } else if(type == "generictext") {
      mtype = "GENERICTEXT";
      ndata.m = data.text;
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
    this.newQueryOrActiveLine(target, "GENERICERROR", {m: message, t: target}, true);
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
  },
  wallops: function(user, text) {
    var nick = user.hostToNick();
    var host = user.hostToHost();

    this.newServerLine("WALLOPS", {t: text, n: nick, h: host});
  },
  channelModeIs: function(channel, modes) {
    this.newTargetOrActiveLine(channel, "CHANNELMODEIS", {c: channel, m: modes.join(" ")});
  },
  channelCreationTime: function(channel, time) {
    this.newTargetOrActiveLine(channel, "CHANNELCREATIONTIME", {c: channel, m: qwebirc.irc.IRCDate(new Date(time * 1000))});
  },
  ignore: function(host) {
    var host = this.ignoreController.ignore(host);
    if(host === null)
      return false;

    if(this.__silenceSupported) {
      this.__silenced = "+" + host;
      this.exec("/SILENCE +" + host);
    }

    return true;
  },
  unignore: function(host) {
    var host = this.ignoreController.unignore(host);
    if(host === null)
      return false;

    if(this.__silenceSupported) {
      this.__silenced = "-" + host;
      this.exec("/SILENCE -" + host);
    }

    return true;
  },
  getIgnoreList: function() {
    return this.ignoreController.get();
  },
  silenced: function(host) {
    if (host === this.__silenced) {
      this.__silenced = null;
      return;
    }

    this.newServerLine("SILENCE", {h: host});
  },
  isIgnored: function(nick, host) {
    return this.ignoreController.isIgnored(nick, host);
  },
  qwebircImage: function(target, url) {
    var w;
    if(target == "-STATUS") {
      w = this.statusWindow;
    } else {
      w = this.getWindow(target);
    }

    if(!w)
      w = this.getActiveWindow();

    var img = new Element("img", {src: qwebirc.global.dynamicBaseURL + "image?filename=" + url});
    var d = new Element("div", {styles: {"paddingTop": "2px", "paddingBottom": "2px", "paddingLeft": "9px"}});
    d.appendChild(img);
    w.scrollAdd(d);
    return true;
  }
});
