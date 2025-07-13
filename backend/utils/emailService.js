const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Email templates
const emailTemplates = {
  emailVerification: (context) => ({
    subject: 'Verify Your Email - Smart Healthcare Assistant',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">Smart Healthcare Assistant</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Email Verification</p>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${context.name},</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Thank you for registering with Smart Healthcare Assistant. To complete your registration, 
            please verify your email address by clicking the button below.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${context.verificationUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 5px; 
                      display: inline-block; 
                      font-weight: bold;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            If the button doesn't work, you can copy and paste this link into your browser:
          </p>
          
          <p style="color: #667eea; word-break: break-all; margin-bottom: 20px;">
            ${context.verificationUrl}
          </p>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            This verification link will expire in ${context.expiryHours} hours.
          </p>
          
          <p style="color: #666; line-height: 1.6;">
            If you didn't create an account with us, please ignore this email.
          </p>
        </div>
        
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">© 2024 Smart Healthcare Assistant. All rights reserved.</p>
        </div>
      </div>
    `
  }),

  passwordReset: (context) => ({
    subject: 'Reset Your Password - Smart Healthcare Assistant',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">Smart Healthcare Assistant</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Password Reset</p>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${context.name},</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            We received a request to reset your password. Click the button below to create a new password.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${context.resetUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 5px; 
                      display: inline-block; 
                      font-weight: bold;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            If the button doesn't work, you can copy and paste this link into your browser:
          </p>
          
          <p style="color: #667eea; word-break: break-all; margin-bottom: 20px;">
            ${context.resetUrl}
          </p>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            This reset link will expire in ${context.expiryHours} hours.
          </p>
          
          <p style="color: #666; line-height: 1.6;">
            If you didn't request a password reset, please ignore this email.
          </p>
        </div>
        
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">© 2024 Smart Healthcare Assistant. All rights reserved.</p>
        </div>
      </div>
    `
  }),

  appointmentConfirmation: (context) => ({
    subject: 'Appointment Confirmed - Smart Healthcare Assistant',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">Smart Healthcare Assistant</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Appointment Confirmation</p>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${context.patientName},</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Your appointment has been confirmed. Here are the details:
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-bottom: 15px;">Appointment Details</h3>
            <p><strong>Doctor:</strong> Dr. ${context.doctorName}</p>
            <p><strong>Date:</strong> ${context.appointmentDate}</p>
            <p><strong>Time:</strong> ${context.appointmentTime}</p>
            <p><strong>Type:</strong> ${context.appointmentType}</p>
            <p><strong>Mode:</strong> ${context.appointmentMode}</p>
            <p><strong>Fee:</strong> ${context.consultationFee} BDT</p>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Please arrive 10 minutes before your scheduled time. If you need to reschedule or cancel, 
            please contact us at least 24 hours in advance.
          </p>
          
          <p style="color: #666; line-height: 1.6;">
            Thank you for choosing Smart Healthcare Assistant.
          </p>
        </div>
        
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">© 2024 Smart Healthcare Assistant. All rights reserved.</p>
        </div>
      </div>
    `
  }),

  appointmentReminder: (context) => ({
    subject: 'Appointment Reminder - Smart Healthcare Assistant',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">Smart Healthcare Assistant</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Appointment Reminder</p>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${context.patientName},</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            This is a friendly reminder about your upcoming appointment.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-bottom: 15px;">Appointment Details</h3>
            <p><strong>Doctor:</strong> Dr. ${context.doctorName}</p>
            <p><strong>Date:</strong> ${context.appointmentDate}</p>
            <p><strong>Time:</strong> ${context.appointmentTime}</p>
            <p><strong>Type:</strong> ${context.appointmentType}</p>
            <p><strong>Mode:</strong> ${context.appointmentMode}</p>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Please arrive 10 minutes before your scheduled time. If you need to reschedule or cancel, 
            please contact us as soon as possible.
          </p>
          
          <p style="color: #666; line-height: 1.6;">
            Thank you for choosing Smart Healthcare Assistant.
          </p>
        </div>
        
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">© 2024 Smart Healthcare Assistant. All rights reserved.</p>
        </div>
      </div>
    `
  }),

  prescriptionReady: (context) => ({
    subject: 'Prescription Ready - Smart Healthcare Assistant',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">Smart Healthcare Assistant</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Prescription Ready</p>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${context.patientName},</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Your prescription is ready and available for download.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-bottom: 15px;">Prescription Details</h3>
            <p><strong>Prescription Number:</strong> ${context.prescriptionNumber}</p>
            <p><strong>Doctor:</strong> Dr. ${context.doctorName}</p>
            <p><strong>Date:</strong> ${context.prescriptionDate}</p>
            <p><strong>Medications:</strong> ${context.medicationCount} items</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${context.downloadUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 5px; 
                      display: inline-block; 
                      font-weight: bold;">
              Download Prescription
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            Please follow your doctor's instructions carefully and contact us if you have any questions.
          </p>
        </div>
        
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">© 2024 Smart Healthcare Assistant. All rights reserved.</p>
        </div>
      </div>
    `
  }),

  labResultReady: (context) => ({
    subject: 'Lab Test Results Ready - Smart Healthcare Assistant',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">Smart Healthcare Assistant</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Lab Test Results</p>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${context.patientName},</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Your lab test results are ready and available for viewing.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-bottom: 15px;">Test Details</h3>
            <p><strong>Test Name:</strong> ${context.testName}</p>
            <p><strong>Test Code:</strong> ${context.testCode}</p>
            <p><strong>Test Date:</strong> ${context.testDate}</p>
            <p><strong>Lab:</strong> ${context.labName}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${context.resultUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 5px; 
                      display: inline-block; 
                      font-weight: bold;">
              View Results
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            Please review your results and contact your doctor if you have any questions.
          </p>
        </div>
        
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">© 2024 Smart Healthcare Assistant. All rights reserved.</p>
        </div>
      </div>
    `
  })
};

// Send email function
const sendEmail = async ({ to, subject, template, context, html, text }) => {
  try {
    const transporter = createTransporter();
    
    let emailContent;
    
    if (template && emailTemplates[template]) {
      const templateContent = emailTemplates[template](context);
      emailContent = {
        from: `"Smart Healthcare Assistant" <${process.env.EMAIL_USER}>`,
        to,
        subject: templateContent.subject || subject,
        html: templateContent.html
      };
    } else {
      emailContent = {
        from: `"Smart Healthcare Assistant" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        text
      };
    }

    const info = await transporter.sendMail(emailContent);
    
    console.log('Email sent successfully:', {
      messageId: info.messageId,
      to,
      subject: emailContent.subject
    });
    
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Send bulk emails
const sendBulkEmail = async (emails) => {
  try {
    const transporter = createTransporter();
    const results = [];
    
    for (const email of emails) {
      try {
        const info = await transporter.sendMail(email);
        results.push({ success: true, messageId: info.messageId, to: email.to });
      } catch (error) {
        results.push({ success: false, error: error.message, to: email.to });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error sending bulk emails:', error);
    throw error;
  }
};

module.exports = {
  sendEmail,
  sendBulkEmail,
  emailTemplates
}; 