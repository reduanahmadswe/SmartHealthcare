const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for file uploads
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'smart-healthcare',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
  }
});

const upload = multer({ storage: storage });

// Upload file to Cloudinary
const uploadToCloudinary = async (filePath, folder = 'smart-healthcare') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto',
      transformation: [
        { width: 1000, height: 1000, crop: 'limit' }
      ]
    });

    return {
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      size: result.bytes
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

// Upload buffer to Cloudinary
const uploadBufferToCloudinary = async (buffer, folder = 'smart-healthcare', options = {}) => {
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'auto',
          ...options
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              url: result.secure_url,
              public_id: result.public_id,
              format: result.format,
              size: result.bytes
            });
          }
        }
      );

      uploadStream.end(buffer);
    });
  } catch (error) {
    console.error('Error uploading buffer to Cloudinary:', error);
    throw error;
  }
};

// Delete file from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

// Get file info from Cloudinary
const getFileInfo = async (publicId) => {
  try {
    const result = await cloudinary.api.resource(publicId);
    return result;
  } catch (error) {
    console.error('Error getting file info from Cloudinary:', error);
    throw error;
  }
};

// Generate signed URL for secure access
const generateSignedUrl = async (publicId, options = {}) => {
  try {
    const url = cloudinary.url(publicId, {
      sign_url: true,
      secure: true,
      ...options
    });
    return url;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw error;
  }
};

// Upload medical documents with specific configurations
const uploadMedicalDocument = async (filePath, documentType, patientId) => {
  try {
    const folder = `medical-documents/${patientId}/${documentType}`;
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto',
      transformation: [
        { quality: 'auto:good' }
      ],
      tags: ['medical-document', documentType, `patient-${patientId}`]
    });

    return {
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      size: result.bytes,
      documentType: documentType,
      patientId: patientId
    };
  } catch (error) {
    console.error('Error uploading medical document:', error);
    throw error;
  }
};

// Upload profile picture with face detection
const uploadProfilePicture = async (filePath, userId) => {
  try {
    const folder = `profile-pictures/${userId}`;
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto:good' }
      ],
      tags: ['profile-picture', `user-${userId}`]
    });

    return {
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      size: result.bytes
    };
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw error;
  }
};

// Upload prescription PDF
const uploadPrescriptionPDF = async (pdfBuffer, prescriptionNumber) => {
  try {
    const folder = `prescriptions/${prescriptionNumber}`;
    const result = await uploadBufferToCloudinary(pdfBuffer, folder, {
      resource_type: 'raw',
      format: 'pdf',
      tags: ['prescription', `prescription-${prescriptionNumber}`]
    });

    return result;
  } catch (error) {
    console.error('Error uploading prescription PDF:', error);
    throw error;
  }
};

// Upload lab test results
const uploadLabTestResults = async (filePath, testId, patientId) => {
  try {
    const folder = `lab-tests/${patientId}/${testId}`;
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto',
      transformation: [
        { quality: 'auto:good' }
      ],
      tags: ['lab-test', `test-${testId}`, `patient-${patientId}`]
    });

    return {
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      size: result.bytes,
      testId: testId,
      patientId: patientId
    };
  } catch (error) {
    console.error('Error uploading lab test results:', error);
    throw error;
  }
};

// Upload doctor certificates
const uploadDoctorCertificate = async (filePath, doctorId, certificateType) => {
  try {
    const folder = `doctor-certificates/${doctorId}/${certificateType}`;
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto',
      transformation: [
        { quality: 'auto:good' }
      ],
      tags: ['doctor-certificate', certificateType, `doctor-${doctorId}`]
    });

    return {
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      size: result.bytes,
      certificateType: certificateType,
      doctorId: doctorId
    };
  } catch (error) {
    console.error('Error uploading doctor certificate:', error);
    throw error;
  }
};

// Clean up old files (for maintenance)
const cleanupOldFiles = async (folder, daysOld = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: folder,
      max_results: 1000
    });

    const oldFiles = result.resources.filter(resource => {
      const createdAt = new Date(resource.created_at);
      return createdAt < cutoffDate;
    });

    const deletePromises = oldFiles.map(file => 
      cloudinary.uploader.destroy(file.public_id)
    );

    const results = await Promise.allSettled(deletePromises);
    
    return {
      totalFiles: oldFiles.length,
      deletedFiles: results.filter(r => r.status === 'fulfilled').length,
      failedDeletions: results.filter(r => r.status === 'rejected').length
    };
  } catch (error) {
    console.error('Error cleaning up old files:', error);
    throw error;
  }
};

// Get storage usage statistics
const getStorageStats = async () => {
  try {
    const result = await cloudinary.api.usage();
    return {
      credits: result.credits,
      objects: result.objects,
      bandwidth: result.bandwidth,
      storage: result.storage,
      requests: result.requests
    };
  } catch (error) {
    console.error('Error getting storage stats:', error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  upload,
  uploadToCloudinary,
  uploadBufferToCloudinary,
  deleteFromCloudinary,
  getFileInfo,
  generateSignedUrl,
  uploadMedicalDocument,
  uploadProfilePicture,
  uploadPrescriptionPDF,
  uploadLabTestResults,
  uploadDoctorCertificate,
  cleanupOldFiles,
  getStorageStats
}; 