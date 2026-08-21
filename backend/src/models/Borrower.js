const mongoose = require('mongoose');

const borrowerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },
    kycStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    // Bank details — only populated after IFSC verification
    bank: {
      ifsc: { type: String, default: null },
      accountLast4: { type: String, default: null },
      bankName: { type: String, default: null },
      branch: { type: String, default: null },
      city: { type: String, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Borrower', borrowerSchema);
