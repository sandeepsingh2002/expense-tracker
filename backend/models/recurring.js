const mongoose = require('mongoose');

const recurringSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  paymentMode: {
    type: String,
    enum: ['cash', 'upi', 'card', 'netbanking', 'other'],
    default: 'upi'
  },
  dayOfMonth: {
    type: Number,  // 1-31
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastAdded: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Recurring', recurringSchema);