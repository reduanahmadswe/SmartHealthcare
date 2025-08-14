// ✅ Core imports
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// ✅ Middleware & routes
const { errorHandler } = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');
const routes = require('./routes');

const app = express();

// ✅ Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// ✅ Rate limiters
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000000
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Too many login attempts, please try again later.'
});

// ✅ Apply limiters
if (process.env.NODE_ENV === 'production') {
  app.use('/api/', limiter);
}
app.use('/api/auth/', authLimiter);

// ✅ Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Serve static uploads
app.use('/uploads', express.static('uploads'));

// ✅ Skip token validation for /auth routes and test endpoints
function authenticateTokenUnlessAuth(req, res, next) {
  if (req.path.startsWith('/auth') || 
      req.path === '/appointments/test' || 
      req.path === '/appointments/test-unique-id') {
    return next();
  }
  authenticateToken(req, res, next);
}

// ✅ Main routes mount
app.use('/api', authenticateTokenUnlessAuth, routes);

// ✅ Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Smart Healthcare Assistant API is running',
    timestamp: new Date().toISOString()
  });
});

// ✅ Global error handler
app.use(errorHandler);

// ✅ 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ✅ Export app
module.exports = app;
