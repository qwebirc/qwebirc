qwebirc.auth.loggedin = function() {
  var user = Cookie.read("user");
  var expiry = Cookie.read("ticketexpiry");
  if(expiry && new Date().getTime() > expiry - (5 * 60 * 1000))
    return;

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
