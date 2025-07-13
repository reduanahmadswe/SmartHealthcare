# Smart Healthcare Assistant

A comprehensive digital healthcare platform built with React.js, Node.js, and MongoDB. This application provides a complete healthcare management system for patients, doctors, and administrators.

## 🚀 Features

### For Patients
- **Health Monitoring**: Track vital signs and health metrics
- **Appointment Booking**: Schedule consultations with doctors
- **Prescription Management**: View and download prescriptions
- **Real-time Chat**: Communicate with healthcare providers
- **Health Analytics**: View detailed health reports and trends

### For Doctors
- **Patient Management**: View patient records and history
- **Appointment Management**: Manage appointments and schedules
- **Prescription Creation**: Generate and manage prescriptions
- **Chat System**: Real-time communication with patients
- **Availability Management**: Set and manage availability slots

### For Administrators
- **User Management**: Manage patients, doctors, and staff
- **Doctor Verification**: KYC verification for healthcare providers
- **Analytics Dashboard**: View platform statistics and reports
- **System Management**: Configure platform settings

## 🛠️ Tech Stack

### Frontend
- **React.js 18** - Modern React with hooks
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **React Hook Form** - Form handling and validation
- **React Toastify** - Toast notifications
- **Chart.js** - Data visualization
- **Socket.io Client** - Real-time communication

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **Socket.io** - Real-time features
- **Multer** - File uploads
- **Nodemailer** - Email service

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp env.example .env
   ```

4. **Configure environment variables:**
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/smart-healthcare
   JWT_SECRET=your_jwt_secret_here
   JWT_EXPIRE=7d
   FRONTEND_URL=http://localhost:3000
   ```

5. **Start the backend server:**
   ```bash
   npm start
   ```

### Frontend Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Open your browser and navigate to:**
   ```
   http://localhost:3000
   ```

## 🏗️ Project Structure

```
SmartHealthcare/
├── backend/                 # Backend API
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── utils/              # Utility functions
│   └── server.js           # Main server file
├── src/                    # Frontend source
│   ├── components/         # Reusable components
│   ├── pages/             # Page components
│   ├── services/           # API services
│   ├── context/            # React context
│   ├── hooks/              # Custom hooks
│   └── utils/              # Utility functions
├── public/                 # Static files
└── package.json            # Frontend dependencies
```

## 🔐 Authentication

The application uses JWT (JSON Web Tokens) for authentication. Users can register with different roles:

- **Patient**: Access health services and manage care
- **Doctor**: Provide healthcare services
- **Admin**: Manage platform operations

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## 🎨 UI/UX Features

- **Modern Design**: Clean and professional interface
- **Dark/Light Mode**: Theme switching capability
- **Animations**: Smooth transitions and micro-interactions
- **Accessibility**: WCAG compliant design
- **Mobile-First**: Optimized for mobile devices

## 🔧 Development

### Available Scripts

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### Code Style

The project uses:
- **ESLint** for code linting
- **Prettier** for code formatting
- **React Hook Form** for form validation
- **TypeScript** support (optional)

## 🚀 Deployment

### Frontend Deployment

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Deploy to your preferred hosting service:**
   - Vercel
   - Netlify
   - AWS S3
   - Firebase Hosting

### Backend Deployment

1. **Set up environment variables for production**
2. **Deploy to your preferred hosting service:**
   - Heroku
   - AWS EC2
   - DigitalOcean
   - Railway

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔮 Future Enhancements

- **AI Integration**: Machine learning for health predictions
- **Telemedicine**: Video call integration
- **IoT Integration**: Health device connectivity
- **Multi-language**: Internationalization support
- **Advanced Analytics**: Predictive health insights
- **Mobile App**: React Native application

---

**Smart Healthcare Assistant** - Transforming healthcare through technology and compassion. 