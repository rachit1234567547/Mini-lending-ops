const nodemailer = require('nodemailer');

// Initialize Nodemailer transporter
// It uses environment variables, which must be set in your .env file
let transporter = null;

try {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: 'gmail', // Standard Gmail setup
      auth: {
        user: process.env.EMAIL_USER.trim(),
        pass: process.env.EMAIL_PASS.replace(/\s+/g, ''),
      },
    });
    console.log('[EMAIL] Nodemailer transporter configured for Gmail.');
  } else {
    console.warn('[EMAIL] EMAIL_USER or EMAIL_PASS not set in .env. Emails will not be sent.');
  }
} catch (e) {
  console.warn('[EMAIL] Failed to initialize Nodemailer:', e.message);
}

/**
 * Build an HTML email body for loan decisions.
 */
const buildEmailHTML = ({ borrowerName, loanAmount, status, comment }) => {
  const statusColor = status === 'approved' ? '#16a34a' : status === 'disbursed' ? '#0284c7' : '#dc2626';
  const statusLabel = status === 'approved' ? '✅ Approved' : status === 'disbursed' ? '💸 Disbursed' : '❌ Rejected';
  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(loanAmount);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Loan Decision</title>
      </head>
      <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0"
                style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
                <!-- Header -->
                <tr>
                  <td style="background:#1e293b;padding:28px 40px;">
                    <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;letter-spacing:0.5px;">
                      Mini Lending Ops
                    </h1>
                    <p style="color:#94a3b8;margin:6px 0 0;font-size:13px;">Loan Update Notification</p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:36px 40px;">
                    <p style="color:#374151;font-size:16px;margin:0 0 20px;">
                      Dear <strong>${borrowerName}</strong>,
                    </p>
                    <p style="color:#374151;font-size:15px;margin:0 0 28px;">
                      We have an update regarding your loan. Here are the details:
                    </p>
                    <!-- Decision Card -->
                    <table width="100%" cellpadding="0" cellspacing="0"
                      style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:28px;">
                      <tr>
                        <td style="padding:20px 24px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding:8px 0;color:#64748b;font-size:14px;">Loan Amount</td>
                              <td align="right" style="padding:8px 0;color:#1e293b;font-size:14px;font-weight:600;">${formattedAmount}</td>
                            </tr>
                            <tr>
                              <td style="padding:8px 0;color:#64748b;font-size:14px;border-top:1px solid #e2e8f0;">Status</td>
                              <td align="right" style="padding:8px 0;border-top:1px solid #e2e8f0;">
                                <span style="background:${statusColor}18;color:${statusColor};padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600;">
                                  ${statusLabel}
                                </span>
                              </td>
                            </tr>
                            ${comment ? `
                            <tr>
                              <td style="padding:8px 0;color:#64748b;font-size:14px;border-top:1px solid #e2e8f0;">Comment</td>
                              <td align="right" style="padding:8px 0;border-top:1px solid #e2e8f0;color:#374151;font-size:14px;">${comment}</td>
                            </tr>` : ''}
                          </table>
                        </td>
                      </tr>
                    </table>
                    ${status === 'approved'
                      ? `<p style="color:#374151;font-size:14px;margin:0 0 20px;">
                          Congratulations! Your loan has been approved. Our team will be in touch 
                          with the next steps for disbursement.
                         </p>`
                      : status === 'disbursed'
                      ? `<p style="color:#374151;font-size:14px;margin:0 0 20px;">
                          Great news! Your loan amount has been successfully disbursed to your verified bank account. 
                          Please check your account for the transferred funds.
                         </p>`
                      : `<p style="color:#374151;font-size:14px;margin:0 0 20px;">
                          We regret to inform you that your loan application has been rejected. 
                          If you have any questions, please contact our support team.
                         </p>`
                    }
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;">
                    <p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;">
                      This is an automated message from Mini Lending Ops. Please do not reply to this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

/**
 * Send a loan decision email to the borrower using Nodemailer.
 * CRITICAL: This function must NEVER throw — callers catch errors themselves.
 *
 * @returns {{ sent: boolean }} — sent:false on any failure
 */
const sendDecisionEmail = async ({ borrowerEmail, borrowerName, loanAmount, status, comment }) => {
  if (!transporter) {
    console.warn('[EMAIL] Cannot send email. Nodemailer is not configured (check EMAIL_USER/EMAIL_PASS in .env).');
    return { sent: false };
  }

  try {
    const info = await transporter.sendMail({
      from: `"Mini Lending Ops" <${process.env.EMAIL_USER}>`,
      to: borrowerEmail,
      subject:
        status === 'approved'
          ? '✅ Your loan has been approved — Mini Lending Ops'
          : status === 'disbursed'
          ? '💸 Your loan has been disbursed! — Mini Lending Ops'
          : '❌ Update on your loan application — Mini Lending Ops',
      html: buildEmailHTML({ borrowerName, loanAmount, status, comment }),
    });

    console.log(`[EMAIL] Decision email sent to ${borrowerEmail} — Message ID: ${info.messageId}`);
    return { sent: true, emailId: info.messageId };
  } catch (err) {
    // Log but never propagate — loan decision must not be affected
    console.error('[EMAIL] Unexpected error sending decision email via Nodemailer:', err.message);
    return { sent: false };
  }
};

module.exports = { sendDecisionEmail };
