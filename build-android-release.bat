@echo off
echo ========================================
echo Building Cureon Health Android APK (Release)
echo ========================================
echo.

echo Step 1: Building web assets...
cd Frontend
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Web build failed!
    pause
    exit /b 1
)
echo ✓ Web build complete
echo.

echo Step 2: Syncing to Android...
call npx cap sync android
if %errorlevel% neq 0 (
    echo ERROR: Capacitor sync failed!
    pause
    exit /b 1
)
echo ✓ Sync complete
echo.

echo Step 3: Building Release APK...
cd android
call gradlew.bat assembleRelease
if %errorlevel% neq 0 (
    echo ERROR: Release build failed!
    echo.
    echo Make sure you have:
    echo 1. Generated a signing key
    echo 2. Updated build.gradle with signing config
    echo.
    pause
    exit /b 1
)
echo ✓ Release APK built successfully!
echo.

echo ========================================
echo APK Location:
echo Frontend\android\app\build\outputs\apk\release\app-release.apk
echo ========================================
pause
