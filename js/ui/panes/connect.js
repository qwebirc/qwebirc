qwebirc.ui.GenericLoginBox = function(parentElement, callback, initialNickname, initialChannels, autoConnect, autoNick, networkName) {
  if(autoConnect) {
    qwebirc.ui.ConfirmBox(parentElement, callback, initialNickname, initialChannels, autoNick, networkName);
  } else {
    qwebirc.ui.LoginBox(parentElement, callback, initialNickname, initialChannels, networkName);
  }
}

qwebirc.ui.AuthLogin = function(e) {
  var cookie = Cookie.write("redirect", document.location);
  document.location = "./auth/";
  new Event(e).stop();
}

qwebirc.ui.ConfirmBox = function(parentElement, callback, initialNickname, initialChannels, autoNick, networkName) {
  var outerbox = new Element("table");
  outerbox.addClass("qwebirc-centrebox");
  parentElement.appendChild(outerbox);
  var tbody = new Element("tbody");
  outerbox.appendChild(tbody);
  var tr = new Element("tr");
  tbody.appendChild(tr);
  var td = new Element("td");
  tr.appendChild(td);
  
  var box = new Element("table");
  box.addClass("qwebirc-confirmbox");
  td.appendChild(box);

  var tbody = new Element("tbody");
  box.appendChild(tbody);
  
  var tr = new Element("tr");
  tbody.appendChild(tr);
  tr.addClass("tr1");
  
  var text = new Element("td");
  tr.appendChild(text);
  
  var nick = new Element("b");
  nick.set("text", initialNickname);
  
  var c = initialChannels.split(" ")[0].split(",");
  
  text.appendChild(document.createTextNode("To connect to " + networkName + " IRC and join channel" + ((c.length>1)?"s":"") + " "));

  for(var i=0;i<c.length;i++) {
    if((c.length > 1) && (i == c.length - 1)) {
      text.appendChild(document.createTextNode(" and "));
    } else if(i > 0) {
      text.appendChild(document.createTextNode(", "));
    }
    text.appendChild(new Element("b").set("text", c[i]));
    
  }
  
  if(!autoNick) {
    text.appendChild(document.createTextNode(" as "));
    text.appendChild(nick);
  }
  
  text.appendChild(document.createTextNode(" click 'Connect'."));
  text.appendChild(new Element("br"));
  if(qwebirc.auth.enabled() && qwebirc.auth.quakeNetAuth() && !qwebirc.auth.loggedin())
    text.appendChild(document.createTextNode("If you'd like to connect using your Q auth click 'Log in'."));

  var tr = new Element("tr");
  tbody.appendChild(tr);
  tr.addClass("tr2");
  
  var td = new Element("td");
  tr.appendChild(td);

  var yes = new Element("input", {"type": "submit", "value": "Connect"});
  td.appendChild(yes);
  yes.focus();
  yes.addEvent("click", function(e) {
    parentElement.removeChild(outerbox);
    callback({"nickname": initialNickname, "autojoin": initialChannels});
  });
  
  if(qwebirc.auth.enabled() && qwebirc.auth.quakeNetAuth() && !qwebirc.auth.loggedin()) {
    var auth = new Element("input", {"type": "submit", "value": "Log in"});
    td.appendChild(auth);
    auth.addEvent("click", qwebirc.ui.AuthLogin);
  }
}

qwebirc.ui.LoginBox = function(parentElement, callback, initialNickname, initialChannels, networkName) {
  var outerbox = new Element("table");
  outerbox.addClass("qwebirc-centrebox");
  parentElement.appendChild(outerbox);
  var tbody = new Element("tbody");
  outerbox.appendChild(tbody);
  var tr = new Element("tr");
  tbody.appendChild(tr);
  var td = new Element("td");
  tr.appendChild(td);
  
  var box = new Element("table");
  box.addClass("qwebirc-loginbox");
  td.appendChild(box);
  
  var tbody = new Element("tbody");
  box.appendChild(tbody);
  
  var tr = new Element("tr");
  tbody.appendChild(tr);
  tr.addClass("tr1");
  
  var td = new Element("td");
  tr.appendChild(td);
  td.set("html", "<h1>Connect to " + networkName + " IRC</h1>");  
    
  var tr = new Element("tr");
  tbody.appendChild(tr);
  tr.addClass("tr2");
  
  var td = new Element("td");
  tr.appendChild(td);
  
  var form = new Element("form");
  td.appendChild(form);

  var boxtable = new Element("table");
  form.appendChild(boxtable);

  var tbody = new Element("tbody");
  boxtable.appendChild(tbody); /* stupid IE */

  function createRow(label, e2, style) {
    var r = new Element("tr");
    tbody.appendChild(r);

    var d1 = new Element("td");
    if(label)
      d1.set("text", label);
    r.appendChild(d1);

    var d2 = new Element("td");
    r.appendChild(d2);
    
    if($defined(e2))
      d2.appendChild(e2);
    if($defined(style)) {
      r.setStyles(style);
      return [r, d2];
    }
    
    return d2;
  }

  var nick = new Element("input");
  createRow("Nickname:", nick);
  
  var chanStyle = null;
  if(qwebirc.auth.enabled() && qwebirc.auth.bouncerAuth())
    chanStyle = {display: "none"};
  
  var chan = new Element("input");
  createRow("Channels:", chan, chanStyle);

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
  
  var connbutton = new Element("input", {"type": "submit"});
  connbutton.set("value", "Connect");
  var r = createRow(undefined, connbutton);
  
  if(qwebirc.auth.enabled() && qwebirc.auth.quakeNetAuth() && !qwebirc.auth.loggedin()) {
    var auth = new Element("input", {"type": "submit", "value": "Log in"});
    r.appendChild(auth);
    auth.addEvent("click", qwebirc.ui.AuthLogin);
  }

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
