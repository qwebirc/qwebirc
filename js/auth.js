qwebirc.auth.loggedin = function(uiUsage) {
  if (typeof sessionStorage === "undefined") {
    return;
  }

  var ticket = sessionStorage.getItem("qticket");
  var user = sessionStorage.getItem("qticket_username");
  var expiry = sessionStorage.getItem("qticket_expiry");

  if (ticket === null) {
    return;
  }

  if (uiUsage) {
    if (Date.now() > expiry) {
      sessionStorage.removeItem("qticket");
      sessionStorage.removeItem("qticket_username");
      sessionStorage.removeItem("qticket_expiry");
      return;
    }
  } else {
    /* if our ticket expired after we've shown it to the user: send it anyway */
    /* we have a small grace period, and the server will tell the user if has really expired */
  }

  return [user, ticket];
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
