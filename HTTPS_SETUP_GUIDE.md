# HTTPS Setup Guide for Medical AI Assistant

## Overview
This guide helps you set up HTTPS servers to fix the "Mixed Content" error in the Medical AI Assistant and other WebSocket connections.

## Problem
When the frontend runs on HTTPS (https://localhost:5173) but tries to connect to HTTP backend servers, browsers block the connection due to Mixed Content security policy.

## Solution
Run both frontend and backend on HTTPS using SSL certificates.

## Setup Steps

### 1. Backend HTTPS Setup

The backend already has SSL certificates (`localhost.pem` and `localhost-key.pem`).

#### Start HTTPS Backend Server (Port 4000)
```bash
# Option 1: Using batch file (Windows)
cd Cureon/Backend
start-https-server.bat

# Option 2: Using PowerShell
cd Cureon/Backend
.\start-https-server.ps1

# Option 3: Direct command
cd Cureon/Backend
node https-server.js
```

#### Start HTTPS Socket Server (Port 5001)
```bash
# Option 1: Using batch file (Windows)
cd Cureon/Backend
start-https-socket-server.bat

# Option 2: Using PowerShell
cd Cureon/Backend
.\start-https-socket-server.ps1

# Option 3: Direct command
cd Cureon/Backend
node https-socketServer.js
```

### 2. Frontend HTTPS Setup

The frontend `.env` file has been updated to use HTTPS URLs:
```
VITE_API_URL=https://localhost:4000
```

#### Start Frontend with HTTPS
```bash
cd Cureon/Frontend
npm run dev -- --https
```

### 3. Certificate Trust (Important!)

Since we're using self-signed certificates, you need to trust them in your browser:

1. **Visit Backend URLs in Browser:**
   - Go to `https://localhost:4000` 
   - Go to `https://localhost:5001`
   - Click "Advanced" → "Proceed to localhost (unsafe)" for each

2. **Accept Certificate Warnings:**
   - Your browser will show security warnings
   - This is normal for self-signed certificates
   - Click "Accept" or "Continue" to trust the certificates

### 4. Verification

After setup, verify everything works:

1. **Backend Health Check:**
   - Visit: `https://localhost:4000/health` (should show server status)
   - Visit: `https://localhost:5001/health` (should show socket server status)

2. **Frontend Connection:**
   - Open: `https://localhost:5173`
   - Open Medical AI Assistant
   - Check browser console - should see successful WebSocket connections

3. **No Mixed Content Errors:**
   - Browser console should be free of Mixed Content warnings
   - WebSocket connections should use WSS (secure WebSocket)

## Troubleshooting

### Common Issues:

1. **Certificate Not Trusted:**
   - Manually visit backend URLs and accept certificates
   - Clear browser cache and cookies

2. **Port Already in Use:**
   - Kill existing processes on ports 4000/5001
   - Use different ports in environment variables

3. **WebSocket Connection Failed:**
   - Ensure both HTTPS servers are running
   - Check firewall settings
   - Verify certificate trust

### Console Logs to Look For:

**Success:**
```
✅ Connected to signaling server
🔌 Connecting to: https://localhost:4000
🔒 HTTPS Server running on port 4000
```

**Errors to Fix:**
```
Mixed Content: The page at 'https://...' was loaded over HTTPS, but attempted to connect to the insecure WebSocket endpoint 'ws://...'
```

## Files Modified

### New HTTPS Server Files:
- `Cureon/Backend/https-server.js`
- `Cureon/Backend/https-socketServer.js`
- `Cureon/Backend/start-https-server.bat`
- `Cureon/Backend/start-https-server.ps1`
- `Cureon/Backend/start-https-socket-server.bat`
- `Cureon/Backend/start-https-socket-server.ps1`

### Updated Frontend Files:
- `Cureon/Frontend/.env` (API URL changed to HTTPS)
- `Cureon/Frontend/src/components/MedicalAssistant.jsx` (Fixed API retry logic)
- `Cureon/Frontend/src/pages/VideoCallRoom.jsx` (HTTPS socket connection)
- `Cureon/Frontend/src/pages/SimpleVideoCall.jsx` (HTTPS socket connection)
- `Cureon/Frontend/src/components/VideoCallNotificationListener.jsx` (HTTPS socket connection)
- `Cureon/Frontend/src/components/Chat/Chat.jsx` (HTTPS socket connection)

## Quick Start Commands

```bash
# Terminal 1: Start HTTPS Backend
cd Cureon/Backend
node https-server.js

# Terminal 2: Start HTTPS Socket Server  
cd Cureon/Backend
node https-socketServer.js

# Terminal 3: Start Frontend with HTTPS
cd Cureon/Frontend
npm run dev -- --https

# Then visit: https://localhost:5173
# Accept certificate warnings for all HTTPS URLs
```

## API Key Fixes

The Medical AI Assistant now has improved API key rotation:
- Fixed recursive call issues
- Added proper retry delays (1 second between attempts)
- Better error handling and user-friendly messages
- Prevents infinite loops with retry count limits
- Preserves technical errors for proper API key rotation

## Network Access

For network access (other devices on same network):
1. Replace `localhost` with your machine's IP address in all URLs
2. Ensure SSL certificates cover your IP address
3. Configure firewall to allow HTTPS traffic on ports 4000, 5001, 5173