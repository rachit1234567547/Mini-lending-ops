const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    adminEmail: {
      type: String,
      required: [true, 'Admin email is required'],
      lowercase: true,
      trim: true,
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      enum: [
        'loan_approved',
        'loan_rejected',
        'loan_held',
        'loan_disbursed',
        'repayment_recorded',
        'ptp_created',
        'ptp_updated',
        'bank_verified',
      ],
    },
    loanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Loan',
      default: null,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    // createdAt is the activity timestamp
  }
);

module.exports = mongoose.model('ActivityLog', activityLogSchema);
