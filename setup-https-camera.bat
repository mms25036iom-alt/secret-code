@echo off
color 0A
title HTTPS Setup for Camera/Microphone Access

echo.
echo ============================================================
echo    HTTPS Setup for Camera and Microphone Access
echo ============================================================
echo.
echo This script will:
echo   1. Check if mkcert is installed
echo   2. Install local Certificate Authority
echo   3. Detect your local IP address
echo   4. Generate HTTPS certificates
echo   5. Enable camera/microphone access from network devices
echo.
echo ============================================================
echo.
pause

REM Check if mkcert is installed
echo [1/4] Checking for mkcert...
where mkcert >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] mkcert is not installed!
    echo.
    echo Please install mkcert first using one of these methods:
    echo.
    echo Method 1 - Using Chocolatey (Recommended):
    echo   1. Open PowerShell as Administrator
    echo   2. Run: Set-ExecutionPolicy Bypass -Scope Process -Force
    echo   3. Run: iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    echo   4. Run: choco install mkcert
    echo.
    echo Method 2 - Manual Download:
    echo   1. Go to: https://github.com/FiloSottile/mkcert/releases
    echo   2. Download: mkcert-v1.4.4-windows-amd64.exe
    echo   3. Rename to: mkcert.exe
    echo   4. Add to PATH or place in this folder
    echo.
    echo After installing mkcert, run this script again.
    echo.
    pause
    exit /b 1
)
echo [OK] mkcert is installed
echo.

REM Install local CA
echo [2/4] Installing local Certificate Authority...
mkcert -install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install CA
    pause
    exit /b 1
)
echo [OK] CA installed successfully
echo.

REM Get local IP
echo [3/4] Detecting your local IP address...
set "IP="
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set "IP=%%a"
    set "IP=!IP:~1!"
    goto :found
)
:found

if "%IP%"=="" (
    echo [WARNING] Could not detect IP automatically
    echo Please enter your local IP address manually:
    set /p IP="Enter IP (e.g., 192.168.1.100): "
)

echo [OK] Your local IP: %IP%
echo.

REM Generate certificates for Frontend
echo [4/4] Generating HTTPS certificates...
echo.
echo Creating certificates for:
echo   - localhost
echo   - 127.0.0.1
echo   - %IP%
echo   - ::1 (IPv6)
echo.

cd Frontend
mkcert localhost 127.0.0.1 %IP% ::1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to generate certificates
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo ============================================================
echo    SUCCESS! HTTPS Certificates Generated
echo ============================================================
echo.
echo Certificate files created in Frontend folder:
echo   - localhost+3.pem (certificate)
echo   - localhost+3-key.pem (private key)
echo.
echo ============================================================
echo    How to Use
echo ============================================================
echo.
echo 1. Start your frontend:
echo    cd Frontend
echo    npm run dev
echo.
echo 2. You should see HTTPS URLs:
echo    https://localhost:5173
echo    https://%IP%:5173
echo.
echo 3. Access from any device on your network:
echo    - Open browser
echo    - Go to: https://%IP%:5173
echo    - Accept security warning (click Advanced -^> Proceed)
echo    - Camera and microphone will work!
echo.
echo ============================================================
echo    Testing
echo ============================================================
echo.
echo On the same computer:
echo   1. Open: https://localhost:5173
echo   2. Go to video call page
echo   3. Browser asks for camera/microphone permission
echo   4. Click "Allow"
echo   5. Camera should work!
echo.
echo On other devices (phone, tablet, another computer):
echo   1. Connect to same WiFi network
echo   2. Open: https://%IP%:5173
echo   3. Accept security warning
echo   4. Login and test video call
echo   5. Camera and microphone should work!
echo.
echo ============================================================
echo.
echo For detailed troubleshooting, see:
echo   ENABLE_CAMERA_MICROPHONE.md
echo.
pause
