# Video Call Connection - Debug Guide

## ✅ WebSocket Code Fixed!

I've updated the WebSocket implementation to properly handle video call connections between doctor and patient.

## What Was Fixed

### 1. Backend Socket.IO Handler (server.js)
- ✅ Now handles both string roomId and object {roomId, userName, userRole}
- ✅ Stores user information (name, role) with socket
- ✅ Better logging with emojis for easy debugging
- ✅ Proper room cleanup on disconnect
- ✅ Notifies users when someone joins/leaves
- ✅ Broadcasts room users to all participants

### 2. Frontend VideoCallRoom (VideoCallRoom.jsx)
- ✅ Added connection error handling
- ✅ Added reconnection notifications
- ✅ Shows toast messages for connection events
- ✅ Handles user-left events properly
- ✅ Displays room users information
- ✅ Better logging for debugging

## How to Test

### Step 1: Restart Backend Server
```bash
cd Backend
npm run dev
```

**Look for these logs**:
```
Server running on port 5000
✅ User connected: [socket-id]
```

### Step 2: Open Two Browsers

**Browser 1 (Chrome) - Doctor**:
1. Go to `https://localhost:5173`
2. Login as doctor
3. Go to Appointments
4. Click "Join Call" on an appointment
5. **Check browser console** - you should see:
   ```
   🔌 Connecting to video call socket: http://localhost:5000
   ✅ Connected to signaling server
   📞 Joining room: [roomId] as [doctor-name] (doctor)
   ⏳ Waiting for other participant...
   ```

**Browser 2 (Firefox) - Patient**:
1. Go to `https://localhost:5173`
2. Login as patient (same appointment)
3. Go to Appointments
4. Click "Join Call" on same appointment
5. **Check browser console** - you should see:
   ```
   🔌 Connecting to video call socket: http://localhost:5000
   ✅ Connected to signaling server
   📞 Joining room: [roomId] as [patient-name] (user)
   ✅ Both users in room, creating offer
   📥 Received offer
   📤 Sending answer
   ✅ Received remote stream
   Connected
   ```

### Step 3: Check Backend Logs

You should see in the backend terminal:
```
✅ User connected: [socket-id-1]
📞 User [socket-id-1] (Doctor Name - doctor) joining room: [roomId]
✅ User [socket-id-1] (Doctor Name) joined room [roomId]. Total users: 1
⏳ Waiting for second user in room [roomId]...

✅ User connected: [socket-id-2]
📞 User [socket-id-2] (Patient Name - user) joining room: [roomId]
✅ User [socket-id-2] (Patient Name) joined room [roomId]. Total users: 2
🎉 Both users in room [roomId], signaling ready...

📤 Offer received from [socket-id-1] for room [roomId]
📨 Broadcasting offer to room [roomId]

📤 Answer received from [socket-id-2] for room [roomId]
📨 Broadcasting answer to room [roomId]

📤 ICE Candidate received from [socket-id-1] for room [roomId]
📤 ICE Candidate received from [socket-id-2] for room [roomId]
```

## Troubleshooting

### Issue: "Failed to connect to server"

**Check**:
1. Backend server is running on port 5000
2. No firewall blocking port 5000
3. Browser console shows the correct socket URL

**Fix**:
```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000

# If blocked, kill the process or use different port
```

### Issue: "Waiting for other participant..." forever

**Causes**:
- Other user hasn't joined yet
- Different roomId being used
- Socket connection failed for one user

**Debug**:
1. Check both browser consoles for roomId
2. Verify both users see same roomId in URL
3. Check backend logs to see if both users joined

**Fix**:
```javascript
// In browser console, check roomId:
console.log(new URLSearchParams(window.location.search).get('roomID'));
```

### Issue: "Room is full"

**Cause**: Room already has 2 users

**Fix**:
1. End call for existing users
2. Refresh page
3. Try joining again

### Issue: No video/audio

**Causes**:
- Camera/microphone permissions denied
- WebRTC connection failed
- ICE candidates not exchanging

**Debug**:
1. Check browser console for getUserMedia errors
2. Check browser console for WebRTC errors
3. Check backend logs for ICE candidate exchanges

**Fix**:
```javascript
// In browser console, check permissions:
navigator.permissions.query({name: 'camera'}).then(result => console.log(result.state));
navigator.permissions.query({name: 'microphone'}).then(result => console.log(result.state));
```

### Issue: Socket connection keeps reconnecting

**Causes**:
- Network instability
- CORS issues
- Backend server restarting

**Fix**:
1. Check network connection
2. Verify CORS settings in server.js
3. Check backend server logs for errors

## Connection Flow

### Successful Connection:
```
1. User A (Doctor) opens video room
   ↓
2. Socket connects to server
   ↓
3. Emits 'join-room' with {roomId, userName, userRole}
   ↓
4. Server adds user to room
   ↓
5. Server logs: "Waiting for second user..."
   ↓
6. User B (Patient) opens video room
   ↓
7. Socket connects to server
   ↓
8. Emits 'join-room' with {roomId, userName, userRole}
   ↓
9. Server adds user to room
   ↓
10. Server emits 'ready' to both users
   ↓
11. User A creates WebRTC offer
   ↓
12. Server relays offer to User B
   ↓
13. User B creates WebRTC answer
   ↓
14. Server relays answer to User A
   ↓
15. Both exchange ICE candidates
   ↓
16. WebRTC peer connection established
   ↓
17. Video/audio streaming! ✅
```

## Quick Debug Commands

### Check Socket Connection (Browser Console):
```javascript
// Check if socket is connected
console.log('Socket connected:', socketRef.current?.connected);

// Check room ID
console.log('Room ID:', new URLSearchParams(window.location.search).get('roomID'));

// Check local stream
console.log('Local stream:', localVideoRef.current?.srcObject);

// Check remote stream
console.log('Remote stream:', remoteVideoRef.current?.srcObject);

// Check peer connection state
console.log('Peer connection state:', peerConnectionRef.current?.connectionState);
```

### Check Backend (Terminal):
```bash
# Check if server is running
curl http://localhost:5000

# Check Socket.IO endpoint
curl http://localhost:5000/socket.io/

# View server logs
# Should show connection messages
```

## Expected Behavior

### When Working Correctly:

1. **Doctor joins**:
   - Toast: "Connected to server"
   - Status: "Waiting for other participant..."
   - Local video shows doctor's camera

2. **Patient joins**:
   - Toast: "Connected to server"
   - Toast: "[Doctor Name] (doctor) joined the call"
   - Status: "Connecting to peer..."
   - Both see each other's video
   - Status: "Connected"

3. **During call**:
   - Both can see/hear each other
   - Controls work (mute, camera, screen share)
   - Connection status shows "Connected"

4. **When user leaves**:
   - Toast: "[User Name] left the call"
   - Remote video disappears
   - Status: "Other participant left"

## Network Testing

### For Network Access (Different Devices):

1. **Find your IP**:
   ```bash
   ipconfig  # Windows
   # Look for IPv4 Address: 192.168.x.x
   ```

2. **Update socket URL** (already done):
   - Frontend automatically uses correct URL
   - Backend CORS allows network IPs

3. **Test**:
   - Device 1: `https://192.168.x.x:5173`
   - Device 2: `https://192.168.x.x:5173`
   - Both should connect!

## Summary

✅ **WebSocket code is now fixed and improved!**

**Key Improvements**:
- Better error handling
- Detailed logging
- User information tracking
- Proper room cleanup
- Connection status notifications
- Reconnection support

**To test**: Just restart the backend server and try connecting with two browsers!

If you still have issues, check the browser console and backend logs - they now have detailed debugging information! 🎉
