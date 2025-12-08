# Quick Video Call Setup - SIMPLE VERSION

## ✅ What's Implemented

1. **Doctor "Join Call" Button** - Green button in navbar for doctors
2. **Popup Notification** - Doctor enters Room ID
3. **Simple Video Call** - Basic WebRTC connection
4. **Patient Join** - Patient clicks "Join Call" on appointment

## How to Use

### For Doctor:
1. Click green **"Join Call"** button in navbar
2. Enter the **Room ID** from appointment
3. Click **"Join Call"**
4. Wait for patient

### For Patient:
1. Go to **Appointments** page
2. Find your appointment
3. Click **"Join Call"** button
4. Automatically joins with Room ID

## Test Steps

### Step 1: Start Backend
```bash
cd Backend
node server.js
```
Server runs on port 4000

### Step 2: Start Frontend
```bash
cd Frontend
npm run dev
```

### Step 3: Test Call

**Browser 1 (Doctor)**:
1. Login as doctor
2. Click green "Join Call" button in navbar
3. Enter room ID (e.g., "test123")
4. Click "Join Call"

**Browser 2 (Patient)**:
1. Login as patient
2. Go to Appointments
3. Click "Join Call" on appointment
4. OR manually go to: `http://localhost:5173/video-room?roomID=test123`

## Features

- ✅ Camera and microphone access
- ✅ Video toggle on/off
- ✅ Audio mute/unmute
- ✅ End call button
- ✅ Simple WebRTC connection
- ✅ Works with existing Socket.IO server
- ✅ **Works on network (different devices)**
- ✅ **Auto-detects localhost vs network IP**

## Files Created

1. `Frontend/src/components/DoctorCallNotification.jsx` - Popup for doctor
2. `Frontend/src/pages/SimpleVideoCall.jsx` - Simple video call page
3. Updated `Frontend/src/components/Navbar.jsx` - Added "Join Call" button
4. Updated `Frontend/src/App.jsx` - Added route

## Quick Test

### Localhost (Same Computer):
1. Open two browsers
2. Doctor: Click "Join Call" → Enter "test123" → Join
3. Patient: Go to `/video-room?roomID=test123`
4. Both should see each other! ✅

### Network (Different Devices):
1. Find your IP: `ipconfig` (Windows) - Example: 192.168.0.101
2. Device 1 (Doctor): `https://192.168.0.101:5173` → Click "Join Call" → Enter "test123"
3. Device 2 (Patient): `https://192.168.0.101:5173/video-room?roomID=test123`
4. Both should connect! ✅

## Troubleshooting

**No video?**
- Allow camera/microphone permissions
- Check browser console for errors

**Can't connect?**
- Make sure backend is running on port 5000
- Check both users using same Room ID

**Socket error?**
- Backend server must be running
- Check `http://localhost:4000` is accessible

**Mixed Content Error (HTTPS → HTTP)?**
- Use `http://` (not `https://`) for network access
- Example: `http://192.168.0.101:5173` ✅
- NOT: `https://192.168.0.101:5173` ❌

**Connection Timeout?**
- Check firewall allows port 4000
- Make sure backend is accessible: `http://192.168.x.x:4000`
- Both devices on same WiFi network

## Network Setup (For Different Devices)

### Step 1: Find Your IP Address
```bash
# Windows
ipconfig

# Look for: IPv4 Address . . . : 192.168.x.x
```

### Step 2: Access from Network (Use HTTP, not HTTPS)
- Computer: `http://192.168.x.x:5173`
- Phone: `http://192.168.x.x:5173`
- Tablet: `http://192.168.x.x:5173`

**Important**: Use `http://` (not `https://`) for network access to avoid mixed content errors!

### Step 3: Test
1. **Device 1 (Computer - Doctor)**:
   - Go to `http://192.168.0.101:5173` (use HTTP!)
   - Login as doctor
   - Click "Join Call" → Enter "room123"

2. **Device 2 (Phone - Patient)**:
   - Go to `http://192.168.0.101:5173` (use HTTP!)
   - Login as patient
   - Go to Appointments → Click "Join Call"
   - OR go to: `http://192.168.0.101:5173/video-room?roomID=room123`

3. **Video call connects across devices!** ✅

### Important for Network:
- Both devices must be on **same WiFi**
- Use **HTTP** (not HTTPS) for network: `http://192.168.x.x:5173`
- Backend CORS already allows network IPs
- Socket.IO connects to HTTP backend
- Camera/mic will work on HTTP for local network

## That's It!

Simple, basic video call system ready for your submission! 
**Works on localhost AND network!** 🎉
