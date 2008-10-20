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
      var inick = this.options.initialNickname;
      var ichans = this.options.initialChannels;
      var autoNick = true;
      
      var callback = function(options) {
        var IRC = new qwebirc.irc.IRCClient(options, ui_);
        IRC.connect();
        window.addEvent("beforeunload", function() {
          IRC.quit("Page closed");
        });
      };

      var supplied = false; 
      if(this.options.searchURL) {
        var args = qwebirc.util.parseURI(String(document.location));
        
        var chans = args["channels"];
        var nick = args["nick"];

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
          supplied = true;
        }
        
        if($defined(nick)) {
          inick = nick;
          autoNick = false;
        }
        
        if(supplied && args["prompt"])
          supplied = false;
      }
      
      var details = ui_.loginBox(callback, inick, ichans, supplied, autoNick);
    }.bind(this));
  }
});
