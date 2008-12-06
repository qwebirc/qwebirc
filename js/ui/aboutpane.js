qwebirc.ui.AboutPane = new Class({
  Implements: [Events],
  initialize: function(parent) {
    parent.set("html", " Loading. . .");
    var r = new Request.HTML({url: "about.html", update: parent, onSuccess: function() {
      parent.getElement("input[class=close]").addEvent("click", function() {
        this.fireEvent("close");
      }.bind(this));
      parent.getElement("div[class=version]").set("text", "v" + qwebirc.VERSION);
    }.bind(this)});
    r.send();
  }
});
