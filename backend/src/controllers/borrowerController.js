const { Borrower } = require('../models');
const { lookupIFSC } = require('../services/ifscService');

// ─── POST /admin/borrowers/:id/bank ──────────────────────────────────────────
// Verify IFSC through Razorpay, then save bank details to borrower.
// Flow: React UI → Express (here) → Razorpay → Express → React UI
const updateBankDetails = async (req, res) => {
  try {
    const { id: borrowerId } = req.params;
    const { ifsc, accountLast4 } = req.body;

    // ── Input validation ──────────────────────────────────────────────────────
    if (!ifsc || !ifsc.trim()) {
      return res.status(400).json({ error: 'IFSC code is required.' });
    }
    if (!accountLast4 || !/^\d{4}$/.test(accountLast4)) {
      return res.status(400).json({ error: 'Account last 4 digits must be exactly 4 digits.' });
    }

    // ── Confirm borrower exists ───────────────────────────────────────────────
    const borrower = await Borrower.findById(borrowerId);
    if (!borrower) {
      return res.status(404).json({ error: 'Borrower not found.' });
    }

    // ── Call Razorpay IFSC API via backend (never from browser) ──────────────
    let ifscData;
    try {
      ifscData = await lookupIFSC(ifsc.trim());
    } catch (ifscErr) {
      if (ifscErr.isInvalidIFSC) {
        // Invalid IFSC — return 400, do NOT save any partial data
        return res.status(400).json({
          error: ifscErr.message,
          field: 'ifsc',
        });
      }
      // Network / timeout error
      return res.status(503).json({
        error: 'Could not reach IFSC lookup service. Please try again.',
      });
    }

    // ── Save verified bank details atomically ─────────────────────────────────
    // Only saved after successful Razorpay response — no partial saves possible
    borrower.bank = {
      ifsc: ifscData.IFSC,
      accountLast4,
      bankName: ifscData.BANK,
      branch: ifscData.BRANCH,
      city: ifscData.CITY,
    };
    await borrower.save();

    return res.json({
      success: true,
      bank: {
        ifsc: borrower.bank.ifsc,
        accountLast4: borrower.bank.accountLast4,
        bankName: borrower.bank.bankName,
        branch: borrower.bank.branch,
        city: borrower.bank.city,
      },
    });
  } catch (err) {
    console.error('[BORROWER] updateBankDetails error:', err.message);
    return res.status(500).json({ error: 'Failed to update bank details.' });
  }
};

// ─── GET /admin/borrowers/:id ─────────────────────────────────────────────────
const getBorrowerById = async (req, res) => {
  try {
    const borrower = await Borrower.findById(req.params.id);
    if (!borrower) return res.status(404).json({ error: 'Borrower not found.' });
    return res.json({ success: true, borrower });
  } catch (err) {
    console.error('[BORROWER] getBorrowerById error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch borrower.' });
  }
};

module.exports = { updateBankDetails, getBorrowerById };
