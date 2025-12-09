# 🚀 Android APK Build Instructions

## ⚡ Quick Build (Easiest Method)

### Step 1: Run Build Script
```bash
# Double-click this file:
build-android.bat
```

This will:
1. ✅ Build web assets
2. ✅ Sync to Android project
3. ✅ Open Android Studio

### Step 2: In Android Studio
1. Wait for **Gradle sync** to complete (bottom status bar)
2. Click **Build** menu → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. Wait for build (2-5 minutes)
4. Click **locate** in the notification popup
5. ✅ Your APK is ready!

**APK Location:**
```
Frontend\android\app\build\outputs\apk\debug\app-debug.apk
```

---

## 📱 Manual Build Steps

### Method 1: Using Android Studio (Recommended)

```bash
# 1. Build web assets
cd Frontend
npm run build

# 2. Sync to Android
npx cap sync android

# 3. Open Android Studio
npx cap open android
```

Then in Android Studio:
- **Build → Build Bundle(s) / APK(s) → Build APK(s)**

### Method 2: Command Line Build

```bash
# 1. Build web assets
cd Frontend
npm run build

# 2. Sync to Android
npx cap sync android

# 3. Build APK
cd android
gradlew.bat assembleDebug
```

APK will be at: `Frontend\android\app\build\outputs\apk\debug\app-debug.apk`

---

## 🔧 Before Building

### 1. Update Backend URL

Edit `Frontend/src/axios.js`:

```javascript
const instance = axios.create({
    // For production (deployed backend):
    baseURL: 'https://your-backend-url.com/api/v1',
    
    // For local testing (same WiFi network):
    // baseURL: 'http://192.168.0.101:5000/api/v1',
    
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});
```

**Important:** Replace `192.168.0.101` with your computer's actual IP address.

To find your IP:
```bash
ipconfig
# Look for "IPv4 Address" under your WiFi adapter
```

### 2. Check Capacitor Config

File: `capacitor.config.json` (already updated ✅)

```json
{
  "appId": "com.cureon.telemed",
  "appName": "Cureon Health",
  "webDir": "dist"
}
```

---

## 📦 Build Types

### Debug APK (For Testing)
- Larger file size
- Not optimized
- Easy to install and test
- **Use this for development**

```bash
cd Frontend/android
gradlew.bat assembleDebug
```

Output: `app-debug.apk`

### Release APK (For Production)
- Smaller file size
- Optimized and minified
- Requires signing key
- **Use this for distribution**

```bash
cd Frontend/android
gradlew.bat assembleRelease
```

Output: `app-release.apk`

---

## 🔐 Creating Signing Key (For Release Build)

### Generate Key (First Time Only):

```bash
keytool -genkey -v -keystore cureon-release-key.keystore -alias cureon -keyalg RSA -keysize 2048 -validity 10000
```

Answer the prompts:
- Password: (choose a strong password)
- Name: Your name
- Organization: Cureon Health
- City, State, Country: Your location

**IMPORTANT:** Save this keystore file and password securely! You'll need it for all future updates.

### Configure Signing in Android Studio:

1. Copy `cureon-release-key.keystore` to `Frontend/android/app/`

2. Edit `Frontend/android/app/build.gradle`:

Add before `android {`:
```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Add inside `android {`:
```gradle
signingConfigs {
    release {
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
        storeFile file(keystoreProperties['storeFile'])
        storePassword keystoreProperties['storePassword']
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled false
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

3. Create `Frontend/android/keystore.properties`:
```properties
storeFile=app/cureon-release-key.keystore
storePassword=your-keystore-password
keyAlias=cureon
keyPassword=your-key-password
```

4. Add to `.gitignore`:
```
keystore.properties
*.keystore
```

---

## 📱 Installing APK on Device

### Method 1: USB Cable

1. Enable Developer Options on phone:
   - Settings → About Phone
   - Tap "Build Number" 7 times

2. Enable USB Debugging:
   - Settings → Developer Options → USB Debugging

3. Connect phone via USB

4. Install APK:
```bash
adb install Frontend\android\app\build\outputs\apk\debug\app-debug.apk
```

### Method 2: File Transfer

1. Copy APK to phone (via USB, email, or cloud)
2. Open APK file on phone
3. Allow "Install from Unknown Sources" if prompted
4. Install

### Method 3: Android Studio

1. Connect phone via USB
2. In Android Studio, select your device from dropdown
3. Click **Run** (green play button)

---

## 🔍 Troubleshooting

### Issue: "Gradle sync failed"

**Solution:**
```bash
cd Frontend/android
gradlew.bat clean
gradlew.bat build
```

### Issue: "SDK not found"

**Solution:**
1. Open Android Studio
2. Tools → SDK Manager
3. Install:
   - Android SDK Platform 34
   - Android SDK Build-Tools 34.0.0
   - Android SDK Command-line Tools

### Issue: "Java version error"

**Solution:**
1. Install JDK 17: https://adoptium.net/
2. Set JAVA_HOME:
   ```
   JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.x
   ```
3. Restart terminal

### Issue: "Build succeeds but app crashes"

**Solution:**
1. Check backend URL is correct
2. Check backend is accessible from phone
3. View logs:
   ```bash
   adb logcat | findstr "Cureon"
   ```

### Issue: "Cannot connect to backend"

**Solution:**
1. Make sure phone and computer are on same WiFi
2. Update axios baseURL to your computer's IP
3. Make sure backend is running
4. Test backend URL in phone browser first

---

## ✅ Pre-Build Checklist

- [ ] Backend is running and accessible
- [ ] Updated axios baseURL to production/local IP
- [ ] Tested all features on web version
- [ ] Updated app version in `android/app/build.gradle`
- [ ] Added app icon (optional)
- [ ] Configured signing key (for release)
- [ ] Tested on emulator/device

---

## 📊 Build Output

### Debug APK:
```
Location: Frontend\android\app\build\outputs\apk\debug\app-debug.apk
Size: ~50-80 MB
Signed: Debug key (auto-generated)
Use: Testing only
```

### Release APK:
```
Location: Frontend\android\app\build\outputs\apk\release\app-release.apk
Size: ~30-50 MB
Signed: Your release key
Use: Production distribution
```

---

## 🎯 Quick Commands

```bash
# Build everything
build-android.bat

# Build release
build-android-release.bat

# Clean build
cd Frontend/android && gradlew.bat clean

# View connected devices
adb devices

# Install APK
adb install app-debug.apk

# Uninstall app
adb uninstall com.cureon.telemed

# View logs
adb logcat
```

---

## 📱 Testing Checklist

After installing APK:
- [ ] App opens successfully
- [ ] Login works
- [ ] Dashboard loads
- [ ] Health sync works
- [ ] Manual data entry works
- [ ] Alerts trigger correctly
- [ ] SOS button works
- [ ] SMS notifications sent
- [ ] Camera works (for analysis)
- [ ] Video call works
- [ ] All navigation works

---

## 🚀 Next Steps

1. ✅ Build debug APK
2. ✅ Test on physical device
3. ✅ Fix any issues
4. ✅ Build release APK
5. ✅ Test release version
6. ✅ Prepare for Play Store (optional)

---

## 📞 Need Help?

Common issues and solutions are in `BUILD_ANDROID_APK.md`

---

**Ready to build? Run `build-android.bat` now!** 🚀
