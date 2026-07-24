import prisma from '../config/db.js';
import { createRazorpayOrder, verifyRazorpaySignature, verifyWebhookSignature } from '../services/razorpay.service.js';
import { sendSMS } from '../services/sms.service.js';
import { sendPaymentReceiptEmail } from '../services/email.service.js';
import { sendWhatsAppPaymentReceipt, sendWhatsAppSubscriptionActivated } from '../services/whatsapp.service.js';

/**
 * Create a new subscription Razorpay order
 */
export const createOrder = async (req, res, next) => {
  const userId = req.user.id;
  const { plan } = req.body;

  try {
    // 1. Read Base price from configuration settings (default: 1500 INR)
    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    let baseAmount = 1500.0;
    if (plan === '3month') {
      baseAmount = 4500.0;
    } else if (plan === '6month') {
      baseAmount = 9000.0;
    }
    
    // Add 18% GST standard
    const gstRate = 0.18;
    const gstAmount = baseAmount * gstRate;
    const totalAmount = baseAmount + gstAmount; // 1770, 5310, or 10620 INR

    // Generate unique receipt reference
    const timestamp = Date.now();
    const receipt = `rec_sub_${userId}_${timestamp}`;

    // 2. Interface with Razorpay to create order
    const rpOrder = await createRazorpayOrder(totalAmount, receipt);

    // 3. Save pending payment record in DB
    await prisma.payment.create({
      data: {
        userId,
        amount: totalAmount,
        status: 'PENDING',
        razorpayOrderId: rpOrder.id
      }
    });

    // Write log
    await prisma.activityLog.create({
      data: {
        userId,
        action: `Initiated subscription payment order: ${rpOrder.id} for plan ${plan || '1month'}`,
        ipAddress: req.ip
      }
    });

    return res.status(201).json({
      success: true,
      orderId: rpOrder.id,
      amount: rpOrder.amount,
      currency: rpOrder.currency,
      keyId: settings?.razorpayKeyId || process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_id'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify Razorpay payment signature & activate subscription
 */
export const verifyPayment = async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const userId = req.user.id;

  try {
    // 1. Verify payment signature
    const isValid = await verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

    if (!isValid) {
      // Mark transaction as failed
      await prisma.payment.update({
        where: { razorpayOrderId: razorpay_order_id },
        data: { status: 'FAILED' }
      });
      return res.status(400).json({ success: false, message: 'Invalid payment signature verification failed.' });
    }

    // 2. Retrieve the pending payment record
    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId: razorpay_order_id }
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    if (payment.status === 'SUCCESS') {
      return res.status(200).json({ success: true, message: 'Payment already processed successfully.' });
    }

    // 3. Determine subscription extension dates
    // Rule: "Extend subscription by 30 days from current expiry if still active, or from today's date if expired."
    const now = new Date();
    
    // Check for user's latest active subscription
    const latestActiveSub = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        endDate: { gte: now }
      },
      orderBy: { endDate: 'desc' }
    });

    // Determine duration based on amount paid
    let durationDays = 30;
    if (payment.amount === 5310) {
      durationDays = 90;
    } else if (payment.amount === 10620) {
      durationDays = 180;
    }

    let startDate = new Date();
    let endDate = new Date();

    if (latestActiveSub) {
      // Extend from current expiry
      startDate = new Date(latestActiveSub.endDate);
      endDate = new Date(latestActiveSub.endDate);
      endDate.setDate(endDate.getDate() + durationDays);
      
      // Update old subscription to EXPIRED since we are issuing the new extended one
      await prisma.subscription.update({
        where: { id: latestActiveSub.id },
        data: { status: 'EXPIRED' }
      });
    } else {
      // Active subscription expired or none exists. Start from today.
      startDate = new Date();
      endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);
    }

    // 4. Create new Subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        status: 'ACTIVE',
        amount: payment.amount,
        startDate,
        endDate,
        razorpayOrderId: razorpay_order_id
      }
    });

    // 5. Update Payment record with success fields
    const invoiceNumber = `INV-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'SUCCESS',
        subscriptionId: subscription.id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        invoiceNumber
      }
    });

    // 6. Audit logs
    await prisma.activityLog.create({
      data: {
        userId,
        action: `Completed payment of ₹${payment.amount}. Subscription activated until ${endDate.toISOString()}`,
        ipAddress: req.ip
      }
    });

    // Create System notification
    const alert = await prisma.notification.create({
      data: {
        title: 'Membership Activated!',
        description: `Thank you for subscribing. Your membership is now active until ${endDate.toLocaleDateString('en-IN')}.`,
        targetAudience: 'SELECTED',
        status: 'SENT'
      }
    });

    await prisma.userNotification.create({
      data: {
        userId,
        notificationId: alert.id,
        isRead: false
      }
    });

    // 7. Send Notifications (WhatsApp, SMS, Email)
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const formattedExpiry = endDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    try {
      // Send SMS
      await sendSMS(user.phone, `Payment of ₹${payment.amount} successful. Subscription activated! Expiring on ${formattedExpiry}.`);
      
      // Send WhatsApp activation + invoice messages
      await sendWhatsAppPaymentReceipt(user.phone, user.name, payment.amount, invoiceNumber);
      await sendWhatsAppSubscriptionActivated(user.phone, user.name, formattedExpiry);
      
      // Send Email details
      if (user.email) {
        await sendPaymentReceiptEmail(user.email, user.name, payment.amount, invoiceNumber);
      }
    } catch (notifyError) {
      console.warn('[Billing-Notifications] Error sending notification alerts:', notifyError.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Subscription payment verified and activated.',
      invoiceNumber,
      expiryDate: endDate
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle payments Webhook from Razorpay
 */
export const handleWebhook = async (req, res, next) => {
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = JSON.stringify(req.body);

  try {
    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    const webhookSecret = settings?.razorpayKeySecret || process.env.RAZORPAY_WEBHOOK_SECRET;

    const isValid = await verifyWebhookSignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    console.log(`[Razorpay-Webhook] Received event: ${event}`);

    if (event === 'payment.captured') {
      const paymentId = payload.payment.entity.id;
      const orderId = payload.payment.entity.order_id;
      const amount = payload.payment.entity.amount / 100;

      // Handle captured payment (if verified signature check was somehow bypassed or failed in client)
      const existingPayment = await prisma.payment.findUnique({ where: { razorpayOrderId: orderId } });
      
      if (existingPayment && existingPayment.status !== 'SUCCESS') {
        const userId = existingPayment.userId;
        const now = new Date();
        const endDate = new Date();
        
        let durationDays = 30;
        if (amount === 5310) {
          durationDays = 90;
        } else if (amount === 10620) {
          durationDays = 180;
        }
        endDate.setDate(endDate.getDate() + durationDays);

        const subscription = await prisma.subscription.create({
          data: {
            userId,
            status: 'ACTIVE',
            amount,
            startDate: now,
            endDate,
            razorpayOrderId: orderId
          }
        });

        const invoiceNumber = `INV-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
        await prisma.payment.update({
          where: { id: existingPayment.id },
          data: {
            status: 'SUCCESS',
            subscriptionId: subscription.id,
            razorpayPaymentId: paymentId,
            invoiceNumber
          }
        });
      }
    } else if (event === 'payment.failed') {
      const orderId = payload.payment.entity.order_id;
      await prisma.payment.updateMany({
        where: { razorpayOrderId: orderId },
        data: { status: 'FAILED' }
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[Razorpay-Webhook] Error:', error);
    return res.status(500).json({ success: false, message: 'Webhook processing error.' });
  }
};

/**
 * Fetch billing history / Invoices list of current user
 */
export const getMyPayments = async (req, res, next) => {
  const userId = req.user.id;

  try {
    const now = new Date();

    // Dynamically mark any expired subscriptions as EXPIRED in the database
    await prisma.subscription.updateMany({
      where: {
        userId,
        status: 'ACTIVE',
        endDate: { lt: now }
      },
      data: {
        status: 'EXPIRED'
      }
    });

    const payments = await prisma.payment.findMany({
      where: { userId, status: 'SUCCESS' },
      include: {
        subscription: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({ success: true, payments });
  } catch (error) {
    next(error);
  }
};
