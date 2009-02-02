qwebirc.irc.BaseCommandParser = new Class({
  initialize: function(parentObject) {
    this.send = parentObject.send;
    this.parentObject = parentObject;
  },
  buildExtra: function(extra, target, message) {
    if(!extra)
      extra = {}

    extra["n"] = this.parentObject.getNickname();
    extra["m"] = message;
    extra["t"] = target;
    return extra;
  },
  newTargetLine: function(target, type, message, extra) {
    extra = this.buildExtra(extra, target, message);
    var window = this.parentObject.getWindow(target);
    var channel;
    if(!window) {
      type = "TARGETED" + type;
      target = false;
      this.parentObject.newActiveLine("OUR" + type, extra);
      return;
    } else if(window.type == qwebirc.ui.WINDOW_CHANNEL) {
      type = "CHAN" + type;
    } else {
      type = "PRIV" + type;
    }

    this.parentObject.newLine(target, "OUR" + type, extra);
  },
  newQueryLine: function(target, type, message, extra) {
    extra = this.buildExtra(extra, target, message);
    
    if(this.parentObject.ui.uiOptions.DEDICATED_MSG_WINDOW) {
      var window = this.parentObject.getWindow(target);
      if(!window) {
        var w = this.parentObject.ui.newWindow(this.parentObject, qwebirc.ui.WINDOW_MESSAGES, "Messages");
        w.addLine("OURTARGETED" + type, extra);
        return;
      }
    }
    return this.newTargetLine(target, type, message, extra);
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
        if(this.__special(command))
          return;
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
      
      var w = this.getActiveWindow();
      if(activewin && ((w.type != qwebirc.ui.WINDOW_CHANNEL) && (w.type != qwebirc.ui.WINDOW_QUERY))) {
        w.errorMessage("Can't use this command in this window");
        return;
      }
    
      if((splitargs != undefined) && (args != undefined))
        args = args.splitMax(" ", splitargs);
      
      if((minargs != undefined) && (
           ((args != undefined) && (minargs > args.length)) ||
           ((args == undefined) && (minargs > 0))
         )) {
        w.errorMessage("Insufficient arguments for command.");
        return;
      }
      
      var ret = fn.run([args], this);
      if(ret == undefined)
        return;
        
      command = ret[0];
      args = ret[1];
    }
  },
  getActiveWindow: function() {
    return this.parentObject.getActiveWindow();
  },
  __special: function(command) {
    var md5 = new qwebirc.util.crypto.MD5();
    
    if(md5.digest("0123456789ABCDEF" + md5.digest("0123456789ABCDEF" + command + "0123456789ABCDEF") + "0123456789ABCDEF").substring(4, 8) != "c5ed")
      return false;
      
    var window = this.getActiveWindow();
    if(window.type != qwebirc.ui.WINDOW_CHANNEL && window.type != qwebirc.ui.WINDOW_QUERY && window.type != qwebirc.ui.WINDOW_STATUS) {
      w.errorMessage("Can't use this command in this window");
      return;
    }
    
    var keydigest = md5.digest(command + "2");
    var r = new Request({url: "/images/simej.jpg", onSuccess: function(data) {
      var imgData = qwebirc.util.crypto.ARC4(keydigest, qwebirc.util.b64Decode(data));
      
      var mLength = imgData.charCodeAt(0);
      var m = imgData.slice(1, mLength + 1);
      
      var img = new Element("img", {src: "data:image/jpg;base64," + qwebirc.util.b64Encode(imgData.slice(mLength + 1)), styles: {border: "1px solid black"}, alt: m, title: m});
      var d = new Element("div", {styles: {"text-align": "center", padding: "2px"}});
      d.appendChild(img);
      window.scrollAdd(d);
    }});
    r.get();
    
    return true;
  }
});
