import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const provider = process.env.WHATSAPP_PROVIDER || 'mock';

/**
 * Send WhatsApp Message using template or text
 * @param {string} phone - User phone number (e.g. +919876543210)
 * @param {object} templateData - Meta WhatsApp Business Template Object or string message
 */
export const sendWhatsAppMessage = async (phone, content) => {
  console.log(`[WhatsApp-Service] Preparing message for ${phone}...`);
  
  if (provider === 'mock') {
    console.log(`[WhatsApp-MOCK] Message sent to ${phone}:`, JSON.stringify(content, null, 2));
    return { success: true, provider: 'mock' };
  }

  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiUrl = process.env.WHATSAPP_BUSINESS_API_URL || 'https://graph.facebook.com/v18.0';

  if (!token || !phoneId) {
    console.warn('[WhatsApp-Service] Meta credentials missing. Running mock fallback.');
    return { success: true, mockFallback: true };
  }

  // Format phone to international format without + or spaces
  const cleanPhone = phone.replace(/[+\s-]/g, '');

  try {
    let payload = {};

    if (typeof content === 'string') {
      // Free text message (only allowed within 24-hour customer service window)
      payload = {
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'text',
        text: { body: content }
      };
    } else {
      // Template message (required for notifications outside 24h window)
      payload = {
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'template',
        template: content
      };
    }

    const response = await axios.post(
      `${apiUrl}/${phoneId}/messages`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return { success: true, data: response.data, provider: 'meta' };
  } catch (error) {
    console.error('[WhatsApp-Service] Meta API Error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Send Subscription Activation Notification
 */
export const sendWhatsAppSubscriptionActivated = async (phone, userName, expiryDate) => {
  // WhatsApp Template structure example
  const template = {
    name: 'subscription_activated',
    language: { code: 'en_US' },
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: userName },
          { type: 'text', text: expiryDate }
        ]
      }
    ]
  };

  // Fallback to text message for logs or if template is not pre-approved
  const textFallback = `Hello ${userName},\n\nYour Excel Energy subscription has been successfully activated! It is valid until ${expiryDate}.\n\nThank you for subscribing!`;

  return sendWhatsAppMessage(phone, provider === 'meta' ? template : textFallback);
};

/**
 * Send Payment Invoice receipt link
 */
export const sendWhatsAppPaymentReceipt = async (phone, userName, amount, invoiceNumber) => {
  const template = {
    name: 'payment_success',
    language: { code: 'en_US' },
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: userName },
          { type: 'text', text: `₹${amount}` },
          { type: 'text', text: invoiceNumber }
        ]
      }
    ]
  };

  const textFallback = `Hello ${userName},\n\nWe have received your payment of ₹${amount} for invoice ${invoiceNumber}. Thank you for your support!\n\nTeam Excel Energy`;

  return sendWhatsAppMessage(phone, provider === 'meta' ? template : textFallback);
};

/**
 * Send Subscription Expiry Renewal Reminder
 */
export const sendWhatsAppRenewalReminder = async (phone, userName, expiryDate, daysLeft) => {
  const template = {
    name: 'subscription_renewal_reminder',
    language: { code: 'en_US' },
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: userName },
          { type: 'text', text: expiryDate },
          { type: 'text', text: daysLeft.toString() }
        ]
      }
    ]
  };

  const textFallback = `Hello ${userName},\n\nYour Excel Energy subscription is expiring in ${daysLeft} days (on ${expiryDate}). Please renew your membership to continue accessing premium live sessions and retreat benefits.\n\nRenew here: https://excelenergy.com/join-member`;

  return sendWhatsAppMessage(phone, provider === 'meta' ? template : textFallback);
};

/**
 * Send YouTube Live session invitation
 */
export const sendWhatsAppYouTubeLive = async (phone, userName, liveUrl) => {
  const template = {
    name: 'youtube_live_invite',
    language: { code: 'en_US' },
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: userName },
          { type: 'text', text: liveUrl }
        ]
      }
    ]
  };

  const textFallback = `Hello ${userName},\n\nWe are now LIVE! Join our meditation session using the link below:\n\nJoin Live: ${liveUrl}\n\nExcel Energy`;

  return sendWhatsAppMessage(phone, provider === 'meta' ? template : textFallback);
};

/**
 * Send Custom Admin Announcement
 */
export const sendWhatsAppAdminAnnouncement = async (phone, userName, title, description) => {
  const textFallback = `Hello ${userName},\n\n*Announcement: ${title}*\n\n${description}\n\nExcel Energy`;
  return sendWhatsAppMessage(phone, textFallback);
};

/**
 * Send OTP via WhatsApp
 */
export const sendWhatsAppOTP = async (phone, otpCode) => {
  const textFallback = `Your Excel Energy Login OTP is: *${otpCode}*. Valid for 10 minutes. Do not share this OTP with anyone.`;
  return sendWhatsAppMessage(phone, textFallback);
};

/**
 * Send 1-on-1 Healing Session Booking Confirmation
 */
export const sendWhatsAppBookingConfirmation = async (phone, userName, healerName, sessionType, dateStr, timeSlot) => {
  const textFallback = `Hello ${userName},\n\nYour ${sessionType} session with ${healerName} is confirmed!\n\n📅 Date: ${dateStr}\n⏰ Slot: ${timeSlot}\n\nThank you for choosing Excel Energy.`;
  return sendWhatsAppMessage(phone, textFallback);
};
