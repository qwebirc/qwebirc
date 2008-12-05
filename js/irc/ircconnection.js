/* This could do with a rewrite from scratch. */

qwebirc.irc.IRCConnection = new Class({
  Implements: [Events, Options],
  options: {
    initialNickname: "ircconnX",
    timeout: 30000,
    floodInterval: 250,
    floodMax: 5,
    errorAlert: true
  },
  initialize: function(options) {
    this.setOptions(options);
    
    this.initialNickname = this.options.initialNickname;
    
    this.counter = 0;
    this.disconnected = false;
    
    this.lastActiveRequest = 0;
    this.floodCounter = 0;
    
    this.activerequest = null;
    this.timeoutid = null;
  },
  __error: function(text) {
    this.fireEvent("error", text);
    if(this.options.errorAlert)
      alert(text);
  },
  newRequest: function(url, onComplete, floodProtection) {
    if(floodProtection) {
      var t = new Date().getTime();
      
      if(t - this.lastActiveRequest < this.options.floodInterval) {
        if(this.floodCounter++ >= this.options.floodMax) {
          if(!this.disconnected) {
            this.disconnect();
            this.__error("BUG: uncontrolled flood detected -- disconnected.");
            return {"send": function() { }, "cancel": function() { }};
          }
        }
      }
      this.lastActiveRequest = t;
    }
    
    var r = new Request.JSON({
      url: "/e/" + url + "?r=" + this.cacheAvoidance + "&t=" + this.counter++,
      onComplete: onComplete
    });
    
    /* try to minimise the amount of headers */
    r.headers = new Hash;
    r.addEvent("request", function() {
      var setHeader = function(key, value) {
        try {
          this.setRequestHeader(key, value);
        } catch(e) {
        }
      }.bind(this);
    
      setHeader("User-Agent", null);
      setHeader("Accept", null);
      setHeader("Accept-Language", null);
    }.bind(r.xhr));
    
    if(Browser.Engine.trident)
      r.setHeader("If-Modified-Since", "Sat, 1 Jan 2000 00:00:00 GMT");

    return r;
  },
  send: function(data) {
    if(this.disconnected)
      return false;
    var r = this.newRequest("p", function(o) {
      if(!o || (o[0] == false)) {
        if(!this.disconnected) {
          this.disconnected = true;
          this.__error("An error occured: " + o[1]);
        }
        return false;
      }
    }.bind(this));
    r.send("s=" + this.sessionid + "&c=" + encodeURIComponent(data));
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
    var r = this.newRequest("s", function(o) {
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
    }.bind(this), true);

    if(this.options.timeout)
      this.timeoutid = this.__timeout.delay(this.options.timeout, this);
    
    this.activerequest = r;
    r.send("s=" + this.sessionid);
  },
  connect: function() {
    this.cacheAvoidance = qwebirc.util.randHexString(16);
    
    var r = this.newRequest("n", function(o) {
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
    }.bind(this));
    
    r.send("nick=" + encodeURIComponent(this.initialNickname));
  },
  disconnect: function() {
    this.disconnected = true;
    if(this.lastactiverequest) {
      this.lastactiverequest.cancel();
      this.lastactiverequest = null;
    }
    if($defined(this.timeoutid)) {
      $clear(this.timeoutid);
      this.timeoutid = null;
    }
  }
});
