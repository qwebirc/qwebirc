var ThemeControlCodeMap = {
  "C": "\x03",
  "B": "\x02",
  "U": "\x1F",
  "O": "\x0F",
  "$": "$"
};

function Theme(values) {
  var theme = {};
  for(var k in DefaultTheme)
    theme[k] = DefaultTheme[k];
  
  if(values)
    for(var k in values)
      theme[k] = values[k];
      
  function preprocess(line, useprefix) {
    if(useprefix)
      return theme["PREFIX"] + line;
      
    return line;
  }
  
  for(var k in theme) {
    if(k == "PREFIX")
      continue;
    var data = theme[k];
    
    theme[k] = preprocess(data[0], data[1]);
  }
  
  var dollarReplace = function(x, h) {
    var msg = [];
    var n = x.split("");
    for(var i=0;i<n.length;i++) {
      var c = n[i];
      if(c == "$" && (i <= n.length - 1)) {
        var c2 = n[++i];

        var o = ThemeControlCodeMap[c2];
        if(!o)
          o = h[c2];
        if(o)
          msg.push(o);
      } else {
        msg.push(c);
      }
    }
    
    return msg.join("");
  }
  
  this.message = function(type, data) {
    var msg = theme[type];
    
    //msg = msg.replace("$C", "\x03").replace("$B", "\x02").replace("$U", "\x1F").replace("$O", "\x0F");
    msg = dollarReplace(msg, data);

    return msg;
  }
}
