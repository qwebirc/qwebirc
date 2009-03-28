qwebirc.irc.Commands = new Class({
  Extends: qwebirc.irc.BaseCommandParser,
  initialize: function(parentObject) {
    this.parent(parentObject);
    
    this.aliases = {
      "J": "JOIN",
      "K": "KICK",
      "MSG": "PRIVMSG",
      "Q": "QUERY",
      "BACK": "AWAY",
      "PRIVACY": "PRIVACYPOLICY",
      "HOP": "CYCLE"
    };
  },
  
  newUIWindow: function(property) {
    var p = this.parentObject.ui[property];
    if(!$defined(p)) {
      this.getActiveWindow().errorMessage("Current UI does not support that command.");
    } else {
      p.bind(this.parentObject.ui)();
    }
  },
  
  /* [require_active_window, splitintoXargs, minargs, function] */
  cmd_ME: [true, undefined, undefined, function(args) {
    if(args == undefined)
      args = "";

    var target = this.getActiveWindow().name;
    if(!this.send("PRIVMSG " + target + " :\x01ACTION " + args + "\x01"))
      return;

    this.newQueryLine(target, "ACTION", args, {"@": this.parentObject.getNickStatus(target, this.parentObject.nickname)});
  }],
  cmd_CTCP: [false, 3, 2, function(args) {
    var target = args[0];
    var type = args[1].toUpperCase();
    var message = args[2];
    
    if(message == undefined)
      message = "";

    if(message == "") {
      if(!this.send("PRIVMSG " + target + " :\x01" + type + "\x01"))
        return;
    } else {
      if(!this.send("PRIVMSG " + target + " :\x01" + type + " " + message + "\x01"))
        return;
    }
  
    this.newTargetLine(target, "CTCP", message, {"x": type});
  }],
  cmd_PRIVMSG: [false, 2, 2, function(args) {
    var target = args[0];
    var message = args[1];
    
    if(!this.parentObject.isChannel(target))
      this.parentObject.pushLastNick(target);
    if(this.send("PRIVMSG " + target + " :" + message))
      this.newQueryLine(target, "MSG", message, {"@": this.parentObject.getNickStatus(target, this.parentObject.nickname)});  
  }],
  cmd_NOTICE: [false, 2, 2, function(args) {
    var target = args[0];
    var message = args[1];

    if(this.send("NOTICE " + target + " :" + message)) {
      if(this.parentObject.isChannel(target)) {
        this.newTargetLine(target, "NOTICE", message, {"@": this.parentObject.getNickStatus(target, this.parentObject.nickname)});
      } else {
        this.newTargetLine(target, "NOTICE", message);
      }
    }
  }],
  cmd_QUERY: [false, 2, 1, function(args) {
    if(this.parentObject.isChannel(args[0])) {
      this.getActiveWindow().errorMessage("Can't target a channel with this command.");
      return;
    }

    this.parentObject.newWindow(args[0], qwebirc.ui.WINDOW_QUERY, true);

    if((args.length > 1) && (args[1] != ""))
      return ["SAY", args[1]];
  }],
  cmd_SAY: [true, undefined, undefined, function(args) {
    if(args == undefined)
      args = "";
      
    return ["PRIVMSG", this.getActiveWindow().name + " " + args]
  }],
  cmd_LOGOUT: [false, undefined, undefined, function(args) {
    this.parentObject.ui.logout();
  }],
  cmd_OPTIONS: [false, undefined, undefined, function(args) {
    this.newUIWindow("optionsWindow");
  }],
  cmd_EMBED: [false, undefined, undefined, function(args) {
    this.newUIWindow("embeddedWindow");
  }],
  cmd_PRIVACYPOLICY: [false, undefined, undefined, function(args) {
    this.newUIWindow("privacyWindow");
  }],
  cmd_ABOUT: [false, undefined, undefined, function(args) {
    this.newUIWindow("aboutWindow");
  }],
  cmd_QUOTE: [false, 1, 1, function(args) {
    this.send(args[0]);
  }],
  cmd_KICK: [true, 2, 1, function(args) {
    var channel = this.getActiveWindow().name;
    
    var message = "";
    var target = args[0];
    
    if(args.length == 2)
      message = args[1];
    
    this.send("KICK " + channel + " " + target + " :" + message);
  }],
  automode: function(direction, mode, args) {
    var channel = this.getActiveWindow().name;

    var modes = direction;
    for(var i=0;i<args.length;i++)
      modes = modes + mode;
      
    this.send("MODE " + channel + " " + modes + " " + args.join(" "));
  },
  cmd_OP: [true, 6, 1, function(args) {
    this.automode("+", "o", args);
  }],
  cmd_DEOP: [true, 6, 1, function(args) {
    this.automode("-", "o", args);
  }],
  cmd_VOICE: [true, 6, 1, function(args) {
    this.automode("+", "v", args);
  }],
  cmd_DEVOICE: [true, 6, 1, function(args) {
    this.automode("-", "v", args);
  }],
  cmd_TOPIC: [true, 1, 1, function(args) {
    this.send("TOPIC " + this.getActiveWindow().name + " :" + args[0]);
  }],
  cmd_AWAY: [false, 1, 0, function(args) {
    this.send("AWAY :" + (args?args[0]:""));
  }],
  cmd_QUIT: [false, 1, 0, function(args) {
    this.send("QUIT :" + (args?args[0]:""));
  }],
  cmd_CYCLE: [true, 1, 0, function(args) {
    var c = this.getActiveWindow().name;
    
    this.send("PART " + c + " :" + (args?args[0]:"rejoining. . ."));
    this.send("JOIN " + c);
  }],
  cmd_JOIN: [false, 2, 1, function(args) {
    var channels = args.shift();
    
    var schans = channels.split(",");
    var fchans = [];
    
    var warn = false;
    
    schans.forEach(function(x) {
      if(!this.parentObject.isChannel(x)) {
        x = "#" + x;
        warn = true;
      }
      fchans.push(x);
    }.bind(this));

    if(warn) {
      var delayinfo = function() {
        this.getActiveWindow().infoMessage("Channel names begin with # (corrected automatically).");
      }.bind(this).delay(250);
    }
      
    this.send("JOIN " + fchans.join(",") + " " + args.join(" "));
  }],
  cmd_UMODE: [false, 1, 0, function(args) {
    this.send("MODE " + this.parentObject.getNickname() + (args?(" " + args[0]):""));
  }],
  cmd_BEEP: [false, undefined, undefined, function(args) {
    this.parentObject.ui.beep();
  }],
  cmd_AUTOJOIN: [false, undefined, undefined, function(args) {
    return ["JOIN", this.parentObject.options.autojoin];
  }],
  cmd_CLEAR: [false, undefined, undefined, function(args) {
    var w = this.getActiveWindow().lines;
    while(w.childNodes.length > 0)
      w.removeChild(w.firstChild);
  }],
  cmd_PART: [false, 2, 0, function(args) {
    var w = this.getActiveWindow();
    var message = "";
    var channel;
    
    if(w.type != qwebirc.ui.WINDOW_CHANNEL) {
      if(!args || args.length == 0) {
        w.errorMessage("Insufficient arguments for command.");
        return;
      }
      channel = args[0];  
      if(args.length > 1)
        message = args[1];
    } else {
      if(!args || args.length == 0) {
        channel = w.name;
      } else {
        var isChan = this.parentObject.isChannel(args[0]);
        if(isChan) {
          channel = args[0];
          if(args.length > 1)
            message = args[1];
        } else {
          channel = w.name;
          message = args.join(" ");
        }
      }
    }
    
    this.send("PART " + channel + " :" + message);
  }]
});
