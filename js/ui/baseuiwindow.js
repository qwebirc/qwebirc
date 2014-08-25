qwebirc.ui.HILIGHT_NONE = 0;
qwebirc.ui.HILIGHT_ACTIVITY = 1;
qwebirc.ui.HILIGHT_SPEECH = 2;
qwebirc.ui.HILIGHT_US = 3;

qwebirc.ui.MAXIMUM_LINES_PER_WINDOW = 1000;

qwebirc.ui.WINDOW_LASTLINE = qwebirc.ui.WINDOW_QUERY | qwebirc.ui.WINDOW_MESSAGES | qwebirc.ui.WINDOW_CHANNEL | qwebirc.ui.WINDOW_STATUS;

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
    this.scrollpos = null;
    this.lastNickHash = new QHash();
    this.lastSelected = null;
    this.subWindow = null;
    this.closed = false;
    
    if(this.type & qwebirc.ui.WINDOW_LASTLINE) {
      this.lastPositionLine = new Element("hr");
      this.lastPositionLine.addClass("lastpos");
      this.lastPositionLineInserted = false;
    }
  },
  updateTopic: function(topic, element)  {
    qwebirc.ui.Colourise(topic, element, this.client.exec, this.parentObject.urlDispatcher.bind(this.parentObject), this);
  },
  close: function() {
    this.closed = true;
    
    if($defined(this.scrolltimer)) {
      $clear(this.scrolltimer);
      this.scrolltimer = null;
    }

    this.parentObject.__closed(this);
    this.fireEvent("close", this);
  },
  subEvent: function(event) {
    if($defined(this.subWindow))
      this.subWindow.fireEvent(event);
  },
  setSubWindow: function(window) {
    this.subWindow = window;
  },
  select: function() {
    if(this.lastPositionLineInserted && !this.parentObject.uiOptions.LASTPOS_LINE) {
      this.lines.removeChild(this.lastPositionLine);
      this.lastPositionLineInserted = false;
    }
  
    this.active = true;
    this.parentObject.__setActiveWindow(this);
    if(this.hilighted)
      this.setHilighted(qwebirc.ui.HILIGHT_NONE);

    this.subEvent("select");      
    this.resetScrollPos();
    this.lastSelected = new Date();
  },
  deselect: function() {
    this.subEvent("deselect");
    
    this.setScrollPos();
    if($defined(this.scrolltimer)) {
      $clear(this.scrolltimer);
      this.scrolltimer = null;
    }

    if(this.type & qwebirc.ui.WINDOW_LASTLINE)
      this.replaceLastPositionLine();
    
    this.active = false;
  },
  resetScrollPos: function() {
    if(this.scrolleddown) {
      this.scrollToBottom();
    } else if($defined(this.scrollpos)) {
      this.getScrollParent().scrollTo(this.scrollpos.x, this.scrollpos.y);
    }
  },
  setScrollPos: function() {
    if(!this.parentObject.singleWindow) {
      this.scrolleddown = this.scrolledDown();
      this.scrollpos = this.lines.getScroll();
    }
  },
  addLine: function(type, line, colour, element) {
    var hilight = qwebirc.ui.HILIGHT_NONE;
    var lhilight = false;

    if(type) {
      hilight = qwebirc.ui.HILIGHT_ACTIVITY;

      if(type.match(/(NOTICE|ACTION|MSG)$/)) {
        var message = $defined(line) ? line["m"] : null;

        /* https://dl.dropboxusercontent.com/u/180911/notify.png */
        if(type.match(/^OUR/)) {
          if(type.match(/NOTICE$/)) {
            /* default */
          } else {
            hilight = qwebirc.ui.HILIGHT_SPEECH;
          }
        } else if(this.client.hilightController.match(message)) {
          hilight = qwebirc.ui.HILIGHT_US;
          lhilight = true;
        } else if(type.match(/NOTICE$/)) {
          /* default */
        } else if(this.type == qwebirc.ui.WINDOW_QUERY || this.type == qwebirc.ui.WINDOW_MESSAGES) {
          hilight = qwebirc.ui.HILIGHT_US;
        } else {
          hilight = qwebirc.ui.HILIGHT_SPEECH;
        }

        if(hilight == qwebirc.ui.HILIGHT_US) {
          var title = this.parentObject.theme.message("NOTIFY" + type + "TITLE", line, false);
          var body = this.parentObject.theme.message("NOTIFY" + type + "BODY", line, false);
          var selectMe = function() { this.parentObject.selectWindow(this); }.bind(this);

          this.parentObject.notify(title, body, selectMe);
        }
      }
    }

    if(!this.active && (hilight != qwebirc.ui.HILIGHT_NONE))
      this.setHilighted(hilight);

    if(type)
      line = this.parentObject.theme.message(type, line, lhilight);
    
    var tsE = document.createElement("span");
    tsE.className = "timestamp";
    tsE.appendChild(document.createTextNode(qwebirc.irc.IRCTimestamp(new Date()) + " "));
    element.appendChild(tsE);
    
    qwebirc.ui.Colourise(line, element, this.client.exec, this.parentObject.urlDispatcher.bind(this.parentObject), this);
    this.scrollAdd(element);
  },
  errorMessage: function(message) {
    this.addLine("", message, "warncolour");
  },
  infoMessage: function(type, message) {
    if(message === undefined) {
      this.addLine("", type, "infocolour");
    } else {
      this.addLine(type, message, "infocolour");
    }
  },
  setHilighted: function(state) {
    if(state == qwebirc.ui.HILIGHT_NONE || state >= this.hilighted)
      this.hilighted = state;
  },
  scrolledDown: function() {
    if(this.scrolltimer)
      return true;
      
    var parent = this.lines;

    var scrollPos = parent.getScroll().y;
    var linesHeight = parent.getScrollSize().y;
    var windowHeight = parent.clientHeight;

    /*
     * fixes an IE bug: the scrollheight is less than the actual height
     * when the div isn't full
     */
    if(linesHeight < windowHeight)
      linesHeight = windowHeight;

    return scrollPos + windowHeight >= linesHeight - 3; /* window of error */
  },
  getScrollParent: function() {
    var scrollparent = this.lines;

    if($defined(this.scroller))
      scrollparent = this.scroller;
    return scrollparent;
  },
  scrollToBottom: function() {
    if(this.type == qwebirc.ui.WINDOW_CUSTOM || this.type == qwebirc.ui.WINDOW_CONNECT)
      return;

    var parent = this.lines;
    var scrollparent = this.getScrollParent();
      
    scrollparent.scrollTo(parent.getScroll().x, parent.getScrollSize().y);
  },
  scrollAdd: function(element) {
    var parent = this.lines;
    
    /* scroll in bursts, else the browser gets really slow */
    if($defined(element)) {
      var sd = this.scrolledDown();
      parent.appendChild(element);
      if(parent.childNodes.length > qwebirc.ui.MAXIMUM_LINES_PER_WINDOW)
        parent.removeChild(parent.firstChild);

      if(sd && !this.scrollTimer)
        this.scrolltimer = this.scrollAdd.delay(50, this, [null]);
    } else {
      this.scrollToBottom();
      this.scrolltimer = null;
    }
  },
  updateNickList: function(nicks) {
    var nickHash = new QHash(), present = new QSet();
    var added = [];
    var lnh = this.lastNickHash;
    
    for(var i=0;i<nicks.length;i++)
      present.add(nicks[i]);

    lnh.each(function(k, v) {
      if(!present.contains(k))
        this.nickListRemove(k, v);
    }, this);

    for(var i=0;i<nicks.length;i++) {
      var n = nicks[i];
      var l = lnh.get(n);
      if(!l) {
        l = this.nickListAdd(n, i);
        if(!l)
          l = 1;
      }
      nickHash.put(n, l);
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
  },
  focusChange: function(newValue) {
    if(newValue == true || !(this.type & qwebirc.ui.WINDOW_LASTLINE))
      return;
    
    this.replaceLastPositionLine();
  },
  replaceLastPositionLine: function() {
    if(this.parentObject.uiOptions.LASTPOS_LINE) {
      if(!this.scrolledDown())
        return;

      if(!this.lastPositionLineInserted) {
        this.scrollAdd(this.lastPositionLine);
      } else if(this.lines.lastChild != this.lastPositionLine) {
        try {
          this.lines.removeChild(this.lastPositionLine);
        } catch(e) {
          /* IGNORE, /clear removes lastPositionLine from the dom without resetting it. */
        }
        this.scrollAdd(this.lastPositionLine);
      }
    } else {
      if(this.lastPositionLineInserted)
        this.lines.removeChild(this.lastPositionLine);
    }
    
    this.lastPositionLineInserted = this.parentObject.uiOptions.LASTPOS_LINE;
  },
  rename: function(name) {
  }
});
