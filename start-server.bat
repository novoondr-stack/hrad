@echo off
cd /d "%~dp0"
echo.
echo  Horni Hrad — lokalni server
echo  Otevri v prohlizeci:  http://localhost:8080
echo  Ukonceni: Ctrl+C
echo.
python -m http.server 8080
