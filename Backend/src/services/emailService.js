const nodemailer = require('nodemailer');

function getTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Sends an email, or logs it to the console if SMTP isn't configured
 * (handy for local dev / grading without real SMTP credentials).
 * Never throws — a failed email should not break the calling request.
 */
async function sendEmail({ to, subject, text, html }) {
  const transporter = getTransporter();

  if (!transporter) {
    console.log(`[EMAIL DEMO] To: ${to} | Subject: ${subject}\n${text || ''}`);
    return { skipped: true };
  }

  try {
    return await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to,
      subject,
      text,
      html,
    });
  } catch (err) {
    console.error('Email send failed:', err.message);
    return { skipped: true, error: err.message };
  }
}

module.exports = { sendEmail };
