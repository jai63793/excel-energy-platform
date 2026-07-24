import cron from 'node-cron';
import prisma from '../config/db.js';
import { sendEmail, sendRenewalReminderEmail } from './email.service.js';
import { sendSMS } from './sms.service.js';
import { sendWhatsAppRenewalReminder } from './whatsapp.service.js';

/**
 * Check active subscriptions expiring in exactly 2 days and send alerts.
 */
export const runExpiryCheck = async () => {
  console.log('[Cron-Job] Starting subscription expiry audit...');
  try {
    const today = new Date();
    
    // Set range for 2 days from now
    const targetStart = new Date(today);
    targetStart.setDate(today.getDate() + 2);
    targetStart.setHours(0, 0, 0, 0);

    const targetEnd = new Date(today);
    targetEnd.setDate(today.getDate() + 2);
    targetEnd.setHours(23, 59, 59, 999);

    console.log(`[Cron-Job] Looking for subscriptions expiring between ${targetStart.toISOString()} and ${targetEnd.toISOString()}`);

    const expiringSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: targetStart,
          lte: targetEnd
        }
      },
      include: {
        user: true
      }
    });

    console.log(`[Cron-Job] Found ${expiringSubscriptions.length} subscriptions expiring in 2 days.`);

    for (const sub of expiringSubscriptions) {
      const { user } = sub;
      const daysLeft = 2;
      const expiryFormatted = sub.endDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

      console.log(`[Cron-Job] Processing reminder for user: ${user.name} (${user.phone})`);

      // 1. Send SMS Notification
      try {
        const smsMessage = `Dear ${user.name}, your Excel Energy subscription is expiring in 2 days (on ${expiryFormatted}). Please renew today to maintain continuous access.`;
        await sendSMS(user.phone, smsMessage);
      } catch (err) {
        console.error(`[Cron-Job] Failed to send SMS to ${user.phone}:`, err.message);
      }

      // 2. Send WhatsApp Notification
      try {
        await sendWhatsAppRenewalReminder(user.phone, user.name, expiryFormatted, daysLeft);
      } catch (err) {
        console.error(`[Cron-Job] Failed to send WhatsApp to ${user.phone}:`, err.message);
      }

      // 3. Send Email Notification (if email exists)
      if (user.email) {
        try {
          await sendRenewalReminderEmail(user.email, user.name, expiryFormatted, daysLeft);
        } catch (err) {
          console.error(`[Cron-Job] Failed to send email to ${user.email}:`, err.message);
        }
      }

      // 4. Create Dashboard Notification
      try {
        const announcement = await prisma.notification.create({
          data: {
            title: 'Subscription Expiring Soon!',
            description: `Your membership expires in 2 days on ${expiryFormatted}. Click the 'Renew Now' button to renew.`,
            targetAudience: 'SELECTED',
            status: 'SENT'
          }
        });

        await prisma.userNotification.create({
          data: {
            userId: user.id,
            notificationId: announcement.id,
            isRead: false
          }
        });
      } catch (err) {
        console.error(`[Cron-Job] Failed to create dashboard notification for user ${user.id}:`, err.message);
      }
    }

    console.log('[Cron-Job] Expiry check completed successfully.');
  } catch (error) {
    console.error('[Cron-Job] Critical error during runExpiryCheck cron execution:', error);
  }
};

/**
 * Initialize all cron schedulers
 */
export const initCronJobs = () => {
  console.log('[Scheduler] Initializing cron job registry...');
  
  // Every day at 9:00 AM: '0 9 * * *'
  cron.schedule('0 9 * * *', () => {
    console.log('[Scheduler] Triggering daily 9:00 AM subscription checks.');
    runExpiryCheck();
  });

  console.log('[Scheduler] Cron job running active: Daily at 9:00 AM.');
};
