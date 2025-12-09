import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

// Mobile-optimized Vite configuration for Capacitor
export default defineConfig({
  plugins: [tailwindcss(), react()],
  
  // Important: Use relative paths for Capacitor
  base: './',
  
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    
    // Optimize bundle size
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'redux-vendor': ['redux', 'react-redux', 'redux-persist', 'redux-thunk'],
          'ui-vendor': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          'video-vendor': ['@zegocloud/zego-uikit-prebuilt', 'socket.io-client'],
          'payment-vendor': ['@stripe/stripe-js', '@stripe/react-stripe-js'],
          'utils-vendor': ['axios', 'i18next', 'react-i18next']
        }
      }
    },
    
    // Terser options for better minification
    terserOptions: {
      compress: {
        drop_console: false, // Keep console.logs for debugging video call issues
        drop_debugger: true
      }
    },
    
    // Chunk size warnings
    chunkSizeWarningLimit: 1000
  },
  
  // Optimize dependencies
  optimizeDeps: {
    exclude: [
      '@capacitor/core',
      '@capacitor/camera',
      '@capacitor/geolocation',
      '@capacitor/network',
      '@capacitor/push-notifications',
      '@capacitor/local-notifications',
      '@capacitor/splash-screen',
      '@capacitor/status-bar',
      '@capacitor/app',
      '@capacitor/browser',
      '@capacitor/filesystem',
      '@capacitor/share',
      '@capacitor/toast',
      '@capacitor/haptics',
      '@capacitor/keyboard',
      '@capacitor/device'
    ],
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios'
    ]
  },
  
  // Server configuration (for development)
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173
    }
  },
  
  // Preview configuration
  preview: {
    host: "0.0.0.0",
    port: 5173
  },
  
  // Define global constants
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    '__APP_VERSION__': JSON.stringify(process.env.npm_package_version || '1.0.0')
  }
});
