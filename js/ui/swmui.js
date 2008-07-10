var SWMUIWindow = new Class({
  Extends: UIWindow,
  
  initialize: function(parentObject, client, type, name) {
    this.parent(parentObject, client, type, name);
    this.contentPanel = new SWMPanel(parentObject.mainPanel.element, true);
    this.contentPanel.element.addClass("content");
    this.contentPanel.element.setStyle("overflow", "auto");

    if(type == WINDOW_CHANNEL) {
      this.nickList = new SWMPanel(this.contentPanel.element);
      this.nickList.anchor = SWM_ANCHOR_RIGHT;
      this.nickList.element.setStyle("overflow", "auto");
      this.nickList.element.addClass("nicklist");
    }

    if(type == WINDOW_CHANNEL) {
      this.topic = new SWMPanel(this.contentPanel.element);
      this.topic.anchor = SWM_ANCHOR_TOP;
      this.topic.element.addClass("topic");
    }
    
    this.lines = new SWMPanel(this.contentPanel.element);
    this.lines.element.setStyle("overflow", "auto");
    
    this.tab = new Element("span");
    this.tab.addClass("tab");
    
    this.tab.appendText(name);
    this.tab.addEvent("click", function() {
      parentObject.selectWindow(this);
    }.bind(this));

    parentObject.tabPanel.element.appendChild(this.tab);
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

    var n = this.nickList.element;
    while(n.firstChild)
      n.removeChild(n.firstChild);

    nicks.each(function(nick) {
      var e = new Element("div");
      n.appendChild(e);
      e.appendChild(document.createTextNode(nick));
    });
    
    this.parentObject.resize();
  },
  updateTopic: function(topic) {
    this.parent(topic);
    var t = this.topic.element;
    
    while(t.firstChild)
      t.removeChild(t.firstChild);

    Colourise(topic, t);

    this.parentObject.resize();
  },
  select: function() {
    this.parent();

    this.contentPanel.setHidden(false);
    this.parentObject.resize();
    this.tab.removeClass("tab-highlighted");
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

    this.parentObject.mainPanel.element.removeChild(this.contentPanel.element);
    this.parentObject.tabPanel.element.removeChild(this.tab);
  },
  addLine: function(type, line, colour) {
    this.parent(type, line, colour);
    
    var e = new Element("div");

    if(colour) {
      e.setStyles({"background": colour});
    } else if(this.lastcolour) {
      e.addClass("linestyle1");
    } else {
      e.addClass("linestyle2");
    }
    
    if(type)
      line = this.parentObject.theme.message(type, line);
    
    Colourise(IRCTimestamp(new Date()) + " " + line, e);
    
    this.lastcolour = !this.lastcolour;
    
    var prev = this.lines.element.getScroll();
    var prevbottom = this.lines.element.getScrollSize().y;
    var prevsize = this.lines.element.getSize();
    this.lines.element.appendChild(e);
    
    if(prev.y + prevsize.y == prevbottom)
      this.lines.element.scrollTo(prev.x, this.lines.element.getScrollSize().y);
      
    if(!this.active)
      this.tab.addClass("tab-highlighted");
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
    this.tabPanel = new SWMPanel(this.parentElement);
    this.tabPanel.anchor = SWM_ANCHOR_TOP;
    this.tabPanel.element.addClass("tabs");
    
    this.mainPanel = new SWMPanel(this.parentElement);
    this.mainPanel.element.addClass("main");
    
    this.entryPanel = new SWMPanel(this.parentElement);
    this.entryPanel.anchor = SWM_ANCHOR_BOTTOM;
    this.entryPanel.element.addClass("entry");

    var form = new Element("form");
    
    var inputbox = new Element("input");
    
    window.addEvent("resize", function() {
      var s = this.entryPanel.element.getSize().x - 4;
      inputbox.setStyle("width", s + "px");
    }.bind(this));

    form.addEvent("submit", function(e) {
      new Event(e).stop();
    
      this.getActiveWindow().client.exec(inputbox.value);
      inputbox.value = "";
    }.bind(this));

    this.entryPanel.element.appendChild(form);
    form.appendChild(inputbox);
    inputbox.focus();

    this.resize();
  },
  resize: function() {
    window.fireEvent("resize");
  },
  loginBox: function(callback) {
    var box = new Element("div");

    var header = new Element("h1");
    header.set("text", "qwebirc");
    box.appendChild(header);

    var form = new Element("form");

    var boxtable = new Element("table");

    var nickrow = new Element("tr");
    var nicklabel = new Element("td");
    nicklabel.set("text", "Nickname:");
    nickrow.appendChild(nicklabel);

    var nickbox = new Element("td");
    var nick = new Element("input");
    nickbox.appendChild(nick);
    nickrow.appendChild(nickbox);

    var chanrow = new Element("tr");
    var chanlabel = new Element("td");
    chanlabel.set("text", "Channels (comma seperated):");
    chanrow.appendChild(chanlabel);

    var chanbox = new Element("td");
    var chan = new Element("input");
    chanbox.appendChild(chan);
    chanrow.appendChild(chanbox);

    var connrow = new Element("tr");
    var connblank = new Element("td");
    var connbuttontd = new Element("td");
    var connbutton = new Element("input", {"type": "submit"});
    connbutton.set("value", "Connect");
    connbuttontd.appendChild(connbutton);

    connrow.appendChild(connblank);
    connrow.appendChild(connbuttontd);

    boxtable.appendChild(nickrow);
    boxtable.appendChild(chanrow);
    boxtable.appendChild(connrow);
    form.appendChild(boxtable);

    form.addEvent("submit", function(e) {
      new Event(e).stop();
      var nickname = nick.value;
      var chans = chan.value;
      if(!nickname) {
        alert("You must supply a nickname.");
        nick.focus();
        return;
      }

      this.parentElement.removeChild(box);
      this.postInitialize();
      callback(nickname, chans);
    }.bind(this));

    box.appendChild(form);
    this.parentElement.appendChild(box);

    nick.set("value", "qwebirc" + Math.ceil(Math.random() * 1000));
    chan.set("value", "#");

    nick.focus();
  }
});
