qwebirc.ui.MochaUI = new Class({
  Extends: qwebirc.ui.RootUI,
  initialize: function(parentElement, theme, options) {
    this.parent(parentElement, qwebirc.ui.MochaUI.Window, "mochaui");
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
  }
});

qwebirc.ui.MochaUI.Window = new Class({
  Extends: qwebirc.ui.Window,
  
  initialize: function(parentObject, client, type, name, identifier) {
    this.parent(parentObject, client, type, name, identifier);

    this.lines = new Element("div", {styles: {overflow: "auto", "width": "90"}});

    var toolbar = (type != qwebirc.ui.WINDOW_CUSTOM) && (type != qwebirc.ui.WINDOW_CONNECT);
    
    if(toolbar) {
      this.form = new Element("form");
      this.inputbox = new Element("input", {styles: {border: 0, width: "100%"}});
      this.inputbox.addClass("input");
    
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
    }
    
    var prefs = {
      width: 800,
      height: 400,
      title: name,
      footerHeight: 0,
      container: $("pageWrapper"),
      toolbarHeight: parentObject.inputHeight,
      toolbarPosition: "bottom",
      toolbarContent: "",
      //toolbarURL: "",
      toolbarLoadMethod: "html",
      content: this.lines,
      minimized: true,
      addClass: "hidenewwin",
      onFocus: function() {
        parentObject.selectWindow(this);
      }.bind(this),
      onClose: function() {
        if(type == qwebirc.ui.WINDOW_CHANNEL)
          this.client.exec("/PART " + name);
        this.close();
      }.bind(this)
    };
    
    prefs.toolbar = toolbar;
    prefs.closable = type != qwebirc.ui.WINDOW_STATUS && type != qwebirc.ui.WINDOW_CONNECT;
    
    /* HACK */
/*    var oldIndexLevel = MochaUI.Windows.indexLevel;
    
    var focus = false;
    var oldfocus = MochaUI.focusWindow;
    if(!focus) {
      MochaUI.Windows.indexLevel = 0;
      MochaUI.focusWindow = null;
    }
  */  
    var nw = new MochaUI.Window(prefs);
    this.window = nw;
    
    /*if(!focus) {
      MochaUI.Windows.indexLevel = oldIndexLevel;
      MochaUI.focusWindow = oldfocus;
    }*/
    
    /* HACK */
    if(toolbar) {
      var toolbar = $(nw.options.id + "_toolbar");
      toolbar.appendChild(this.form);
    }
    this.titleText = $(nw.options.id + "_title");
    this.tabText = $(nw.options.id + "_dockTabText");
    
    /*alert(toolbar.parentNode.getStyle("background"));*/
    /*this.inputbox.setStyle("background", toolbar.parentNode.getStyle("background"));*/
    this.windowObject = nw;
    
    this.scroller = this.lines.parentNode.parentNode;
    
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

    qwebirc.ui.Colourise(topic, t);
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

    this.parent(type, line, colour, e, this.lines);
  },
  select: function() {
    this.parent();
    
    if(this.inputbox)
      this.inputbox.focus();
  },
  setHilighted: function(state) {
    this.parent(state);
    
    if(state) {
      this.titleText.setStyle("color", "#ff0000");
      this.tabText.setStyle("background-color", "#ff0000");
      this.tabText.setStyle("color", "#000000");
    } else {
      this.titleText.setStyle("color", null);
      this.tabText.setStyle("background-color", null);
      this.tabText.setStyle("color", null);
    }    
  },
  close: function() {
    this.parent();
    
    MochaUI.closeWindow(this.window.windowEl);
  },
});
