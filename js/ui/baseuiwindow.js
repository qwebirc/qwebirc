var UIWindow = new Class({
  Implements: [Events],
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

