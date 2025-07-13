const jsPDF = require('jspdf');
const Prescription = require('../models/Prescription');

// Generate prescription PDF
const generatePrescriptionPDF = async (prescription) => {
  try {
    // Populate prescription data if not already populated
    if (!prescription.populated('patient') || !prescription.populated('doctor')) {
      await prescription.populate('patient', 'firstName lastName email phone');
      await prescription.populate('doctor', 'firstName lastName email phone doctorInfo');
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = 30;

    // Header
    doc.setFontSize(24);
    doc.setTextColor(66, 126, 234); // Blue color
    doc.text('Smart Healthcare Assistant', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('PRESCRIPTION', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Prescription details
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Prescription Number:', margin, yPosition);
    doc.setFont(undefined, 'normal');
    doc.text(prescription.prescriptionNumber, margin + 50, yPosition);
    yPosition += 8;

    doc.setFont(undefined, 'bold');
    doc.text('Date:', margin, yPosition);
    doc.setFont(undefined, 'normal');
    doc.text(new Date(prescription.prescriptionDate).toLocaleDateString(), margin + 50, yPosition);
    yPosition += 8;

    doc.setFont(undefined, 'bold');
    doc.text('Patient:', margin, yPosition);
    doc.setFont(undefined, 'normal');
    doc.text(`${prescription.patient.firstName} ${prescription.patient.lastName}`, margin + 50, yPosition);
    yPosition += 8;

    doc.setFont(undefined, 'bold');
    doc.text('Doctor:', margin, yPosition);
    doc.setFont(undefined, 'normal');
    doc.text(`Dr. ${prescription.doctor.firstName} ${prescription.doctor.lastName}`, margin + 50, yPosition);
    yPosition += 15;

    // Diagnosis
    if (prescription.diagnosis && prescription.diagnosis.primary) {
      doc.setFont(undefined, 'bold');
      doc.text('DIAGNOSIS:', margin, yPosition);
      yPosition += 8;
      doc.setFont(undefined, 'normal');
      doc.text(`Primary: ${prescription.diagnosis.primary}`, margin + 10, yPosition);
      yPosition += 8;
      
      if (prescription.diagnosis.secondary && prescription.diagnosis.secondary.length > 0) {
        doc.text(`Secondary: ${prescription.diagnosis.secondary.join(', ')}`, margin + 10, yPosition);
        yPosition += 8;
      }
      yPosition += 5;
    }

    // Symptoms
    if (prescription.symptoms && prescription.symptoms.length > 0) {
      doc.setFont(undefined, 'bold');
      doc.text('SYMPTOMS:', margin, yPosition);
      yPosition += 8;
      doc.setFont(undefined, 'normal');
      prescription.symptoms.forEach(symptom => {
        doc.text(`• ${symptom}`, margin + 10, yPosition);
        yPosition += 6;
      });
      yPosition += 5;
    }

    // Medications
    if (prescription.medications && prescription.medications.length > 0) {
      doc.setFont(undefined, 'bold');
      doc.text('MEDICATIONS:', margin, yPosition);
      yPosition += 8;

      prescription.medications.forEach((medication, index) => {
        // Check if we need a new page
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 30;
        }

        doc.setFont(undefined, 'bold');
        doc.text(`${index + 1}. ${medication.name}`, margin, yPosition);
        yPosition += 6;
        
        doc.setFont(undefined, 'normal');
        doc.text(`   Dosage: ${medication.dosage.amount} ${medication.dosage.unit}`, margin + 10, yPosition);
        yPosition += 6;
        
        doc.text(`   Frequency: ${medication.dosage.frequency}`, margin + 10, yPosition);
        yPosition += 6;
        
        doc.text(`   Duration: ${medication.dosage.duration}`, margin + 10, yPosition);
        yPosition += 6;
        
        if (medication.instructions) {
          doc.text(`   Instructions: ${medication.instructions}`, margin + 10, yPosition);
          yPosition += 6;
        }
        
        if (medication.route) {
          doc.text(`   Route: ${medication.route}`, margin + 10, yPosition);
          yPosition += 6;
        }
        
        yPosition += 3;
      });
    }

    // Lab Tests
    if (prescription.labTests && prescription.labTests.length > 0) {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 30;
      }

      doc.setFont(undefined, 'bold');
      doc.text('LAB TESTS:', margin, yPosition);
      yPosition += 8;
      doc.setFont(undefined, 'normal');
      
      prescription.labTests.forEach((test, index) => {
        doc.text(`${index + 1}. ${test.testName}`, margin + 10, yPosition);
        yPosition += 6;
        
        if (test.instructions) {
          doc.text(`   Instructions: ${test.instructions}`, margin + 15, yPosition);
          yPosition += 6;
        }
      });
      yPosition += 5;
    }

    // Lifestyle Recommendations
    if (prescription.lifestyleRecommendations) {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 30;
      }

      doc.setFont(undefined, 'bold');
      doc.text('LIFESTYLE RECOMMENDATIONS:', margin, yPosition);
      yPosition += 8;
      doc.setFont(undefined, 'normal');

      if (prescription.lifestyleRecommendations.diet && prescription.lifestyleRecommendations.diet.length > 0) {
        doc.setFont(undefined, 'bold');
        doc.text('Diet:', margin + 10, yPosition);
        yPosition += 6;
        doc.setFont(undefined, 'normal');
        prescription.lifestyleRecommendations.diet.forEach(item => {
          doc.text(`• ${item}`, margin + 15, yPosition);
          yPosition += 6;
        });
      }

      if (prescription.lifestyleRecommendations.exercise && prescription.lifestyleRecommendations.exercise.length > 0) {
        doc.setFont(undefined, 'bold');
        doc.text('Exercise:', margin + 10, yPosition);
        yPosition += 6;
        doc.setFont(undefined, 'normal');
        prescription.lifestyleRecommendations.exercise.forEach(item => {
          doc.text(`• ${item}`, margin + 15, yPosition);
          yPosition += 6;
        });
      }

      if (prescription.lifestyleRecommendations.restrictions && prescription.lifestyleRecommendations.restrictions.length > 0) {
        doc.setFont(undefined, 'bold');
        doc.text('Restrictions:', margin + 10, yPosition);
        yPosition += 6;
        doc.setFont(undefined, 'normal');
        prescription.lifestyleRecommendations.restrictions.forEach(item => {
          doc.text(`• ${item}`, margin + 15, yPosition);
          yPosition += 6;
        });
      }
    }

    // Follow-up
    if (prescription.followUp && prescription.followUp.required) {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 30;
      }

      doc.setFont(undefined, 'bold');
      doc.text('FOLLOW-UP:', margin, yPosition);
      yPosition += 8;
      doc.setFont(undefined, 'normal');
      
      if (prescription.followUp.date) {
        doc.text(`Date: ${new Date(prescription.followUp.date).toLocaleDateString()}`, margin + 10, yPosition);
        yPosition += 6;
      }
      
      if (prescription.followUp.type) {
        doc.text(`Type: ${prescription.followUp.type}`, margin + 10, yPosition);
        yPosition += 6;
      }
      
      if (prescription.followUp.reason) {
        doc.text(`Reason: ${prescription.followUp.reason}`, margin + 10, yPosition);
        yPosition += 6;
      }
    }

    // Patient Instructions
    if (prescription.patientInstructions) {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 30;
      }

      doc.setFont(undefined, 'bold');
      doc.text('PATIENT INSTRUCTIONS:', margin, yPosition);
      yPosition += 8;
      doc.setFont(undefined, 'normal');

      if (prescription.patientInstructions.general) {
        doc.text(`General: ${prescription.patientInstructions.general}`, margin + 10, yPosition);
        yPosition += 8;
      }

      if (prescription.patientInstructions.medicationInstructions) {
        doc.text(`Medication Instructions: ${prescription.patientInstructions.medicationInstructions}`, margin + 10, yPosition);
        yPosition += 8;
      }

      if (prescription.patientInstructions.sideEffects && prescription.patientInstructions.sideEffects.length > 0) {
        doc.text('Side Effects to Watch For:', margin + 10, yPosition);
        yPosition += 6;
        prescription.patientInstructions.sideEffects.forEach(effect => {
          doc.text(`• ${effect}`, margin + 15, yPosition);
          yPosition += 6;
        });
      }

      if (prescription.patientInstructions.whenToSeekHelp && prescription.patientInstructions.whenToSeekHelp.length > 0) {
        doc.text('When to Seek Medical Help:', margin + 10, yPosition);
        yPosition += 6;
        prescription.patientInstructions.whenToSeekHelp.forEach(item => {
          doc.text(`• ${item}`, margin + 15, yPosition);
          yPosition += 6;
        });
      }
    }

    // Digital Signature
    if (prescription.digitalSignature) {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 30;
      }

      doc.setFont(undefined, 'bold');
      doc.text('DIGITAL SIGNATURE:', margin, yPosition);
      yPosition += 8;
      doc.setFont(undefined, 'normal');
      
      doc.text(`Signed by: Dr. ${prescription.doctor.firstName} ${prescription.doctor.lastName}`, margin + 10, yPosition);
      yPosition += 6;
      
      doc.text(`Date: ${new Date(prescription.digitalSignature.signatureDate).toLocaleDateString()}`, margin + 10, yPosition);
      yPosition += 6;
      
      doc.text(`Time: ${new Date(prescription.digitalSignature.signatureDate).toLocaleTimeString()}`, margin + 10, yPosition);
      yPosition += 6;
      
      doc.text(`Signature Hash: ${prescription.digitalSignature.signatureHash}`, margin + 10, yPosition);
    }

    // Footer
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      // Page number
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
      
      // Footer text
      doc.text('Smart Healthcare Assistant - Digital Prescription', pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }

    return doc.output('arraybuffer');
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

