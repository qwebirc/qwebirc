qwebirc.ui.supportsFocus = function() {
  var ua = navigator.userAgent;
  if(!$defined(ua))
    return [true];
      
  if(Browser.Engine.ipod || ua.indexOf("Konqueror") != -1)
    return [false, false];

  return [true];
}

qwebirc.config.DEFAULT_OPTIONS = [
  [1, "BEEP_ON_MENTION", "Beep when nick mentioned or on query activity (requires Flash)", true, {
    enabled: function() {
      if(!$defined(Browser.Plugins.Flash) || Browser.Plugins.Flash.version < 8)
        return [false, false]; /* [disabled, default_value] */
      return [true];
    },
    get: function(value, ui) {
      if(ui.setBeepOnMention)
        ui.setBeepOnMention(value);
    }
  }],
  [7, "FLASH_ON_MENTION", "Flash titlebar when nick mentioned or on query activity", true, {
    enabled: qwebirc.ui.supportsFocus
  }],
  [2, "DEDICATED_MSG_WINDOW", "Send privmsgs to dedicated messages window", false],
  [4, "DEDICATED_NOTICE_WINDOW", "Send notices to dedicated message window", false],
  [3, "NICK_OV_STATUS", "Show status (@/+) before nicknames in nicklist", true],
  [5, "ACCEPT_SERVICE_INVITES", "Automatically join channels when invited by Q", true],
  [6, "USE_HIDDENHOST", "Hide your hostmask when authed to Q (+x)", true],
  [8, "LASTPOS_LINE", "Show a last position indicator for each window", true, {
    enabled: qwebirc.ui.supportsFocus
  }],
  [9, "NICK_COLOURS", "Automatically colour nicknames", false],
  [10, "HIDE_JOINPARTS", "Hide JOINS/PARTS/QUITS", false],
  [11, "STYLE_HUE", "Adjust user interface hue", function() {
    return {class_: qwebirc.config.HueOption, default_: 210};
  }, {
    get: function(value, ui) {
      ui.setModifiableStylesheetValues(value, 0, 0);
    }
  }]
];

qwebirc.config.DefaultOptions = null;

qwebirc.config.Input = new Class({
  initialize: function(parent, option, position, parentObject) {
    this.option = option;
    this.value = option.value;
    this.enabled = this.option.enabled;
    this.position = position;
    this.parentElement = parent;
    this.parentObject = parentObject;
    
    this.render();
  },
  createInput: function(type, parent, name, selected) {
    if(!$defined(parent))
      parent = this.parentElement;

    return qwebirc.util.createInput(type, parent, name, selected);
  },
  FE: function(element, parent) {
    var n = new Element(element);
    if(!$defined(parent))
      parent = this.parentElement;
      
    parent.appendChild(n);
    return n;
  },
  focus: function() {
    this.mainElement.focus();
  },
  render: function() {
    this.event("render", this.mainElement);
  },
  get: function(value) {
    this.event("get", [value, this.parentObject.optionObject.ui]);
    return value;
  },
  event: function(name, x) {
    if(!$defined(this.option.extras))
      return;
    var t = this.option.extras[name];
    if(!$defined(t))
      return;
      
    t.pass(x, this)();
  },
  cancel: function() {
  }
});

qwebirc.config.TextInput = new Class({
  Extends: qwebirc.config.Input,
  render: function() {
    var i = this.createInput("text");
    this.mainElement = i;
    
    i.value = this.value;
    i.disabled = !this.enabled;
    
    this.parent();
  },
  get: function() {
    return this.parent(this.mainElement.value);
  }
});

qwebirc.config.HueInput = new Class({
  Extends: qwebirc.config.Input,
  render: function() {
    var i = new Element("div");
    i.addClass("qwebirc-optionspane");
    i.addClass("hue-slider");
    this.parentElement.appendChild(i);
    
    var k = new Element("div");
    k.addClass("knob");
    if(Browser.Engine.trident) {
      k.setStyle("top", "0px");
      k.setStyle("background-color", "black");
    }
    
    i.appendChild(k);
    
    var slider = new Slider(i, k, {steps: 36, range: [0, 369], wheel: true});
    slider.set(this.value);
    this.startValue = this.value;
    
    slider.addEvent("change", function(step) {
      this.value = step;
      this.get();
    }.bind(this));
    this.mainElement = i;
    
    if(!this.enabled)
      slider.detach();
    
    this.parent();
  },
  get: function() {
    return this.parent(this.value);
  },
  cancel: function() {
    this.value = this.startValue;
    this.get();
  }
});

qwebirc.config.CheckInput = new Class({
  Extends: qwebirc.config.Input,
  render: function() {
    var i = this.createInput("checkbox");
    this.mainElement = i;
    
    i.checked = this.value;
    i.disabled = !this.enabled;

    this.parent();
  },
  get: function() {
    return this.parent(this.mainElement.checked);
  }
});

qwebirc.config.RadioInput = new Class({
  Extends: qwebirc.config.Input,
  render: function() {
    var value = this.option.options;
    
    this.elements = [];
     
    for(var i=0;i<value.length;i++) {
      var d = this.FE("div", this.parentObject);
      var e = this.createInput("radio", d, "options_radio" + this.position, i == this.option.position);
      this.elements.push(e);
      e.disabled = !this.enabled;
   
      if(i == 0)
        this.mainElement = e;
      
      d.appendChild(document.createTextNode(value[i][0]));
    };
    this.parent();
  },
  get: function() {
    for(var i=0;i<this.elements.length;i++) {
      var x = this.elements[i];
      if(x.checked) {
        this.option.position = i;
        return this.parent(this.option.options[i][1]);
      }
    }
  }
});

