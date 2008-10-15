var UIWindow = new Class({
  Implements: [Events],
  initialize: function(parentObject, client, type, name, identifier) {
    this.parentObject = parentObject;
    this.type = type;
    this.name = name;
    this.active = false;
    this.client = client;
    this.identifier = identifier;
    this.hilighted = false;
    this.scrolltimer = null;
  },
  updateNickList: function(nicks) {
  },
  updateTopic: function(topic)  {
  },
  close: function() {
    if($defined(this.scrolltimer)) {
      $clear(this.scrolltimer);
      this.scrolltimer = null;
    }

    this.parentObject.__closed(this);
    this.fireEvent("close", this);
  },
  select: function() {
    this.active = true;
    this.parentObject.__setActiveWindow(this);
    if(this.hilighted)
      this.setHilighted(false);
  },
  deselect: function() {
    this.active = false;
  },
  addLine: function(type, line, colour, element, parent, scrollparent) {
    if(!this.active && !this.hilighted)
      this.setHilighted(true);
    
    if(type)
      line = this.parentObject.theme.message(type, line);
    
    Colourise(IRCTimestamp(new Date()) + " " + line, element);
    
    this.scrollAdd(element);
  },
  errorMessage: function(message) {
    this.addLine("", message, "red");
  },
  setHilighted: function(state) {
    this.hilighted = state;
  },
  scrollAdd: function(element) {
    var parent = this.lines;
    var scrollparent = parent;
    
    if($defined(this.scroller))
      scrollparent = this.scroller;
      
    var prev = parent.getScroll();
    var prevbottom = parent.getScrollSize().y;
    var prevsize = parent.getSize();
    
    /* scroll in bursts, else the browser gets really slow */
    if($defined(element)) {
      parent.appendChild(element);
      if(this.scrolltimer || (prev.y + prevsize.y == prevbottom)) {
        if(this.scrolltimer)
          $clear(this.scrolltimer);
        this.scrolltimer = this.scrollAdd.delay(50, this, [null, null]);
      }
    } else {
      scrollparent.scrollTo(prev.x, parent.getScrollSize().y);
      this.scrolltimer = null;
    }
  }
});
