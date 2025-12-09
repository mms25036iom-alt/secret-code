# 📱 Build Android APK - Complete Guide

## 🚀 QUICK START (3 Commands)

```bash
# 1. Build web assets
cd Frontend && npm run build

# 2. Sync to Android
npx cap sync android

# 3. Open Android Studio
npx cap open android
```

Then in Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**

**✅ APK Location:** `Frontend\android\app\build\outputs\apk\debug\app-debug.apk`

---

## ⚡ AUTOMATED BUILD (Easiest)

### Just double-click:
```
build-android.bat
```

This will:
1. ✅ Build web assets automatically
2. ✅ Sync to Android project
3. ✅ Open Android Studio
4. ✅ Show you what to do next

---

## 📋 What You Need

### Already Installed:
- ✅ Node.js
- ✅ Capacitor
- ✅ Android folder

### Need to Install:
- [ ] **Android Studio** - Download from https://developer.android.com/studio
- [ ] **Java JDK 17** - Download from https://adoptium.net/

---

## 🔧 Before Building

### 1. Update Backend URL

**Important:** Your mobile app needs to connect to your backend!

Edit `Frontend/src/axios.js`:

```javascript
const instance = axios.create({
    // For production (backend deployed online):
    baseURL: 'https://your-backend-url.com/api/v1',
    
    // For local testing (same WiFi):
    // baseURL: 'http://192.168.0.101:5000/api/v1',
    
    withCredentials: true
});
```

**For local testing:**
1. Find your computer's IP:
   ```bash
   ipconfig
   # Look for "IPv4 Address" - Example: 192.168.0.101
   ```

2. Replace `192.168.0.101` with your actual IP

3. Make sure:
   - Backend is running: `cd Backend && node server.js`
   - Phone and computer on same WiFi
   - Windows Firewall allows port 5000

---

## 📱 Build Steps

### Step 1: Build Web Assets
```bash
cd Frontend
npm run build
```

**What this does:** Compiles your React app into static files in the `dist` folder.

**Time:** 1-2 minutes

### Step 2: Sync to Android
```bash
npx cap sync android
```

**What this does:** Copies web assets to Android project and updates dependencies.

**Time:** 30 seconds

### Step 3: Open Android Studio
```bash
npx cap open android
```

**What this does:** Opens the Android project in Android Studio.

**Time:** Instant

### Step 4: Build APK in Android Studio

1. **Wait for Gradle sync** (bottom status bar shows progress)
   - First time: 5-10 minutes
   - Subsequent builds: 1-2 minutes

2. **Build APK:**
   - Click **Build** menu
   - Select **Build Bundle(s) / APK(s)**
   - Click **Build APK(s)**

3. **Wait for build** (2-5 minutes)

4. **Get your APK:**
   - Click **locate** in the notification
   - Or find it at: `Frontend\android\app\build\outputs\apk\debug\app-debug.apk`

**✅ Done!**

---

## 📦 Install APK on Phone

### Method 1: USB Cable
1. Connect phone via USB
2. Copy APK to phone
3. Open APK file on phone
4. Click "Install"

### Method 2: ADB (Developer)
```bash
# Enable USB Debugging on phone first
adb install Frontend\android\app\build\outputs\apk\debug\app-debug.apk
```

### Method 3: Email/Cloud
1. Email APK to yourself
2. Open on phone
3. Download and install

---

## 🧪 Testing Your APK

### 1. Basic Test
- [ ] App opens
- [ ] Login works
- [ ] Dashboard loads

### 2. Health Features
- [ ] Health Dashboard opens
- [ ] Smartwatch Sync tab works
- [ ] Manual data entry works
- [ ] Data syncs to backend
- [ ] Dashboard shows data

### 3. Alert System
- [ ] Go to Settings
- [ ] Set low threshold (HR critical > 75)
- [ ] Enable Auto-SOS
- [ ] Sync data with HR > 75
- [ ] Alert triggers
- [ ] SMS sent (if configured)

### 4. Other Features
- [ ] Profile page
- [ ] Appointments
- [ ] Video calls
- [ ] Camera
- [ ] SOS button

---

## 🔍 Troubleshooting

### Problem: Build fails

