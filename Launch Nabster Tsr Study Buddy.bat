@echo off
echo Starting Nabster Tsr Study Buddy...
cd /d "%~dp0"
start /min cmd /c "npm run dev"
timeout /t 3 /nobreak >nul
start http://127.0.0.1:5173
exit
