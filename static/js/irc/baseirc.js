var Numerics = {"001": "RPL_WELCOME", "433": "ERR_NICKNAMEINUSE", "004": "RPL_MYINFO", "005": "RPL_ISUPPORT", "353": "RPL_NAMREPLY", "366": "RPL_ENDOFNAMES", "331": "RPL_NOTOPIC", "332": "RPL_TOPIC", "333": "RPL_TOPICWHOTIME"};

var RegisteredCTCPs = {
  "VERSION": function(x) {
    return "qwebirc v" + QWEBIRC_VERSION + ", copyright (C) Chris Porter 2008 -- user agent: " + Browser.Engine.name + " (" + Browser.Platform.name + ")";
  },
  "USERINFO": function(x) { return "qwebirc"; },
  "TIME": function(x) { return IRCTime(new Date()); },
  "PING": function(x) { return x; },
  "CLIENTINFO": function(x) { return "PING VERSION TIME USERINFO CLIENTINFO"; }
};

function BaseIRCClient(nickname, view) {
  var self = this;
  this.nickname = nickname;
  this.signedOn = false;
  this.pmodes = ["b", "k,", "o", "l", "v"];
  this.channels = {}
  var nextctcp = 0;
  
  /* attempt javascript inheritence! */
  this.dispatch = function(data) {
    var message = data[0];
    if(message == "connect") {
      view.connected();
    } else if(message == "disconnect") {
      view.disconnected();
    } else if(message == "c") {
      var command = data[1];
       
      var prefix = data[2];
      var sl = data[3];
      var n = Numerics[command];
      
      var x = n;
      if(!n)
        n = command;  

      var o = view["irc_" + n];
      if(!o)
        o = self["irc_" + n];
      
      if(o) {
        var r = o(prefix, sl);
        if(!r)
          view.rawNumeric(command, prefix, sl);
      } else {
        view.rawNumeric(command, prefix, sl);
      }
    }
  }
  
  this.irc_RPL_WELCOME = function(prefix, params) {
    self.nickname = params[0];
    
    self.signedOn = true;
    view.signedOn(self.nickname);
  }
  
  this.irc_ERR_NICKNAMEINUSE = function(prefix, params) {
    if(self.signedOn == false) {
      var newnick = params[1] + "_";
      if(newnick == self.lastnick)
        newnick = "webchat" + Math.floor(Math.random() * 1024 * 1024);

      self.send("NICK " + newnick);
      self.lastnick = newnick;
    }
  }
  
  this.irc_NICK = function(prefix, params) {
    var user = prefix;
    var oldnick = user.hostToNick();
    var newnick = params[0];
    
    if(self.nickname == oldnick)
      self.nickname = newnick;
      
    view.nickChanged(user, newnick);
    
    return true;
  }
  
  this.irc_QUIT = function(prefix, params) {
    var user = prefix;
    
    var message = params.indexFromEnd(-1);
    
    view.userQuit(user, message);
    
    return true;
  }

  this.irc_PART = function(prefix, params) {
    var user = prefix;
    var channel = params[0];
    var message = params[1];

    var nick = user.hostToNick();
    
    if((nick == self.nickname) && self.channels[channel])
      delete self.channels[channel];
    view.userPart(user, channel, message);
    
    return true;
  }
  
  this.irc_KICK = function(prefix, params) {
    var kicker = prefix;
    var channel = params[0];
    var kickee = params[1];
    var message = params[2];
    
    if((kickee == self.nickname) && self.channels[channel])
      delete self.channels[channel];
    view.userKicked(kicker, channel, kickee, message);
    
    return true;
  }
  
  this.irc_PING = function(prefix, params) {
    self.send("PONG :" + params.indexFromEnd(-1));
    
    return true;
  }
  
  this.irc_JOIN = function(prefix, params) {
    var channel = params[0];
    var user = prefix;
    var nick = user.hostToNick();
    
    if(nick == self.nickname)
      self.channels[channel] = true;
      
    view.userJoined(user, channel);
    
    return true;
  }
  
  this.irc_TOPIC = function(prefix, params) {
    var user = prefix;
    var channel = params[0];
    var topic = params.indexFromEnd(-1);
    
    view.channelTopic(user, channel, topic);
    
    return true;
  }
  
  var processCTCP = function(message) {
    if(message.charAt(0) == "\x01") {
      if(message.charAt(message.length - 1) == "\x01") {
        message = message.substr(1, message.length - 2);
      } else {
        message = message.substr(1);
      }
      return message.splitMax(" ", 2);
    }
  }
  
  this.irc_PRIVMSG = function(prefix, params) {
    var user = prefix;
    var target = params[0];
    var message = params.indexFromEnd(-1);
    
    var ctcp = processCTCP(message);
    if(ctcp) {
      var type = ctcp[0].toUpperCase();
      
      var replyfn = registeredCTCPs[type];
      if(replyfn) {
        var t = new Date().getTime() / 1000;
        if(t > nextctcp)
          self.send("NOTICE " + user.hostToNick() + " :\x01" + type + " " + replyfn(ctcp[1]) + "\x01");
        nextctcp = t + 5;
      }
      
      if(target == self.nickname) {
        view.userCTCP(user, type, ctcp[1]);
      } else {
        view.channelCTCP(user, target, type, ctcp[1]);
      }
    } else {
      if(target == self.nickname) {
        view.userPrivmsg(user, message);
      } else {
        view.channelPrivmsg(user, target, message);
      }
    }
    
    return true;
  }

  this.irc_NOTICE = function(prefix, params) {
    var user = prefix;
    var target = params[0];
    var message = params.indexFromEnd(-1);
    
    if(user == "") {
      view.serverNotice(message);
    } else if(target == self.nickname) {
      var ctcp = processCTCP(message);
      if(ctcp) {
        view.userCTCPReply(user, ctcp[0], ctcp[1]);
      } else {
        view.userNotice(user, message);
      }
    } else {
      view.channelNotice(user, target, message);
    }
    
    return true;
  }

  this.irc_INVITE = function(prefix, params) {
    var user = prefix;
    var channel = params.indexFromEnd(-1);
    
    view.userInvite(user, channel);
    
    return true;
  }

  this.irc_ERROR = function(prefix, params) {
    var message = params.indexFromEnd(-1);
    
    view.serverError(message);
    
    return true;
  }
  
  this.irc_MODE = function(prefix, params) {
    var user = prefix;
    var target = params[0];
    var args = params.slice(1);
    
    if(target == self.nickname) {
      view.userMode(args);
    } else {
      var modes = args[0].split("");
      var xargs = args.slice(1);
      
      var data = []
      var carg = 0;
      var pos = 0;
      var cmode = "+";
      
      forEach(modes, function(mode) {
        if((mode == "+") || (mode == "-")) {
          cmode = mode;
          return;
        }

        if(self.pmodes[mode]) { 
          d = [cmode, mode, xargs[carg++]]
        } else {
          d = [cmode, mode]
        }
        
        data.push(d);
      });
      
      view.channelMode(user, target, data, args);
    }
    
    return true;
  }
  
  this.irc_RPL_ISUPPORT = function(prefix, params) {
    var supported = params.slice(1, -1);
    var supportedhash = {};
    
    for(var i=0;i<supported.length;i++) {
      var l = supported[i].splitMax("=", 2);
      view.supported(l[0], l[1]);
    }
  }
  
  this.irc_RPL_MYINFO = function(prefix, params) {
    var pmodes = params[5].split("");
    self.pmodes = {}
    forEach(pmodes, function(pmode) {
      self.pmodes[pmode] = true;
    });
  }
  
  this.irc_RPL_NAMREPLY = function(prefix, params) {
    var channel = params[2];    
    var names = params[3];
    
    view.channelNames(channel, names.split(" "));
    
    return true;
  }

  this.irc_RPL_ENDOFNAMES = function(prefix, params) {
    var channel = params[1];

    view.channelNames(channel, []);
    return true;
  }

  this.irc_RPL_NOTOPIC = function(prefix, params) {
    return true;
  }
  
  this.irc_RPL_TOPIC = function(prefix, params) {
    var channel = params[1];
    var topic = params.indexFromEnd(-1);
    
    if(self.channels[channel]) {
      view.initialTopic(channel, topic);
      return true;
    }
  }
  
  this.irc_RPL_TOPICWHOTIME = function(prefix, params) {
    return true;
  }
  
  this.connection = new IRCConnection({initialNickname: nickname, onRecv: this.dispatch});
  
  this.send = this.connection.send.bind(this.connection);
  this.connect = this.connection.connect.bind(this.connection);
  this.disconnect = this.connection.disconnect;
}
