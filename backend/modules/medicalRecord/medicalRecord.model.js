const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
    // Basic Information
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Patient is required']
    },
    doctor: { // This might be the prescribing doctor or consulting doctor
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // Adding uploadedBy as it's used in routes
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Uploader is required'] // Assuming every record must have an uploader
    },
    appointment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment'
    },

    // Record Details
    recordType: {
        type: String,
        enum: [
            'lab_report',
            'x_ray',
            'mri_scan',
            'ct_scan',
            'ultrasound',
            'ecg',
            'blood_test',
            'urine_test',
            'prescription',
            'discharge_summary',
            'operation_report',
            'vaccination_record',
            'growth_chart',
            'dental_record',
            'eye_test',
            'other',
            // Additional types found in original route validation, aligning here for consistency:
            'surgery_record',
            'consultation_note'
        ],
        required: [true, 'Record type is required']
    },

    title: {
        type: String,
        required: [true, 'Record title is required'],
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: String,

    // File Information (Note: Original schema only had fileUrl, this is enhanced based on route usage)
    files: [{
        originalName: String,
        fileName: String, // Stored filename
        fileUrl: {
            type: String,
            required: true
        },
        filePublicId: String, // Cloudinary public ID for deletion
        fileSize: Number, // in bytes
        mimeType: String, // e.g., 'image/jpeg', 'application/pdf'
        uploadedAt: {
            type: Date,
            default: Date.now
        },
        isPrimary: {
            type: Boolean,
            default: false
        }
    }],
    // Backwards compatibility for single file fields found in route logic
    fileUrl: String,
    filePublicId: String,
    fileSize: Number,
    fileFormat: String,


    // Test Results (for lab reports)
    testResults: {
        testName: String,
        testDate: Date,
        results: [{
            parameter: String,
            value: String,
            unit: String,
            normalRange: String,
            isAbnormal: Boolean,
            notes: String
        }],
        labName: String,
        labAddress: String,
        technician: String,
        reviewedBy: String
    },

    // Vital Signs
    vitals: {
        bloodPressure: {
            systolic: Number,
            diastolic: Number
        },
        heartRate: Number,
        temperature: Number,
        weight: Number,
        height: Number,
        bmi: Number,
        oxygenSaturation: Number,
        respiratoryRate: Number
    },

    // Diagnosis and Treatment
    diagnosis: {
        primary: String,
        secondary: [String],
        icd10Codes: [String]
    },
    treatment: String,
    medications: [{
        name: String,
        dosage: String,
        duration: String,
        instructions: String
    }],
    // Additional fields inferred from route body parsing
    procedures: [String],
    allergies: [String],
    familyHistory: [String],

    // Status and Privacy
    status: {
        type: String,
        enum: ['active', 'archived', 'deleted'],
        default: 'active'
    },
    isPrivate: {
        type: Boolean,
        default: false
    },
    accessLevel: {
        type: String,
        enum: ['patient_only', 'doctor_patient', 'all_doctors'],
        default: 'doctor_patient'
    },

    // Dates
    recordDate: {
        type: Date,
        required: [true, 'Record date is required']
    },
    uploadDate: {
        type: Date,
        default: Date.now
    },

    // Tags and Categories
    tags: [String],
    category: {
        type: String,
        enum: [
            'diagnostic',
            'treatment',
            'preventive',
            'emergency',
            'routine',
            'specialist',
            'surgery',
            'therapy'
        ]
    },

    // Sharing and Permissions
    sharedWith: [{
        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        sharedAt: {
            type: Date,
            default: Date.now
        },
        permission: { // This was 'permission' in schema, but 'permissions' in route for array
            type: String,
            enum: ['view', 'edit', 'full_access', 'read'], // Adding 'read' based on route usage
            default: 'view'
        }
    }],

    // Comments and Notes
    comments: [{
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        comment: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        isPrivate: {
            type: Boolean,
            default: false
        }
    }],

    // Audit Trail
    history: [{
        action: {
            type: String,
            enum: ['created', 'updated', 'viewed', 'shared', 'archived', 'deleted', 'file_added', 'file_removed'] // Added file actions for completeness
        },
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        details: String
    }],

    // Metadata
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    location: String, // Hospital/Clinic where record was created
    department: String,

    // Insurance and Billing
    insurance: {
        provider: String,
        policyNumber: String,
        claimNumber: String,
        amount: Number,
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'paid'],
            default: 'pending'
        }
    }
}, {
    timestamps: true
});

