require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const { Admin, Borrower, Loan, ActivityLog, Repayment, PTP } = require('./models');

// ─── Seed Data ────────────────────────────────────────────────────────────────

const ADMINS = [
  {
    name: 'Main Admin',
    email: 'mainadmin@example.com',
    plainPassword: 'Admin@1234',
    role: 'mainadmin',
    permissions: ['VIEW_LOANS', 'DECIDE_LOANS', 'RECORD_REPAYMENT', 'MANAGE_PTP', 'VIEW_REPORTS'],
  },
  {
    name: 'Credit Officer',
    email: 'credit@example.com',
    plainPassword: 'Credit@1234',
    role: 'credit',
    permissions: ['VIEW_LOANS', 'DECIDE_LOANS', 'VIEW_REPORTS'],
  },
  {
    name: 'Collection Agent',
    email: 'collection@example.com',
    plainPassword: 'Collection@1234',
    role: 'collection',
    permissions: ['VIEW_LOANS', 'RECORD_REPAYMENT', 'MANAGE_PTP', 'VIEW_REPORTS'],
  },
];

const BORROWERS = [
  // Borrower 1 — Testing email 1
  {
    name: 'Ananya Sharma',
    phone: '9876543210',
    email: 'vikashkr62042@gmail.com',
    kycStatus: 'verified',
    bank: {
      ifsc: 'HDFC0000001',
      accountLast4: '4321',
      bankName: 'HDFC Bank',
      branch: 'Connaught Place',
      city: 'New Delhi',
    },
  },
  // Borrower 2 — Testing email 2
  {
    name: 'Rahul Mehta',
    phone: '9123456780',
    email: 'naturemother101@gmail.com',
    kycStatus: 'pending',
    bank: { ifsc: null, accountLast4: null, bankName: null, branch: null, city: null },
  },
  // Borrower 3 — Testing email 3
  {
    name: 'Priya Nair',
    phone: '9988776655',
    email: 'lpucolab438@gmail.com',
    kycStatus: 'verified',
    bank: {
      ifsc: 'SBIN0001234',
      accountLast4: '9900',
      bankName: 'State Bank of India',
      branch: 'MG Road',
      city: 'Bengaluru',
    },
  },
  // Borrower 4 — Fake email
  {
    name: 'Kiran Desai',
    phone: '9011223344',
    email: 'kiran.desai@example.com',
    kycStatus: 'verified',
    bank: {
      ifsc: 'ICIC0002345',
      accountLast4: '7712',
      bankName: 'ICICI Bank',
      branch: 'Bandra West',
      city: 'Mumbai',
    },
  },
  // Borrower 5 — Fake email
  {
    name: 'Deepak Joshi',
    phone: '9765432100',
    email: 'deepak.joshi@example.com',
    kycStatus: 'pending',
    bank: { ifsc: null, accountLast4: null, bankName: null, branch: null, city: null },
  },
  // Borrower 6 — Fake email
  {
    name: 'Sneha Pillai',
    phone: '9543216780',
    email: 'sneha.pillai@example.com',
    kycStatus: 'verified',
    bank: {
      ifsc: 'AXIS0001111',
      accountLast4: '5566',
      bankName: 'Axis Bank',
      branch: 'Koramangala',
      city: 'Bengaluru',
    },
  },
  // Borrower 7 — Fake email
  {
    name: 'Vijay Kumar',
    phone: '9321654987',
    email: 'vijay.kumar@example.com',
    kycStatus: 'verified',
    bank: {
      ifsc: 'PUNB0123400',
      accountLast4: '8833',
      bankName: 'Punjab National Bank',
      branch: 'Lajpat Nagar',
      city: 'New Delhi',
    },
  },
  // Borrower 8 — Fake email
  {
    name: 'Meera Iyer',
    phone: '9012345678',
    email: 'meera.iyer@example.com',
    kycStatus: 'rejected',
    bank: { ifsc: null, accountLast4: null, bankName: null, branch: null, city: null },
  },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

// ─── Main Seed ────────────────────────────────────────────────────────────────

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Drop the entire database to clear old data and indexes (so unique constraints apply)
    await mongoose.connection.dropDatabase();
    console.log('🗑️  Dropped database to clear data and indexes\n');

    // ── Seed Admins ──────────────────────────────────────────────────────────
    const createdAdmins = [];
    for (const a of ADMINS) {
      // Pass plain password — model pre-save hook handles bcrypt hashing
      const admin = new Admin({
        name: a.name,
        email: a.email,
        passwordHash: a.plainPassword,
        role: a.role,
        permissions: a.permissions,
      });
      await admin.save();
      createdAdmins.push({ ...a, _id: admin._id });
    }

    const mainAdmin = createdAdmins.find((a) => a.role === 'mainadmin');
    const creditAdmin = createdAdmins.find((a) => a.role === 'credit');
    const collectionAdmin = createdAdmins.find((a) => a.role === 'collection');

    // ── Seed Borrowers ───────────────────────────────────────────────────────
    const createdBorrowers = [];
    for (const b of BORROWERS) {
      const borrower = await Borrower.create(b);
      createdBorrowers.push(borrower);
    }

    // ── Seed Loans (12 total, covering all statuses) ─────────────────────────
    const loans = [];

    // 1. PENDING — required by spec
    loans.push(await Loan.create({
      borrowerId: createdBorrowers[1]._id,  // Testing Email 2
      amount: 15000,
      status: 'pending',
    }));

    // 2. PENDING
    loans.push(await Loan.create({
      borrowerId: createdBorrowers[2]._id,  // Testing Email 3
      amount: 25000,
      status: 'pending',
    }));

    // 3. PENDING
    loans.push(await Loan.create({
      borrowerId: createdBorrowers[0]._id,  // Testing Email 1
      amount: 10000,
      status: 'pending',
    }));

    // 4. ON_HOLD — held by credit admin
    const heldLoan = await Loan.create({
      borrowerId: createdBorrowers[0]._id,  // Testing Email 1
      amount: 50000,
      status: 'on_hold',
      decisionBy: creditAdmin.name,
      decisionByEmail: creditAdmin.email,
      decisionAt: daysAgo(1),
      decisionComment: 'Need additional KYC documents',
    });
    loans.push(heldLoan);
    await ActivityLog.create({
      adminEmail: creditAdmin.email,
      action: 'loan_held',
      loanId: heldLoan._id,
      meta: { comment: 'Need additional KYC documents' },
    });

    // 5. APPROVED — by credit admin
    const approvedLoan = await Loan.create({
      borrowerId: createdBorrowers[5]._id,
      amount: 30000,
      status: 'approved',
      decisionBy: creditAdmin.name,
      decisionByEmail: creditAdmin.email,
      decisionAt: daysAgo(3),
      decisionComment: 'All documents verified',
    });
    loans.push(approvedLoan);
    await ActivityLog.create({
      adminEmail: creditAdmin.email,
      action: 'loan_approved',
      loanId: approvedLoan._id,
      meta: { comment: 'All documents verified' },
    });

    // 6. APPROVED — by main admin
    const approvedLoan2 = await Loan.create({
      borrowerId: createdBorrowers[6]._id,
      amount: 20000,
      status: 'approved',
      decisionBy: mainAdmin.name,
      decisionByEmail: mainAdmin.email,
      decisionAt: daysAgo(2),
      decisionComment: 'Approved after review',
    });
    loans.push(approvedLoan2);
    await ActivityLog.create({
      adminEmail: mainAdmin.email,
      action: 'loan_approved',
      loanId: approvedLoan2._id,
      meta: { comment: 'Approved after review' },
    });

    // 7. DISBURSED — use for repayment + PTP testing
    const disbursedLoan = await Loan.create({
      borrowerId: createdBorrowers[3]._id,  // Fake email with bank details
      amount: 10000,
      status: 'disbursed',
      decisionBy: creditAdmin.name,
      decisionByEmail: creditAdmin.email,
      decisionAt: daysAgo(10),
      decisionComment: 'Approved for disbursal',
      disbursedAt: daysAgo(8),
      repaidAmount: 0,
    });
    loans.push(disbursedLoan);
    await ActivityLog.create({
      adminEmail: creditAdmin.email,
      action: 'loan_approved',
      loanId: disbursedLoan._id,
      meta: { comment: 'Approved for disbursal' },
    });
    await ActivityLog.create({
      adminEmail: mainAdmin.email,
      action: 'loan_disbursed',
      loanId: disbursedLoan._id,
      meta: {},
    });

    // 8. DISBURSED — another one for testing reports
    const disbursedLoan2 = await Loan.create({
      borrowerId: createdBorrowers[5]._id, // Fake email with bank details
      amount: 40000,
      status: 'disbursed',
      decisionBy: mainAdmin.name,
      decisionByEmail: mainAdmin.email,
      decisionAt: daysAgo(15),
      decisionComment: 'Fast track approval',
      disbursedAt: daysAgo(12),
      repaidAmount: 10000,
    });
    loans.push(disbursedLoan2);
    await ActivityLog.create({
      adminEmail: mainAdmin.email,
      action: 'loan_approved',
      loanId: disbursedLoan2._id,
    });
    await ActivityLog.create({
      adminEmail: mainAdmin.email,
      action: 'loan_disbursed',
      loanId: disbursedLoan2._id,
    });

    // 9. OVERDUE
    const overdueLoan = await Loan.create({
      borrowerId: createdBorrowers[5]._id,
      amount: 20000,
      status: 'overdue',
      decisionBy: creditAdmin.name,
      decisionByEmail: creditAdmin.email,
      decisionAt: daysAgo(45),
      decisionComment: 'Approved',
      disbursedAt: daysAgo(40),
      repaidAmount: 5000,
    });
    loans.push(overdueLoan);

    // 10. REPAID
    const repaidLoan = await Loan.create({
      borrowerId: createdBorrowers[3]._id,
      amount: 8000,
      status: 'repaid',
      decisionBy: mainAdmin.name,
      decisionByEmail: mainAdmin.email,
      decisionAt: daysAgo(30),
      decisionComment: 'Approved',
      disbursedAt: daysAgo(28),
      repaidAmount: 8000,
    });
    loans.push(repaidLoan);
    await Repayment.create({
      loanId: repaidLoan._id,
      amount: 8000,
      paidAt: daysAgo(5),
      method: 'bank_transfer',
      status: 'SUCCESS',
    });
    await ActivityLog.create({
      adminEmail: collectionAdmin.email,
      action: 'repayment_recorded',
      loanId: repaidLoan._id,
      meta: { amount: 8000, status: 'SUCCESS' },
    });

    // 11. REJECTED — by credit admin
    const rejectedLoan = await Loan.create({
      borrowerId: createdBorrowers[7]._id,
      amount: 60000,
      status: 'rejected',
      decisionBy: creditAdmin.name,
      decisionByEmail: creditAdmin.email,
      decisionAt: daysAgo(5),
      decisionComment: 'KYC rejected, documents incomplete',
    });
    loans.push(rejectedLoan);
    await ActivityLog.create({
      adminEmail: creditAdmin.email,
      action: 'loan_rejected',
      loanId: rejectedLoan._id,
      meta: { comment: 'KYC rejected, documents incomplete' },
    });

    // 12. PENDING — fresh loan for atomic decision testing (Journey D)
    loans.push(await Loan.create({
      borrowerId: createdBorrowers[6]._id,
      amount: 35000,
      status: 'pending',
    }));

    // ── Seed PTP for the disbursed loan ──────────────────────────────────────
    await PTP.create({
      loanId: disbursedLoan._id,
      promisedDate: daysFromNow(7),
      amount: 5000,
      status: 'open',
      note: 'First partial payment',
    });

    // ─────────────────────────────────────────────────────────────────────────
    // PRINT RESULTS
    // ─────────────────────────────────────────────────────────────────────────
    console.log('═══════════════════════════════════════════════════');
    console.log('  SEED COMPLETED SUCCESSFULLY');
    console.log('═══════════════════════════════════════════════════\n');

    console.log('Admin Accounts:\n');
    console.log(`  Main Admin:`);
    console.log(`    Email:       ${mainAdmin.email}`);
    console.log(`    Password:    ${mainAdmin.plainPassword}`);
    console.log(`    Role:        mainadmin`);
    console.log(`    Permissions: ALL\n`);

    console.log(`  Credit Officer:`);
    console.log(`    Email:       ${creditAdmin.email}`);
    console.log(`    Password:    ${creditAdmin.plainPassword}`);
    console.log(`    Role:        credit`);
    console.log(`    Permissions: VIEW_LOANS, DECIDE_LOANS, VIEW_REPORTS\n`);

    console.log(`  Collection Agent:`);
    console.log(`    Email:       ${collectionAdmin.email}`);
    console.log(`    Password:    ${collectionAdmin.plainPassword}`);
    console.log(`    Role:        collection`);
    console.log(`    Permissions: VIEW_LOANS, RECORD_REPAYMENT, MANAGE_PTP, VIEW_REPORTS\n`);

    console.log('─────────────────────────────────────────────────');
    console.log(`  Borrowers created : ${createdBorrowers.length}`);
    console.log(`  Loans created     : ${loans.length}`);
    console.log('─────────────────────────────────────────────────');
    console.log('\n  Loan status breakdown:');
    console.log(`    pending   : 4  (IDs available in DB)`);
    console.log(`    on_hold   : 1`);
    console.log(`    approved  : 2`);
    console.log(`    disbursed : 2`);
    console.log(`    overdue   : 1`);
    console.log(`    repaid    : 1`);
    console.log(`    rejected  : 1`);
    console.log('\n  Notable borrowers:');
    console.log(`    With bank details  : Ananya Sharma (ananya.sharma@gmail.com)`);
    console.log(`    Without bank (x2)  : Rahul Mehta, Deepak Joshi`);
    console.log(`    Accessible email   : ananya.sharma@gmail.com`);
    console.log('\n═══════════════════════════════════════════════════\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();
