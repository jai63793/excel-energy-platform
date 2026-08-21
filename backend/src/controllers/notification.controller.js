import prisma from '../config/db.js';
import { sendLiveLinkSMS, sendBroadcastSMS } from '../services/sms.service.js';

/**
 * Send bulk notifications to target audiences
 */
export const sendBulkNotification = async (req, res, next) => {
  const { title, description, targetAudience, selectedUserIds } = req.body;

  try {
    // 1. Create global Notification record
    const announcement = await prisma.notification.create({
      data: {
        title,
        description,
        targetAudience,
        status: 'SENT'
      }
    });

    const now = new Date();
    let targetUsers = [];

    // 2. Fetch targets based on audience selector
    if (targetAudience === 'ALL') {
      targetUsers = await prisma.user.findMany({ where: { status: 'ACTIVE' } });
    } else if (targetAudience === 'PAID') {
      const activeSubs = await prisma.subscription.findMany({
        where: { status: 'ACTIVE', endDate: { gte: now } },
        select: { userId: true }
      });
      const uniquePaidIds = [...new Set(activeSubs.map(s => s.userId))];
      targetUsers = await prisma.user.findMany({
        where: { id: { in: uniquePaidIds }, status: 'ACTIVE' }
      });
    } else if (targetAudience === 'UNPAID') {
      const activeSubs = await prisma.subscription.findMany({
        where: { status: 'ACTIVE', endDate: { gte: now } },
        select: { userId: true }
      });
      const uniquePaidIds = [...new Set(activeSubs.map(s => s.userId))];
      targetUsers = await prisma.user.findMany({
        where: { id: { notIn: uniquePaidIds }, roleId: 2, status: 'ACTIVE' }
      });
    } else if (targetAudience === 'SELECTED' && Array.isArray(selectedUserIds)) {
      targetUsers = await prisma.user.findMany({
        where: { id: { in: selectedUserIds.map(id => parseInt(id)) }, status: 'ACTIVE' }
      });
    }

    // 3. Map UserNotification relations and dispatch alerts
    const userNotificationData = targetUsers.map(user => ({
      userId: user.id,
      notificationId: announcement.id,
      isRead: false
    }));

    if (userNotificationData.length > 0) {
      await prisma.userNotification.createMany({
        data: userNotificationData
      });
    }

    // Dispatch broadcast messages asynchronously via SMS/OTP service (Scopycode)
    targetUsers.forEach(async (user) => {
      try {
        await sendBroadcastSMS(user.phone, user.name, title, description);
      } catch (waError) {
        console.error(`[Scopycode-Broadcast] Failed sending to ${user.phone}:`, waError.message);
      }
    });

    // Log administrative action
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: `Sent bulk notification: "${title}" to ${targetAudience} (${targetUsers.length} users)`,
        ipAddress: req.ip
      }
    });

    return res.status(200).json({
      success: true,
      message: `Notification broadcasted successfully to ${targetUsers.length} users.`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Broadcast YouTube Live Stream links to paid members only
 */
export const sendYouTubeLive = async (req, res, next) => {
  const { liveUrl } = req.body;

  if (!liveUrl) {
    return res.status(400).json({ success: false, message: 'YouTube Live URL is required.' });
  }

  try {
    const now = new Date();
    
    // Find active paid subscribers
    const activeSubs = await prisma.subscription.findMany({
      where: { status: 'ACTIVE', endDate: { gte: now } },
      select: { userId: true }
    });
    const uniquePaidIds = [...new Set(activeSubs.map(s => s.userId))];

    const paidUsers = await prisma.user.findMany({
      where: { id: { in: uniquePaidIds }, status: 'ACTIVE' }
    });

    if (paidUsers.length === 0) {
      return res.status(200).json({ success: true, message: 'No active paid subscribers to notify.' });
    }

    // Create Notification banner
    const announcement = await prisma.notification.create({
      data: {
        title: 'We are LIVE! 🎥',
        description: `Join our live energy healing session now. Click here to join: ${liveUrl}`,
        targetAudience: 'PAID',
        status: 'SENT'
      }
    });

    const userNotificationData = paidUsers.map(user => ({
      userId: user.id,
      notificationId: announcement.id,
      isRead: false
    }));

    await prisma.userNotification.createMany({
      data: userNotificationData
    });

    // Fetch active paid sub-users who have a phone number
    const activeSubUsers = await prisma.subUser.findMany({
      where: {
        subscriptionStatus: 'ACTIVE',
        subscriptionEndDate: { gte: now },
        phone: { not: null }
      }
    });

    // Dispatch YouTube Live invitations via SMS/OTP service (Scopycode)
    paidUsers.forEach(async (user) => {
      try {
        await sendLiveLinkSMS(user.phone, user.name, liveUrl);
      } catch (waError) {
        console.error(`[Scopycode-LiveStream] Failed sending to ${user.phone}:`, waError.message);
      }
    });

    activeSubUsers.forEach(async (sub) => {
      try {
        await sendLiveLinkSMS(sub.phone, sub.name, liveUrl);
      } catch (err) {
        console.error(`[Scopycode-LiveStream] Failed sending to sub-user ${sub.phone}:`, err.message);
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: `Broadcasted YouTube Live link to ${paidUsers.length} paid members and ${activeSubUsers.length} paid sub-users. URL: ${liveUrl}`,
        ipAddress: req.ip
      }
    });

    return res.status(200).json({
      success: true,
      message: `YouTube Live invitations sent successfully to ${paidUsers.length} primary subscribers and ${activeSubUsers.length} sub-users.`
    });
  } catch (error) {
    next(error);
  }
};

export const getMyNotifications = async (req, res, next) => {
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

    const activeSub = await prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE', endDate: { gte: now } }
    });
    const isSubscribed = !!activeSub;

    const eligibleGlobal = await prisma.notification.findMany({
      where: {
        targetAudience: {
          in: ['ALL', isSubscribed ? 'PAID' : 'UNPAID']
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const userNotifications = await prisma.userNotification.findMany({
      where: { userId },
      include: { notification: true }
    });

    const userNotifMap = new Map(userNotifications.map(un => [un.notificationId, un]));
    const mergedNotifications = [];

    for (const globalNotif of eligibleGlobal) {
      const userNotif = userNotifMap.get(globalNotif.id);
      if (userNotif) {
        mergedNotifications.push({
          id: userNotif.id,
          userId: userNotif.userId,
          notificationId: userNotif.notificationId,
          isRead: userNotif.isRead,
          createdAt: userNotif.createdAt,
          notification: globalNotif
        });
      } else {
        mergedNotifications.push({
          id: `virtual-${globalNotif.id}`,
          userId,
          notificationId: globalNotif.id,
          isRead: false,
          createdAt: globalNotif.createdAt,
          notification: globalNotif
        });
      }
    }

    mergedNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.status(200).json({ success: true, notifications: mergedNotifications });
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    if (id.toString().startsWith('virtual-')) {
      const originalNotifId = parseInt(id.toString().replace('virtual-', ''));
      const created = await prisma.userNotification.create({
        data: {
          userId,
          notificationId: originalNotifId,
          isRead: true,
          readAt: new Date()
        }
      });
      return res.status(200).json({ success: true, message: 'Notification marked as read.', id: created.id });
    }

    const userNotification = await prisma.userNotification.findUnique({
      where: { id: parseInt(id) }
    });

    if (!userNotification || userNotification.userId !== userId) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    await prisma.userNotification.update({
      where: { id: parseInt(id) },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    return res.status(200).json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsRead = async (req, res, next) => {
  const userId = req.user.id;

  try {
    const activeSub = await prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE', endDate: { gte: new Date() } }
    });
    const isSubscribed = !!activeSub;

    const eligibleGlobal = await prisma.notification.findMany({
      where: {
        targetAudience: {
          in: ['ALL', isSubscribed ? 'PAID' : 'UNPAID']
        }
      }
    });

    for (const globalNotif of eligibleGlobal) {
      const existing = await prisma.userNotification.findFirst({
        where: { userId, notificationId: globalNotif.id }
      });

      if (existing) {
        if (!existing.isRead) {
          await prisma.userNotification.update({
            where: { id: existing.id },
            data: { isRead: true, readAt: new Date() }
          });
        }
      } else {
        await prisma.userNotification.create({
          data: {
            userId,
            notificationId: globalNotif.id,
            isRead: true,
            readAt: new Date()
          }
        });
      }
    }

    return res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all previously sent announcements/broadcasts for Admin panel history
 */
export const getBroadcastHistory = async (req, res, next) => {
  try {
    const broadcasts = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    return res.status(200).json({
      success: true,
      broadcasts
    });
  } catch (error) {
    next(error);
  }
};

