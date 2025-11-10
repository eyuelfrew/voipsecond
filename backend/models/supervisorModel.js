const mongoose = require('mongoose');

const supervisorSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
}, { timestamps: true });
// Match supervisor entered password to hashed password in database

const Supervisor = mongoose.model('Supervisor', supervisorSchema);

module.exports = Supervisor;