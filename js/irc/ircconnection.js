/* This could do with a rewrite from scratch. */

qwebirc.irc.IRCConnection = new Class({
  Implements: [Events, Options],
  options: {
    initialNickname: "ircconnX",
    timeout: 30000,
    errorAlert: true
  },
  initialize: function(options) {
    this.setOptions(options);
    
    this.initialNickname = this.options.initialNickname;
    
    this.counter = 0;
    this.disconnected = false;

    this.activerequest = null;
    this.timeoutid = null;
  },
  __error: function(text) {
    this.fireEvent("error", text);
    if(this.errorAlert)
      alert(text);
  },
  send: function(data) {
    if(this.disconnected)
      return false;
    var r = new Request.JSON({url: "/e/p/" + this.sessionid + "?c=" + encodeURIComponent(data) + "&t=" + this.counter++, onComplete: function(o) {
      if(!o || (o[0] == false)) {
        if(!this.disconnected) {
          this.disconnected = true;
          this.__error("An error occured: " + o[1]);
        }
        return false;
      }
    }.bind(this)});
    
    r.get();
    return true;
  },
  __timeout: function() {
    if(this.lastactiverequest) {
      this.lastactiverequest.cancel();
      this.lastactiverequest = null;
    }
    if(this.activerequest) {
      this.lastactiverequest = this.activerequest;
      /*this.activerequest.cancel();
      this.activerequest = null;*/
    }
    if($defined(this.timeoutid)) {
      $clear(this.timeoutid);
      this.timeoutid = null;
    }
    this.recv();
  },
  recv: function() {
    var r = new Request.JSON({url: "/e/s/" + this.sessionid + "?t=" + this.counter++, onComplete: function(o) {
      if(this.lastactiverequest != r) 
        this.activerequest = null;
        
      if($defined(this.timeoutid)) {
        $clear(this.timeoutid);
        this.timeoutid = null;
      }

      if(o) {
        if(this.lastactiverequest == r)
          this.lastactiverequest = null;
        this.lasttry = false;
        if(o[0] == false) {
          if(!this.disconnected) {
            this.disconnected = true;

            this.__error("An error occured: " + o[1]);
          }
          return;
        }
        o.each(function(x) {
          this.fireEvent("recv", [x]);
        }, this);
      } else {
        if(this.lastactiverequest == r) {
          this.lastactiverequest = null;
          return;
        }
        if(!this.disconnected) {
          if(this.lasttry) {
            this.disconnected = true;

            this.__error("Error: the server closed the connection.");
            return;
          } else {
            this.lasttry = true;
          }
        }
      }
      
      this.recv();
    }.bind(this)});

    if(this.options.timeout)
      this.timeoutid = this.__timeout.delay(this.options.timeout, this);
    
    this.activerequest = r;
    r.get();
  },
  connect: function() {
    var r = new Request.JSON({url: "/e/n?nick=" + encodeURIComponent(this.initialNickname) + "&r=" + Math.random() * 1024 * 1024, onComplete: function(o) {
      if(!o) {
        this.disconnected = true;
        this.__error("Couldn't connect to remote server.");
        return;
      }
      if(o[0] == false) {
        this.disconnected = true;
        this.__error("An error occured: " + o[1]);
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
