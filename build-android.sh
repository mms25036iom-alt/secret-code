#!/bin/bash

# ============================================
# Cureon Android Build Script
# Automatically builds and updates Android APK
# ============================================

echo "🚀 Starting Cureon Android Build Process..."
echo "============================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Clean previous builds
echo -e "${BLUE}📦 Step 1: Cleaning previous builds...${NC}"
cd Frontend
rm -rf dist
rm -rf www
cd ..

# Step 2: Install dependencies
echo -e "${BLUE}📦 Step 2: Installing dependencies...${NC}"
cd Frontend
npm install
cd ..

# Step 3: Build frontend
echo -e "${BLUE}🔨 Step 3: Building frontend...${NC}"
cd Frontend
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend build successful!${NC}"

# Step 4: Copy build to www folder for Capacitor
echo -e "${BLUE}📋 Step 4: Preparing Capacitor build...${NC}"
cp -r dist www

# Step 5: Sync with Capacitor
echo -e "${BLUE}🔄 Step 5: Syncing with Capacitor...${NC}"
npx cap sync android

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Capacitor sync failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Capacitor sync successful!${NC}"

# Step 6: Copy assets
echo -e "${BLUE}📱 Step 6: Copying Android assets...${NC}"
npx cap copy android

# Step 7: Update Android project
echo -e "${BLUE}🔧 Step 7: Updating Android project...${NC}"
npx cap update android

# Step 8: Build Android APK
echo -e "${BLUE}🏗️  Step 8: Building Android APK...${NC}"
cd android
./gradlew assembleDebug

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Android build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Android APK built successfully!${NC}"

# Step 9: Copy APK to root
echo -e "${BLUE}📦 Step 9: Copying APK to root directory...${NC}"
cd ..
cp android/app/build/outputs/apk/debug/app-debug.apk ./cureon-debug.apk

# Step 10: Show APK location
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}✅ BUILD COMPLETE!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${BLUE}📱 APK Location:${NC}"
echo "   ./cureon-debug.apk"
echo ""
echo -e "${BLUE}📱 Android Studio Project:${NC}"
echo "   ./android"
echo ""
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo "   1. Install APK: adb install cureon-debug.apk"
echo "   2. Or open in Android Studio: npx cap open android"
echo ""
echo -e "${GREEN}Happy Testing! 🎉${NC}"
