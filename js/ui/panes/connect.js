qwebirc.ui.ConnectPane = new Class({
  Implements: [Events],
  initialize: function(parent, options) {
    var callback = options.callback, initialNickname = options.initialNickname, initialChannels = options.initialChannels, autoConnect = options.autoConnect, autoNick = options.autoNick;
    this.options = options;
    this.cookie = new Hash.Cookie("optconn", {duration: 3650, autoSave: false});
    var uiOptions = options.uiOptions;
    this.__windowName = "authgate_" + Math.floor(Math.random() * 100000);

    var delayfn = function() { parent.set("html", "<div class=\"loading\">Loading. . .</div>"); };
    var cb = delayfn.delay(500);

    var r = qwebirc.ui.RequestTransformHTML({url: qwebirc.global.staticBaseURL + "panes/connect.html", update: parent, onSuccess: function() {
      $clear(cb);

      var rootElement = parent.getElement("[name=connectroot]");
      this.rootElement = rootElement;
      
      this.util.exec = function(n, x) { rootElement.getElements(n).each(x); };
      var util = this.util;
      var exec = util.exec;

      var box = (autoConnect ? "confirm" : "login");
      exec("[name=" + box + "box]", util.setVisible(true));

      if(!autoConnect) {
        if($defined(uiOptions.logoURL)) {
          var logoBar = parent.getElement("[class=bar-logo]");
          if(uiOptions.logoURL)
            logoBar.setAttribute("style", "background: url(" + uiOptions.logoURL + ") no-repeat center top; _filter: progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + uiOptions.logoURL + "',sizingMethod='crop');");

          util.makeVisible(parent.getElement("[name=loginheader]"));
        } else {
          util.makeVisible(parent.getElement("[name=nologologinheader]"));
        }
      }

      if(initialNickname === null && initialChannels === null) {
        var n2 = this.cookie.get("nickname");
        if(n2 !== null)
          initialNickname = n2;

        var c2 = this.cookie.get("autojoin");
        if(c2 !== null)
          initialChannels = c2;
      }

      if(initialChannels === null) {
        initialChannels = "";
      }

      exec("[name=nickname]", util.setText(initialNickname));
      exec("[name=channels]", util.setText(initialChannels));
      exec("[name=prettychannels]", function(node) { this.__buildPrettyChannels(node, initialChannels); }.bind(this));
      exec("[name=networkname]", util.setText(uiOptions.networkName));

      var focus = "connect";
      if(autoConnect) {
        if(!autoNick)
          exec("[name=nickselected]", util.makeVisible);

        this.__validate = this.__validateConfirmData;
      } else {
	if(!initialNickname) {
          focus = "nickname";
        } else if(initialNickname && !initialChannels) {
          focus = "channels";
        }

        this.__validate = this.__validateLoginData;
      }

      if(qwebirc.auth.loggedin()) {
        exec("[name=authname]", util.setText(qwebirc.auth.loggedin()));
        exec("[name=connectbutton]", util.makeVisible);
        exec("[name=loginstatus]", util.makeVisible);
      } else {
        if(qwebirc.ui.isAuthRequired()) {
          exec("[name=loginconnectbutton]", util.makeVisible);
          if(focus == "connect")
            focus = "loginconnect";
        } else {
          exec("[name=connectbutton]", util.makeVisible);
          exec("[name=loginbutton]", util.makeVisible);
        }
      }

      if(window == window.top) /* don't focus when we're iframe'd */
        exec("[name=" + focus + "]", util.focus);
      exec("[name=connect]", util.attachClick(this.__connect.bind(this)));
      exec("[name=loginconnect]", util.attachClick(this.__loginConnect.bind(this)));

      exec("[name=login]", util.attachClick(this.__login.bind(this)));

      if(qwebirc.ui.isHideAuth())
       exec("[name=login]", util.setVisible(false));
    }.bind(this)});
    r.get();
  },
  util: {
    makeVisible: function(x) { x.setStyle("display", ""); },
    setVisible: function(y) { return function(x) { x.setStyle("display", y ? "" : "none"); }; },
    focus: function(x) { try { x.focus(); } catch (e) { } },
    attachClick: function(fn) { return function(x) { x.addListener("click", fn); } },
    setText: function(x) { return function(y) {
      if(typeof y.value === "undefined") {
        y.set("text", x);
      } else {
        y.value = x === null ? "" : x;
      }
    } }
  },
  validate: function() {
    return this.__validate();
  },
  __connect: function(e) {
    new Event(e).stop();
    var data = this.validate();
    if(data === false)
      return;

    this.__cancelLogin();
    this.fireEvent("close");
    this.cookie.extend(data);
    this.cookie.save();
    this.options.callback(data);
  },
  __cancelLogin: function(noUIModifications) {
    if(this.__cancelLoginCallback)
      this.__cancelLoginCallback(noUIModifications);
  },
  __loginConnect: function(e) {
    new Event(e).stop();
    if(this.validate() === false)
      return;

    this.__performLogin(function() {
      var data = this.validate();
      if(data === false) {
        /* we're logged in -- show the normal join button */
        this.util.exec("[name=connectbutton]", this.util.setVisible(true));
        return;
      }

      this.fireEvent("close");
      this.options.callback(data);
    }.bind(this), "loginconnectbutton");
  },
  __login: function(e) {
    new Event(e).stop();

    this.__cancelLogin(true);

    this.__performLogin(function() {
      var focus = "connect";
      if(!this.options.autoConnect) {
        var nick = this.rootElement.getElement("input[name=nickname]").value, chan = this.rootElement.getElement("input[name=channels]").value;
        if(!nick) {
          focus = "nickname";
        } else if(!chan) {
          focus = "channels";
        }
      }
      this.util.exec("[name=" + focus + "]", this.util.focus);        
    }.bind(this), "login");
  },
  __performLogin: function(callback, calleename) {
    Cookie.write("jslogin", "1");

    var handle = window.open("/auth", this.__windowName, "status=0,toolbar=0,location=1,menubar=0,directories=0,resizable=0,scrollbars=1,height=280,width=550");

    if(handle === null || handle === undefined) {
      Cookie.dispose("jslogin");
//      Cookie.write("redirect", document.location);
//      window.location = "auth?";
      return;
    }        

    var closeDetector = function() {
      if(handle.closed)
        this.__cancelLoginCallback();
    }.bind(this);
    var closeCallback = closeDetector.periodical(100);

    this.__cancelLoginCallback = function(noUIModifications) {
      $clear(closeCallback);

      Cookie.dispose("jslogin");

      try {
        handle.close();
      } catch(e) {
      }

      if(!noUIModifications) {
        this.util.exec("[name=loggingin]", this.util.setVisible(false));
        this.util.exec("[name=" + calleename + "]", this.util.setVisible(true));
      }
      this.__cancelLoginCallback = null;
    }.bind(this);

    this.util.exec("[name=loggingin]", this.util.setVisible(true));
    this.util.exec("[name=" + calleename + "]", this.util.setVisible(false));

    __qwebircAuthCallback = function(username, expiry, serverNow) {
      this.__cancelLoginCallback(true);

      var now = new Date().getTime();
      var offset = (serverNow * 1000) - now;
      var ourExpiry = expiry * 1000 - offset;
      Cookie.write("ticketexpiry", ourExpiry)

      this.util.exec("[name=loggingin]", this.util.setVisible(false));
      this.util.exec("[name=loginstatus]", this.util.setVisible(true));
      this.util.exec("[name=authname]", this.util.setText(username));
      callback();
    }.bind(this);

  },
  __validateConfirmData: function() {
    return {nickname: this.options.initialNickname, autojoin: this.options.initialChannels};
  },
  __validateLoginData: function() {
    var nick = this.rootElement.getElement("input[name=nickname]"), chan = this.rootElement.getElement("input[name=channels]");

    var nickname = nick.value;
    var chans = chan.value;
    if(chans == "#") /* sorry channel "#" :P */
      chans = "";

    if(!nickname) {
      alert("You must supply a nickname.");
      nick.focus();
      return false;
    }

    var stripped = qwebirc.global.nicknameValidator.validate(nickname);
    if(stripped != nickname) {
      nick.value = stripped;
      alert("Your nickname was invalid and has been corrected; please check your altered nickname and try again.");
      nick.focus();
      return false;
    }
    
    var data = {nickname: nickname, autojoin: chans};
    return data;
  },
  __buildPrettyChannels: function(node, channels) {
    var c = channels.split(" ")[0].split(",");
    node.appendChild(document.createTextNode("channel" + ((c.length>1)?"s":"") + " "));
    for(var i=0;i<c.length;i++) {
      if((c.length > 1) && (i == c.length - 1)) {
        node.appendChild(document.createTextNode(" and "));
      } else if(i > 0) {
        node.appendChild(document.createTextNode(", "));
      }
      node.appendChild(new Element("b").set("text", c[i]));
    }
  }
});

qwebirc.ui.LoginBox2 = function(parentElement, callback, initialNickname, initialChannels, networkName) {
/*
  if(qwebirc.auth.enabled()) {
    if(qwebirc.auth.passAuth()) {
      var authRow = createRow("Auth to services:");
      var authCheckBox = qwebirc.util.createInput("checkbox", authRow, "connect_auth_to_services", false);
    
      var usernameBox = new Element("input");
      var usernameRow = createRow("Username:", usernameBox, {display: "none"})[0];
    
      var passwordRow = createRow("Password:", null, {display: "none"});
      var passwordBox = qwebirc.util.createInput("password", passwordRow[1], "connect_auth_password");

      authCheckBox.addEvent("click", function(e) { qwebirc.ui.authShowHide(authCheckBox, authRow, usernameBox, usernameRow, passwordRow[0]) });
    } else if(qwebirc.auth.bouncerAuth()) {
      var passwordRow = createRow("Password:");
      var passwordBox = qwebirc.util.createInput("password", passwordRow, "connect_auth_password");
    }
  }
  */

  var connbutton = new Element("input", {"type": "submit"});
  connbutton.set("value", "Connect");
  var r = createRow(undefined, connbutton);
  
  form.addEvent("submit", function(e) {
    new Event(e).stop();

    var nickname = nick.value;
    var chans = chan.value;
    if(chans == "#") /* sorry channel "#" :P */
      chans = "";

    if(!nickname) {
      alert("You must supply a nickname.");
      nick.focus();
      return;
    }
    var stripped = qwebirc.global.nicknameValidator.validate(nickname);
    if(stripped != nickname) {
      nick.value = stripped;
      alert("Your nickname was invalid and has been corrected; please check your altered nickname and press Connect again.");
      nick.focus();
      return;
    }
    
    var data = {"nickname": nickname, "autojoin": chans};
    if(qwebirc.auth.enabled()) {
      if(qwebirc.auth.passAuth() && authCheckBox.checked) {
          if(!usernameBox.value || !passwordBox.value) {
            alert("You must supply your username and password in auth mode.");
            if(!usernameBox.value) {
              usernameBox.focus();
            } else {
              passwordBox.focus();
            }
            return;
          }
          
          data["serverPassword"] = usernameBox.value + " " + passwordBox.value;
      } else if(qwebirc.auth.bouncerAuth()) {
        if(!passwordBox.value) {
          alert("You must supply a password.");
          passwordBox.focus();
          return;
        }
        
        data["serverPassword"] = passwordBox.value;
      }
    }
    parentElement.removeChild(outerbox);
    
    callback(data);
  }.bind(this));
    
  nick.set("value", initialNickname);
  chan.set("value", initialChannels);

  if(window == window.top)
    nick.focus();
}

qwebirc.ui.authShowHide = function(checkbox, authRow, usernameBox, usernameRow, passwordRow) {
  var visible = checkbox.checked;
  var display = visible?null:"none";
  usernameRow.setStyle("display", display);
  passwordRow.setStyle("display", display);
  
  if(visible) {
//    authRow.parentNode.setStyle("display", "none");
    usernameBox.focus();
  }
}

qwebirc.ui.isAuthRequired = (function() {
  var args = qwebirc.util.parseURI(String(document.location));
  var value = $defined(args) && args.get("authrequired");
  return function() {
    return value && qwebirc.auth.enabled();
  };
})();

qwebirc.ui.isHideAuth = (function() {
  var args = qwebirc.util.parseURI(String(document.location));
  var value = $defined(args) && args.get("hideauth");
  return function() {
    return value;
  };
})();

