qwebirc.ui.PrivacyPolicyPane = new Class({
  Implements: [Events],
  initialize: function(parent) {
    parent.set("html", "<div class=\"loading\">Loading. . .</div>");
    var r = new Request.HTML({url: "privacypolicy.html", update: parent, onSuccess: function() {
      parent.getElement("input[class=close]").addEvent("click", function() {
        this.fireEvent("close");
      }.bind(this));
    }.bind(this)});
    r.get();
  }
});
