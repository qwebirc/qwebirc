from twisted.web import resource, server, static
from twisted.mail.smtp import SMTPSenderFactory, ESMTPSenderFactory
from twisted.internet import defer, reactor
from StringIO import StringIO
import config

class FeedbackException(Exception):
  pass
  
class FeedbackEngine(resource.Resource):
  isLeaf = True
  
  def __init__(self, prefix):
    self.prefix = prefix

  def render_POST(self, request):
    text = request.args.get("feedback")
    if text is None:
      return "0"
    if len(text) > 50000:
      return "1"
      
    text = text[0]
    
    # basic checksum to stop really lame kiddies spamming, see feedback.js for js version
    checksum = 0;
    for x in text:
      checksum = ((checksum + 1) % 256) ^ ord(x);
    
    sentchecksum = request.args.get("c", [0])[0]
    
    email = StringIO()
    email.write("Subject: qwebirc feedback\r\n")
    email.write("\n")
    email.write(text)
    email.seek(0, 0)
    
    factorytype = SMTPSenderFactory
    factory = factorytype(fromEmail=config.FEEDBACK_FROM, toEmail=config.FEEDBACK_TO, file=email, deferred=defer.Deferred())
    reactor.connectTCP(config.FEEDBACK_SMTP_HOST, config.FEEDBACK_SMTP_PORT, factory)
    return "1"