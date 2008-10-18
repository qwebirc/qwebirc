qwebirc.ui.urlificate = function(element, text, execfn, cmdfn) {
  var punct_re = /(\.*|\,|;)$/;

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
    element.appendChild(document.createTextNode(text));  
  };
  
  var appendChan = function(text) {
    var newtext = text.replace(punct_re, "");
    var punct = text.substring(newtext.length);

    var a = new Element("a");
    a.href = "#";
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
    
    var ma = url.match(/^qwebirc:\/\/(.*)$/);
    if(ma) {
      var m = ma[1].match(/^([^\/]+)\/(.+)$/);
      if(!m) {
        appendfn(text);
        return; 
      }
      
      var cmd = cmdfn(m[1]);
      if(cmd) {
        url = "#";
        fn = cmd;
        disptext = unescape(m[2]);
        target = null;
      } else {
        appendfn(text);
        return;
      }
    } else {
      if(url.match(/^www\./))
        url = "http://" + url;
    }
    
    var a = new Element("a");
    a.href = url;
    
    if(target)
      a.target = target;
    a.appendChild(document.createTextNode(disptext));
    
    element.appendChild(a);
    if($defined(fn))
      a.addEvent("click", function(e) { new Event(e).stop(); fn(disptext); });
    
    return punct;
  };

  txtprocess(text, /\b((https?|ftp|qwebirc):\/\/|www\.)[^ ]+/, function(text) {
    txtprocess(text, /\B#[^ ,]+/, appendText, appendChan);
  }, appendURL);
}
