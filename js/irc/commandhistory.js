qwebirc.irc.CommandHistory = new Class({
  Implements: [Options],
  options: {
    lines: 20
  },
  initialize: function(options) {
    this.setOptions(options);
    
    this.data = [];
    this.position = 0;
  },
  addLine: function(line, moveUp) {
    if((this.data.length == 0) || (line != this.data[0]))
      this.data.unshift(line);
      
    if(moveUp) {
      this.position = 0;
    } else {
      this.position = -1;
    }
    
    if(this.data.length > this.options.lines)
      this.data.pop();
  },
  upLine: function() {
    if(this.data.length == 0)
      return null;
      
    if(this.position >= this.data.length)
      return null;
      
    this.position = this.position + 1;
    
    return this.data[this.position];
  },
  downLine: function() {
    if(this.position == -1)
      return null;

    this.position = this.position - 1;

    if(this.position == -1)
      return null;
      
    return this.data[this.position];
  }
});
