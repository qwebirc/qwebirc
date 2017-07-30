qwebirc.ui.QUI = new Class({
  Extends: qwebirc.ui.RootUI,
  initialize: function(parentElement, theme, options) {
    this.parent(parentElement, qwebirc.ui.QUI.Window, "qui", options);
    this.theme = theme;
    this.parentElement = parentElement;
    this.setModifiableStylesheet("qui");
  },
  postInitialize: function() {
    this.qjsui = new qwebirc.ui.QUI.JSUI("qwebirc-qui", this.parentElement);
    this.qjsui.addEvent("reflow", function() {
      var w = this.getActiveWindow();
      if($defined(w))
        w.onResize();
    }.bind(this));
    this.qjsui.top.addClass("outertabbar");
    this.qjsui.left.addClass("outertabbar");

    this.qjsui.top.addClass("outertabbar_top");
    this.qjsui.left.addClass("outertabbar_left");

    this.qjsui.bottom.addClass("input");
    this.qjsui.right.addClass("nicklist");
    this.qjsui.topic.addClass("topic");
    this.qjsui.middle.addClass("lines");
    
    this.outerTabs = new Element("div");
    this.sideTabs = null;

    this.tabs = new Element("div");
    this.tabs.addClass("tabbar");
    
    this.__createDropdownMenu();

    this.outerTabs.appendChild(this.tabs);
    this.origtopic = this.topic = this.qjsui.topic;
    this.lines = this.qjsui.middle;
    this.orignicklist = this.nicklist = this.qjsui.right;
    
    this.input = this.qjsui.bottom;
    this.reflow = this.qjsui.reflow.bind(this.qjsui);

    var scrollHandler = function(x) {
      var event = new Event(x);
      var up, down;
      if(this.sideTabs) {
        var p = this.qjsui.left;

        /* don't scroll if we're scrollable */
        if(p.getScrollSize().y > p.clientHeight)
          return;

        up = event.wheel < 0;
        down = event.wheel > 0;
      } else {
        up = event.wheel > 0;
        down = event.wheel < 0;
      }

      if(up) {
        this.nextWindow();
      } else if(down) {
        this.prevWindow();
      }
      event.stop();
    }.bind(this);
    this.qjsui.left.addEvent("mousewheel", scrollHandler);
    this.qjsui.top.addEvent("mousewheel", scrollHandler);

    this.createInput();
    this.reflow();
    for(var i=50;i<1000;i+=50)
      this.reflow.delay(i, true);
    for(var i=1000;i<2000;i+=100)
      this.reflow.delay(i);
    for(var i=2000;i<15000;i+=500)
      this.reflow.delay(i);

    this.setSideTabs(this.uiOptions.SIDE_TABS);

  },
  newWindow: function(client, type, name) {
    var w = this.parent(client, type, name);
    w.setSideTabs(this.sideTabs);
    return w;
  },
  __createDropdownMenu: function() {
    var dropdownMenu = new Element("span");
    dropdownMenu.addClass("dropdownmenu");
    
    dropdownMenu.hide = function() {
      dropdownMenu.setStyle("display", "none");
      dropdownMenu.visible = false;
      document.removeEvent("mousedown", hideEvent);
    }.bind(this);
    var hideEvent = function() { dropdownMenu.hide(); };
    
    dropdownMenu.hide();
    this.parentElement.appendChild(dropdownMenu);
    
    this.UICommands.forEach(function(x) {
      var text = x[0];
      var fn = x[1];
      var e = new Element("a");
      e.addEvent("mousedown", function(e) { new Event(e).stop(); });
      e.addEvent("click", function() {
        dropdownMenu.hide();
        fn();
      });
      e.set("text", text);
      dropdownMenu.appendChild(e);
    }.bind(this));
    
    var dropdown = new Element("div");
    dropdown.addClass("dropdown-tab");
    dropdown.appendChild(new Element("img", {src: qwebirc.global.staticBaseURL + "images/icon.png", title: "menu", alt: "menu"}));
    dropdown.setStyle("opacity", 1);

    this.outerTabs.appendChild(dropdown);
    dropdownMenu.show = function(x) {
      new Event(x).stop();

      if(dropdownMenu.visible) {
        dropdownMenu.hide();
        return;
      }

      dropdownMenu.setStyle("display", "inline-block");
      dropdownMenu.visible = true;
      
      document.addEvent("mousedown", hideEvent);
    }.bind(this);
    dropdown.addEvent("mousedown", function(e) { new Event(e).stop(); });
    dropdown.addEvent("click", dropdownMenu.show);
  },
  createInput: function() {
    var form = new Element("form");
    this.input.appendChild(form);
    
    form.addClass("input");
    
    var inputbox = new Element("input");
    this.addEvent("signedOn", function(client) {
      this.getStatusWindow(client).lines.removeClass("spinner");
      inputbox.placeholder = "chat here! you can also use commands, like /JOIN";
      var d = function() { inputbox.addClass("input-flash"); }.delay(250);
      var d = function() { inputbox.removeClass("input-flash"); }.delay(500);
      var d = function() { inputbox.addClass("input-flash"); }.delay(750);
      var d = function() { inputbox.removeClass("input-flash"); }.delay(1000);
      var d = function() { inputbox.addClass("input-flash"); }.delay(1250);
      var d = function() { inputbox.removeClass("input-flash"); }.delay(1750);
    });
    form.appendChild(inputbox);
    this.inputbox = inputbox;
    this.inputbox.maxLength = 470;

    var sendInput = function() {
      if(inputbox.value == "")
        return;
        
      this.resetTabComplete();
      this.getActiveWindow().historyExec(inputbox.value);
      inputbox.value = "";
      inputbox.placeholder = "";
    }.bind(this);

    if(!qwebirc.util.deviceHasKeyboard()) {
      inputbox.addClass("mobile-input");
      var inputButton = new Element("input", {type: "button"});
      inputButton.addClass("mobile-button");
      inputButton.addEvent("click", function() {
        sendInput();
        inputbox.focus();
      });
      inputButton.value = ">";
      this.input.appendChild(inputButton);
      var reflowButton = function() {
        var containerSize = this.input.getSize();
        var buttonSize = inputButton.getSize();
        
        var buttonLeft = containerSize.x - buttonSize.x - 5; /* lovely 5 */

        inputButton.setStyle("left", buttonLeft);
        inputbox.setStyle("width", buttonLeft - 5);
        inputButton.setStyle("height", containerSize.y);
      }.bind(this);
      this.qjsui.addEvent("reflow", reflowButton);
    } else {
      inputbox.addClass("keyboard-input");
    }
    
    form.addEvent("submit", function(e) {
      new Event(e).stop();
      sendInput();
    });

    var reset = this.resetTabComplete.bind(this);
    inputbox.addEvent("focus", reset);
    inputbox.addEvent("mousedown", reset);
    inputbox.addEvent("keypress", reset);

    inputbox.addEvent("keydown", function(e) {
      var resultfn;
      var cvalue = inputbox.value;

      if(e.alt || e.control || e.meta)
        return;

      if(e.key == "up" && !e.shift) {
        resultfn = this.commandhistory.upLine;
      } else if(e.key == "down" && !e.shift) {
        resultfn = this.commandhistory.downLine;
      } else if(e.key == "tab") {
        this.tabComplete(inputbox, e.shift);

        new Event(e).stop();
        e.preventDefault();
        return;
      } else {
        return;
      }
      
      this.resetTabComplete();
      if((cvalue != "") && (this.lastcvalue != cvalue))
        this.commandhistory.addLine(cvalue, true);
      
      var result = resultfn.bind(this.commandhistory)();
      
      new Event(e).stop();
      e.preventDefault();

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
  },
  setSideTabs: function(value) {
    if(value === this.sideTabs)
      return;

    if(this.sideTabs === true) {
      this.qjsui.left.removeChild(this.outerTabs);
    } else if(this.sideTabs === false) {
      this.qjsui.top.removeChild(this.outerTabs);
    }
    if(value) {
      this.qjsui.left.appendChild(this.outerTabs);
      this.qjsui.top.style.display = "none";
      this.qjsui.left.style.display = "";
    } else {
      this.qjsui.top.appendChild(this.outerTabs);
      this.qjsui.top.style.display = "";
      this.qjsui.left.style.display = "none";
    }
    this.sideTabs = value;
    this.windows.each(function(k, v) {
      v.each(function(k, v2) {
        v2.setSideTabs(value);
      });
    });
  }
});

qwebirc.ui.QUI.JSUI = new Class({
  Implements: [Events],
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
    l.addClass(pos + "boundpanel");
  },
  create: function() {
    var XE = function(pos) {
      var element = new Element("div");
      this.applyClasses(pos, element);
      
      this.parent.appendChild(element);
      return element;
    }.bind(this);
    
    this.top = XE("top");
    this.left = XE("left");
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
    var left = this.left;

    /* |----------------------------------------------|
     * | top                                          |
     * |----------------------------------------------|
     * | left | topic                         | right |
     * |      |-------------------------------|       |
     * |      | middle                        |       |
     * |      |                               |       |
     * |      |                               |       |
     * |      |---------------------------------------|
     * |      | bottom                                |
     * |----------------------------------------------|
     */

    var topicsize = topic.getSize();
    var topsize = top.getSize();
    var rightsize = right.getSize();
    var bottomsize = bottom.getSize();
    var leftsize = left.getSize();
    var docsize = this.sizer.getSize();
    
    var mheight = (docsize.y - topsize.y - bottomsize.y - topicsize.y);
    var mwidth = (docsize.x - rightsize.x - leftsize.x);

    left.setStyle("top", topsize.y);
    topic.setStyle("top", topsize.y);
    topic.setStyle("left", leftsize.x);
    topic.setStyle("width", docsize.x - leftsize.x);
    
    middle.setStyle("top", (topsize.y + topicsize.y));
    middle.setStyle("left", leftsize.x);
    if(mheight > 0) {
      middle.setStyle("height", mheight);
      right.setStyle("height", mheight);
    }
    
    if(mwidth > 0)
      middle.setStyle("width", mwidth);
    right.setStyle("top", (topsize.y + topicsize.y));

    bottom.setStyle("left",  leftsize.x);
    this.fireEvent("reflow");
  },
  showChannel: function(state, nicklistVisible) {
    var display = "none";
    if(state)
      display = "block";

    this.right.setStyle("display", nicklistVisible ? display : "none");
    this.topic.setStyle("display", display);
  },
  showInput: function(state) {
    this.bottom.isVisible = state;
    this.bottom.setStyle("display", state?"block":"none");
  }
});

qwebirc.ui.QUI.Window = new Class({
  Extends: qwebirc.ui.Window,
  
  initialize: function(parentObject, client, type, name, identifier) {
    this.parent(parentObject, client, type, name, identifier);

    this.tab = new Element("a");
    this.tab.addClass("tab");
    this.tab.addEvent("focus", function() { this.blur() }.bind(this.tab));;

    this.spaceNode = document.createTextNode(" ");
    parentObject.tabs.appendChild(this.tab);
    parentObject.tabs.appendChild(this.spaceNode);

    if(type != qwebirc.ui.WINDOW_STATUS && type != qwebirc.ui.WINDOW_CONNECT) {
      var tabclose = new Element("span");
      this.tabclose = tabclose;
      tabclose.set("text", "X");
      tabclose.addClass("tabclose");
      var close = function(e) {
        new Event(e).stop();

        if(this.closed)
          return;

        if(type == qwebirc.ui.WINDOW_CHANNEL)
          this.client.exec("/PART " + name);

        this.close();

        //parentObject.inputbox.focus();
      }.bind(this);

      tabclose.addEvent("click", close);
      this.tab.addEvent("mouseup", function(e) {
        var button = 1;

        if(Browser.Engine.trident)
          button = 4;

        if(e.event.button == button)
          close(e);
      }.bind(this));

      this.tab.appendChild(tabclose);
    } else {
      this.tabclose = null;
    }

    this.tab.appendText(name);
    this.tab.addEvent("click", function(e) {
      new Event(e).stop();
      
      if(this.closed)
        return;
        
      parentObject.selectWindow(this);
    }.bind(this));
    

    this.lines = new Element("div");
    this.parentObject.qjsui.applyClasses("middle", this.lines);
    this.lines.addClass("lines");

    if(type == qwebirc.ui.WINDOW_STATUS)
      this.lines.addClass("spinner");

    if(type != qwebirc.ui.WINDOW_CUSTOM && type != qwebirc.ui.WINDOW_CONNECT)
      this.lines.addClass("ircwindow");
    
    this.lines.addEvent("scroll", function() {
      this.scrolleddown = this.scrolledDown();
      this.scrollpos = this.getScrollParent().getScroll();
    }.bind(this));
    
    if(type == qwebirc.ui.WINDOW_CHANNEL) {
      this.topic = new Element("div");
      this.parentObject.qjsui.applyClasses("topic", this.topic);
      this.topic.addClass("topic");
      this.topic.addClass("tab-invisible");
      this.topic.set("html", "&nbsp;");
      this.topic.addEvent("dblclick", this.editTopic.bind(this));
      this.parentObject.qjsui.applyClasses("topic", this.topic);

      this.prevNick = null;
      this.nicklist = new Element("div");
      this.nicklist.addClass("nicklist");
      this.nicklist.addClass("tab-invisible");
      this.nicklist.addEvent("click", this.removePrevMenu.bind(this));
      this.parentObject.qjsui.applyClasses("right", this.nicklist);

      this.updateTopic("");
    }
    
    this.nicksColoured = this.parentObject.uiOptions.NICK_COLOURS;
    this.reflow();
  },
  rename: function(name) {
    var newNode = document.createTextNode(name);
    if(this.parentObject.sideTabs) {
      this.tab.replaceChild(newNode, this.tab.childNodes[1]);
    } else {
      this.tab.replaceChild(newNode, this.tab.firstChild);
    }

    if(this.type == qwebirc.ui.WINDOW_QUERY)
      this.updateTopic("");
  },
  editTopic: function() {
    if(this.type != qwebirc.ui.WINDOW_CHANNEL)
      return;

    if(!this.client.nickOnChanHasPrefix(this.client.nickname, this.name, "@")) {
/*      var cmodes = this.client.getChannelModes(channel);
      if(cmodes.indexOf("t")) {*/
        alert("Sorry, you need to be a channel operator to change the topic!");
        return;
      /*}*/
    }
    var newTopic = prompt("Change topic of " + this.name + " to:", this.topic.topicText);
    if(newTopic === null)
      return;

    this.client.exec("/TOPIC " + newTopic);
  },
  reflow: function() {
    this.parentObject.reflow();
  },
  onResize: function() {
    if(this.scrolleddown) {
      if(Browser.Engine.trident) {
        this.scrollToBottom.delay(5, this);
      } else {
        this.scrollToBottom();
      }
    } else if($defined(this.scrollpos)) {
      if(Browser.Engine.trident) {
        this.getScrollParent().scrollTo(this.scrollpos.x, this.scrollpos.y);
      } else {
        this.getScrollParent().scrollTo.delay(5, this, [this.scrollpos.x, this.scrollpos.y]);
      }
    }
  },
  createMenu: function(nick, parent) {
    var e = new Element("div");
    parent.appendChild(e);
    e.addClass("menu");
    
    var nickArray = [nick];
    qwebirc.ui.MENU_ITEMS.forEach(function(x) {
      if(!x.predicate || x.predicate !== true && !x.predicate.apply(this, nickArray))
        return;
      
      var e2 = new Element("a");
      e.appendChild(e2);

      e2.set("text", "- " + x.text);

      e2.addEvent("focus", function() { this.blur() }.bind(e2));
      e2.addEvent("click", function(ev) { new Event(ev.stop()); this.menuClick(x.fn); }.bind(this));
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
    var realNick = this.client.stripPrefix(nick);
    
    var e = new Element("a");
    qwebirc.ui.insertAt(position, this.nicklist, e);
    var span = new Element("span");
    if(this.parentObject.uiOptions.NICK_COLOURS) {
      var colour = realNick.toHSBColour(this.client);
      if($defined(colour))
        span.setStyle("color", colour.rgbToHex());
    }
    span.set("text", nick);
    e.appendChild(span);
    
    e.realNick = realNick;
    
    e.addEvent("click", function(x) {
      if(this.prevNick == e) {
        this.removePrevMenu();
        return;
      }
      
      this.removePrevMenu();
      this.prevNick = e;
      e.addClass("selected");
      this.moveMenuClass();
      e.menu = this.createMenu(e.realNick, e);
      new Event(x).stop();
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

    var suffix;
    if(this.type == qwebirc.ui.WINDOW_CHANNEL) {
      suffix = ": ";
    } else {
      suffix = "";
    }
    qwebirc.ui.Colourise(this.name + suffix, t, null, null, this);

    if(this.type == qwebirc.ui.WINDOW_CHANNEL) {
      t.topicText = topic;
      if (topic) {
        this.parent(topic, t);
      } else {
        t.appendChild(document.createTextNode("(no topic set)"));
      }
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
    this.parentObject.qjsui.showChannel($defined(this.nicklist), this.parentObject.uiOptions.SHOW_NICKLIST);

    this.reflow();
    
    this.parent();
    
    if(inputVisible)
      this.parentObject.inputbox.focus();

    if(this.type == qwebirc.ui.WINDOW_CHANNEL && this.nicksColoured != this.parentObject.uiOptions.NICK_COLOURS) {
      this.nicksColoured = this.parentObject.uiOptions.NICK_COLOURS;
      
      var nodes = this.nicklist.childNodes;
      if(this.parentObject.uiOptions.NICK_COLOURS) {
        for(var i=0;i<nodes.length;i++) {
          var e = nodes[i], span = e.firstChild;
          var colour = e.realNick.toHSBColour(this.client);
          if($defined(colour))
            span.setStyle("color", colour.rgbToHex());
        };
      } else {
        for(var i=0;i<nodes.length;i++) {
          var span = nodes[i].firstChild;
          span.setStyle("color", null);
        };
      }
    }
  },
  deselect: function() {
    this.parent();
    
    this.tab.removeClass("tab-selected");
    this.tab.addClass("tab-unselected");
  },
  close: function() {
    this.parent();
    
    this.parentObject.tabs.removeChild(this.tab);
    this.parentObject.tabs.removeChild(this.spaceNode);
    this.reflow();
  },
  addLine: function(type, line, colourClass) {
    var e = new Element("div");

    if(colourClass) {
      e.addClass(colourClass);
    } else if(this.lastcolour) {
      e.addClass("linestyle1");
    } else {
      e.addClass("linestyle2");
    }
    this.lastcolour = !this.lastcolour;

    this.parent(type, line, colourClass, e);
  },
  setHilighted: function(state) {
    var laststate = this.hilighted;
    
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
  },
  setSideTabs: function(value) {
    if(this.tabclose === null)
      return;
    this.tab.removeChild(this.tabclose);
    if(value) {
      this.tab.insertBefore(this.tabclose, this.tab.firstChild);
    } else {
      this.tab.appendChild(this.tabclose);
    }
  }
});