// Indexes for better performance
medicalRecordSchema.index({
    patient: 1,
    recordDate: -1
});
medicalRecordSchema.index({
    doctor: 1,
    recordDate: -1
});
medicalRecordSchema.index({
    uploadedBy: 1,
    recordDate: -1
}); // Added index for uploadedBy
medicalRecordSchema.index({
    recordType: 1
});
medicalRecordSchema.index({
    status: 1
});
medicalRecordSchema.index({
    tags: 1
});
medicalRecordSchema.index({
    'testResults.testDate': -1
});

// Virtual for file count
medicalRecordSchema.virtual('fileCount').get(function() {
    // Check both 'files' array and 'fileUrl' for backward compatibility
    const fileCountFromFilesArray = this.files ? this.files.length : 0;
    const fileCountFromFileUrl = this.fileUrl ? 1 : 0;
    return fileCountFromFilesArray > 0 ? fileCountFromFilesArray : fileCountFromFileUrl;
});

// Virtual for total file size
medicalRecordSchema.virtual('totalFileSize').get(function() {
    // Check both 'files' array and 'fileSize' for backward compatibility
    if (this.files && this.files.length > 0) {
        return this.files.reduce((total, file) => total + (file.fileSize || 0), 0);
    }
    return this.fileSize || 0; // Use the single fileSize if available
});

// Virtual for primary file
medicalRecordSchema.virtual('primaryFile').get(function() {
    if (this.files && this.files.length > 0) {
        return this.files.find(file => file.isPrimary) || this.files[0];
    }
    // Fallback to single file fields if 'files' array is empty/absent but 'fileUrl' exists
    if (this.fileUrl) {
        return {
            fileUrl: this.fileUrl,
            fileName: this.fileName, // Assuming a fileName field if single file used
            filePublicId: this.filePublicId,
            fileSize: this.fileSize,
            mimeType: this.fileFormat // Assuming fileFormat maps to mimeType
        };
    }
    return null;
});

