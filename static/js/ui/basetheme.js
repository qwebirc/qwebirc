/* don't even attempt to use a $! */
var DefaultTheme = {
  "PREFIX": [
    "$C4==$O "
  ],
  "SIGNON": [
    "Signed on!",
    true
  ],
  "CONNECT": [
    "Connected to server.",
    true
  ],
  "RAW": [
    "$m",
    true
  ],
  "DISCONNECT": [
    "Disconnected from server.",
    true
  ],
  "ERROR": [
    "ERROR: $m",
    true
  ],
  "SERVERNOTICE": [
    "$m",
    true
  ],
  "JOIN": [
    "$n [$h] has joined $c",
    true
  ],
  "PART": [
    "$n [$h] has left $c [$m]",
    true
  ],
  "KICK": [
    "$v was kicked from $c by $n [$m]",
    true
  ],
  "MODE": [
    "mode/$c [$m] by $n",
    true
  ],
  "QUIT": [
    "$n [$h] has quit [$m]",
    true
  ],
  "NICK": [
    "$n has changed nick to $w",
    true
  ],
  "TOPIC": [
    "$n changed the topic of $c to: $m",
    true
  ],
  "UMODE": [
    "MODE $n $m",
    true
  ],
  "INVITE": [
    "$n invites you to join $c",
    true
  ],
  "CHANMSG": [
    "<$n> $m"
  ],
  "PRIVMSG": [
    "<$n> $m"
  ],
  "CHANNOTICE": [
    "-$n:$c- $m"
  ],
  "PRIVNOTICE": [
    "-$n- $m"
  ],
  "OURCHANMSG": [
    "<$n> $m"
  ],
  "OURPRIVMSG": [
    "<$n> $m"
  ],
  "OURTARGETEDMSG": [
    "*$t* $m"
  ],
  "OURTARGETEDNOTICE": [
    "[notice($t)] $m"
  ],
  "OURCHANNOTICE": [
    "-$n:$t- $m"
  ],
  "OURPRIVNOTICE": [
    "-$n- $m"
  ],
  "OURCHANACTION": [
    " * $n $m"
  ],
  "OURPRIVACTION": [
    " * $n $m"
  ],
  "CHANACTION": [
    " * $n $m"
  ],
  "PRIVACTION": [
    " * $n $m"
  ],
  "CHANCTCP": [
    "$n [$h] requested CTCP $x from $c: $m"
  ],
  "PRIVCTCP": [
    "$n [$h] requested CTCP $x from $-: $m"
  ],
  "CTCPREPLY": [
    "CTCP $x reply from $n: $m"
  ],
  "OURCHANCTCP": [
    "[ctcp($t)] $x $m"
  ],
  "OURPRIVCTCP": [
    "[ctcp($t)] $x $m"
  ],
  "OURTARGETEDCTCP": [
    "[ctcp($t)] $x $m"
  ]
}