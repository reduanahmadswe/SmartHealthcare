// routes/index.js
const express = require('express');
const router = express.Router();

// Import all route modules
router.use('/auth', require('./auth'));
router.use('/users', require('./users'));
router.use('/doctors', require('./doctors'));
router.use('/appointments', require('./appointments'));
router.use('/prescriptions', require('./prescriptions'));
router.use('/medical-records', require('./medicalRecords'));
router.use('/lab-tests', require('./labTests'));
router.use('/payments', require('./payments'));
router.use('/admin', require('./admin'));
router.use('/chat', require('./chat'));
router.use('/analytics', require('./analytics'));
router.use('/health', require('./healthData'));
router.use('/inventory', require('./inventory'));
router.use('/logs', require('./logs'));

module.exports = router;
