qwebirc.ui.QUI = new Class({
  Extends: qwebirc.ui.NewLoginUI,
  initialize: function(parentElement, theme) {
    this.parent(parentElement, qwebirc.ui.QUI.Window, "qui");
    this.theme = theme;
    this.parentElement = parentElement;
  },
  postInitialize: function() {
    this.qjsui = new qwebirc.ui.QUI.JSUI("qwebirc-qui", this.parentElement);
    
    this.qjsui.top.addClass("tabbar");
    
    this.qjsui.bottom.addClass("input");
    this.qjsui.right.addClass("nicklist");
    this.qjsui.topic.addClass("topic");
    this.qjsui.middle.addClass("lines");
    
    this.tabs = this.qjsui.top;
    this.origtopic = this.topic = this.qjsui.topic;
    this.origlines = this.lines = this.qjsui.middle;
    this.orignicklist = this.nicklist = this.qjsui.right;
    
    this.input = this.qjsui.bottom;
    this.reflow = this.qjsui.reflow.bind(this.qjsui);
    
    this.tabs.addEvent("mousewheel", function(x) {
      var event = new Event(x);
      
      /* up */
      if(event.wheel > 0) {
        this.nextWindow();
      } else if(event.wheel < 0) {
        /* down */
        this.prevWindow();        
      }
      event.stop();
    }.bind(this));
    
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
        
      this.resetTabComplete();
      this.getActiveWindow().historyExec(inputbox.value);
      inputbox.value = "";
    }.bind(this));
    
    inputbox.addEvent("focus", this.resetTabComplete.bind(this));
    inputbox.addEvent("mousedown", this.resetTabComplete.bind(this));
    
    inputbox.addEvent("keydown", function(e) {
      var resultfn;
      var cvalue = inputbox.value;
      
      if(e.key == "up") {
        resultfn = this.commandhistory.upLine;
      } else if(e.key == "down") {
        resultfn = this.commandhistory.downLine;
      } else if(e.key == "tab") {
        new Event(e).stop();
        this.tabComplete(inputbox);
        return;
      } else {
        /* ideally alt and other keys wouldn't break this */
        this.resetTabComplete();
        return;
      }
      
      this.resetTabComplete();
      if((cvalue != "") && (this.lastcvalue != cvalue))
        this.commandhistory.addLine(cvalue, true);
      
      var result = resultfn.bind(this.commandhistory)();
      
      new Event(e).stop();
      if(!result)
        result = "";
      this.lastcvalue = result;
        
      inputbox.value = result;
      qwebirc.util.setAtEnd(inputbox);
    }.bind(this));
  },
  setLines: function(lines) {
    this.lines.parentNode.replaceChild(lines, this.lines);
    this.qjsui.middle = this.lines = lines;
  },
  setChannelItems: function(nicklist, topic) {
    if(!$defined(nicklist)) {
      nicklist = this.orignicklist;
      topic = this.origtopic;
    }
    this.nicklist.parentNode.replaceChild(nicklist, this.nicklist);
    this.qjsui.right = this.nicklist = nicklist;

    this.topic.parentNode.replaceChild(topic, this.topic);
    this.qjsui.topic = this.topic = topic;
  }
});

