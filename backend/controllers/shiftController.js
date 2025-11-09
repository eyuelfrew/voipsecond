const Shift = require('../models/shiftModel');
const asyncHandler = require('express-async-handler');

// @desc    Clock in - Start a new shift
// @route   POST /api/shifts/clock-in
// @access  Private
const clockIn = asyncHandler(async (req, res) => {
  const { agentId } = req.body;

  if (!agentId) {
    res.status(400);
    throw new Error('Agent ID is required');
  }

  // Check if agent already has an active shift today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const existingShift = await Shift.findOne({
    agentId,
    startTime: { $gte: today },
    status: { $in: ['active', 'on_break'] }
  });

  if (existingShift) {
    return res.status(400).json({ 
      success: false, 
      error: 'Agent already has an active shift today' 
    });
  }

  const shift = new Shift({
    agentId,
    startTime: new Date(),
    status: 'active',
  });

  const createdShift = await shift.save();
  res.status(201).json({ success: true, shift: createdShift });
});

// @desc    Clock out - End current shift
// @route   POST /api/shifts/clock-out
// @access  Private
const clockOut = asyncHandler(async (req, res) => {
  const { agentId } = req.body;

  if (!agentId) {
    res.status(400);
    throw new Error('Agent ID is required');
  }

  // Find active shift for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const shift = await Shift.findOne({
    agentId,
    startTime: { $gte: today },
    status: { $in: ['active', 'on_break'] }
  });

  if (!shift) {
    return res.status(404).json({ 
      success: false, 
      error: 'No active shift found' 
    });
  }

  // End any active break
  if (shift.status === 'on_break' && shift.breaks.length > 0) {
    const lastBreak = shift.breaks[shift.breaks.length - 1];
    if (!lastBreak.endTime) {
      lastBreak.endTime = new Date();
      lastBreak.duration = Math.floor((lastBreak.endTime - lastBreak.startTime) / 1000);
      shift.totalBreakTime += lastBreak.duration;
    }
  }

  shift.endTime = new Date();
  shift.status = 'ended';
  
  // Calculate total work time (excluding breaks)
  const totalShiftTime = Math.floor((shift.endTime - shift.startTime) / 1000);
  shift.totalWorkTime = totalShiftTime - shift.totalBreakTime;

  const updatedShift = await shift.save();
  res.json({ success: true, shift: updatedShift });
});

// @desc    Start a break
// @route   POST /api/shifts/start-break
// @access  Private
const startBreak = asyncHandler(async (req, res) => {
  const { agentId, breakType } = req.body;

  if (!agentId || !breakType) {
    res.status(400);
    throw new Error('Agent ID and break type are required');
  }

  // Find active shift
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const shift = await Shift.findOne({
    agentId,
    startTime: { $gte: today },
    status: 'active'
  });

  if (!shift) {
    return res.status(404).json({ 
      success: false, 
      error: 'No active shift found' 
    });
  }

  // Add new break
  shift.breaks.push({
    type: breakType,
    startTime: new Date(),
  });
  shift.status = 'on_break';

  const updatedShift = await shift.save();
  res.json({ success: true, shift: updatedShift });
});

// @desc    End current break
// @route   POST /api/shifts/end-break
// @access  Private
const endBreak = asyncHandler(async (req, res) => {
  const { agentId } = req.body;

  if (!agentId) {
    res.status(400);
    throw new Error('Agent ID is required');
  }

  // Find shift on break
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const shift = await Shift.findOne({
    agentId,
    startTime: { $gte: today },
    status: 'on_break'
  });

  if (!shift) {
    return res.status(404).json({ 
      success: false, 
      error: 'No active break found' 
    });
  }

  // End the last break
  const lastBreak = shift.breaks[shift.breaks.length - 1];
  if (lastBreak && !lastBreak.endTime) {
    lastBreak.endTime = new Date();
    lastBreak.duration = Math.floor((lastBreak.endTime - lastBreak.startTime) / 1000);
    shift.totalBreakTime += lastBreak.duration;
  }

  shift.status = 'active';

  const updatedShift = await shift.save();
  res.json({ success: true, shift: updatedShift, breaks: shift.breaks });
});