// Virtual for record age
medicalRecordSchema.virtual('ageInDays').get(function() {
    if (!this.recordDate) return null;
    const now = new Date();
    const recordDate = new Date(this.recordDate);
    const diffTime = Math.abs(now.getTime() - recordDate.getTime()); // Use getTime() for consistency
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Method to add file (if using the 'files' array structure)
medicalRecordSchema.methods.addFile = function(fileData) {
    if (!this.files) {
        this.files = [];
    }
    this.files.push(fileData);
    return this.save();
};

// Method to remove file (if using the 'files' array structure)
medicalRecordSchema.methods.removeFile = function(filePublicId) {
    if (this.files) {
        this.files = this.files.filter(file => file.filePublicId !== filePublicId);
    }
    return this.save();
};


// Method to add comment
medicalRecordSchema.methods.addComment = function(author, comment, isPrivate = false) {
    if (!this.comments) {
        this.comments = [];
    }
    this.comments.push({
        author,
        comment,
        isPrivate,
        timestamp: new Date()
    });
    return this.save();
};

// Method to share with doctor
medicalRecordSchema.methods.shareWithDoctor = function(doctorId, permission = 'view') {
    if (!this.sharedWith) {
        this.sharedWith = [];
    }
    const existingShare = this.sharedWith.find(share => share.doctor.toString() === doctorId.toString());

    if (existingShare) {
        existingShare.permission = permission;
        existingShare.sharedAt = new Date();
    } else {
        this.sharedWith.push({
            doctor: doctorId,
            permission,
            sharedAt: new Date()
        });
    }

    return this.save();
};

// Method to remove share with doctor
medicalRecordSchema.methods.unshareWithDoctor = function(doctorId) {
    if (this.sharedWith) {
        this.sharedWith = this.sharedWith.filter(share => share.doctor.toString() !== doctorId.toString());
    }
    return this.save();
};


// Method to add to history
medicalRecordSchema.methods.addToHistory = function(action, performedBy, details = '') {
    if (!this.history) {
        this.history = [];
    }
    this.history.push({
        action,
        performedBy,
        details,
        timestamp: new Date()
    });
    return this.save();
};

// Static method to get record statistics
medicalRecordSchema.statics.getStatistics = async function(query) {
    const stats = await this.aggregate([
        {
            $match: { ...query, status: { $ne: 'deleted' } } // Always exclude deleted records from stats
        },
        {
            $group: {
                _id: '$recordType',
                count: { $sum: 1 },
                // Correctly sum file sizes from the 'files' array or single 'fileSize' field
                totalSize: { $sum: { $ifNull: [{ $sum: '$files.fileSize' }, '$fileSize', 0] } }
            }
        },
        { $sort: { count: -1 } }
    ]);

    return stats;
};

// Static method to get total statistics (total records, total size, avg size)
medicalRecordSchema.statics.getTotalStatistics = async function(query) {
    const totalStats = await this.aggregate([
        {
            $match: { ...query, status: { $ne: 'deleted' } } // Always exclude deleted records from stats
        },
        {
            $group: {
                _id: null,
                totalRecords: { $sum: 1 },
                // Correctly sum file sizes from the 'files' array or single 'fileSize' field
                totalSize: { $sum: { $ifNull: [{ $sum: '$files.fileSize' }, '$fileSize', 0] } },
                avgSize: { $avg: { $ifNull: [{ $sum: '$files.fileSize' }, '$fileSize', 0] } } // Average of the total size for each record
            }
        }
    ]);
    return totalStats[0] || { totalRecords: 0, totalSize: 0, avgSize: 0 };
};


// Static method to search records
medicalRecordSchema.statics.searchRecords = async function(patientId, searchTerm, filters = {}, userRole, userId) {
    let baseQuery = {
        status: { $ne: 'deleted' } // Exclude deleted records by default for searches
    };

    // Access control based on user role
    if (userRole === 'patient') {
        baseQuery.patient = userId;
    } else if (userRole === 'doctor') {
        baseQuery.$or = [
            { patient: userId }, // Records uploaded by the doctor for themselves (if they are also a patient)
            { doctor: userId }, // Records where this doctor is specified as the consulting doctor
            { uploadedBy: userId }, // Records uploaded by this doctor
            { 'sharedWith.doctor': userId } // Records explicitly shared with this doctor
        ];
        if (patientId) { // If a doctor is searching for a specific patient's record
            baseQuery.patient = patientId; // Ensure the search is for the specified patient ID
            // Refine $or to ensure patientId is also respected for shared/uploaded records
            baseQuery.$or = [
                { patient: mongoose.Types.ObjectId(patientId), doctor: userId },
                { patient: mongoose.Types.ObjectId(patientId), uploadedBy: userId },
                { patient: mongoose.Types.ObjectId(patientId), 'sharedWith.doctor': userId }
            ];
        }
    } else if (userRole === 'admin') {
        if (patientId) {
            baseQuery.patient = mongoose.Types.ObjectId(patientId);
        }
        // Admins can search all records (no additional patient/doctor filter unless specified)
    } else {
        throw new Error('Unauthorized role for record search.');
    }


    const textSearchQuery = {
        $or: [
            { title: { $regex: searchTerm, $options: 'i' } },
            { description: { $regex: searchTerm, $options: 'i' } },
            { tags: { $in: [new RegExp(searchTerm, 'i')] } },
            { 'testResults.testName': { $regex: searchTerm, $options: 'i' } },
            { 'diagnosis.primary': { $regex: searchTerm, $options: 'i' } } // Added diagnosis search
        ]
    };

    const finalQuery = { ...baseQuery, ...textSearchQuery };

    // Add filters
    if (filters.recordType) finalQuery.recordType = filters.recordType;
    if (filters.category) finalQuery.category = filters.category;
    if (filters.startDate && filters.endDate) {
        finalQuery.recordDate = { $gte: new Date(filters.startDate), $lte: new Date(filters.endDate) };
    }
    if (filters.tags) { // Handle comma-separated tags
        const tagsArray = Array.isArray(filters.tags) ? filters.tags : filters.tags.split(',').map(tag => tag.trim());
        finalQuery.tags = { $in: tagsArray.map(tag => new RegExp(tag, 'i')) };
    }
    if (filters.status) finalQuery.status = filters.status; // Allow filtering by status

    return await this.find(finalQuery).sort({ recordDate: -1 });
};


module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);