qwebirc.ui.HILIGHT_NONE = 0;
qwebirc.ui.HILIGHT_ACTIVITY = 1;
qwebirc.ui.HILIGHT_SPEECH = 2;
qwebirc.ui.HILIGHT_US = 3;

qwebirc.ui.Window = new Class({
  Implements: [Events],
  initialize: function(parentObject, client, type, name, identifier) {
    this.parentObject = parentObject;
    this.type = type;
    this.name = name;
    this.active = false;
    this.client = client;
    this.identifier = identifier;
    this.hilighted = qwebirc.ui.HILIGHT_NONE;
    this.scrolltimer = null;
    this.commandhistory = this.parentObject.commandhistory;
    this.scrolleddown = true;
    this.lastNickHash = {};
    this.lastSelected = null;
  },
  updateNickList: function(nicks) {
  },
  updateTopic: function(topic, element)  {
    qwebirc.ui.Colourise("[" + topic + "]", element, this.client.exec, this.parentObject.urlDispatcher.bind(this.parentObject), this);
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
      this.setHilighted(qwebirc.ui.HILIGHT_NONE);
    if(this.scrolleddown)
      this.scrollToBottom();
    this.lastSelected = new Date();
  },
  deselect: function() {
    if(!this.parentObject.singleWindow)
      this.scrolleddown = this.scrolledDown();
    if($defined(this.scrolltimer)) {
      $clear(this.scrolltimer);
      this.scrolltimer = null;
    }

    this.active = false;
  },
  addLine: function(type, line, colour, element) {
    var hilight = qwebirc.ui.HILIGHT_NONE;
    var lhilight = false;
    
    if(type) {
      hilight = qwebirc.ui.HILIGHT_ACTIVITY;
      
      if(type.match(/(NOTICE|ACTION|MSG)$/)) {
        if(this.type == qwebirc.ui.WINDOW_QUERY) {
          hilight = qwebirc.ui.HILIGHT_US;
        }
        if(!type.match(/^OUR/) && this.client.hilightController.match(line["m"])) {
          lhilight = true;
          hilight = qwebirc.ui.HILIGHT_US;
        } else if(hilight != qwebirc.ui.HILIGHT_US) {
          hilight = qwebirc.ui.HILIGHT_SPEECH;
        }
      }
    }

    if(!this.active && (hilight != qwebirc.ui.HILIGHT_NONE))
      this.setHilighted(hilight);

    if(type)
      line = this.parentObject.theme.message(type, line, lhilight);
    
    qwebirc.ui.Colourise(qwebirc.irc.IRCTimestamp(new Date()) + " " + line, element, this.client.exec, this.parentObject.urlDispatcher.bind(this.parentObject), this);
    this.scrollAdd(element);
  },
  errorMessage: function(message) {
    this.addLine("", message, "red");
  },
  setHilighted: function(state) {
    if(state == qwebirc.ui.HILIGHT_NONE || state >= this.hilighted)
      this.hilighted = state;
  },
  scrolledDown: function() {
    if(this.scrolltimer)
      return true;
      
    var parent = this.lines;
    
    var prev = parent.getScroll();
    var prevbottom = parent.getScrollSize().y;
    var prevsize = parent.getSize();
    
    /* fixes an IE bug */
    if(prevbottom < prevsize.y)
      prevbottom = prevsize.y;
      
    return prev.y + prevsize.y == prevbottom;
  },
  scrollToBottom: function() {
    var parent = this.lines;
    var scrollparent = parent;

    if($defined(this.scroller))
      scrollparent = this.scroller;
      
    scrollparent.scrollTo(parent.getScroll().x, parent.getScrollSize().y);
  },
  scrollAdd: function(element) {
    var parent = this.lines;
    
    /* scroll in bursts, else the browser gets really slow */
    if($defined(element)) {
      var sd = this.scrolledDown();
      parent.appendChild(element);
      if(sd) {
        if(this.scrolltimer)
          $clear(this.scrolltimer);
        this.scrolltimer = this.scrollAdd.delay(50, this, [null]);
      }
    } else {
      this.scrollToBottom();
      this.scrolltimer = null;
    }
  },
  updateNickList: function(nicks) {
    var nickHash = {}, present = {};
    var added = [];
    var lnh = this.lastNickHash;
    
    for(var i=0;i<nicks.length;i++)
      present[nicks[i]] = 1;
    
    for(var k in lnh)
      if(!present[k])
        this.nickListRemove(k, lnh[k]);
        
    for(var i=0;i<nicks.length;i++) {
      var n = nicks[i];
      var l = lnh[n];
      if(!l) {
        l = this.nickListAdd(n, i);
        if(!l)
          l = 1;
      }
      nickHash[n] = l;
    }
    
    this.lastNickHash = nickHash;
  },
  nickListAdd: function(position, nick) {
  },
  nickListRemove: function(nick, stored) {
  },
  historyExec: function(line) {
    this.commandhistory.addLine(line);
    this.client.exec(line);
  }
});
