function CommandParser(ui, send) {
  var self = this;
  var aliases = {
    "J": "JOIN",
    "K": "KICK",
    "MSG": "PRIVMSG",
    "Q": "QUERY"
  };
  
  this.dispatch = function(line) {
    if(line.length == 0)
      return;

    if(line.charAt(0) != "/") {
      self.cmd_SAY(line);
      return;
    }
    
    var line = line.substr(1);
    var allargs = line.splitMax(" ", 2);
    var command = allargs[0].toUpperCase();
    var args = allargs[1];
        
    var aliascmd = aliases[command];
    if(aliascmd)
      command = aliascmd;
    
    var commando = self["cmd_" + command];
    if(!commando) {
      if(args) {
        send(command + " " + args);
      } else {
        send(command);
      }
    } else {
      commando(args);
    }
  }
  
  this.cmd_KICK = function(args) {
    var allargs = args.splitMax(" ", 3);
    
    if(allargs.length < 2) {
      ui.errorMessage("Insufficient arguments for command.")
      return;
    }

    var channel = allargs[0];
    var target = allargs[1];
    var message = allargs[2];
    if(!message)
      message = "";
      
    send("KICK " + channel + " " + target + " :" + message);
  }

  var newTargetLine = function(target, type, message, extra) {
    if(!extra)
      extra = {}
      
    extra["n"] = ui.getNickname();
    extra["m"] = message;
    extra["t"] = target;
    
    var window = ui.getWindow(target);
    var channel;
    if(!window) {
      type = "TARGETED" + type;
      target = false;
    } else if(window.ischannel) {
      type = "CHAN" + type;
    } else {
      type = "PRIV" + type;
    }
    ui.newLine(target, "OUR" + type, extra);
  }
    
  this.cmd_ME = function(args) {
    var w = ui.getActiveWindow();
    if(!w || w.name == "") {
      ui.errorMessage("Can't use this command in this window");
      return;
    }
    if(args == undefined)
      args = "";
    
    send("PRIVMSG " + w.name + " :\x01ACTION " + args + "\x01");
    newTargetLine(w.name, "ACTION", args);
  }
  
  this.cmd_CTCP = function(args) {
    var allargs = args.splitMax(" ", 3);
    if(allargs.length < 2) {
      ui.errorMessage("Insufficient arguments for command.");
      return;
    }
    
    var target = allargs[0];
    var type = allargs[1].toUpperCase();
    var message = allargs[2];
    if(message == undefined)
      message = "";

    if(message == "") {
      send("PRIVMSG " + target + " :\x01" + type + "\x01");
    } else {
      send("PRIVMSG " + target + " :\x01" + type + " " + message + "\x01");
    }
    
    newTargetLine(target, "CTCP", message, {"x": type});
  }
  
  this.cmd_PRIVMSG = function(args) {
    var allargs = args.splitMax(" ", 2);
    
    if(allargs.length < 2) {
      ui.errorMessage("Insufficient arguments for command.")
      return;
    }

    var target = allargs[0];
    var message = allargs[1];
    
    newTargetLine(target, "MSG", message);
    send("PRIVMSG " + target + " :" + message);
  }
  
  this.cmd_NOTICE = function(args) {
    var allargs = args.splitMax(" ", 2);
    
    if(allargs.length < 2) {
      ui.errorMessage("Insufficient arguments for command.")
      return;
    }
    
    var target = allargs[0];
    var message = allargs[1];

    newTargetLine(target, "NOTICE", message);
    send("NOTICE " + target + " :" + message);
  }
  
  this.cmd_QUERY = function(args) {
    var allargs = args.splitMax(" ", 2);

    if(allargs.length < 1) {
      ui.errorMessage("Insufficient arguments for command.")
      return;
    }
          
    ui.newWindow(allargs[0]);
    ui.selectTab(allargs[0]);
    
    if((allargs.length > 1) && (allargs[1] != ""))
      self.cmd_PRIVMSG(args);
  }
  
  this.cmd_SAY = function(args) {
    var w = ui.getActiveWindow();
    if(!w || w.name == "") {
      ui.errorMessage("Can't use this command in this window");
      return;
    }
    
    if(args == "") {
      ui.errorMessage("Insufficient arguments for command.")
      return;      
    }
      
    self.cmd_PRIVMSG(w.name + " " + args);
  }
}
