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
  "CHANMSG": ["<$n> $m"],
  "PRIVMSG": ["<$n> $m"],
  "CHANNOTICE": ["-$n:$c- $m"],
  "PRIVNOTICE": ["-$n- $m"],
  "OURCHANMSG": ["<$n> $m"],
  "OURPRIVMSG": ["<$n> $m"],
  "OURTARGETEDMSG": ["*$t* $m"],
  "OURTARGETEDNOTICE": ["[notice($t)] $m"],
  "OURCHANNOTICE": ["-$n:$t- $m"],
  "OURPRIVNOTICE": ["-$n- $m"],
  "OURCHANACTION": [" * $n $m"],
  "OURPRIVACTION": [" * $n $m"],
  "CHANACTION": [" * $n $m"],
  "PRIVACTION": [" * $n $m"],
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
  "GENERICERROR": ["$m: $t", true]
};

qwebirc.ui.Theme = new Class({
  initialize: function(themeDict) {
    this.__theme = {};
    
    for(var k in qwebirc.ui.themes.Default)
      this.__theme[k] = qwebirc.ui.themes.Default[k];
  
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
  },
  __dollarSubstitute: function(x, h) {
    var msg = [];

    var n = x.split("");
    for(var i=0;i<n.length;i++) {
      var c = n[i];
      if(c == "$" && (i <= n.length - 1)) {
        var c2 = n[++i];

        var o = qwebirc.ui.themes.ThemeControlCodeMap[c2];
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
  message: function(type, data) {
    var msg = this.__theme[type];
    
    msg = this.__dollarSubstitute(msg, data);

    return msg;
  }
});
