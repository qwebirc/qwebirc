var QMochaUIWindow = new Class({
  Extends: UIWindow,
  
  initialize: function(parentObject, client, type, name) {
    this.parent(parentObject, client, type, name);

    this.lines = new Element("div", {styles: {overflow: "auto", "width": "90"}});

    this.form = new Element("form");
    this.inputbox = new Element("input", {styles: {border: 0, width: "100%"}});
    this.inputbox.addClass("input");
    this.scrolltimeout = null;
    
    this.inputbox.addEvent("focus", function() {
      /* TODO: bring to top */
      //alert(":O");
      //alert(this.windowObject.windowEl);
      //MochaUI.focusWindow.pass(this.windowObject.windowEl, this.windowObject);
      //this.windowObject.focusWindow();
      this.parentObject.selectWindow(this);
    }.bind(this));
    
    this.form.addEvent("submit", function(e) {
      new Event(e).stop();
    
      this.client.exec(this.inputbox.value);
      this.inputbox.value = "";
    }.bind(this));
    //this.container.appendChild(form);  
    this.form.appendChild(this.inputbox);
    
    var prefs = {
      width: 800,
      height: 400,
      title: name,
      footerHeight: 0,
      toolbar: true,
      container: $("pageWrapper"),
      toolbarHeight: parentObject.inputHeight,
      toolbarPosition: "bottom",
      toolbarContent: "",
      //toolbarURL: "",
      toolbarLoadMethod: "html",
      content: this.lines,
      onFocus: function() {
        parentObject.selectWindow(this);
      }.bind(this),
      onClose: function() {
        if(type == WINDOW_CHANNEL)
          this.client.exec("/PART " + name);
        if($defined(this.scrolltimeout)) {
          $clear(this.scrolltimeout);
          this.scrolltimeout = null;
        }
        this.close();
      }.bind(this)
    };
    
    if(type == WINDOW_STATUS)
      prefs.closable = false;
    
    var nw = new MochaUI.Window(prefs);
    /* HACK */
    var toolbar = $(nw.options.id + "_toolbar");
    /*alert(toolbar.parentNode.getStyle("background"));*/
    /*this.inputbox.setStyle("background", toolbar.parentNode.getStyle("background"));*/
    toolbar.appendChild(this.form);
    this.windowObject = nw;
    
    return;
/*    
    if(type == WINDOW_CHANNEL) {
      this.nicklist = new Element("div");
      this.nicklist.addClass("nicklist");
      
      this.outerContainer.appendChild(this.nicklist);
    }
    
    var innerContainer = new Element("div");
    innerContainer.addClass("innercontainer");
    this.outerContainer.appendChild(innerContainer);
    
    if(type == WINDOW_CHANNEL) {
      this.topic = new Element("div");
      this.topic.addClass("topic");
      innerContainer.appendChild(this.topic);
    }
    */
  },
  updateNickList: function(nicks) {
    this.parent(nicks);
    
    return;
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
    return;
    var t = this.topic;
    
    while(t.firstChild)
      t.removeChild(t.firstChild);

    Colourise(topic, t);
  },
  addLine: function(type, line, colour) {
    this.parent(type, line, colour);
    
    var e = new Element("div");

    if(colour) {
      e.setStyles({"background": colour});
    } else if(this.lastcolour) {
      e.addClass("linestyle1");
    } else {
      e.addClass("linestyle2");
    }
    
    if(type)
      line = this.parentObject.theme.message(type, line);
    
    Colourise(IRCTimestamp(new Date()) + " " + line, e);
    
    this.lastcolour = !this.lastcolour;

    this.__scrollbottom(false, e);    
    /*if(!this.active)
      this.lines.showLoadingIcon();
      */
  },
  __scrollbottom: function(timed, element) {
    var pe = this.lines.parentNode.parentNode;
    //alert(pe);
    var prev = pe.getScroll();
    var prevbottom = pe.getScrollSize().y;
    var prevsize = pe.getSize();
    
    /* scroll in bursts, else the browser gets really slow */
    if(!timed) {
      this.lines.appendChild(element);
      if(this.scrolltimeout || (prev.y + prevsize.y == prevbottom)) {
        if(this.scrolltimeout)
          $clear(this.scrolltimeout);
        this.scrolltimeout = this.__scrollbottom.delay(10, this, true);
      }
    } else {
      pe.scrollTo(prev.x, pe.getScrollSize().y);
      this.scrolltimeout = null;
    }
  },
  select: function() {
    this.parent();
    
    this.inputbox.focus();
  }
});

var QMochaUI = new Class({
  Extends: UI,
    initialize: function(parentElement, theme) {
    this.parent(parentElement, QMochaUIWindow, "mochaui");
    this.theme = theme;
    this.parentElement = parentElement;
    
    window.addEvent("domready", function() {
      /* determine input size */
      var l = new Element("input", {styles: {border: 0}});
      this.parentElement.appendChild(l);
      this.inputHeight = l.getSize().y;
      this.parentElement.removeChild(l);
      
      MochaUI.Desktop = new MochaUI.Desktop();
      MochaUI.Dock = new MochaUI.Dock({
        dockPosition: "top"
      });

      MochaUI.Modal = new MochaUI.Modal();
      MochaUI.options.useEffects = false;
    }.bind(this));
    
    window.addEvent("unload", function() {
      if(MochaUI)
        MochaUI.garbageCleanUp();
    });
  },
  postInitialize: function() {    
    return;
    this.tabs = new Element("div");
    this.tabs.addClass("tabbar");
    
    this.parentElement.appendChild(this.tabs);
    
    this.container = new Element("div");
    this.container.addClass("container");
    
    this.parentElement.appendChild(this.container);
  
    var form = new Element("form");
    var inputbox = new Element("input");
    inputbox.addClass("input");
  
    form.addEvent("submit", function(e) {
      new Event(e).stop();
    
      this.getActiveWindow().client.exec(inputbox.value);
      inputbox.value = "";
    }.bind(this));
    this.parentElement.appendChild(form);  
    form.appendChild(inputbox);
    inputbox.focus();
  },
  loginBox: function(callbackfn, intialNickname, initialChannels) {
    this.parent(function(options) {
      this.postInitialize();
      callbackfn(options);
    }.bind(this), intialNickname, initialChannels);
  }
});
