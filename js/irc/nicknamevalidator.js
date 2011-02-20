qwebirc.irc.DummyNicknameValidator = new Class({
  validate: function(x) {
    return x;
  }
});

qwebirc.irc.NicknameValidator = new Class({
  initialize: function(options) {
    this.options = options;
  },
  validate: function(nick, permitDot) {
    var r = [];
    
    var max = Math.min(this.options.maxLen, nick.length);
    var exploded = nick.split("");
    for(var i=0;i<max;i++) {
      var c = exploded[i];
      
      var valid = i == 0 ? this.options.validFirstChar : this.options.validSubChars;
      if(valid.indexOf(c) != -1 || permitDot && c == ".") {
        r.push(c);
      } else {
        r.push("_"); /* yeah we assume this is valid... */
      }
    }

    while(r.length < this.options.minLen)
      r.push("_");  /* yeah we assume this is valid... */
    return r.join("");
  }
});
