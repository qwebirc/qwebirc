qwebirc.ui.WINDOW_STATUS = 1;
qwebirc.ui.WINDOW_QUERY = 2;
qwebirc.ui.WINDOW_CHANNEL = 3;
qwebirc.ui.WINDOW_CUSTOM = 4;
qwebirc.ui.WINDOW_CONNECT = 5;
qwebirc.ui.CUSTOM_CLIENT = "custom";

qwebirc.ui.BaseUI = new Class({
  Implements: [Events, Options],
  options: {
    appTitle: "QuakeNet Web IRC",
    singleWindow: true
  },
  initialize: function(parentElement, windowClass, uiName, options) {
    this.setOptions(options);
    
    this.windows = {};
    this.windows[qwebirc.ui.CUSTOM_CLIENT] = {};
    this.windowArray = [];
    this.windowClass = windowClass;
    this.parentElement = parentElement;
    this.parentElement.addClass("qwebirc");
    this.parentElement.addClass("qwebirc-" + uiName);
    this.firstClient = false;
    this.commandhistory = new qwebirc.irc.CommandHistory();
  },
  newClient: function(client) {
    client.hilightController = new qwebirc.ui.HilightController(client);
    
    this.windows[client] = {}
    var w = this.newWindow(client, qwebirc.ui.WINDOW_STATUS, "Status");
    this.selectWindow(w);
    if(!this.firstClient) {
      this.firstClient = true;
      w.addLine("", "qwebirc v" + qwebirc.VERSION);
      w.addLine("", "Copyright (C) 2008 Chris Porter. All rights reserved.");
      w.addLine("", "http://webchat.quakenet.org/");
      w.addLine("", "This is BETA quality software, please report bugs to slug@quakenet.org");
    }
    return w;
  },
  newWindow: function(client, type, name) {
    var identifier = name;
    if(type == qwebirc.ui.WINDOW_STATUS)
      identifier = "";
      
    var w = this.windows[client][identifier] = new this.windowClass(this, client, type, name, identifier);
    this.windowArray.push(w);
    
    return w;
  },
  getActiveWindow: function() {
    return this.active;
  },
  getActiveIRCWindow: function(client) {
    if(!this.active || this.active.type == qwebirc.ui.WINDOW_CUSTOM) {
      return this.windows[client][""];
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
    document.title = window.name + " - " + this.options.appTitle;
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
    delete this.windows[window.client][window.identifier];
  },
    /*
      this shouldn't be called by overriding classes!
      they should implement their own!
      some form of user input MUST be received before an
      IRC connection is made, else users are going to get
      tricked into getting themselves glined
    */
  loginBox: function(callback, initialNickname, initialChannels, autoConnect, autoNick) {
    qwebirc.ui.GenericLoginBox(this.parentElement, callback, initialNickname, initialChannels, autoConnect, autoNick);
  }
});

qwebirc.ui.StandardUI = new Class({
  Extends: qwebirc.ui.BaseUI,
  initialize: function(parentElement, windowClass, uiName, options) {
    this.parent(parentElement, windowClass, uiName, options);

    this.tabCompleter = new qwebirc.ui.TabCompleterFactory(this);
    this.uiOptions = new qwebirc.ui.DefaultOptionsClass();
    this.customWindows = {};
    
    window.addEvent("keydown", function(x) {
      if(!x.alt || x.control)
        return;
        
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
    }.bind(this));
  },
  newCustomWindow: function(name, select, type) {
    if(!type)
      type = qwebirc.ui.WINDOW_CUSTOM;
      
    var w = this.newWindow(qwebirc.ui.CUSTOM_CLIENT, type, name);
    w.addEvent("close", function(w) {
      delete this.windows[name];
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
      d.lines.addClass(cssClass);
      
    var ew = new class_(d.lines, options);
    ew.addEvent("close", function() {
      d.close();
    }.bind(this));
  },
  embeddedWindow: function() {
    this.addCustomWindow("Embedded Wizard", qwebirc.ui.EmbedWizard, "embeddedwizard");
  },
  optionsWindow: function() {
    this.addCustomWindow("Options", qwebirc.ui.OptionsPane, "optionspane", this.uiOptions);
  },
  urlDispatcher: function(name) {
    if(name == "embedded")
      return ["a", this.embeddedWindow.bind(this)];
      
    if(name == "options")
      return ["a", this.optionsWindow.bind(this)];

    return null;
  },
  tabComplete: function(element) {
    this.tabCompleter.tabComplete(element);
  },
  resetTabComplete: function() {
    this.tabCompleter.reset();
  }
});

qwebirc.ui.QuakeNetUI = new Class({
  Extends: qwebirc.ui.StandardUI,
  urlDispatcher: function(name, window) {
    if(name == "qwhois") {
      return ["span", function(auth) {
        this.client.exec("/MSG Q whois #" + auth);
      }.bind(window)];
    }
    if(name == "whois") {
      return ["span", function(nick) {
        this.client.exec("/WHOIS " + nick);
      }.bind(window)];
    }
    return this.parent(name);
  }
});

qwebirc.ui.NewLoginUI = new Class({
  Extends: qwebirc.ui.QuakeNetUI,
  loginBox: function(callbackfn, initialNickname, initialChannels, autoConnect, autoNick) {
    this.postInitialize();

    var w = this.newCustomWindow("Connect", true, qwebirc.ui.WINDOW_CONNECT);
    var callback = function(args) {
      w.close();
      callbackfn(args);
    };
    
    qwebirc.ui.GenericLoginBox(w.lines, callback, initialNickname, initialChannels, autoConnect, autoNick);
  }
});
