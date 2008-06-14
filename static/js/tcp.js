function TCPConnection(nickname, parser) {
  var self = this;
  var dispatch = parser.dispatch;
  var counter = 0;
  var disconnected = false;
  
  this.send = function(data) {
    XHR("/e/p/" + self.sessionid + "?c=" + encodeURIComponent(data) + "&t=" + counter++, function(o) {
      if(o[0] == false)
        alert("An error occured: " + o[1]);
    });
  }

  this.recv = function() {
    if(self.disconnected)
      return;
      
    XHR("/e/s/" + self.sessionid + "?t=" + counter++, function(o) {
      if(o[0] == false) {
        alert("An error occured: " + o[1]);
        return;
      }
      forEach(o, function(x) {
        dispatch(x);
      });
      self.recv();
    });
  }

  this.connect = function() {
    XHR("/e/n?nick=" + encodeURIComponent(nickname) + "&r=" + Math.random() * 1024 * 1024, function(o) {
      if(o[0] == false) {
        alert("An error occured: " + o[1]);
        return;
      }
      self.sessionid = o[1];
      self.recv();    
    });
  }
  
  this.disconnect = function() {
    self.disconnected = true;
  }
}