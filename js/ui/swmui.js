var SWMUIWindow = new Class({
  Extends: UIWindow,
  
  initialize: function(parentObject, client, type, name) {
    this.parent(parentObject, client, type, name);
    this.contentPanel = new SWMPanel(parentObject.mainPanel, true);
    this.contentPanel.addClass("content");

    if(type == WINDOW_CHANNEL) {
      this.nickList = new SWMPanel(this.contentPanel);
      this.nickList.anchor = SWM_ANCHOR_RIGHT;
      this.nickList.addClass("nicklist");

      this.topic = new SWMPanel(this.contentPanel);
      this.topic.anchor = SWM_ANCHOR_TOP;
      this.topic.addClass("topic");
    }
    
    this.xlines = new SWMPanel(this.contentPanel);
    this.lines = this.xlines.element;
    
    this.tab = new Element("span");
    this.tab.addClass("tab");
    
    this.tab.appendText(name);
    this.tab.addEvent("click", function() {
      parentObject.selectWindow(this);
    }.bind(this));

    parentObject.tabPanel.appendChild(this.tab);
    parentObject.resize();
    
    if(type != WINDOW_STATUS) {
      tabclose = new Element("span");
      tabclose.addClass("tabclose");
      tabclose.addEvent("click", function(e) {
        new Event(e).stop();
        
        if(type == WINDOW_CHANNEL)
          this.client.exec("/PART " + name);

        this.close();
      }.bind(this));
      tabclose.set("text", "X");
      this.tab.appendChild(tabclose);
    }
  },
  updateNickList: function(nicks) {
    this.parent(nicks);

    this.nickList.removeAllChildren();
    nicks.each(function(nick) {
      var e = new Element("div");
      this.nickList.appendChild(e);
      e.appendChild(document.createTextNode(nick));
    }.bind(this));
    
    this.parentObject.resize();
  },
  updateTopic: function(topic) {
    this.parent(topic);

    this.topic.removeAllChildren();
    Colourise(topic, this.topic.element);

    this.parentObject.resize();
  },
  select: function() {
    this.parent();

    this.contentPanel.setHidden(false);
    this.parentObject.resize();
    this.tab.removeClass("tab-unselected");
    this.tab.addClass("tab-selected");
  },
  deselect: function() {
    this.parent();

    this.contentPanel.setHidden(true);
    this.parentObject.resize();
    this.tab.removeClass("tab-selected");
    this.tab.addClass("tab-unselected");
  },
  close: function() {
    this.parent();

    this.parentObject.mainPanel.removeChild(this.contentPanel.element);
    this.parentObject.tabPanel.removeChild(this.tab);
  },
  addLine: function(type, line, colour) {
    var e = new Element("div");

    if(colour) {
      e.setStyles({"background": colour});
    } else if(this.lastcolour) {
      e.addClass("linestyle1");
    } else {
      e.addClass("linestyle2");
    }
    
    this.lastcolour = !this.lastcolour;

    this.parent(type, line, colour, e);
  },
  setHilighted: function(state) {
    this.parent(state);
    
    if(state) {
      this.tab.addClass("tab-highlighted");
    } else {
      this.tab.removeClass("tab-highlighted");
    }
  }
});

var SWMUI = new Class({
  Extends: UI,
  initialize: function(parentElement, theme) {
    this.parent(parentElement, SWMUIWindow, "swmui");

    this.parentElement = parentElement;
    this.theme = theme;
  },
  postInitialize: function() {
    this.rootFrame = new SWMFrame(this.parentElement);

    this.tabPanel = new SWMPanel(this.rootFrame);
    this.tabPanel.anchor = SWM_ANCHOR_TOP;
    this.tabPanel.addClass("tabs");
    
    this.mainPanel = new SWMPanel(this.rootFrame);
    this.mainPanel.addClass("main");
    
    this.entryPanel = new SWMPanel(this.rootFrame);
    this.entryPanel.anchor = SWM_ANCHOR_BOTTOM;
    this.entryPanel.addClass("entry");

    var form = new Element("form");
    
    var inputbox = new Element("input");
    inputbox.setStyle("border", "0px");
    
    window.addEvent("resize", function() {
      var s = this.entryPanel.getInnerSize().x;
      inputbox.setStyle("width", s + "px");
    }.bind(this));

    form.addEvent("submit", function(e) {
      new Event(e).stop();
    
      this.getActiveWindow().client.exec(inputbox.value);
      inputbox.value = "";
    }.bind(this));

    this.entryPanel.appendChild(form);
    form.appendChild(inputbox);
    inputbox.focus();

    this.resize();
  },
  resize: function() {
    window.fireEvent("resize");
  },
  loginBox: function(callback, initialNickname, initialChannels) {
    var box = new Element("div");
    this.parentElement.appendChild(box);

    var header = new Element("h1");
    header.set("text", "qwebirc");
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

      this.parentElement.removeChild(box);
      this.postInitialize();
      callback({"nickname": nickname, "autojoin": chans});
    }.bind(this));

    nick.set("value", initialNickname);
    chan.set("value", initialChannels);

    nick.focus();
  }
});
