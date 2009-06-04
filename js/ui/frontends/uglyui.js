qwebirc.ui.UglyUI = new Class({
  Extends: qwebirc.ui.RootUI,
  initialize: function(parentElement, theme, options) {
    this.parent(parentElement, qwebirc.ui.UglyUI.Window, "uglyui", options);
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
    this.form = form;
    
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
  showInput: function(state) {
    this.form.setStyle("display", state?"block":"none");
  }
});

qwebirc.ui.UglyUI.Window = new Class({
  Extends: qwebirc.ui.Window,
  
  initialize: function(parentObject, client, type, name, identifier) {
    this.parent(parentObject, client, type, name, identifier);
        
    this.outerContainer = new Element("div");
    this.outerContainer.addClass("outercontainer");
    this.outerContainer.addClass("tab-invisible");
    
    parentObject.container.appendChild(this.outerContainer);
    
    if(type == qwebirc.ui.WINDOW_CHANNEL) {
      this.nicklist = new Element("div");
      this.nicklist.addClass("nicklist");
      
      this.outerContainer.appendChild(this.nicklist);
    }
    
    var innerContainer = new Element("div");
    innerContainer.addClass("innercontainer");
    this.outerContainer.appendChild(innerContainer);
    
    if(type == qwebirc.ui.WINDOW_CHANNEL) {
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

    qwebirc.ui.Colourise(topic, t);
  },
  select: function() {
    this.parent();
    
    this.outerContainer.removeClass("tab-invisible");
    this.tab.removeClass("tab-unselected");    
    this.tab.addClass("tab-selected");
    this.parentObject.showInput(this.type != qwebirc.ui.WINDOW_CONNECT && this.type != qwebirc.ui.WINDOW_CUSTOM);
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

