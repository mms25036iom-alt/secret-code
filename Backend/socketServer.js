const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://localhost:5173",
      "https://localhost:3000",
      /^https?:\/\/192\.168\.\d+\.\d+:\d+$/,  // Allow local network (192.168.x.x)
      /^https?:\/\/10\.\d+\.\d+\.\d+:\d+$/,   // Allow 10.x.x.x network
      /^https?:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:\d+$/  // Allow 172.16-31.x.x
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Store active rooms and their participants with user info
const rooms = new Map();
const userInfo = new Map(); // Store user information

io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  // Handle user joining a room with user information
  socket.on('join-room', ({ roomId, userName, userRole }) => {
    console.log(`📞 User ${socket.id} (${userName}) attempting to join room: ${roomId}`);
    
    // Store user information
    userInfo.set(socket.id, { userName, userRole, roomId });
    
    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    
    const room = rooms.get(roomId);
    
    // Check if room is full (max 2 users for 1-on-1 consultation)
    if (room.size >= 2) {
      console.log(`❌ Room ${roomId} is full`);
      socket.emit('room-full');
      return;
    }
    
    // Notify other users in the room that someone is joining
    if (room.size === 1) {
      socket.to(roomId).emit('user-joining', {
        roomId,
        callerName: userName,
        callerRole: userRole,
        socketId: socket.id
      });
      console.log(`📢 Notified existing user in room ${roomId} about ${userName} joining`);
    }
    
    // Join the room
    socket.join(roomId);
    room.add(socket.id);
    
    console.log(`✅ User ${socket.id} (${userName}) joined room ${roomId}. Total users: ${room.size}`);
    
    // If this is the second user, notify both users to start WebRTC connection
    if (room.size === 2) {
      console.log(`🎉 Room ${roomId} is ready with 2 users. Starting WebRTC handshake...`);
      io.to(roomId).emit('ready');
    } else {
      console.log(`⏳ Room ${roomId} waiting for second user...`);
    }
  });

  // Relay WebRTC offer
  socket.on('offer', ({ roomId, offer }) => {
    console.log(`📤 Relaying offer in room: ${roomId}`);
    socket.to(roomId).emit('offer', offer);
  });

  // Relay WebRTC answer
  socket.on('answer', ({ roomId, answer }) => {
    console.log(`📤 Relaying answer in room: ${roomId}`);
    socket.to(roomId).emit('answer', answer);
  });

  // Relay ICE candidates
  socket.on('ice-candidate', ({ roomId, candidate }) => {
    console.log(`📤 Relaying ICE candidate in room: ${roomId}`);
    socket.to(roomId).emit('ice-candidate', candidate);
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    const user = userInfo.get(socket.id);
    console.log('❌ User disconnected:', socket.id, user?.userName || '');
    
    // Remove user from all rooms
    rooms.forEach((room, roomId) => {
      if (room.has(socket.id)) {
        room.delete(socket.id);
        console.log(`🚪 User ${socket.id} left room ${roomId}. Remaining users: ${room.size}`);
        
        // Notify other user in the room
        socket.to(roomId).emit('user-left', {
          userName: user?.userName,
          userRole: user?.userRole
        });
        
        // Clean up empty rooms
        if (room.size === 0) {
          rooms.delete(roomId);
          console.log(`🗑️  Room ${roomId} deleted (empty)`);
        }
      }
    });
    
    // Clean up user info
    userInfo.delete(socket.id);
  });

  // Handle explicit leave room
  socket.on('leave-room', (roomId) => {
    console.log(`🚪 User ${socket.id} leaving room: ${roomId}`);
    
    if (rooms.has(roomId)) {
      const room = rooms.get(roomId);
      room.delete(socket.id);
      socket.leave(roomId);
      
      // Notify other user
      socket.to(roomId).emit('user-left');
      
      // Clean up empty rooms
      if (room.size === 0) {
        rooms.delete(roomId);
        console.log(`🗑️  Room ${roomId} deleted (empty)`);
      }
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    activeRooms: rooms.size,
    timestamp: new Date().toISOString()
  });
});

// Get room info endpoint (for debugging)
app.get('/rooms', (req, res) => {
  const roomInfo = {};
  rooms.forEach((users, roomId) => {
    roomInfo[roomId] = {
      users: Array.from(users),
      count: users.size
    };
  });
  res.json(roomInfo);
});

const PORT = process.env.SOCKET_PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀 Socket.IO signaling server running on port ${PORT}`);
  console.log(`📡 Ready to handle video call connections`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
