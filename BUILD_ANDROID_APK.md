# 📱 Build Android APK - Step by Step Guide

## 🚀 Quick Build Commands

### Option 1: Automated Build (Recommended)
```bash
cd Frontend
npm run build
npx cap sync android
npx cap open android
```
Then in Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**

### Option 2: Command Line Build
```bash
cd Frontend
npm run build
npx cap sync android
cd android
gradlew.bat assembleDebug
```

---

## 📋 Prerequisites

### 1. Install Required Software:
- ✅ Node.js (already installed)
- ✅ Android Studio (download from https://developer.android.com/studio)
- ✅ Java JDK 17 or higher

### 2. Set Environment Variables:
```bash
# Add to System Environment Variables
ANDROID_HOME=C:\Users\YourName\AppData\Local\Android\Sdk
JAVA_HOME=C:\Program Files\Java\jdk-17

# Add to PATH
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\tools
%JAVA_HOME%\bin
```

---

## 🔧 Step-by-Step Build Process

### Step 1: Build Web Assets
```bash
cd Frontend
npm run build
```
This creates the `dist` folder with your compiled web app.

### Step 2: Sync to Android
```bash
npx cap sync android
```
This copies web assets to the Android project and updates dependencies.

### Step 3: Open in Android Studio
```bash
npx cap open android
```
This opens the Android project in Android Studio.

### Step 4: Build APK in Android Studio

#### Method A: Debug APK (Quick Testing)
1. In Android Studio, click **Build** menu
2. Select **Build Bundle(s) / APK(s)**
3. Click **Build APK(s)**
4. Wait for build to complete
5. Click **locate** in the notification
6. APK location: `Frontend/android/app/build/outputs/apk/debug/app-debug.apk`

#### Method B: Release APK (Production)
1. Generate signing key (first time only):
   ```bash
   keytool -genkey -v -keystore cureon-release-key.keystore -alias cureon -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Update `android/app/build.gradle`:
   ```gradle
   android {
       ...
       signingConfigs {
           release {
               storeFile file('../../cureon-release-key.keystore')
               storePassword 'your-password'
               keyAlias 'cureon'
               keyPassword 'your-password'
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
               minifyEnabled false
               proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
           }
       }
   }
   ```

3. Build release APK:
   - **Build → Build Bundle(s) / APK(s) → Build APK(s)**
   - Or command line: `cd android && gradlew.bat assembleRelease`

4. APK location: `Frontend/android/app/build/outputs/apk/release/app-release.apk`

---

## 🔍 Troubleshooting

### Issue: Gradle build fails
**Solution:**
```bash
cd Frontend/android
gradlew.bat clean
gradlew.bat build
```

### Issue: Android SDK not found
**Solution:**
1. Open Android Studio
2. Go to **Tools → SDK Manager**
3. Install Android SDK Platform 34 (or latest)
4. Install Android SDK Build-Tools
5. Set ANDROID_HOME environment variable

### Issue: Java version error
**Solution:**
1. Install JDK 17: https://adoptium.net/
2. Set JAVA_HOME to JDK 17 path
3. Restart terminal/Android Studio

### Issue: Capacitor sync fails
**Solution:**
```bash
cd Frontend
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap sync android
```

### Issue: Build succeeds but app crashes
**Solution:**
1. Check `android/app/src/main/AndroidManifest.xml` permissions
2. Update `capacitor.config.json` server settings
3. Check backend URL is accessible from mobile
4. Review Android Studio Logcat for errors

---

## 📱 Testing the APK

### Install on Physical Device:
1. Enable **Developer Options** on your Android phone:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   
2. Enable **USB Debugging**:
   - Settings → Developer Options → USB Debugging

3. Connect phone via USB

4. Install APK:
   ```bash
   adb install Frontend/android/app/build/outputs/apk/debug/app-debug.apk
   ```

### Install on Emulator:
1. Open Android Studio
2. **Tools → Device Manager**
3. Create/Start an emulator
4. Drag APK file onto emulator

---

## 🔐 Important Configuration

### Update Backend URL for Mobile

In `Frontend/src/axios.js`, update base URL:
```javascript
const instance = axios.create({
    baseURL: 'https://your-backend-url.com/api/v1',
    // For local testing on same network:
    // baseURL: 'http://192.168.0.101:5000/api/v1',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});
```

### Android Permissions

Ensure `android/app/src/main/AndroidManifest.xml` has:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.BODY_SENSORS" />
<uses-permission android:name="android.permission.ACTIVITY_RECOGNITION" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

---

## 📦 APK Output Locations

### Debug APK:
```
Frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

### Release APK:
```
Frontend/android/app/build/outputs/apk/release/app-release.apk
```

### AAB (for Play Store):
```
Frontend/android/app/build/outputs/bundle/release/app-release.aab
```

---

## 🚀 Quick Commands Reference

```bash
# Build web assets
cd Frontend && npm run build

# Sync to Android
npx cap sync android

# Open Android Studio
npx cap open android

# Build debug APK (command line)
cd android && gradlew.bat assembleDebug

# Build release APK (command line)
cd android && gradlew.bat assembleRelease

# Clean build
cd android && gradlew.bat clean

# Install on device
adb install app-debug.apk

# View logs
adb logcat
```

---

## 📱 App Info

- **App Name**: Cureon Health
- **Package**: com.cureon.telemed
- **Min SDK**: 22 (Android 5.1)
- **Target SDK**: 34 (Android 14)

---

## ✅ Build Checklist

Before building:
- [ ] Backend is deployed and accessible
- [ ] Update axios baseURL to production backend
- [ ] Test all features on web version
- [ ] Update app version in `android/app/build.gradle`
- [ ] Add app icon in `android/app/src/main/res/`
- [ ] Configure signing key for release build
- [ ] Test on physical Android device
- [ ] Check all permissions are granted
- [ ] Test smartwatch sync functionality
- [ ] Test emergency SOS features
- [ ] Verify SMS notifications work

---

## 🎯 Next Steps After Build

1. ✅ Test APK on multiple devices
2. ✅ Test all features (login, health sync, SOS, etc.)
3. ✅ Fix any mobile-specific issues
4. ✅ Optimize performance
5. ✅ Prepare for Play Store submission

---

## 📝 Notes

- Debug APK is for testing only (larger size, not optimized)
- Release APK is for production (smaller, optimized, signed)
- AAB (Android App Bundle) is required for Play Store
- Keep your signing key safe and backed up!

---

**Ready to build? Follow the steps above!** 🚀
