const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: [true, 'Action is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userRole: {
    type: String,
    enum: ['patient', 'doctor', 'admin'],
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  userIP: {
    type: String
  },
  userAgent: {
    type: String
  },
  resourceType: {
    type: String,
    enum: [
      'user',
      'appointment',
      'prescription',
      'medical_record',
      'lab_test',
      'payment',
      'chat',
      'health_data',
      'inventory',
      'system',
      'auth',
      'admin'
    ]
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  resourceName: {
    type: String
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  status: {
    type: String,
    enum: ['success', 'failure', 'pending', 'cancelled'],
    default: 'success'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  sessionId: {
    type: String
  },
  requestId: {
    type: String
  },
  duration: {
    type: Number, // in milliseconds
    min: 0
  },
  errorDetails: {
    message: String,
    stack: String,
    code: String
  }
}, {
  timestamps: true
});

// Indexes for better performance
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ userRole: 1 });
activityLogSchema.index({ resourceType: 1 });
activityLogSchema.index({ severity: 1 });
activityLogSchema.index({ status: 1 });
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ 'metadata.appointmentId': 1 });
activityLogSchema.index({ 'metadata.patientId': 1 });
activityLogSchema.index({ 'metadata.doctorId': 1 });

// Virtual for formatted timestamp
activityLogSchema.virtual('formattedTimestamp').get(function() {
  return this.createdAt.toLocaleString();
});

// Virtual for action category
activityLogSchema.virtual('actionCategory').get(function() {
  if (this.action.includes('login') || this.action.includes('logout') || this.action.includes('auth')) {
    return 'authentication';
  }
  if (this.action.includes('create') || this.action.includes('add')) {
    return 'creation';
  }
  if (this.action.includes('update') || this.action.includes('edit')) {
    return 'modification';
  }
  if (this.action.includes('delete') || this.action.includes('remove')) {
    return 'deletion';
  }
  if (this.action.includes('view') || this.action.includes('read')) {
    return 'viewing';
  }
  if (this.action.includes('payment') || this.action.includes('billing')) {
    return 'financial';
  }
  if (this.action.includes('chat') || this.action.includes('message')) {
    return 'communication';
  }
  return 'other';
});

// Static method to log activity
activityLogSchema.statics.logActivity = function(data) {
  const log = new this({
    action: data.action,
    description: data.description,
    user: data.user,
    userRole: data.userRole,
    userEmail: data.userEmail,
    userIP: data.userIP,
    userAgent: data.userAgent,
    resourceType: data.resourceType,
    resourceId: data.resourceId,
    resourceName: data.resourceName,
    severity: data.severity || 'low',
    status: data.status || 'success',
    metadata: data.metadata || {},
    sessionId: data.sessionId,
    requestId: data.requestId,
    duration: data.duration,
    errorDetails: data.errorDetails
  });

  return log.save();
};

// Static method to get user activity history
activityLogSchema.statics.getUserActivity = function(userId, limit = 50, skip = 0) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('user', 'firstName lastName email');
};

// Static method to get system activity
activityLogSchema.statics.getSystemActivity = function(filters = {}, limit = 100, skip = 0) {
  const query = {};

  if (filters.action) query.action = filters.action;
  if (filters.userRole) query.userRole = filters.userRole;
  if (filters.resourceType) query.resourceType = filters.resourceType;
  if (filters.severity) query.severity = filters.severity;
  if (filters.status) query.status = filters.status;
  if (filters.startDate) query.createdAt = { $gte: new Date(filters.startDate) };
  if (filters.endDate) {
    if (query.createdAt) {
      query.createdAt.$lte = new Date(filters.endDate);
    } else {
      query.createdAt = { $lte: new Date(filters.endDate) };
    }
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('user', 'firstName lastName email');
};

// Static method to get activity summary
activityLogSchema.statics.getActivitySummary = function(startDate, endDate) {
  const matchStage = {};
  if (startDate) matchStage.createdAt = { $gte: new Date(startDate) };
  if (endDate) {
    if (matchStage.createdAt) {
      matchStage.createdAt.$lte = new Date(endDate);
    } else {
      matchStage.createdAt = { $lte: new Date(endDate) };
    }
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          action: '$action',
          userRole: '$userRole',
          status: '$status'
        },
        count: { $sum: 1 },
        avgDuration: { $avg: '$duration' },
        totalDuration: { $sum: '$duration' }
      }
    },
    {
      $group: {
        _id: '$_id.action',
        roles: {
          $push: {
            role: '$_id.userRole',
            status: '$_id.status',
            count: '$count',
            avgDuration: '$avgDuration',
            totalDuration: '$totalDuration'
          }
        },
        totalCount: { $sum: '$count' },
        totalDuration: { $sum: '$totalDuration' }
      }
    },
    {
      $sort: { totalCount: -1 }
    }
  ]);
};

// Static method to get error logs
activityLogSchema.statics.getErrorLogs = function(limit = 50) {
  return this.find({
    $or: [
      { status: 'failure' },
      { severity: 'critical' },
      { 'errorDetails.message': { $exists: true } }
    ]
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('user', 'firstName lastName email');
};

// Static method to get security events
activityLogSchema.statics.getSecurityEvents = function(limit = 50) {
  return this.find({
    $or: [
      { action: { $regex: /login|logout|auth|password|security/i } },
      { severity: { $in: ['high', 'critical'] } },
      { 'metadata.securityEvent': true }
    ]
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('user', 'firstName lastName email');
};

// Static method to clean old logs
activityLogSchema.statics.cleanOldLogs = function(daysToKeep = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    severity: { $ne: 'critical' }
  });
};

module.exports = mongoose.model('ActivityLog', activityLogSchema); 