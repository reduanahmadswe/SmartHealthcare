// // routes/index.js
// const express = require('express');
// const router = express.Router();

// // Import all route modules
// router.use('/auth', require('./auth'));
// router.use('/users', require('./users'));
// router.use('/doctors', require('./doctors'));
// router.use('/appointments', require('./appointments'));
// router.use('/prescriptions', require('./prescriptions'));
// router.use('/medical-records', require('./medicalRecords'));
// router.use('/lab-tests', require('./labTests'));
// router.use('/payments', require('./payments'));
// router.use('/admin', require('./admin'));
// router.use('/chat', require('./chat'));
// router.use('/analytics', require('./analytics'));
// router.use('/health', require('./healthData'));
// router.use('/inventory', require('./inventory'));
// router.use('/logs', require('./logs'));

// module.exports = router;



const express = require('express');
const router = express.Router();

// ✅ All route modules
const UserRoutes  = require('../modules/user/user.route');

const AuthRoutes = require('./auth');
const DoctorRoutes = require('../modules/doctor/doctor.route');
const AppointmentRoutes = require('../modules/appointment/appointment.route');
const PrescriptionRoutes = require('../modules/prescription/prescription.route');
const MedicalRecordRoutes = require('../modules/medicalRecord/medicalRecord.route');
const LabTestRoutes = require('../modules/labTest/labTest.route');
// const PaymentRoutes = require('../modules/payment/payment.route');
const AdminRoutes = require('../modules/admin/admin.route');
// const ChatRoutes = require('../modules/chat/chat.route');
// const AnalyticsRoutes = require('../modules/analytics/analytics.route');
const HealthDataRoutes = require('../modules/healthData/healthData.route');
const InventoryRoutes = require('../modules/inventory/inventory.route');
// const LogRoutes = require('../modules/log/log.route');

// ✅ All route use
router.use('/user', UserRoutes);
router.use('/auth', AuthRoutes);
router.use('/doctors', DoctorRoutes);
router.use('/appointments', AppointmentRoutes);
router.use('/prescriptions', PrescriptionRoutes);
router.use('/medical-records', MedicalRecordRoutes);
router.use('/lab-tests', LabTestRoutes);
// router.use('/payments', PaymentRoutes);
router.use('/admin', AdminRoutes);
// router.use('/chat', ChatRoutes);
// router.use('/analytics', AnalyticsRoutes);
router.use('/health', HealthDataRoutes);
router.use('/inventory', InventoryRoutes);
// router.use('/logs', LogRoutes);

// ✅ Export the router
module.exports = router;
