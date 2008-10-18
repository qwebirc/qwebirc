var WebmasterGuideStep = new Class({
  Implements: [Options, Events],
  options: {
    "title": "",
    "first": "",
    "hint": "",
    "middle": null,
    "premove": null,
    "example": ""
  },
  initialize: function(parent, options) {
    this.setOptions(options);
    this.parent = parent;
  },
  show: function() {
    this.parent.title.set("html", this.options.title);
    this.parent.firstRow.set("html", this.options.first);
    this.parent.hint.set("html", this.options.hint);
    this.parent.example.set("text", this.options.example);
    
    while(this.parent.middleRow.childNodes.length > 0)
      this.parent.middleRow.removeChild(this.parent.middleRow.childNodes[0]);
      
    if($defined(this.options.middle))
      this.parent.middleRow.appendChild(this.options.middle);
    
    this.fireEvent("show");
  }
});

var WebmasterGuide = new Class({
  Implements: [Options, Events],
  options: {
    parent: null,
    baseURL: "http://webchat.quakenet.org/"
  },
  initialize: function(options) {
    this.setOptions(options);
    this.create(options.parent);
    this.addSteps();
  },
  create: function(parent) {
    this.t = parent;

    var titleRow = this.newRow();
    this.title = new Element("h2");
    this.title.setStyle("margin-top", "0px");
    this.title.setStyle("margin-bottom", "5px");
    titleRow.appendChild(this.title);
    
    this.firstRow = this.newRow();
    this.middleRow = this.newRow();
    var hintRow = this.newRow();
    this.hint = new Element("div");
    this.hint.setStyle("font-size", "0.8em");
    this.hint.setStyle("font-style", "italic");
    hintRow.appendChild(this.hint);
    var exampleRow = this.newRow();
    this.example = new Element("pre");
    exampleRow.appendChild(this.example);
    
    var nextRow = this.newRow();
    nextRow.setStyle("position", "absolute");
    nextRow.setStyle("bottom", "0px");
    nextRow.setStyle("right", "0px");
    nextRow.setStyle("margin", "3px");
    var backBtn = new Element("input");
    backBtn.type = "submit";
    backBtn.value = "< Back";
    backBtn.addEvent("click", this.back.bind(this));
    nextRow.appendChild(backBtn);
    
    var nextBtn = new Element("input");
    nextBtn.type = "submit";
    nextBtn.value = "Next >";
    nextRow.appendChild(nextBtn);
    nextBtn.addEvent("click", this.next.bind(this));
    
    this.nextBtn = nextBtn;
    this.backBtn = backBtn;
  },
  newRow: function() {
    var cell = new Element("div");
    this.t.appendChild(cell);
    return cell;
  },
  newStep: function(options) {
    return new WebmasterGuideStep(this, options);
  },
  newRadio: function(parent, text, name, selected) {
    var p = new Element("div");
    parent.appendChild(p);
      
    var r = new Element("input");
    r.type = "radio";
    r.name = name;
    
    if(selected)
      r.checked = true;
      
    p.appendChild(r);
    p.appendChild(document.createTextNode(text));
      
    return r;
  },
  addSteps: function() {
    var af = function() { this.options.middle.focus(); };
  
    this.welcome = this.newStep({
      "title": "Welcome!",
      "first": "This wizard will help you create an embedded client by asking you questions then giving you the code to add to your website.<br/><br/>You can use the <b>Next</b> and <b>Back</b> buttons to navigate through the wizard; click <b>Next</b> to continue."
    });
    
    this.chanBox = new Element("input");
    this.chans = this.newStep({
      "title": "Set channels",
      "first": "Enter the channels you would like the client to join on startup:",
      "hint": "You can supply multiple channels by seperating them with a comma, e.g.:",
      "example": "#rogue,#eu-mage",
      middle: this.chanBox,
    }).addEvent("show", af);
    
    var customnickDiv = new Element("div");
    this.customnick = this.newStep({
      "title": "Nickname mode",
      "first": "At startup would you like the client to use a random nickname, a preset nickname or a nickname of the users choice?",
      "hint": "It is recommended that you only use a preset nickname if the client is for your own personal use.",
      middle: customnickDiv
    });

    this.randnick = this.newRadio(customnickDiv, "Use a random nickname, e.g. qwebirc12883.", "nick", true);
    this.choosenick = this.newRadio(customnickDiv, "Make the user choose a nickname.", "nick");
    this.presetnick = this.newRadio(customnickDiv, "Use a preset nickname of your choice.", "nick");
    
    var promptdiv = new Element("form");
    this.connectdialog = this.newStep({
      "title": "Display connect dialog?",
      "first": "Do you want the user to be shown the connect dialog (with the values you have supplied pre-entered) or just a connect confirmation?",
      middle: promptdiv,
      "hint": "You need to display the dialog if you want the user to be able to set their nickname before connecting.",
    });
    
    this.connectdialogr = this.newRadio(promptdiv, "Show the connect dialog.", "prompt", true);
    var autoconnect = this.newRadio(promptdiv, "Connect without displaying the dialog.", "prompt");
    
    this.nicknameBox = new Element("input");
    this.nickname = this.newStep({
      "title": "Set nickname",
      "first": "Enter the nickname you would like the client to use by default:",
      "premove": function() {
        if(this.nicknameBox.value == "") {
          alert("You must supply a nickname.");
          this.nicknameBox.focus();
          return false;
        }
        return true;
      }.bind(this),
      middle: this.nicknameBox
    }).addEvent("show", af);

    var codeDiv = new Element("div");
    this.finish = this.newStep({
      "title": "Finished!",
      "first": "Your custom link is:",
      middle: codeDiv
    }).addEvent("show", function() {
      var alink = new Element("a");
      var abox = new Element("input");
      var url = this.generateURL();
      
      alink.href = url;
      alink.appendChild(document.createTextNode(url));
      abox.value = "<iframe src=\"" + url + "\"></iframe>";
      
      var mBox = [
        alink,
        new Element("br"), new Element("br"),
        document.createTextNode("You can embed this into your page with the following code:"),
        new Element("br"),
        abox
      ];

      while(codeDiv.childNodes.length > 0)
        codeDiv.removeChild(codeDiv.childNodes[0]);
        
      mBox.forEach(function(x) {
        codeDiv.appendChild(x);
      });
    }.bind(this));

    this.updateSteps();
    this.step = 0;
    
    this.showStep();
  },
  updateSteps: function() {
    this.steps = [this.welcome, this.customnick];
    
    if(this.presetnick.checked)
      this.steps.push(this.nickname);
      
    this.steps.push(this.chans);
    if(!this.choosenick.checked)
      this.steps.push(this.connectdialog);
    
    this.steps.push(this.finish);
  },
  showStep: function() {
    this.backBtn.disabled = !(this.step > 0);
    
    this.nextBtn.value = (this.step >= this.steps.length - 1)?"Close":"Next >";
      
    this.steps[this.step].show();
  },
  next: function() {
    var pm = this.steps[this.step].options.premove;
    
    if(pm && !pm())
      return;
      
    this.updateSteps();
    if(this.step >= this.steps.length - 1) {
      this.close();
      return;
    }
    this.step = this.step + 1;
    this.showStep();
  },
  close: function() {
    this.fireEvent("close");
  },
  back: function() {
    if(this.step <= 0)
      return;

      this.step = this.step - 1;
    this.showStep();
  },
  generateURL: function() {
    var chans = this.chanBox.value;
    var nick = this.nicknameBox.value;
    var connectdialog = this.connectdialogr.checked || this.choosenick.checked;
    
    var URL = [];
    if(this.presetnick.checked) {
      URL.push("nick=" + escape(nick));
    } else if(this.choosenick.checked) {
      URL.push("nick=");
    }
    
    if(chans) {
      var d = chans.split(",");
      var d2 = [];
      
      /* WTB map */
      d.forEach(function(x) {
        if(x.charAt(0) == '#')
          x = x.substring(1);
          
        d2.push(x);
      });
      
      URL.push("channels=" + escape(d2.join(",")));
    }
    
    if(connectdialog)
      URL.push("prompt=1");

    return this.options.baseURL + "?" + URL.join("&");
  }
});
