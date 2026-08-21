const mongoose = require('mongoose');

const ptpSchema = new mongoose.Schema(
  {
    loanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Loan',
      required: [true, 'Loan ID is required'],
    },
    promisedDate: {
      type: Date,
      required: [true, 'Promised date is required'],
    },
    amount: {
      type: Number,
      required: [true, 'PTP amount is required'],
      min: [1, 'Amount must be positive'],
    },
    status: {
      type: String,
      enum: ['open', 'kept', 'broken', 'cancelled'],
      default: 'open',
    },
    note: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PTP', ptpSchema);
