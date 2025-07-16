const LabTest = require('./labTest.model'); 
const User = require('../user/user.model'); 
const { sendEmail } = require('../../utils/emailService'); 
const { uploadLabTestResults } = require('../../utils/cloudinaryService'); 
const mongoose = require('mongoose'); // For ObjectId in aggregate


class LabTestService {
  /**
   * Books a new lab test.
   * @param {Object} labTestData - Data for the new lab test.
   * @param {string} patientId - ID of the patient booking the test.
   * @returns {Promise<Object>} - The created lab test object.
   */
  static async bookLabTest(labTestData, patientId) {
    const {
      testName, testCategory, lab: labId, scheduledDate, scheduledTime, cost,
      doctor: prescribedBy, appointment, description, instructions, paymentMethod,
      priority, isEmergency, // new fields from schema
      transactionId, insurance
    } = labTestData;

    // Check if lab exists and is verified/active
    const lab = await User.findOne({
      _id: labId,
      role: 'lab',
      isVerified: true,
      isActive: true
    });
    if (!lab) {
      throw new Error('Lab not found or not verified');
    }

    // Check if doctor exists (if prescribed)
    let doctor = null;
    if (prescribedBy) {
      doctor = await User.findOne({
        _id: prescribedBy,
        role: 'doctor',
        isVerified: true,
        isActive: true
      });
      if (!doctor) {
        throw new Error('Prescribing doctor not found');
      }
    }

    const labTest = new LabTest({
      patient: patientId,
      lab: labId,
      doctor: prescribedBy || null, // Map prescribedBy to doctor field
      appointment: appointment || null,
      testName,
      testCategory,
      bookingDate: new Date(), // Set booking date to now
      scheduledDate,
      scheduledTime,
      cost, // Cost object
      description,
      instructions: instructions || {},
      paymentMethod: paymentMethod || 'cash',
      priority: priority || 'routine',
      isEmergency: isEmergency || false,
      transactionId,
      insurance: insurance || {}
    });

    await labTest.save();

    await labTest.populate('lab', 'firstName lastName email phone address');
    if (doctor) {
      await labTest.populate('doctor', 'firstName lastName email');
    }
    await labTest.populate('patient', 'firstName lastName email'); // Populate patient for email context

    // Send confirmation email to patient
    await sendEmail({
      to: labTest.patient.email,
      subject: 'Lab Test Booked - Smart Healthcare Assistant',
      template: 'labTestBooked',
      context: {
        patientName: labTest.patient.firstName,
        testName: labTest.testName,
        testCategory: labTest.testCategory,
        labName: `${lab.firstName} ${lab.lastName}`,
        appointmentDate: labTest.scheduledDate.toDateString(),
        appointmentTime: labTest.scheduledTime,
        instructions: labTest.instructions.preparation.join(', ') || 'N/A', // Adjust as per your email template needs
        fastingRequired: labTest.instructions.fasting?.required ? 'Yes' : 'No',
      }
    });

    // Send notification email to lab
    await sendEmail({
      to: lab.email,
      subject: 'New Lab Test Booking - Smart Healthcare Assistant',
      template: 'newLabTestBooking',
      context: {
        labName: lab.firstName,
        patientName: `${labTest.patient.firstName} ${labTest.patient.lastName}`,
        testName: labTest.testName,
        testCategory: labTest.testCategory,
        appointmentDate: labTest.scheduledDate.toDateString(),
        appointmentTime: labTest.scheduledTime
      }
    });

    return labTest;
  }

  /**
   * Retrieves lab tests based on user role and filters.
   * @param {Object} user - Authenticated user object.
   * @param {Object} filters - Query filters (status, testCategory, date, page, limit).
   * @returns {Promise<Object>} - Paginated list of lab tests.
   */
  static async getLabTests(user, filters) {
    const { status, testCategory, date, page = 1, limit = 10 } = filters;
    const query = {};

    // Filter by user role
    if (user.role === 'patient') {
      query.patient = user._id;
    } else if (user.role === 'doctor') {
      query.doctor = user._id;
    } else if (user.role === 'lab') {
      query.lab = user._id;
    } else if (user.role === 'admin') {
      // Admins can see all, no specific user filter
    } else {
        throw new Error('Unauthorized role to view lab tests');
    }

    if (status) {
      query.status = status;
    }
    if (testCategory) {
      query.testCategory = testCategory;
    }
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
      query.scheduledDate = { $gte: startDate, $lt: endDate };
    }

