const ActivityLog = require('../modules/logs/logs.model');

// Middleware to log activities
const logActivity = (action, description, options = {}) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    
    // Store original send method
    const originalSend = res.send;
    
    // Override send method to capture response
    res.send = function(data) {
      const duration = Date.now() - startTime;
      
      // Log activity asynchronously (don't block response)
      logActivityAsync({
        action,
        description,
        user: req.user?._id,
        userRole: req.user?.role,
        userEmail: req.user?.email,
        userIP: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        resourceType: options.resourceType,
        resourceId: req.params.id || options.resourceId,
        resourceName: options.resourceName,
        severity: options.severity || 'low',
        status: res.statusCode < 400 ? 'success' : 'failure',
        metadata: {
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          ...options.metadata
        },
        sessionId: req.session?.id,
        requestId: req.headers['x-request-id'],
        duration,
        errorDetails: res.statusCode >= 400 ? {
          message: typeof data === 'string' ? data : data?.message,
          code: res.statusCode.toString()
        } : undefined
      });
      
      // Call original send method
      return originalSend.call(this, data);
    };
    
    next();
  };
};

// Async function to log activity
const logActivityAsync = async (logData) => {
  try {
    if (logData.user) {
      await ActivityLog.logActivity(logData);
    }
  } catch (error) {
    console.error('Activity logging error:', error);
  }
};

// Specific activity loggers
const logUserActivity = (action, description, options = {}) => {
  return logActivity(action, description, {
    resourceType: 'user',
    ...options
  });
};

const logAppointmentActivity = (action, description, options = {}) => {
  return logActivity(action, description, {
    resourceType: 'appointment',
    ...options
  });
};

const logPaymentActivity = (action, description, options = {}) => {
  return logActivity(action, description, {
    resourceType: 'payment',
    severity: 'medium',
    ...options
  });
};

const logHealthDataActivity = (action, description, options = {}) => {
  return logActivity(action, description, {
    resourceType: 'health_data',
    ...options
  });
};

const logInventoryActivity = (action, description, options = {}) => {
  return logActivity(action, description, {
    resourceType: 'inventory',
    ...options
  });
};

const logAdminActivity = (action, description, options = {}) => {
  return logActivity(action, description, {
    resourceType: 'admin',
    severity: 'high',
    ...options
  });
};

const logSecurityActivity = (action, description, options = {}) => {
  return logActivity(action, description, {
    resourceType: 'auth',
    severity: 'high',
    metadata: {
      securityEvent: true,
      ...options.metadata
    },
    ...options
  });
};

// Middleware to log all requests (for debugging)
const logAllRequests = (req, res, next) => {
  const startTime = Date.now();
  
  const originalSend = res.send;
  
  res.send = function(data) {
    const duration = Date.now() - startTime;
    
    logActivityAsync({
      action: `${req.method}_${req.route?.path || req.path}`,
      description: `${req.method} request to ${req.originalUrl}`,
      user: req.user?._id,
      userRole: req.user?.role,
      userEmail: req.user?.email,
      userIP: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      status: res.statusCode < 400 ? 'success' : 'failure',
      metadata: {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        params: req.params,
        query: req.query
      },
      duration
    });
    
    return originalSend.call(this, data);
  };
  
  next();
};

// Middleware to log errors
const logError = (error, req, res, next) => {
  logActivityAsync({
    action: 'error_occurred',
    description: error.message || 'An error occurred',
    user: req.user?._id,
    userRole: req.user?.role,
    userEmail: req.user?.email,
    userIP: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    severity: 'critical',
    status: 'failure',
    metadata: {
      method: req.method,
      url: req.originalUrl,
      errorType: error.name,
      stack: error.stack
    },
    errorDetails: {
      message: error.message,
      stack: error.stack,
      code: error.code || 'UNKNOWN_ERROR'
    }
  });
  
  next(error);
};

module.exports = {
  logActivity,
  logUserActivity,
  logAppointmentActivity,
  logPaymentActivity,
  logHealthDataActivity,
  logInventoryActivity,
  logAdminActivity,
  logSecurityActivity,
  logAllRequests,
  logError
}; 