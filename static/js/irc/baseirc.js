Numerics = {"001": "RPL_WELCOME", "433": "ERR_NICKNAMEINUSE", "004": "RPL_MYINFO", "005": "RPL_ISUPPORT", "353": "RPL_NAMREPLY", "366": "RPL_ENDOFNAMES", "331": "RPL_NOTOPIC", "332": "RPL_TOPIC", "333": "RPL_TOPICWHOTIME"}

function BaseIRCClient(nickname, view) {
  var self = this;
  this.nickname = nickname;
  this.signedOn = false;
  this.pmodes = ["b", "k,", "o", "l", "v"];
  
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
    var oldnick = user.split("!", 1);
    var newnick = params[0];
    
    if(self.nickname == oldnick)
      self.nickname = newnick;
      
    view.nickChanged(user, newnick);
    
    return true;
  }
  
  this.irc_QUIT = function(prefix, params) {
    var user = prefix;
    
    var message = ANI(params, -1);
    
    view.userQuit(user, message);
    
    return true;
  }

  this.irc_PART = function(prefix, params) {
    var user = prefix;
    var channel = params[0];
    var message = params[1];
    
    view.userPart(user, channel, message);
    
    return true;
  }
  
  this.irc_KICK = function(prefix, params) {
    var kicker = prefix;
    var channel = params[0];
    var kickee = params[1];
    var message = params[2];
    
    view.userKicked(kicker, channel, kickee, message);
    
    return true;
  }
  
  this.irc_PING = function(prefix, params) {
    self.send("PONG :" + ANI(params, -1));
    
    return true;
  }
  
  this.irc_JOIN = function(prefix, params) {
    var channel = params[0];
    var user = prefix;

    view.userJoined(user, channel);
    
    return true;
  }
  
  this.irc_TOPIC = function(prefix, params) {
    var user = prefix;
    var channel = params[0];
    var topic = ANI(params, -1);
    
    view.channelTopic(user, channel, topic);
    
    return true;
  }
  
  this.irc_PRIVMSG = function(prefix, params) {
    var user = prefix;
    var target = params[0];
    var message = ANI(params, -1);
    
    if(target == self.nickname) {
      view.userPrivmsg(user, message);
    } else {
      view.channelPrivmsg(user, target, message);
    }
    
    return true;
  }

  this.irc_NOTICE = function(prefix, params) {
    var user = prefix;
    var target = params[0];
    var message = ANI(params, -1);
    
    if(user == "") {
      view.serverNotice(message);
    } else if(target == self.nickname) {
      view.userNotice(user, message);
    } else {
      view.channelNotice(user, target, message);
    }
    
    return true;
  }

  this.irc_INVITE = function(prefix, params) {
    var user = prefix;
    var channel = ANI(params, -1);
    
    view.userInvite(user, channel);
    
    return true;
  }

  this.irc_ERROR = function(prefix, params) {
    var message = ANI(params, -1);
    
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
      var l = supported[i].split("=", 2);
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
    var topic = ANI(params, -1);
    
    view.initialTopic(channel, topic);
    return true;
  }
  
  this.irc_RPL_TOPICWHOTIME = function(prefix, params) {
    return true;
  }
  
  this.connection = new TCPConnection(nickname, this);
  this.send = this.connection.send;
  this.connect = this.connection.connect;
  this.disconnect = this.connection.disconnect;
}
