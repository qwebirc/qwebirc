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
    
    qwebirc.util.importJS("/js/soundmanager2.js", "SoundManager", function() {
      soundManager.url = "/sound/";
      
      /* Fixes Firefox z-index Flash bug */
      if(Browser.Engine.gecko)
        soundManager.useHighPerformance = false;
        
      soundManager.debugMode = false;
      soundManager.useConsole = false;
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
      this.createSound("beep", "/sound/beep.mp3");
      this.beepLoaded = true;
    }
    this.playSound("beep");
  }
});
