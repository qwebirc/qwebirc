qwebirc.ui.urlificate = function(element, text, execfn, cmdfn, window) {
  var punct_re = /[[\)|\]]?(\.*|[\,;])$/;
  var addedText = [];
  
  var txtprocess = function(text, regex, appendfn, matchfn) {
    for(;;) {
      var index = text.search(regex);
      if(index == -1) {
       appendfn(text);
       break;
      }
      var match = text.match(regex);
      
      var before = text.substring(0, index);
      var matched = match[0];
      var after = text.substring(index + matched.length);
    
      appendfn(before);
      var more = matchfn(matched, appendfn);
      if(!more)
        more = "";
      text = more + after;
    }
  };
  
  var appendText = function(text) {
    addedText.push(text);
    qwebirc.util.NBSPCreate(text, element);
  };
  
  var appendChan = function(text) {
    var newtext = text.replace(punct_re, "");
    addedText.push(newtext);
    var punct = text.substring(newtext.length);

    var a = new Element("span");
    a.href = "#";
    a.addClass("hyperlink-channel");
    a.addEvent("click", function(e) {
      new Event(e).stop();
      execfn("/JOIN " + newtext);
    });
    a.appendChild(document.createTextNode(newtext));
    element.appendChild(a);
    
    return punct;
  };

  var appendURL = function(text, appendfn) {  
    var url = text.replace(punct_re, "");
    var punct = text.substring(url.length);
    
    var href = "";
    var fn = null;
    var target = "new";
    var disptext = url;
    var elementType = "a";
    var addClass;
    
    var ma = url.match(/^qwebirc:\/\/(.*)$/);
    if(ma) {
      var m = ma[1].match(/^([^\/]+)\/([^\/]+)\/?(.*)$/);
      if(!m) {
        appendfn(text);
        return; 
      }
      
      var cmd = cmdfn(m[1], window);
      if(cmd) {
        addClass = m[1];
        elementType = cmd[0];
        if(cmd[0] != "a") {
          url = null;
        } else {
          url = "#";
        }
        fn = cmd[1];
        disptext = unescape(m[2]);
        target = null;
      } else {
        appendfn(text);
        return;
      }
      if(m[3])
        punct = m[3] + punct;
    } else {
      if(url.match(/^www\./))
        url = "http://" + url;
    }
    
    var a = new Element(elementType);
    if(addClass)
      a.addClass("hyperlink-" + addClass);
      
    if(url) {
      a.href = url;
    
      if(target)
        a.target = target;
    }
    addedText.push(disptext);
    a.appendChild(document.createTextNode(disptext));
    
    element.appendChild(a);
    if($defined(fn))
      a.addEvent("click", function(e) { new Event(e).stop(); fn(disptext); });
    
    return punct;
  };

  txtprocess(text, /\b((https?|ftp|qwebirc):\/\/|www\.)[^ ]+/, function(text) {
    txtprocess(text, /\B#[^ ,]+/, appendText, appendChan);
  }, appendURL);
  
  return addedText.join("");
}
