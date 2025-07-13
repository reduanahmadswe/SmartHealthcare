import React from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Providers
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import LoadingSpinner from './components/common/LoadingSpinner';
import ProtectedRoute from './components/common/ProtectedRoute';
import RoleRoute from './components/common/RoleRoute';

// Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import LandingPage from './pages/LandingPage';
import NotFoundPage from './pages/NotFoundPage';
import PatientDashboard from './pages/patient/PatientDashboard';

// Styles
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App min-h-screen bg-gray-50">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Protected Routes */}
            <Route
              path="/patient/*"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={['patient']}>
                    <PatientDashboard />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/doctor/*"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={['doctor']}>
                    <DoctorDashboard />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />
            
            {/* Default redirect based on user role */}
            <Route
              path="/dashboard"
              element={<DashboardRedirect />}
            />
            
            {/* 404 Page */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          
          {/* Toast Notifications */}
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

// Component to redirect users to their appropriate dashboard
function DashboardRedirect() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  switch (user.role) {
    case 'patient':
      return <Navigate to="/patient" replace />;
    case 'doctor':
      return <Navigate to="/doctor" replace />;
    case 'admin':
      return <Navigate to="/admin" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

export default App; 