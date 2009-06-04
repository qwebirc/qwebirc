qwebirc.ui.UI_COMMANDS = [
  ["Options", "options"],
  ["Add webchat to your site", "embedded"],
  ["Privacy policy", "privacy"],
  ["Feedback", "feedback"],
  ["Frequently asked questions", "faq"],
  ["About qwebirc", "about"]
];

qwebirc.ui.MENU_ITEMS = function() {
  var isOpped = function(nick) {
    var channel = this.name; /* window name */
    var myNick = this.client.nickname;

    return this.client.nickOnChanHasPrefix(myNick, channel, "@");
  };

  var isVoiced = function(nick) {
    var channel = this.name;
    var myNick = this.client.nickname;

    return this.client.nickOnChanHasPrefix(myNick, channel, "+");
  };

  var targetOpped = function(nick) {
    var channel = this.name;
    return this.client.nickOnChanHasPrefix(nick, channel, "@");
  };

  var targetVoiced = function(nick) {
    var channel = this.name;
    return this.client.nickOnChanHasPrefix(nick, channel, "+");
  };

  var invert = qwebirc.util.invertFn, compose = qwebirc.util.composeAnd;
  
  var command = function(cmd) {
    return function(nick) { this.client.exec("/" + cmd + " " + nick); };
  };
  
  return [
    {
      text: "whois", 
      fn: command("whois"),
      predicate: true
    },
    {
      text: "query",
      fn: command("query"),
      predicate: true
    },
    {
      text: "slap",
      fn: function(nick) { this.client.exec("/ME slaps " + nick + " around a bit with a large fishbot"); },
      predicate: true
    },
    {
      text: "kick", /* TODO: disappear when we're deopped */
      fn: function(nick) { this.client.exec("/KICK " + nick + " wibble"); },
      predicate: isOpped
    },
    {
      text: "op",
      fn: command("op"),
      predicate: compose(isOpped, invert(targetOpped))
    },
    {
      text: "deop",
      fn: command("deop"),
      predicate: compose(isOpped, targetOpped)
    },
    {
      text: "voice",
      fn: command("voice"),
      predicate: compose(isOpped, invert(targetVoiced))
    },
    {
      text: "devoice",
      fn: command("devoice"),
      predicate: compose(isOpped, targetVoiced)
    }
  ];
}();
