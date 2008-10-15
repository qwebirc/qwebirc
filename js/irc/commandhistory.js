var CommandHistory = new Class({
  Implements: [Options],
  options: {
    lines: 20
  },
  initialize: function(options) {
    this.setOptions(options);
    
    this.data = [];
    this.position = -1;
  },
  addLine: function(line) {
    this.data.unshift(line);
    this.position = -1;
    
    if(this.data.length > this.options.lines)
      this.data.pop();
  },
  prevLine: function() {
    if(this.position == 0)
      return null;
    this.position = this.position - 1;
    
    return this.data[this.position];
  },
  nextLine: function() {
    if(this.position >= this.data.length)
      return null;
    this.position = this.position + 1;
    
    return this.data[this.position];
  }
});
