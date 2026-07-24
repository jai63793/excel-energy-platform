import axios from 'axios';
import dotenv from 'dotenv';
import twilio from 'twilio';

dotenv.config();

const provider = process.env.SMS_PROVIDER || 'mock';

// Initialize Twilio if credentials exist
let twilioClient = null;
if (provider === 'twilio' && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  } catch (error) {
    console.error('Failed to initialize Twilio client:', error.message);
  }
}

export const sendSMS = async (phone, message, code = null) => {
  console.log(`[SMS-Service] Preparing to send to ${phone}: "${message}"`);
  
  if (provider === 'mock') {
    console.log(`[SMS-MOCK] Message sent successfully to ${phone}.`);
    return { success: true, provider: 'mock' };
  }

  if (provider === 'twilio') {
    if (!twilioClient) {
      console.warn('[SMS-Twilio] Twilio client not initialized. Falling back to console log.');
      return { success: true, fallback: true };
    }
    try {
      // For general SMS, Twilio messages API is used. For OTP verification, twilio has Twilio Verify.
      // We implement sending SMS message body.
      const response = await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER || '+12345678901', // configured or default
        to: phone
      });
      return { success: true, messageId: response.sid, provider: 'twilio' };
    } catch (error) {
      console.error('[SMS-Twilio] Error sending SMS:', error.message);
      throw error;
    }
  }

  if (provider === 'msg91') {
    const authKey = process.env.MSG91_AUTH_KEY;
    if (!authKey) {
      console.warn('[SMS-MSG91] MSG91 Auth Key missing. Falling back to log.');
      return { success: true, fallback: true };
    }
    try {
      const otpVal = code || message.match(/\b\d{6}\b/)?.[0] || '';
      const response = await axios.post('https://api.msg91.com/api/v5/flow/', {
        template_id: process.env.MSG91_TEMPLATE_ID || "your_template_id",
        sender: process.env.MSG91_SENDER_ID || "EXCEL",
        short_url: "0",
        recipients: [
          {
            mobiles: phone.replace('+', ''),
            message: message,
            otp: otpVal,
            code: otpVal
          }
        ]
      }, {
        headers: {
          'authkey': authKey,
          'content-type': 'application/json'
        }
      });
      return { success: true, data: response.data, provider: 'msg91' };
    } catch (error) {
      console.error('[SMS-MSG91] Error sending SMS:', error.message);
      throw error;
    }
  }

  return { success: false, error: 'Invalid SMS provider config' };
};

export const sendOTP = async (phone, code) => {
  const message = `Your Excel Energy OTP is ${code}. It is valid for 5 minutes. Please do not share this code with anyone.`;
  
  if (provider === 'twilio' && process.env.TWILIO_VERIFY_SERVICE_SID && twilioClient) {
    try {
      // Use Twilio Verify service if SID is set
      const verification = await twilioClient.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID)
        .verifications.create({ to: phone, channel: 'sms' });
      return { success: true, sid: verification.sid, provider: 'twilio-verify' };
    } catch (error) {
      console.warn('[SMS-TwilioVerify] Verify service failed, falling back to basic SMS:', error.message);
      return sendSMS(phone, message, code);
    }
  }
  
  return sendSMS(phone, message, code);
};

export const verifyOTPViaProvider = async (phone, code) => {
  if (provider === 'twilio' && process.env.TWILIO_VERIFY_SERVICE_SID && twilioClient) {
    try {
      const verificationCheck = await twilioClient.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID)
        .verificationChecks.create({ to: phone, code: code });
      return verificationCheck.status === 'approved';
    } catch (error) {
      console.warn('[SMS-TwilioVerify] Verification check failed, falling back to database OTP check:', error.message);
      return null; // indicates to fallback to local DB verification
    }
  }
  return null; // fallback
};
