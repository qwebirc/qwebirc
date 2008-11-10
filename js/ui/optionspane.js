qwebirc.config.CHECK_BOX = 1;
qwebirc.config.TEXT_BOX = 2;
qwebirc.config.RADIO_BUTTONS = 3;

qwebirc.config.DEFAULT_OPTIONS = [
  ["Beep on notification", true],
  ["Test", ["abc", "def", "ghi"]],
  ["Text", "abe"]
];

qwebirc.config.DefaultOptions = null;

qwebirc.config.Option = new Class({
  initialize: function(type, label, data, options) {
    this.type = type;
    this.label = label;
    this.data = data;
    this.options = options;
  }
});

qwebirc.ui.Options = new Class({
  initialize: function() {
    if(!$defined(qwebirc.config.DefaultOptions))
      this.__configureDefaults();
    
    this.options = [];
    qwebirc.config.DefaultOptions.forEach(function(x) {
      this.options.push([x, x.data]);
    }.bind(this));
  },
  __configureDefaults: function() {
    var d = [];    
    qwebirc.config.DEFAULT_OPTIONS.forEach(function(x) {
      var label = x[0];
      var options = x[1];
      var data = x[2];
      
      var stype = typeof(options);
      var type;
      
      if(stype == "boolean") {
        type = qwebirc.config.CHECK_BOX;
      } else if(stype == "object") {
        type = qwebirc.config.RADIO_BUTTONS;
      } else {
        type = qwebirc.config.TEXT_BOX;
      }
      
      d.push(new qwebirc.config.Option(type, label, options, data));
    });
    
    qwebirc.config.DefaultOptions = d;
  }
});

qwebirc.ui.OptionsPane = new Class({
  initialize: function(parentElement, options) {
    this.parentElement = parentElement;
    this.options = options;
    
    this.createElements();
  },
  createElements: function() {
    var FE = function(element, parent) {
      var n = new Element(element);
      parent.appendChild(n);
      return n;
    };
    var TE = function(text, parent) {
      var n = document.createTextNode(text);
      parent.appendChild(n);
      return n;
    };
    
    var t = FE("table", this.parentElement);
    var tb = FE("tbody", t);
    
    var i = 0;
    this.options.options.forEach(function(x) {
      i++;
      var row = FE("tr", tb);
      var cella = FE("td", row);
      var cellb = FE("td", row);
      
      var obj = x[0];
      var data = x[1];
      
      cella.set("text", obj.label);
      
      switch(obj.type) {
        case qwebirc.config.CHECK_BOX:
          var i = FE("input", cellb);
          i.type = "checkbox";
          i.checked = data;
          break;
        case qwebirc.config.TEXT_BOX:
          var i = FE("input", cellb);
          i.type = "text";
          i.value = data;
          
          break;
        case qwebirc.config.RADIO_BUTTONS:
          data.forEach(function(y) {
            var o = FE("div", cellb);
            
            var i = FE("input", o);
            i.type = "radio";
            i.value = "";
            i.name = "radio" + i;
            
            TE(y, o);
          });
          break;
      }
    }.bind(this));
  }
});
