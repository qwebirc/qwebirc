#!/usr/bin/env python3
# this entire thing is a hack and badly needs reimplementing
import bin.configcheck
import bin.compile
import sys
bin.compile.vcheck()

DEFAULT_PORT = 9090

from optparse import OptionParser
import sys, os, config

def run_twistd(args1=None, args2=None):
  from twisted.scripts.twistd import run
  args = [sys.argv[0]]
  if args1 is not None:
    args.extend(args1)
  args.append("qwebirc")
  if args2 is not None:
    args.extend(args2)
  sys.argv = args
  run()
  
def help_reactors(*args):
  run_twistd(["--help-reactors"])
  sys.exit(1)

try:
  from select import epoll
  DEFAULT_REACTOR = "epoll"
except ImportError:
  try:
    from select import kqueue
    DEFAULT_REACTOR = "kqueue"
  except ImportError:
    try:
      from select import poll
      DEFAULT_REACTOR = "poll"
    except ImportError:
      DEFAULT_REACTOR = "select"

parser = OptionParser()
parser.add_option("-n", "--no-daemon", help="Don't run in the background.", action="store_false", dest="daemonise", default=True)
parser.add_option("--help-reactors", help="Display a list of reactor names.", action="callback", callback=help_reactors)
parser.add_option("-b", "--debug", help="Run in the Python Debugger.", action="store_true", dest="debug", default=False)
parser.add_option("-t", "--tracebacks", help="Display tracebacks in error pages (this reveals a LOT of information, do NOT use in production!)", action="store_true", dest="tracebacks", default=False)
parser.add_option("-r", "--reactor", help="Which reactor to use (see --help-reactors for a list).", dest="reactor", default=DEFAULT_REACTOR)
parser.add_option("-p", "--port", help="Port to start the server on.", type="int", dest="port", default=DEFAULT_PORT)
parser.add_option("-i", "--ip", help="IP address to listen on.", dest="ip", default="0.0.0.0")
parser.add_option("-l", "--logfile", help="Path to twisted log file.", dest="logfile")
parser.add_option("-c", "--clf", help="Path to web CLF (Combined Log Format) log file.", dest="clogfile")
parser.add_option("-C", "--certificate", help="Path to SSL certificate.", dest="sslcertificate")
parser.add_option("-k", "--key", help="Path to SSL key.", dest="sslkey")
parser.add_option("-H", "--certificate-chain", help="Path to SSL certificate chain file.", dest="sslchain")
parser.add_option("-P", "--pidfile", help="Path to store PID file", dest="pidfile")
parser.add_option("-s", "--syslog", help="Log to syslog", action="store_true", dest="syslog", default=False)
parser.add_option("--profile", help="Run in profile mode, dumping results to this file", dest="profile")
parser.add_option("--profiler", help="Name of profiler to use", dest="profiler")
parser.add_option("--syslog-prefix", help="Syslog prefix", dest="syslog_prefix", default="qwebirc")

sargs = sys.argv[1:]
if "ARGS" in dir(config):
  import shlex
  sargs = shlex.split(config.ARGS) + sargs

(options, args) = parser.parse_args(args=sargs)

args1, args2 = [], []

if not options.daemonise:
  args1.append("-n")
if options.debug:
  args1.append("-b")

if options.reactor != DEFAULT_REACTOR:
  rn = options.reactor + "reactor"
  getattr(__import__("twisted.internet", fromlist=[rn]), rn).install()
if options.logfile:
  args1+=["--logfile", options.logfile]
if options.pidfile:
  args1+=["--pidfile", options.pidfile]
if options.syslog:
  args1+=["--syslog"]
if options.profile:
  args1+=["--profile", options.profile]
if options.profiler:
  args1+=["--profiler", options.profiler]

if options.syslog and options.syslog_prefix:
  import syslog
  syslog.openlog(options.syslog_prefix)

if not options.tracebacks:
  args2.append("-n")
if options.clogfile:
  args2+=["--logfile", options.clogfile]

if options.sslcertificate and options.sslkey:
  args2+=["--certificate", options.sslcertificate, "--privkey", options.sslkey, "--https", options.port]
  if options.sslchain:
    args2+=["--certificate-chain", options.sslchain]
else:
  args2+=["--port", options.port]

args2+=["--ip", options.ip]

if os.name == "posix" and os.getuid() == 0:
  print("refusing to run as root", file=sys.stderr)
  sys.exit(1)

run_twistd(args1, args2)
