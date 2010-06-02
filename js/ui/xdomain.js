qwebirc.xdomain.Poller = new Class({
  initialize: function(callback) {
    this._callback = callback;
    this._poll.periodical(100, this);
    this._lastValue = null;
    this._counter = -1;
  },
  _poll: function() {
    var value = window.location.href;
    if(value === null || value === undefined || value == this._lastValue)
      return;
    this._lastValue = value;
    var fragment = value.splitMax("#", 2)[1];

    if(fragment === undefined || fragment.substr(0, 6) != "qwmsg:")
      return;

    var components = fragment.substr(6).split(":", 3);
    var counter = parseInt(components[0]);
    if(counter <= this._counter)
      return;

    this._counter = counter;

    var len = parseInt(components[1]);
    var message = decodeURIComponent(components[2]);
    if(len != message.length)
      return;

    message = message.replaceAll("\000", "").replaceAll("\n", "").replaceAll("\r", "");
    this._callback(message);
  }
});
