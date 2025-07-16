// ✅ Load environment variables
const dotenv = require('dotenv');
dotenv.config();

// ✅ Core modules
const http = require('http');
const mongoose = require('mongoose');
const socketIo = require('socket.io');

// ✅ Import express app
const app = require('./app');

// ✅ Config variables
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smart-healthcare';

// ✅ Connect MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("✅ MongoDB connected");
}).catch(err => {
  console.error("❌ MongoDB connection failed:", err);
});

// ✅ Create HTTP server & bind Socket.io
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// ✅ Handle socket connection logic
require('./socket/chatSocket')(io);

// ✅ Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`🔗 API URL: http://localhost:${PORT}/api`);
});

// ✅ Export (for testing or other purposes)
module.exports = { app, server, io };
