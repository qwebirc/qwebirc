qwebirc.auth.loggedin = function() {
  var user = Cookie.read("user");
  
  return user;
}

qwebirc.auth.enabled = function() {
  return true;
}

qwebirc.auth.quakeNetAuth = function() {
  return true;
}

qwebirc.auth.passAuth = function() {
  return false;
}

qwebirc.auth.bouncerAuth = function() {
  return false;
}
