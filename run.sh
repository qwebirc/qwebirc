#!/bin/sh
export PYTHONPATH=.:${PYTHONPATH}

if [ -f "defargs.conf" ]; then
  ARGS=$(cat defargs.conf)
else
  ARGS=
fi

PREARGS=
if [ "$1" = "-n" ]; then
  PREARGS=$1
  shift
fi

if [ "$1" = "-r" ]; then
  PREARGS="$PREARGS $1 $2"
  shift
  shift
fi

if [ "$1" != "" ]; then
  if [ "$ARGS" != "" ]; then
    echo "Not using default arguments: $ARGS"
  fi
  ARGS=$*
fi

twistd $PREARGS qwebirc -n $ARGS
