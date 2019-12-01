qwebirc.ui.HilightController = new Class({
  initialize: function(parent) {
    this.parent = parent;
    this.regex = null;
    this.prevnick = null;
  },
  match: function(text) {
    var nick = this.parent.nickname;
    if(nick != this.prevnick) {
      var classes = '[\\s\\.,;:]';
      this.regex = new RegExp('(^|' + classes + ')' + RegExp.escape(nick) + '(' + classes + '|$)', "i");
    }
    if(text.match(this.regex))
      return true;
    return false;
  }
});

qwebirc.ui.Beeper = new Class({
  initialize: function(uiOptions) {
    this.uiOptions = uiOptions;

    this.soundPlayer = new qwebirc.sound.SoundPlayer();
  },
  beep: function(notification) {
    if(notification && !this.uiOptions.BEEP_ON_MENTION)
      return;
      
    this.soundPlayer.play("beep3.mp3");
  }
});

qwebirc.ui.Flasher = new Class({
  initialize: function(uiOptions) {
    this.uiOptions = uiOptions;
    
    this.windowFocused = false;
    this.canUpdateTitle = true;
    this.titleText = document.title;

    var favIcon = this._getFavIcon();
    if($defined(favIcon)) {
      this.favIcon = favIcon;
      this.favIconParent = favIcon.parentNode;
      this.favIconVisible = true;
      this.emptyFavIcon = new Element("link");
      this.emptyFavIcon.rel = "shortcut icon";
      this.emptyFavIcon.href = qwebirc.global.staticBaseURL + "images/empty_favicon.ico";
      this.emptyFavIcon.type = "image/x-icon";
      this.flashing = false;
    
      this.canFlash = true;
      document.addEvent("mousedown", this.cancelFlash.bind(this));
      document.addEvent("keydown", this.cancelFlash.bind(this));
    } else {
      this.canFlash = false;
    }
  },
  _getFavIcon: function() {
    var favIcons = $$("head link");
    for(var i=0;i<favIcons.length;i++)
      if(favIcons[i].getAttribute("rel") == "shortcut icon")
        return favIcons[i];
  },
  flash: function() {
    if(!this.uiOptions.FLASH_ON_MENTION || this.windowFocused || !this.canFlash || this.flashing)
      return;

    this.titleText = document.title; /* just in case */      
    var flashA = function() {
      this.hideFavIcon();
      this.canUpdateTitle = false;
      document.title = "Activity!";
      
      this.flasher = flashB.delay(500);
    }.bind(this);
    
    var flashB = function() {
      this.showFavIcon();
      this.canUpdateTitle = true;
      document.title = this.titleText;
      
      this.flasher = flashA.delay(500);
    }.bind(this);

    this.flashing = true;
    flashA();
  },
  cancelFlash: function() {
    if(!this.canFlash || !$defined(this.flasher))
      return;
      
    this.flashing = false;
    
    $clear(this.flasher);
    this.flasher = null;
    
    this.showFavIcon();
    document.title = this.titleText;
    this.canUpdateTitle = true;
  },
  hideFavIcon: function() {
    if(this.favIconVisible) {
      /* only seems to work in firefox */
      this.favIconVisible = false;
      this.favIconParent.removeChild(this.favIcon);
      this.favIconParent.appendChild(this.emptyFavIcon);
    }
  },
  showFavIcon: function() {
    if(!this.favIconVisible) {
      this.favIconVisible = true;
      this.favIconParent.removeChild(this.emptyFavIcon);
      this.favIconParent.appendChild(this.favIcon);
    }
  },
  updateTitle: function(text) {
    this.titleText = text;
    return this.canUpdateTitle;
  },
  focusChange: function(value) {
    this.windowFocused = value;

    if(value)
      this.cancelFlash();
  }
});

qwebirc.ui.Notifier = new Class({
  initialize: function(uiOptions) {
    this.uiOptions = uiOptions;

    this.windowFocused = false;
    this.previous = null;
    this.setEnabled(this.uiOptions.NOTIFICATIONS);
  },
  focusChange: function(value) {
    this.windowFocused = value;
  },
  setEnabled: function(value) {
    this.enabled = value;
    if(!value)
      return;

    if(this.isGranted())
      return;

    Notification.requestPermission(function (permission) {
      if (!("permission" in Notification))
        Notification.permission = permission;
    });
  },
  isGranted: function() {
    if(!("Notification" in window))
      return false;

    return Notification.permission === "granted";
  },
  notify: function(title, message, callback) {
    if(this.windowFocused && !this.enabled || !this.isGranted())
      return;

    if(this.previous)
      this.previous.close();

    var n = new Notification(title, {body: message, icon: qwebirc.global.staticBaseURL + "images/qwebircsmall.png"});
    var delay = function() {
      n.close();
      this.previous = null;
    }.bind(this).delay(5000);

    this.previous = n;
    if(callback) {
      n.addEventListener("click", function() {
        this.previous = null;
        window.focus();
        callback();
      });
      n.addEventListener("close", function() {
        this.previous = null;
      }.bind(this));
    }
  }
});
