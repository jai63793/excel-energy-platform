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
 * Automatically check out employees who have been checked in for more than 8 hours.
 */
export const runAutoCheckOutCheck = async () => {
  console.log('[Cron-Job] Starting auto checkout audit...');
  try {
    const eightHoursAgo = new Date();
    eightHoursAgo.setHours(eightHoursAgo.getHours() - 8);

    // Find all attendance records with checkIn <= 8 hours ago and checkOut is null
    const openAttendances = await prisma.attendance.findMany({
      where: {
        checkOut: null,
        checkIn: {
          lte: eightHoursAgo
        }
      },
      include: {
        user: true
      }
    });

    console.log(`[Cron-Job] Found ${openAttendances.length} active sessions exceeding 8 hours.`);

    for (const record of openAttendances) {
      // Calculate checkout time as exactly 8 hours after checkin
      const autoCheckOutTime = new Date(record.checkIn.getTime() + 8 * 60 * 60 * 1000);

      // 1. Update attendance record
      await prisma.attendance.update({
        where: { id: record.id },
        data: {
          checkOut: autoCheckOutTime,
          notes: record.notes 
            ? `${record.notes} | Auto checkout after 8 hours` 
            : 'Auto checkout after 8 hours'
        }
      });

      // 2. Set employee duty status to OFF_DUTY
      await prisma.employeeProfile.update({
        where: { userId: record.userId },
        data: { dutyStatus: 'OFF_DUTY' }
      }).catch(err => {
        console.error(`[Cron-Job] Failed to update dutyStatus for userId ${record.userId}:`, err.message);
      });

      console.log(`[Cron-Job] Auto checked-out user ${record.user.name} (ID: ${record.userId}), checked-in at ${record.checkIn.toISOString()}`);
    }

    console.log('[Cron-Job] Auto checkout audit completed successfully.');
  } catch (error) {
    console.error('[Cron-Job] Critical error during runAutoCheckOutCheck cron execution:', error);
  }
};

/**
 * Automatically find expired subscriptions, update status to EXPIRED, and send WhatsApp alerts.
 */
export const runSubscriptionExpiryAudit = async () => {
  console.log('[Cron-Job] Starting active subscription expiry audit...');
  try {
    const now = new Date();

    // Find all subscriptions that are ACTIVE and have expired (endDate <= now)
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          lte: now
        }
      },
      include: {
        user: true
      }
    });

    console.log(`[Cron-Job] Found ${expiredSubscriptions.length} expired subscriptions.`);

    for (const sub of expiredSubscriptions) {
      const { user } = sub;

      // 1. Update subscription status to EXPIRED
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'EXPIRED' }
      });

      // 2. Send WhatsApp Notification
      try {
        const { sendWhatsAppMessage } = await import('./whatsapp.service.js');
        const expiryMsg = `Hello ${user.name},\n\nYour Excel Energy subscription has expired. Please renew your membership to continue accessing our sessions and dashboard.\n\nThank you!`;
        await sendWhatsAppMessage(user.phone, expiryMsg);
        console.log(`[Cron-Job] WhatsApp expiry notification sent to ${user.name} (${user.phone})`);
      } catch (err) {
        console.error(`[Cron-Job] Failed to send WhatsApp expiry alert to ${user.phone}:`, err.message);
      }

      // 3. Create Dashboard notification
      try {
        const alert = await prisma.notification.create({
          data: {
            title: 'Membership Expired',
            description: 'Your subscription has expired. Please click the renewal button to reactivate your access.',
            targetAudience: 'SELECTED',
            status: 'SENT'
          }
        });

        await prisma.userNotification.create({
          data: {
            userId: user.id,
            notificationId: alert.id,
            isRead: false
          }
        });
      } catch (err) {
        console.error(`[Cron-Job] Failed to create dashboard notification for expired user ${user.id}:`, err.message);
      }
    }

    console.log('[Cron-Job] Subscription expiry audit completed successfully.');
  } catch (error) {
    console.error('[Cron-Job] Critical error during runSubscriptionExpiryAudit execution:', error);
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

  // Every 5 minutes: '*/5 * * * *'
  cron.schedule('*/5 * * * *', () => {
    console.log('[Scheduler] Triggering periodic auto-checkout checks.');
    runAutoCheckOutCheck();
  });

  // Every minute: '* * * * *'
  cron.schedule('* * * * *', () => {
    console.log('[Scheduler] Triggering periodic active subscription expiry checks.');
    runSubscriptionExpiryAudit();
  });

  console.log('[Scheduler] Cron jobs running active: Daily at 9:00 AM, Auto-checkout every 5 minutes & Expiry Audit every minute.');
};

