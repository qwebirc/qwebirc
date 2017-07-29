function qwebirc_ui_onbeforeunload(e) { /* IE sucks */
  if(qwebirc.connected) {
    var message = "This action will close all active IRC connections.";
    var e = e || window.event;
    if(e)
      e.returnValue = message;
    return message;
  }
}

qwebirc.ui.Interface = new Class({
  Implements: [Options],
  options: {
    initialNickname: null,
    initialChannels: null,
    networkName: "ExampleNetwork",
    networkServices: [],
    loginRegex: null,
    appTitle: "ExampleNetwork Web IRC",
    searchURL: true,
    theme: undefined,
    baseURL: null,
    hue: null,
    saturation: null,
    lightness: null,
    thue: null,
    tsaturation: null,
    tlightness: null,
    uiOptionsArg: null,
    nickValidation: null,
    dynamicBaseURL: "/",
    staticBaseURL: "/",
    cloak: false,
    logoURL: null,
    accountWhoisCommand: null
  },
  initialize: function(element, ui, options) {
    this.setOptions(options);
    var extractHost = function() {
      var uri = document.location.href;

      /* IE6 doesn't have document.origin ... */
      var start = uri.indexOf('?');
      if(start != -1)
        uri = uri.substring(0, start);
      var start = uri.indexOf('#');
      if(start != -1)
        uri = uri.substring(0, start);

      if(QWEBIRC_DEBUG && uri.endsWith(".html")) {
        var last = uri.lastIndexOf("/");
        uri = uri.substring(0, last + 1);
      }
      if(uri.substr(uri.length - 1) != "/")
        uri = uri + "/";

      return uri;
    };

    options.baseURL = extractHost();
    
    /* HACK */
    qwebirc.global = {
      dynamicBaseURL: options.dynamicBaseURL,
      staticBaseURL: options.staticBaseURL,
      baseURL: options.baseURL,
      nicknameValidator: $defined(options.nickValidation) ? new qwebirc.irc.NicknameValidator(options.nickValidation) : new qwebirc.irc.DummyNicknameValidator()
    };

    window.addEvent("domready", function() {
      var callback = function(options) {
        options.cloak = ui_.options.cloak;
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
        this.options.hue = this.getHueArg(args, "");
        this.options.saturation = this.getSaturationArg(args, "");
        this.options.lightness = this.getLightnessArg(args, "");

        this.options.thue = this.getHueArg(args, "t");
        this.options.tsaturation = this.getSaturationArg(args, "t");
        this.options.tlightness = this.getLightnessArg(args, "t");
        
        if(args.contains("uio"))
          this.options.uiOptionsArg = args.get("uio");

        var url = args.get("url");
        var chans, nick = args.get("nick");
        
        if($defined(url)) {
          ichans = this.parseIRCURL(url);
          if($defined(chans) && chans != "")
            canAutoConnect = true;
        } else {
          chans = args.get("channels");

          var canAutoConnect = false;
        
          if(chans) {
            var cdata = chans.split(" ");
          
            chans = cdata[0].split(",");
            var chans2 = [];
          
            for(var i=0;i<chans.length;i++) {
              chans2[i] = chans[i];

                var prefix = chans[i].charAt(0);
                if(prefix != '#' && prefix != '&')
                chans2[i] = "#" + chans2[i]
            }
            cdata[0] = chans2.join(",");
            ichans = cdata.join(" ");
            canAutoConnect = true;
          }
        }
        
        if($defined(nick))
          inick = this.randSub(nick);
          
        if(args.contains("randomnick") && args.get("randomnick") == 1)
          inick = this.options.initialNickname;

        if(args.contains("cloak") && args.get("cloak") == 1)
          this.options.cloak = true;

        /* we only consider autoconnecting if the nick hasn't been supplied, or it has and it's not "" */
        if(canAutoConnect && (!$defined(inick) || ($defined(inick) && (inick != "")))) {
          var p = args.get("prompt");
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
  getHueArg: function(args, t) {
    var hue = args.get(t + "hue");
    if(!$defined(hue))
      return null;
    hue = parseInt(hue);
    if(hue > 360 || hue < 0)
      return null;
    return hue;
  },
  getSaturationArg: function(args, t) {
    var saturation = args.get(t + "saturation");
    if(!$defined(saturation))
      return null;
    saturation = parseInt(saturation);
    if(saturation > 100 || saturation < -100)
      return null;
    return saturation;
  },
  getLightnessArg: function(args, t) {
    var lightness = args.get(t + "lightness");
    if(!$defined(lightness))
      return null;
    lightness = parseInt(lightness);
    if(lightness > 100 || lightness < -100)
      return null;
    return lightness;
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
      queryArgs.each(function(key_, value) {
        if(key_ == "key") {
          key = value;
          needkey = true;
        } else {
          not_supported.push(key_);
        }
      });
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
