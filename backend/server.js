const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const doctorRoutes = require('./routes/doctors');
const appointmentRoutes = require('./routes/appointments');
const prescriptionRoutes = require('./routes/prescriptions');
const medicalRecordsRoutes = require('./routes/medicalRecords');
const labTestRoutes = require('./routes/labTests');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');
const chatRoutes = require('./routes/chat');
const analyticsRoutes = require('./routes/analytics');
const healthDataRoutes = require('./routes/healthData');
const inventoryRoutes = require('./routes/inventory');
const logsRoutes = require('./routes/logs');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static('uploads'));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-healthcare', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Socket.io connection handling
require('./socket/chatSocket')(io);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', authenticateToken, appointmentRoutes);
app.use('/api/prescriptions', authenticateToken, prescriptionRoutes);
app.use('/api/medical-records', authenticateToken, medicalRecordsRoutes);
app.use('/api/lab-tests', authenticateToken, labTestRoutes);
app.use('/api/payments', authenticateToken, paymentRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);
app.use('/api/chat', authenticateToken, chatRoutes);
app.use('/api/analytics', authenticateToken, analyticsRoutes);
app.use('/api/health', authenticateToken, healthDataRoutes);
app.use('/api/inventory', authenticateToken, inventoryRoutes);
app.use('/api/logs', authenticateToken, logsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Smart Healthcare Assistant API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;


server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`🔗 API URL: http://localhost:${PORT}/api`);
});

module.exports = { app, server, io }; 