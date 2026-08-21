const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { getDecisionPerformance, getRecoveryReport } = require('../controllers/reportController');

// Both reports require VIEW_REPORTS permission
// GET /admin/reports/decision-performance
router.get(
  '/reports/decision-performance',
  authenticate,
  authorize('VIEW_REPORTS'),
  getDecisionPerformance
);

// GET /admin/reports/recovery
router.get(
  '/reports/recovery',
  authenticate,
  authorize('VIEW_REPORTS'),
  getRecoveryReport
);

module.exports = router;
