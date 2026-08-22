# Mini Lending Operations Admin Panel

This repository contains a fully functional administrative panel designed for lending operations. It is built using a modern technology stack including Node.js, Express, MongoDB for the backend, and Next.js with JWT-based authentication for the frontend.

Please note that this is a training project. No real financial services (such as CIBIL, Cashfree, or DigiLocker) have been integrated into this application.

---

## Project Structure

The repository is divided into two main directories:

```
mini-lending-ops/
├── backend/         # Express and MongoDB API
│   └── src/
│       ├── models/
│       ├── routes/
│       ├── middleware/
│       ├── controllers/
│       ├── services/
│       └── server.js
├── frontend/        # Next.js Application
│   └── src/
│       ├── app/
│       ├── components/
│       ├── context/
│       └── services/
├── .env.example
└── README.md
```

---

## Setup Instructions

Follow these steps to get the application running on your local machine.

### 1. Clone the repository

Begin by cloning the repository to your local machine and navigating into the project directory:

```bash
git clone https://github.com/rachit1234567547/Mini-lending-ops.git
cd Mini-lending-ops
```

### 2. Install dependencies

You will need to install the Node packages for both the frontend and the backend separately.

```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 3. Configure environment variables

Navigate to the backend directory and create your environment configuration file:

```bash
cd backend
cp .env.example .env
```

Open the newly created `.env` file and populate it with your specific configuration values (refer to the Environment Variables section below).

### 4. Seed the database

Populate your database with the initial testing data required to run the application:

```bash
npm run seed
```

Upon completion, this script will output the initial administrator credentials directly to your console. Save these credentials to log into the application.

### 5. Run the application

You will need to run the backend and the frontend simultaneously in separate terminal windows.

```bash
# Start the backend server (Terminal 1)
cd backend
npm run dev

