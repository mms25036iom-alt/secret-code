@echo off
echo Killing process on port 5001...
echo.

REM Find and kill process using port 5001
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5001') do (
    echo Found process: %%a
    taskkill /F /PID %%a
)

echo.
echo Port 5001 is now free!
echo You can now start your server.
echo.
pause
