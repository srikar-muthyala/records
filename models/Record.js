const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['available', 'borrowed'],
    default: 'available'
  },
  currentHolder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  borrowedDate: {
    type: Date,
    default: null
  },
  returnDate: {
    type: Date,
    default: null
  },
  // Pension/Employee specific fields
  branchCode: {
    type: String,
    trim: true
  },
  fileId: {
    type: String,
    trim: true
  },
  employeeId: {
    type: String,
    trim: true
  },
  name: {
    type: String,
    trim: true
  },
  ppoUniqueId: {
    type: String,
    trim: true
  },
  pensionStatus: {
    type: String,
    enum: ['A', 'D', 'S', ''],
    trim: true
  },
  groupId: {
    type: String,
    trim: true
  },
  mobileNumber: {
    type: String,
    trim: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
recordSchema.index({ title: 'text', description: 'text', name: 'text' });
recordSchema.index({ employeeId: 1 });
recordSchema.index({ ppoUniqueId: 1 });
recordSchema.index({ category: 1 });
recordSchema.index({ status: 1 });
recordSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Record', recordSchema);
