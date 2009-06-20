import platform

if platform.system() != "Windows":
  # sorry windows users!

  import signal
  import traceback

  signal.signal(signal.SIGUSR1, lambda sig, stack: traceback.print_stack(stack))