**Solution 1:** Clean and rebuild
```bash
cd Frontend\android
gradlew.bat clean
gradlew.bat build
```

**Solution 2:** Invalidate caches
- Android Studio: **File → Invalidate Caches → Invalidate and Restart**

### Problem: Gradle sync fails

**Solution:** Install Android SDK
1. Open Android Studio
2. **Tools → SDK Manager**
3. Install:
   - Android SDK Platform 34
   - Android SDK Build-Tools 34.0.0
   - Android SDK Command-line Tools

### Problem: App crashes on phone

**Solution:** Check backend connection
1. Make sure backend is running
2. Check axios baseURL is correct
3. Test backend URL in phone browser
4. Make sure phone and computer on same WiFi

### Problem: Cannot connect to backend

**Solution:** Check network
1. Phone and computer must be on **same WiFi**
2. Update axios baseURL to your computer's IP
3. Test in phone browser: `http://YOUR_IP:5000/api/v1/`
4. Check Windows Firewall settings

### Problem: Java version error

**Solution:** Install JDK 17
1. Download from https://adoptium.net/
2. Install
3. Set JAVA_HOME environment variable
4. Restart terminal and Android Studio

---

## 📊 Build Types

### Debug APK (For Testing)
- **Size:** ~50-80 MB
- **Optimized:** No
- **Signed:** Auto (debug key)
- **Use:** Testing and development
- **Command:** `gradlew.bat assembleDebug`

### Release APK (For Production)
- **Size:** ~30-50 MB
- **Optimized:** Yes
- **Signed:** Your release key (required)
- **Use:** Distribution to users
- **Command:** `gradlew.bat assembleRelease`

---

## 🔐 Release Build (Optional)

For production distribution, you need a signed release APK.

### 1. Generate Signing Key
```bash
keytool -genkey -v -keystore cureon-release-key.keystore -alias cureon -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Configure Signing
See `BUILD_ANDROID_APK.md` for detailed instructions.

### 3. Build Release APK
```bash
cd Frontend\android
gradlew.bat assembleRelease
```

**Output:** `Frontend\android\app\build\outputs\apk\release\app-release.apk`

---

## ✅ Pre-Build Checklist

- [ ] Backend is running
- [ ] Updated axios baseURL
- [ ] Tested on web browser
- [ ] All features working
- [ ] Android Studio installed
- [ ] Java JDK installed

---

## 🎯 Quick Commands

```bash
# Automated build
build-android.bat

# Manual build
cd Frontend
npm run build
npx cap sync android
npx cap open android

# Clean build
cd Frontend\android
gradlew.bat clean

# Install APK
adb install app-debug.apk

# View logs
adb logcat | findstr "Cureon"
```

---

## 📱 App Info

- **Name:** Cureon Health
- **Package:** com.cureon.telemed
- **Min Android:** 5.1 (API 22)
- **Target Android:** 14 (API 34)

---

## 📖 Additional Guides

- **FINAL_BUILD_GUIDE.md** - Comprehensive guide
- **ANDROID_BUILD_INSTRUCTIONS.md** - Detailed steps
- **BUILD_ANDROID_APK.md** - Advanced options
- **MOBILE_APP_CONVERSION_GUIDE.md** - Mobile features

---

## 🎉 Ready to Build!

### Option 1: Automated (Easiest)
```bash
build-android.bat
```

### Option 2: Manual
```bash
cd Frontend
npm run build
npx cap sync android
npx cap open android
```

Then in Android Studio: **Build → Build APK(s)**

**Total Time:** 5-10 minutes

---

## 💡 Tips

- First build takes longer (10-15 min)
- Subsequent builds are faster (2-5 min)
- Test on physical device, not emulator
- Keep backend running while testing
- Use same WiFi for phone and computer

---

## 🚀 Next Steps

1. ✅ Build APK
2. ✅ Install on phone
3. ✅ Test all features
4. ✅ Test with boAt watch
5. ✅ Deploy backend to cloud
6. ✅ Build release APK
7. ✅ Distribute to users

---

**Start building now!** 🎉

Run `build-android.bat` or follow the manual steps above.

---

**Last Updated:** December 9, 2025  
**Status:** ✅ Ready to Build  
**Estimated Time:** 5-10 minutes
