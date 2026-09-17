require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://workbridge-frontend-jet.vercel.app',
  'https://workbridgeeeee.netlify.app',
  /\.vercel\.app$/
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(o => o instanceof RegExp ? o.test(origin) : o === origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

// Socket.io setup for real-time features
const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'] }
});

// Make io accessible in routes via app.set
app.set('io', io);

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/bids', require('./routes/bids'));
app.use('/api/providers', require('./routes/providers'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/payments',     require('./routes/payments'));
app.use('/api/verification', require('./routes/verification'));

// Serve uploaded docs (protected — only logged-in users can access)
const path = require('path');
app.use('/uploads', (req, res, next) => {
  const { protect } = require('./middleware/auth');
  protect(req, res, next);
}, express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'WorkBridge API running' }));

// Socket.io real-time logic
const connectedUsers = {};

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Register user + broadcast online status
  const registerUser = (userId) => {
    connectedUsers[userId] = socket.id;
    socket._userId = userId;
    console.log(`User ${userId} registered with socket ${socket.id}`);
    // Broadcast to all OTHER sockets that this user is online
    socket.broadcast.emit('user_online', userId);
    // Send current online users list back to this socket
    socket.emit('online_users', Object.keys(connectedUsers));
  };

  socket.on('register', registerUser);
  socket.on('join', registerUser);   // alias for new clients

  // Join a chat room
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
  });

  // Send chat message — emit to room AND directly to receiver if online
  socket.on('send_message', (data) => {
    io.to(data.roomId).emit('receive_message', data);
    // Direct delivery: receiver may not have joined the room yet
    if (data.receiverId) {
      const receiverSocketId = connectedUsers[data.receiverId];
      if (receiverSocketId && receiverSocketId !== socket.id) {
        io.to(receiverSocketId).emit('receive_message', data);
        // Also notify receiver of new unread in their rooms list
        io.to(receiverSocketId).emit('new_message_notification', {
          roomId: data.roomId,
          senderId: data.senderId || socket._userId,
        });
      }
    }
  });

  socket.on('disconnect', () => {
    let offlineUserId = null;
    for (const [userId, sid] of Object.entries(connectedUsers)) {
      if (sid === socket.id) { offlineUserId = userId; delete connectedUsers[userId]; break; }
    }
    if (offlineUserId) {
      socket.broadcast.emit('user_offline', offlineUserId);
    }
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Export connectedUsers so routes can notify specific users
app.set('connectedUsers', connectedUsers);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`WorkBridge server running on port ${PORT}`));
