qwebirc.ui.SWMUI = new Class({
  Extends: qwebirc.ui.RootUI,
  initialize: function(parentElement, theme, options) {
    this.parent(parentElement, qwebirc.ui.SWMUI.Window, "swmui", options);

    this.parentElement = parentElement;
    this.theme = theme;
  },
  postInitialize: function() {
    this.rootFrame = new qwebirc.ui.SWMUI.Frame(this.parentElement);

    this.tabPanel = new qwebirc.ui.SWMUI.Panel(this.rootFrame);
    this.tabPanel.anchor = qwebirc.ui.SWMUI.SWM_ANCHOR_TOP;
    this.tabPanel.addClass("tabs");
    
    this.mainPanel = new qwebirc.ui.SWMUI.Panel(this.rootFrame);
    this.mainPanel.addClass("main");
    
    this.entryPanel = new qwebirc.ui.SWMUI.Panel(this.rootFrame);
    this.entryPanel.anchor = qwebirc.ui.SWMUI.SWM_ANCHOR_BOTTOM;
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

qwebirc.ui.SWMUI.Window = new Class({
  Extends: qwebirc.ui.Window,
  
  initialize: function(parentObject, client, type, name, identifier) {
    this.parent(parentObject, client, type, name, identifier);
    this.contentPanel = new qwebirc.ui.SWMUI.Panel(parentObject.mainPanel, true);
    this.contentPanel.addClass("content");

    if(type == qwebirc.ui.WINDOW_CHANNEL) {
      this.nickList = new qwebirc.ui.SWMUI.Panel(this.contentPanel);
      this.nickList.anchor = qwebirc.ui.SWMUI.SWM_ANCHOR_RIGHT;
      this.nickList.addClass("nicklist");

      this.topic = new qwebirc.ui.SWMUI.Panel(this.contentPanel);
      this.topic.anchor = qwebirc.ui.SWMUI.SWM_ANCHOR_TOP;
      this.topic.addClass("topic");
    }
    
    this.xlines = new qwebirc.ui.SWMUI.Panel(this.contentPanel);
    this.lines = this.xlines.element;
    
    this.tab = new Element("span");
    this.tab.addClass("tab");
    
    this.tab.appendText(name);
    this.tab.addEvent("click", function() {
      parentObject.selectWindow(this);
    }.bind(this));

    parentObject.tabPanel.appendChild(this.tab);
    parentObject.resize();
    
    if(type != qwebirc.ui.WINDOW_STATUS && type != qwebirc.ui.WINDOW_CONNECT) {
      tabclose = new Element("span");
      tabclose.addClass("tabclose");
      tabclose.addEvent("click", function(e) {
        new Event(e).stop();
        
        if(type == qwebirc.ui.WINDOW_CHANNEL)
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
    qwebirc.ui.Colourise(topic, this.topic.element);

    this.parentObject.resize();
  },
  select: function() {
    this.parent();

    this.contentPanel.setHidden(false);
    this.parentObject.resize();
    this.tab.removeClass("tab-unselected");
    this.tab.addClass("tab-selected");
    this.parentObject.showInput(this.type == qwebirc.ui.WINDOW_CONNECT || this.type == qwebirc.ui.WINDOW_CUSTOM);
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
