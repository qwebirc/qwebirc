WINDOW_STATUS = 1;
WINDOW_QUERY = 2;
WINDOW_CHANNEL = 3;

var UIWindow = new Class({
  initialize: function(parentObject, client, type, name, identifier) {
    this.parentObject = parentObject;
    this.type = type;
    this.name = name;
    this.active = false;
    this.client = client;
    this.identifier = identifier;
  },
  updateNickList: function(nicks) {
  },
  updateTopic: function(topic)  {
  },
  close: function() {
    this.parentObject.__closed(this);
    this.fireEvent("close", this);
  },
  select: function() {
    this.active = true;
    this.parentObject.__setActiveWindow(this);
  },
  deselect: function() {
    this.active = false;
  },
  addLine: function(type, line, colour) {
  },
  errorMessage: function(message) {
    this.addLine("", message, "red");
  }
});
UIWindow.implement(new Events);

var UI = new Class({
  initialize: function(windowClass) {
    this.windows = {};
    this.windowArray = [];
    this.windowClass = windowClass;
  },
  newClient: function(client) {
    this.windows[client] = {}
    var w = this.newWindow(client, WINDOW_STATUS, "Status");
    this.selectWindow(w);
    
    return w;
  },
  newWindow: function(client, type, name) {
    var identifier = name;
    if(type == WINDOW_STATUS)
      identifier = "";
      
    w = this.windows[client][identifier] = new this.windowClass(this, client, type, name, identifier);
    this.windowArray.push(w);
    
    return w;
  },
  getActiveWindow: function() {
    return this.active;
  },
  __setActiveWindow: function(window) {
    this.active = window;
  },
  selectWindow: function(window) {
    if(this.active)
      this.active.deselect();
    window.select();  /* calls setActiveWindow */
  },
  __closed: function(window) {
    if(window.active) {
      this.active = undefined;
      if(this.windowArray.length > 1) {
        for(var i=0;i<this.windowArray.length;i++) {
          if(this.windowArray[i] != window)
            continue;

          if(i == 0) {
            this.selectWindow(this.windowArray[1]);
          } else {
            this.selectWindow(this.windowArray[i - 1]);
          }
          this.windowArray = this.windowArray.splice(i, 1);
          break;
        }
      }
    }
    
    delete this.windows[window.client][window.identifier];
  }
});
