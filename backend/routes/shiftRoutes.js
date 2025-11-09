const express = require('express');
const router = express.Router();
const {
  clockIn,
  clockOut,
  startBreak,
  endBreak,
  getTodayShift,
  getAgentShifts,
  getShiftStats,
  getActiveShifts,
  getAllTodayShifts,
  getShiftSummary,
} = require('../controllers/shiftController');

// Shift management (Agent)
router.post('/clock-in', clockIn);
router.post('/clock-out', clockOut);
router.post('/start-break', startBreak);
router.post('/end-break', endBreak);

// Get shift data (Agent)
router.get('/today/:agentId', getTodayShift);
router.get('/agent/:agentId', getAgentShifts);
router.get('/stats/:agentId', getShiftStats);

// Admin/Supervisor endpoints
router.get('/active', getActiveShifts);           // Get all currently active shifts
router.get('/all-today', getAllTodayShifts);      // Get all shifts for today
router.get('/summary', getShiftSummary);          // Get shift summary grouped by agent

module.exports = router;
