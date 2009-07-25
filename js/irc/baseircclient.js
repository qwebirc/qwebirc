qwebirc.irc.RegisteredCTCPs = {
  "VERSION": function(x) {
    return "qwebirc v" + qwebirc.VERSION + ", copyright (C) Chris Porter 2008-2009 -- " + qwebirc.util.browserVersion();
  },
  "USERINFO": function(x) { return "qwebirc"; },
  "TIME": function(x) { return qwebirc.irc.IRCDate(new Date()); },
  "PING": function(x) { return x; },
  "CLIENTINFO": function(x) { return "PING VERSION TIME USERINFO CLIENTINFO"; }
};

qwebirc.irc.BaseIRCClient = new Class({
  Implements: [Options],
  options: {
    nickname: "qwebirc"
  },
  initialize: function(options) {
    this.setOptions(options);

    this.toIRCLower = qwebirc.irc.RFC1459toIRCLower;

    this.nickname = this.options.nickname;
    this.lowerNickname = this.toIRCLower(this.nickname);    

    this.__signedOn = false;
    this.pmodes = {b: true, k: true, o: true, l: true, v: true};
    this.channels = {}
    this.nextctcp = 0;    

    this.connection = new qwebirc.irc.IRCConnection({
      initialNickname: this.nickname,
      onRecv: this.dispatch.bind(this),
      serverPassword: this.options.serverPassword
    });
  
    this.send = this.connection.send.bind(this.connection);
    this.connect = this.connection.connect.bind(this.connection);
    this.disconnect = this.connection.disconnect.bind(this.connection);

    this.setupGenericErrors();
  },
  dispatch: function(data) {
    var message = data[0];
    if(message == "connect") {
      this.connected();
    } else if(message == "disconnect") {
      if(data.length == 0) {
        this.disconnected("No error!");
      } else {
        this.disconnected(data[1]);
      }
      this.disconnect();
    } else if(message == "c") {
      var command = data[1].toUpperCase();
       
      var prefix = data[2];
      var sl = data[3];
      var n = qwebirc.irc.Numerics[command];
      
      var x = n;
      if(!n)
        n = command;  

      var o = this["irc_" + n];
      
      if(o) {
        var r = o.run([prefix, sl], this);
        if(!r)
          this.rawNumeric(command, prefix, sl);
      } else {
        this.rawNumeric(command, prefix, sl);
      }
    }
  },
  isChannel: function(target) {
    var c = target.charAt(0);
    return c == '#';
  },
  supported: function(key, value) {
    if(key == "CASEMAPPING") {
      if(value == "ascii") {
        this.toIRCLower = qwebirc.irc.ASCIItoIRCLower;
      } else if(value == "rfc1459") {
        /* IGNORE */
      } else {
        /* TODO: warn */
      }
    }
    this.lowerNickname = this.toIRCLower(this.nickname);
  },
  irc_RPL_WELCOME: function(prefix, params) {
    this.nickname = params[0];
    this.lowerNickname = this.toIRCLower(this.nickname);
    this.__signedOn = true;
    this.signedOn(this.nickname);
  },
  irc_ERR_NICKNAMEINUSE: function(prefix, params) {
    this.genericError(params[1], params.indexFromEnd(-1).replace("in use.", "in use"));
    
    if(this.__signedOn)
      return true;
    
    var newnick = params[1] + "_";
    if(newnick == this.lastnick)
      newnick = "qwebirc" + Math.floor(Math.random() * 1024 * 1024);

    this.send("NICK " + newnick);
    this.lastnick = newnick;
    return true;
  },
  irc_NICK: function(prefix, params) {
    var user = prefix;
    var oldnick = user.hostToNick();
    var newnick = params[0];
    
    if(this.nickname == oldnick) {
      this.nickname = newnick;
      this.lowerNickname = this.toIRCLower(this.nickname);
    }
    
    this.nickChanged(user, newnick);
    
    return true;
  },
  irc_QUIT: function(prefix, params) {
    var user = prefix;
    
    var message = params.indexFromEnd(-1);
    
    this.userQuit(user, message);
    
    return true;
  },
  irc_PART: function(prefix, params) {
    var user = prefix;
    var channel = params[0];
    var message = params[1];

    var nick = user.hostToNick();
    
    if((nick == this.nickname) && this.__getChannel(channel))
      this.__killChannel(channel);
      
    this.userPart(user, channel, message);
    
    return true;
  },
  __getChannel: function(name) {
    return this.channels[this.toIRCLower(name)];
  },
  __killChannel: function(name) {
    delete this.channels[this.toIRCLower(name)];
  },
  __nowOnChannel: function(name) {
    this.channels[this.toIRCLower(name)] = 1;
  },
  irc_KICK: function(prefix, params) {
    var kicker = prefix;
    var channel = params[0];
    var kickee = params[1];
    var message = params[2];
    
    if((kickee == this.nickname) && this.__getChannel(channel))
      this.__killChannel(channel);
      
    this.userKicked(kicker, channel, kickee, message);
    
    return true;
  },
  irc_PING: function(prefix, params) {
    this.send("PONG :" + params.indexFromEnd(-1));
    
    return true;
  },
  irc_JOIN: function(prefix, params) {
    var channel = params[0];
    var user = prefix;
    var nick = user.hostToNick();
        
    if(nick == this.nickname)
      this.__nowOnChannel(channel);

    this.userJoined(user, channel);
    
    return true;
  },
  irc_TOPIC: function(prefix, params) {
    var user = prefix;
    var channel = params[0];
    var topic = params.indexFromEnd(-1);
    
    this.channelTopic(user, channel, topic);
    
    return true;
  },
  processCTCP: function(message) {
    if(message.charAt(0) != "\x01")
      return;
    
    if(message.charAt(message.length - 1) == "\x01") {
      message = message.substr(1, message.length - 2);
    } else {
      message = message.substr(1);
    }
    return message.splitMax(" ", 2);
  },
  irc_PRIVMSG: function(prefix, params) {
    var user = prefix;
    var target = params[0];
    var message = params.indexFromEnd(-1);
    
    var ctcp = this.processCTCP(message);
    if(ctcp) {
      var type = ctcp[0].toUpperCase();
      
      var replyfn = qwebirc.irc.RegisteredCTCPs[type];
      if(replyfn) {
        var t = new Date().getTime() / 1000;
        if(t > this.nextctcp)
          this.send("NOTICE " + user.hostToNick() + " :\x01" + type + " " + replyfn(ctcp[1]) + "\x01");
        this.nextctcp = t + 5;
      }
      
      if(target == this.nickname) {
        this.userCTCP(user, type, ctcp[1]);
      } else {
        this.channelCTCP(user, target, type, ctcp[1]);
      }
    } else {
      if(target == this.nickname) {
        this.userPrivmsg(user, message);
      } else {
        this.channelPrivmsg(user, target, message);
      }
    }
    
    return true;
  },
  irc_NOTICE: function(prefix, params) {
    var user = prefix;
    var target = params[0];
    var message = params.indexFromEnd(-1);
    
    if((user == "") || (user.indexOf("!") == -1)) {
      this.serverNotice(user, message);
    } else if(target == this.nickname) {
      var ctcp = this.processCTCP(message);
      if(ctcp) {
        this.userCTCPReply(user, ctcp[0], ctcp[1]);
      } else {
        this.userNotice(user, message);
      }
    } else {
      this.channelNotice(user, target, message);
    }
    
    return true;
  },
  irc_INVITE: function(prefix, params) {
    var user = prefix;
    var channel = params.indexFromEnd(-1);
    
    this.userInvite(user, channel);
    
    return true;
  },
  irc_ERROR: function(prefix, params) {
    var message = params.indexFromEnd(-1);
    
    this.serverError(message);
    
    return true;
  },
  irc_MODE: function(prefix, params) {
    var user = prefix;
    var target = params[0];
    var args = params.slice(1);
    
    if(target == this.nickname) {
      this.userMode(args);
    } else {
      var modes = args[0].split("");
      var xargs = args.slice(1);
      
      var data = []
      var carg = 0;
      var pos = 0;
      var cmode = "+";
      
      modes.each(function(mode) {
        if((mode == "+") || (mode == "-")) {
          cmode = mode;
          return;
        }

        var d;
        if(this.pmodes[mode]) { 
          d = [cmode, mode, xargs[carg++]]
        } else {
          d = [cmode, mode]
        }
        
        data.push(d);
      }, this);
      
      this.channelMode(user, target, data, args);
    }
    
    return true;
  },  
  irc_RPL_ISUPPORT: function(prefix, params) {
    var supported = params.slice(1, -1);
    var supportedhash = {};
    
    for(var i=0;i<supported.length;i++) {
      var l = supported[i].splitMax("=", 2);
      this.supported(l[0], l[1]);
    }
  },  
  irc_RPL_MYINFO: function(prefix, params) {
    if(params.length < 6)
      return;

    var pmodes = params[5].split("");
    this.pmodes = {}
    
    pmodes.each(function(pmode) {
      this.pmodes[pmode] = true;
    }, this);
  },  
  irc_RPL_NAMREPLY: function(prefix, params) {
    var channel = params[2];    
    var names = params[3];
    
    this.channelNames(channel, names.split(" "));
    
    return true;
  },
  irc_RPL_ENDOFNAMES: function(prefix, params) {
    var channel = params[1];

    this.channelNames(channel, []);
    return true;
  },
  irc_RPL_NOTOPIC: function(prefix, params) {
    var channel = params[1];

    if(this.__getChannel(channel)) {
      this.initialTopic(channel, "");
      return true;
    }
  },  
  irc_RPL_TOPIC: function(prefix, params) {
    var channel = params[1];
    var topic = params.indexFromEnd(-1);
    
    if(this.__getChannel(channel)) {
      this.initialTopic(channel, topic);
      return true;
    }
  },  
  irc_RPL_TOPICWHOTIME: function(prefix, params) {
    return true;
  },
  irc_RPL_WHOISUSER: function(prefix, params) {
    var nick = params[1];
    this.whoisNick = nick;

    return this.whois(nick, "user", {ident: params[2], hostname: params[3], realname: params.indexFromEnd(-1)});
  },  
  irc_RPL_WHOISSERVER: function(prefix, params) {
    var nick = params[1];
    var server = params[2];
    var serverdesc = params.indexFromEnd(-1);

    return this.whois(nick, "server", {server: params[2], serverdesc: params.indexFromEnd(-1)});
  },  
  irc_RPL_WHOISOPERATOR: function(prefix, params) {
    var nick = params[1];
    var text = params.indexFromEnd(-1);

    return this.whois(nick, "oper", {opertext: params.indexFromEnd(-1)});
  },  
  irc_RPL_WHOISIDLE: function(prefix, params) {
    var nick = params[1];

    return this.whois(nick, "idle", {idle: params[2], connected: params[3]});
  },  
  irc_RPL_WHOISCHANNELS: function(prefix, params) {
    var nick = params[1];

    return this.whois(nick, "channels", {channels: params.indexFromEnd(-1)});
  },  
  irc_RPL_WHOISACCOUNT: function(prefix, params) {
    var nick = params[1];

    return this.whois(nick, "account", {account: params[2]});
  },  
  irc_RPL_WHOISACTUALLY: function(prefix, params) {
    var nick = params[1];

    return this.whois(nick, "actually", {hostmask: params[2], ip: params[3]});
  },  
  irc_RPL_WHOISOPERNAME: function(prefix, params) {
    var nick = params[1];
    var opername = params[2];

    return this.whois(nick, "opername", {opername: params[2]});
  },
  irc_RPL_WHOISGENERICTEXT: function(prefix, params) {
    var nick = params[1];
    var text = params.indexFromEnd(-1);
    
    return this.whois(nick, "generictext", {text: text});
  },
  irc_RPL_ENDOFWHOIS: function(prefix, params) {
    var nick = params[1];
    var text = params.indexFromEnd(-1);
    this.whoisNick = null;
    
    return this.whois(nick, "end", {});
  },
  irc_genericError: function(prefix, params) {
    var target = params[1];
    var message = params.indexFromEnd(-1);
    
    this.genericError(target, message);
    return true;
  },
  irc_genericQueryError: function(prefix, params) {
    var target = params[1];
    var message = params.indexFromEnd(-1);
    
    this.genericQueryError(target, message);
    return true;
  },
  setupGenericErrors: function() {
    this.irc_ERR_CHANOPPRIVSNEEDED = this.irc_ERR_CANNOTSENDTOCHAN = this.irc_genericError;
    this.irc_ERR_NOSUCHNICK = this.irc_genericQueryError;
    return true;
  },
  irc_RPL_AWAY: function(prefix, params) {
    var nick = params[1];
    var text = params.indexFromEnd(-1);

    if(this.whoisNick && (this.whoisNick == nick))
      return this.whois(nick, "away", {"away": text});
      
    this.awayMessage(nick, text);
    return true;
  },
  irc_RPL_NOWAWAY: function(prefix, params) {
    this.awayStatus(true, params.indexFromEnd(-1));
    return true;
  },
  irc_RPL_UNAWAY: function(prefix, params) {
    this.awayStatus(false, params.indexFromEnd(-1));
    return true;
  },
  irc_WALLOPS: function(prefix, params) {
    var user = prefix;
    var text = params.indexFromEnd(-1);
    
    this.wallops(user, text);
    return true;
  },
  irc_RPL_CREATIONTIME: function(prefix, params) {
    var channel = params[1];
    var time = params[2];

    this.channelCreationTime(channel, time);    
    return true;
  },
  irc_RPL_CHANNELMODEIS: function(prefix, params) {
    var channel = params[1];
    var modes = params.slice(2);

    this.channelModeIs(channel, modes);
    return true;
  }
});
