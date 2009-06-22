qwebirc.auth.loggedin = function() {
  var user = Cookie.read("user");
  
  return user;
}

qwebirc.auth.enabled = function() {
  return false;
}

qwebirc.auth.quakeNetAuth = function() {
  return false;
}

qwebirc.auth.passAuth = function() {
  return true;
}

qwebirc.auth.bouncerAuth = function() {
  return false;
}
