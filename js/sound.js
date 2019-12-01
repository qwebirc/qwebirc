qwebirc.sound.SoundPlayer = new Class({
  Implements: [Events],
  initialize: function() {
    var sb = qwebirc.global.staticBaseURL;
    if(qwebirc.global.baseURL.substr(qwebirc.global.baseURL.length - 1, 1) == "/" && sb.substr(0, 1) == "/")
      sb = sb.substr(1);

    this.sounds = {};
    this.soundURL = qwebirc.global.baseURL + sb + "sound/";
  },
  play: function(url) {
    try {
      var s = this.sounds[url];
      if (!s)
        s = this.sounds[url] = new Audio(this.soundURL + url);
      s.play();
    } catch(e) {
      /* we tried */
    }
  }
});
