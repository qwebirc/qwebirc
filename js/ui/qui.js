/* IE SUCKS */
var BORDER_SIZE = 3;
var INPUT_BORDER_SIZE = 2;
var TOPIC_BORDER_SIZE = 5;

var QUIWindow = new Class({
  Extends: UIWindow,
  
  initialize: function(parentObject, client, type, name) {
    this.parent(parentObject, client, type, name);

    this.tab = new Element("a", {"href": "#"});
    this.tab.addClass("tab");
    parentObject.tabs.appendChild(this.tab);
    
    this.tab.appendText(name);
    this.tab.addEvent("click", function(e) {
      new Event(e).stop();
      parentObject.selectWindow(this);
    }.bind(this));
    
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
      if(BrowserVersion() == "ie7" || BrowserVersion() == "ie6") {
      } else {
        tabclose.setStyle("padding", "2px");
        tabclose.setStyle("vertical-align", "top");
      }
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
    this.formdiv = formdiv;
    
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
    if(BrowserVersion() == "ie7") {
    } else {
      this.formdiv.setStyle("bottom", "0px");
    }
    if(type == WINDOW_CHANNEL) {
      this.topic = new Element("div");
      this.topic.addClass("topic");
      this.topic.set("html", "&nbsp;");
      
      this.window.appendChild(this.topic);
      
      this.nicklist = new Element("div");
      this.nicklist.addClass("nicklist");
      
      this.window.appendChild(this.nicklist);
    }
    this.lines.addClass("lines");
    if(type == WINDOW_CHANNEL) {
      /* calls reflow */
      this.updateTopic("");
    } else {
      this.reflow();
    }
    
    this.lines.addEvent("scroll", function() {
      this.scrolleddown = this.scrolledDown();
    }.bind(this));
  },
  onResize: function() {
    if(this.scrolleddown)
      this.scrollToBottom();
    this.reflow();
  },
  reflow: function() {
    var toppos = 0;
    var rightpos = 0;
    var bottompos = this.formdiv.getSize().y;
    var bv = BrowserVersion();
    
    if(this.type == WINDOW_CHANNEL) {
      toppos = this.topic.getSize().y;

      this.nicklist.setStyle("top", toppos + "px");
      this.nicklist.setStyle("bottom", (bottompos - 1) + "px");
      rightpos = this.nicklist.getSize().x;
    }
    
    this.lines.setStyle("top", toppos + "px");
    
    if(bv == "ie6") {
      var w = this.window.getSize().x;
      if(w == 0) {
        this.reflow.delay(1, this);
        return;
      }
      if(this.type == WINDOW_CHANNEL)
        this.topic.setStyle("width", (w - TOPIC_BORDER_SIZE) + "px");
      this.formdiv.setStyle("width", (w - 2 * INPUT_BORDER_SIZE) + "px");
      this.lines.setStyle("width", (w - rightpos) + "px");
    } else {
      this.lines.setStyle("right", rightpos + "px");
    }
    /* @IESUCKS */
    if(bv == "ie7" || bv == "ie6") {
      var winheight = this.window.getSize().y;
      if(winheight == 0) {
        this.reflow.delay(1, this);
        return;
      }
      this.lines.setStyle("height", (winheight - toppos - bottompos) + "px");
      this.formdiv.setStyle("top", (winheight - bottompos) + "px");
      if(this.type == WINDOW_CHANNEL && (bv == "ie6"))
        this.nicklist.setStyle("height", (winheight - toppos - bottompos) + "px");
    } else {
      this.lines.setStyle("bottom", bottompos + "px");
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

    if(topic) {
      Colourise("[" + topic + "]", t);
    } else {
      var e = new Element("div");
      e.set("text", "(no topic set)");
      e.addClass("emptytopic");
      t.appendChild(e);
    }
    this.reflow();
  },
  select: function() {
    this.window.removeClass("tab-invisible");
    this.tab.removeClass("tab-unselected");
    this.tab.addClass("tab-selected");
    this.reflow();

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
    if(BrowserVersion() == "ie6") {
      if((parentElement.getStyle("top") == "0px") && (parentElement.getStyle("bottom") == "0px")) {
        parentElement.setStyle("top", null);
        parentElement.setStyle("height", "100%");
      }
    }
    this.parent(parentElement, QUIWindow, "qui");
    this.theme = theme;
    this.parentElement = parentElement;
  },
  reflow: function() {
    var tabheight = this.tabs.getSize().y;
    var bv = BrowserVersion();
    if(bv == "ie7" || bv == "ie6")
      tabheight = tabheight - 2 * BORDER_SIZE;
    this.xcontainer.setStyle("top", tabheight + "px");
    if(bv == "ie7" || bv == "ie6") {
      this.xcontainer.setStyle("bottom", "");
      this.xcontainer.setStyle("height", (this.parentElement.getSize().y - (tabheight)) + "px");
    }
  },
  postInitialize: function() {
    this.outerContainer = new Element("div");
    this.outerContainer.addClass("outercontainer");
    this.parentElement.appendChild(this.outerContainer);
        
    this.tabs = new Element("div");
    this.tabs.addClass("tabbar");
    this.outerContainer.appendChild(this.tabs);
    
    this.container = new Element("div");
    this.container.addClass("container");
    this.outerContainer.appendChild(this.container);
    
    //this.container.setStyle("background", "red");
    //this.container.setStyle("border", "1px solid black");
    
    this.xcontainer = this.container;
    
    //this.container = new Element("div");
    window.addEvent("resize", function() {
      this.reflow();
      
      for(i=0;i<this.windowArray.length;i++)
        this.windowArray[i].onResize();
    }.bind(this));
  },
  loginBox: function(callbackfn, intialNickname, initialChannels, autoConnect, autoNick) {
    this.parent(function(options) {
      this.postInitialize();
      callbackfn(options);
    }.bind(this), intialNickname, initialChannels, autoConnect, autoNick);
  }
});
