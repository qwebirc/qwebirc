qwebirc.util.crypto.getARC4Stream = function(key, length) {
  var s = [];

  var keyint = [];
  for(var i=0;i<key.length;i++)
    keyint.push(key.charCodeAt(i));

  for(var i=0;i<256;i++)
    s[i] = i;
  
  var j = 0;
  for(var i=0;i<256;i++) {
    j = (j + s[i] + keyint[i % key.length]) & 255;
    var w = s[i]; s[i] = s[j]; s[j] = w;
  }

  var output = [];
  var i = 0;
  var j = 0;
  for(var k=0;k<length;k++) {
    i = (i + 1) & 255;
    j = (j + s[i]) & 255;

    var w = s[i]; s[i] = s[j]; s[j] = w;
    output.push(s[(s[i] + s[j]) & 255]);
  }
  return output;
}

qwebirc.util.crypto.xorStreams = function(data, prngstream) {
  if(data.length != prngstream.length)
    return;

  var output = [];
  for(var i=0;i<data.length;i++)
    output.push(String.fromCharCode(data.charCodeAt(i) ^ prngstream[i]));

  return output.join("");
}

qwebirc.util.crypto.ARC4 = function(key, data) {
  var prngstream = qwebirc.util.crypto.getARC4Stream(key, data.length + 1024);
  /* burn first 1024 bytes */
  prngstream = prngstream.slice(1024);

  return qwebirc.util.crypto.xorStreams(data, prngstream);
}