// Generate medical record PDF
const generateMedicalRecordPDF = async (medicalRecord) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = 30;

    // Header
    doc.setFontSize(24);
    doc.setTextColor(66, 126, 234);
    doc.text('Smart Healthcare Assistant', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('MEDICAL RECORD', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Record details
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Record Type:', margin, yPosition);
    doc.setFont(undefined, 'normal');
    doc.text(medicalRecord.recordType.replace('_', ' ').toUpperCase(), margin + 50, yPosition);
    yPosition += 8;

    doc.setFont(undefined, 'bold');
    doc.text('Title:', margin, yPosition);
    doc.setFont(undefined, 'normal');
    doc.text(medicalRecord.title, margin + 50, yPosition);
    yPosition += 8;

    doc.setFont(undefined, 'bold');
    doc.text('Date:', margin, yPosition);
    doc.setFont(undefined, 'normal');
    doc.text(new Date(medicalRecord.recordDate).toLocaleDateString(), margin + 50, yPosition);
    yPosition += 15;

    // Description
    if (medicalRecord.description) {
      doc.setFont(undefined, 'bold');
      doc.text('DESCRIPTION:', margin, yPosition);
      yPosition += 8;
      doc.setFont(undefined, 'normal');
      
      const descriptionLines = doc.splitTextToSize(medicalRecord.description, pageWidth - 2 * margin);
      doc.text(descriptionLines, margin, yPosition);
      yPosition += descriptionLines.length * 6 + 10;
    }

    // Test Results (for lab reports)
    if (medicalRecord.testResults && medicalRecord.testResults.results) {
      doc.setFont(undefined, 'bold');
      doc.text('TEST RESULTS:', margin, yPosition);
      yPosition += 8;
      doc.setFont(undefined, 'normal');

      medicalRecord.testResults.results.forEach(result => {
        doc.text(`${result.parameter}: ${result.value} ${result.unit}`, margin + 10, yPosition);
        yPosition += 6;
        
        if (result.normalRange) {
          doc.text(`   Normal Range: ${result.normalRange}`, margin + 15, yPosition);
          yPosition += 6;
        }
        
        if (result.isAbnormal) {
          doc.setTextColor(255, 0, 0);
          doc.text('   ABNORMAL', margin + 15, yPosition);
          doc.setTextColor(0, 0, 0);
          yPosition += 6;
        }
        
        yPosition += 3;
      });
    }

    // Vitals
    if (medicalRecord.vitals) {
      doc.setFont(undefined, 'bold');
      doc.text('VITAL SIGNS:', margin, yPosition);
      yPosition += 8;
      doc.setFont(undefined, 'normal');

      const vitals = medicalRecord.vitals;
      if (vitals.bloodPressure) {
        doc.text(`Blood Pressure: ${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic} mmHg`, margin + 10, yPosition);
        yPosition += 6;
      }
      if (vitals.heartRate) {
        doc.text(`Heart Rate: ${vitals.heartRate} bpm`, margin + 10, yPosition);
        yPosition += 6;
      }
      if (vitals.temperature) {
        doc.text(`Temperature: ${vitals.temperature}°C`, margin + 10, yPosition);
        yPosition += 6;
      }
      if (vitals.weight) {
        doc.text(`Weight: ${vitals.weight} kg`, margin + 10, yPosition);
        yPosition += 6;
      }
      if (vitals.height) {
        doc.text(`Height: ${vitals.height} cm`, margin + 10, yPosition);
        yPosition += 6;
      }
      if (vitals.bmi) {
        doc.text(`BMI: ${vitals.bmi}`, margin + 10, yPosition);
        yPosition += 6;
      }
    }

    // Footer
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
      doc.text('Smart Healthcare Assistant - Medical Record', pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }

    return doc.output('arraybuffer');
  } catch (error) {
    console.error('Error generating medical record PDF:', error);
    throw error;
  }
};

module.exports = {
  generatePrescriptionPDF,
  generateMedicalRecordPDF
}; 