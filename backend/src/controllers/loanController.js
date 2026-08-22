const { Loan, Borrower, Repayment, PTP, ActivityLog } = require('../models');
const { sendDecisionEmail } = require('../services/emailService');

// ─── GET /admin/loans ─────────────────────────────────────────────────────────
// Filter by ?status=pending|approved|rejected|on_hold|disbursed|overdue|repaid
const getLoans = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const loans = await Loan.find(filter)
      .populate('borrowerId', 'name email phone kycStatus')
      .sort({ createdAt: -1 });

    return res.json({ success: true, loans });
  } catch (err) {
    console.error('[LOANS] getLoans error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch loans.' });
  }
};

// ─── GET /admin/loans/:id ────────────────────────────────────────────────────
// Loan detail + repayments + PTPs
const getLoanById = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id).populate(
      'borrowerId',
      'name email phone kycStatus bank'
    );
    if (!loan) return res.status(404).json({ error: 'Loan not found.' });

    const [repayments, ptps, activityLogs] = await Promise.all([
      Repayment.find({ loanId: loan._id }).sort({ paidAt: -1 }),
      PTP.find({ loanId: loan._id }).sort({ createdAt: -1 }),
      ActivityLog.find({ loanId: loan._id }).sort({ createdAt: -1 }),
    ]);

    return res.json({ success: true, loan, repayments, ptps, activityLogs });
  } catch (err) {
    console.error('[LOANS] getLoanById error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch loan details.' });
  }
};

// ─── POST /admin/loans/:id/approve ───────────────────────────────────────────
// ATOMIC: only succeeds if loan is currently pending or on_hold
const approveLoan = async (req, res) => {
  try {
    const { comment } = req.body;
    const { id: loanId } = req.params;
    const { name, email } = req.admin;

    // ATOMIC update — status must be in filter to prevent double approval
    const loan = await Loan.findOneAndUpdate(
      { _id: loanId, status: { $in: ['pending', 'on_hold'] } },
      {
        status: 'approved',
        decisionBy: name,
        decisionByEmail: email,
        decisionAt: new Date(),
        decisionComment: comment || null,
      },
      { new: true }
    ).populate('borrowerId', 'name email');

    // If null — loan was not in pending/on_hold (already decided or not found)
    if (!loan) {
      return res.status(409).json({
        error: 'Loan is not available for approval. It may already have been decided.',
      });
    }

    // ActivityLog — exactly one entry per atomic success
    await ActivityLog.create({
      adminEmail: email,
      action: 'loan_approved',
      loanId: loan._id,
      meta: { comment: comment || null },
    });

    // Send email asynchronously in the background so it doesn't block the HTTP response
    sendDecisionEmail({
      borrowerEmail: loan.borrowerId.email,
      borrowerName: loan.borrowerId.name,
      loanAmount: loan.amount,
      status: 'approved',
      comment: comment || '',
    }).catch(emailErr => {
      console.error('[EMAIL] Background sending failed:', emailErr.message);
    });

    return res.json({ success: true, emailSent: 'pending_background', loan });
  } catch (err) {
    console.error('[LOANS] approveLoan error:', err.message);
    return res.status(500).json({ error: 'Failed to approve loan.' });
  }
};

// ─── POST /admin/loans/:id/reject ────────────────────────────────────────────
// ATOMIC: only succeeds if loan is currently pending or on_hold
const rejectLoan = async (req, res) => {
  try {
    const { comment } = req.body;
    const { id: loanId } = req.params;
    const { name, email } = req.admin;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: 'A comment is required when rejecting a loan.' });
    }

    // ATOMIC update
    const loan = await Loan.findOneAndUpdate(
      { _id: loanId, status: { $in: ['pending', 'on_hold'] } },
      {
        status: 'rejected',
        decisionBy: name,
        decisionByEmail: email,
        decisionAt: new Date(),
        decisionComment: comment,
      },
      { new: true }
    ).populate('borrowerId', 'name email');

    if (!loan) {
      return res.status(409).json({
        error: 'Loan is not available for rejection. It may already have been decided.',
      });
    }

    // ActivityLog
    await ActivityLog.create({
      adminEmail: email,
      action: 'loan_rejected',
      loanId: loan._id,
      meta: { comment },
    });

    // Send email — never fail the decision
    // Send email asynchronously in the background so it doesn't block the HTTP response
    sendDecisionEmail({
      borrowerEmail: loan.borrowerId.email,
      borrowerName: loan.borrowerId.name,
      loanAmount: loan.amount,
      status: 'rejected',
      comment,
    }).catch(emailErr => {
      console.error('[EMAIL] Background sending failed:', emailErr.message);
    });

    return res.json({ success: true, emailSent: 'pending_background', loan });
  } catch (err) {
    console.error('[LOANS] rejectLoan error:', err.message);
    return res.status(500).json({ error: 'Failed to reject loan.' });
  }
};

// ─── POST /admin/loans/:id/hold ───────────────────────────────────────────────
// ATOMIC: only succeeds if loan is currently pending
const holdLoan = async (req, res) => {
  try {
    const { comment } = req.body;
    const { id: loanId } = req.params;
    const { name, email } = req.admin;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: 'A comment is required when putting a loan on hold.' });
    }

    const loan = await Loan.findOneAndUpdate(
      { _id: loanId, status: 'pending' },
      {
        status: 'on_hold',
        decisionBy: name,
        decisionByEmail: email,
        decisionAt: new Date(),
        decisionComment: comment,
      },
      { new: true }
    ).populate('borrowerId', 'name email');

    if (!loan) {
      return res.status(409).json({
        error: 'Loan is not available for hold. Only pending loans can be put on hold.',
      });
    }

    await ActivityLog.create({
      adminEmail: email,
      action: 'loan_held',
      loanId: loan._id,
      meta: { comment },
    });

    return res.json({ success: true, loan });
  } catch (err) {
    console.error('[LOANS] holdLoan error:', err.message);
    return res.status(500).json({ error: 'Failed to put loan on hold.' });
  }
};

// ─── POST /admin/loans/:id/disburse ──────────────────────────────────────────
// approved → disbursed only
const disburseLoan = async (req, res) => {
  try {
    const { id: loanId } = req.params;
    const { email } = req.admin;

    const loan = await Loan.findOneAndUpdate(
      { _id: loanId, status: 'approved' },
      {
        status: 'disbursed',
        disbursedAt: new Date(),
      },
      { new: true }
    ).populate('borrowerId', 'name email');

    if (!loan) {
      return res.status(400).json({
        error: 'Loan cannot be disbursed. Only approved loans can be disbursed.',
      });
    }

    await ActivityLog.create({
      adminEmail: email,
      action: 'loan_disbursed',
      loanId: loan._id,
      meta: {},
    });

    return res.json({ success: true, loan });
  } catch (err) {
    console.error('[LOANS] disburseLoan error:', err.message);
    return res.status(500).json({ error: 'Failed to disburse loan.' });
  }
};

module.exports = {
  getLoans,
  getLoanById,
  approveLoan,
  rejectLoan,
  holdLoan,
  disburseLoan,
};
