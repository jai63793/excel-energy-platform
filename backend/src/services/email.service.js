import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const provider = process.env.EMAIL_PROVIDER || 'mock';

// Setup nodemailer transporter
let transporter = null;
if (provider === 'smtp') {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

export const sendEmail = async (to, subject, html) => {
  if (!to) return { success: false, error: 'No recipient email specified' };
  
  console.log(`[Email-Service] Preparing mail to ${to} with subject "${subject}"...`);
  
  if (provider === 'mock') {
    console.log(`[Email-MOCK] Email sent successfully to ${to}.`);
    return { success: true, provider: 'mock' };
  }

  if (!transporter) {
    console.warn('[Email-Service] SMTP transporter not configured. Falling back to log.');
    return { success: true, fallback: true };
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Excel Energy" <no-reply@excelenergy.com>',
      to,
      subject,
      html
    });
    
    return { success: true, messageId: info.messageId, provider: 'smtp' };
  } catch (error) {
    console.error('[Email-Service] Error sending email:', error.message);
    throw error;
  }
};

export const sendWelcomeEmail = async (email, name) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #0c4737;">Welcome to Excel Energy, ${name}!</h2>
      <p>Thank you for creating an account on our platform.</p>
      <p>Start your energy healing and spiritual meditation journey with us today.</p>
      <p>If you'd like to access premium retreats, discount codes, and live sessions, consider subscribing to our monthly membership.</p>
      <br />
      <p>Best regards,<br/>Team Excel Energy</p>
    </div>
  `;
  return sendEmail(email, 'Welcome to Excel Energy!', html);
};

export const sendPaymentReceiptEmail = async (email, name, amount, invoiceNumber) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #0c4737;">Payment Receipt - Excel Energy</h2>
      <p>Dear ${name},</p>
      <p>We are pleased to inform you that we have received your subscription payment of <strong>₹${amount}</strong>.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Invoice Number</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${invoiceNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Amount Paid</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${amount}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Billing Status</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; color: green; font-weight: bold;">SUCCESS</td>
        </tr>
      </table>
      <p>Your subscription is active for the next 30 days. You can view and download invoices inside your dashboard.</p>
      <br />
      <p>Thank you for subscribing,<br/>Team Excel Energy</p>
    </div>
  `;
  return sendEmail(email, `Payment Receipt - ${invoiceNumber}`, html);
};

export const sendRenewalReminderEmail = async (email, name, expiryDate, daysLeft) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #e0702b;">Renew Your Subscription</h2>
      <p>Dear ${name},</p>
      <p>This is a friendly reminder that your Excel Energy membership subscription is expiring in <strong>${daysLeft} days</strong> (on ${expiryDate}).</p>
      <p>Please log in to your dashboard and renew your subscription to maintain continuous access to live spiritual meditations and healing sessions.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://excelenergy.com/#/join-member" style="background-color: #0c4737; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Renew Now</a>
      </div>
      <br />
      <p>Best regards,<br/>Team Excel Energy</p>
    </div>
  `;
  return sendEmail(email, 'Action Required: Excel Energy Subscription Expiry Warning', html);
};

export const sendPasswordResetEmail = async (email, name, tempPassword) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #0c4737;">Temporary Credentials - Excel Energy</h2>
      <p>Dear ${name},</p>
      <p>Your temporary password has been successfully generated:</p>
      <div style="background-color: #f1f7f5; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 16px; margin: 20px 0; text-align: center; font-weight: bold;">
        ${tempPassword}
      </div>
      <p>Please log in with this temporary password and change it immediately inside your Profile Settings.</p>
      <br />
      <p>Thank you,<br/>Team Excel Energy</p>
    </div>
  `;
  return sendEmail(email, 'Your Excel Energy Temporary Password', html);
};