    const labTests = await LabTest.find(query)
      .populate('patient', 'firstName lastName email phone')
      .populate('lab', 'firstName lastName email phone address')
      .populate('doctor', 'firstName lastName email')
      .sort({ scheduledDate: -1, scheduledTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await LabTest.countDocuments(query);

    return {
      labTests,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalTests: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    };
  }

  /**
   * Retrieves a single lab test by ID.
   * @param {string} labTestId - ID of the lab test.
   * @param {Object} user - Authenticated user object.
   * @returns {Promise<Object>} - The lab test object.
   */
  static async getLabTestById(labTestId, user) {
    const labTest = await LabTest.findById(labTestId)
      .populate('patient', 'firstName lastName email phone patientInfo')
      .populate('lab', 'firstName lastName email phone address labInfo')
      .populate('doctor', 'firstName lastName email doctorInfo');

    if (!labTest) {
      throw new Error('Lab test not found');
    }

    // Check if user has access to this test
    const isPatient = labTest.patient._id.toString() === user._id.toString();
    const isLab = labTest.lab._id.toString() === user._id.toString();
    const isDoctor = labTest.doctor && labTest.doctor._id.toString() === user._id.toString();
    const isAdmin = user.role === 'admin';

    if (!isPatient && !isLab && !isDoctor && !isAdmin) {
      throw new Error('Access denied');
    }

    return labTest;
  }

  /**
   * Updates the status of a lab test.
   * @param {string} labTestId - ID of the lab test.
   * @param {string} newStatus - New status for the lab test.
   * @param {string} notes - Optional notes for the status update.
   * @param {string} updaterId - ID of the user updating the status (should be a lab).
   * @returns {Promise<Object>} - The updated lab test object.
   */
  static async updateLabTestStatus(labTestId, newStatus, notes, updaterId) {
    const labTest = await LabTest.findById(labTestId)
      .populate('patient', 'firstName lastName email')
      .populate('lab', 'firstName lastName email');

    if (!labTest) {
      throw new Error('Lab test not found');
    }

    if (labTest.lab._id.toString() !== updaterId.toString()) {
      throw new Error('Access denied: You can only update tests from your own lab');
    }

    const oldStatus = labTest.status;
    labTest.status = newStatus;
    // The original schema had a 'comments' array, not 'notes' field for the test itself.
    // If you want to store notes for status updates, consider adding a 'statusUpdateHistory' subdocument
    // or adding it to the 'comments' array. For now, I'll put it in comments.
    if (notes) {
      labTest.comments.push({
        author: updaterId,
        comment: `Status updated from '${oldStatus}' to '${newStatus}'. Notes: ${notes}`,
        isPrivate: true
      });
    }

    await labTest.save();

    if (newStatus !== oldStatus) {
      await sendEmail({
        to: labTest.patient.email,
        subject: `Lab Test ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)} - Smart Healthcare Assistant`,
        template: 'labTestStatusUpdate',
        context: {
          patientName: labTest.patient.firstName,
          testName: labTest.testName,
          labName: `${labTest.lab.firstName} ${labTest.lab.lastName}`,
          appointmentDate: labTest.scheduledDate.toDateString(),
          appointmentTime: labTest.scheduledTime,
          oldStatus,
          newStatus,
          notes: notes || ''
        }
      });
    }

    return labTest;
  }

  /**
   * Uploads lab test results and updates the test record.
   * @param {string} labTestId - ID of the lab test.
   * @param {Array<Object>} resultsData - Array of result parameters and values.
   * @param {Object} file - The uploaded file object (from multer).
   * @param {string} uploaderId - ID of the user uploading results (should be a lab).
   * @returns {Promise<Object>} - The updated lab test object.
   */
  static async uploadLabTestResults(labTestId, resultsData, file, uploaderId) {
    const labTest = await LabTest.findById(labTestId)
      .populate('patient', 'firstName lastName email')
      .populate('lab', 'firstName lastName email')
      .populate('doctor', 'firstName lastName email');

    if (!labTest) {
      throw new Error('Lab test not found');
    }

    if (labTest.lab._id.toString() !== uploaderId.toString()) {
      throw new Error('Access denied: You can only upload results for tests from your own lab');
    }

    if (!file) {
      throw new Error('Results file is required');
    }

    const uploadResult = await uploadLabTestResults( // This calls the external cloudinaryService function
      file.path,
      labTestId,
      labTest.patient._id.toString()
    );

    // Add individual results to the 'parameters' and 'results' arrays.
    // The schema has 'parameters' for definition and 'results' for actual values.
    // Assuming 'resultsData' contains the actual results to be added.
    resultsData.forEach(result => {
        labTest.results.push({
            parameter: result.parameter,
            value: result.value,
            unit: result.unit,
            normalRange: result.normalRange,
            isAbnormal: result.isAbnormal,
            isCritical: result.isCritical,
            notes: result.notes,
            reviewedBy: `${labTest.lab.firstName} ${labTest.lab.lastName}`, // Assuming lab reviews
            reviewedAt: new Date()
        });
    });

    labTest.resultFiles.push({ // Push the uploaded file info
        name: file.originalname,
        url: uploadResult.url,
        type: 'report', // Assuming 'report' for general result files
        uploadedAt: new Date(),
        isPrimary: true
    });

    labTest.status = 'completed';
    labTest.completedAt = new Date();
    labTest.resultReadyAt = new Date(); // Set when result is uploaded
    await labTest.save();

    await sendEmail({
      to: labTest.patient.email,
      subject: 'Lab Test Results Ready - Smart Healthcare Assistant',
      template: 'labTestResultsReady',
      context: {
        patientName: labTest.patient.firstName,
        testName: labTest.testName,
        labName: `${labTest.lab.firstName} ${labTest.lab.lastName}`,
        isAbnormal: labTest.abnormalResultsCount > 0, // Use virtual to check
        resultFileUrl: uploadResult.url
      }
    });

    if (labTest.doctor) {
      await sendEmail({
        to: labTest.doctor.email,
        subject: 'Lab Test Results Available - Smart Healthcare Assistant',
        template: 'labTestResultsForDoctor',
        context: {
          doctorName: labTest.doctor.firstName,
          patientName: `${labTest.patient.firstName} ${labTest.patient.lastName}`,
          testName: labTest.testName,
          labName: `${labTest.lab.firstName} ${labTest.lab.lastName}`,
          isAbnormal: labTest.abnormalResultsCount > 0,
          resultFileUrl: uploadResult.url
        }
      });
    }

    return labTest;
  }

  /**
   * Retrieves a list of verified labs.
   * @param {Object} filters - Filters for labs (city, testCategory, page, limit, sortBy, sortOrder).
   * @returns {Promise<Object>} - Paginated list of labs.
   */
  static async getVerifiedLabs(filters) {
    const {
      city,
      testCategory,
      page = 1,
      limit = 10,
      sortBy = 'rating',
      sortOrder = 'desc'
    } = filters;

    const query = {
      role: 'lab',
      isVerified: true,
      isActive: true
    };

    if (city) {
      query['address.city'] = { $regex: city, $options: 'i' };
    }
    if (testCategory) {
      // Assuming labInfo.availableTests is an array of testCategory strings
      query['labInfo.availableTests'] = testCategory;
    }

    const sortOptions = {};
    if (sortBy === 'name') {
      sortOptions['firstName'] = sortOrder === 'desc' ? -1 : 1; // Sort by lab's first name
    } else if (sortBy === 'city') {
      sortOptions['address.city'] = sortOrder === 'desc' ? -1 : 1;
    } else { // Default to rating
      sortOptions[`labInfo.${sortBy}`] = sortOrder === 'desc' ? -1 : 1;
    }


    const labs = await User.find(query)
      .select('firstName lastName email phone address labInfo profilePicture')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    return {
      labs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalLabs: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    };
  }

  /**
   * Retrieves a single lab profile by ID.
   * @param {string} labId - ID of the lab.
   * @returns {Promise<Object>} - The lab user object.
   */
  static async getLabProfileById(labId) {
    const lab = await User.findOne({
      _id: labId,
      role: 'lab',
      isVerified: true,
      isActive: true
    }).select('-password -loginHistory'); // Exclude sensitive fields

    if (!lab) {
      throw new Error('Lab not found');
    }

    // Assuming User model has a getPublicProfile method
    return lab.getPublicProfile ? lab.getPublicProfile() : lab;
  }

  /**
   * Retrieves a lab's available schedule for a specific date.
   * @param {string} labId - ID of the lab.
   * @param {string} dateString - Date in YYYY-MM-DD format.
   * @returns {Promise<Object>} - Lab's schedule and test fees.
   */
  static async getLabSchedule(labId, dateString) {
    const lab = await User.findOne({
      _id: labId,
      role: 'lab',
      isVerified: true,
      isActive: true
    });

    if (!lab) {
      throw new Error('Lab not found');
    }

    const availableSlots = lab.labInfo.availableSlots || [];

    const date = new Date(dateString);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'lowercase' });
    const daySlots = availableSlots.filter(slot =>
      slot.day.toLowerCase() === dayOfWeek && slot.isAvailable
    );

