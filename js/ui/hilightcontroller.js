qwebirc.ui.HilightController = new Class({
  initialize: function(parent) {
    this.parent = parent;
    this.regex = null;
    this.prevnick = null;
  },
  match: function(text) {
    var nick = this.parent.nickname;
    if(nick != this.prevnick)
      this.regex = new RegExp('\\b' + RegExp.escape(nick) + '\\b', "i");
      
    if(text.match(this.regex))
      return true;
    return false;
  }
});
