var QUIWindow = new Class({
  Extends: UIWindow,
  
  initialize: function(parentObject, client, type, name) {
    this.parent(parentObject, client, type, name);
        
    this.outerContainer = new Element("div");
    this.outerContainer.addClass("outercontainer");
    this.outerContainer.addClass("tab-invisible");
    
    parentObject.container.appendChild(this.outerContainer);
    
    if(type == WINDOW_CHANNEL) {
      this.nicklist = new Element("div");
      this.nicklist.addClass("nicklist");
      
      this.outerContainer.appendChild(this.nicklist);
    }
    
    var innerContainer = new Element("div");
    innerContainer.addClass("innercontainer");
    this.outerContainer.appendChild(innerContainer);
    
    if(type == WINDOW_CHANNEL) {
      this.topic = new Element("div");
      this.topic.addClass("topic");
      innerContainer.appendChild(this.topic);
    }
    
    this.lines = new Element("div");
    this.lines.addClass("lines");
    innerContainer.appendChild(this.lines);
    
    this.tab = new Element("span");
    this.tab.addClass("tab");
    
    this.tab.appendText(name);
    this.tab.addEvent("click", function() {
      parentObject.selectWindow(this);
    }.bind(this));

    parentObject.tabs.appendChild(this.tab);
    
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
    
    var n = this.nicklist;
    while(n.firstChild)
      n.removeChild(n.firstChild);

    nicks.each(function(nick) {
      var e = new Element("div");
      n.appendChild(e);
      e.appendChild(document.createTextNode(nick));
    });
  },
  updateTopic: function(topic) {
    this.parent(topic);
    
    var t = this.topic;
    
    while(t.firstChild)
      t.removeChild(t.firstChild);

    Colourise(topic, t);
  },
  select: function() {
    this.parent();
    
    this.outerContainer.removeClass("tab-invisible");
    this.tab.removeClass("tab-unselected");
    this.tab.removeClass("tab-highlighted");
    this.tab.addClass("tab-selected");
  },
  deselect: function() {
    this.parent();
    
    this.outerContainer.addClass("tab-invisible");
    this.tab.removeClass("tab-selected");
    this.tab.addClass("tab-unselected");
  },
  close: function() {
    this.parent();
    
    this.parentObject.container.removeChild(this.outerContainer);
    this.parentObject.tabs.removeChild(this.tab);
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
    
    var prev = this.lines.getScroll();
    var prevbottom = this.lines.getScrollSize().y;
    var prevsize = this.lines.getSize();
    this.lines.appendChild(e);
    
    if(prev.y + prevsize.y == prevbottom)
      this.lines.scrollTo(prev.x, this.lines.getScrollSize().y);
      
    if(!this.active)
      this.tab.addClass("tab-highlighted");
  }
});

var QUI = new Class({
  Extends: UI,
  initialize: function(parentElement, theme) {
    this.parent(parentElement, UglyUIWindow, "uglyui");
    this.theme = theme;
    this.parentElement = parentElement;
  },
  postInitialize: function() {    
    this.tabs = new Element("div");
    this.tabs.addClass("tabbar");
    
    this.parentElement.appendChild(this.tabs);
    
    this.container = new Element("div");
    this.container.addClass("container");
    
    this.parentElement.appendChild(this.container);
  
    var form = new Element("form");
    var inputbox = new Element("input");
    inputbox.addClass("input");
  
    form.addEvent("submit", function(e) {
      new Event(e).stop();
    
      this.getActiveWindow().client.exec(inputbox.value);
      inputbox.value = "";
    }.bind(this));
    this.parentElement.appendChild(form);  
    form.appendChild(inputbox);
    inputbox.focus();
  },
  loginBox: function(callbackfn, intialNickname, initialChannels) {
    this.parent(function(options) {
      this.postInitialize();
      callbackfn(options);
    }.bind(this), intialNickname, initialChannels);
  }
});

