@echo off
echo ========================================
echo   Cureon APK Build Script
echo ========================================
echo.

echo [1/5] Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/5] Building production bundle...
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo [3/5] Syncing with Capacitor...
call npx cap sync android
if errorlevel 1 (
    echo ERROR: Capacitor sync failed
    pause
    exit /b 1
)

echo.
echo [4/5] Copying web assets...
call npx cap copy android
if errorlevel 1 (
    echo ERROR: Failed to copy assets
    pause
    exit /b 1
)

echo.
echo [5/5] Opening Android Studio...
call npx cap open android

echo.
echo ========================================
echo   Build Complete!
echo ========================================
echo.
echo Next steps in Android Studio:
echo 1. Wait for Gradle sync to complete
echo 2. Build -^> Build Bundle(s) / APK(s) -^> Build APK(s)
echo 3. APK location: android/app/build/outputs/apk/debug/
echo.
pause
