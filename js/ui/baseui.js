qwebirc.ui.WINDOW_STATUS =   0x01;
qwebirc.ui.WINDOW_QUERY =    0x02;
qwebirc.ui.WINDOW_CHANNEL =  0x04;
qwebirc.ui.WINDOW_CUSTOM =   0x08;
qwebirc.ui.WINDOW_CONNECT =  0x10;
qwebirc.ui.WINDOW_MESSAGES = 0x20;

qwebirc.ui.CUSTOM_CLIENT = "custom";

qwebirc.ui.BaseUI = new Class({
  Implements: [Events],
  initialize: function(parentElement, windowClass, uiName, options) {
    this.options = options;
    
    this.windows = {};
    this.clients = {};
    this.windows[qwebirc.ui.CUSTOM_CLIENT] = {};
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
  },
  newClient: function(client) {
    client.id = this.clientId++;
    client.hilightController = new qwebirc.ui.HilightController(client);
    
    this.windows[client.id] = {}
    this.clients[client.id] = client;
    var w = this.newWindow(client, qwebirc.ui.WINDOW_STATUS, "Status");
    this.selectWindow(w);
    if(!this.firstClient) {
      this.firstClient = true;
      w.addLine("", "qwebirc v" + qwebirc.VERSION);
      w.addLine("", "Copyright (C) 2008-2009 Chris Porter and the qwebirc project.");
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
    var w = this.windows[this.getClientId(client)][wId] = new this.windowClass(this, client, type, name, wId);
    this.windowArray.push(w);
    
    return w;
  },
  getWindow: function(client, type, name) {
    var c = this.windows[this.getClientId(client)];
    if(!$defined(c))
      return null;
      
    return c[this.getWindowIdentifier(client, type, name)];
  },
  getActiveWindow: function() {
    return this.active;
  },
  getActiveIRCWindow: function(client) {
    if(!this.active || this.active.type == qwebirc.ui.WINDOW_CUSTOM) {
      return this.windows[this.getClientId(client)][this.getWindowIdentifier(client, qwebirc.ui.WINDOW_STATUS)];
    } else {
      return this.active;
    }
  },  
  __setActiveWindow: function(window) {
    this.active = window;
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
    delete this.windows[this.getClientId(window.client)][window.identifier];
  },
    /*
      this shouldn't be called by overriding classes!
      they should implement their own!
      some form of user input MUST be received before an
      IRC connection is made, else users are going to get
      tricked into getting themselves glined
    */
  loginBox: function(callback, initialNickname, initialChannels, autoConnect, autoNick) {
    qwebirc.ui.GenericLoginBox(this.parentElement, callback, initialNickname, initialChannels, autoConnect, autoNick, this.options.networkName);
  },
  focusChange: function(newValue) {
    var window_ = this.getActiveWindow();
    if($defined(window_))
      window_.focusChange(newValue);
  }
});

qwebirc.ui.StandardUI = new Class({
  Extends: qwebirc.ui.BaseUI,
  UICommands: qwebirc.ui.UI_COMMANDS,
  initialize: function(parentElement, windowClass, uiName, options) {
    this.parent(parentElement, windowClass, uiName, options);

    this.tabCompleter = new qwebirc.ui.TabCompleterFactory(this);
    this.uiOptions = new qwebirc.ui.DefaultOptionsClass(this);
    this.customWindows = {};
    
    var ev;
    if(Browser.Engine.trident) {
      ev = "keydown";
    } else {
      ev = "keypress";
    }
    document.addEvent(ev, this.__handleHotkey.bind(this));
  },
  __handleHotkey: function(x) {
    if(!x.alt || x.control) {
      if(x.key == "backspace" || x.key == "/")
        if(!this.getInputFocused(x))
          new Event(x).stop();
      return;
    }
    var success = false;
    if(x.key == "a" || x.key == "A") {
      var highestNum = 0;
      var highestIndex = -1;
      success = true;
      
      new Event(x).stop();
      for(var i=0;i<this.windowArray.length;i++) {
        var h = this.windowArray[i].hilighted;
        if(h > highestNum) {
          highestIndex = i;
          highestNum = h;
        }
      }
      if(highestIndex > -1)
        this.selectWindow(this.windowArray[highestIndex]);
    } else if(x.key >= '0' && x.key <= '9') {
      success = true;
      
      number = x.key - '0';
      if(number == 0)
        number = 10
        
      number = number - 1;
      
      if(number >= this.windowArray.length)
        return;
        
      this.selectWindow(this.windowArray[number]);
    } else if(x.key == "left") {
      this.prevWindow();
      success = true;
    } else if(x.key == "right") {
      this.nextWindow();
      success = true;
    }
    if(success)
      new Event(x).stop();
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
      delete this.windows[qwebirc.ui.CUSTOM_CLIENT][w.identifier];
    }.bind(this));
    
    if(select)
      this.selectWindow(w);  

    return w;
  },
  addCustomWindow: function(windowName, class_, cssClass, options) {
    if(!$defined(options))
      options = {};
      
    if(this.customWindows[windowName]) {
      this.selectWindow(this.customWindows[windowName]);
      return;
    }
    
    var d = this.newCustomWindow(windowName, true);
    this.customWindows[windowName] = d;
    
    d.addEvent("close", function() {
      this.customWindows[windowName] = null;
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
    this.addCustomWindow("Embedding wizard", qwebirc.ui.EmbedWizard, "embeddedwizard", {baseURL: this.options.baseURL});
  },
  optionsWindow: function() {
    this.addCustomWindow("Options", qwebirc.ui.OptionsPane, "optionspane", this.uiOptions);
  },
  aboutWindow: function() {
    this.addCustomWindow("About", qwebirc.ui.AboutPane, "aboutpane", this.uiOptions);
  },
  privacyWindow: function() {
    this.addCustomWindow("Privacy policy", qwebirc.ui.PrivacyPolicyPane, "privacypolicypane", this.uiOptions);
  },
  feedbackWindow: function() {
    this.addCustomWindow("Feedback", qwebirc.ui.FeedbackPane, "feedbackpane", this.uiOptions);
  },
  faqWindow: function() {
    this.addCustomWindow("FAQ", qwebirc.ui.FAQPane, "faqpane", this.uiOptions);
  },
  urlDispatcher: function(name, window) {
    if(name == "embedded")
      return ["a", this.embeddedWindow.bind(this)];
      
    if(name == "options")
      return ["a", this.optionsWindow.bind(this)];

    /* doesn't really belong here */
    if(name == "whois") {
      return ["span", function(nick) {
        this.client.exec("/WHOIS " + nick);
      }.bind(window)];
    }

    return null;
  },
  tabComplete: function(element) {
    this.tabCompleter.tabComplete(element);
  },
  resetTabComplete: function() {
    this.tabCompleter.reset();
  },
  setModifiableStylesheet: function(name) {
    this.__styleSheet = new qwebirc.ui.style.ModifiableStylesheet("/css/" + name + qwebirc.FILE_SUFFIX + ".mcss");
    
    if($defined(this.options.hue)) {
      this.setModifiableStylesheetValues(this.options.hue, 0, 0);
    } else {
      this.setModifiableStylesheetValues(this.uiOptions.STYLE_HUE, 0, 0);
    }
  },
  setModifiableStylesheetValues: function(hue, saturation, lightness) {
    if(!$defined(this.__styleSheet))
      return;
    this.__styleSheet.set(function(x) {
      return x.setHue(hue).setSaturation(x.hsb[1] + saturation).setBrightness(x.hsb[2] + lightness);
    });
  }
});

qwebirc.ui.NotificationUI = new Class({
  Extends: qwebirc.ui.StandardUI,
  initialize: function(parentElement, windowClass, uiName, options) {
    this.parent(parentElement, windowClass, uiName, options);
    
    this.__beeper = new qwebirc.ui.Beeper(this.uiOptions);
    this.__flasher = new qwebirc.ui.Flasher(this.uiOptions);
    
    this.beep = this.__beeper.beep.bind(this.__beeper);
    
    this.flash = this.__flasher.flash.bind(this.__flasher);
    this.cancelFlash = this.__flasher.cancelFlash.bind(this.__flasher);
  },
  setBeepOnMention: function(value) {
    if(value)
      this.__beeper.soundInit();
  },
  updateTitle: function(text) {
    if(this.__flasher.updateTitle(text))
      this.parent(text);
  },
  focusChange: function(value) {
    this.parent(value);
    this.__flasher.focusChange(value);
  }
});

qwebirc.ui.NewLoginUI = new Class({
  Extends: qwebirc.ui.NotificationUI,
  loginBox: function(callbackfn, initialNickname, initialChannels, autoConnect, autoNick) {
    this.postInitialize();

    var w = this.newCustomWindow("Connect", true, qwebirc.ui.WINDOW_CONNECT);
    var callback = function(args) {
      w.close();
      callbackfn(args);
    };
    
    qwebirc.ui.GenericLoginBox(w.lines, callback, initialNickname, initialChannels, autoConnect, autoNick, this.options.networkName);
  }
});

qwebirc.ui.QuakeNetUI = new Class({
  Extends: qwebirc.ui.NewLoginUI,
  urlDispatcher: function(name, window) {
    if(name == "qwhois") {
      return ["span", function(auth) {
        this.client.exec("/MSG Q whois #" + auth);
      }.bind(window)];
    }
    return this.parent(name, window);
  },
  logout: function() {
    if(!qwebirc.auth.loggedin())
      return;
    if(confirm("Log out?")) {
      for(var client in this.clients) {
        this.clients[client].quit("Logged out");
      };
      
      /* HACK */
      var foo = function() { document.location = "/auth?logout=1"; };
      foo.delay(500);
    }
  }
});

qwebirc.ui.RootUI = qwebirc.ui.QuakeNetUI;
