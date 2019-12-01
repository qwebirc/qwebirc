/* This could do with a rewrite from scratch... by splitting into about 10 classes... */

//WEB_SOCKET_DEBUG = QWEBIRC_DEBUG;
//FORCE_LONGPOLL = true;

qwebirc.irc.IRCConnection = new Class({
  Implements: [Events, Options],
  options: {
    initialNickname: "ircconnX",
    minTimeout: 45000,
    maxTimeout: 5 * 60000,
    timeoutIncrement: 10000,
    initialTimeout: 30000,
    floodInterval: 200,
    floodMax: 10,
    floodReset: 5000,
    errorAlert: true,
    maxRetries: 5,
    serverPassword: null
  },
  log: function(x) {
    qwebirc.util.log("IRCConnection " + x);
  },
  initialize: function(options) {
    this.setOptions(options);
    
    this.initialNickname = this.options.initialNickname;
    
    this.counter = 0;
    this.disconnected = false;
    
    this.__floodLastRequest = 0;
    this.__floodCounter = 0;
    this.__floodLastFlood = 0;
    
    this.__retryAttempts = 0;
    
    this.__timeoutId = null;
    this.__timeout = this.options.initialTimeout;
    this.__activeRequest = null;
    this.__sendQueue = [];
    this.__sendQueueActive = false;
    this.__wsAttempted = false;
    this.__wsSupported = false;
    this.__wsEverConnected = false;
    this.__ws = null;
    this.__wsAuthed = false;

    this.__pubSeqNo = 0;
    this.__subSeqNo = 0;
    this.__sendRetries = 0;

    this.transportStatus = "unknown";
  },
  __error: function(text) {
    this.fireEvent("error", text);
    this.log("ERROR: " + text);
    if(this.options.errorAlert)
      alert(text);
  },
  newRequest: function(url, floodProtection, synchronous) {
    if(this.disconnected)
      return null;
      
    if(floodProtection && !this.disconnected && this.__isFlooding()) {
      this.disconnect();
      this.__error("BUG: uncontrolled flood detected -- disconnected.");
    }
    
    var asynchronous = true;
    if(synchronous)
      asynchronous = false;

    var r = new Request.JSON({
      url: qwebirc.global.dynamicBaseURL + "e/" + url + "?r=" + this.cacheAvoidance + "&t=" + this.counter++,
      async: asynchronous
    });
    
    /* try to minimise the amount of headers */
    r.headers = new Hash();
    r.addEvent("request", function() {
      var kill = ["Accept", "Accept-Language"];
      var killBit = "";

      if(Browser.Engine.trident) {
        killBit = "?";
        kill.push("User-Agent");
        kill.push("Connection");
      } else if(/Firefox[\/\s]\d+\.\d+/.test(navigator.userAgent)) { /* HACK */
        killBit = null;
      }

      for(var i=0;i<kill.length;i++) {
        try {
          this.setRequestHeader(kill[i], killBit);
        } catch(e) {
        }
      }
    }.bind(r.xhr));
    
    if(Browser.Engine.trident)
      r.setHeader("If-Modified-Since", "Sat, 1 Jan 2000 00:00:00 GMT");

    return r;
  },
  __isFlooding: function() {
    var t = new Date().getTime();
      
    if(t - this.__floodLastRequest < this.options.floodInterval) {
      if(this.__floodLastFlood != 0 && (t - this.__floodLastFlood > this.options.floodReset))
        this.__floodCounter = 0;

      this.__floodLastFlood = t;
      if(this.__floodCounter++ >= this.options.floodMax)
        return true;
    }

    this.__floodLastRequest = t;
    return false;
  },
  send: function(data, synchronous) {
    this.__pubSeqNo++;
    if(this.disconnected)
      return false;

    if(synchronous) {
      this.__send([this.__pubSeqNo, data], false);
    } else if(this.__ws && this.__wsAuthed) {
      this.__ws.send("p" + this.__pubSeqNo + "," + data);
    } else {
      /* seqno here is currently pointless but it's nice to enforce it in the protocol */
      this.__sendQueue.push([this.__pubSeqNo, data]);
      this.__processSendQueue();
    }
    
    return true;
  },
  __processSendQueue: function() {
    if(this.__sendQueueActive || this.__sendQueue.length == 0)
      return;

    this.__sendQueueActive = true;
    this.__send(this.__sendQueue[0], true);
  },
  __send: function(data, queued) {
    this.log("called send(" + data[1] + ")");
    var r = this.newRequest("p", false, !queued); /* !queued == synchronous */
    if(r === null)
      return;

    var handled = false;
    var retryEvent = null;
    if(queued) {
      var timeout = function() {
        this.log("timeout for " + data[1] + " fired");
        r.cancel();
        retry();
      }.delay(7500, this);
    }
    r.addEvent("complete", function(o) {
      this.log("complete for " + data[1] + " fired");
      if(queued) {
        $clear(timeout);
        this.__sendQueueActive = false;
      }
      if(retryEvent) {
        this.log("cleared retry event");
        $clear(retryEvent);
      }
      this.__sendRetries = 0;
      this.__sendQueue.shift();

      if(!o || (o[0] == false)) {
        this.__sendQueue = [];
        
        if(!this.disconnected) {
          this.disconnect();
          this.__error("An error occurred: " + (o ? o[1] : "(unknown error)"));
        }
        return false;
      }
      
      this.__processSendQueue();
    }.bind(this));

    if(queued) {
      var retry = function() {
        this.log("retry for " + data[1] + " fired... handled is " + handled);
        if(handled)
          return;
        handled = true;
        $clear(timeout);
        this.log("Unable to send command " + data + "... retrying (attempt " + this.__sendRetries + ")");
        if(this.__sendRetries++ < 3) {
          retryEvent = this.__send.delay(1500 * this.__sendRetries + Math.random() * 1000, this, [data, queued]);
        } else {
          this.disconnect();
          this.__error("Unable to send command after multiple retries.");
        }
      }.bind(this);
      r.addEvent("error", retry);
      r.addEvent("failure", retry);
    }
    r.send("s=" + this.sessionid + "&c=" + encodeURIComponent(data[1]) + "&n=" + data[0]);
  },
  __processData: function(o) {
    if(!o || o[0] == false) {
      if(!this.disconnected) {
        this.disconnect();
        this.__error("An error occurred: " + (o ? o[1] : "(unknown error)"));
      }
      return false;
    }
    
    this.__retryAttempts = 0;
    o.each(function(x) {
      this.fireEvent("recv", [x]);
    }, this);
    
    return true;
  },
  __cancelTimeout: function() {
    if($defined(this.__timeoutId)) {
      $clear(this.__timeoutId);
      this.__timeoutId = null;
    }
  },
  __timeoutEvent: function() {
    this.__timeoutId = null;

    if(!$defined(this.__activeRequest))
      return;
      
    this.__activeRequest.__replaced = true;
    this.__activeRequest.cancel();
    this.__activeRequest = null;

    if(this.__timeout + this.options.timeoutIncrement <= this.options.maxTimeout)
      this.__timeout+=this.options.timeoutIncrement;

    this.__recvLongPoll();
  },
  __checkRetries: function() {
    /* hmm, something went wrong! */
    if(this.__retryAttempts++ >= this.options.maxRetries && !this.disconnected) {
      this.disconnect();
      
      this.__error("Error: connection closed after several requests failed.");
      return false;
    }
    
    if(this.__timeout - this.options.timeoutIncrement >= this.options.minTimeout)
      this.__timeout-=this.options.timeoutIncrement;

    return true;
  },
  recv: function() {
    if(this.__wsSupported) {
      this.__recvWebSocket();
    } else {
      this.__recvLongPoll();
    }
  },
  __wsURL: function() {
    var wsproto;
    if (window.location.protocol === "https:") {
      wsproto = "wss";
    } else {
      wsproto = "ws";
    }
    return wsproto + "://" + window.location.host + (qwebirc.global.dynamicBaseURL ? qwebirc.global.dynamicBaseURL : "/") + "w";
  },
  __recvWebSocket: function() {
    if(this.disconnected)
      return;

    if(this.__wsAttempted) {
      if(!this.__wsEverConnected) {
        this.log("Failed first websocket connection... falling back to longpoll");
        this.transportStatus += "(nowDisabled)";
        /* give up and use long polling */
        this.__recvLongPoll();
        return;
      }
      this.log("Reconnecting to websocket...");
    }

    if(this.__isFlooding()) {
      this.disconnect();
      this.__error("BUG: uncontrolled flood detected -- disconnected.");
    }

    var ws = new WebSocket(this.__wsURL());
    this.__ws = ws;
    var retryExecuted = false;
    var doRetry = function(e) {
      if(retryExecuted)
        return;
      retryExecuted = true;

      ws.onerror = ws.onclose = ws.onopen = null;
      this.__ws = null;
      if(this.disconnected)
        return;

      if(this.__checkRetries())
        this.__recvWebSocket();
    }.bind(this);

    this.__wsAttempted = true;
    this.__wsAuthed = false;
    ws.onerror = function(e) {
      this.log("websocket error");
      doRetry(this, e);
    }.bind(this);
    ws.onclose = function(e) {
      this.log("websocket closed");

      if(e.wasClean && (e.code == 4999 || e.code == 4998)) {
        if(e.reason) {
          this.disconnect();
          this.__error("An error occurred: " + (e.reason ? e.reason : "(no reason returned)"));
          return;
        }
      }

      doRetry(this, e);
    }.bind(this);
    ws.onmessage = function(m) {
      var data = m.data;
      if(!this.__wsAuthed) {
        if(data == "sTrue") {
          this.__wsAuthed = true;
          this.__wsEverConnected = true;
          return;
        }
      } else {
        if(data.charAt(0) == "c") {
          var message = data.substr(1);
          var tokens = message.splitMax(",", 2);
          this.__subSeqNo = Number(tokens[0]);
          this.__processData(JSON.decode(tokens[1]));
          return;
        }
      }

      this.disconnect();
      this.__error("An error occurred: bad message type");
    }.bind(this);
    var connectionTimeout = function() {
      this.log("Websocket connection timeout...");
      ws.close();
      doRetry(this);
    }.delay(5000, this);
    ws.onopen = function() {
      if(retryExecuted || this.disconnected || this.__ws == null)
        return;
      $clear(connectionTimeout);
      this.log("websocket connected");
      ws.send("s" + this.__subSeqNo + "," + this.sessionid);
    }.bind(this);
  },
  __recvLongPoll: function() {
    var r = this.newRequest("s", true);
    if(!$defined(r))
      return;

    this.__activeRequest = r;
    r.__replaced = false;
    
    var onComplete = function(o) {
      if(r.__replaced)
        return;

      this.__activeRequest = null;
      this.__cancelTimeout();
      
      if(!o) {
        if(this.disconnected)
          return;
          
        if(this.__checkRetries())
          this.__recvLongPoll();
        return;
      }

      this.__subSeqNo = Number(r.xhr.getResponseHeader("N"));
      if(this.__processData(o))
        this.__recvLongPoll();
    };

    r.addEvent("complete", onComplete.bind(this));

    this.__timeoutId = this.__timeoutEvent.delay(this.__timeout, this);
    r.send("s=" + this.sessionid + "&n=" + this.__subSeqNo);
  },
  connect: function() {
    qwebirc.ui.requireDynamicConfiguration(this.__innerConnect.bind(this));
  },
  __innerConnect: function() {
    this.cacheAvoidance = qwebirc.util.randHexString(16);

    var r = this.newRequest("n");
    r.addEvent("complete", function(o) {
      if(!o) {
        this.disconnect();
        this.__error("Couldn't connect to remote server.");
        return;
      }
      if(o[0] == false) {
        this.disconnect();
        this.__error("An error occurred: " + o[1]);
        return;
      }
      this.sessionid = o[1];
      var transports = o[2];

      this.__wsSupported = false;
      this.__decideTransport(transports);
    }.bind(this));

    var postdata = "nick=" + encodeURIComponent(this.initialNickname);
    if($defined(this.options.serverPassword))
      postdata+="&password=" + encodeURIComponent(this.options.serverPassword);
    var loggedin = qwebirc.auth.loggedin(false);
    if(loggedin)
      postdata+="&qticket=" + encodeURIComponent(loggedin[1]);
    r.send(postdata);
  },
  __decideTransport: function(transports) {
    this.log("server supports " + transports);
    if(transports.indexOf("websocket") == -1) {
      this.log("no websocket on server: using longpoll");
      this.transportStatus = "longpoll(serverNoWS)";
      this.recv();
      return;
    }
    qwebirc.util.WebSocket(function(supported, transport) {
      this.transportStatus = transport;
      if(supported) {
        this.log("websocket present on client and server: using websocket");
        this.__wsSupported = true;
      } else {
        this.log("websocket present on server but not client: using longpoll");
      }
      this.recv();
    }.bind(this));
  },
  __cancelRequests: function() {
    if($defined(this.__activeRequest)) {
      this.__activeRequest.__replaced = true;
      this.__activeRequest.cancel();
      this.__activeRequest = null;
    }
    if($defined(this.__ws)) {
      this.__ws.close();
      this.__ws = null;
    }
  },
  disconnect: function() {
    this.disconnected = true;
    this.__cancelTimeout();
    this.__cancelRequests();
  }
});

qwebirc.util.__WebSocketState = { "loading": false, "result": undefined, "callbacks": [] };
qwebirc.util.WebSocket = function(callback) {
  var log = qwebirc.util.log;
  var state = qwebirc.util.__WebSocketState;
  var fire = latch = function(x, y) {
    if($defined(x)) {
      state.result = [x, y];
    }
    callback(state.result[0], state.result[1]);
  };

  if($defined(state.result))
    return fire();

  if(state.loading)
    return;

  if(window.FORCE_LONGPOLL) {
    log("FORCE_LONGPOLL set");
    return latch(false, "longPoll(forced)");
  }

  var modeSuffix = "";
  if(window.WebSocket) {
    log("WebSocket detected");
    return latch(true, "native");
  } if(window.MozWebSocket) {
    log("MozWebSocket detected");
    window.WebSocket = MozWebSocket;
    return latch(true, "nativeMoz");
  }

  log("no WebSocket support in browser");
  return latch(false, "longPoll");
};

