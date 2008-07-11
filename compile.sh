#!/bin/sh
mkdir -p compiled
rm -f compiled/*.js

cd js
cat version.js jslib.js irc/ircconnection.js irc/irclib.js irc/baseircclient.js irc/irctracker.js irc/commandparser.js irc/ircclient.js ui/baseui.js ui/baseuiwindow.js ui/colour.js ui/theme.js qwebircinterface.js > ../compiled/qwebirc-concat.js
cat ui/swmlayout.js ui/swmui.js > ../compiled/swmui-concat.js
cd ../compiled

error() {
  cd ..
  rm compiled/*-compiled.js
  exit 1
}

jarit() {
  java -jar ../bin/yuicompressor-2.3.5.jar $1.js > $2-compiled.js
  if [ "$?" != 0 ]; then
    error
  fi
}

catit() {
  cat js/copyright.js compiled/$1-compiled.js > static/js/$1.js
}

jarit qwebirc-concat qwebirc
jarit ../js/ui/uglyui uglyui
jarit swmui-concat swmui

cd ..
catit qwebirc
catit uglyui
catit swmui
rm -f compiled/*.js
rmdir compiled
