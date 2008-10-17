var QJSUI = new Class({
  initialize: function(class_, parent, sizer) {
    this.parent = parent;
    this.sizer = $defined(sizer)?sizer:parent;
    
    this.class_ = class_;
    this.create();
    
    window.addEvent("resize", function() {
      this.reflow();
      this.reflow.delay(100, this);
    }.bind(this));
  },
  applyClasses: function(pos, l) {
    l.addClass("dynamicpanel");
    
    l.addClass(this.class_);
    if(pos == "middle") {
      l.addClass("leftboundpanel");
    } else if(pos == "top") {
      l.addClass("topboundpanel");
      l.addClass("widepanel");
    } else if(pos == "topic") {
      l.addClass("widepanel");
    } else if(pos == "right") {
      l.addClass("rightboundpanel");
    } else if(pos == "bottom") {
      l.addClass("bottomboundpanel");
      l.addClass("widepanel");
    }
  },
  create: function() {
    var XE = function(pos) {
      var element = new Element("div");
      this.applyClasses(pos, element);
      
      this.parent.appendChild(element);
      return element;
    }.bind(this);
    
    this.top = XE("top");
    this.topic = XE("topic");
    this.middle = XE("middle");
    this.right = XE("right");
    this.bottom = XE("bottom");
  },
  reflow: function() {
    var bottom = this.bottom;
    var middle = this.middle;
    var right = this.right;
    var topic = this.topic;
    var top = this.top;
    
    var topicsize = topic.getSize();
    var topsize = top.getSize();
    var rightsize = right.getSize();
    var bottomsize = bottom.getSize();
    var docsize = this.sizer.getSize();
    
    var mheight = (docsize.y - topsize.y - bottomsize.y - topicsize.y);
    var mwidth = (docsize.x - rightsize.x);

    topic.setStyle("top", topsize.y + "px");
    
    middle.setStyle("top", (topsize.y + topicsize.y) + "px");
    if(mheight > 0) {
      middle.setStyle("height", mheight + "px");
      right.setStyle("height", mheight + "px");
    }
    
    if(mwidth > 0) {
      middle.setStyle("width", mwidth + "px");
    } else {
      alert(mwidth);
    }
    right.setStyle("top", (topsize.y + topicsize.y) + "px");
    right.setStyle("left", mwidth + "px");
    
    bottom.setStyle("top", (docsize.y - bottomsize.y) + "px");
  },
  showChannel: function(state) {
    var display = "none";
    if(state)
      display = "block";

    this.right.setStyle("display", display);
    this.topic.setStyle("display", display);
    //this.reflow.delay(0, this);
  }
});

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

    this.lines = new Element("div");
    //this.parentObject.qjsui.applyClasses("middle", lines);
    
    this.lines.addClass("lines");
    this.lines.addClass("tab-invisible");
    parentObject.lines.appendChild(this.lines);
    this.lines.addEvent("scroll", function() {
      this.scrolleddown = this.scrolledDown();
    }.bind(this));
    
    if(type == WINDOW_CHANNEL) {
      this.topic = new Element("div");
      this.topic.addClass("topic");
      this.topic.addClass("tab-invisible");
      this.topic.set("html", "&nbsp;");
      parentObject.topic.appendChild(this.topic);
      
      this.nicklist = new Element("div");
      this.nicklist.addClass("nicklist");
      this.nicklist.addClass("tab-invisible");
      parentObject.nicklist.appendChild(this.nicklist);
    }
    
    if(type == WINDOW_CHANNEL) {
      this.updateTopic("");
    } else {
      this.reflow();
    }
  },
  reflow: function() {
    this.parentObject.reflow();
  },
  onResize: function() {
    if(this.scrolleddown)
      this.scrollToBottom();
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
  showChannel: function() {
    this.parentObject.qjsui.showChannel($defined(this.nicklist));
    this.reflow();
  },
  select: function() {
    this.tab.removeClass("tab-unselected");
    this.tab.addClass("tab-selected");

    //this.parentObject.lines.parentNode.replaceChild(this.parentObject.lines, this.lines);
    
    this.lines.removeClass("tab-invisible");
    if(this.nicklist) {
      this.nicklist.removeClass("tab-invisible");
      this.topic.removeClass("tab-invisible");
    }
    this.showChannel();
    this.parent();
    
    this.parentObject.inputbox.focus();
  },
  deselect: function() {
    this.parent();
    
    this.lines.addClass("tab-invisible");
    if(this.nicklist) {
      this.nicklist.addClass("tab-invisible");
      this.topic.addClass("tab-invisible");
    }
    this.tab.removeClass("tab-selected");
    this.tab.addClass("tab-unselected");
    
    //this.showChannel();
  },
  close: function() {
    this.parent();
    
    this.parentObject.lines.removeChild(this.lines);
    if(this.nicklist) {
      this.parentObject.nicklist.removeChild(this.nicklist);
      this.parentObject.topic.removeChild(this.topic);
    }
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
    //alert("REFLOW");
    this.qjsui.reflow();
  },
  postInitialize: function() {
    this.qjsui = new QJSUI("qwebirc-qui", this.parentElement, document);
    
    this.qjsui.top.addClass("tabbar");
    
    this.qjsui.bottom.addClass("input");
    this.qjsui.right.addClass("nicklist");
    this.qjsui.topic.addClass("topic");
    this.qjsui.middle.addClass("lines");
    
    this.tabs = this.qjsui.top;
    this.topic = this.qjsui.topic;
    this.lines = this.qjsui.middle;
    this.nicklist = this.qjsui.right;
    this.input = this.qjsui.bottom;
    this.createInput();
    this.reflow();
  },
  createInput: function() {
    var form = new Element("form");
    this.input.appendChild(form);
    form.addClass("input");
    
    var inputbox = new Element("input");
    form.appendChild(inputbox);
    this.inputbox = inputbox;
    
    form.addEvent("submit", function(e) {
      new Event(e).stop();
    
      if(inputbox.value == "")
        return;
        
      this.getActiveWindow().historyExec(inputbox.value);
      inputbox.value = "";
    }.bind(this));
    
    inputbox.addEvent("keydown", function(e) {
      var resultfn;
      var cvalue = inputbox.value;

      if(e.key == "up") {
        resultfn = this.commandhistory.upLine;
      } else if(e.key == "down") {
        resultfn = this.commandhistory.downLine;
      } else {
        return;
      }
      
      if((cvalue != "") && (this.lastcvalue != cvalue))
        this.commandhistory.addLine(cvalue, true);
      
      var result = resultfn.bind(this.commandhistory)();
      
      new Event(e).stop();
      if(!result)
        result = "";
      this.lastcvalue = result;
        
      inputbox.value = result;
      setAtEnd(inputbox);
    }.bind(this));
  },
  loginBox: function(callbackfn, intialNickname, initialChannels, autoConnect, autoNick) {
    this.parent(function(options) {
      this.postInitialize();
      callbackfn(options);
    }.bind(this), intialNickname, initialChannels, autoConnect, autoNick);
  }
});
