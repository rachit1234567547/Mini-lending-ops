const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const {
  getLoans,
  getLoanById,
  approveLoan,
  rejectLoan,
  holdLoan,
  disburseLoan,
} = require('../controllers/loanController');
const { recordRepayment, createPTP } = require('../controllers/repaymentController');

// ── Loan listing & detail (VIEW_LOANS) ───────────────────────────────────────
router.get('/loans', authenticate, authorize('VIEW_LOANS'), getLoans);
router.get('/loans/:id', authenticate, authorize('VIEW_LOANS'), getLoanById);

// ── Loan decisions (DECIDE_LOANS) ────────────────────────────────────────────
router.post('/loans/:id/approve', authenticate, authorize('DECIDE_LOANS'), approveLoan);
router.post('/loans/:id/reject', authenticate, authorize('DECIDE_LOANS'), rejectLoan);
router.post('/loans/:id/hold', authenticate, authorize('DECIDE_LOANS'), holdLoan);

// ── Disbursement (DECIDE_LOANS) ──────────────────────────────────────────────
router.post('/loans/:id/disburse', authenticate, authorize('DECIDE_LOANS'), disburseLoan);

// ── Repayments (RECORD_REPAYMENT) ────────────────────────────────────────────
router.post('/loans/:id/repayments', authenticate, authorize('RECORD_REPAYMENT'), recordRepayment);

// ── PTP (MANAGE_PTP) ─────────────────────────────────────────────────────────
router.post('/loans/:id/ptp', authenticate, authorize('MANAGE_PTP'), createPTP);

module.exports = router;
