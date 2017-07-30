qwebirc.ui.WINDOW_STATUS =   0x01;
qwebirc.ui.WINDOW_QUERY =    0x02;
qwebirc.ui.WINDOW_CHANNEL =  0x04;
qwebirc.ui.WINDOW_CUSTOM =   0x08;
qwebirc.ui.WINDOW_CONNECT =  0x10;
qwebirc.ui.WINDOW_MESSAGES = 0x20;

qwebirc.ui.CUSTOM_CLIENT = "custom";
qwebirc.ui.DEFAULT_HUE = 210; /* nice blue */

qwebirc.ui.BaseUI = new Class({
  Implements: [Events],
  initialize: function(parentElement, windowClass, uiName, options) {
    this.options = options;
    
    this.windows = new QHash();
    this.clients = new QHash();
    this.windows.put(qwebirc.ui.CUSTOM_CLIENT, new QHash());
    this.windowArray = [];
    this.windowClass = windowClass;
    this.parentElement = parentElement;
    this.parentElement.addClass("qwebirc");
    this.parentElement.addClass("qwebirc-" + uiName);
    this.firstClient = false;
    this.commandhistory = new qwebirc.irc.CommandHistory();
    this.clientId = 0;
    
    this.windowFocused = true;

    if(Browser.Engine.trident) {
      var checkFocus = function() {
        var hasFocus = document.hasFocus();
        if(hasFocus != this.windowFocused) {
          this.windowFocused = hasFocus;
          this.focusChange(hasFocus);
        }
      }

      checkFocus.periodical(100, this);
    } else {
      var blur = function() { if(this.windowFocused) { this.windowFocused = false; this.focusChange(false); } }.bind(this);
      var focus = function() { if(!this.windowFocused) { this.windowFocused = true; this.focusChange(true); } }.bind(this);

      /* firefox requires both */

      document.addEvent("blur", blur);
      window.addEvent("blur", blur);
      document.addEvent("focus", focus);
      window.addEvent("focus", focus);
    }

    qwebirc.util.__log = function(x) {
      if(QWEBIRC_DEBUG) {
        if(typeof console != "undefined")
          console.log(x);
        this.getActiveWindow().addLine(null, x);
      }
    }.bind(this);
  },
  newClient: function(client) {
    client.id = String(this.clientId++);
    client.hilightController = new qwebirc.ui.HilightController(client);
    client.addEvent("signedOn", function() {
      this.poller = new qwebirc.xdomain.Poller(this.oobMessage.bind(this));
      this.fireEvent("signedOn", client);
    }.bind(this));
    this.windows.put(client.id, new QHash());
    this.clients.put(client.id, client);
    var w = this.newWindow(client, qwebirc.ui.WINDOW_STATUS, "Status");
    this.selectWindow(w);
    if(!this.firstClient) {
      this.firstClient = true;
      w.addLine("", "qwebirc v" + qwebirc.VERSION);
      w.addLine("", "Copyright (C) 2008-2017 Chris Porter and the qwebirc project.");
      w.addLine("", "http://www.qwebirc.org");
      w.addLine("", "Licensed under the GNU General Public License, Version 2.");
    }
    return w;
  },
  getClientId: function(client) {
    if(client == qwebirc.ui.CUSTOM_CLIENT) {
      return qwebirc.ui.CUSTOM_CLIENT;
    } else {
      return client.id;
    }
  },
  getWindowIdentifier: function(client, type, name) {
    if(type == qwebirc.ui.WINDOW_MESSAGES)
      return "-M";
    if(type == qwebirc.ui.WINDOW_STATUS)
      return "";

    if(client == qwebirc.ui.CUSTOM_CLIENT) /* HACK */
      return "_" + name;

    return "_" + client.toIRCLower(name);
  },
  newWindow: function(client, type, name) {
    var w = this.getWindow(client, type, name);
    if($defined(w))
      return w;
      
    var wId = this.getWindowIdentifier(client, type, name);
    var w = new this.windowClass(this, client, type, name, wId);
    this.windows.get(this.getClientId(client)).put(wId, w);
    this.windowArray.push(w);
    
    return w;
  },
  getWindow: function(client, type, name) {
    var c = this.windows.get(this.getClientId(client));
    if(!$defined(c))
      return null;
      
    return c.get(this.getWindowIdentifier(client, type, name));
  },
  getActiveWindow: function() {
    return this.active;
  },
  getStatusWindow: function(client) {
    return this.windows.get(this.getClientId(client)).get(this.getWindowIdentifier(client, qwebirc.ui.WINDOW_STATUS));
  },
  getActiveIRCWindow: function(client) {
    if(!this.active || this.active.type == qwebirc.ui.WINDOW_CUSTOM) {
      return this.getStatusWindow(client);
    } else {
      return this.active;
    }
  },  
  __setActiveWindow: function(window) {
    this.active = window;
  },
  renameWindow: function(window, name) {
    if(this.getWindow(window.client, window.type, name))
      return null;
    
    var clientId = this.getClientId(window.client);
    var index = this.windowArray.indexOf(window);
    if(index == -1)
      return null;
    
    this.windows.get(clientId).remove(window.identifier);
    
    var window = this.windowArray[index];
    window.name = name;
    window.identifier = this.getWindowIdentifier(window.client, window.type, window.name);
    
    this.windows.get(clientId).put(window.identifier, this.windowArray[index]);
    
    if(window.active)
      this.updateTitle(window.name + " - " + this.options.appTitle);
    
    window.rename(window.name);
    return window;
  },
  selectWindow: function(window) {
    if(this.active)
      this.active.deselect();
    window.select();  /* calls setActiveWindow */
    this.updateTitle(window.name + " - " + this.options.appTitle);
  },
  updateTitle: function(text) {
    document.title = text;
  },
  nextWindow: function(direction) {
    if(this.windowArray.length == 0 || !this.active)
      return;
      
    if(!direction)
      direction = 1;
      
    var index = this.windowArray.indexOf(this.active);
    if(index == -1)
      return;
      
    index = index + direction;
    if(index < 0) {
      index = this.windowArray.length - 1;
    } else if(index >= this.windowArray.length) {
      index = 0;
    }
    
    this.selectWindow(this.windowArray[index]);
  },
  prevWindow: function() {
    this.nextWindow(-1);
  },
  __closed: function(window) {
    if(window.active) {
      this.active = undefined;
      if(this.windowArray.length == 1) {
        this.windowArray = [];
      } else {
        var index = this.windowArray.indexOf(window);
        if(index == -1) {
          return;
        } else if(index == 0) {
          this.selectWindow(this.windowArray[1]);
        } else {
          this.selectWindow(this.windowArray[index - 1]);
        }
      }
    }
    
    this.windowArray = this.windowArray.erase(window);
    this.windows.get(this.getClientId(window.client)).remove(window.identifier);
  },
    /*
      this shouldn't be called by overriding classes!
      they should implement their own!
      some form of user input MUST be received before an
      IRC connection is made, else users are going to get
      tricked into getting themselves glined
    */
  loginBox: function(callback, initialNickname, initialChannels, autoConnect, autoNick) {
    this.postInitialize();

    this.addCustomWindow("Connect", qwebirc.ui.ConnectPane, "connectpane", {
      initialNickname: initialNickname, initialChannels: initialChannels, autoConnect: autoConnect, callback: callback, autoNick: autoNick,
      uiOptions: this.options
    }, qwebirc.ui.WINDOW_CONNECT);
  },
  focusChange: function(newValue) {
    var window_ = this.getActiveWindow();
    if($defined(window_))
      window_.focusChange(newValue);
  },
  oobMessage: function(message) {
    var c = message.splitMax(" ", 2);
    if(c.length != 2)
      return;

    var command = c[0];
    if(command != "CMD")
      return;

    var d = c[1].splitMax(" ", 2);
    if(d.length != 2)
      return;

    var command = d[0];
    var args = d[1];
    if(command == "SAY") {
      var w = this.getActiveIRCWindow();
      if($defined(w) && (w.type == qwebirc.ui.WINDOW_CHANNEL || w.type == qwebirc.ui.WINDOW_QUERY)) {
        w.client.exec("/SAY " + args);
        return;
      }
    }
  }
});

