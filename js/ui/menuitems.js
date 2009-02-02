qwebirc.ui.MENU_ITEMS = [
  ["whois", function(nick) {
    this.client.exec("/WHOIS " + nick);
  }],
  ["query", function(nick) {
    this.client.exec("/QUERY " + nick);
  }],
  ["slap", function(nick) {
    this.client.exec("/ME slaps " + nick + " around a bit with a large fishbot");
  }]
];

qwebirc.ui.UI_COMMANDS = [
  ["Options", "options"],
  ["Add webchat to your site", "embedded"],
  ["Privacy policy", "privacy"],
  ["Feedback", "feedback"],
  ["Frequently asked questions", "faq"],
  ["About qwebirc", "about"]
];
