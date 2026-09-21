import nodemailer from 'nodemailer';
import { logError, logInfo } from '#common/logger.js';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export async function sendJobNotification(subject, message, recipients) {
  try {
    if (!recipients || recipients.length === 0) {
      logInfo('No email recipients configured. Skipping notification.');
      return;
    }
    const info = await transporter.sendMail({
      from: `"NBL Archiver Bot" <${process.env.EMAIL_USER}>`,
      to: recipients.join(', '),
      subject,
      text: message,
      html: `<pre>${message}</pre>`,
    });
    logInfo(`Email sent: ${info.messageId}`);
  } catch (err) {
    logError(`Failed to send email: ${err.message}`);
  }
}
