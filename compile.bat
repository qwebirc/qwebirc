@echo off

pagegen.py
mkdir compiled
del /q compiled\*.js

cd js
copy qwebirc.js + version.js + jslib.js + irc\ircconnection.js + irc\irclib.js + irc\numerics.js + irc\baseircclient.js + irc\irctracker.js + irc\commandparser.js + irc\commands.js + irc\ircclient.js + ui\baseui.js + ui\baseuiwindow.js + ui\colour.js + ui\url.js + ui\theme.js + ui\panes\connect.js + ui\panes\embed.js + qwebircinterface.js + irc\commandhistory.js + ui\hilightcontroller.js + ui\menuitems.js + ui\tabcompleter.js + ui\panes\options.js + ui\panes\about.js + auth.js + sound.js + ui\panes\privacypolicy.js ..\compiled\qwebirc-concat.js /b
copy ui\frontends\swmui.js + ui\frontends\swmlayout.js ..\compiled\swmui-concat.js /b
cd ..\compiled

java -jar ..\bin\yuicompressor-2.3.5.jar ..\static\js\mochaui\mocha.js > mocha-compressed.js
if not %errorlevel% == 0 goto error

java -jar ..\bin\yuicompressor-2.3.5.jar qwebirc-concat.js > qwebirc-compiled.js
if not %errorlevel% == 0 goto error

java -jar ..\bin\yuicompressor-2.3.5.jar ..\js\ui\frontends\uglyui.js > uglyui-compiled.js
if not %errorlevel% == 0 goto error

java -jar ..\bin\yuicompressor-2.3.5.jar swmui-concat.js > swmui-compiled.js
if not %errorlevel% == 0 goto error

java -jar ..\bin\yuicompressor-2.3.5.jar ..\js\ui\frontends\mochaui.js > mochaui-compiled.js
if not %errorlevel% == 0 goto error

java -jar ..\bin\yuicompressor-2.3.5.jar ..\js\ui\frontends\qui.js > qui-compiled.js
if not %errorlevel% == 0 goto error

goto ok
:error
cd ..
del /q compiled\*-compiled.js
pause
goto end

:ok
cd ..
copy compiled\mocha-compressed.js /b static\js\mochaui\mocha-compressed.js

copy js\copyright.js + compiled\qwebirc-compiled.js /b static\js\qwebirc.js
copy js\copyright.js + compiled\uglyui-compiled.js /b static\js\uglyui.js
copy js\copyright.js + compiled\swmui-compiled.js /b static\js\swmui.js
copy js\copyright.js + compiled\mochaui-compiled.js /b static\js\mochaui.js
copy js\copyright.js + compiled\qui-compiled.js /b static\js\qui.js
del /q compiled\*.js
rmdir compiled

goto end

:end
