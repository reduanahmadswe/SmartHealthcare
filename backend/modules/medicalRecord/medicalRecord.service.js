
const MedicalRecord = require('./medicalRecord.model');
const User = require('../user/user.model'); 
const { uploadMedicalDocument, deleteFromCloudinary, uploadBufferToCloudinary } = require('../../utils/cloudinaryService'); 
const { generateMedicalRecordPDF } = require('../../utils/pdfService'); 
const { sendEmail } = require('../../utils/emailService'); 
const mongoose = require('mongoose');

const medicalRecordService = {
    /**
     * Uploads a new medical record.
     * @param {object} recordData - Data for the medical record from req.body.
     * @param {object} file - The file object from req.file (multer).
     * @param {object} currentUser - The authenticated user object (req.user).
     * @returns {Promise<object>} The newly created medical record.
     * @throws {Error} If no file is provided or other upload issues.
     */
    uploadRecord: async (recordData, file, currentUser) => {
        if (!file) {
            throw new Error('Please upload a file');
        }

        const {
            title,
            recordType,
            description,
            recordDate,
            tags,
            vitals,
            testResults,
            diagnosis,
            medications,
            procedures,
            allergies,
            familyHistory,
            patientId, // Passed when a doctor uploads for a specific patient
            doctor, // The consulting doctor, if explicitly provided
            appointment, // Associated appointment
            category, priority, location, department // Additional fields
        } = recordData;

        // Determine the patient ID: current user if patient, or from body if doctor
        const patientRef = currentUser.role === 'patient' ? currentUser._id : patientId;
        if (!patientRef) {
            throw new Error('Patient ID is required for this record.');
        }

        // Upload file to Cloudinary
        const uploadResult = await uploadMedicalDocument(
            file.path,
            recordType,
            patientRef.toString()
        );

        // Create medical record
        const medicalRecord = new MedicalRecord({
            patient: patientRef,
            doctor: doctor || null, // Assign doctor if provided
            appointment: appointment || null,
            uploadedBy: currentUser._id,
            title,
            recordType,
            description,
            recordDate,
            tags: tags || [],
            // Storing file details directly in the files array for future multi-file support
            files: [{
                originalName: file.originalname,
                fileName: file.filename, // Multer filename
                fileUrl: uploadResult.url,
                filePublicId: uploadResult.public_id,
                fileSize: uploadResult.bytes, // Cloudinary provides 'bytes'
                mimeType: file.mimetype,
                isPrimary: true // Mark as primary for now
            }],
            // For backward compatibility, also populate single fields
            fileUrl: uploadResult.url,
            filePublicId: uploadResult.public_id,
            fileSize: uploadResult.bytes,
            fileFormat: uploadResult.format,
            vitals: vitals,
            testResults: testResults,
            diagnosis: diagnosis,
            medications: medications,
            procedures: procedures,
            allergies: allergies,
            familyHistory: familyHistory,
            category: category || null,
            priority: priority || 'medium',
            location: location || null,
            department: department || null
        });

        // Add history entry
        medicalRecord.addToHistory('created', currentUser._id, `Record of type ${recordType} created.`);

        await medicalRecord.save();
        return medicalRecord;
    },

    /**
     * Retrieves medical records for a user with filters and pagination.
     * @param {object} filters - Query filters and pagination options.
     * @param {object} currentUser - The authenticated user object.
     * @returns {Promise<object>} Object containing medical records and pagination info.
     */
    getRecords: async (filters, currentUser) => {
        const { recordType, date, tags, page = 1, limit = 10, category, status, searchTerm } = filters;

        const query = {};

        // Base query for user's own records (patient and doctor)
        if (currentUser.role === 'patient') {
            query.patient = currentUser._id;
        } else if (currentUser.role === 'doctor') {
            query.$or = [
                { patient: currentUser._id }, // Doctors' own medical records
                { uploadedBy: currentUser._id }, // Records they uploaded for anyone
                { 'sharedWith.doctor': currentUser._id } // Records shared with them
            ];
            // Exclude records where the doctor is only listed as `doctor` (consulting doctor)
            // unless they uploaded it or it was shared, to prevent broad access.
            // If they need to see *all* records where they are the consulting doctor,
            // the logic here needs to be more explicit.
        } else if (currentUser.role === 'admin') {
            // Admins can see all records unless a patientId is specified via a separate route
        } else {
            throw new Error('Unauthorized user role.');
        }

        // Apply additional filters
        if (recordType) query.recordType = recordType;
        if (category) query.category = category;
        if (status) query.status = status; // Filter by active/archived/deleted

        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            query.recordDate = { $gte: startOfDay, $lte: endOfDay };
        }
        if (tags) {
            query.tags = { $in: tags.split(',').map(tag => tag.trim()) };
        }

        // Search functionality for specific fields if searchTerm is present
        if (searchTerm) {
            const searchRegex = new RegExp(searchTerm, 'i');
            query.$or = (query.$or || []).concat([ // Combine with existing $or if present
                { title: searchRegex },
                { description: searchRegex },
                { tags: { $in: [searchRegex] } },
                { 'testResults.testName': searchRegex },
                { 'diagnosis.primary': searchRegex }
            ]);
        }

        const medicalRecords = await MedicalRecord.find(query)
            .populate('patient', 'firstName lastName')
            .populate('doctor', 'firstName lastName')
            .populate('uploadedBy', 'firstName lastName')
            .sort({ recordDate: -1, createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await MedicalRecord.countDocuments(query);

        return {
            medicalRecords,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                hasNextPage: parseInt(page) * parseInt(limit) < total,
                hasPrevPage: parseInt(page) > 1
            }
        };
    },

    /**
     * Gets a specific medical record by ID, with access control.
     * @param {string} recordId - The ID of the medical record.
     * @param {object} currentUser - The authenticated user object.
     * @returns {Promise<object>} The medical record.
     * @throws {Error} If record not found or access denied.
     */
    getRecordById: async (recordId, currentUser) => {
        const medicalRecord = await MedicalRecord.findById(recordId)
            .populate('patient', 'firstName lastName email phone')
            .populate('doctor', 'firstName lastName email')
            .populate('uploadedBy', 'firstName lastName')
            .populate('sharedWith.doctor', 'firstName lastName email'); // Populate sharedWith.doctor

        if (!medicalRecord) {
            throw new Error('Medical record not found');
        }

        // Check if user has access to this record
        const isOwner = medicalRecord.patient._id.toString() === currentUser._id.toString();
        const isUploader = medicalRecord.uploadedBy._id.toString() === currentUser._id.toString();
        const isShared = medicalRecord.sharedWith.some(share => share.doctor && share.doctor._id.toString() === currentUser._id.toString());
        const isDoctorConsulting = medicalRecord.doctor && medicalRecord.doctor._id.toString() === currentUser._id.toString(); // If they are the consulting doctor
        const isAdmin = currentUser.role === 'admin';

        if (!isOwner && !isUploader && !isShared && !isDoctorConsulting && !isAdmin) {
            throw new Error('Access denied');
        }

        // Add to history
        medicalRecord.addToHistory('viewed', currentUser._id, `Record viewed by ${currentUser.role}`);
        // No await here as it's a non-critical background update

        return medicalRecord;
    },

    /**
     * Updates an existing medical record, with access control.
     * @param {string} recordId - The ID of the record to update.
     * @param {object} updateData - Data to update the record with.
     * @param {object} currentUser - The authenticated user object.
     * @returns {Promise<object>} The updated medical record.
     * @throws {Error} If record not found or access denied.
     */
    updateRecord: async (recordId, updateData, currentUser) => {
        const medicalRecord = await MedicalRecord.findById(recordId);

        if (!medicalRecord) {
            throw new Error('Medical record not found');
        }

        // Check if user can update this record
        const isOwner = medicalRecord.patient.toString() === currentUser._id.toString();
        const isUploader = medicalRecord.uploadedBy.toString() === currentUser._id.toString();
        const isAdmin = currentUser.role === 'admin';

        // Doctors might also have 'edit' permission via sharedWith
        const sharedAccess = medicalRecord.sharedWith.find(share =>
            share.doctor && share.doctor.toString() === currentUser._id.toString() &&
            (share.permission === 'edit' || share.permission === 'full_access')
        );

        if (!isOwner && !isUploader && !isAdmin && !sharedAccess) {
            throw new Error('Access denied');
        }

        // Apply updates
        Object.assign(medicalRecord, updateData);

        // Add history entry
        await medicalRecord.addToHistory('updated', currentUser._id, `Record updated by ${currentUser.role}`);

        const updatedRecord = await medicalRecord.save();
        return updatedRecord;
    },

    /**
     * Deletes a medical record, with access control.
     * @param {string} recordId - The ID of the record to delete.
     * @param {object} currentUser - The authenticated user object.
     * @returns {Promise<void>}
     * @throws {Error} If record not found or access denied.
     */
    deleteRecord: async (recordId, currentUser) => {
        const medicalRecord = await MedicalRecord.findById(recordId);

        if (!medicalRecord) {
            throw new Error('Medical record not found');
        }

        // Check if user can delete this record
        const isOwner = medicalRecord.patient.toString() === currentUser._id.toString();
        const isUploader = medicalRecord.uploadedBy.toString() === currentUser._id.toString();
        const isAdmin = currentUser.role === 'admin';

        if (!isOwner && !isUploader && !isAdmin) {
            throw new Error('Access denied');
        }

        // Delete file(s) from Cloudinary
        if (medicalRecord.files && medicalRecord.files.length > 0) {
            for (const file of medicalRecord.files) {
                if (file.filePublicId) {
                    await deleteFromCloudinary(file.filePublicId);
                }
            }
        }
        // Backward compatibility for single file
        else if (medicalRecord.filePublicId) {
            await deleteFromCloudinary(medicalRecord.filePublicId);
        }

        // Add history entry (before actual deletion)
        // Note: For actual deletion, history might need to be stored elsewhere or on the user.
        // For now, let's just update the record status to 'deleted' instead of deleting entirely.
        medicalRecord.status = 'deleted';
        await medicalRecord.addToHistory('deleted', currentUser._id, `Record marked as deleted by ${currentUser.role}`);
        await medicalRecord.save();

        // If you truly want to delete the document from DB:
        // await MedicalRecord.findByIdAndDelete(recordId);
    },

    /**
     * Shares a medical record with a doctor.
     * @param {string} medicalRecordId - The ID of the medical record.
     * @param {string} doctorId - The ID of the doctor to share with.
     * @param {string} permission - The permission level ('view', 'edit', 'full_access', 'read').
     * @param {object} currentUser - The authenticated user object (must be patient owner).
     * @returns {Promise<object>} The updated medical record with share info.
     * @throws {Error} If record not found, patient not owner, or doctor not found.
     */
    shareRecordWithDoctor: async (medicalRecordId, doctorId, permission, currentUser) => {
        const medicalRecord = await MedicalRecord.findById(medicalRecordId);

        if (!medicalRecord) {
            throw new Error('Medical record not found');
        }

        // Check if patient owns this record
        if (medicalRecord.patient.toString() !== currentUser._id.toString()) {
            throw new Error('Access denied: You do not own this record.');
        }

        // Check if doctor exists
        const doctor = await User.findOne({
            _id: doctorId,
            role: 'doctor',
            isVerified: true,
            isActive: true
        });

        if (!doctor) {
            throw new Error('Doctor not found or is not active/verified.');
        }

        // Add doctor to shared list (method on schema handles duplicates)
        await medicalRecord.shareWithDoctor(doctorId, permission);

        // Send notification email to doctor
        await sendEmail({
            to: doctor.email,
            subject: 'Medical Record Shared - Smart Healthcare Assistant',
            template: 'medicalRecordShared',
            context: {
                doctorName: doctor.firstName,
                patientName: `${currentUser.firstName} ${currentUser.lastName}`,
                recordTitle: medicalRecord.title,
                recordType: medicalRecord.recordType,
                recordDate: medicalRecord.recordDate.toISOString().split('T')[0] // Format date
            }
        });

        // Add history entry
        await medicalRecord.addToHistory('shared', currentUser._id, `Record shared with doctor ${doctor.firstName} (ID: ${doctorId})`);

        // Find the newly added/updated share entry to return
        const updatedShareInfo = medicalRecord.sharedWith.find(share => share.doctor.toString() === doctorId.toString());

        return {
            medicalRecord, // Return the updated medical record object
            sharedWith: updatedShareInfo // Return just the relevant share info
        };
    },

    /**
     * Removes a doctor's access to a medical record.
     * @param {string} medicalRecordId - The ID of the medical record.
     * @param {string} doctorId - The ID of the doctor to remove access from.
     * @param {object} currentUser - The authenticated user object (must be patient owner).
     * @returns {Promise<void>}
     * @throws {Error} If record not found or patient not owner.
     */
    unshareRecordWithDoctor: async (medicalRecordId, doctorId, currentUser) => {
        const medicalRecord = await MedicalRecord.findById(medicalRecordId);

        if (!medicalRecord) {
            throw new Error('Medical record not found');
        }

        // Check if patient owns this record
        if (medicalRecord.patient.toString() !== currentUser._id.toString()) {
            throw new Error('Access denied: You do not own this record.');
        }

        // Remove doctor from shared list using the schema method
        await medicalRecord.unshareWithDoctor(doctorId);

        // Add history entry
        await medicalRecord.addToHistory('unshared', currentUser._id, `Access revoked for doctor (ID: ${doctorId})`);
    },

    /**
     * Generates and provides a download URL for a medical record PDF.
     * @param {string} recordId - The ID of the medical record.
     * @param {object} currentUser - The authenticated user object.
     * @returns {Promise<object>} Object with PDF URL, title, and type.
     * @throws {Error} If record not found or access denied.
     */
    downloadRecord: async (recordId, currentUser) => {
        const medicalRecord = await MedicalRecord.findById(recordId)
            .populate('patient', 'firstName lastName')
            .populate('uploadedBy', 'firstName lastName')
            .populate('doctor', 'firstName lastName')
            .populate('sharedWith.doctor', 'firstName lastName'); // Populate shared doctors for access check

        if (!medicalRecord) {
            throw new Error('Medical record not found');
        }

        // Check if user has access to this record
        const isOwner = medicalRecord.patient._id.toString() === currentUser._id.toString();
        const isUploader = medicalRecord.uploadedBy._id.toString() === currentUser._id.toString();
        const isShared = medicalRecord.sharedWith.some(share => share.doctor && share.doctor._id.toString() === currentUser._id.toString());
        const isDoctorConsulting = medicalRecord.doctor && medicalRecord.doctor._id.toString() === currentUser._id.toString();
        const isAdmin = currentUser.role === 'admin';

        if (!isOwner && !isUploader && !isShared && !isDoctorConsulting && !isAdmin) {
            throw new Error('Access denied: You do not have permission to download this record.');
        }

        // Generate PDF
        const pdfBuffer = await generateMedicalRecordPDF(medicalRecord);
        const pdfUrl = await uploadBufferToCloudinary(pdfBuffer, `medical-records/${medicalRecord._id}-${Date.now()}.pdf`); // Ensure unique filename

        // Add history entry
        medicalRecord.addToHistory('downloaded', currentUser._id, `Record downloaded by ${currentUser.role}`);
        // No await here as it's a non-critical background update

        return {
            pdfUrl,
            recordTitle: medicalRecord.title,
            recordType: medicalRecord.recordType
        };
    },

    /**
     * Gets medical records for a specific patient (doctor only access).
     * @param {string} patientId - The ID of the patient.
     * @param {object} filters - Query filters and pagination options.
     * @param {object} currentUser - The authenticated doctor user object.
     * @returns {Promise<object>} Object containing medical records and pagination info.
     * @throws {Error} If user is not a doctor.
     */
    getPatientRecordsByDoctor: async (patientId, filters, currentUser) => {
        if (currentUser.role !== 'doctor' && currentUser.role !== 'admin') {
            throw new Error('Access denied: Only doctors and admins can view specific patient records.');
        }

        const { recordType, page = 1, limit = 10 } = filters;

        // Doctor can only view records for this patient if:
        // 1. The doctor is explicitly listed as the 'doctor' for the record
        // 2. The doctor uploaded the record for this patient
        // 3. The record was shared with this doctor
        const query = {
            patient: mongoose.Types.ObjectId(patientId),
            status: { $ne: 'deleted' }, // Exclude deleted records
            $or: [
                { doctor: currentUser._id },
                { uploadedBy: currentUser._id },
                { 'sharedWith.doctor': currentUser._id }
            ]
        };

        if (recordType) {
            query.recordType = recordType;
        }

        const medicalRecords = await MedicalRecord.find(query)
            .populate('uploadedBy', 'firstName lastName')
            .populate('doctor', 'firstName lastName')
            .sort({ recordDate: -1, createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await MedicalRecord.countDocuments(query);

        return {
            medicalRecords,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                hasNextPage: parseInt(page) * parseInt(limit) < total,
                hasPrevPage: parseInt(page) > 1
            }
        };
    },

    /**
     * Gets medical record statistics based on user role and date range.
     * @param {object} queryParams - Query parameters including startDate, endDate.
     * @param {object} currentUser - The authenticated user object.
     * @returns {Promise<object>} Object containing statistics.
     */
    getMedicalRecordStatistics: async (queryParams, currentUser) => {
        const { startDate, endDate } = queryParams;
        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999); // Ensure end date includes the full day

        const matchQuery = {
            recordDate: { $gte: start, $lte: end },
            status: { $ne: 'deleted' } // Exclude deleted records from statistics
        };

        if (currentUser.role === 'patient') {
            matchQuery.patient = currentUser._id;
        } else if (currentUser.role === 'doctor') {
            matchQuery.$or = [
                { patient: currentUser._id },
                { 'sharedWith.doctor': currentUser._id },
                { uploadedBy: currentUser._id },
                { doctor: currentUser._id } // Records where this doctor is the consulting doctor
            ];
        }
        // Admin role implies no specific patient/doctor filtering in this context

        // Get statistics by record type
        const statsByType = await MedicalRecord.getStatistics(matchQuery); // Using static method
        const totalStats = await MedicalRecord.getTotalStatistics(matchQuery); // Using static method

        return {
            period: { start, end },
            statsByType,
            totalStats
        };
    }
};

module.exports = medicalRecordService;