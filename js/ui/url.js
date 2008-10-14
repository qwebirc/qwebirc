var url_re = /https?:\/\/([-\w\.]+)+(:\d+)?(\/([\w/_\.]*(\?\S+)?)?)?/;

function urlificate(element, text) {
  function appendText(text) {
    element.appendChild(document.createTextNode(text));  
  }
  function appendA(text) {
    var a = document.createElement("a");
    a.href = text;
    a.target = "new";
    a.appendChild(document.createTextNode(text));
    
    element.appendChild(a);
  }
  
  for(;;) {
    var index = text.search(url_re);
    if(index == -1) {
      appendText(text);
      break;
    }
    var match = text.match(url_re);
  
    before = text.substring(0, index);
    matched = match[0];
    after = text.substring(index + matched.length);
    text = after;
    appendText(before);
    appendA(matched, before);
  }
}
