#!/bin/sh
export PYTHONPATH=.:${PYTHONPATH}
twistd qwebirc -n
