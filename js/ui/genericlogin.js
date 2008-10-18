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
  
  var c = initialChannels.split(",");
  var ctext;
  
  if(c.length > 1) { 
    var last = c.pop();
    ctext = c.join(", ") + " and " + last;
  } else {
    ctext = c.join(", ");
  }
  
  var channels = new Element("b");
  channels.set("text", ctext);
  
  text.appendChild(document.createTextNode("To connect to IRC and join channels "));
  text.appendChild(channels);
  
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

  var form = new Element("form");
  td.appendChild(form);
  
  var yes = new Element("input", {"type": "submit", "value": "Connect"});
  form.appendChild(yes);
  
  form.addEvent("submit", function(e) {
    new Event(e).stop();
    parentElement.removeChild(box);
    callback({"nickname": initialNickname, "autojoin": initialChannels});
  });
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
