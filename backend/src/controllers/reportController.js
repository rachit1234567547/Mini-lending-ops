const { ActivityLog, Loan } = require('../models');

// ─── GET /admin/reports/decision-performance ──────────────────────────────────
/**
 * Decision Performance measures unique loans an admin has approved or rejected,
 * regardless of whether those loans were later disbursed.
 *
 * Source: ActivityLog (captures the action at the exact time it happened)
 * Counts DISTINCT loanIds per admin per action (loan_approved / loan_rejected).
 */
const getDecisionPerformance = async (req, res) => {
  try {
    const pipeline = [
      // Only care about final decisions (not holds)
      { $match: { action: { $in: ['loan_approved', 'loan_rejected'] } } },

      // Group by admin + action, collect unique loanIds
      {
        $group: {
          _id: { adminEmail: '$adminEmail', action: '$action' },
          uniqueLoanIds: { $addToSet: '$loanId' },
        },
      },

      // Project count of unique loans
      {
        $project: {
          _id: 0,
          adminEmail: '$_id.adminEmail',
          action: '$_id.action',
          count: { $size: '$uniqueLoanIds' },
        },
      },

      // Pivot: group by admin, spread approved/rejected into separate fields
      {
        $group: {
          _id: '$adminEmail',
          approved: {
            $sum: {
              $cond: [{ $eq: ['$action', 'loan_approved'] }, '$count', 0],
            },
          },
          rejected: {
            $sum: {
              $cond: [{ $eq: ['$action', 'loan_rejected'] }, '$count', 0],
            },
          },
        },
      },

      // Total decisions + sort by most active
      {
        $addFields: {
          adminEmail: '$_id',
          totalDecisions: { $add: ['$approved', '$rejected'] },
        },
      },
      { $unset: '_id' },
      { $sort: { totalDecisions: -1 } },
    ];

    const report = await ActivityLog.aggregate(pipeline);

    return res.json({
      success: true,
      explanation:
        'Decision Performance counts unique loans an admin has approved or rejected, ' +
        'regardless of whether those loans were later disbursed.',
      report,
    });
  } catch (err) {
    console.error('[REPORTS] getDecisionPerformance error:', err.message);
    return res.status(500).json({ error: 'Failed to generate Decision Performance report.' });
  }
};

// ─── GET /admin/reports/recovery ─────────────────────────────────────────────
/**
 * Recovery measures loans that have actually entered the disbursed/recovery lifecycle.
 * Only counts loans whose current status is: disbursed, overdue, or repaid.
 * Approved-but-not-disbursed loans are excluded.
 *
 * Source: Loan collection (current status reflects the recovery lifecycle)
 * Grouped by decisionByEmail (the admin who approved the loan for disbursement).
 */
const getRecoveryReport = async (req, res) => {
  try {
    const pipeline = [
      // Only loans in recovery lifecycle
      {
        $match: {
          status: { $in: ['disbursed', 'overdue', 'repaid'] },
          decisionByEmail: { $ne: null },
        },
      },

      // Group by the admin who made the approval decision
      {
        $group: {
          _id: '$decisionByEmail',
          decisionBy: { $first: '$decisionBy' },
          totalLoans: { $sum: 1 },
          disbursed: {
            $sum: { $cond: [{ $eq: ['$status', 'disbursed'] }, 1, 0] },
          },
          overdue: {
            $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] },
          },
          repaid: {
            $sum: { $cond: [{ $eq: ['$status', 'repaid'] }, 1, 0] },
          },
          totalDisbursedAmount: { $sum: '$amount' },
          totalRepaidAmount: { $sum: '$repaidAmount' },
        },
      },

      // Compute recovery rate
      {
        $addFields: {
          adminEmail: '$_id',
          recoveryRate: {
            $cond: [
              { $gt: ['$totalDisbursedAmount', 0] },
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ['$totalRepaidAmount', '$totalDisbursedAmount'] },
                      100,
                    ],
                  },
                  1,
                ],
              },
              0,
            ],
          },
        },
      },
      { $unset: '_id' },
      { $sort: { totalLoans: -1 } },
    ];

    const report = await Loan.aggregate(pipeline);

    return res.json({
      success: true,
      explanation:
        'Recovery measures loans that have actually reached the disbursed/recovery lifecycle, ' +
        'so approved-but-not-disbursed loans are excluded.',
      report,
    });
  } catch (err) {
    console.error('[REPORTS] getRecoveryReport error:', err.message);
    return res.status(500).json({ error: 'Failed to generate Recovery report.' });
  }
};

module.exports = { getDecisionPerformance, getRecoveryReport };
