@echo off
del compiled.js
del concat.js
cd js
copy version.js + jslib.js + irc\ircconnection.js + irc\irclib.js + irc\baseirc.js + irc\irctracker.js + irc\commandparser.js + irc\ircclient.js + ui\uibase.js + ui\colour.js + ui\theme.js + ui\uglyui.js ..\concat.js /b
cd ..
java -jar bin\yuicompressor-2.3.5.jar concat.js > compiled.js

if %errorlevel% == 0 goto ok

del compiled.js
pause
goto ene

:ok
del concat.js
copy js\copyright.js + compiled.js /b static\js\qwebirc.js
del compiled.js
goto end

:end
