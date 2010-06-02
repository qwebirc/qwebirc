/* example usage:
 *
 * var qwebirc = new QWebIRC(document.getElementById("myiframeid"));
 * function f() {
 *   qwebirc.say("hi there mr wibbles");
 * }
 */

var QWebIRC = function(element) {
  var counter = 0;
  var send = function(message) {
    element.src = element.src.split("#")[0] + "#qwmsg:" + counter++ + ":" + message.length + ":" + encodeURIComponent(message);
  };

  this.say = function(message) {
    send("CMD SAY " + message);
  };
};

