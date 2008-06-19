var CommandParser = new Class({
  initialize: function(parentObject) {
    this.aliases = {
      "J": "JOIN",
      "K": "KICK",
      "MSG": "PRIVMSG",
      "Q": "QUERY"
    };
    
    this.send = parentObject.send;
    this.parentObject = parentObject;
  },
  newTargetLine: function(target, type, message, extra) {
    if(!extra)
      extra = {}

    extra["n"] = this.parentObject.getNickname();
    extra["m"] = message;
    extra["t"] = target;

    var window = this.parentObject.getWindow(target);
    var channel;
    if(!window) {
      type = "TARGETED" + type;
      target = false;
    } else if(window.type == WINDOW_CHANNEL) {
      type = "CHAN" + type;
    } else {
      type = "PRIV" + type;
    }

    this.parentObject.newLine(target, "OUR" + type, extra);
  },
  dispatch: function(line) {
    if(line.length == 0)
      return;

    if(line.charAt(0) != "/")
      line = "/SAY " + line;
    
    var line = line.substr(1);
    var allargs = line.splitMax(" ", 2);
    var command = allargs[0].toUpperCase();
    var args = allargs[1];
        
    var aliascmd = this.aliases[command];
    if(aliascmd)
      command = aliascmd;
    
    for(;;) {
      var cmdopts = this["cmd_" + command];
      if(!cmdopts) {
        if(args) {
          this.send(command + " " + args);
        } else {
          this.send(command);
        }
        return;
      }
      
      var activewin = cmdopts[0];
      var splitargs = cmdopts[1];
      var minargs = cmdopts[2];  
      var fn = cmdopts[3];
      
      var w = this.parentObject.getActiveWindow();
      if(activewin && w.type == WINDOW_STATUS) {
        w.errorMessage("Can't use this command in this window");
        return;
      }
    
      if(splitargs != undefined)
        args = args.splitMax(" ", splitargs);
      
      if((minargs != undefined) && (minargs > args.length)) {
        w.errorMessage("Insufficient arguments for command.")
        return;
      }
      
      var ret = fn.attempt([args], this);
      if(ret == undefined)
        return;
        
      command = ret[0];
      args = ret[1];
    }
  },
  
  
  cmd_ME: [true, undefined, undefined, function(args) {
    if(args == undefined)
      args = "";
    return ["SAY", "\x01ACTION " + args + "\x01"];
  }],
  cmd_CTCP: [false, 3, 2, function(args) {
    var target = args[0];
    var type = args[1].toUpperCase();
    var message = args[2];
    
    if(message == undefined)
      message = "";

    if(message == "") {
      this.send("PRIVMSG " + target + " :\x01" + type + "\x01");
    } else {
      this.send("PRIVMSG " + target + " :\x01" + type + " " + message + "\x01");
    }
  
    this.newTargetLine(target, "CTCP", message, {"x": type});
  }],
  cmd_PRIVMSG: [false, 2, 2, function(args) {
    var target = args[0];
    var message = args[1];
    
    this.newTargetLine(target, "MSG", message, {});
    
    this.send("PRIVMSG " + target + " :" + message);
  }],
  cmd_NOTICE: [false, 2, 2, function(args) {
    var target = args[0];
    var message = args[1];

    this.newTargetLine(target, "NOTICE", message);
    this.send("NOTICE " + target + " :" + message);
  }],
  cmd_QUERY: [false, 2, 1, function(args) {
    this.parentObject.newWindow(args[0], WINDOW_QUERY, true);

    if((args.length > 1) && (args[1] != ""))
      return ["SAY", args[1]];
  }],
  cmd_SAY: [true, undefined, undefined, function(args) {
    if(args == undefined)
      args = "";
      
    return ["PRIVMSG", this.parentObject.getActiveWindow().name + " " + args]
  }],
  KICK: [true, 3, 2, function(args) {
    var channel = args[0];
    var target = args[1];
    var message = args[2];
    if(!message)
      message = "";
    
    this.send("KICK " + channel + " " + target + " :" + message);
  }],
});
