const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { updateBankDetails, getBorrowerById } = require('../controllers/borrowerController');

// GET /admin/borrowers/:id — view borrower details
router.get('/borrowers/:id', authenticate, authorize('VIEW_LOANS'), getBorrowerById);

// POST /admin/borrowers/:id/bank — verify IFSC + save bank details
// Flow: React UI → Express → Razorpay → Express → React UI
router.post('/borrowers/:id/bank', authenticate, authorize('DECIDE_LOANS'), updateBankDetails);

module.exports = router;
