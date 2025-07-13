# Smart Healthcare Assistant - Backend API

A comprehensive healthcare management system built with Node.js, Express, and MongoDB.

## 🚀 Features

### Core Features

- **User Authentication & Authorization** - JWT-based authentication with role-based access control
- **Appointment Management** - Book, manage, and track appointments
- **Prescription Management** - Digital prescriptions with medication tracking
- **Medical Records** - Secure storage and management of medical documents
- **Lab Test Management** - Order and track laboratory tests
- **Payment Processing** - Stripe integration for secure payments

### New Features (Latest Implementation)

- **Health Data Analytics** - Comprehensive health data tracking and analytics
- **Real-time Chat** - Secure messaging between patients and doctors
- **Doctor KYC Verification** - Admin verification system for doctors
- **Inventory Management** - Medical supplies and equipment tracking
- **Activity Logging** - Comprehensive system activity monitoring
- **Advanced Analytics** - Health trends and vital signs analysis

## 📁 Project Structure

```
backend/
├── models/                 # Database models
│   ├── User.js           # User model with role-based fields
│   ├── Appointment.js    # Appointment management
│   ├── Prescription.js   # Prescription tracking
│   ├── MedicalRecord.js  # Medical records storage
│   ├── LabTest.js        # Lab test management
│   ├── HealthData.js     # Health data and vitals (NEW)
│   ├── Message.js        # Chat messages (NEW)
│   ├── Inventory.js      # Inventory management (NEW)
│   └── ActivityLog.js    # Activity logging (NEW)
├── routes/               # API routes
│   ├── auth.js          # Authentication routes
│   ├── users.js         # User management
│   ├── doctors.js       # Doctor-specific routes
│   ├── appointments.js  # Appointment management
│   ├── prescriptions.js # Prescription routes
│   ├── medicalRecords.js # Medical records
│   ├── labTests.js      # Lab test routes
│   ├── payments.js      # Payment processing
│   ├── admin.js         # Admin dashboard
│   ├── chat.js          # Real-time chat
│   ├── analytics.js     # Analytics and reporting
│   ├── healthData.js    # Health data routes (NEW)
│   ├── inventory.js     # Inventory routes (NEW)
│   └── logs.js          # Activity logs (NEW)
├── middleware/          # Custom middleware
│   ├── auth.js         # Authentication middleware
│   ├── errorHandler.js # Error handling
│   └── activityLogger.js # Activity logging (NEW)
├── socket/             # WebSocket handlers
│   └── chatSocket.js   # Real-time chat
├── utils/              # Utility functions
│   ├── emailService.js # Email functionality
│   ├── cloudinaryService.js # File uploads
│   └── pdfService.js   # PDF generation
├── server.js           # Main server file
├── package.json        # Dependencies
└── env.example         # Environment variables template
```

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd SmartHealthcare/backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start the server**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

## 🔧 Environment Variables

Copy `env.example` to `.env` and configure:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/smart-healthcare

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

## 📚 API Documentation

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh token

### Health Data (NEW)

- `POST /api/health/add` - Add health data
- `GET /api/health/:userId` - Get user's health data
- `GET /api/health/:userId/latest` - Get latest health data
- `GET /api/health/:userId/vitals` - Get vitals for charts
- `GET /api/health/:userId/abnormal` - Get abnormal readings
- `PUT /api/health/:id` - Update health data
- `DELETE /api/health/:id` - Delete health data

### Chat (NEW)

- `GET /api/chat/conversations/:userId` - Get user conversations
- `GET /api/chat/messages/:conversationId` - Get conversation messages
- `POST /api/chat/send` - Send a message
- `POST /api/chat/send-message` - Send appointment-based message

### Inventory Management (NEW)

- `POST /api/inventory/add` - Add inventory item
- `GET /api/inventory/list` - Get inventory list
- `GET /api/inventory/summary` - Get inventory summary
- `GET /api/inventory/:id` - Get specific item
- `PUT /api/inventory/:id` - Update inventory item
- `PUT /api/inventory/:id/stock` - Update stock
- `DELETE /api/inventory/:id` - Delete inventory item
- `GET /api/inventory/alerts/low-stock` - Low stock alerts
- `GET /api/inventory/alerts/expiring` - Expiring items alerts

### Admin Features (NEW)

- `GET /api/admin/doctors/unverified` - Get unverified doctors
- `POST /api/admin/doctors/verify/:id` - Verify doctor
- `POST /api/admin/doctors/reject/:id` - Reject doctor verification

### Analytics (NEW)

- `GET /api/analytics/vitals/:userId` - Get vitals analytics
- `GET /api/analytics/health-dashboard` - Health dashboard
- `GET /api/analytics/doctor-dashboard` - Doctor analytics

### Activity Logs (NEW)

- `GET /api/logs/admin` - Get system activity logs
- `GET /api/logs/user/:userId` - Get user activity history
- `GET /api/logs/summary` - Get activity summary
- `GET /api/logs/errors` - Get error logs
- `GET /api/logs/security` - Get security events
- `GET /api/logs/export` - Export logs to CSV
- `DELETE /api/logs/cleanup` - Clean up old logs

## 🔐 Role-Based Access Control

### Patient

- View own health data and appointments
- Book appointments with doctors
- Access chat with assigned doctors
- View prescriptions and medical records

### Doctor

- View patient data (with appointment history)
- Manage appointments and prescriptions
- Access chat with patients
- View patient health analytics

### Admin

- Full system access
- Doctor verification
- Inventory management
- Activity monitoring
- System analytics

## 🗄️ Database Models

### HealthData Model (NEW)

- Vital signs (blood pressure, heart rate, temperature, etc.)
- Body measurements (height, weight, BMI)
- Lab results (blood sugar, cholesterol, etc.)
- Lifestyle data (sleep, exercise, water intake)
- Abnormal value detection
- Automatic BMI calculation

### Message Model (NEW)

- Real-time chat messages
- File attachments support
- Read receipts
- Message reactions
- Conversation management

### Inventory Model (NEW)

- Medical supplies tracking
- Stock level monitoring
- Expiry date tracking
- Supplier information
- Location management
- Automatic alerts

### ActivityLog Model (NEW)

- Comprehensive activity tracking
- User action logging
- Security event monitoring
- Performance metrics
- Error tracking

## 🔄 Real-time Features

### WebSocket Chat

- Real-time messaging between patients and doctors
- File sharing capabilities
- Typing indicators
- Read receipts
- Message reactions

### Health Monitoring

- Real-time vital signs tracking
- Abnormal value alerts
- Health trend analysis
- Medication adherence monitoring

## 📊 Analytics & Reporting

### Health Analytics

- Vital signs trends
- BMI tracking
- Blood pressure monitoring
- Heart rate analysis
- Weight management

### System Analytics

- User activity monitoring
- Appointment statistics
- Revenue tracking
- Performance metrics
- Error analysis

## 🛡️ Security Features

- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- Rate limiting
- Activity logging
- Security event monitoring
- Data encryption

## 🚀 Performance Features

- Database indexing for optimal queries
- Pagination for large datasets
- Caching strategies
- Error handling and logging
- Activity monitoring
- Performance metrics

## 📝 Development

### Running in Development

```bash
npm run dev
```

### Running Tests

```bash
npm test
```

### Code Linting

```bash
npm run lint
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@smarthealthcare.com or create an issue in the repository.
