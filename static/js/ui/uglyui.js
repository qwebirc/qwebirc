var UglyUIWindow = new Class({
  Extends: UIWindow,
  
  initialize: function(parentObject, client, type, name) {
    this.parent(parentObject, client, type, name);
        
    this.outerContainer = new Element("div", { "styles": { "display": "none", "font-family": "Lucida Console" } });
    parentObject.container.appendChild(this.outerContainer);
    
    if(type == WINDOW_CHANNEL) {
      this.nicklist = new Element("div", {"styles": { "border-left": "1px solid black", "width": "125px", "float": "right", "height": "480px", "clear": "both", "overflow": "auto", "background": "white"} });
      this.outerContainer.appendChild(this.nicklist);
    }
    
    var innerContainer = new Element("div", {"styles": { "height": "480px" }});
    this.outerContainer.appendChild(innerContainer);
    
    if(type == WINDOW_CHANNEL) {
      this.topic = new Element("div", {"styles": { "background": "#fef", "height": "20px" } });
      innerContainer.appendChild(this.topic);
    }
    
    this.lines = new Element("div", {"styles": { "height": "460px", "overflow": "auto", "word-wrap": "break-word" }});
    innerContainer.appendChild(this.lines);
    
    this.tab = new Element("span", {"styles": { "border": "1px black solid", "padding": "2px", "cursor": "default", "margin-right": "2px", "background": "#eee", "clear": "both" } });
    this.tab.appendText(name);
    this.tab.addEvent("click", function() {
      parentObject.selectWindow(this);
    }.bind(this));

    parentObject.tabs.appendChild(this.tab);
    
    if(type != WINDOW_STATUS) {
      tabclose = new Element("span", {"styles": { "border": "1px black solid", "margin-left": "5px", "padding": "2px", "font-size": "0.5em" } });
      tabclose.addEvent("click", function(e) {
        new Event(e).stop();
        
        if(type == WINDOW_CHANNEL)
          this.client.dispatch("/PART " + name);

        this.close();
      }.bind(this));
      tabclose.set("text", "X");
      this.tab.appendChild(tabclose);
    }
  },
  updateNickList: function(nicks) {
    this.parent(nicks);
    
    var n = this.nicklist;
    while(n.firstChild)
      n.removeChild(n.firstChild);

    forEach(nicks, function(nick) {
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

    Colourise(topic, t);
  },
  select: function() {
    this.parent();
    
    this.outerContainer.setStyle("display", "block");
    this.tab.setStyle("background", "#dff");
    this.tab.setStyle("color", "");
  },
  deselect: function() {
    this.parent();
    
    this.outerContainer.setStyle("display", "none");
    this.tab.setStyle("background", "#eee");
  },
  close: function() {
    this.parent();
    
    this.parentObject.container.removeChild(this.outerContainer);
    this.parentObject.tabs.removeChild(this.tab);
  },
  addLine: function(type, line, colour) {
    this.parent(type, line, colour);
    
    var c;
    if(colour) {
      c = colour;
    } else if(this.lastcolour) {
      c = "#efefef";
    } else {
      c = "#eeffff";
    }
    
    var e = new Element("div", { "styles": { "background": c } });
    if(type)
      line = this.parentObject.theme.message(type, line);
    
    Colourise(IRCTimestamp(new Date()) + " " + line, e);
    
    this.lastcolour = !this.lastcolour;
    
    var prev = this.lines.getScroll();
    var prevbottom = this.lines.getScrollSize().y;
    var prevsize = this.lines.getSize();
    this.lines.appendChild(e);
    
    if(prev.y + prevsize.y == prevbottom)
      this.lines.scrollTo(prev.x, this.lines.getScrollSize().y);
      
    if(!this.active)
      this.tab.setStyle("color", "red");
  }
});

var UglyUI = new Class({
  Extends: UI,
  initialize: function(parentElement, theme) {
    this.parent(UglyUIWindow);
    
    this.parentElement = parentElement;
    this.theme = theme;
    
    this.tabs = new Element("div", {"styles": { "border": "1px solid black", "padding": "4px", "font-family": "Lucida Console" } });
    parentElement.appendChild(this.tabs);
    
    this.container = new Element("div", {"styles": { "border": "1px solid black", "margin": "2px 0px 0px 0px", "height": "480px" } });
    parentElement.appendChild(this.container);
  
    var form = new Element("form");
    var inputbox = new Element("input", {"styles": { "width": "400px", "border": "1px solid black", "margin": "2px 0px 0px 0px"} });
  
    form.addEvent("submit", function(e) {
      new Event(e).stop();
    
      this.getActiveWindow().client.dispatch(inputbox.value);
      inputbox.value = "";
    }.bind(this));
    parentElement.appendChild(form);  
    form.appendChild(inputbox);
    inputbox.focus();
  }
});