    return {
      labId: lab._id,
      date: dateString,
      availableSlots: daySlots,
      testFees: lab.labInfo.testFees || {}
    };
  }

  /**
   * Gets lab tests for a specific patient.
   * @param {string} patientId - ID of the patient.
   * @param {Object} user - Authenticated user (doctor or lab).
   * @param {Object} filters - Query filters (status, page, limit).
   * @returns {Promise<Object>} - Paginated list of lab tests for the patient.
   */
  static async getLabTestsForPatient(patientId, user, filters) {
    const { status, page = 1, limit = 10 } = filters;
    const query = { patient: patientId };

    if (user.role === 'doctor') {
      query.doctor = user._id;
    } else if (user.role === 'lab') {
      query.lab = user._id;
    } else if (user.role === 'admin') {
      // Admin can view any patient's tests
    } else {
        throw new Error('Access denied');
    }

    if (status) {
      query.status = status;
    }

    const labTests = await LabTest.find(query)
      .populate('lab', 'firstName lastName email')
      .populate('doctor', 'firstName lastName email')
      .sort({ scheduledDate: -1, scheduledTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await LabTest.countDocuments(query);

    return {
      labTests,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalTests: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    };
  }

  /**
   * Gets lab test statistics based on user role and date range.
   * @param {Object} user - Authenticated user object.
   * @param {string} startDate - Start date for statistics.
   * @param {string} endDate - End date for statistics.
   * @returns {Promise<Object>} - Lab test statistics.
   */
  static async getLabTestStatistics(user, startDate, endDate) {
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    const query = {
      scheduledDate: { $gte: start, $lte: end }
    };

    if (user.role === 'patient') {
      query.patient = user._id;
    } else if (user.role === 'doctor') {
      query.doctor = user._id;
    } else if (user.role === 'lab') {
      query.lab = user._id;
    } else if (user.role === 'admin') {
        // No specific filter for admin
    } else {
        throw new Error('Unauthorized role to view statistics');
    }

    const statsByType = await LabTest.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$testCategory', // Changed from testType to testCategory based on schema
          count: { $sum: 1 },
          totalRevenue: { $sum: '$cost.finalAmount' } // Changed from testFee to cost.finalAmount
        }
      },
      { $sort: { count: -1 } }
    ]);

    const totalStats = await LabTest.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalTests: { $sum: 1 },
          totalRevenue: { $sum: '$cost.finalAmount' },
          avgFee: { $avg: '$cost.finalAmount' }
        }
      }
    ]);

    return {
      period: { start, end },
      statsByType,
      totalStats: totalStats[0] || { totalTests: 0, totalRevenue: 0, avgFee: 0 }
    };
  }
}

module.exports = LabTestService;