qwebirc.ui.StandardUI = new Class({
  Extends: qwebirc.ui.BaseUI,
  initialize: function(parentElement, windowClass, uiName, options) {
    this.parent(parentElement, windowClass, uiName, options);

    this.UICommands = this.__build_menu_items(options);

    this.__styleValues = {hue: qwebirc.ui.DEFAULT_HUE, saturation: 0, lightness: 0, textHue: null, textSaturation: null, textLightness: null};
    if($defined(this.options.hue)) this.__styleValues.hue = this.options.hue;
    this.tabCompleter = new qwebirc.ui.TabCompleterFactory(this);
    this.uiOptions = new qwebirc.ui.DefaultOptionsClass(this, options.uiOptionsArg);
    this.customWindows = new QHash();

    if($defined(this.options.saturation)) this.__styleValues.saturation = this.options.saturation;
    if($defined(this.options.lightness)) this.__styleValues.lightness = this.options.lightness;
    if($defined(this.options.tsaturation)) this.__styleValues.textSaturation = this.options.tsaturation;
    if($defined(this.options.tlightness)) this.__styleValues.textLightness = this.options.tlightness;

    if($defined(this.options.hue)) { /* overridden in url */
      /* ugh... this will go away when we add proper options for hue/sat/light for text and background */
      this.uiOptions.setValueByPrefix("STYLE_HUE", this.__styleValues.hue);
    } else {
      this.__styleValues.hue = this.uiOptions.STYLE_HUE; /* otherwise copy from serialised store */
    }
    this.__styleValues.textHue = $defined(this.options.thue) ? this.options.thue : this.__styleValues.hue;

    document.addEvent("keydown", this.__handleHotkey.bind(this));
  },
  __build_menu_items: function(options) {
    var r = [];
    var seenAbout = null;

    for(var i=0;i<qwebirc.ui.UI_COMMANDS_P1.length;i++)
      r.push([true, qwebirc.ui.UI_COMMANDS_P1[i]]);
    for(var i=0;i<options.customMenuItems.length;i++)
      r.push([false, options.customMenuItems[i]]);
    for(var i=0;i<qwebirc.ui.UI_COMMANDS_P2.length;i++)
      r.push([true, qwebirc.ui.UI_COMMANDS_P2[i]]);

    var r2 = []
    for(var i=0;i<r.length;i++) {
      var preset = r[i][0], c = r[i][1];

      if(c[0] == "About qwebirc") { /* HACK */
        if(!preset) {
          seenAbout = c;
          continue;
        } else if(seenAbout) {
          c = seenAbout;
          preset = false;
        }
      }

      if(preset) {
        r2.push([c[0], this[c[1] + "Window"].bind(this)]);
      } else {
        r2.push([c[0], (function(c) { return function() {
          this.addCustomWindow(c[0], qwebirc.ui.URLPane, "urlpane", {url: c[1]});
        }.bind(this); }).call(this, c)]);
      }
    }

    return r2;
  },
  __handleHotkey: function(x) {
    var success = false;
    if(!x.alt && !x.control && !x.shift && !x.meta) {
      if((x.key == "backspace" || x.key == "/") && !this.getInputFocused(x)) {
        success = true;
      }
    } else if(!x.alt || x.control || x.meta) {
      /* do nothing */
    } else if(x.key == "a" || x.key == "A") {
      var highestNum = 0;
      var highestIndex = -1;
      success = true;

      for(var i=0;i<this.windowArray.length;i++) {
        var h = this.windowArray[i].hilighted;
        if(h > highestNum) {
          highestIndex = i;
          highestNum = h;
        }
      }
      if(highestIndex > -1)
        this.selectWindow(this.windowArray[highestIndex]);
    } else if((x.key >= '0' && x.key <= '9') && !x.shift) {
      success = true;
      
      number = x.key - '0';
      if(number == 0)
        number = 10
        
      number = number - 1;
      
      if(number >= this.windowArray.length)
        return;
        
      this.selectWindow(this.windowArray[number]);
    } else if((x.key == "left" || x.key == "up") && !x.shift) {
      this.prevWindow();
      success = true;
    } else if((x.key == "right" || x.key == "down") && !x.shift) {
      this.nextWindow();
      success = true;
    }

    if(success) {
      new Event(x).stop();
      x.preventDefault();
    }
  },
  getInputFocused: function(x) {
    if($$("input").indexOf(x.target) == -1 && $$("textarea").indexOf(x.target) == -1)
      return false;
    return true;
  },
  newCustomWindow: function(name, select, type) {
    if(!type)
      type = qwebirc.ui.WINDOW_CUSTOM;

    var w = this.newWindow(qwebirc.ui.CUSTOM_CLIENT, type, name);
    w.addEvent("close", function(w) {
      this.windows.get(qwebirc.ui.CUSTOM_CLIENT).remove(w.identifier);
    }.bind(this));
    
    if(select)
      this.selectWindow(w);  

    return w;
  },
  addCustomWindow: function(windowName, class_, cssClass, options, type) {
    if(!$defined(options))
      options = {};
      
    if(this.customWindows.contains(windowName)) {
      this.selectWindow(this.customWindows.get(windowName));
      return;
    }
    
    var d = this.newCustomWindow(windowName, true, type);
    this.customWindows.put(windowName, d);
    
    d.addEvent("close", function() {
      this.customWindows.remove(windowName);
    }.bind(this));
        
    if(cssClass)
      d.lines.addClass("qwebirc-" + cssClass);
      
    var ew = new class_(d.lines, options);
    ew.addEvent("close", function() {
      d.close();
    }.bind(this));
    
    d.setSubWindow(ew);
  },
  embeddedWindow: function() {
    this.addCustomWindow("Add webchat to your site", qwebirc.ui.EmbedWizard, "embeddedwizard", {baseURL: this.options.baseURL, uiOptions: this.uiOptions, optionsCallback: function() {
      this.optionsWindow();
    }.bind(this)});
  },
  optionsWindow: function() {
    this.addCustomWindow("Options", qwebirc.ui.OptionsPane, "optionspane", this.uiOptions);
  },
  aboutWindow: function() {
    this.addCustomWindow("About qwebirc", qwebirc.ui.AboutPane, "aboutpane", this.uiOptions);
  },
  feedbackWindow: function() {
    this.addCustomWindow("Feedback", qwebirc.ui.FeedbackPane, "feedbackpane", this.uiOptions);
  },
  urlDispatcher: function(name, window) {
    if(name == "embedded")
      return ["a", this.embeddedWindow.bind(this)];
      
    if(name == "options")
      return ["a", this.optionsWindow.bind(this)];

    /* doesn't really belong here */
    if(name == "whois") {
      return ["span", function(nick) {
        if(this.uiOptions.QUERY_ON_NICK_CLICK) {
          window.client.exec("/QUERY " + nick);
        } else {
          window.client.exec("/WHOIS " + nick);
        }
      }.bind(this)];
    }

    return null;
  },
  tabComplete: function(element, backwards) {
    this.tabCompleter.tabComplete(element, backwards);
  },
  resetTabComplete: function() {
    this.tabCompleter.reset();
  },
  setModifiableStylesheet: function(name) {
    this.__styleSheet = new qwebirc.ui.style.ModifiableStylesheet(qwebirc.global.staticBaseURL + "css/" + (QWEBIRC_DEBUG ? "debug/" : "") + name + qwebirc.FILE_SUFFIX + ".mcss");
    this.setModifiableStylesheetValues({});
  },
  setModifiableStylesheetValues: function(values) {
    for (var k in values)
      this.__styleValues[k] = values[k];

    if (!$defined(this.__styleSheet))
      return;

    var back = {hue: this.__styleValues.hue, lightness: this.__styleValues.lightness, saturation: this.__styleValues.saturation};
    var front;
    if (!$defined(this.__styleValues.textHue) && !$defined(this.__styleValues.textLightness) && !$defined(this.__styleValues.textSaturation)) {
      front = back;
    } else {
      front = {hue: Number(this.__styleValues.textHue), lightness: Number(this.__styleValues.textLightness), saturation: Number(this.__styleValues.textSaturation)}
    }
    var colours = {
      back: back,
      front: front
    };

    this.__styleSheet.set(function() {
      var mode = arguments[0];
      if(mode == "c") {
        var t = colours[arguments[2]];
        var x = new Color(arguments[1]);
        var c = x.setHue(t.hue).setSaturation(x.hsb[1] + t.saturation).setBrightness(x.hsb[2] + t.lightness);
        if(c == "255,255,255") /* IE confuses white with transparent... */
          c = "255,255,254";
        
        return "rgb(" + c + ")";
      } else if(mode == "o") {
        return this.uiOptions[arguments[1]] ? arguments[2] : arguments[3];
      }
    }.bind(this));
  }
});

