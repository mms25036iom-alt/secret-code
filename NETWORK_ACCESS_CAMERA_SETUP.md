# Network Access & Camera/Microphone Permissions Setup

## Problem
When accessing the app from a network IP (e.g., `192.168.x.x`), browsers block camera and microphone access because they require either:
1. **HTTPS** (secure connection), OR
2. **localhost/127.0.0.1** (local development exception)

## Solutions

### Option 1: Use HTTPS with Self-Signed Certificate (Recommended)

#### Step 1: Generate Self-Signed Certificate

**On Windows (PowerShell):**
```powershell
# Install mkcert (if not installed)
choco install mkcert

# Create local CA
mkcert -install

# Generate certificate for your local IP
mkcert localhost 127.0.0.1 192.168.1.x ::1
```

**On Mac/Linux:**
```bash
# Install mkcert
brew install mkcert  # Mac
# OR
sudo apt install mkcert  # Linux

# Create local CA
mkcert -install

# Generate certificate for your local IP (replace with your actual IP)
mkcert localhost 127.0.0.1 192.168.1.100 ::1
```

This will create two files:
- `localhost+3.pem` (certificate)
- `localhost+3-key.pem` (private key)

#### Step 2: Update Vite Configuration

Create/update `Frontend/vite.config.js`:

```javascript
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    host: "0.0.0.0", // Listen on all network interfaces
    port: 5173,
    strictPort: true,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'localhost+3-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'localhost+3.pem')),
    },
    hmr: {
      protocol: 'wss', // Use secure websocket
      host: 'localhost',
      port: 5173,
    },
    proxy: {
      "/api/v1": {
        target: "http://localhost:5001",
        changeOrigin: true,
        secure: false,
        ws: true,
        cookieDomainRewrite: {
          "*": "",
        },
      },
    },
  },
});
```

#### Step 3: Update Backend for HTTPS (Optional but Recommended)

Create `Backend/server-https.js`:

```javascript
const https = require('https');
const fs = require('fs');
const path = require('path');
const app = require('./server'); // Your existing server

const options = {
  key: fs.readFileSync(path.resolve(__dirname, '../localhost+3-key.pem')),
  cert: fs.readFileSync(path.resolve(__dirname, '../localhost+3.pem')),
};

const PORT = process.env.PORT || 5001;
https.createServer(options, app).listen(PORT, () => {
  console.log(`🔒 HTTPS Server running on https://localhost:${PORT}`);
});
```

#### Step 4: Access Your App

Now you can access from any device on your network:
- `https://192.168.1.100:5173` (replace with your actual IP)
- Camera and microphone will work! ✅

---

### Option 2: Chrome Flags (Quick but Less Secure)

For testing only, you can enable insecure origins in Chrome:

1. Open Chrome
2. Go to: `chrome://flags/#unsafely-treat-insecure-origin-as-secure`
3. Add your network IP: `http://192.168.1.100:5173`
4. Restart Chrome

**⚠️ Warning:** This is only for testing. Don't use in production!

---

### Option 3: Use ngrok (Easiest for Testing)

ngrok creates a secure tunnel to your local server:

#### Step 1: Install ngrok
```bash
# Download from https://ngrok.com/download
# Or use npm
npm install -g ngrok
```

#### Step 2: Start Your App
```bash
# Terminal 1: Start frontend
cd Frontend
npm run dev

# Terminal 2: Start backend
cd Backend
npm run dev

# Terminal 3: Start Socket.IO
cd Backend
npm run socket:dev
```

#### Step 3: Create Tunnel
```bash
# Tunnel to frontend
ngrok http 5173

# You'll get a URL like: https://abc123.ngrok.io
```

#### Step 4: Access from Any Device
- Open `https://abc123.ngrok.io` on any device
- Camera and microphone will work! ✅

---

### Option 4: Update Vite to Listen on Network (Current Setup)

Your current `vite.config.js` already has `host: "0.0.0.0"`, which allows network access.

#### Find Your Local IP:

**Windows:**
```cmd
ipconfig
# Look for "IPv4 Address" under your active network adapter
```

**Mac/Linux:**
```bash
ifconfig
# Look for "inet" under your active network adapter
```

#### Access from Other Devices:
```
http://YOUR_IP:5173
# Example: http://192.168.1.100:5173
```

**⚠️ Camera/Mic Issue:** Browsers will block camera/microphone on HTTP (non-localhost). You need HTTPS (Option 1) or Chrome flags (Option 2).

---

## Recommended Setup for Production

### 1. Use a Reverse Proxy (nginx)

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/v1 {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2. Use a Domain with SSL Certificate

Deploy to:
- **Vercel** (Frontend) - Free HTTPS
- **Render** (Backend) - Free HTTPS
- **Railway** (Full Stack) - Free HTTPS

All these platforms provide automatic HTTPS, so camera/microphone will work!

---

## Quick Test: Does Camera Work?

Test if your browser allows camera access:

```javascript
// Open browser console and run:
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    console.log('✅ Camera and microphone access granted!');
    stream.getTracks().forEach(track => track.stop());
  })
  .catch(error => {
    console.error('❌ Camera/microphone access denied:', error);
  });
```

---

## Summary

| Method | Difficulty | Security | Best For |
|--------|-----------|----------|----------|
| **HTTPS (mkcert)** | Medium | ✅ High | Local network testing |
| **Chrome Flags** | Easy | ⚠️ Low | Quick testing only |
| **ngrok** | Easy | ✅ High | Remote testing |
| **Production Deploy** | Medium | ✅ High | Real users |

**Recommended:** Use **mkcert** for local network testing, then deploy to a platform with HTTPS for production.

---

## Troubleshooting

### "Camera access denied"
- Check if HTTPS is enabled
- Check browser permissions (Settings → Privacy → Camera)
- Try a different browser (Chrome/Firefox recommended)

### "Certificate not trusted"
- Run `mkcert -install` to install the local CA
- Restart your browser

### "Can't access from phone"
- Make sure phone is on the same WiFi network
- Check firewall settings
- Use HTTPS (Option 1) or ngrok (Option 3)

---

## Need Help?

If you're still having issues:
1. Check browser console for errors
2. Verify your local IP is correct
3. Make sure firewall isn't blocking the port
4. Try accessing from the same device first (localhost)
