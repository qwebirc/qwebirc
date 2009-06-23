qwebirc.ui.Colourise = function(line, entity, execfn, cmdfn, window) {
  var fg;
  var bg;
  var underline = false;
  var bold = false;
  var autoNickColour = false;
  
  var out = [];
  var xline = line.split("");
  var element = document.createElement("span");

  entity.addClass("colourline");
  
  function isNum(x) {
    return x >= '0' && x <= '9';
  }

  function parseColours(xline, i) {
    if(!isNum(xline[i + 1])) {
      fg = undefined;
      bg = undefined;
      return i;
    }
    i++;
    if(isNum(xline[i + 1])) {
      fg = parseInt(xline[i] + xline[i + 1]);
      i++;
    } else {
      fg = parseInt(xline[i]);
    }
    if(xline[i + 1] != ",")
      return i;
    if(!isNum(xline[i + 2]))
      return i;
    i+=2;
    
    if(isNum(xline[i + 1])) {
      bg = parseInt(xline[i] + xline[i + 1]);
      i++;
    } else {
      bg = parseInt(xline[i]);
    }
    return i;
  }

  function emitEndToken() {
    var data = "";
    if(out.length > 0) {
      var data = qwebirc.ui.urlificate(element, out.join(""), execfn, cmdfn, window);
      entity.appendChild(element);
      out = [];
    }
    element = document.createElement("span");
    return data;
  }  
  
  function emitStartToken() {
    if(autoNickColour)
      return element;
      
    var classes = []
    if(fg != undefined)
      classes.push("Xc" + fg);
    if(bg != undefined)
      classes.push("Xbc" + bg);
    if(bold)
      classes.push("Xb");
    if(underline)
      classes.push("Xu");
    element.className = classes.join(" ");
  }
  
  var nickColouring = window.parentObject.uiOptions.NICK_COLOURS; /* HACK */
  var capturingNick = false;
  for(var i=0;i<xline.length;i++) {
    var lc = xline[i];

    if(nickColouring) {
      if(!capturingNick) {
        if(lc == "\x00") {
          capturingNick = true;
          emitEndToken();
          continue;
        }
      } else {
        if(lc != "\x00") {
          out.push(lc);
        } else {
          autoNickColour = true;
          var e = emitStartToken();
          var text = emitEndToken();
          
          var c = text.toHSBColour(window.client);
          if($defined(c))
            e.style.color = c.rgbToHex();
          capturingNick = autoNickColour = false;
        }
        continue;
      }
    } else if(lc == "\x00") {
      continue;
    }
    
    if(lc == "\x02") {
      emitEndToken();

      bold = !bold;
      
      emitStartToken();
    } else if(lc == "\x1F") {
      emitEndToken();

      underline = !underline;
      
      emitStartToken();
    } else if(lc == "\x0F") {
      emitEndToken();
      
      fg = undefined;
      bg = undefined;
      underline = false;
      bold = false;
    } else if(lc == "\x03") {
      emitEndToken();
      
      i = parseColours(xline, i);
      if(bg > 15)
        bg = undefined;
      if(fg > 15)
        fg = undefined;
        
      emitStartToken();
    } else {
      out.push(lc);
    }
  }
  
  emitEndToken();
}

String.prototype.toHSBColour = function(client) {
  var lower = client.toIRCLower(client.stripPrefix(this));
  if(lower == client.lowerNickname)
    return null;
    
  var hash = 0;
  for(var i=0;i<lower.length;i++)
    hash = 31 * hash + lower.charCodeAt(i);
  
  var hue = Math.abs(hash) % 360;

  return new Color([hue, 70, 60], "hsb");
}
