var QUIWindow = new Class({
  Extends: UIWindow,
  
  initialize: function(parentObject, client, type, name) {
    this.parent(parentObject, client, type, name);

    this.tab = new Element("a", {"href": "#"});
    this.tab.addClass("tab");
    
    this.tab.appendText(name);
    this.tab.addEvent("click", function(e) {
      new Event(e).stop();
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

    this.parentObject.reflow();
    
    this.window = new Element("div");
    this.window.addClass("window");
    parentObject.container.appendChild(this.window);
    
    this.lines = new Element("div");
    this.lines.addClass("lines");
    this.window.appendChild(this.lines);
    
    var formdiv = new Element("div");
    this.window.appendChild(formdiv);  
    
    var form = new Element("form");
    var inputbox = new Element("input");
    
    formdiv.addClass("input");
  
    form.addEvent("submit", function(e) {
      new Event(e).stop();
    
      this.historyExec(inputbox.value);
      inputbox.value = "";
    }.bind(this));
    formdiv.appendChild(form);
    form.appendChild(inputbox);
    
    inputbox.addEvent("keypress", function(e) {
      var result;
      if(e.key == "up") {
        result = this.commandhistory.nextLine();
      } else if(e.key == "down") {
        result = this.commandhistory.prevLine();
      } else {
        return;
      }
      
      new Event(e).stop();
      if(!result)
        result = ""
      inputbox.value = result;
      setAtEnd(inputbox);
    }.bind(this));
    this.inputbox = inputbox;
    
    var toppos = 0;
    var rightpos = 0;
    var bottompos = formdiv.getSize().y;
    
    if(type == WINDOW_CHANNEL) {
      this.topic = new Element("div");
      this.topic.addClass("topic");
      this.topic.set("html", "&nbsp;");
      this.topic.setStyle("right", "0px");
      this.window.appendChild(this.topic);
      
      toppos = this.topic.getSize().y;

      this.nicklist = new Element("div");
      this.nicklist.addClass("nicklist");
      this.nicklist.setStyle("top", toppos + "px");
      this.nicklist.setStyle("bottom", (bottompos - 1) + "px");
      
      this.window.appendChild(this.nicklist);
      rightpos = this.nicklist.getSize().x;
    }

    this.lines.setStyle("top", toppos + "px");
    this.lines.setStyle("bottom", bottompos + "px");
    this.lines.setStyle("right", rightpos + "px");
    this.lines.addClass("lines");
    
    this.lines.addEvent("scroll", function() {
      this.scrolleddown = this.scrolledDown();
    }.bind(this));
    
    window.addEvent("resize", function() {
      if(this.scrolleddown)
        this.scrollToBottom();
    }.bind(this));
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

    if(topic) {
      Colourise(topic, "[" + topic + "]");
    } else {
      var e = new Element("(no topic set)");
      e.addClass("emptytopic");
      topic.appendChild(e);
    }
  },
  select: function() {
    this.window.removeClass("tab-invisible");
    this.tab.removeClass("tab-unselected");
    this.tab.addClass("tab-selected");
    this.parent();
    
    this.inputbox.focus();
  },
  deselect: function() {
    this.parent();
    
    this.window.addClass("tab-invisible");
    this.tab.removeClass("tab-selected");
    this.tab.addClass("tab-unselected");
  },
  close: function() {
    this.parent();
    
    this.parentObject.container.removeChild(this.window);
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
      this.tab.addClass("tab-hilighted");
    } else {
      this.tab.removeClass("tab-hilighted");
    }
  }
});

var QUI = new Class({
  Extends: UI,
  initialize: function(parentElement, theme) {
    this.parent(parentElement, QUIWindow, "qui");
    this.theme = theme;
    this.parentElement = parentElement;
  },
  reflow: function() {
    var tabheight = this.tabs.getSize().y;
    this.container.setStyle("top", tabheight + "px"); 
  },
  postInitialize: function() {
    this.outerContainer = new Element("div");
    this.outerContainer.addClass("outercontainer");
    this.parentElement.appendChild(this.outerContainer);
        
    this.tabs = new Element("div");
    this.tabs.addClass("tabbar");
    this.outerContainer.appendChild(this.tabs);
    
    var tester = new Element("span");
    this.tabs.appendChild(tester);
    
    this.tabheight = this.tabs.getSize().y;
    this.tabs.removeChild(tester);

    this.container = new Element("div");
    this.container.addClass("container");
    this.outerContainer.appendChild(this.container);
  },
  loginBox: function(callbackfn, intialNickname, initialChannels, autoConnect, autoNick) {
    this.parent(function(options) {
      this.postInitialize();
      callbackfn(options);
    }.bind(this), intialNickname, initialChannels, autoConnect, autoNick);
  }
});
