const mongoose = require('mongoose');

const breakSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['short', 'lunch', 'other'],
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
  },
  duration: {
    type: Number, // in seconds
  },
});

const shiftSchema = new mongoose.Schema({
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['active', 'on_break', 'ended'],
    default: 'active',
  },
  breaks: [breakSchema],
  totalWorkTime: {
    type: Number, // in seconds
    default: 0,
  },
  totalBreakTime: {
    type: Number, // in seconds
    default: 0,
  },
  callsHandled: {
    type: Number,
    default: 0,
  },
  ticketsResolved: {
    type: Number,
    default: 0,
  },
  reason: {
    type: String,
    default: '',
  },
}, { timestamps: true });

const Shift = mongoose.model('Shift', shiftSchema);

module.exports = Shift;
