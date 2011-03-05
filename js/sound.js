qwebirc.sound.domReady = false;
window.addEvent("domready", function() {
  qwebirc.sound.domReady = true;
});

qwebirc.sound.SoundPlayer = new Class({
  Implements: [Events],
  initialize: function() {
    this.loadingSWF = false;
    this.loadedSWF = false;

    var sb = qwebirc.global.staticBaseURL;
    if(qwebirc.global.baseURL.substr(qwebirc.global.baseURL.length - 1, 1) == "/" && sb.substr(0, 1) == "/")
      sb = sb.substr(1)

    this.soundURL = qwebirc.global.baseURL + sb + "sound/";
  },
  go: function() {
    if(qwebirc.sound.domReady) {
      this.loadSoundManager();
    } else {
      window.addEvent("domready", function() {
        this.loadSoundManager();
      }.bind(this));
    }
  },
  loadSoundManager: function() {
    if(this.loadingSWF)
      return;
    this.loadingSWF = true;

    var debugMode = false;

    window.soundManager = new SoundManager();

    var sb = qwebirc.global.staticBaseURL;
    if(qwebirc.global.baseURL.substr(-1) == "/" && sb.substr(0, 1) == "/")
      sb = sb.substr(1)
    
    window.soundManager.url = this.soundURL;
    window.soundManager.debugMode = debugMode;
    window.soundManager.useConsole = debugMode;
    window.soundManager.onload = function() {
      this.loadedSWF = true;
      this.fireEvent("ready");
    }.bind(this);
    window.soundManager.beginDelayedInit();
  },
  createSound: function(name, src) {
    soundManager.createSound(name, src);
  },
  playSound: function(name) {
    soundManager.play(name);
  },
  beep: function() {
    if(!this.beepLoaded) {
      this.createSound("beep", this.soundURL + "beep3.mp3");
      this.beepLoaded = true;
    }
    this.playSound("beep");
  }
});
