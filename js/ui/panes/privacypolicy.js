qwebirc.ui.PrivacyPolicyPane = new Class({
  Implements: [Events],
  initialize: function(parent) {
    var delayfn = function() { parent.set("html", "<div class=\"loading\">Loading. . .</div>"); };
    var cb = delayfn.delay(500);
    
    var r = new Request.HTML({url: "panes/privacypolicy.html", update: parent, onSuccess: function() {
      $clear(cb);
      
      parent.getElement("input[class=close]").addEvent("click", function() {
        this.fireEvent("close");
      }.bind(this));
    }.bind(this)});
    r.get();
  }
});
