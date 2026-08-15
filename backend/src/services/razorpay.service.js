import crypto from 'crypto';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';
import prisma from '../config/db.js';

dotenv.config();

// Helper to load Razorpay configurations dynamically from database or env
const getRazorpayInstance = async () => {
  // Try loading from Admin Settings first
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  
  let keyId = settings?.razorpayKeyId;
  let keySecret = settings?.razorpayKeySecret;

  if (!keyId || keyId === 'rzp_test_yourkeyhere') {
    keyId = process.env.RAZORPAY_KEY_ID;
  }
  if (!keySecret || keySecret === 'yourkeysecrethere') {
    keySecret = process.env.RAZORPAY_KEY_SECRET;
  }

  if (!keyId || !keySecret || keyId.startsWith('rzp_test_yourkey')) {
    console.warn('[Razorpay-Service] Using placeholder Razorpay credentials. Real payment gateway transactions will fail.');
  }

  return {
    instance: new Razorpay({
      key_id: keyId || 'rzp_test_mock_id',
      key_secret: keySecret || 'mock_secret',
    }),
    keyId: keyId || 'rzp_test_mock_id',
    keySecret: keySecret || 'mock_secret'
  };
};

export const createRazorpayOrder = async (amountInRupees, receipt) => {
  const { instance } = await getRazorpayInstance();
  
  // Convert to paise
  const amountInPaise = Math.round(amountInRupees * 100);

  const options = {
    amount: amountInPaise,
    currency: 'INR',
    receipt: receipt,
    payment_capture: 1 // Capture payment immediately
  };

  try {
    const order = await instance.orders.create(options);
    return order;
  } catch (error) {
    console.error('[Razorpay-Service] Standard order creation failed:', error.message);
    throw new Error(`Razorpay Order Creation Failed: ${error.message}`);
  }
};

export const verifyRazorpaySignature = async (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  if (!razorpaySignature) return false;

  const { keySecret } = await getRazorpayInstance();
  
  const body = razorpayOrderId + '|' + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(body.toString())
    .digest('hex');

  return expectedSignature === razorpaySignature;
};

/**
 * Verify webhook signature from Razorpay
 */
export const verifyWebhookSignature = async (rawBody, signature, webhookSecret) => {
  const secret = webhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  return expectedSignature === signature;
};

/**
 * Refund payment structure helper
 */
export const initiateRefund = async (paymentId, amountInRupees, notes = {}) => {
  const { instance } = await getRazorpayInstance();
  
  const options = {
    payment_id: paymentId,
    amount: amountInRupees ? Math.round(amountInRupees * 100) : undefined, // Full refund if undefined
    notes: notes
  };

  try {
    const refund = await instance.payments.refund(paymentId, options);
    return refund;
  } catch (error) {
    console.error('[Razorpay-Service] Refund Failed:', error);
    throw error;
  }
};

export const createRazorpayPaymentLink = async (amountInRupees, user, description) => {
  const { instance } = await getRazorpayInstance();
  const amountInPaise = Math.round(amountInRupees * 100);

  const options = {
    amount: amountInPaise,
    currency: 'INR',
    accept_partial: false,
    description: description,
    customer: {
      name: user.name,
      contact: user.phone,
      email: user.email || undefined
    },
    notify: {
      sms: true,
      email: user.email ? true : false
    },
    notes: {
      userId: user.id ? user.id.toString() : 'new',
      name: user.name || '',
      phone: user.phone || '',
      email: user.email || '',
      address: user.address || '',
      plan: user.plan || ''
    }
  };

  try {
    const paymentLink = await instance.paymentLink.create(options);
    return paymentLink;
  } catch (error) {
    console.error('[Razorpay-Service] Standard payment link creation failed:', error.message);
    throw new Error(`Razorpay Payment Link Creation Failed: ${error.message}`);
  }
};

export const fetchRazorpayPaymentLink = async (paymentLinkId) => {
  const { instance } = await getRazorpayInstance();
  try {
    const paymentLink = await instance.paymentLink.fetch(paymentLinkId);
    return paymentLink;
  } catch (error) {
    console.error('[Razorpay-Service] Fetch payment link failed:', error.message);
    throw new Error(`Razorpay Payment Link Fetch Failed: ${error.message}`);
  }
};