qwebirc.config.Option = new Class({
  initialize: function(optionId, prefix, label, default_, extras) {
    this.prefix = prefix;
    this.label = label;
    this.default_ = default_;
    this.optionId = optionId;
    this.extras = extras;
    
    if($defined(extras) && $defined(extras.enabled)) {
      var enabledResult = extras.enabled();
      this.enabled = enabledResult[0];
      
      if(!enabledResult[0] && enabledResult.length > 1)
        this.default_ = enabledResult[1];
    } else {
      this.enabled = true;
    }    
  },
  setSavedValue: function(x) {
    if(this.enabled)
      this.value = x;
  }
});

qwebirc.config.RadioOption = new Class({
  Extends: qwebirc.config.Option,
  Element: qwebirc.config.RadioInput,
  initialize: function(optionId, prefix, label, default_, extras, options) {
    this.options = options.map(function(x) {
      if(typeof(x) == "string")
        return [x, x];
      return x;
    });
    this.defaultposition = default_;

    this.parent(optionId, prefix, label, this.options[default_][1], extras);
  },
  setSavedValue: function(x) {
    for(var i=0;i<this.options.length;i++) {
      var y = this.options[i][1];
      if(x == y) {
        this.position = i;
        this.value = x;
        return;
      }
    }
    this.position = this.defaultposition;
    this.value = this.default_;
  }
});

qwebirc.config.TextOption = new Class({
  Extends: qwebirc.config.Option,
  Element: qwebirc.config.TextInput
});

qwebirc.config.CheckOption = new Class({
  Extends: qwebirc.config.Option,
  Element: qwebirc.config.CheckInput
});

qwebirc.config.HueOption = new Class({
  Extends: qwebirc.config.Option,
  Element: qwebirc.config.HueInput
});

qwebirc.ui.Options = new Class({
  initialize: function(ui) {
    if(!$defined(qwebirc.config.DefaultOptions))
      this.__configureDefaults();
    
    this.optionList = qwebirc.config.DefaultOptions.slice();
    this.optionHash = {}
    this.ui = ui;
    
    this._setup();
    this.optionList.forEach(function(x) {
      x.setSavedValue(this._get(x));
      this.optionHash[x.prefix] = x;
      this[x.prefix] = x.value;
    }.bind(this));
  },
  __configureDefaults: function() {
    qwebirc.config.DefaultOptions = qwebirc.config.DEFAULT_OPTIONS.map(function(x) {
      var optionId = x[0];
      var prefix = x[1];
      var label = x[2];
      var default_ = x[3];
      var moreextras = x[4];
      var extras = x[5];
      
      var stype = typeof(default_);
      if(stype == "number") {
        return new qwebirc.config.RadioOption(optionId, prefix, label, default_, moreextras, extra);
      } else {
        var type;
        if(stype == "boolean") {
          type = qwebirc.config.CheckOption;
        } else if(stype == "function") {
          var options = default_();
          type = options.class_;
          default_ = options.default_;
        } else {
          type = qwebirc.config.TextOption;
        }
        return new type(optionId, prefix, label, default_, moreextras);
      }
    });
  },
  setValue: function(option, value) {
    this.optionHash[option.prefix].value = value;
    this[option.prefix] = value;
  },
  getOptionList: function() {
    return this.optionList;
  },
  _get: function(x) {
    return x.default_;
  },
  _setup: function() {
  },
  flush: function() {
  }
});

qwebirc.ui.OptionsPane = new Class({
  Implements: [Events],
  initialize: function(parentElement, optionObject) {
    this.parentElement = parentElement;
    this.optionObject = optionObject;
    
    this.createElements();
  },
  createElements: function() {
    var FE = function(element, parent) {
      var n = new Element(element);
      parent.appendChild(n);
      return n;
    };
    
    var t = FE("table", this.parentElement);
    var tb = FE("tbody", t);
    
    this.boxList = [];
    
    var optList = this.optionObject.getOptionList();
    for(var i=0;i<optList.length;i++) {
      var x = optList[i];
      
      var row = FE("tr", tb);
      var cella = FE("td", row);
      cella.set("text", x.label + ":");

      var cellb = FE("td", row);
      this.boxList.push([x, new x.Element(cellb, x, i, this)]);

    }
    
    var r = FE("tr", tb);
    var cella = FE("td", r);
    var cellb = FE("td", r);
    var save = qwebirc.util.createInput("submit", cellb);
    save.value = "Save";
    
    save.addEvent("click", function() {
      this.save();
      this.fireEvent("close");
    }.bind(this));
    
    var cancel = qwebirc.util.createInput("submit", cellb);
    cancel.value = "Cancel";
    cancel.addEvent("click", function() {
      this.cancel();
      this.fireEvent("close");
    }.bind(this));
  },
  save: function() {
    this.boxList.forEach(function(x) {
      var option = x[0];
      var box = x[1];
      this.optionObject.setValue(option, box.get());
    }.bind(this));
    this.optionObject.flush();
  },
  cancel: function() {
    this.boxList.forEach(function(x) {
      x[1].cancel();
    }.bind(this));
  }
});

qwebirc.ui.CookieOptions = new Class({
  Extends: qwebirc.ui.Options,
  _setup: function() {
    this.__cookie = new Hash.Cookie("opt1", {duration: 3650, autoSave: false});
  },
  _get: function(x) {
    var v = this.__cookie.get(x.optionId);
    if(!$defined(v))
      return x.default_;
    
    return v;
  },
  flush: function() {
    this.__cookie.erase();
    this._setup();
    
    this.getOptionList().forEach(function(x) {
      this.__cookie.set(x.optionId, x.value);
    }.bind(this));
    this.__cookie.save();
  }
});

qwebirc.ui.DefaultOptionsClass = new Class({
  Extends: qwebirc.ui.CookieOptions
});
