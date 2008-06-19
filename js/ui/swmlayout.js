var SWM_ANCHOR_NONE =   0x00;
var SWM_ANCHOR_TOP =    0x01;
var SWM_ANCHOR_BOTTOM = 0x02;
var SWM_ANCHOR_LEFT =   0x04;
var SWM_ANCHOR_RIGHT =  0x08;

var SWMPanel = new Class({
  initialize: function(parent, id) {
    this.parent = parent;
    
    var element = new Element("div", {"id": id, "styles": { "position": "absolute" } });
    this.element = element;
    this.element.wmpanel = this;

    parent.addClass("wmelement");
    
    parent.appendChild(this.element);
    this.anchor = ANCHOR_NONE;
  },

  setHeight: function(height) {
    this.height = height;
  },
    
  setWidth: function(width) {
    this.width = width;
  }
});

window.addEvent("domready", function() {
  function reworkLayout(container) {
    function anchorFilter(x, anchor) {
      return x.filter(function(y) {
        if(y.anchor == anchor)
          return true;
      });
    }
    var x = container.getChildren().map(function(x) {
      return x.wmpanel
    });
    var top = anchorFilter(x, SWM_ANCHOR_TOP);
    var bottom = anchorFilter(x, SWM_ANCHOR_BOTTOM);
    var none = anchorFilter(x, SWM_ANCHOR_NONE);

    var left = anchorFilter(x, SWM_ANCHOR_LEFT);
    var right = anchorFilter(x, SWM_ANCHOR_RIGHT);
    
    var tpos = 0;
    for(var i=0;i<top.length;i++) {
      var obj = top[i].element;
      obj.setStyles({"top": tpos + "px", "left": "0px", "right": "0px"});
      tpos = tpos + obj.getSize()["size"]["y"];
    }
    
    var bpos = 0;
    for(var i=0;i<bottom.length;i++) {
      var obj = bottom[i].element;
      obj.setStyles({"bottom": bpos + "px", "left": "0px", "right": "0px"});
      bpos = bpos + obj.getSize()["size"]["y"];
    }
    
    var lpos = 0;
    for(var i=0;i<left.length;i++) {
      var obj = left[i].element;
      obj.setStyles({"left": lpos + "px", "top": tpos + "px", "bottom": bpos + "px"});
      lpos = lpos + obj.getSize()["size"]["x"];
    }

    var rpos = 0;
    for(var i=0;i<right.length;i++) {
      var obj = right[i].element;
      obj.setStyles({"right": rpos + "px", "top": tpos + "px", "bottom": bpos + "px"});
      rpos = rpos + obj.getSize()["size"]["x"];
    }

    for(var i=0;i<none.length;i++) {
      var obj = none[i].element;
      obj.setStyles({"left": lpos + "px", "right": rpos + "px", "top": tpos + "px", "bottom": bpos + "px"});
    }
  }
  
  window.addEvent("resize", function() {
    $$("div[class=wmelement]").forEach(reworklayout);
  });
});