const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  // Basic Information
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient is required']
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Doctor is required']
  },
  
  // Appointment Details
  appointmentDate: {
    type: Date,
    required: [true, 'Appointment date is required']
  },
  appointmentTime: {
    type: String,
    required: [true, 'Appointment time is required']
  },
  duration: {
    type: Number,
    default: 30, // in minutes
    min: 15,
    max: 120
  },
  
  // Type and Mode
  appointmentType: {
    type: String,
    enum: ['consultation', 'follow_up', 'emergency', 'routine_checkup', 'vaccination'],
    default: 'consultation'
  },
  appointmentMode: {
    type: String,
    enum: ['in_person', 'video_call', 'chat'],
    default: 'in_person'
  },
  
  // Status and Progress
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
    default: 'pending'
  },
  
  // Symptoms and Notes
  symptoms: [String],
  patientNotes: String,
  doctorNotes: String,
  
  // Consultation Details
  diagnosis: String,
  treatment: String,
  followUpDate: Date,
  followUpNotes: String,
  
  // Payment Information
  consultationFee: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'mobile_banking', 'bank_transfer'],
    default: 'cash'
  },
  transactionId: String,
  
  // Prescription
  prescription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  },
  
  // Lab Tests
  labTests: [{
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LabTest'
    },
    status: {
      type: String,
      enum: ['ordered', 'in_progress', 'completed', 'cancelled'],
      default: 'ordered'
    },
    results: String,
    reportUrl: String
  }],
  
  // Video Call Details
  videoCall: {
    roomId: String,
    roomName: String,
    startTime: Date,
    endTime: Date,
    duration: Number, // in seconds
    recordingUrl: String
  },
  
  // Chat Messages
  chatMessages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    messageType: {
      type: String,
      enum: ['text', 'image', 'file'],
      default: 'text'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    isRead: {
      type: Boolean,
      default: false
    }
  }],
  
  // Notifications
  notifications: [{
    type: {
      type: String,
      enum: ['reminder', 'confirmation', 'cancellation', 'reschedule', 'payment']
    },
    message: String,
    sentAt: {
      type: Date,
      default: Date.now
    },
    isRead: {
      type: Boolean,
      default: false
    }
  }],
  
  // Cancellation/Reschedule
  cancellationReason: String,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledAt: Date,
  
  // Reschedule
  rescheduledFrom: {
    date: Date,
    time: String
  },
  rescheduledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rescheduledAt: Date,
  
  // Rating and Review
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  review: String,
  reviewDate: Date,
  
  // Emergency Information
  isEmergency: {
    type: Boolean,
    default: false
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  
  // Location (for in-person appointments)
  location: {
    type: String,
    enum: ['clinic', 'hospital', 'home_visit', 'online'],
    default: 'clinic'
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  
  // Metadata
  tags: [String],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Indexes for better performance
appointmentSchema.index({ patient: 1, appointmentDate: 1 });
appointmentSchema.index({ doctor: 1, appointmentDate: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ appointmentDate: 1 });
appointmentSchema.index({ 'videoCall.roomId': 1 });

// Virtual for appointment duration in hours
appointmentSchema.virtual('durationHours').get(function() {
  return this.duration / 60;
});

// Virtual for is upcoming
appointmentSchema.virtual('isUpcoming').get(function() {
  const now = new Date();
  const appointmentDateTime = new Date(this.appointmentDate);
  appointmentDateTime.setHours(parseInt(this.appointmentTime.split(':')[0]));
  appointmentDateTime.setMinutes(parseInt(this.appointmentTime.split(':')[1]));
  
  return appointmentDateTime > now && this.status === 'confirmed';
});

// Virtual for is overdue
appointmentSchema.virtual('isOverdue').get(function() {
  const now = new Date();
  const appointmentDateTime = new Date(this.appointmentDate);
  appointmentDateTime.setHours(parseInt(this.appointmentTime.split(':')[0]));
  appointmentDateTime.setMinutes(parseInt(this.appointmentTime.split(':')[1]));
  
  return appointmentDateTime < now && this.status === 'confirmed';
});

// Pre-save middleware to validate appointment time
appointmentSchema.pre('save', function(next) {
  // Check if appointment date is not in the past
  const appointmentDateTime = new Date(this.appointmentDate);
  const now = new Date();
  
  if (appointmentDateTime < now && this.isNew) {
    return next(new Error('Appointment date cannot be in the past'));
  }
  
  next();
});

// Method to check availability
appointmentSchema.statics.checkAvailability = async function(doctorId, date, time, duration = 30) {
  const conflictingAppointment = await this.findOne({
    doctor: doctorId,
    appointmentDate: date,
    appointmentTime: time,
    status: { $in: ['pending', 'confirmed'] }
  });
  return !conflictingAppointment;
};

// Method to get appointment statistics
appointmentSchema.statics.getStatistics = async function(doctorId, startDate, endDate) {
  const stats = await this.aggregate([
    {
      $match: {
        doctor: mongoose.Types.ObjectId(doctorId),
        appointmentDate: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$consultationFee' }
      }
    }
  ]);
  
  return stats;
};

module.exports = mongoose.model('Appointment', appointmentSchema); 