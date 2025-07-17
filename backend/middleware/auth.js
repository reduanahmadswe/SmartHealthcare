const jwt = require('jsonwebtoken');
const User = require('../modules/user/user.model');

// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token is required' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Account is deactivated' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired' 
      });
    }
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication error' 
    });
  }
};

// Middleware to check if user is verified
const requireVerification = async (req, res, next) => {
  try {
    if (!req.user.isVerified) {
      return res.status(403).json({ 
        success: false, 
        message: 'Account verification required' 
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Verification check error' 
    });
  }
};

// Middleware to check specific roles
const requireRole = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ 
          success: false, 
          message: `Access denied. Required roles: ${roles.join(', ')}` 
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        message: 'Role verification error' 
      });
    }
  };
};

// Middleware to check if user is patient
const requirePatient = requireRole('patient');

// Middleware to check if user is doctor
const requireDoctor = requireRole('doctor');

// Middleware to check if user is a lab
const requireLab = (req, res, next) => { 
    if (req.user && req.user.role === 'lab') {
        next();
    } else {
        res.status(403).json({ message: 'Access Denied: Requires Lab Role!' });
    }
};

// Middleware to check if user is admin
const requireAdmin = requireRole('admin');

// Middleware to check if user is doctor or admin
const requireDoctorOrAdmin = requireRole('doctor', 'admin');

// Middleware to check if user is patient or doctor
const requirePatientOrDoctor = requireRole('patient', 'doctor');

// Middleware to check resource ownership (for patients)
const requireOwnership = (resourceModel) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id;
      const resource = await resourceModel.findById(resourceId);

      if (!resource) {
        return res.status(404).json({ 
          success: false, 
          message: 'Resource not found' 
        });
      }

      // Check if user owns the resource or is admin
      if (req.user.role === 'admin') {
        req.resource = resource;
        return next();
      }

      if (req.user.role === 'patient' && resource.patient && resource.patient.toString() === req.user._id.toString()) {
        req.resource = resource;
        return next();
      }

      if (req.user.role === 'doctor' && resource.doctor && resource.doctor.toString() === req.user._id.toString()) {
        req.resource = resource;
        return next();
      }

      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You do not own this resource.' 
      });
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        message: 'Ownership verification error' 
      });
    }
  };
};

// Middleware to check if user can access patient data (for doctors)
const canAccessPatientData = async (req, res, next) => {
  try {
    const patientId = req.params.patientId || req.body.patientId;
    
    if (!patientId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Patient ID is required' 
      });
    }

    // Admin can access all patient data
    if (req.user.role === 'admin') {
      return next();
    }

    // Doctor can access patient data if they have an appointment with the patient
    if (req.user.role === 'doctor') {
      const Appointment = require('../models/Appointment');
      const hasAppointment = await Appointment.findOne({
        doctor: req.user._id,
        patient: patientId,
        status: { $in: ['confirmed', 'completed'] }
      });

      if (!hasAppointment) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. No appointment history with this patient.' 
        });
      }
    }

    next();
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Patient data access verification error' 
    });
  }
};

// Middleware to check if user can access doctor data (for patients)
const canAccessDoctorData = async (req, res, next) => {
  try {
    const doctorId = req.params.doctorId || req.body.doctorId;
    
    if (!doctorId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Doctor ID is required' 
      });
    }

    // Admin can access all doctor data
    if (req.user.role === 'admin') {
      return next();
    }

    // Patient can access doctor data if they have an appointment with the doctor
    if (req.user.role === 'patient') {
      const Appointment = require('../models/Appointment');
      const hasAppointment = await Appointment.findOne({
        doctor: doctorId,
        patient: req.user._id,
        status: { $in: ['confirmed', 'completed'] }
      });

      if (!hasAppointment) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. No appointment history with this doctor.' 
        });
      }
    }

    next();
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Doctor data access verification error' 
    });
  }
};

// Middleware to update last login
const updateLastLogin = async (req, res, next) => {
  try {
    if (req.user) {
      await req.user.updateLastLogin(req.ip, req.get('User-Agent'));
    }
    next();
  } catch (error) {
    // Don't block the request if last login update fails
    console.error('Failed to update last login:', error);
    next();
  }
};

// Middleware to check rate limiting for sensitive operations
const rateLimitSensitive = (req, res, next) => {
  // This would typically use a rate limiting library
  // For now, we'll just pass through
  next();
};

module.exports = {
  authenticateToken,
  requireVerification,
  requireRole,
  requirePatient,
  requireDoctor,
  requireLab,
  requireAdmin,
  requireDoctorOrAdmin,
  requirePatientOrDoctor,
  requireOwnership,
  canAccessPatientData,
  canAccessDoctorData,
  updateLastLogin,
  rateLimitSensitive
}; 