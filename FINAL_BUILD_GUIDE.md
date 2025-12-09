# 🚀 FINAL BUILD GUIDE - Android APK

## ⚡ FASTEST WAY TO BUILD (3 Steps)

### Step 1: Run Build Script
```bash
# Double-click this file in Windows Explorer:
build-android.bat
```

### Step 2: Wait for Android Studio
- Android Studio will open automatically
- Wait for "Gradle sync" to finish (bottom status bar)

### Step 3: Build APK
- Click **Build** menu
- Select **Build Bundle(s) / APK(s)**
- Click **Build APK(s)**
- Wait 2-5 minutes
- Click **locate** when done

**✅ Your APK is ready!**

Location: `Frontend\android\app\build\outputs\apk\debug\app-debug.apk`

---

## 📱 Install APK on Your Phone

### Method 1: USB Cable (Easiest)
1. Connect phone to computer via USB
2. Copy APK to phone
3. Open APK file on phone
4. Click "Install"
5. ✅ Done!

### Method 2: ADB Install
```bash
# Enable USB Debugging on phone first
adb install Frontend\android\app\build\outputs\apk\debug\app-debug.apk
```

### Method 3: Email/Cloud
1. Email APK to yourself
2. Open email on phone
3. Download APK
4. Install

---

## 🔧 IMPORTANT: Update Backend URL

Before building, update the backend URL for mobile:

### Edit `Frontend/src/axios.js`:

```javascript
const instance = axios.create({
    // Option 1: Production (if backend is deployed)
    baseURL: 'https://your-backend-url.com/api/v1',
    
    // Option 2: Local testing (same WiFi network)
    // baseURL: 'http://192.168.0.101:5000/api/v1',
    
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});
```

**For local testing:**
1. Find your computer's IP address:
   ```bash
   ipconfig
   # Look for "IPv4 Address" under WiFi adapter
   # Example: 192.168.0.101
   ```

2. Replace `192.168.0.101` with your actual IP

3. Make sure backend is running:
   ```bash
   cd Backend
   node server.js
   ```

4. Make sure phone and computer are on **same WiFi network**

---

## 🎯 Complete Build Process

### 1. Prepare
```bash
# Make sure you're in project root
cd path\to\your\project

# Check if Frontend folder exists
dir Frontend
```

### 2. Build Web Assets
```bash
cd Frontend
npm run build
```

This creates the `dist` folder with your compiled app.

### 3. Sync to Android
```bash
npx cap sync android
```

This copies web assets to Android project.

### 4. Open Android Studio
```bash
npx cap open android
```

Or use the build script:
```bash
build-android.bat
```

### 5. Build in Android Studio
1. Wait for Gradle sync (bottom status bar)
2. **Build → Build Bundle(s) / APK(s) → Build APK(s)**
3. Wait for build to complete
4. Click **locate** to find APK

---

## 🔍 Troubleshooting

### Issue: "npm run build" fails

**Solution:**
```bash
cd Frontend
npm install
npm run build
```

### Issue: "npx cap sync" fails

**Solution:**
```bash
cd Frontend
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap sync android
```

### Issue: Gradle sync fails in Android Studio

**Solution:**
1. In Android Studio: **File → Invalidate Caches → Invalidate and Restart**
2. Or command line:
   ```bash
   cd Frontend\android
   gradlew.bat clean
   gradlew.bat build
   ```

### Issue: "Android SDK not found"

**Solution:**
1. Open Android Studio
2. **Tools → SDK Manager**
3. Install:
   - Android SDK Platform 34
   - Android SDK Build-Tools 34.0.0
   - Android SDK Command-line Tools
4. Restart Android Studio

### Issue: App crashes on phone

**Solution:**
1. Check backend URL is correct
2. Make sure backend is accessible from phone
3. Test backend URL in phone browser first
4. Check Android Studio Logcat for errors

### Issue: Cannot connect to backend

