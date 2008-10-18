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
    
    if(type != WINDOW_STATUS && type != WINDOW_CONNECT) {
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
    this.parentObject.showInput(this.type == WINDOW_CONNECT || this.type == WINDOW_CUSTOM);
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
  Extends: NewLoginUI,
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
  showInput: function(state) {
    this.entryPanel.setHidden(state);
    this.resize();
  },
  resize: function() {
    window.fireEvent("resize");
  }
});
