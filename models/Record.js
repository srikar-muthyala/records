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
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Record', recordSchema);
