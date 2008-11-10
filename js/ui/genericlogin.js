qwebirc.ui.GenericLoginBox = function(parentElement, callback, initialNickname, initialChannels, autoConnect, autoNick) {
  if(autoConnect) {
    qwebirc.ui.ConfirmBox(parentElement, callback, initialNickname, initialChannels, autoNick);
  } else {
    qwebirc.ui.LoginBox(parentElement, callback, initialNickname, initialChannels);
  }
}

qwebirc.ui.ConfirmBox = function(parentElement, callback, initialNickname, initialChannels, autoNick) {
  var box = new Element("table");
  box.addClass("confirmbox");
  parentElement.appendChild(box);

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
  
  text.appendChild(document.createTextNode("To connect to IRC and join channel" + ((c.length>1)?"s":"") + " "));

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

  var tr = new Element("tr");
  tbody.appendChild(tr);
  tr.addClass("tr2");
  
  var td = new Element("td");
  tr.appendChild(td);

  var yes = new Element("input", {"type": "submit", "value": "Connect"});
  td.appendChild(yes);
  yes.focus();
  yes.addEvent("click", function(e) {
    parentElement.removeChild(box);
    callback({"nickname": initialNickname, "autojoin": initialChannels});
  });
  
  if(!qwebirc.auth.loggedin()) {
    var auth = new Element("input", {"type": "submit", "value": "Log in"});
    td.appendChild(auth);
    auth.addEvent("click", function(e) {
      var cookie = Cookie.write("redirect", document.location);
      document.location = "./auth/";
    });
  }
}

qwebirc.ui.LoginBox = function(parentElement, callback, initialNickname, initialChannels) {
  var box = new Element("table");
  parentElement.appendChild(box);
  box.addClass("loginbox");
  
  var tbody = new Element("tbody");
  box.appendChild(tbody);
  
  var tr = new Element("tr");
  tbody.appendChild(tr);
  tr.addClass("tr1");
  
  var td = new Element("td");
  tr.appendChild(td);
  td.set("html", "<h1>Connect to IRC</h1>");  
    
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

  function createRow(label, e2) {
    var r = new Element("tr");
    tbody.appendChild(r);

    var d1 = new Element("td");
    if(label)
      d1.set("text", label);
    r.appendChild(d1);

    var d2 = new Element("td");
    r.appendChild(d2);
    d2.appendChild(e2);
    return d1;
  }

  var nick = new Element("input");
  createRow("Nickname:", nick);
  var chan = new Element("input");
  createRow("Channels:", chan);

  var connbutton = new Element("input", {"type": "submit"});
  connbutton.set("value", "Connect");
  createRow(undefined, connbutton)

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

    parentElement.removeChild(box);
    
    callback({"nickname": nickname, "autojoin": chans});
  }.bind(this));

  nick.set("value", initialNickname);
  chan.set("value", initialChannels);

  nick.focus();
}
