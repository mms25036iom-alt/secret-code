# 📱 Android Studio - Build APK Steps

## ✅ Android Studio is Now Opening!

---

## 🎯 What to Do in Android Studio

### Step 1: Wait for Gradle Sync (IMPORTANT!)

When Android Studio opens, you'll see at the bottom:
```
Gradle sync in progress...
```

**DO NOT DO ANYTHING YET!**

Wait until you see:
```
Gradle sync finished in X seconds
```

**First time:** 5-10 minutes  
**Subsequent builds:** 1-2 minutes

---

### Step 2: Build APK

Once Gradle sync is complete:

1. **Click "Build" menu** (top menu bar)

2. **Select "Build Bundle(s) / APK(s)"**

3. **Click "Build APK(s)"**

4. **Wait for build** (2-5 minutes)
   - Progress shown in bottom status bar
   - "Building APK(s)..."

5. **Success!** You'll see a notification:
   ```
   APK(s) generated successfully
   ```

6. **Click "locate"** in the notification to find your APK

---

## 📦 APK Location

```
Frontend\android\app\build\outputs\apk\debug\app-debug.apk
```

**File size:** ~50-80 MB

---

## 🔍 If Gradle Sync Fails

### Solution 1: Clean and Rebuild
1. **Build → Clean Project**
2. Wait for completion
3. **Build → Rebuild Project**

### Solution 2: Invalidate Caches
1. **File → Invalidate Caches**
2. Select **"Invalidate and Restart"**
3. Wait for Android Studio to restart
4. Wait for Gradle sync again

### Solution 3: Check SDK
1. **Tools → SDK Manager**
2. Make sure these are installed:
   - ✅ Android SDK Platform 34
   - ✅ Android SDK Build-Tools 34.0.0
   - ✅ Android SDK Command-line Tools
3. Click **Apply** if anything is missing

---

## 🎯 Alternative: Command Line Build

If Android Studio has issues, you can build from command line:

```bash
cd Frontend\android
gradlew.bat assembleDebug
```

APK will be at same location: `app\build\outputs\apk\debug\app-debug.apk`

---

## 📱 After Building APK

### Install on Your Phone

#### Method 1: USB Cable (Easiest)
1. Connect phone to computer
2. Copy `app-debug.apk` to phone
3. Open file on phone
4. Click "Install"
5. ✅ Done!

#### Method 2: ADB Install
```bash
# Make sure phone is connected via USB
# Enable USB Debugging on phone first

adb devices
# Should show your device

adb install Frontend\android\app\build\outputs\apk\debug\app-debug.apk
```

#### Method 3: Email/Cloud
1. Email APK to yourself
2. Open email on phone
3. Download APK
4. Install

---

## 🧪 Testing Your App

### First Launch:
1. Open "Cureon Health" app
2. Should see splash screen
3. Login screen appears

### Test Features:
- [ ] Login works
- [ ] Dashboard loads
- [ ] Health Dashboard opens
- [ ] Smartwatch Sync tab works
- [ ] Can enter health data
- [ ] Data syncs (if backend accessible)
- [ ] Navigation works
- [ ] All features accessible

---

## 🔧 Important: Backend Connection

### For Local Testing:

Your app needs to connect to your backend!

1. **Find your computer's IP:**
   ```bash
   ipconfig
   # Look for "IPv4 Address" under WiFi
   # Example: 192.168.0.101
   ```

2. **Update `Frontend/src/axios.js`:**
   ```javascript
   const instance = axios.create({
       baseURL: 'http://192.168.0.101:5000/api/v1',
       withCredentials: true
   });
   ```

3. **Rebuild app:**
   ```bash
   cd Frontend
   npm run build
   npx cap sync android
   npx cap open android
   # Build APK again
   ```

4. **Make sure:**
   - Backend is running: `cd Backend && node server.js`
   - Phone and computer on **same WiFi**
   - Windows Firewall allows port 5000

### For Production:

Deploy backend to cloud (Render, Railway, etc.) and use that URL:
```javascript
baseURL: 'https://your-backend-url.com/api/v1'
```

---

## 📊 Build Variants

### Debug APK (Current)
- **Use:** Testing and development
- **Size:** ~50-80 MB
- **Optimized:** No
- **Signed:** Auto (debug key)
- **Command:** `gradlew.bat assembleDebug`

### Release APK (Production)
- **Use:** Distribution to users
- **Size:** ~30-50 MB
- **Optimized:** Yes
- **Signed:** Your release key (required)
- **Command:** `gradlew.bat assembleRelease`

For release build, see `BUILD_ANDROID_APK.md` for signing key setup.

---

## 🎯 Quick Reference

### Build APK in Android Studio:
```
Build → Build Bundle(s) / APK(s) → Build APK(s)
```

### APK Location:
```
Frontend\android\app\build\outputs\apk\debug\app-debug.apk
```

### Install on Phone:
```bash
adb install app-debug.apk
```

### View Logs:
```bash
adb logcat | findstr "Cureon"
```

---

## ✅ Success Checklist

- [ ] Gradle sync completed
- [ ] APK built successfully
- [ ] APK file exists
- [ ] Installed on phone
- [ ] App opens
- [ ] Login works
- [ ] Features work

---

## 🚀 You're Almost Done!

**Current Status:**
- ✅ Web assets built
- ✅ Synced to Android
- ✅ Android Studio opened
- 🔄 Waiting for Gradle sync
- ⏳ Ready to build APK

**Next:**
1. Wait for Gradle sync
2. Build → Build APK(s)
3. Install on phone
4. Test!

---

## 💡 Tips

- **First build takes longest** (10-15 min total)
- **Subsequent builds are faster** (2-5 min)
- **Keep Android Studio open** for faster rebuilds
- **Test on real device** not emulator
- **Check backend is accessible** before testing

---

## 📞 Need Help?

### Common Issues:
- **Gradle sync fails:** Clean project and rebuild
- **Build fails:** Invalidate caches and restart
- **App crashes:** Check backend URL
- **Can't connect:** Check WiFi and firewall

### Documentation:
- `BUILD_SUCCESS.md` - Build status
- `BUILD_ANDROID_APK.md` - Detailed guide
- `FINAL_BUILD_GUIDE.md` - Complete instructions

---

**Android Studio is ready! Follow the steps above to build your APK!** 🚀

---

**Last Updated:** December 9, 2025  
**Status:** ✅ Ready to Build in Android Studio
