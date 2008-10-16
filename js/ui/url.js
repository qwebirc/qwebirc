var url_re = /https?:\/\/([-\w\.]+)+(:\d+)?(\/([\w/_\.]*(\?\S+)?)?)?/;
var chan_re = /\B#[^ ,]+/;

function txtprocess(text, regex, appendfn, matchfn) {
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
    
    text = after;
    appendfn(before);
    matchfn(matched);
  }
}

function urlificate(element, text, execfn) {
  function appendText(text) {
    chanficate(element, text, execfn);
  }
  function appendA(text) {
    var a = document.createElement("a");
    a.href = text;
    a.target = "new";
    a.appendChild(document.createTextNode(text));
    
    element.appendChild(a);
  }
  txtprocess(text, url_re, appendText, appendA);
}

function chanficate(element, text, execfn) {
  function appendText(text) {
    element.appendChild(document.createTextNode(text));  
  }
  function appendA(text) {
    var a = document.createElement("a");
    a.href = "#";
    a.addEvent("click", function(e) {
      new Event(e).stop();
      execfn("/JOIN " + text);
    });
    a.appendChild(document.createTextNode(text));
    
    element.appendChild(a);
  }
  txtprocess(text, chan_re, appendText, appendA);
}
