# Mini Lending Operations Admin Panel

A small admin lending operations panel built with **Node.js + Express + MongoDB + React (Vite) + JWT**.

> ⚠️ This is a training project. No real CIBIL, Cashfree, or DigiLocker services are integrated.

---

## 📁 Project Structure

```
mini-lending-ops/
├── backend/         # Express + MongoDB API
│   └── src/
│       ├── models/
│       ├── routes/
│       ├── middleware/
│       ├── controllers/
│       ├── services/
│       └── server.js
├── frontend/        # React (Vite)
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── context/
│       └── services/
├── .env.example
└── README.md
```

---

## ⚙️ Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/rachit1234567547/Mini-lending-ops.git
cd Mini-lending-ops
```

### 2. Install dependencies

```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 3. Configure environment variables

```bash
cp .env.example backend/.env
```

Edit `backend/.env` and fill in your values (see Environment Variables section below).

### 4. Seed the database

```bash
cd backend && npm run seed
```

The seed script will print admin credentials to the console.

### 5. Run the application

```bash
# Start backend (in one terminal)
cd backend && npm run dev

# Start frontend (in another terminal)
cd frontend && npm run dev
```

- Backend: http://localhost:5000  
- Frontend: http://localhost:5173

---

## 🔑 Environment Variables

Create a `backend/.env` file using `.env.example` as a template:

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for signing JWTs (use a long random string) |
| `EMAIL_API_KEY` | API key for Resend email service |
| `EMAIL_FROM` | Verified sender email address |
| `PORT` | Backend server port (default: 5000) |
| `CLIENT_URL` | Frontend URL for CORS (default: http://localhost:5173) |

> ⚠️ Never put real values in this README or commit your `.env` file.

---

## 👤 Seed Credentials

After running `npm run seed`, credentials will be printed to the console.

---

## 🔄 Loan Status Lifecycle

```
pending
   │
   ├──→ on_hold
   │      │
   │      └──→ approved
   │
   ├──→ approved
   │      │
   │      └──→ disbursed
   │                │
   │                ├──→ overdue
   │                │
   │                └──→ repaid
   │
   └──→ rejected
```

---

## 🔐 Permission Matrix

| Permission | Main Admin | Credit | Collection |
|---|:---:|:---:|:---:|
| VIEW_LOANS | ✓ | ✓ | ✓ |
| DECIDE_LOANS | ✓ | ✓ | — |
| RECORD_REPAYMENT | ✓ | — | ✓ |
| MANAGE_PTP | ✓ | — | ✓ |
| VIEW_REPORTS | ✓ | ✓ | ✓ |

---

## 📊 Reports Explained

**Decision Performance** counts unique loans an admin has approved or rejected, regardless of whether those loans were later disbursed.

**Recovery** measures loans that have actually reached the disbursed/recovery lifecycle, so approved-but-not-disbursed loans are excluded.

---

## ✅ Testing Journey

### Journey A — Auth & Permissions
- [x] **A1:** Login using credit admin succeeds, JWT stored, redirects to loans.
- [x] **A2:** Login with wrong password shows clear error, no token stored.
- [x] **A3:** Call `GET /admin/reports/decision-performance` without JWT returns `401`.
- [x] **A4:** Login as collection admin (no `DECIDE_LOANS`). Approve/Reject actions hidden, backend returns `403` if manually called.
- [x] **A5:** Login as mainadmin/credit (has `DECIDE_LOANS`). Actions visible.

### Journey B — IFSC Third Party
- [x] **B1:** Open borrower without bank details. Form is empty.
- [x] **B2:** Enter valid IFSC (`HDFC0000001`) + Account Last 4. Click Verify. Bank Name, Branch, City appear. Data saved to MongoDB.
- [x] **B3:** Enter invalid IFSC (`XXXX0000000`). API returns `400`. Clear UI error displayed. No partial bank data saved.
- [x] **B4:** Network tab shows request goes to Express API, Express calls Razorpay (Browser does not call Razorpay directly).

### Journey C — Happy Path Loan Lifecycle
- [x] **C1:** Open pending loan. Status is pending, decision info is empty.
- [x] **C2:** Click Hold, add comment. Status becomes `on_hold`. ActivityLog contains `loan_held`.
- [x] **C3:** Approve loan. Add comment. Status becomes `approved`. `decisionBy`, `decisionByEmail`, `decisionAt` populated. ActivityLog contains `loan_approved`.
- [x] **C4:** Check email provider (Resend). Decision email is received, or API returns `emailSent: true`.
- [x] **C5:** Disburse loan. Status becomes `disbursed`. `disbursedAt` is populated.
- [x] **C6:** Filter loans by disbursed. Loan appears. Last decision shows admin details.

### Journey D — Double Submit / Atomic Decision
- [x] **D1:** Select fresh pending loan.
- [x] **D2:** Double-click Approve (send parallel requests). Request 1 → SUCCESS. Request 2 → ERROR. Loan is not approved twice.
- [x] **D3:** Exactly one `loan_approved` entry in ActivityLog.
- [x] **D4:** Decision Performance approved unique count increases by exactly 1.

### Journey E — Email Failure
- [x] **E1:** Temporarily break email config (invalid API key).
- [x] **E2:** Approve a pending loan. Loan becomes approved (decision succeeds). API returns `emailSent: false`. Server logs the error.
- [x] **E3:** Restore email config. Reject another loan. Email works again.

### Journey F — Repayment + PTP
- [x] **F1:** Create PTP (Promised = tomorrow, Amount = ₹5,000, Status = open).
- [x] **F2:** Record SUCCESS repayment (₹5,000). Repaid amount updates. PTP becomes `kept`. Loan remains `disbursed`.
- [x] **F3:** On another loan: Create PTP (Promised = yesterday). Record SUCCESS repayment today. PTP becomes `broken`.
- [x] **F4:** Repay remaining amount. `repaidAmount >= loan.amount`. Loan becomes `repaid`.
- [x] **F5:** Add FAILED repayment. Loan total unchanged. PTP unchanged.

### Journey G — Reject Path
- [x] **G1:** Reject pending loan with comment. Status becomes `rejected`. Email sent. ActivityLog contains `loan_rejected`.
- [x] **G2:** Try to disburse rejected loan. Action is blocked (UI hidden and API returns `400`).

### Journey H — Reports
- [x] **H1:** Open Decision Performance. Verify counts match unique loans decided. Double clicks do not increase count twice.
- [x] **H2:** Open Recovery. Confirm only `disbursed`, `overdue`, `repaid` are counted.
- [x] **H3:** Approve new loan but DO NOT disburse it. Performance approved count increases. Recovery count remains unchanged.
- [x] **H4:** Both report pages contain a one-sentence explanation of their difference.

### Journey I — Regression Smoke Test
- [x] **I1:** Logout and Login again. Session works.
- [x] **I2:** Refresh loan detail page. Data remains consistent with MongoDB.
- [x] **I3:** Confirm `.env` is not committed. `.env.example` exists. Git status contains no secrets.
- [x] **I4:** Clone repo into fresh directory. Follow README. Seed. Start. Login. Setup takes < 15 mins.

---

## 📸 Screenshots

*(Add your images to the repository and update these markdown links before submission)*

1. **IFSC Successful Verification**
   ![IFSC Success](./screenshots/ifsc-success.png)

2. **IFSC Failure**
   ![IFSC Failure](./screenshots/ifsc-failure.png)

3. **Decision Email**
   ![Decision Email](./screenshots/decision-email.png)

4. **Performance Report**
   ![Performance Report](./screenshots/performance-report.png)

5. **Recovery Report**
   ![Recovery Report](./screenshots/recovery-report.png)

---

## 🚀 Third-Party Integrations

1. **Razorpay IFSC Lookup** — Bank IFSC verification via `https://ifsc.razorpay.com/{IFSC}`
2. **Resend** — Transactional email on loan decisions
