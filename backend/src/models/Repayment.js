const mongoose = require('mongoose');

const repaymentSchema = new mongoose.Schema(
  {
    loanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Loan',
      required: [true, 'Loan ID is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Repayment amount is required'],
      min: [1, 'Amount must be positive'],
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },
    method: {
      type: String,
      enum: ['cash', 'bank_transfer', 'upi', 'cheque', 'other'],
      default: 'cash',
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED'],
      required: [true, 'Repayment status is required'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Repayment', repaymentSchema);
