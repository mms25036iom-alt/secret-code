@echo off
echo ========================================
echo  Generating HTTPS Certificates (Backend)
echo ========================================
echo.

REM Check if mkcert is installed
where mkcert >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: mkcert is not installed!
    echo.
    echo Please install mkcert first:
    echo   1. Install Chocolatey from https://chocolatey.org/install
    echo   2. Run: choco install mkcert
    echo.
    echo Or download manually from:
    echo   https://github.com/FiloSottile/mkcert/releases
    echo.
    pause
    exit /b 1
)

echo Step 1: Installing local Certificate Authority...
mkcert -install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install CA
    pause
    exit /b 1
)
echo ✓ CA installed successfully
echo.

echo Step 2: Getting your local IP address...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set IP=%%a
    goto :found
)
:found
set IP=%IP:~1%
echo Your local IP: %IP%
echo.

echo Step 3: Generating certificates...
echo This will create certificates for:
echo   - localhost
echo   - 127.0.0.1
echo   - %IP%
echo   - ::1 (IPv6)
echo.

mkcert localhost 127.0.0.1 %IP% ::1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to generate certificates
    pause
    exit /b 1
)

echo.
echo ========================================
echo  ✓ Certificates Generated Successfully!
echo ========================================
echo.
echo Files created:
echo   - localhost+3.pem (certificate)
echo   - localhost+3-key.pem (private key)
echo.
echo Backend will use HTTPS on:
echo   - https://localhost:5001
echo   - https://127.0.0.1:5001
echo   - https://%IP%:5001
echo.
echo Next steps:
echo   1. Update server.js to use HTTPS
echo   2. Restart your backend: npm run dev
echo   3. Update frontend proxy to use https://localhost:5001
echo.
pause
