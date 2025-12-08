# Final Setup - Video Call System

## ✅ Everything is Ready!

### Ports Configuration:
- **Backend**: Port 4000
- **Frontend**: Port 5173
- **Socket.IO**: Port 4000 (same as backend)

## Quick Start

### 1. Start Backend
```bash
cd Backend
node server.js
```
✅ Server running on port 4000

### 2. Start Frontend
```bash
cd Frontend
npm run dev
```
✅ Frontend running on port 5173

## Test Video Call

### Localhost Test:
1. **Browser 1 (Doctor)**:
   - Go to `http://localhost:5173`
   - Login as doctor
   - Click green "Join Call" button
   - Enter room ID: `test123`
   - Click "Join Call"

2. **Browser 2 (Patient)**:
   - Go to `http://localhost:5173`
   - Login as patient
   - Go to Appointments
   - Click "Join Call" on appointment
   - OR go to: `http://localhost:5173/video-room?roomID=test123`

### Network Test (Different Devices):
1. **Find your IP**: `ipconfig` → Example: 192.168.0.101

2. **Device 1 (Doctor)**:
   - Go to `http://192.168.0.101:5173`
   - Login as doctor
   - Click "Join Call" → Enter "room123"

3. **Device 2 (Patient)**:
   - Go to `http://192.168.0.101:5173`
   - Login as patient
   - Go to Appointments → Click "Join Call"

## Features Working:
- ✅ Doctor "Join Call" button in navbar
- ✅ Popup to enter Room ID
- ✅ **Professional ZegoCloud video call**
- ✅ HD video/audio with built-in UI
- ✅ Screen sharing
- ✅ Camera/microphone controls
- ✅ Works on localhost
- ✅ Works on network (HTTP)
- ✅ Works on mobile devices
- ✅ Patient joins from appointment

## Important Notes:
- Use **HTTP** (not HTTPS) for network: `http://192.168.x.x:5173`
- Both devices must be on **same WiFi**
- Backend must be running on port 4000
- Frontend proxy configured for port 4000

## Ready for Submission! 🎉
