function urlificate(element, text, execfn) {
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
      var more = matchfn(matched);
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

  var appendURL = function(text) {  
    var newtext = text.replace(punct_re, "");
    var punct = text.substring(newtext.length);
    
    var a = new Element("a");
    a.href = newtext;
    a.target = "new";
    a.appendChild(document.createTextNode(newtext));
    element.appendChild(a);
    
    return punct;
  };

  txtprocess(text, /\bhttp:\/\/[^ ]+/, function(text) {
    txtprocess(text, /\B#[^ ,]+/, appendText, appendChan);
  }, appendURL);
}
