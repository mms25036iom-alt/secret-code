import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Check if HTTPS certificates exist and are valid
let httpsEnabled = false;
try {
  const keyPath = path.resolve(__dirname, 'localhost+3-key.pem');
  const certPath = path.resolve(__dirname, 'localhost+3.pem');
  
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    const keyContent = fs.readFileSync(keyPath, 'utf8');
    const certContent = fs.readFileSync(certPath, 'utf8');
    
    // Check if files contain actual certificates (not placeholders)
    if (keyContent.includes('BEGIN PRIVATE KEY') && certContent.includes('BEGIN CERTIFICATE') &&
        !keyContent.includes('PLACEHOLDER') && !certContent.includes('PLACEHOLDER')) {
      httpsEnabled = true;
      console.log('✅ HTTPS certificates found - enabling HTTPS');
    } else {
      console.log('⚠️  Certificate files exist but are invalid/placeholders - using HTTP');
      console.log('💡 To enable HTTPS, run: cd Frontend && mkcert localhost 127.0.0.1 YOUR_IP ::1');
    }
  } else {
    console.log('ℹ️  No HTTPS certificates found - using HTTP');
    console.log('💡 To enable HTTPS for camera access, run: cd Frontend && mkcert localhost 127.0.0.1 YOUR_IP ::1');
  }
} catch (error) {
  console.log('⚠️  Error checking certificates:', error.message);
  httpsEnabled = false;
}

export default defineConfig({
  plugins: [tailwindcss(), react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'react-toastify']
        }
      }
    }
  },
  server: {
    host: "0.0.0.0", // Listen on all network interfaces (allows access from other devices)
    port: 5173,
    strictPort: true,
    // Enable HTTPS if certificates are available
    ...(httpsEnabled && {
      https: {
        key: fs.readFileSync(path.resolve(__dirname, 'localhost+3-key.pem')),
        cert: fs.readFileSync(path.resolve(__dirname, 'localhost+3.pem')),
      },
    }),
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      "agpatil-frontend.onrender.com",
      "Cureon-0oy1.onrender.com",
      ".onrender.com",
    ],
    hmr: {
      protocol: httpsEnabled ? 'wss' : 'ws', // Use secure websocket if HTTPS is enabled
      host: 'localhost',
      port: 5173,
    },
    proxy: {
      "/api/v1": {
        target: "http://localhost:4000",
        changeOrigin: true,
        secure: false,
        ws: true,
        cookieDomainRewrite: {
          "*": "", // This will rewrite the cookie domain to match the request origin
        },
        configure: (proxy, _options) => {
          proxy.on("error", (err, _req, _res) => {
            console.log("proxy error", err);
          });
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            // Add headers that Cloudflare expects
            proxyReq.setHeader("X-Forwarded-Proto", "https");
            proxyReq.setHeader("Origin", req.headers.host);
            console.log("Sending Request to the Target:", req.method, req.url);
            console.log("Request Headers:", proxyReq.getHeaders());
          });
          proxy.on("proxyRes", (proxyRes, req, _res) => {
            console.log(
              "Received Response from the Target:",
              proxyRes.statusCode,
              req.url
            );
            console.log("Response Headers:", proxyRes.headers);
          });
        },
      },
    },
  },
});
