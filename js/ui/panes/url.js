qwebirc.ui.URLPane = new Class({
  Implements: [Events],
  initialize: function(parent, options) {
    var element = new Element("iframe");
    element.style.width = "100%";
    element.style.height = "100%";
    element.src = options.url;
    parent.appendChild(element);
  }
});
