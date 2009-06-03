qwebirc.ui.menuitems = {fns: {}};

qwebirc.ui.menuitems.fns.always = function() {
  return true;
};

qwebirc.ui.menuitems.fns.is_opped = function() {
  var channel = this.name; /* window name */
  var myNick = this.client.nickname;
  
  var entry = this.client.tracker.getNickOnChannel(myNick, channel);
  if(!$defined(entry))
    return false; /* shouldn't happen */
   
  /* TODO: improve (halfops) */
  return entry.prefixes.indexOf("@") != -1;
};

/*
  [text, command_fn, visible_predicate]
  
  - text is the text shown to the user in the menu
  - command_fn is executed when they click
    (this will be the current window)
  - visible_predicate will be executed to determine whether or not to show the item
    (this will be the current window)
*/
qwebirc.ui.MENU_ITEMS = [
  ["whois", function(nick) {
    this.client.exec("/WHOIS " + nick);
  }, qwebirc.ui.menuitems.fns.always],
  ["query", function(nick) {
    this.client.exec("/QUERY " + nick);
  }, qwebirc.ui.menuitems.fns.always],
  ["slap", function(nick) {
    this.client.exec("/ME slaps " + nick + " around a bit with a large fishbot");
  }, qwebirc.ui.menuitems.fns.always],
  ["kick", function(nick) { /* TODO: disappear when we're deopped */
    this.client.exec("/KICK " + nick + " wibble");
  }, qwebirc.ui.menuitems.fns.is_opped]
];

qwebirc.ui.UI_COMMANDS = [
  ["Options", "options"],
  ["Add webchat to your site", "embedded"],
  ["Privacy policy", "privacy"],
  ["Feedback", "feedback"],
  ["Frequently asked questions", "faq"],
  ["About qwebirc", "about"]
];