// @desc    Get today's shift for an agent
// @route   GET /api/shifts/today/:agentId
// @access  Private
const getTodayShift = asyncHandler(async (req, res) => {
  const { agentId } = req.params;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const shift = await Shift.findOne({
    agentId,
    startTime: { $gte: today }
  }).sort({ startTime: -1 });

  if (shift) {
    res.json({ success: true, shift });
  } else {
    res.json({ success: true, shift: null });
  }
});

// @desc    Get all shifts for an agent
// @route   GET /api/shifts/agent/:agentId
// @access  Private
const getAgentShifts = asyncHandler(async (req, res) => {
  const shifts = await Shift.find({ agentId: req.params.agentId })
    .sort({ startTime: -1 })
    .limit(30);
  res.json({ success: true, shifts });
});

// @desc    Get shift statistics
// @route   GET /api/shifts/stats/:agentId
// @access  Private
const getShiftStats = asyncHandler(async (req, res) => {
  const { agentId } = req.params;
  const { startDate, endDate } = req.query;

  const query = { agentId };
  
  if (startDate && endDate) {
    query.startTime = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const shifts = await Shift.find(query);

  const stats = {
    totalShifts: shifts.length,
    totalWorkTime: shifts.reduce((sum, s) => sum + (s.totalWorkTime || 0), 0),
    totalBreakTime: shifts.reduce((sum, s) => sum + (s.totalBreakTime || 0), 0),
    totalCallsHandled: shifts.reduce((sum, s) => sum + (s.callsHandled || 0), 0),
    totalTicketsResolved: shifts.reduce((sum, s) => sum + (s.ticketsResolved || 0), 0),
    averageShiftDuration: 0,
  };

  if (stats.totalShifts > 0) {
    stats.averageShiftDuration = Math.floor(stats.totalWorkTime / stats.totalShifts);
  }

  res.json({ success: true, stats });
});

// @desc    Get all active shifts (for admin/supervisor)
// @route   GET /api/shifts/active
// @access  Private (Admin/Supervisor)
const getActiveShifts = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeShifts = await Shift.find({
    startTime: { $gte: today },
    status: { $in: ['active', 'on_break'] }
  }).populate('agentId', 'name username extension');

  res.json({ success: true, shifts: activeShifts });
});

// @desc    Get all shifts for today (for admin/supervisor)
// @route   GET /api/shifts/all-today
// @access  Private (Admin/Supervisor)
const getAllTodayShifts = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const shifts = await Shift.find({
    startTime: { $gte: today }
  }).populate('agentId', 'name username extension')
    .sort({ startTime: -1 });

  res.json({ success: true, shifts });
});

// @desc    Get shift summary for all agents (for admin/supervisor)
// @route   GET /api/shifts/summary
// @access  Private (Admin/Supervisor)
const getShiftSummary = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const query = {};
  if (startDate && endDate) {
    query.startTime = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  } else {
    // Default to today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    query.startTime = { $gte: today };
  }

  const shifts = await Shift.find(query)
    .populate('agentId', 'name username extension')
    .sort({ startTime: -1 });

  // Group by agent
  const agentSummary = {};
  shifts.forEach(shift => {
    const agentId = shift.agentId?._id?.toString();
    if (!agentId) return;

    if (!agentSummary[agentId]) {
      agentSummary[agentId] = {
        agent: shift.agentId,
        totalShifts: 0,
        totalWorkTime: 0,
        totalBreakTime: 0,
        totalCallsHandled: 0,
        totalTicketsResolved: 0,
        shifts: []
      };
    }

    agentSummary[agentId].totalShifts++;
    agentSummary[agentId].totalWorkTime += shift.totalWorkTime || 0;
    agentSummary[agentId].totalBreakTime += shift.totalBreakTime || 0;
    agentSummary[agentId].totalCallsHandled += shift.callsHandled || 0;
    agentSummary[agentId].totalTicketsResolved += shift.ticketsResolved || 0;
    agentSummary[agentId].shifts.push(shift);
  });

  const summary = Object.values(agentSummary);

  res.json({ success: true, summary, totalShifts: shifts.length });
});

module.exports = {
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
};
