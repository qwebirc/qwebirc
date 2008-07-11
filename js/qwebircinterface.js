var QWebIRCInterface = new Class({
  Implements: [Options],
  options: {
    initialNickname: "qwebirc" + Math.ceil(Math.random() * 100000),
    initialChannels: "",
    searchURL: false,
    theme: undefined
  },
  initialize: function(element, ui, options) {
    this.setOptions(options);

    window.addEvent("domready", function() {
      var ui_ = new ui($(element), new Theme(this.options.theme));

      if(this.options.searchURL) {
        /* TODO: look at URI and detect nickname/channels... */
      }

      var details = ui_.loginBox(function(options) {
        var IRC = new IRCClient(options, ui_);
        IRC.connect();
        window.addEvent("beforeunload", function() {
          IRC.quit("Page closed");
        });
      }, this.options.initialNickname, this.options.initialChannels);
    }.bind(this));
  }
});
