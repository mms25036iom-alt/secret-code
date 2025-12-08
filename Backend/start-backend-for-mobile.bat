@echo off
echo ========================================
echo Starting Backend for Mobile APK Testing
echo ========================================
echo.

echo Configuration:
echo - Port: 4000
echo - Host: 0.0.0.0 (all network interfaces)
echo - Your IP: 192.168.0.101
echo.

echo Mobile devices can connect at:
echo   http://192.168.0.101:4000
echo.

echo ⚠️  Make sure:
echo   1. Your phone is on the SAME WiFi network
echo   2. Windows Firewall allows Node.js (run fix-firewall.bat)
echo.

echo Starting backend server...
echo.

npm start
