from twisted.web import resource, server, static
from twisted.mail.smtp import SMTPSenderFactory, ESMTPSenderFactory
from twisted.internet import defer, reactor
from StringIO import StringIO
from email.mime.text import MIMEText
import qwebirc.util as util
import config

class FeedbackException(Exception):
  pass
  
class FeedbackEngine(resource.Resource):
  isLeaf = True
  
  def __init__(self, prefix):
    self.prefix = prefix
    self.__hit = util.HitCounter()
    
  @property
  def adminEngine(self):
    return dict(Sent=[(self.__hit,)])
    
  def render_POST(self, request):
    text = request.args.get("feedback")
    if text is None:
      raise FeedbackException("No text.")
    if len(text) > 50000:
      raise FeedbackException("Too much text.")
      
    text = text[0]
    
    # basic checksum to stop really lame kiddies spamming, see feedback.js for js version
    checksum = 0;
    text = text.decode("utf-8", "ignore")
    for x in text:
      checksum = ((checksum + 1) % 256) ^ (ord(x) % 256);
    
    sentchecksum = int(request.args.get("c", [0])[0])
    if checksum != sentchecksum:
      raise FeedbackException("Bad checksum: %d vs. %d" % (sentchecksum, checksum))
      
    msg = MIMEText(text.encode("utf-8"), _charset="utf-8")
    msg["Subject"] = "qwebirc feedback from %s" % (request.client[1])
    msg["From"] = config.FEEDBACK_FROM
    msg["To"] = config.FEEDBACK_TO
    email = StringIO(msg.as_string())
    email.seek(0, 0)
    
    factorytype = SMTPSenderFactory
    factory = factorytype(fromEmail=config.FEEDBACK_FROM, toEmail=config.FEEDBACK_TO, file=email, deferred=defer.Deferred())
    reactor.connectTCP(config.FEEDBACK_SMTP_HOST, config.FEEDBACK_SMTP_PORT, factory)
    self.__hit()
    return "1"