function Colourise(line, entity, execfn) {
  var fg;
  var bg;
  var underline = false;
  var bold = false;

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
    if(out.length > 0) {
      urlificate(element, out.join(""), execfn);
      entity.appendChild(element);
      out = [];
    }
    element = document.createElement("span");
  }  
  function emitStartToken() {
    classes = []
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
  
  for(i=0;i<xline.length;i++) {
    var lc = xline[i];
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