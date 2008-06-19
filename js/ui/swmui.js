var RootPanel;
var TabPanel;
var EntryPanel;
var MainPanel;
var NickList;
var Content;

window.addEvent("domready", function() {
  RootPanel = $("container");
  TabPanel = new Panel(RootPanel, "tabs");
  
  TabPanel.anchor = ANCHOR_TOP;
  MainPanel = new Panel(RootPanel, "main");
  
  EntryPanel = new Panel(RootPanel, "entry");
  EntryPanel.anchor = ANCHOR_BOTTOM;
  
  //EntryPanel.element.setHTML("<input/>");
  EntryPanel.element.setHTML("<input class=\"inputwidth\"/>");
  
  var iw = $$("input[class=inputwidth]");
  window.addEvent("resize", function() {
    var s = EntryPanel.element.getSize()["size"]["x"] - 4;
    iw.setStyle("width", s + "px");
  });
  //window.addEvent("domready", function() {
  
  Content = new Panel(MainPanel.element, "content");
  Content.element.setStyle("overflow", "auto");
  
  NickList = new Panel(MainPanel.element, "nicklist");
  NickList.anchor = ANCHOR_RIGHT;
  NickList.element.setStyle("overflow", "auto");
  
  for(var i=0;i<100;i++) {
    var e = new Element("div").setText("MOO");
    
    Content.element.appendChild(e);
  }
  
  for(var i=0;i<10;i++) {
    var e = new Element("div").setText("MOO");
    
    NickList.element.appendChild(e);
  }

  for(var i=0;i<5;i++) {
    var e = new Element("span").setText("MOO" + i);
    
    TabPanel.element.appendChild(e);
  }
  
  window.fireEvent("resize");
});