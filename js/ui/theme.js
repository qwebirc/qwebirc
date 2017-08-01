qwebirc.ui.themes.ThemeControlCodeMap = {
  "C": "\x03",
  "B": "\x02",
  "U": "\x1F",
  "O": "\x0F",
  "{": "\x00",
  "}": "\x00",
  "[": "qwebirc://whois/",
  "]": "/",
  "$": "$"
};

qwebirc.ui.themes.Default = {
  "PREFIX": ["$C4==$O "],
  "SIGNON": ["Signed on!", true],
  "CONNECTING": ["Connecting to server, please wait...", true],
  "CONNECT": ["Logging in, please wait...", true],
  "CONNECTED": ["Connected and logged in -- ready to go!", true],
  "RAW": ["$m", true],
  "DISCONNECT": ["Disconnected from server: $m", true],
  "ERROR": ["ERROR: $m", true],
  "SERVERNOTICE": ["$m", true],
  "JOIN": ["${$N$} [$h] has joined $c", true],
  "OURJOIN": ["${$N$} [$h] has joined $c", true],
  "PART": ["${$N$} [$h] has left $c [$m]", true],
  "KICK": ["${$v$} was kicked from $c by ${$N$} [$m]", true],
  "MODE": ["mode/$c [$m] by ${$N$}", true],
  "QUIT": ["${$N$} [$h] has quit [$m]", true],
  "NICK": ["${$n$} has changed nick to ${$[$w$]$}", true],
  "TOPIC": ["${$N$} changed the topic of $c to: $m", true],
  "UMODE": ["Usermode change: $m", true],
  "INVITE": ["$N invites you to join $c", true],
  "HILIGHT": ["$C4"],
  "HILIGHTEND": ["$O"],
  "CHANMSG": ["<$C14$@$O${$($N$)$}> $m"],
  "PRIVMSG": ["<$($N$)> $m"],
  "CHANNOTICE": ["-${$($N$)$}:$c- $m"],
  "PRIVNOTICE": ["-$($N$)- $m"],
  "OURCHANMSG": ["<$C14$@$O$U$N$O> $m"],
  "OURPRIVMSG": ["<$U$N$O> $m"],
  "OURTARGETEDMSG": ["*$[$t$]* $m"],
  "OURTARGETEDNOTICE": ["[notice($[$t$])] $m"],
  "OURCHANNOTICE": ["-$N:$t- $m"],
  "OURPRIVNOTICE": ["-$N- $m"],
  "OURCHANACTION": [" * $U$N$O $m"],
  "OURPRIVACTION": [" * $U$N$O $m"],
  "CHANACTION": [" * ${$($N$)$} $m"],
  "PRIVACTION": [" * $($N$) $m"],
  "CHANCTCP": ["$N [$h] requested CTCP $x from $c: $m"],
  "PRIVCTCP": ["$N [$h] requested CTCP $x from $-: $m"],
  "CTCPREPLY": ["CTCP $x reply from $N: $m"],
  "OURCHANCTCP": ["[ctcp($t)] $x $m"],
  "OURPRIVCTCP": ["[ctcp($t)] $x $m"],
  "OURTARGETEDCTCP": ["[ctcp($t)] $x $m"],
  "WHOISUSER": ["$B$N$B [$h]", true],
  "WHOISREALNAME": [" realname : $m", true],
  "WHOISCHANNELS": [" channels : $m", true],
  "WHOISSERVER": [" server   : $x [$m]", true],
  "WHOISACCOUNT": [" account  : qwebirc://qwhois/$m", true],
  "WHOISIDLE": [" idle     : $x [connected: $m]", true],
  "WHOISAWAY": [" away     : $m", true],
  "WHOISOPER": ["          : $BIRC Operator$B", true],
  "WHOISOPERNAME": [" operedas : $m", true],
  "WHOISACTUALLY": [" realhost : $m [ip: $x]", true],
  "WHOISGENERICTEXT": ["          : $m", true],
  "WHOISEND": ["End of WHOIS", true],
  "AWAY": ["$N is away: $m", true],
  "GENERICERROR": ["$m: $t", true],
  "GENERICMESSAGE": ["$m", true],
  "WALLOPS": ["WALLOP $n: $t", true],
  "CHANNELCREATIONTIME": ["Channel $c was created at: $m", true],
  "CHANNELMODEIS": ["Channel modes on $c are: $m", true],
  "IGNORED": ["Ignored $n, to unignore type: /UNIGNORE $n", false],
  "UNIGNORED": ["Unignored $n.", false],
  "IGNOREHEADER": ["Ignore list:", false],
  "IGNOREENTRY": ["- $h", false],
  "IGNOREEMPTY": ["Ignore list is empty.", false],
  "SILENCE": ["Silenced: $h", false],

  "NOTIFYCHANMSGTITLE": ["Mentioned on $c:", false],
  "NOTIFYCHANMSGBODY": ["<$@$n> $m", false],
  "NOTIFYCHANACTIONTITLE": ["Mentioned on $c:", false],
  "NOTIFYCHANACTIONBODY": [" * $n $m", false],
  "NOTIFYPRIVMSGTITLE": ["Private message from $n:", false],
  "NOTIFYPRIVMSGBODY": ["$m", false],
  "NOTIFYPRIVACTIONTITLE": ["Private message from $n:", false],
  "NOTIFYPRIVACTIONBODY": [" * $n $m", false],
  "NOTIFYCHANNOTICETITLE": ["Mentioned on $c:", false],
  "NOTIFYCHANNOTICEBODY": ["-$n- $m", false],
  "NOTIFYPRIVNOTICETITLE": ["Private notice from $n:", false],
  "NOTIFYPRIVNOTICEBODY": ["$m", false]
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

    this.__ccmaph["("] = this.message("HILIGHT", {}, this.__ccmap);
    this.__ccmaph[")"] = this.message("HILIGHTEND", {}, this.__ccmap);
    this.__ccmaph["{"] = this.__ccmaph["}"] = "";
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
    
    if(data && data["n"])
      data["N"] = "qwebirc://whois/" + data.n + "/";
    return this.__dollarSubstitute(this.__theme[type], data, map);
  }
});
