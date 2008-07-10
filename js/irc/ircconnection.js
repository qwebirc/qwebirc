var IRCConnection = new Class({
  Implements: [Events, Options],
  options: {
    initialNickname: "ircconnX"
  },
  initialize: function(options) {
    this.setOptions(options);
    
    this.initialNickname = this.options.initialNickname;
    
    this.counter = 0;
    this.disconnected = false;
  },
  send: function(data) {
    var r = new Request.JSON({url: "/e/p/" + this.sessionid + "?c=" + encodeURIComponent(data) + "&t=" + this.counter++, onComplete: function(o) {
      if(o[0] == false)
        alert("An error occured: " + o[1]);
    }});
    
    r.get();
  },
  x: function() {
    this.fireEvent("recv", [[false, "moo"]]);
  },
  recv: function() {
    if(this.disconnected)
      return;
      
    var r = new Request.JSON({url: "/e/s/" + this.sessionid + "?t=" + this.counter++, onComplete: function(o) {
      if(o) {
        if(o[0] == false) {
          alert("An error occured: " + o[1]);
          return;
        }
        o.each(function(x) {
          this.fireEvent("recv", [x]);
        }, this);
      }
      
      this.recv();
    }.bind(this)});    
    r.get();
  },
  connect: function() {
    var r = new Request.JSON({url: "/e/n?nick=" + encodeURIComponent(this.initialNickname) + "&r=" + Math.random() * 1024 * 1024, onComplete: function(o) {
      if(o[0] == false) {
        alert("An error occured: " + o[1]);
        return;
      }
      this.sessionid = o[1];
      
      this.recv();    
    }.bind(this)});
    r.post();
  },
  disconnect: function() {
    this.disconnected = true;
  }
});
