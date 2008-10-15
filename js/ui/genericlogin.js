function GenericLoginBox(parentElement, callback, initialNickname, initialChannels, autoConnect, autoNick) {
  if(autoConnect) {
    ConfirmBox(parentElement, callback, initialNickname, initialChannels, autoNick);
  } else {
    LoginBox(parentElement, callback, initialNickname, initialChannels);
  }
}

function ConfirmBox(parentElement, callback, initialNickname, initialChannels, autoNick) {
  var box = new Element("div");
  box.addStyle("confirmbox");
  parentElement.appendChild(box);

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
  
  var text = new Element("div");
  text.appendChild(document.createTextNode("To connect to IRC and join channels "));
  text.appendChild(channels);
  
  if(!autoNick) {
    text.appendChild(document.createTextNode(" as "));
    text.appendChild(nick);
  }    
  text.appendChild(document.createTextNode(" click 'Connect'."));

  box.appendChild(text);
  
  var form = new Element("form");
  box.appendChild(form);
  
  var yes = new Element("input", {"type": "submit", "value": "Connect"});
  form.appendChild(yes);
  
  form.addEvent("submit", function(e) {
    new Event(e).stop();
    parentElement.removeChild(box);
    callback({"nickname": initialNickname, "autojoin": initialChannels});
  });
}

function LoginBox(parentElement, callback, initialNickname, initialChannels) {
  var box = new Element("div");
  parentElement.appendChild(box);
  box.addStyle("loginbox");
  
  var header = new Element("h1");
  header.set("text", "Connect to IRC");
  box.appendChild(header);

  var form = new Element("form");
  box.appendChild(form);

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
  createRow("Channels (comma seperated):", chan);

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