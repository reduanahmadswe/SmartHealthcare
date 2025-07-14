# Smart Healthcare Assistant - Frontend

A modern, responsive React.js frontend for the Smart Healthcare Assistant web application. Built with React, Tailwind CSS, and Vite for optimal performance and developer experience.

## 🚀 Features

### 🔐 Authentication & Authorization

- **Role-based Access Control**: Separate dashboards for patients, doctors, and admins
- **JWT Authentication**: Secure token-based authentication
- **Protected Routes**: Automatic redirection based on user roles
- **Login/Register**: Clean authentication forms with validation

### 🏥 Patient Features

- **Health Data Tracking**: Input and visualize vital signs (BP, heart rate, blood sugar, etc.)
- **Appointment Booking**: Schedule appointments with available doctors
- **Prescription Management**: View and download digital prescriptions
- **Medical Reports**: Upload and manage medical documents
- **Real-time Chat**: Communicate with healthcare providers
- **Lab Test Booking**: Schedule and view lab test results
- **Payment Integration**: Secure payment processing
- **Health Analytics**: Charts and trends for health data

### 👨‍⚕️ Doctor Features

- **Patient Management**: View and manage patient records
- **Appointment Management**: Accept/reject appointment requests
- **Digital Prescriptions**: Write and send e-prescriptions
- **Patient Chat**: Real-time communication with patients
- **Medical Reports**: Upload and manage patient reports
- **Analytics Dashboard**: Practice insights and statistics

### 👨‍💼 Admin Features

- **Doctor KYC Verification**: Review and approve doctor registrations
- **System Analytics**: Comprehensive platform analytics
- **Inventory Management**: Track medical supplies and equipment
- **Activity Logs**: Monitor system activities and audit trails
- **User Management**: Manage all platform users

### 🎨 UI/UX Features

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark Mode**: Toggle between light and dark themes
- **Modern Components**: Reusable UI components with consistent styling
- **Loading States**: Smooth loading indicators and transitions
- **Toast Notifications**: User-friendly feedback system
- **Accessibility**: WCAG compliant design patterns

## 🛠️ Tech Stack

### Core Technologies

- **React 18**: Modern React with hooks and functional components
- **Vite**: Fast build tool and development server
- **React Router DOM**: Client-side routing
- **Tailwind CSS**: Utility-first CSS framework

### State Management & Data

- **React Context API**: Global state management
- **React Hook Form**: Form handling and validation
- **Axios**: HTTP client for API communication

### UI Components & Libraries

- **React Icons**: Comprehensive icon library
- **Recharts**: Beautiful and responsive charts
- **React Hot Toast**: Toast notification system
- **React Modal**: Accessible modal components
- **React Dropzone**: File upload functionality
- **React Datepicker**: Date selection components

### Development Tools

- **ESLint**: Code linting and formatting
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixing

## 📁 Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Card.jsx
│   │   ├── Badge.jsx
│   │   ├── Modal.jsx
│   │   └── LoadingSpinner.jsx
│   ├── context/           # React Context providers
│   │   └── AuthContext.jsx
│   ├── layouts/           # Layout components
│   │   ├── DashboardLayout.jsx
│   │   ├── Sidebar.jsx
│   │   └── Navbar.jsx
│   ├── pages/             # Page components
│   │   ├── auth/          # Authentication pages
│   │   ├── dashboard/     # Dashboard pages
│   │   ├── patient/       # Patient-specific pages
│   │   ├── doctor/        # Doctor-specific pages
│   │   └── admin/         # Admin-specific pages
│   ├── services/          # API services
│   │   └── api.js
│   ├── App.jsx           # Main app component
│   ├── main.jsx          # App entry point
│   └── index.css         # Global styles
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend server running (see backend README)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd SmartHealthcare/frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the frontend directory:

   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Start development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

### Available Scripts

```bash
# Development
npm run dev          # Start development server

# Build
npm run build        # Build for production
npm run preview      # Preview production build

# Linting
npm run lint         # Run ESLint
```

## 🔧 Configuration

### Environment Variables

