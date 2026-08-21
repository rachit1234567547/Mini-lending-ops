const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema(
  {
    borrowerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Borrower',
      required: [true, 'Borrower ID is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Loan amount is required'],
      min: [1, 'Amount must be positive'],
    },
    status: {
      type: String,
      enum: [
        'pending',
        'approved',
        'rejected',
        'on_hold',
        'disbursed',
        'overdue',
        'repaid',
      ],
      default: 'pending',
    },

    // Decision fields — populated on approve/reject/hold
    decisionBy: { type: String, default: null },       // Admin name
    decisionByEmail: { type: String, default: null },  // Admin email
    decisionAt: { type: Date, default: null },
    decisionComment: { type: String, default: null },

    // Disbursement
    disbursedAt: { type: Date, default: null },

    // Running repayment total
    repaidAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Loan', loanSchema);
