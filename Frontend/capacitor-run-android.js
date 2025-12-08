#!/usr/bin/env node

/**
 * Custom script to override 'npx cap run android' behavior
 * This script will build, sync, and open Android Studio instead of trying to run on emulator
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('========================================');
console.log('🚀 Building and Opening Android Studio');
console.log('========================================\n');

try {
  // Step 1: Build the project
  console.log('[1/3] 📦 Building project...');
  execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ Build complete\n');

  // Step 2: Sync with Android
  console.log('[2/3] 🔄 Syncing with Android...');
  execSync('npx cap sync android', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ Sync complete\n');

  // Step 3: Open Android Studio
  console.log('[3/3] 📱 Opening Android Studio...');
  execSync('npx cap open android', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ Android Studio should open now\n');

  console.log('========================================');
  console.log('✅ DONE!');
  console.log('========================================');
  console.log('\nNext steps in Android Studio:');
  console.log('1. Wait for Gradle sync to complete');
  console.log('2. Select your device/emulator from dropdown');
  console.log('3. Click the green Run button (▶)');
  console.log('========================================\n');

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
