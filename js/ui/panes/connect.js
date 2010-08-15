qwebirc.ui.ConnectPane = new Class({
  Implements: [Events],
  initialize: function(parent, options) {
    var callback = options.callback, initialNickname = options.initialNickname, initialChannels = options.initialChannels, networkName = options.networkName, autoConnect = options.autoConnect, autoNick = options.autoNick;
    this.options = options;

    var delayfn = function() { parent.set("html", "<div class=\"loading\">Loading. . .</div>"); };
    var cb = delayfn.delay(500);

    var r = qwebirc.ui.RequestTransformHTML({url: qwebirc.global.staticBaseURL + "panes/connect.html", update: parent, onSuccess: function() {
      $clear(cb);

      var box = (autoConnect ? "confirm" : "login");
      var rootElement = parent.getElement("[name=" + box + "box]");
      this.rootElement = rootElement;
      
      this.util.exec = function(n, x) { rootElement.getElements(n).each(x); };
      var util = this.util;
      var exec = util.exec;
      util.makeVisible(rootElement);

      exec("[name=nickname]", util.setText(initialNickname));
      exec("[name=channels]", util.setText(initialChannels));
      exec("[name=prettychannels]", function(node) { this.__buildPrettyChannels(node, initialChannels); }.bind(this));
      exec("[name=networkname]", util.setText(networkName));

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

      exec("[name=" + focus + "]", util.focus);
      exec("[name=connect]", util.attachClick(this.__connect.bind(this)));
    }.bind(this)});
    r.get();
  },
  util: {
    makeVisible: function(x) { x.setStyle("display", ""); },
    focus: function(x) { x.focus(); },
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

    this.fireEvent("close");
    this.options.callback(data);
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
