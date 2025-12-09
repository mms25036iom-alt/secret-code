const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require("cookie-parser");
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Allowed origins for CORS
const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://localhost:5173",
    "https://127.0.0.1:5173",
    // Specific IPs
    "http://192.168.0.101:5173",
    "https://192.168.0.101:5173",
    "http://172.20.10.2:5173",
    "https://172.20.10.2:5173",
    // Production URLs
    "https://cureon.vercel.app",
    "https://cureon.netlify.app",
    /^https?:\/\/.*\.vercel\.app$/,
    /^https?:\/\/.*\.netlify\.app$/,
    /^https?:\/\/.*\.onrender\.com$/,
    /^https?:\/\/192\.168\.\d+\.\d+:\d+$/,
    /^https?:\/\/10\.\d+\.\d+\.\d+:\d+$/,
    /^https?:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:\d+$/
];

// Socket.IO setup
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }
});

// WebSocket rooms storage
const rooms = {};

// Store socket instances for doctors
const doctorSockets = new Map();

// Socket.IO connection handling
io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id);

    socket.on("join-room", (data) => {
        // Handle both string roomId and object {roomId, userName, userRole}
        const roomId = typeof data === 'string' ? data : data.roomId;
        const userName = typeof data === 'object' ? data.userName : 'Unknown';
        const userRole = typeof data === 'object' ? data.userRole : 'user';
        
        console.log(`📞 User ${socket.id} (${userName} - ${userRole}) joining room: ${roomId}`);
        
        if (!rooms[roomId]) rooms[roomId] = [];
        
        if (rooms[roomId].length >= 2) {
            console.log(`❌ Room ${roomId} is full.`);
            socket.emit("room-full");
            return;
        }

        rooms[roomId].push({
            socketId: socket.id,
            userName: userName,
            userRole: userRole
        });
        
        socket.join(roomId);
        console.log(`✅ User ${socket.id} (${userName}) joined room ${roomId}. Total users: ${rooms[roomId].length}`);

        // Notify other users in the room
        if (rooms[roomId].length === 1) {
            console.log(`⏳ Waiting for second user in room ${roomId}...`);
        } else if (rooms[roomId].length === 2) {
            console.log(`🎉 Both users in room ${roomId}, signaling ready...`);
            io.to(roomId).emit("ready");
            
            // Notify both users about each other
            const users = rooms[roomId];
            io.to(roomId).emit("room-users", {
                users: users.map(u => ({ userName: u.userName, userRole: u.userRole }))
            });
        }
    });

    socket.on("offer", ({ roomId, offer }) => {
        console.log(`📤 Offer received from ${socket.id} for room ${roomId}`);
        console.log(`📨 Broadcasting offer to room ${roomId}`);
        socket.to(roomId).emit("offer", offer);
    });

    socket.on("answer", ({ roomId, answer }) => {
        console.log(`📤 Answer received from ${socket.id} for room ${roomId}`);
        console.log(`📨 Broadcasting answer to room ${roomId}`);
        socket.to(roomId).emit("answer", answer);
    });

    socket.on("ice-candidate", ({ roomId, candidate }) => {
        console.log(`📤 ICE Candidate received from ${socket.id} for room ${roomId}`);
        socket.to(roomId).emit("ice-candidate", candidate);
    });

    // Handle doctor connection
    socket.on("doctorConnect", (doctorId) => {
        doctorSockets.set(doctorId, socket);
    });

    // Handle emergency notifications
    socket.on("emergencyRequest", async (patientData) => {
        // Notify all connected doctors
        doctorSockets.forEach((doctorSocket) => {
            doctorSocket.emit("emergencyNotification", {
                patientName: patientData.name,
                roomId: "emergency"
            });
        });
    });

    socket.on("disconnect", () => {
        console.log("❌ User disconnected:", socket.id);
        
        // Remove doctor socket on disconnect
        doctorSockets.forEach((value, key) => {
            if (value === socket) {
                doctorSockets.delete(key);
            }
        });
        
        // Clean up rooms
        for (const roomId in rooms) {
            const userIndex = rooms[roomId].findIndex(user => 
                typeof user === 'object' ? user.socketId === socket.id : user === socket.id
            );
            
            if (userIndex !== -1) {
                const user = rooms[roomId][userIndex];
                const userName = typeof user === 'object' ? user.userName : 'Unknown';
                
                rooms[roomId].splice(userIndex, 1);
                console.log(`🚪 User ${socket.id} (${userName}) left room ${roomId}`);
                
                // Notify other users in the room
                socket.to(roomId).emit("user-left", { userName });
                
                // Delete room if empty
                if (rooms[roomId].length === 0) {
                    delete rooms[roomId];
                    console.log(`🗑️  Room ${roomId} deleted (empty)`);
                }
            }
        }
    });
});

// Chat rooms storage
const chatRooms = new Map();