qwebirc.ui.QUI.JSUI = new Class({
  initialize: function(class_, parent, sizer) {
    this.parent = parent;
    this.sizer = $defined(sizer)?sizer:parent;
    
    this.class_ = class_;
    this.create();
    
    this.reflowevent = null;
    
    window.addEvent("resize", function() {
      this.reflow(100);
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
  reflow: function(delay) {
    if(!delay)
      delay = 1;
      
    if(this.reflowevent)
      $clear(this.reflowevent);
    this.__reflow();
    this.reflowevent = this.__reflow.delay(delay, this);
  },
  __reflow: function() {
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
    
    if(mwidth > 0)
      middle.setStyle("width", mwidth + "px");
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
  },
  showInput: function(state) {
    this.bottom.setStyle("display", state?"block":"none");
  }
});

qwebirc.ui.QUI.Window = new Class({
  Extends: qwebirc.ui.Window,
  
  initialize: function(parentObject, client, type, name) {
    this.parent(parentObject, client, type, name);

    this.tab = new Element("a", {"href": "#"});
    this.tab.addClass("tab");
    this.tab.addEvent("focus", function() { this.blur() }.bind(this.tab));;
    
    parentObject.tabs.appendChild(this.tab);
    
    this.tab.appendText(name);
    this.tab.addEvent("click", function(e) {
      new Event(e).stop();
      parentObject.selectWindow(this);
    }.bind(this));
    
    if(type != qwebirc.ui.WINDOW_STATUS && type != qwebirc.ui.WINDOW_CONNECT) {
      var tabclose = new Element("span");
      tabclose.set("text", "X");
      tabclose.addClass("tabclose");
      tabclose.addEvent("click", function(e) {
        new Event(e).stop();
        
        if(type == qwebirc.ui.WINDOW_CHANNEL)
          this.client.exec("/PART " + name);

        this.close();
        
        parentObject.inputbox.focus();
      }.bind(this));
      
      this.tab.appendChild(tabclose);
    }

    this.lines = new Element("div");
    this.parentObject.qjsui.applyClasses("middle", this.lines);
    this.lines.addClass("lines");
    
    this.lines.addEvent("scroll", function() {
      this.scrolleddown = this.scrolledDown();
    }.bind(this));
    
    if(type == qwebirc.ui.WINDOW_CHANNEL) {
      this.topic = new Element("div");
      this.topic.addClass("topic");
      this.topic.addClass("tab-invisible");
      this.topic.set("html", "&nbsp;");
      this.parentObject.qjsui.applyClasses("topic", this.topic);
      
      this.prevNick = null;
      this.nicklist = new Element("div");
      this.nicklist.addClass("nicklist");
      this.nicklist.addClass("tab-invisible");
      this.nicklist.addEvent("click", this.removePrevMenu.bind(this));
      this.parentObject.qjsui.applyClasses("nicklist", this.nicklist);
    }
    
    if(type == qwebirc.ui.WINDOW_CHANNEL) {
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
  createMenu: function(nick, parent) {
    var e = new Element("div");
    parent.appendChild(e);
    e.addClass("menu");
    
    qwebirc.ui.MENU_ITEMS.forEach(function(x) {
      var e2 = new Element("a");
      e.appendChild(e2);
      
      e2.href = "#";
      e2.set("text", "- " + x[0]);
      
      e2.addEvent("focus", function() { this.blur() }.bind(e2));
      e2.addEvent("click", function(ev) { new Event(ev.stop()); this.menuClick(x[1]); }.bind(this));
    }.bind(this));
    return e;
  },
  menuClick: function(fn) {
    /*
    this.prevNick.removeChild(this.prevNick.menu);
    this.prevNick.menu = null;
    */
    fn.bind(this)(this.prevNick.realNick);
    this.removePrevMenu();
  },
  moveMenuClass: function() {
    if(!this.prevNick)
      return;
    if(this.nicklist.firstChild == this.prevNick) {
      this.prevNick.removeClass("selected-middle");
    } else {
      this.prevNick.addClass("selected-middle");
    }
  },
  removePrevMenu: function() {
    if(!this.prevNick)
      return;
      
    this.prevNick.removeClass("selected");
    this.prevNick.removeClass("selected-middle");
    if(this.prevNick.menu)
      this.prevNick.removeChild(this.prevNick.menu);
    this.prevNick = null;
  },
  nickListAdd: function(nick, position) {
    var e = new Element("a");
    qwebirc.ui.insertAt(position, this.nicklist, e);
    
    e.href = "#";
    e.appendChild(document.createTextNode(nick));
    
    e.realNick = this.client.stripPrefix(nick);
    
    e.addEvent("click", function(x) {
      if(this.prevNick == e) {
        this.removePrevMenu();
        return;
      }
      
      this.removePrevMenu();
      this.prevNick = e;
      e.addClass("selected");
      this.moveMenuClass();
      e.menu = this.createMenu(x.realNick, e);
      new Event(x).stop();
    }.bind(this));
    e.addEvent("dblclick", function(x) {
      new Event(x).stop();
      this.client.exec("/QUERY " + e.realNick);
    }.bind(this));
    
    e.addEvent("focus", function() { this.blur() }.bind(e));
    this.moveMenuClass();
    return e;
  },
  nickListRemove: function(nick, stored) {
    this.nicklist.removeChild(stored);
    this.moveMenuClass();
  },
  updateTopic: function(topic) {
    var t = this.topic;
    
    while(t.firstChild)
      t.removeChild(t.firstChild);

    if(topic) {
      this.parent(topic, t);
    } else {
      var e = new Element("div");
      e.set("text", "(no topic set)");
      e.addClass("emptytopic");
      t.appendChild(e);
    }
    this.reflow();
  },
  select: function() {
    var inputVisible = this.type != qwebirc.ui.WINDOW_CONNECT && this.type != qwebirc.ui.WINDOW_CUSTOM;
    
    this.tab.removeClass("tab-unselected");
    this.tab.addClass("tab-selected");

    this.parentObject.setLines(this.lines);
    this.parentObject.setChannelItems(this.nicklist, this.topic);
    this.parentObject.qjsui.showInput(inputVisible);
    this.parentObject.qjsui.showChannel($defined(this.nicklist));

    this.reflow();
    
    this.parent();
    
    if(inputVisible)
      this.parentObject.inputbox.focus();
  },
  deselect: function() {
    this.parent();
    
    this.tab.removeClass("tab-selected");
    this.tab.addClass("tab-unselected");
  },
  close: function() {
    this.parent();
    
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
    laststate = this.hilighted;
    
    this.parent(state);

    if(state == laststate)
      return;
      
    this.tab.removeClass("tab-hilight-activity");
    this.tab.removeClass("tab-hilight-us");
    this.tab.removeClass("tab-hilight-speech");
    
    switch(this.hilighted) {
      case qwebirc.ui.HILIGHT_US:
        this.tab.addClass("tab-hilight-us");
        break;
      case qwebirc.ui.HILIGHT_SPEECH:
        this.tab.addClass("tab-hilight-speech");
        break;
      case qwebirc.ui.HILIGHT_ACTIVITY:
        this.tab.addClass("tab-hilight-activity");
        break;
    }
  }
});
