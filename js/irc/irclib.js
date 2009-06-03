qwebirc.irc.IRCLowerTable = [
/* x00-x07 */ '\x00', '\x01', '\x02', '\x03', '\x04', '\x05', '\x06', '\x07',
/* x08-x0f */ '\x08', '\x09', '\x0a', '\x0b', '\x0c', '\x0d', '\x0e', '\x0f',
/* x10-x17 */ '\x10', '\x11', '\x12', '\x13', '\x14', '\x15', '\x16', '\x17',
/* x18-x1f */ '\x18', '\x19', '\x1a', '\x1b', '\x1c', '\x1d', '\x1e', '\x1f',
/* ' '-x27 */    ' ',    '!',    '"',    '#',    '$',    '%',    '&', '\x27',
/* '('-'/' */    '(',    ')',    '*',    '+',    ',',    '-',    '.',    '/',
/* '0'-'7' */    '0',    '1',    '2',    '3',    '4',    '5',    '6',    '7',
/* '8'-'?' */    '8',    '9',    ':',    ';',    '<',    '=',    '>',    '?',
/* '@'-'G' */    '@',    'a',    'b',    'c',    'd',    'e',    'f',    'g',
/* 'H'-'O' */    'h',    'i',    'j',    'k',    'l',    'm',    'n',    'o',
/* 'P'-'W' */    'p',    'q',    'r',    's',    't',    'u',    'v',    'w',
/* 'X'-'_' */    'x',    'y',    'z',    '{',    '|',    '}',    '~',    '_',
/* '`'-'g' */    '`',    'a',    'b',    'c',    'd',    'e',    'f',    'g',
/* 'h'-'o' */    'h',    'i',    'j',    'k',    'l',    'm',    'n',    'o',
/* 'p'-'w' */    'p',    'q',    'r',    's',    't',    'u',    'v',    'w',
/* 'x'-x7f */    'x',    'y',    'z',    '{',    '|',    '}',    '~', '\x7f',
/* x80-x87 */ '\x80', '\x81', '\x82', '\x83', '\x84', '\x85', '\x86', '\x87',
/* x88-x8f */ '\x88', '\x89', '\x8a', '\x8b', '\x8c', '\x8d', '\x8e', '\x8f',
/* x90-x97 */ '\x90', '\x91', '\x92', '\x93', '\x94', '\x95', '\x96', '\x97',
/* x98-x9f */ '\x98', '\x99', '\x9a', '\x9b', '\x9c', '\x9d', '\x9e', '\x9f',
/* xa0-xa7 */ '\xa0', '\xa1', '\xa2', '\xa3', '\xa4', '\xa5', '\xa6', '\xa7',
/* xa8-xaf */ '\xa8', '\xa9', '\xaa', '\xab', '\xac', '\xad', '\xae', '\xaf',
/* xb0-xb7 */ '\xb0', '\xb1', '\xb2', '\xb3', '\xb4', '\xb5', '\xb6', '\xb7',
/* xb8-xbf */ '\xb8', '\xb9', '\xba', '\xbb', '\xbc', '\xbd', '\xbe', '\xbf',
/* xc0-xc7 */ '\xe0', '\xe1', '\xe2', '\xe3', '\xe4', '\xe5', '\xe6', '\xe7',
/* xc8-xcf */ '\xe8', '\xe9', '\xea', '\xeb', '\xec', '\xed', '\xee', '\xef',
/* xd0-xd7 */ '\xf0', '\xf1', '\xf2', '\xf3', '\xf4', '\xf5', '\xf6', '\xd7',
/* xd8-xdf */ '\xf8', '\xf9', '\xfa', '\xfb', '\xfc', '\xfd', '\xfe', '\xdf',
/* xe0-xe7 */ '\xe0', '\xe1', '\xe2', '\xe3', '\xe4', '\xe5', '\xe6', '\xe7',
/* xe8-xef */ '\xe8', '\xe9', '\xea', '\xeb', '\xec', '\xed', '\xee', '\xef',
/* xf0-xf7 */ '\xf0', '\xf1', '\xf2', '\xf3', '\xf4', '\xf5', '\xf6', '\xf7',
/* xf8-xff */ '\xf8', '\xf9', '\xfa', '\xfb', '\xfc', '\xfd', '\xfe', '\xff'
];

qwebirc.irc.RFC1459toIRCLower = function(x) {
  var p = [];
  for(var i=0;i<x.length;i++) {
    var l = x.charCodeAt(i);

    p.push(qwebirc.irc.IRCLowerTable[l]);
  }
    
  return p.join("");
}

qwebirc.irc.ASCIItoIRCLower = function(x) {
  return x.toLowerCase(); /* TODO: does unicode too.... */
}

String.prototype.hostToNick = function() {
  return this.split("!", 1)[0];
}

String.prototype.hostToHost = function() {
  return this.split("!", 2)[1];
}

qwebirc.irc.IRCTimestamp = function(d) {
  return "[" + qwebirc.util.pad(d.getHours()) + ":" + qwebirc.util.pad(d.getMinutes()) + "]";
}

qwebirc.irc.IRCDate = function(d) {
  var pad = qwebirc.util.pad;
  
  return qwebirc.util.DaysOfWeek[d.getDay()] + " " + qwebirc.util.MonthsOfYear[d.getMonth()] + " " + pad(d.getDate()) + " "  + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds()) + " " + d.getFullYear();
}

qwebirc.irc.toIRCCompletion = function(client, data) {
  return client.toIRCLower(data).replace(/[^\w]+/g, "");
}
