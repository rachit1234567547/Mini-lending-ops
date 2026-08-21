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

See [Testing Checklist](#) — Journey A through I must be completed before submission.

---

## 📸 Screenshots

*(To be added after UI is complete)*

---

## 🚀 Third-Party Integrations

1. **Razorpay IFSC Lookup** — Bank IFSC verification via `https://ifsc.razorpay.com/{IFSC}`
2. **Resend** — Transactional email on loan decisions
