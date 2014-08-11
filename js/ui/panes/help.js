qwebirc.ui.HelpPane = new Class({
  Implements: [Events],
  initialize: function(parent) {
    if(qwebirc.global.helpURL) {
      var element = new Element("iframe");
      element.style.width = "100%";
      element.style.height = "100%";
      element.src = qwebirc.global.helpURL;
      parent.appendChild(element);
    } else {
      parent.set("html", "<b>Sorry -- this network hasn't defined a help page!</b>");
    }
  }
});
