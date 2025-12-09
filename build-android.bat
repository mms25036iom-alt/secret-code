@echo off
REM ============================================
REM Cureon Android Build Script (Windows)
REM Automatically builds and updates Android APK
REM ============================================

echo.
echo ============================================
echo    Cureon Android Build Process
echo ============================================
echo.

REM Step 1: Clean previous builds
echo [1/10] Cleaning previous builds...
cd Frontend
if exist dist rmdir /s /q dist
if exist www rmdir /s /q www
cd ..

REM Step 2: Install dependencies
echo [2/10] Installing dependencies...
cd Frontend
call npm install
cd ..

REM Step 3: Build frontend
echo [3/10] Building frontend...
cd Frontend
call npm run build
if errorlevel 1 (
    echo ERROR: Frontend build failed!
    pause
    exit /b 1
)
echo SUCCESS: Frontend built!

REM Step 4: Copy build to www
echo [4/10] Preparing Capacitor build...
xcopy /E /I /Y dist www

REM Step 5: Sync with Capacitor
echo [5/10] Syncing with Capacitor...
call npx cap sync android
if errorlevel 1 (
    echo ERROR: Capacitor sync failed!
    pause
    exit /b 1
)

REM Step 6: Copy assets
echo [6/10] Copying Android assets...
call npx cap copy android

REM Step 7: Update Android
echo [7/10] Updating Android project...
call npx cap update android

REM Step 8: Build APK
echo [8/10] Building Android APK...
cd android
call gradlew assembleDebug
if errorlevel 1 (
    echo ERROR: Android build failed!
    pause
    exit /b 1
)
cd ..

REM Step 9: Copy APK
echo [9/10] Copying APK to root...
copy android\app\build\outputs\apk\debug\app-debug.apk cureon-debug.apk

REM Step 10: Complete
echo [10/10] Build complete!
echo.
echo ============================================
echo    BUILD SUCCESSFUL!
echo ============================================
echo.
echo APK Location: cureon-debug.apk
echo.
echo Next Steps:
echo   1. Install: adb install cureon-debug.apk
echo   2. Or open in Android Studio: npx cap open android
echo.
pause
