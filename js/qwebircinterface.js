qwebirc.ui.Interface = new Class({
  Implements: [Options],
  options: {
    initialNickname: "qwebirc" + Math.ceil(Math.random() * 100000),
    initialChannels: "",
    searchURL: true,
    theme: undefined
  },
  initialize: function(element, ui, options) {
    this.setOptions(options);

    window.addEvent("domready", function() {
      var ui_ = new ui($(element), new qwebirc.ui.Theme(this.options.theme));
      
      var callback = function(options) {
        var IRC = new qwebirc.irc.IRCClient(options, ui_);
        IRC.connect();
        window.addEvent("beforeunload", function() {
          IRC.quit("Page closed");
        });
      };

      var inick = null;
      var ichans = this.options.initialChannels;
      var autoConnect = false;
      
      if(this.options.searchURL) {
        var args = qwebirc.util.parseURI(String(document.location));
        
        var chans = args["channels"];
        var nick = args["nick"];

        var canAutoConnect = false;
        
        if(chans) {
          var cdata = chans.split(" ");
          
          chans = cdata[0].split(",");
          var chans2 = [];
          
          for(i=0;i<chans.length;i++) {
            chans2[i] = chans[i];
            
            if(chans[i].charAt(0) != '#')
              chans2[i] = "#" + chans2[i]
          }
          cdata[0] = chans2.join(",");
          ichans = cdata.join(" ");
          canAutoConnect = true;
        }
        
        if($defined(nick))
          inick = nick;
        
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
  
      var usingAutoNick = !$defined(nick);
      if(usingAutoNick && autoConnect)
        inick = this.options.initialNickname;
      
      var details = ui_.loginBox(callback, inick, ichans, autoConnect, usingAutoNick);
    }.bind(this));
  }
});
