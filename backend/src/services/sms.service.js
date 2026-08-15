import dotenv from 'dotenv';
import axios from 'axios';
import { sendWhatsAppOTP } from './whatsapp.service.js';

dotenv.config();

const smsProvider = process.env.SMS_PROVIDER || 'mock';

/**
 * Send SMS or template message using a configured service provider (like Scopycode)
 * @param {string} phone - Target phone number
 * @param {string} message - Message body content or template param (OTP)
 * @param {string} code - The dynamic template parameter (e.g. OTP code)
 */
export const sendSMS = async (phone, message, code = null) => {
  console.log(`[SMS-Service] Preparing custom SMS for ${phone}...`);

  if (smsProvider === 'mock') {
    console.log(`[SMS-MOCK] SMS sent to ${phone}: "${message}"`);
    return { success: true, provider: 'mock' };
  }

  if (smsProvider === 'scopycode') {
    const apiKey = process.env.SCOPYCODE_API_KEY || 'NjiscqvVHXPItdQgm0WFwa3xY';
    const licenseNumber = process.env.SCOPYCODE_LICENSE_NUMBER || '18002442321';
    const templateId = process.env.SCOPYCODE_DLT_TEMPLATE_ID || 'verify_code5';
    const apiURL = process.env.SCOPYCODE_SMS_URL || 'https://app.scopycode.in/api/sendtemplate.php';
    const name = process.env.SCOPYCODE_SENDER_ID || 'Vikas';

    if (!apiKey) {
      console.warn('[SMS-Service] Scopycode SMS API Key is missing. Check your .env config.');
      return { success: false, error: 'API key missing' };
    }

    // Format phone to standard international format without '+' or spaces (e.g., 916379312193)
    let cleanPhone = phone.replace(/[+\s-]/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }

    try {
      // The Param must be in the format 'Vikas,OTP' (since the template expects name and code)
      const dynamicOtp = code || message;
      const paramValue = `${name},${dynamicOtp}`;

      // Scopycode (Ampala Info Services) HTTP GET API URL parameter format matching PHP cURL:
      const params = {
        LicenseNumber: licenseNumber,
        APIKey: apiKey,
        Contact: cleanPhone,
        Template: templateId,
        Param: paramValue,
        Name: name
      };

      console.log(`[SMS-Service] Requesting Scopycode Template API to ${apiURL} for ${cleanPhone}...`);
      const maskedParams = { ...params };
      if (maskedParams.Param) {
        maskedParams.Param = `${name},******`;
      }
      console.log('[SMS-Service] Request query params:', JSON.stringify(maskedParams, null, 2));

      const response = await axios.get(apiURL, { params });
      console.log('[SMS-Service] Scopycode API Response:', response.data);
      return { success: true, data: response.data, provider: 'scopycode' };
    } catch (error) {
      console.error('[SMS-Service] Scopycode Gateway error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Fallback to sending via WhatsApp if selected
  if (smsProvider === 'whatsapp') {
    const { sendWhatsAppMessage } = await import('./whatsapp.service.js');
    return sendWhatsAppMessage(phone, message);
  }

  return { success: false, error: 'Unknown SMS provider configuration' };
};

/**
 * Dispatch OTP verification codes
 * @param {string} phone - Target phone number
 * @param {string} code - The 6-digit verification code
 */
export const sendOTP = async (phone, code) => {
  console.log(`[SMS-Service] Generating OTP message to ${phone}...`);

  // Standard fallback text
  const otpMessage = `Your Excel Energy verification code is ${code}.`;

  if (smsProvider === 'whatsapp') {
    return sendWhatsAppOTP(phone, code);
  }

  // Uses the sendSMS function above to dispatch, passing the code as template parameter
  return sendSMS(phone, otpMessage, code);
};

/**
 * Verification handler (local database handles the check, provider is just a delivery pipe)
 */
export const verifyOTPViaProvider = async (phone, code) => {
  return null; // Fallback to database validity verification
};

/**
 * Dispatch YouTube Live stream link to paid subscribers
 * @param {string} phone - Target phone number
 * @param {string} userName - Subscriber's name
 * @param {string} liveUrl - The YouTube Live URL
 */
export const sendLiveLinkSMS = async (phone, userName, liveUrl) => {
  console.log(`[SMS-Service] Preparing YouTube Live stream link invitation for ${phone}...`);

  if (smsProvider === 'mock') {
    console.log(`[SMS-MOCK] Live Stream link sent to ${phone}: ${liveUrl}`);
    return { success: true, provider: 'mock' };
  }

  if (smsProvider === 'scopycode') {
    const apiKey = process.env.SCOPYCODE_API_KEY || 'NjiscqvVHXPItdQgm0WFwa3xY';
    const licenseNumber = process.env.SCOPYCODE_LICENSE_NUMBER || '18002442321';
    const templateId = process.env.SCOPYCODE_LIVE_TEMPLATE_ID || 'youtube_live_invite';
    const apiURL = process.env.SCOPYCODE_SMS_URL || 'https://app.scopycode.in/api/sendtemplate.php';
    const name = process.env.SCOPYCODE_SENDER_ID || 'Vikas';

    // Format phone
    let cleanPhone = phone.replace(/[+\s-]/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }

    try {
      // The template parameters are: Name, LiveURL (e.g. "Vikas,https://...")
      const paramValue = `${name},${liveUrl}`;

      const params = {
        LicenseNumber: licenseNumber,
        APIKey: apiKey,
        Contact: cleanPhone,
        Template: templateId,
        Param: paramValue,
        Name: name
      };

      console.log(`[SMS-Service] Requesting Scopycode Template API for Live Link to ${apiURL} for ${cleanPhone}...`);

      const response = await axios.get(apiURL, { params });
      console.log('[SMS-Service] Scopycode Live Link API Response:', response.data);
      return { success: true, data: response.data, provider: 'scopycode' };
    } catch (error) {
      console.error('[SMS-Service] Scopycode Gateway error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Fallback to sending via WhatsApp if selected
  if (smsProvider === 'whatsapp') {
    const { sendWhatsAppYouTubeLive } = await import('./whatsapp.service.js');
    return sendWhatsAppYouTubeLive(phone, userName, liveUrl);
  }

  return { success: false, error: 'Unknown SMS provider configuration' };
};

/**
 * Dispatch Custom Admin Announcement to subscribers
 * @param {string} phone - Target phone number
 * @param {string} userName - Subscriber's name
 * @param {string} title - Announcement title
 * @param {string} description - Announcement message body
 */
export const sendBroadcastSMS = async (phone, userName, title, description) => {
  console.log(`[SMS-Service] Preparing Bulk Broadcast SMS for ${phone}...`);

  if (smsProvider === 'mock') {
    console.log(`[SMS-MOCK] Bulk Broadcast sent to ${phone}: [${title}] ${description}`);
    return { success: true, provider: 'mock' };
  }

  if (smsProvider === 'scopycode') {
    const apiKey = process.env.SCOPYCODE_API_KEY || 'NjiscqvVHXPItdQgm0WFwa3xY';
    const licenseNumber = process.env.SCOPYCODE_LICENSE_NUMBER || '18002442321';
    const templateId = process.env.SCOPYCODE_BROADCAST_TEMPLATE_ID || 'admin_announcement';
    const apiURL = process.env.SCOPYCODE_SMS_URL || 'https://app.scopycode.in/api/sendtemplate.php';
    const name = process.env.SCOPYCODE_SENDER_ID || 'Vikas';

    // Format phone
    let cleanPhone = phone.replace(/[+\s-]/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }

    try {
      // The template parameters are: Name, Title, Description (e.g. "Vikas,Title,Description")
      // Remove commas from title and description to prevent Scopycode parser confusion if they use comma-split
      const cleanTitle = title.replace(/,/g, ' ');
      const cleanDesc = description.replace(/,/g, ' ');
      const paramValue = `${name},${cleanTitle},${cleanDesc}`;

      const params = {
        LicenseNumber: licenseNumber,
        APIKey: apiKey,
        Contact: cleanPhone,
        Template: templateId,
        Param: paramValue,
        Name: name
      };

      console.log(`[SMS-Service] Requesting Scopycode Template API for Broadcast to ${apiURL} for ${cleanPhone}...`);

      const response = await axios.get(apiURL, { params });
      console.log('[SMS-Service] Scopycode Broadcast API Response:', response.data);
      return { success: true, data: response.data, provider: 'scopycode' };
    } catch (error) {
      console.error('[SMS-Service] Scopycode Gateway error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Fallback to sending via WhatsApp if selected
  if (smsProvider === 'whatsapp') {
    const { sendWhatsAppAdminAnnouncement } = await import('./whatsapp.service.js');
    return sendWhatsAppAdminAnnouncement(phone, userName, title, description);
  }

  return { success: false, error: 'Unknown SMS provider configuration' };
};

