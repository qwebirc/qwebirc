qwebirc.auth.loggedin = function() {
  var user = Cookie.read("user");
  
  return user;
}
qwebirc.auth.enabled = function() {
  return false;
}
