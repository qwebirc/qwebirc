function CommandParser(parent) {
  var self = this;
  var aliases = {
    "J": "JOIN",
    "K": "KICK",
    "MSG": "PRIVMSG",
    "Q": "QUERY"
  };
  
  var send = parent.__send;
  
  var newTargetLine = function(target, type, message, extra) {
    if(!extra)
      extra = {}
      
    extra["n"] = parent.getNickname();
    extra["m"] = message;
    extra["t"] = target;
    
    var window = parent.getWindow(target);
    var channel;
    if(!window) {
      type = "TARGETED" + type;
      target = false;
    } else if(window.ischannel) {
      type = "CHAN" + type;
    } else {
      type = "PRIV" + type;
    }
    parent.newLine(target, "OUR" + type, extra);
  }

  var commands = {
    ME: [true, undefined, undefined, function(args) {
      if(args == undefined)
        args = "";
      send("PRIVMSG " + w.name + " :\x01ACTION " + args + "\x01");
      newTargetLine(w.name, "ACTION", args);
    }],
    CTCP: [false, 3, 2, function(args) {
      var target = args[0];
      var type = args[1].toUpperCase();
      var message = args[2];
      
      if(message == undefined)
        message = "";

      if(message == "") {
        send("PRIVMSG " + target + " :\x01" + type + "\x01");
      } else {
        send("PRIVMSG " + target + " :\x01" + type + " " + message + "\x01");
      }
    
      newTargetLine(target, "CTCP", message, {"x": type});
    }],
    PRIVMSG: [false, 2, 2, function(args) {
      var target = args[0];
      var message = args[1];
    
      newTargetLine(target, "MSG", message);
      send("PRIVMSG " + target + " :" + message);
    }],
    NOTICE: [false, 2, 2, function(args) {
      var target = args[0];
      var message = args[1];

      newTargetLine(target, "NOTICE", message);
      send("NOTICE " + target + " :" + message);
    }],
    QUERY: [false, 2, 1, function(args) {
      parent.newWindow(args[0], WINDOW_QUERY, true);

      if((args.length > 1) && (args[1] != ""))
        return ["SAY", args[1]];
    }],
    SAY: [true, undefined, undefined, function(args) {
      if(args == undefined)
        args = "";
        
      return ["PRIVMSG", parent.getActiveWindow().name + " " + args]
    }],
    KICK: [true, 3, 2, function(args) {
      var channel = args[0];
      var target = args[1];
      var message = args[2];
      if(!message)
        message = "";
      
      send("KICK " + channel + " " + target + " :" + message);
    }]
  };

  this.dispatch = function(line) {
    if(line.length == 0)
      return;

    if(line.charAt(0) != "/")
      line = "/SAY " + line;
    
    var line = line.substr(1);
    var allargs = line.splitMax(" ", 2);
    var command = allargs[0].toUpperCase();
    var args = allargs[1];
        
    var aliascmd = aliases[command];
    if(aliascmd)
      command = aliascmd;
    
    for(;;) {
      var cmdopts = commands[command];
      if(!cmdopts) {
        if(args) {
          send(command + " " + args);
        } else {
          send(command);
        }
        return;
      }
      
      var activewin = cmdopts[0];
      var splitargs = cmdopts[1];
      var minargs = cmdopts[2];  
      var fn = cmdopts[3];
      
      var w = parent.getActiveWindow();
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
      
      var ret = fn(args);
      if(ret == undefined)
        return;
        
      command = ret[0];
      args = ret[1];
    }
  }
}
