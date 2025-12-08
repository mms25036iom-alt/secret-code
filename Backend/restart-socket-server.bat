@echo off
echo Stopping any process on port 5001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5001') do (
    taskkill /F /PID %%a 2>nul
)
timeout /t 2 /nobreak >nul
echo Starting Socket.IO server...
node socketServer.js