qwebirc.ui.NotificationUI = new Class({
  Extends: qwebirc.ui.StandardUI,
  initialize: function(parentElement, windowClass, uiName, options) {
    this.parent(parentElement, windowClass, uiName, options);
    
    this.__beeper = new qwebirc.ui.Beeper(this.uiOptions);
    this.__flasher = new qwebirc.ui.Flasher(this.uiOptions);
    this.__notifier = new qwebirc.ui.Notifier(this.uiOptions);

    this.cancelFlash = this.__flasher.cancelFlash.bind(this.__flasher);
  },
  beep: function() {
    this.__beeper.beep();
  },
  notify: function(title, message, callback) {
    this.__beeper.beep();
    this.__flasher.flash();
    this.__notifier.notify(title, message, callback);
  },
  setBeepOnMention: function(value) {
    if(value)
      this.__beeper.soundInit();
  },
  setNotifications: function(value) {
    this.__notifier.setEnabled(value);
  },
  updateTitle: function(text) {
    if(this.__flasher.updateTitle(text))
      this.parent(text);
  },
  focusChange: function(value) {
    this.parent(value);
    this.__flasher.focusChange(value);
    this.__notifier.focusChange(value);
  }
});

qwebirc.ui.QuakeNetUI = new Class({
  Extends: qwebirc.ui.NotificationUI,
  urlDispatcher: function(name, window) {
    if(name == "qwhois") {
      return ["span", function(auth) {
        if($defined(this.parentObject.options.accountWhoisCommand))
          this.client.exec(this.parentObject.options.accountWhoisCommand + auth);
      }.bind(window)];
    }
    return this.parent(name, window);
  },
  logout: function() {
    if(!qwebirc.auth.loggedin())
      return;
    if(confirm("Log out?")) {
      this.clients.each(function(k, v) {
        v.quit("Logged out");
      }, this);
      
      /* HACK */
      var foo = function() { document.location = qwebirc.global.dynamicBaseURL + "auth?logout=1"; };
      foo.delay(500);
    }
  }
});

qwebirc.ui.RootUI = qwebirc.ui.QuakeNetUI;

qwebirc.ui.RequestTransformHTML = function(options) {
  var HREF_ELEMENTS = {
    "IMG": 1
  };

  var update = options.update;
  var onSuccess = options.onSuccess;

  var fixUp = function(node) {
    if(node.nodeType != 1)
      return;

    var tagName = node.nodeName.toUpperCase();
    if(HREF_ELEMENTS[tagName]) {
      var attr = node.getAttribute("transform_attr");
      var value = node.getAttribute("transform_value");
      if($defined(attr) && $defined(value)) {
        node.removeAttribute("transform_attr");
        node.removeAttribute("transform_value");
        node.setAttribute(attr, qwebirc.global.staticBaseURL + value);
      }
    }

    for(var i=0;i<node.childNodes.length;i++)
      fixUp(node.childNodes[i]);
  };

  delete options["update"];
  options.onSuccess = function(tree, elements, html, js) {
    var container = new Element("div");
    container.set("html", html);
    fixUp(container);
    update.empty();

    while(container.childNodes.length > 0) {
      var x = container.firstChild;
      container.removeChild(x);
      update.appendChild(x);
    }
    onSuccess();
  };

  return new Request.HTML(options);
};

