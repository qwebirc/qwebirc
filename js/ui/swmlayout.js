qwebirc.ui.SWMUI.SWM_ANCHOR_NONE =   0x00;
qwebirc.ui.SWMUI.SWM_ANCHOR_TOP =    0x01;
qwebirc.ui.SWMUI.SWM_ANCHOR_BOTTOM = 0x02;
qwebirc.ui.SWMUI.SWM_ANCHOR_LEFT =   0x04;
qwebirc.ui.SWMUI.SWM_ANCHOR_RIGHT =  0x08;

qwebirc.ui.SWMUI.Container = new Class({
  initialize: function(parentElement) {
    this.parentElement = parentElement;
  },
  getInnerSize: function() {
//    return {x: this.element.clientWidth, y: this.element.clientHeight};
    return this.element.getSize();
  },
  getOuterSize: function() {
    return this.element.getSize();
  },
  appendChild: function(element) {
    this.element.appendChild(element);
  },
  removeChild: function(element) {
    this.element.removeChild(element);
  },
  setStyle: function(style, value) {
    this.element.setStyle(setstyle, value);
  },
  removeAllChildren: function(element) {
    while(this.element.firstChild)
      this.removeChild(this.element.firstChild);
  },
  setSize: function(top, left, bottom, right) {
    var data = {};

    var outer = this.getOuterSize();
    var inner = this.getInnerSize();
    var p = this.parentElement.getInnerSize();

    if(top != undefined && bottom != undefined) {
      data.top = top;
      data.height = p.y - top - bottom;
    } else if(top == undefined) {
      data.bottom = bottom;
    } else { /* bottom == undefined */
      data.top = top;
    }

    if(left != undefined && right != undefined) {
      data.left = left;
      data.width = p.x - left - right;
    } else if(left == undefined) {
      data.right = right;
    } else { /* right == undefined */
      data.left = left;
    }

    if(data.height)
      data.height = data.height - (outer.y - inner.y);
    if(data.width)
      data.width = data.width - (outer.x - inner.x);

    var data2 = {};
    for(var k in data)
      data2[k] = data[k] + "px";

    this.element.setStyles(data2);
    this.rework();
  },
  rework: function() {
    var x = this.element.getChildren().map(function(x) {
      return x.wmpanel;
    });

    var anchorFilter = function(x, y) {
      return x.filter(function(z) {
        if(z && (z.anchor == y) && !z.hidden) {
          return true;
        }
      });
    }

    var top = anchorFilter(x, qwebirc.ui.SWMUI.SWM_ANCHOR_TOP);
    var bottom = anchorFilter(x, qwebirc.ui.SWMUI.SWM_ANCHOR_BOTTOM);
    var left = anchorFilter(x, qwebirc.ui.SWMUI.SWM_ANCHOR_LEFT);
    var right = anchorFilter(x, qwebirc.ui.SWMUI.SWM_ANCHOR_RIGHT);
    var none = anchorFilter(x, qwebirc.ui.SWMUI.SWM_ANCHOR_NONE);
    
    var x = this.getInnerSize();
    var y = this.getOuterSize();

    var tpos = 0;
    top.each(function(obj) {
      obj.setSize(tpos, 0, undefined, 0);
      tpos = tpos + obj.getOuterSize().y;
    });

    var bpos = 0;
    bottom.each(function(obj) {
      obj.setSize(undefined, 0, bpos, 0);
      bpos = bpos + obj.getOuterSize().y;
    });

    var lpos = 0;
    left.each(function(obj) {
      obj.setSize(tpos, lpos, bpos, undefined);
      lpos = lpos + obj.getOuterSize().x;
    });

    var rpos = 0;
    right.each(function(obj) {
      obj.setSize(tpos, undefined, bpos, rpos);
      rpos = rpos + obj.getOuterSize().x;
    });

    var bpos = 0;
    bottom.each(function(obj) {
      obj.setSize(undefined, 0, bpos, 0);
      bpos = bpos + obj.getOuterSize().y;
    });

    none.each(function(obj) {
      obj.setSize(tpos, lpos, bpos, rpos);
    });
  }
});

qwebirc.ui.SWMUI.Frame = new Class({
  Extends: qwebirc.ui.SWMUI.Container,
  initialize: function(parentElement) {
    this.parent(this);

    this.element = new Element("div", {"styles": {
      "position": "relative",
      "top": "0px",
      "left": "0px",
      "height": "100%",
      "width": "100%"
    }}); 
    this.element.wmpanel = this;

    parentElement.appendChild(this.element);
    this.element.addClass("swmelement");
  }
});

qwebirc.ui.SWMUI.Panel = new Class({
  Extends: qwebirc.ui.SWMUI.Container,
  initialize: function(parentPanel, hidden) {
    this.parent(parentPanel);
    this.element = new Element("div", {"styles": {
      "position": "absolute"
    }}); 
    this.element.wmpanel = this;

    if(hidden) {
      this.setHidden(true);
    } else {
      this.hidden = false;
    }
    
    parentPanel.element.appendChild(this.element);
    this.anchor = qwebirc.ui.SWMUI.SWM_ANCHOR_NONE;
  },
  setHeight: function(height) {
    this.height = height;
  },
  setWidth: function(width) {
    this.width = width;
  },
  setHidden: function(value) {
    this.hidden = value;
    if(value) {
      this.element.setStyle("display", "none");
    } else {
      this.element.setStyle("display", "block");
    }
  },
  addClass: function(class_) {
    this.element.addClass(class_);
  },
  getScrollSize: function() {
    return this.element.getScrollSize();
  }
});

window.addEvent("domready", function() {
  window.addEvent("resize", function() {
    $$("div.swmelement").each(function(x) {
      x.wmpanel.rework();
    });
  });
});
