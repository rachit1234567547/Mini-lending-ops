// Central export for all Mongoose models
module.exports = {
  Admin: require('./Admin'),
  Borrower: require('./Borrower'),
  Loan: require('./Loan'),
  Repayment: require('./Repayment'),
  PTP: require('./PTP'),
  ActivityLog: require('./ActivityLog'),
};
