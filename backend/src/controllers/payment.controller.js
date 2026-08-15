import prisma from '../config/db.js';
import { createRazorpayOrder, verifyRazorpaySignature, verifyWebhookSignature } from '../services/razorpay.service.js';
import { sendSMS } from '../services/sms.service.js';
import { sendPaymentReceiptEmail } from '../services/email.service.js';
import { sendWhatsAppPaymentReceipt, sendWhatsAppSubscriptionActivated, sendWhatsAppMessage } from '../services/whatsapp.service.js';
import bcrypt from 'bcryptjs';

/**
 * Generate a random unique username
 */
const generateUniqueUsername = async (name) => {
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10);
  let isUnique = false;
  let username = '';
  
  while (!isUnique) {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    username = `${cleanName}_${randomNum}`;
    
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });
    
    if (!existingUser) {
      isUnique = true;
    }
  }
  
  return username;
};

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
    let totalAmount;

    if (plan === 'test_1rupee') {
      totalAmount = 1.0; // Exactly 1 Rupee total inclusive of GST
    } else {
      if (plan === '3month') {
        baseAmount = 4500.0;
      } else if (plan === '6month') {
        baseAmount = 9000.0;
      }
      
      // Add 18% GST standard
      const gstRate = 0.18;
      const gstAmount = baseAmount * gstRate;
      totalAmount = baseAmount + gstAmount; // 1770, 5310, or 10620 INR
    }

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

    let keyId = settings?.razorpayKeyId;
    if (!keyId || keyId === 'rzp_test_yourkeyhere') {
      keyId = process.env.RAZORPAY_KEY_ID;
    }

    return res.status(201).json({
      success: true,
      orderId: rpOrder.id,
      amount: rpOrder.amount,
      currency: rpOrder.currency,
      keyId: keyId || 'rzp_test_mock_id'
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
    const isTestPlan = Number(payment.amount) === 1.0;
    if (isTestPlan) {
      durationDays = 0;
    } else if (payment.amount === 5310) {
      durationDays = 90;
    } else if (payment.amount === 10620) {
      durationDays = 180;
    }

    let startDate = new Date();
    let endDate = new Date();
    let subscription;

    if (latestActiveSub) {
      // Extend the existing active subscription's endDate
      endDate = new Date(latestActiveSub.endDate);
      if (isTestPlan) {
        endDate.setMinutes(endDate.getMinutes() + 30);
      } else {
        endDate.setDate(endDate.getDate() + durationDays);
      }
      
      subscription = await prisma.subscription.update({
        where: { id: latestActiveSub.id },
        data: { 
          endDate,
          amount: latestActiveSub.amount + payment.amount
        }
      });
    } else {
      // Active subscription expired or none exists. Start from today.
      startDate = new Date();
      endDate = new Date();
      if (isTestPlan) {
        endDate.setMinutes(endDate.getMinutes() + 30);
      } else {
        endDate.setDate(endDate.getDate() + durationDays);
      }

      // Create new Subscription
      subscription = await prisma.subscription.create({
        data: {
          userId,
          status: 'ACTIVE',
          amount: payment.amount,
          startDate,
          endDate,
          razorpayOrderId: razorpay_order_id
        }
      });
    }

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

    // Send Notifications in background (non-blocking)
    sendSMS(user.phone, `Payment of ₹${payment.amount} successful. Subscription activated! Expiring on ${formattedExpiry}.`)
      .catch(notifyError => console.warn('[Billing-Notifications] SMS delivery failed:', notifyError.message));
      
    sendWhatsAppPaymentReceipt(user.phone, user.name, payment.amount, invoiceNumber)
      .catch(notifyError => console.warn('[Billing-Notifications] WhatsApp receipt failed:', notifyError.message));
      
    sendWhatsAppSubscriptionActivated(user.phone, user.name, formattedExpiry)
      .catch(notifyError => console.warn('[Billing-Notifications] WhatsApp subscription confirmation failed:', notifyError.message));
      
    if (user.email) {
      sendPaymentReceiptEmail(user.email, user.name, payment.amount, invoiceNumber)
        .catch(notifyError => console.warn('[Billing-Notifications] Payment receipt email failed:', notifyError.message));
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
  const rawBody = req.rawBody || JSON.stringify(req.body);

  try {
    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    let webhookSecret = settings?.razorpayKeySecret;
    if (!webhookSecret || webhookSecret === 'yourkeysecrethere') {
      webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    }

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
        
        let durationDays = 30;
        const isTestPlan = Number(amount) === 1.0;
        if (isTestPlan) {
          durationDays = 0;
        } else if (amount === 5310) {
          durationDays = 90;
        } else if (amount === 10620) {
          durationDays = 180;
        }
        
        const endDate = new Date();
        if (isTestPlan) {
          endDate.setMinutes(endDate.getMinutes() + 30);
        } else {
          endDate.setDate(endDate.getDate() + durationDays);
        }

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
    } else if (event === 'payment_link.paid') {
      const paymentLink = payload.payment_link.entity;
      const paymentLinkId = paymentLink.id;
      const amount = paymentLink.amount / 100;
      const paymentDetails = payload.payment?.entity || {};
      const paymentId = paymentDetails.id;
      const notes = paymentLink.notes || {};
      const isNew = notes.userId === 'new';

      let user = null;
      let tempPassword = null;
      let isNewUserCreated = false;
      let userId;

      if (isNew) {
        // Double check if the user is already created (to avoid duplicates if webhook is retried)
        user = await prisma.user.findUnique({
          where: { phone: notes.phone }
        });

        if (!user) {
          isNewUserCreated = true;
          const username = await generateUniqueUsername(notes.name);
          tempPassword = Math.random().toString(36).substring(2, 10);
          const salt = await bcrypt.genSalt(10);
          const passwordHash = await bcrypt.hash(tempPassword, salt);

          // Create new user (Role: USER = 2)
          user = await prisma.user.create({
            data: {
              username,
              name: notes.name,
              phone: notes.phone,
              email: notes.email || null,
              address: notes.address || null,
              passwordHash,
              roleId: 2, // USER
              status: 'ACTIVE'
            }
          });

          // Create an activity log
          await prisma.activityLog.create({
            data: {
              userId: user.id,
              action: `User registered automatically via successful payment: ${username} (${notes.phone})`,
              ipAddress: '127.0.0.1'
            }
          });
        }
        userId = user.id;
      } else {
        // Retrieve existing user
        const existingPayment = await prisma.payment.findFirst({
          where: { razorpayOrderId: paymentLinkId }
        });
        if (existingPayment) {
          userId = existingPayment.userId;
        } else if (notes.userId) {
          userId = parseInt(notes.userId, 10);
        }
      }

      if (userId) {
        // Activate user if they are currently INACTIVE
        await prisma.user.updateMany({
          where: { id: userId, status: 'INACTIVE' },
          data: { status: 'ACTIVE' }
        });

        // Check if there is already a SUCCESS payment for this paymentLinkId to avoid double-processing
        const processedPayment = await prisma.payment.findFirst({
          where: { razorpayOrderId: paymentLinkId, status: 'SUCCESS' }
        });

        if (processedPayment) {
          // Already processed, return success
          return res.status(200).json({ success: true });
        }

        const now = new Date();

        // Check for latest active subscription
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
        const isTestPlan = Number(amount) === 1.0;
        if (isTestPlan) {
          durationDays = 0;
        } else if (amount === 5310) {
          durationDays = 90;
        } else if (amount === 10620) {
          durationDays = 180;
        }

        let startDate = new Date();
        let endDate = new Date();
        let subscription;

        if (latestActiveSub) {
          // Extend subscription
          endDate = new Date(latestActiveSub.endDate);
          if (isTestPlan) {
            endDate.setMinutes(endDate.getMinutes() + 30);
          } else {
            endDate.setDate(endDate.getDate() + durationDays);
          }

          subscription = await prisma.subscription.update({
            where: { id: latestActiveSub.id },
            data: { 
              endDate,
              amount: latestActiveSub.amount + amount
            }
          });
        } else {
          // Start new subscription
          startDate = new Date();
          endDate = new Date();
          if (isTestPlan) {
            endDate.setMinutes(endDate.getMinutes() + 30);
          } else {
            endDate.setDate(endDate.getDate() + durationDays);
          }

          subscription = await prisma.subscription.create({
            data: {
              userId,
              status: 'ACTIVE',
              amount,
              startDate,
              endDate,
              razorpayOrderId: paymentLinkId
            }
          });
        }

        const invoiceNumber = `INV-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
        
        // Find existing pending payment if any, or create a new successful payment
        const existingPayment = await prisma.payment.findFirst({
          where: { razorpayOrderId: paymentLinkId }
        });

        if (existingPayment) {
          await prisma.payment.update({
            where: { id: existingPayment.id },
            data: {
              status: 'SUCCESS',
              subscriptionId: subscription.id,
              razorpayPaymentId: paymentId || null,
              invoiceNumber
            }
          });
        } else {
          // Create new successful payment
          await prisma.payment.create({
            data: {
              userId,
              subscriptionId: subscription.id,
              amount,
              status: 'SUCCESS',
              razorpayOrderId: paymentLinkId,
              razorpayPaymentId: paymentId || null,
              invoiceNumber
            }
          });
        }

        // Create notification
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

        // Send notifications (SMS, WhatsApp, Email) in background
        const finalUser = user || (await prisma.user.findUnique({ where: { id: userId } }));
        const formattedExpiry = endDate.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });

        // Send SMS/WhatsApp
        sendSMS(finalUser.phone, `Payment of ₹${amount} successful. Subscription activated! Expiring on ${formattedExpiry}.`)
          .catch(err => console.warn('[Webhook-Notifications] SMS delivery failed:', err.message));
          
        sendWhatsAppPaymentReceipt(finalUser.phone, finalUser.name, amount, invoiceNumber)
          .catch(err => console.warn('[Webhook-Notifications] WhatsApp receipt failed:', err.message));
          
        sendWhatsAppSubscriptionActivated(finalUser.phone, finalUser.name, formattedExpiry)
          .catch(err => console.warn('[Webhook-Notifications] WhatsApp subscription confirmation failed:', err.message));
          
        if (finalUser.email) {
          sendPaymentReceiptEmail(finalUser.email, finalUser.name, amount, invoiceNumber)
            .catch(err => console.warn('[Webhook-Notifications] Payment receipt email failed:', err.message));
        }

        // If a new user was created, send their login credentials via WhatsApp!
        if (isNewUserCreated && tempPassword) {
          const credentialsMsg = `Welcome to Excel Energy!\n\nYour account has been successfully created. Here are your temporary login details:\n\n👤 Username: ${finalUser.username}\n🔑 Temporary Password: ${tempPassword}\n\nPlease log in and change your password as soon as possible.`;
          sendWhatsAppMessage(finalUser.phone, credentialsMsg)
            .catch(err => console.warn('[Webhook-Notifications] Failed to send credentials WhatsApp:', err.message));
        }
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
