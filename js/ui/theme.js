qwebirc.ui.themes.ThemeControlCodeMap = {
  "C": "\x03",
  "B": "\x02",
  "U": "\x1F",
  "O": "\x0F",
  "$": "$"
};

qwebirc.ui.themes.Default = {
  "PREFIX": ["$C4==$O "],
  "SIGNON": ["Signed on!", true],
  "CONNECT": ["Connected to server.", true],
  "RAW": ["$m", true],
  "DISCONNECT": ["Disconnected from server: $m", true],
  "ERROR": ["ERROR: $m", true],
  "SERVERNOTICE": ["$m", true],
  "JOIN": ["$n [$h] has joined $c", true],
  "OURJOIN": ["$n [$h] has joined $c", true],
  "PART": ["$n [$h] has left $c [$m]", true],
  "KICK": ["$v was kicked from $c by $n [$m]", true],
  "MODE": ["mode/$c [$m] by $n", true],
  "QUIT": ["$n [$h] has quit [$m]", true],
  "NICK": ["$n has changed nick to $w", true],
  "TOPIC": ["$n changed the topic of $c to: $m", true],
  "UMODE": ["MODE $n $m", true],
  "INVITE": ["$n invites you to join $c", true],
  "HILIGHT": ["$C4"],
  "HILIGHTEND": ["$O"],
  "CHANMSG": ["<$z$n$Z> $m"],
  "PRIVMSG": ["<$z$n$Z> $m"],
  "CHANNOTICE": ["-$z$n$Z:$c- $m"],
  "PRIVNOTICE": ["-$z$n$Z- $m"],
  "OURCHANMSG": ["<$z$n$Z> $m"],
  "OURPRIVMSG": ["<$z$n$Z> $m"],
  "OURTARGETEDMSG": ["*$z$t$Z* $m"],
  "OURTARGETEDNOTICE": ["[notice($z$t$Z)] $m"],
  "OURCHANNOTICE": ["-$z$n$Z:$t- $m"],
  "OURPRIVNOTICE": ["-$z$n$Z- $m"],
  "OURCHANACTION": [" * $z$n$Z $m"],
  "OURPRIVACTION": [" * $z$n$Z $m"],
  "CHANACTION": [" * $z$n$Z $m"],
  "PRIVACTION": [" * $z$n$Z $m"],
  "CHANCTCP": ["$n [$h] requested CTCP $x from $c: $m"],
  "PRIVCTCP": ["$n [$h] requested CTCP $x from $-: $m"],
  "CTCPREPLY": ["CTCP $x reply from $n: $m"],
  "OURCHANCTCP": ["[ctcp($t)] $x $m"],
  "OURPRIVCTCP": ["[ctcp($t)] $x $m"],
  "OURTARGETEDCTCP": ["[ctcp($t)] $x $m"],
  "WHOISUSER": ["$B$n$B [$h]", true],
  "WHOISREALNAME": [" realname : $m", true],
  "WHOISCHANNELS": [" channels : $m", true],
  "WHOISSERVER": [" server   : $x [$m]", true],
  "WHOISACCOUNT": [" account  : qwebirc://qwhois/$m", true],
  "WHOISIDLE": [" idle     : $x [connected: $m]", true],
  "WHOISAWAY": [" away     : $m", true],
  "WHOISOPER": ["          : $BIRC Operator$B", true],
  "WHOISOPERNAME": [" operedas : $m", true],
  "WHOISACTUALLY": [" realhost : $m [ip: $x]", true],
  "WHOISEND": ["End of WHOIS", true],
  "AWAY": ["$n is away: $m", true],
  "GENERICERROR": ["$m: $t", true],
  "GENERICMESSAGE": ["$m", true]
};

qwebirc.ui.Theme = new Class({
  initialize: function(themeDict) {
    this.__theme = qwebirc.util.dictCopy(qwebirc.ui.themes.Default);
    
    if(themeDict)
      for(var k in themeDict)
        this.__theme[k] = themeDict[k];

    for(var k in this.__theme) {
      if(k == "PREFIX")
        continue;

      var data = this.__theme[k];
      if(data[1]) {
        this.__theme[k] = this.__theme["PREFIX"] + data[0];
      } else {
        this.__theme[k] = data[0];
      }
    }
    
    this.__ccmap = qwebirc.util.dictCopy(qwebirc.ui.themes.ThemeControlCodeMap);
    this.__ccmaph = qwebirc.util.dictCopy(this.__ccmap);
    
    this.__ccmap["z"] = "";
    this.__ccmap["Z"] = "";
    
    this.__ccmaph["z"] = this.message("HILIGHT", {}, this.__ccmap);
    this.__ccmaph["Z"] = this.message("HILIGHTEND", {}, this.__ccmap);
  },
  __dollarSubstitute: function(x, h, mapper) {
    var msg = [];

    var n = x.split("");
    for(var i=0;i<n.length;i++) {
      var c = n[i];
      if(c == "$" && (i <= n.length - 1)) {
        var c2 = n[++i];

        var o = mapper[c2];
        if(!o)
          o = h[c2];
        if(o)
          msg.push(o);
      } else {
        msg.push(c);
      }
    }
    
    return msg.join("");
  },
  message: function(type, data, hilight) {
    var map;
    if(hilight) {
      map = this.__ccmaph;
    } else {
      map = this.__ccmap;
    }
    return this.__dollarSubstitute(this.__theme[type], data, map);
  }
});
