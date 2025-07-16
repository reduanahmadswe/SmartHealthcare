// D:\SmartHealthcare\backend\controllers\labTest.controller.js
const { validationResult } = require('express-validator');
const LabTestService = require('./labTest.service'); 
const { asyncHandler } = require('../../middleware/errorHandler');

class LabTestController {
  static bookLabTest = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // req.user is populated by authentication middleware
    const labTest = await LabTestService.bookLabTest(req.body, req.user._id);

    res.status(201).json({
      success: true,
      message: 'Lab test booked successfully',
      data: { labTest }
    });
  });

  static getLabTests = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { labTests, pagination } = await LabTestService.getLabTests(req.user, req.query);

    res.json({
      success: true,
      data: { labTests, pagination }
    });
  });

  static getLabTestById = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const labTest = await LabTestService.getLabTestById(req.params.id, req.user);

    res.json({
      success: true,
      data: { labTest }
    });
  });

  static updateLabTestStatus = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { status, notes } = req.body;
    const labTestId = req.params.id;

    const updatedLabTest = await LabTestService.updateLabTestStatus(labTestId, status, notes, req.user._id);

    res.json({
      success: true,
      message: 'Lab test status updated successfully',
      data: { labTest: updatedLabTest }
    });
  });

  static uploadLabTestResults = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Check for file upload
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload results file' });
    }

    const { results } = req.body; // results should be an array of objects
    const labTestId = req.params.id;

    // `results` comes as a string from form-data, parse it
    const parsedResults = JSON.parse(results);

    const updatedLabTest = await LabTestService.uploadLabTestResults(
      labTestId,
      parsedResults,
      req.file,
      req.user._id
    );

    res.json({
      success: true,
      message: 'Lab test results uploaded successfully',
      data: { labTest: updatedLabTest }
    });
  });

  static getVerifiedLabs = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { labs, pagination } = await LabTestService.getVerifiedLabs(req.query);

    res.json({
      success: true,
      data: { labs, pagination }
    });
  });

  static getLabProfileById = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const lab = await LabTestService.getLabProfileById(req.params.id);

    res.json({
      success: true,
      data: { lab }
    });
  });

  static getLabSchedule = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { date } = req.query;
    const schedule = await LabTestService.getLabSchedule(req.params.id, date);

    res.json({
      success: true,
      data: schedule
    });
  });

  static getLabTestsForPatient = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { labTests, pagination } = await LabTestService.getLabTestsForPatient(req.params.patientId, req.user, req.query);

    res.json({
      success: true,
      data: { labTests, pagination }
    });
  });

  static getLabTestStatistics = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { startDate, endDate } = req.query;
    const statistics = await LabTestService.getLabTestStatistics(req.user, startDate, endDate);

    res.json({
      success: true,
      data: statistics
    });
  });
}

module.exports = LabTestController;