# Start the frontend application (Terminal 2)
cd frontend
npm run dev
```

- The backend API will be available at: http://localhost:5000  
- The frontend UI will be available at: http://localhost:5173

---

## Environment Variables

Your `backend/.env` file should contain the following variables:

| Variable | Description |
|---|---|
| MONGODB_URI | Your MongoDB connection string |
| JWT_SECRET | A secure, random string used for signing authentication tokens |
| EMAIL_API_KEY | Your API key for the Resend email service |
| EMAIL_FROM | The verified sender email address associated with your Resend account |
| PORT | The port for the backend server (default is 5000) |
| CLIENT_URL | The URL of your frontend application to allow CORS (default is http://localhost:5173) |

Important Security Note: Never commit your `.env` file to version control, and do not place real production keys inside this README file.

---

## Seed Credentials

After executing the database seed script, the terminal will display the generated login credentials for the default administrator accounts. Use these credentials to access the application.

---

## Loan Status Lifecycle

The system enforces a strict lifecycle for all loans. The flow is as follows:

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

## Permission Matrix

Access control is strictly enforced based on the assigned role of the administrator.

| Permission | Main Admin | Credit Officer | Collection Agent |
|---|:---:|:---:|:---:|
| VIEW_LOANS | Yes | Yes | Yes |
| DECIDE_LOANS | Yes | Yes | No |
| RECORD_REPAYMENT | Yes | No | Yes |
| MANAGE_PTP | Yes | No | Yes |
| VIEW_REPORTS | Yes | Yes | Yes |

---

## Reports Explained

The application features two distinct performance reports to track operational efficiency:

**Decision Performance:** This report calculates the number of unique loans that an administrator has explicitly approved or rejected. It counts these decisions regardless of whether the loan ultimately progressed to the disbursement stage.

**Recovery:** This report focuses entirely on the collection phase. It exclusively measures loans that have entered the disbursed or recovery lifecycle. Loans that were approved but never disbursed are omitted from this calculation.

---

## Testing Journey

The following checklist represents the complete testing journey required to validate the application. 

### Journey A — Auth and Permissions
- [x] A1: Login using credit admin succeeds, JWT stored, redirects to loans.
- [x] A2: Login with wrong password shows clear error, no token stored.
- [x] A3: Call GET /admin/reports/decision-performance without JWT returns 401 Unauthorized.
- [x] A4: Login as collection admin (lacks DECIDE_LOANS permission). Approve/Reject actions hidden, backend returns 403 if manually called.
- [x] A5: Login as main admin or credit officer (has DECIDE_LOANS permission). Decision actions are visible.

### Journey B — IFSC Third Party
- [x] B1: Open borrower without bank details. The input form is empty.
- [x] B2: Enter valid IFSC (e.g., HDFC0000001) and Account Last 4. Click Verify. Bank Name, Branch, and City are fetched and saved to MongoDB.
- [x] B3: Enter invalid IFSC (e.g., XXXX0000000). API returns 400. Clear UI error displayed. No partial bank data saved.
- [x] B4: Network tab confirms the request goes to the Express API, which securely calls Razorpay. The browser does not call Razorpay directly.

### Journey C — Happy Path Loan Lifecycle
- [x] C1: Open a pending loan. The status is pending, and decision information is empty.
- [x] C2: Click Hold, add a comment. The status becomes on_hold. The Activity Log records a loan_held event.
- [x] C3: Approve the loan and add a comment. The status becomes approved. The decision maker and timestamp are recorded. The Activity Log records a loan_approved event.
- [x] C4: Check the email provider (Resend). A decision email is successfully delivered.
- [x] C5: Disburse the loan. The status becomes disbursed, and the disbursement date is populated.
- [x] C6: Filter loans by the disbursed status. The newly disbursed loan appears correctly in the list.

### Journey D — Double Submit and Atomic Decisions
- [x] D1: Select a fresh pending loan.
- [x] D2: Attempt a double-click on Approve (simulating parallel requests). Request 1 returns SUCCESS. Request 2 returns an ERROR. The loan is not approved twice.
- [x] D3: Exactly one loan_approved entry exists in the Activity Log.
- [x] D4: The Decision Performance approved unique count increases by exactly 1.

### Journey E — Email Failure
- [x] E1: Temporarily break the email configuration by providing an invalid API key.
- [x] E2: Approve a pending loan. The loan is approved, but the API indicates the email was not sent. The server logs the failure. The loan decision is not rolled back.
- [x] E3: Restore the valid email configuration. Reject another loan. The email delivery functions correctly again.

### Journey F — Repayment and Promise-to-Pay (PTP)
- [x] F1: Create a Promise-to-Pay for tomorrow with an open status.
- [x] F2: Record a successful repayment. The repaid amount updates, the PTP becomes kept, and the loan remains in the disbursed status.
- [x] F3: On another loan, create a PTP promised for yesterday. Record a successful repayment today. The PTP is automatically marked as broken.
- [x] F4: Repay the remaining total balance of the loan. The loan status automatically changes to repaid.
- [x] F5: Add a FAILED repayment. The total loan balance remains unchanged, and the active PTP status is unaffected.

### Journey G — Reject Path
- [x] G1: Reject a pending loan with a comment. The status becomes rejected, an email is sent, and the Activity Log records a loan_rejected event.
- [x] G2: Attempt to disburse the rejected loan. The action is blocked, and the API returns a 400 Bad Request error.

### Journey H — Reports
- [x] H1: Open the Decision Performance report. The counts accurately reflect the unique loans decided.
- [x] H2: Open the Recovery report. Confirm that only disbursed, overdue, and repaid loans are included in the metric.
- [x] H3: Approve a new loan but do not disburse it. The Performance approved count increases, while the Recovery count remains completely unchanged.
- [x] H4: Both report pages prominently feature a one-sentence explanation clarifying their difference.

### Journey I — Regression Smoke Test
- [x] I1: Logout and Login again. Session persistence functions normally.
- [x] I2: Refresh the loan detail page. The data remains consistent with the MongoDB records.
- [x] I3: Confirm that the `.env` file is excluded from version control, the `.env.example` exists, and there are no exposed secrets in the Git history.
- [x] I4: Clone the repository into a fresh directory, follow these instructions, seed the data, and start the application. The entire setup process takes less than 15 minutes.

---

## Screenshots

1. IFSC Successful Verification
   ![IFSC Success](https://github.com/user-attachments/assets/e245e0ad-2263-4dca-82a9-aff8b29b11e6)

2. IFSC Failure
   ![IFSC Failure](https://github.com/user-attachments/assets/3a3b8ebc-6dc7-4df0-aa60-cd29644ddadf)

3. Decision Email
   ![Decision Email](https://github.com/user-attachments/assets/e7bbec61-65c4-4773-8ff0-22ef14a79612) 

4. Performance Report
   ![Performance Report](https://github.com/user-attachments/assets/1824479c-392c-4e03-817c-86d4432d4fd9)

5. Recovery Report
   ![Recovery Report](https://github.com/user-attachments/assets/fbd22e00-38d1-4699-b3d1-8849e1cdc5f7)

---

## Third-Party Integrations

1. Razorpay IFSC Lookup: Server-side Bank IFSC verification via `https://ifsc.razorpay.com/{IFSC}`
2. Resend: Transactional email delivery for loan decision notifications
