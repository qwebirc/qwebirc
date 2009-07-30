function qwebirc_ui_onbeforeunload(e) { /* IE sucks */
  var message = "This action will close all active IRC connections.";
  var e = e || window.event;
  if(e)
    e.returnValue = message;
  return message;
}

qwebirc.ui.Interface = new Class({
  Implements: [Options],
  options: {
    initialNickname: "qwebirc" + Math.ceil(Math.random() * 100000),
    initialChannels: "",
    networkName: "ExampleNetwork",
    networkServices: [],
    loginRegex: null,
    appTitle: "ExampleNetwork Web IRC",
    searchURL: true,
    theme: undefined,
    baseURL: null,
    hue: null
  },
  initialize: function(element, ui, options) {
    this.setOptions(options);

    window.addEvent("domready", function() {
      var callback = function(options) {
        var IRC = new qwebirc.irc.IRCClient(options, ui_);
        IRC.connect();
        window.onbeforeunload = qwebirc_ui_onbeforeunload;
        window.addEvent("unload", function() {
          IRC.quit("Page closed");
        });
      };

      var inick = null;
      var ichans = this.options.initialChannels;
      var autoConnect = false;
      
      if(this.options.searchURL) {
        var args = qwebirc.util.parseURI(String(document.location));
        this.options.hue = this.getHueArg(args);
        var url = args["url"];
        var chans, nick = args["nick"];
        
        if($defined(url)) {
          ichans = this.parseIRCURL(url);
          if($defined(chans) && chans != "")
            canAutoConnect = true;
        } else {
          chans = args["channels"];

          var canAutoConnect = false;
        
          if(chans) {
            var cdata = chans.split(" ");
          
            chans = cdata[0].split(",");
            var chans2 = [];
          
            for(var i=0;i<chans.length;i++) {
              chans2[i] = chans[i];
            
              if(chans[i].charAt(0) != '#')
                chans2[i] = "#" + chans2[i]
            }
            cdata[0] = chans2.join(",");
            ichans = cdata.join(" ");
            canAutoConnect = true;
          }
        }
        
        if($defined(nick))
          inick = this.randSub(nick);
          
        if(args["randomnick"] && args["randomnick"] == 1)
          inick = this.options.initialNickname;
          
        /* we only consider autoconnecting if the nick hasn't been supplied, or it has and it's not "" */
        if(canAutoConnect && (!$defined(inick) || ($defined(inick) && (inick != "")))) {
          var p = args["prompt"];
          var pdefault = false;
          
          if(!$defined(p) || p == "") {
            pdefault = true;
            p = false;
          } else if(p == "0") {
            p = false;
          } else {
            p = true;
          }
          
          /* autoconnect if we have channels and nick but only if prompt != 1 */
          if($defined(inick) && !p) {
            autoConnect = true;
          } else if(!pdefault && !p) { /* OR if prompt=0, but not prompt=(nothing) */
            autoConnect = true;
          }
        }
      }
  
      var ui_ = new ui($(element), new qwebirc.ui.Theme(this.options.theme), this.options);

      var usingAutoNick = !$defined(nick);
      if(usingAutoNick && autoConnect)
        inick = this.options.initialNickname;
      
      var details = ui_.loginBox(callback, inick, ichans, autoConnect, usingAutoNick);
    }.bind(this));
  },
  getHueArg: function(args) {
    var hue = args["hue"];
    if(!$defined(hue))
      return null;
    hue = parseInt(hue);
    if(hue > 360 || hue < 0)
      return null;
    return hue;
  },
  randSub: function(nick) {
    var getDigit = function() { return Math.floor(Math.random() * 10); }
    
    return nick.split("").map(function(v) {
      if(v == ".") {
        return getDigit();
      } else {
        return v;
      }
    }).join("");
    
  },
  parseIRCURL: function(url) {
    if(url.indexOf(":") == 0)
      return;
    var schemeComponents = url.splitMax(":", 2);
    if(schemeComponents[0].toLowerCase() != "irc" && schemeComponents[0].toLowerCase() != "ircs") {
      alert("Bad IRC URL scheme.");
      return;
    }

    if(url.indexOf("/") == 0) {
      /* irc: */
      return;
    }
    
    var pathComponents = url.splitMax("/", 4);
    if(pathComponents.length < 4 || pathComponents[3] == "") {
      /* irc://abc */
      return;
    }
    
    var args, queryArgs;
    if(pathComponents[3].indexOf("?") > -1) {
      queryArgs = qwebirc.util.parseURI(pathComponents[3]);
      args = pathComponents[3].splitMax("?", 2)[0];
    } else {
      args = pathComponents[3];
    }
    var parts = args.split(",");

    var channel = parts[0];
    if(channel.charAt(0) != "#")
      channel = "#" + channel;

    var not_supported = [], needkey = false, key;
    for(var i=1;i<parts.length;i++) {
      var value = parts[i];
      if(value == "needkey") {
        needkey = true;
      } else {
        not_supported.push(value);
      }
    }

    if($defined(queryArgs)) {
      for(var key_ in queryArgs) {
        var value = queryArgs[key_];
        
        if(key_ == "key") {
          key = value;
          needkey = true;
        } else {
          not_supported.push(key_);
        }
      }
    }
    
    if(needkey) {
      if(!$defined(key))
        key = prompt("Please enter the password for channel " + channel + ":");
      if($defined(key))
        channel = channel + " " + key;
    }
    
    if(not_supported.length > 0)
      alert("The following IRC URL components were not accepted: " + not_supported.join(", ") + ".");
    
    return channel;
  }
});
