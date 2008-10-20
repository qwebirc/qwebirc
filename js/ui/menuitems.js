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
