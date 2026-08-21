const { Loan, Repayment, PTP, ActivityLog } = require('../models');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalize a date to midnight UTC for day-level comparison.
 * Ensures "paid on same day as promised" counts as kept.
 */
const toDateOnly = (date) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

// ─── POST /admin/loans/:id/repayments ────────────────────────────────────────
/**
 * Record a repayment for a disbursed (or overdue) loan.
 *
 * SUCCESS repayment:
 *   1. Save repayment record
 *   2. Increment loan.repaidAmount
 *   3. Find open PTP → mark kept or broken based on date
 *   4. If repaidAmount >= loan.amount → loan status = repaid
 *
 * FAILED repayment:
 *   - Save record only
 *   - No repaidAmount change
 *   - No PTP change
 *   - No loan status change
 */
const recordRepayment = async (req, res) => {
  try {
    const { id: loanId } = req.params;
    const { amount, method, status, paidAt } = req.body;
    const { email: adminEmail } = req.admin;

    // ── Validate input ────────────────────────────────────────────────────────
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'A positive repayment amount is required.' });
    }
    if (!status || !['SUCCESS', 'FAILED'].includes(status)) {
      return res.status(400).json({ error: 'Status must be SUCCESS or FAILED.' });
    }

    // ── Find loan — must be disbursed or overdue ──────────────────────────────
    const loan = await Loan.findOne({
      _id: loanId,
      status: { $in: ['disbursed', 'overdue'] },
    });
    if (!loan) {
      return res.status(400).json({
        error: 'Repayment can only be recorded for disbursed or overdue loans.',
      });
    }

    const remainingBalance = loan.amount - (loan.repaidAmount || 0);
    if (status === 'SUCCESS' && Number(amount) > remainingBalance) {
      return res.status(400).json({
        error: `Repayment amount (${amount}) exceeds the remaining loan balance (${remainingBalance}).`,
      });
    }

    // ── Save repayment record ─────────────────────────────────────────────────
    const repaymentDate = paidAt ? new Date(paidAt) : new Date();
    const repayment = await Repayment.create({
      loanId: loan._id,
      amount: Number(amount),
      paidAt: repaymentDate,
      method: method || 'cash',
      status,
    });

    // ── FAILED: stop here — no side effects ──────────────────────────────────
    if (status === 'FAILED') {
      await ActivityLog.create({
        adminEmail,
        action: 'repayment_recorded',
        loanId: loan._id,
        meta: { amount: Number(amount), status: 'FAILED', repaymentId: repayment._id },
      });

      return res.json({
        success: true,
        repayment,
        loan: { status: loan.status, repaidAmount: loan.repaidAmount },
        ptpUpdated: null,
        message: 'FAILED repayment recorded. No loan or PTP changes applied.',
      });
    }

    // ── SUCCESS: update repaidAmount ─────────────────────────────────────────
    loan.repaidAmount = (loan.repaidAmount || 0) + Number(amount);

    // ── Check if fully repaid ────────────────────────────────────────────────
    if (loan.repaidAmount >= loan.amount) {
      loan.status = 'repaid';
    }
    await loan.save();

    // ── Auto-update open PTP (most recent open one) ───────────────────────────
    let ptpUpdated = null;
    const openPTP = await PTP.findOne({ loanId: loan._id, status: 'open' }).sort({ createdAt: -1 });

    if (openPTP) {
      const paidDay = toDateOnly(repaymentDate);
      const promisedDay = toDateOnly(openPTP.promisedDate);

      // paid day <= promised day → kept, else → broken
      openPTP.status = paidDay <= promisedDay ? 'kept' : 'broken';
      await openPTP.save();
      ptpUpdated = openPTP;

      await ActivityLog.create({
        adminEmail,
        action: 'ptp_updated',
        loanId: loan._id,
        meta: {
          ptpId: openPTP._id,
          newStatus: openPTP.status,
          paidDay: paidDay.toISOString(),
          promisedDay: promisedDay.toISOString(),
        },
      });
    }

    // ── Activity log for repayment ────────────────────────────────────────────
    await ActivityLog.create({
      adminEmail,
      action: 'repayment_recorded',
      loanId: loan._id,
      meta: {
        amount: Number(amount),
        status: 'SUCCESS',
        repaymentId: repayment._id,
        newRepaidAmount: loan.repaidAmount,
        loanStatus: loan.status,
      },
    });

    return res.json({
      success: true,
      repayment,
      loan: {
        status: loan.status,
        repaidAmount: loan.repaidAmount,
        amount: loan.amount,
      },
      ptpUpdated,
    });
  } catch (err) {
    console.error('[REPAYMENT] recordRepayment error:', err.message);
    return res.status(500).json({ error: 'Failed to record repayment.' });
  }
};

// ─── POST /admin/loans/:id/ptp ────────────────────────────────────────────────
/**
 * Create a Promise-to-Pay (PTP) for a loan.
 * PTP starts with status: 'open'.
 * Loan must be in disbursed or overdue status.
 */
const createPTP = async (req, res) => {
  try {
    const { id: loanId } = req.params;
    const { promisedDate, amount, note } = req.body;
    const { email: adminEmail } = req.admin;

    // ── Validate ──────────────────────────────────────────────────────────────
    if (!promisedDate) {
      return res.status(400).json({ error: 'Promised date is required.' });
    }
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'A positive PTP amount is required.' });
    }

    const parsedDate = new Date(promisedDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'Invalid promised date format.' });
    }

    // ── Loan must exist and be in active recovery state ───────────────────────
    const loan = await Loan.findOne({
      _id: loanId,
      status: { $in: ['disbursed', 'overdue'] },
    });
    if (!loan) {
      return res.status(400).json({
        error: 'PTP can only be created for disbursed or overdue loans.',
      });
    }

    // ── Create PTP ────────────────────────────────────────────────────────────
    const ptp = await PTP.create({
      loanId: loan._id,
      promisedDate: parsedDate,
      amount: Number(amount),
      status: 'open',
      note: note || null,
    });

    await ActivityLog.create({
      adminEmail,
      action: 'ptp_created',
      loanId: loan._id,
      meta: {
        ptpId: ptp._id,
        promisedDate: parsedDate.toISOString(),
        amount: Number(amount),
      },
    });

    return res.status(201).json({ success: true, ptp });
  } catch (err) {
    console.error('[PTP] createPTP error:', err.message);
    return res.status(500).json({ error: 'Failed to create PTP.' });
  }
};

module.exports = { recordRepayment, createPTP };
