const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  verificationResult: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Verification = mongoose.model('Verification', verificationSchema);

module.exports = Verification;