| Variable       | Description     | Default                     |
| -------------- | --------------- | --------------------------- |
| `VITE_API_URL` | Backend API URL | `http://localhost:5000/api` |

### Tailwind Configuration

The project uses a custom Tailwind configuration with:

- Custom color palette for healthcare theme
- Dark mode support
- Custom animations and transitions
- Responsive breakpoints
- Custom component classes

### Vite Configuration

- Proxy configuration for API calls
- React plugin for JSX support
- Development server on port 3000

## 🎨 Component Library

### Core Components

#### Button

```jsx
<Button variant="primary" size="md" loading={false}>
  Click me
</Button>
```

#### Input

```jsx
<Input
  label="Email"
  type="email"
  required
  error={errors.email?.message}
  {...register("email")}
/>
```

#### Card

```jsx
<Card>
  <Card.Header>
    <Card.Title>Title</Card.Title>
    <Card.Description>Description</Card.Description>
  </Card.Header>
  <Card.Content>Content here</Card.Content>
</Card>
```

#### Modal

```jsx
<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Modal Title"
>
  Modal content
</Modal>
```

## 🔐 Authentication Flow

1. **Login/Register**: Users authenticate through forms
2. **JWT Storage**: Tokens stored in localStorage
3. **Route Protection**: ProtectedRoute component checks authentication
4. **Role-based Access**: Users redirected to appropriate dashboards
5. **Auto-logout**: Token expiration handling

## 📱 Responsive Design

The application is fully responsive with:

- **Mobile-first approach**: Optimized for mobile devices
- **Breakpoint system**: Tailwind's responsive utilities
- **Touch-friendly**: Large touch targets and gestures
- **Progressive enhancement**: Works on all device sizes

## 🌙 Dark Mode

Dark mode is implemented with:

- **CSS Variables**: Dynamic theme switching
- **Tailwind Classes**: Dark mode utilities
- **User Preference**: Respects system preferences
- **Toggle Control**: Manual theme switching

## 📊 Charts & Analytics

Health data visualization using Recharts:

- **Line Charts**: Health trends over time
- **Bar Charts**: Appointment statistics
- **Pie Charts**: User distribution
- **Responsive**: Charts adapt to container size

## 🔄 State Management

### AuthContext

- User authentication state
- Login/logout functions
- Token management
- Role-based routing

### Local State

- Component-specific state with useState
- Form state with React Hook Form
- Loading states and error handling

## 🚀 Performance Optimizations

- **Code Splitting**: Route-based code splitting
- **Lazy Loading**: Components loaded on demand
- **Memoization**: React.memo for expensive components
- **Bundle Optimization**: Vite's build optimizations
- **Image Optimization**: Responsive images and lazy loading

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📦 Build & Deployment

### Production Build

```bash
npm run build
```

### Deployment Options

- **Vercel**: Zero-config deployment
- **Netlify**: Static site hosting
- **AWS S3**: Static website hosting
- **Docker**: Containerized deployment

### Environment Variables for Production

```env
VITE_API_URL=https://your-backend-api.com/api
```

## 🔧 Development Guidelines

### Code Style

- **ESLint**: Enforced code style
- **Prettier**: Code formatting
- **React Hooks**: Functional components with hooks
- **TypeScript**: Consider migrating for better type safety

### Component Guidelines

- **Single Responsibility**: One purpose per component
- **Props Interface**: Clear prop definitions
- **Error Boundaries**: Graceful error handling
- **Accessibility**: ARIA labels and semantic HTML

### State Management

- **Local State**: Use useState for component state
- **Global State**: Use Context for shared state
- **Form State**: Use React Hook Form
- **API State**: Use custom hooks for API calls

## 🐛 Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Check backend server is running
   - Verify VITE_API_URL in .env
   - Check CORS configuration

2. **Build Errors**
   - Clear node_modules and reinstall
   - Check for missing dependencies
   - Verify import paths

3. **Styling Issues**
   - Check Tailwind classes
   - Verify dark mode classes
   - Check CSS specificity

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
- Check the documentation
- Review the troubleshooting section

---

**Built with ❤️ for better healthcare**
