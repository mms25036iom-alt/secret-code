# Smartwatch Integration - Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### Step 1: Start the Backend
```bash
cd Backend
npm install
node server.js
```

### Step 2: Start the Frontend
```bash
cd Frontend
npm install
npm run dev
```

### Step 3: Configure Environment Variables
Make sure your `Backend/.env` has:
```env
MONGODB_URI=your_mongodb_connection_string
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_phone
```

## 📱 Connect Your Smartwatch

### Requirements:
- ✅ Chrome, Edge, or Opera browser (Desktop or Android)
- ✅ Bluetooth enabled on your device
- ✅ Smartwatch turned on and nearby
- ✅ Supported watch: boAt, Mi Band, Amazfit, Fitbit, Galaxy Watch, etc.

### Connection Steps:

1. **Login to the app**
   - Navigate to `http://localhost:5173`
   - Login with your credentials

2. **Go to Health Dashboard**
   - Click on "Health Dashboard" in navigation
   - Or go directly to: `http://localhost:5173/health/dashboard`

3. **Connect Smartwatch**
   - Click on "Smartwatch Sync" tab
   - Click "Connect Smartwatch" button
   - Browser will show Bluetooth device picker
   - Select your smartwatch from the list
   - Approve pairing on your watch (if prompted)

4. **Sync Data**
   - Once connected, click "Sync Now"
   - Your health data will be uploaded
   - View real-time readings on dashboard

## 🔔 Configure Alerts

1. **Go to Settings Tab**
   - In Health Dashboard, click "Settings"

2. **Set Your Thresholds**
   - Adjust warning and critical levels for:
     - Heart Rate
     - Blood Pressure
     - SpO2
     - Temperature
     - Blood Glucose

3. **Enable Auto-SOS**
   - Toggle "Auto-Trigger SOS" ON
   - This will automatically trigger emergency alerts for critical readings

4. **Configure Notifications**
   - Enable in-app notifications
   - Enable SMS alerts
   - Enable emergency contact notifications

5. **Save Settings**
   - Click "Save Changes"

## 🧪 Test the System

### Test 1: Normal Reading
1. Connect your smartwatch
2. Sync data
3. Should see readings on dashboard
4. No alerts should trigger

### Test 2: Warning Alert
1. Go to Settings
2. Set heart rate warning max to 70 (very low)
3. Sync data from watch
4. Should see yellow warning alert
5. Emergency contacts get notified (if enabled)

### Test 3: Critical Alert & Auto-SOS
1. Go to Settings
2. Enable "Auto-Trigger SOS"
3. Set heart rate critical max to 75 (very low)
4. Sync data from watch
5. Should see red critical alert
6. SOS should trigger automatically
7. All emergency contacts receive SMS
8. Check Emergency page to see SOS record

## 📊 View Your Health Data

### Dashboard Features:
- **Real-time readings**: Latest heart rate, BP, SpO2
- **Historical charts**: Trends over time
- **Statistics**: Total readings, abnormal count, alerts
- **Alert history**: All warnings and critical alerts
- **Auto-sync**: Background monitoring

### Navigation:
- `/health/dashboard` - Main dashboard
- `/health/monitoring` - Monitoring tab (default)
- `/health/sync` - Smartwatch sync tab
- `/health/settings` - Settings tab

## 🆘 SOS Integration

When critical reading detected:
1. ✅ Alert shows on screen
2. ✅ Browser notification sent
3. ✅ SOS emergency created
4. ✅ SMS sent to all emergency contacts
5. ✅ Location captured
6. ✅ Emergency record saved

### View SOS Records:
- Go to Profile → Emergency Contacts
- Click on "Emergency History"
- See all auto-triggered SOS events

## 🔧 Troubleshooting

### Can't see "Connect Smartwatch" button?
- **Solution**: Use Chrome, Edge, or Opera browser
- Firefox and Safari don't support Web Bluetooth

### Connection fails?
- **Solution 1**: Make sure Bluetooth is enabled
- **Solution 2**: Restart your smartwatch
- **Solution 3**: Disconnect watch from other devices
- **Solution 4**: Try again in Chrome/Edge

### No data syncing?
- **Solution 1**: Check if watch supports standard Bluetooth health services
- **Solution 2**: Some watches need manufacturer apps running
- **Solution 3**: Try manual sync button
- **Solution 4**: Check browser console for errors

### Alerts not working?
- **Solution 1**: Enable browser notifications
- **Solution 2**: Check threshold settings
- **Solution 3**: Verify Twilio credentials in .env
- **Solution 4**: Make sure emergency contacts are added

### SMS not sending?
- **Solution 1**: Check Twilio credentials
- **Solution 2**: Verify phone numbers have +91 prefix
- **Solution 3**: Check Twilio account balance
- **Solution 4**: Review backend logs for errors

## 📱 Supported Smartwatches

### Fully Tested:
- ✅ boAt Storm series
- ✅ Mi Band 5/6/7
- ✅ Amazfit Bip/GTS
- ✅ Fitbit Charge/Versa
- ✅ Samsung Galaxy Watch

### Should Work:
- Any Bluetooth LE smartwatch with standard health services
- Devices supporting Heart Rate Service (0x180D)
- Devices supporting Blood Pressure Service (0x1810)

### May Need Manufacturer App:
- Apple Watch (limited Web Bluetooth support)
- Some proprietary smartwatches

## 🎯 Key Features

### Real-Time Monitoring
- Heart rate updates every second
- Automatic abnormality detection
- Instant alerts for dangerous readings

### Auto-Sync
- Background synchronization
- Configurable intervals (1 min - 1 hour)
- Automatic reconnection

### Smart Alerts
- Three severity levels: Normal, Warning, Critical
- Customizable thresholds
- Multiple notification channels

### SOS Integration
- Auto-trigger for critical readings
- SMS to all emergency contacts
- Location tracking
- Emergency record creation

## 📞 Emergency Contact Setup

Before using auto-SOS:

1. **Add Emergency Contacts**
   - Go to Profile → Emergency Contacts
   - Click "Add Contact"
   - Enter name, phone, relationship
   - Mark primary contact
   - Save

2. **Test SMS**
   - Use "Test SMS" button
   - Verify contacts receive messages
   - Update phone numbers if needed

## 🔐 Privacy & Security

- All data encrypted in transit (HTTPS)
- Health data stored securely in MongoDB
- Only you can access your health data
- Bluetooth connection is local (no cloud)
- SMS only to your configured contacts
- You control all settings and thresholds

## 📈 Next Steps

1. ✅ Connect your smartwatch
2. ✅ Configure thresholds
3. ✅ Add emergency contacts
4. ✅ Enable auto-SOS
5. ✅ Test the system
6. ✅ Enable auto-sync
7. ✅ Monitor your health daily

## 🎉 You're All Set!

Your smartwatch is now connected and monitoring your health 24/7. The system will automatically alert you and your emergency contacts if any dangerous readings are detected.

---

**Need Help?**
- Check browser console for errors
- Review backend logs
- Verify all environment variables
- Test with different browsers
- Contact support with error details

**Status**: ✅ Ready to Use
**Last Updated**: December 9, 2025