io.of('/chat').on("connection", (socket) => {
    console.log("Chat user connected:", socket.id);
    
    socket.on("join-room", (roomId) => {
        console.log(`💬 Chat join-room request: ${socket.id} -> ${roomId}`);
        
        if (!chatRooms.has(roomId)) {
            chatRooms.set(roomId, new Set([socket.id]));
            console.log(`✅ Created new chat room: ${roomId}`);
        } else if (chatRooms.get(roomId).size < 2) {
            chatRooms.get(roomId).add(socket.id);
            console.log(`✅ Added user to existing chat room: ${roomId}`);
        } else {
            console.log(`❌ Chat room ${roomId} is full`);
            socket.emit("room-full");
            return;
        }

        socket.join(roomId);
        console.log(`✅ Chat user ${socket.id} joined room ${roomId}. Total users: ${chatRooms.get(roomId).size}`);
        
        // Notify user they joined successfully
        socket.emit("joined-room", { roomId, users: chatRooms.get(roomId).size });
    });

    socket.on("user-message", ({ roomId, text }) => {
        console.log(`📨 Message received in room ${roomId}: "${text}" from ${socket.id}`);
        
        const messageData = {
            text,
            sender: socket.id,
            timestamp: new Date().toISOString()
        };
        
        // Emit to all users in the room (including sender)
        io.of('/chat').to(roomId).emit("message", messageData);
        console.log(`✅ Message broadcasted to room ${roomId}`);
    });

    socket.on("disconnect", () => {
        console.log("Chat user disconnected:", socket.id);
        chatRooms.forEach((users, roomId) => {
            users.delete(socket.id);
            if (users.size === 0) {
                chatRooms.delete(roomId);
            }
        });
    });
});

// Middleware
// Add trust proxy to handle Cloudflare
app.set('trust proxy', true);

app.use(cors({
    origin: function(origin, callback) {
        callback(null, true); // allow all origins temporarily for debugging
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['set-cookie']
}));
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

// Database connection
const Appointment = require('./models/appointmentModel');
const User = require('./models/userModel');
const sendReminder = require('./utils/sendReminder');

// Schedule reminders for existing appointments on server start
const scheduleReminders = async () => {
    try {
        const now = new Date();
        const appointments = await Appointment.find({
            status: 'confirmed',
        }).populate('patient doctor');

        appointments.forEach(appointment => {
            const appointmentDateTime = new Date(`${appointment.day}T${appointment.time}`);
            const reminderTime = new Date(appointmentDateTime.getTime() - 5 * 60000);

            if (reminderTime > now) {
                const timeoutDuration = reminderTime.getTime() - now.getTime();
                
                setTimeout(async () => {
                    try {
                        await sendReminder(appointment.patient, {
                            day: appointment.day,
                            time: appointment.time,
                            roomId: appointment.roomId,
                        });
                        await sendReminder(appointment.doctor, {
                            day: appointment.day,
                            time: appointment.time,
                            roomId: appointment.roomId,
                        });
                    } catch (error) {
                        console.error("Failed to send reminder:", error);
                    }
                }, timeoutDuration);
            }
        });
    } catch (error) {
        console.error("Failed to schedule reminders:", error);
    }
};

mongoose.connect(process.env.MONGODB_URI).then(() => {
    scheduleReminders();
});

// Routes
const user = require('./routes/userRoute');
app.use("/api/v1", user);

const appointment = require('./routes/appointmentRoutes');
app.use('/api/v1', appointment);

const pharmacy = require('./routes/pharmacyRoutes');
app.use('/api/v1', pharmacy);
// Analysis routes (image/video analysis)
const analysis = require('./routes/analysisRoutes');
app.use('/api/v1', analysis);
// Emergency routes
const emergency = require('./routes/emergencyRoutes');
app.use('/api/v1/emergency', emergency);

// Health routes
const health = require('./routes/healthRoutes');
app.use('/api/v1/health', health);

// ASHA Worker routes
const asha = require('./routes/ashaRoutes');
app.use('/api/v1/asha', asha);

// 404 handler
app.use("/", (req, res, next) => {
    res.status(404).json({
        status: "fail",
        ok: false,
        message: "No such route founded in server...💣💣💣",
    });
});

// Global error handler (last middleware)
// Ensures controller-thrown errors return proper status instead of generic 500 HTML
app.use((err, req, res, next) => {
    let status = err.statuscode || err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // Normalize common error types
    if (err.name === 'ValidationError') {
        status = 400;
        // Aggregate field messages if available
        const details = Object.values(err.errors || {}).map(e => e.message);
        if (details.length) message = details.join(', ');
    }
    if (err.name === 'CastError') {
        status = 400;
        message = `Invalid ${err.path}: ${err.value}`;
    }
    if (err.code === 11000) {
        status = 400;
        const fields = Object.keys(err.keyValue || {}).join(', ');
        message = `Duplicate value entered for ${fields}`;
    }

    if (process.env.NODE_ENV !== 'production') {
        console.error('Error middleware:', {
            status,
            message,
            stack: err.stack,
        });
    }
    res.status(status).json({ success: false, message });
});

// Make io accessible to routes
app.set('io', io);

// Start server
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Listen on all network interfaces (allows mobile access)
server.listen(PORT, HOST, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Accessible at:`);
    console.log(`   - Local: http://localhost:${PORT}`);
    console.log(`   - Network: http://192.168.0.101:${PORT}`);
    console.log(`   - All interfaces: http://0.0.0.0:${PORT}`);
});