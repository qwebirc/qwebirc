function colourise(line, entity) {
  var fg;
  var bg;
  var underline = false;
  var bold = false;

  var out = [];
  var xline = line.split("");
  var element = document.createElement("span");

  function isnum(x) {
    return x >= '0' && x <= '9';
  }

  function parsecolours(xline, i) {
    if(!isnum(xline[i + 1])) {
      fg = undefined;
      bg = undefined;
      return i;
    }
    i++;
    if(isnum(xline[i + 1])) {
      fg = parseInt(xline[i] + xline[i + 1]);
      i++;
    } else {
      fg = parseInt(xline[i]);
    }
    if(xline[i + 1] != ",")
      return i;
    if(!isnum(xline[i + 2]))
      return i;
    i+=2;
    
    if(isnum(xline[i + 1])) {
      bg = parseInt(xline[i] + xline[i + 1]);
      i++;
    } else {
      bg = parseInt(xline[i]);
    }
    return i;
  }

  function ac() {
    if(out.length > 0) {
      element.appendChild(document.createTextNode(out.join("")));
      entity.appendChild(element);
      out = [];
    }
    element = document.createElement("span");
  }  
  function pc() {
    classes = []
    if(fg)
      classes.push("Xc" + fg);
    if(bg)
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
      ac();

      bold = !bold;
      pc();
    } else if(lc == "\x1F") {
      ac();

      underline = !underline;
      pc();
    } else if(lc == "\x0F") {
      ac();
      fg = undefined;
      bg = undefined;
      underline = false;
      bold = false;
    } else if(lc == "\x03") {
      ac();
      
      i = parsecolours(xline, i);
      if(bg > 15)
        bg = undefined;
      if(fg > 15)
        fg = undefined;
      pc();
    } else {
      out.push(lc);
    }
  }
  
  ac();
}