**Solution:**
1. Phone and computer must be on **same WiFi**
2. Update axios baseURL to your computer's IP
3. Make sure backend is running
4. Test in phone browser: `http://YOUR_IP:5000/api/v1/`
5. Check Windows Firewall isn't blocking port 5000

---

## ✅ Pre-Build Checklist

Before building APK:
- [ ] Backend is running (`node Backend/server.js`)
- [ ] Updated axios baseURL to production URL or local IP
- [ ] Tested app on web browser (`npm run dev`)
- [ ] All features working on web
- [ ] Phone and computer on same WiFi (for local testing)

---

## 📦 Build Output

### Debug APK (For Testing):
```
Location: Frontend\android\app\build\outputs\apk\debug\app-debug.apk
Size: ~50-80 MB
Use: Testing and development
```

### Release APK (For Production):
```
Location: Frontend\android\app\build\outputs\apk\release\app-release.apk
Size: ~30-50 MB
Use: Distribution to users
Requires: Signing key
```

---

## 🧪 Testing the APK

After installing on phone:

### 1. Test Login
- Open app
- Login with credentials
- Should work if backend is accessible

### 2. Test Health Sync
- Go to Health Dashboard
- Click Smartwatch Sync
- Enter health data manually
- Click Sync Data
- Should upload to backend

### 3. Test Alerts
- Go to Settings
- Set low threshold (e.g., HR critical > 75)
- Enable Auto-SOS
- Sync data with HR > 75
- Should trigger alert and SMS

### 4. Test Other Features
- Dashboard navigation
- Profile page
- Appointments
- Video calls
- Camera (for analysis)
- SOS button

---

## 🎯 Quick Commands Reference

```bash
# Build everything (automated)
build-android.bat

# Manual build steps
cd Frontend
npm run build
npx cap sync android
npx cap open android

# Clean build
cd Frontend\android
gradlew.bat clean

# View connected devices
adb devices

# Install APK
adb install app-debug.apk

# Uninstall app
adb uninstall com.cureon.telemed

# View app logs
adb logcat | findstr "Cureon"
```

---

## 📱 App Information

- **App Name**: Cureon Health
- **Package**: com.cureon.telemed
- **Min Android**: 5.1 (API 22)
- **Target Android**: 14 (API 34)

---

## 🚀 Next Steps After Build

1. ✅ Install APK on your phone
2. ✅ Test all features
3. ✅ Test with real boAt watch data
4. ✅ Test emergency SOS
5. ✅ Test SMS notifications
6. ✅ Fix any issues
7. ✅ Build release APK (optional)
8. ✅ Distribute to users

---

## 💡 Tips

### For Best Results:
- Use a physical Android device (not emulator)
- Test on same WiFi network first
- Deploy backend to cloud for production
- Test all features thoroughly
- Keep backend running while testing

### For Production:
- Deploy backend to cloud (Render, Railway, etc.)
- Update axios baseURL to production URL
- Build release APK with signing key
- Test on multiple devices
- Prepare for Play Store submission

---

## 📞 Need Help?

### Common Issues:
1. **Build fails**: Check `ANDROID_BUILD_INSTRUCTIONS.md`
2. **App crashes**: Check backend URL and accessibility
3. **Features not working**: Test on web first
4. **Gradle errors**: Clean and rebuild

### Additional Guides:
- `BUILD_ANDROID_APK.md` - Detailed build guide
- `ANDROID_BUILD_INSTRUCTIONS.md` - Step-by-step instructions
- `MOBILE_APP_CONVERSION_GUIDE.md` - Mobile features guide

---

## 🎉 You're Ready!

**Run `build-android.bat` now to start building your APK!**

The script will:
1. ✅ Build web assets
2. ✅ Sync to Android
3. ✅ Open Android Studio
4. ✅ Guide you through the rest

**Total time: 5-10 minutes**

---

**Last Updated**: December 9, 2025  
**Status**: ✅ Ready to Build
