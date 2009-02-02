qwebirc.sound.domReady = false;
window.addEvent("domready", function() {
  qwebirc.sound.domReady = true;
});

qwebirc.sound.SoundPlayer = new Class({
  Implements: [Events],
  initialize: function() {
    this.loadingSWF = false;
    this.loadedSWF = false;
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
    if(eval("typeof soundManager") != "undefined") {
      this.loadedSWF = true;
      this.fireEvent("ready");
      return;
    }
    
    var debugMode = false;
    qwebirc.util.importJS("/js/" + (debugMode?"soundmanager2":"soundmanager2-nodebug-jsmin") + ".js", "soundManager", function() {
      soundManager.url = "/sound/";
      
      soundManager.debugMode = debugMode;
      soundManager.useConsole = debugMode;
      soundManager.onload = function() {
        this.loadedSWF = true;
        this.fireEvent("ready");
      }.bind(this);
      soundManager.beginDelayedInit();
    }.bind(this));
  },
  createSound: function(name, src) {
    soundManager.createSound(name, src);
  },
  playSound: function(name) {
    soundManager.play(name);
  },
  beep: function() {
    if(!this.beepLoaded) {
      this.createSound("beep", "/sound/beep3.mp3");
      this.beepLoaded = true;
    }
    this.playSound("beep");
  }
});
