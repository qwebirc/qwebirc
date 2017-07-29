# qwebirc IRC client

[![Build Status](https://travis-ci.org/qwebirc/qwebirc.png?branch=master)](https://travis-ci.org/qwebirc/qwebirc)

## Installation

Installation instructions are on the website: https://qwebirc.org/faq

## Hacking on qwebirc

If you'd like to make modifications you'd find it a LOT easier if create the following symlinks:

- js -> static/js/debug
- css -> static/css/debug

with a command like

```
cd /path/qwebirc
ln -s ../../js static/js/debug
ln -s ../../css static/css/debug
```

... then you can browse to http://instance/quidebug.html and use your favourite javascript debugger, as well as not having to compile each time you make a change!
