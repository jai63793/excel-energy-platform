import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';
import { sendSMS } from '../services/sms.service.js';
import { sendPasswordResetEmail } from '../services/email.service.js';

/**
 * Fetch Admin Dashboard overall analytics and statistics
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    
    // 1. User counts
    const totalUsers = await prisma.user.count({ where: { roleId: 2 } });
    
    // Paid users = users with at least one active subscription expiring in the future
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { gte: now }
      },
      select: { userId: true }
    });
    
    const paidUserIds = [...new Set(activeSubscriptions.map(s => s.userId))];
    const paidUsersCount = paidUserIds.length;
    const unpaidUsersCount = Math.max(0, totalUsers - paidUsersCount);

    // 2. Revenue Aggregations
    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);
    
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0,0,0,0);

    const todayPayments = await prisma.payment.aggregate({
      where: { status: 'SUCCESS', createdAt: { gte: todayStart } },
      _sum: { amount: true }
    });

    const monthlyPayments = await prisma.payment.aggregate({
      where: { status: 'SUCCESS', createdAt: { gte: monthStart } },
      _sum: { amount: true }
    });

    const totalPayments = await prisma.payment.aggregate({
      where: { status: 'SUCCESS' },
      _sum: { amount: true }
    });

    const todayRevenue = todayPayments._sum.amount || 0;
    const monthlyRevenue = monthlyPayments._sum.amount || 0;
    const totalRevenue = totalPayments._sum.amount || 0;

    // 3. Registrations & Alerts
    const todayRegistrations = await prisma.user.count({
      where: { roleId: 2, createdAt: { gte: todayStart } }
    });

    // Expiring soon = active subscriptions expiring in next 5 days
    const fiveDaysLater = new Date();
    fiveDaysLater.setDate(fiveDaysLater.getDate() + 5);

    const expiringSoonCount = await prisma.subscription.count({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: now,
          lte: fiveDaysLater
        }
      }
    });

    const expiredUsersCount = await prisma.subscription.count({
      where: { status: 'EXPIRED' }
    });

    // 4. Latest lists
    const latestPayments = await prisma.payment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, phone: true } }
      }
    });

    const latestLogins = await prisma.loginHistory.findMany({
      take: 5,
      orderBy: { loggedInAt: 'desc' },
      include: {
        user: { select: { name: true, username: true, phone: true } }
      }
    });

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        paidUsers: paidUsersCount,
        unpaidUsers: unpaidUsersCount,
        todayRevenue,
        monthlyRevenue,
        totalRevenue,
        todayRegistrations,
        expiringSoon: expiringSoonCount,
        expiredUsers: expiredUsersCount
      },
      latestPayments,
      latestLogins
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users with filters and pagination
 */
export const getUsers = async (req, res, next) => {
  const { search, status, page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  try {
    const where = {
      roleId: 2 // Only retrieve standard users
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
        { username: { contains: search } }
      ];
    }

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        include: {
          subscriptions: {
            orderBy: { endDate: 'desc' },
            take: 1
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.user.count({ where })
    ]);

    return res.status(200).json({
      success: true,
      users,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle user status: Suspend
 */
export const suspendUser = async (req, res, next) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { status: 'SUSPENDED' }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: `Suspended user account: ${user.name} (ID: ${user.id})`,
        ipAddress: req.ip
      }
    });

    return res.status(200).json({ success: true, message: 'User suspended successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle user status: Activate
 */
export const activateUser = async (req, res, next) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { status: 'ACTIVE' }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: `Activated user account: ${user.name} (ID: ${user.id})`,
        ipAddress: req.ip
      }
    });

    return res.status(200).json({ success: true, message: 'User activated successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset user password administratively
 */
export const resetUserPassword = async (req, res, next) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const tempPassword = Math.random().toString(36).substring(2, 10);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: `Administratively reset password for user: ${user.name}`,
        ipAddress: req.ip
      }
    });

    // Notify user
    try {
      await sendSMS(user.phone, `Your Excel Energy password has been reset. Temporary credentials: ${tempPassword}. Please update it after logging in.`);
      if (user.email) {
        await sendPasswordResetEmail(user.email, user.name, tempPassword);
      }
    } catch (err) {
      console.warn('[Admin-PasswordReset] Email/SMS delivery skipped:', err.message);
    }

    return res.status(200).json({
      success: true,
      message: `Password reset successfully. Temp password is: ${tempPassword}`,
      tempPassword
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve granular user history and metrics
 */
export const getUserDetails = async (req, res, next) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        subscriptions: { orderBy: { createdAt: 'desc' } },
        payments: { orderBy: { createdAt: 'desc' } },
        loginHistories: { orderBy: { loggedInAt: 'desc' }, take: 10 }
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete User Permanently
 */
export const deleteUser = async (req, res, next) => {
  const { id } = req.params;

  try {
    await prisma.user.delete({
      where: { id: parseInt(id) }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: `Permanently deleted user ID: ${id}`,
        ipAddress: req.ip
      }
    });

    return res.status(200).json({ success: true, message: 'User deleted permanently.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all payment records across system
 */
export const getAllPayments = async (req, res, next) => {
  const { status, page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  try {
    const where = {};
    if (status) {
      where.status = status;
    }

    const [payments, total] = await prisma.$transaction([
      prisma.payment.findMany({
        where,
        include: {
          user: { select: { name: true, phone: true, email: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.payment.count({ where })
    ]);

    return res.status(200).json({ success: true, payments, total });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate aggregate report statistics (daily revenue logs & charts)
 */
export const getRevenueReport = async (req, res, next) => {
  try {
    // 1. Group revenue by month
    const monthlyData = await prisma.$queryRaw`
      SELECT DATE_FORMAT(createdAt, '%Y-%m') AS month, SUM(amount) AS total
      FROM Payment
      WHERE status = 'SUCCESS'
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `;

    // 2. Group revenue by day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dailyData = await prisma.$queryRaw`
      SELECT DATE(createdAt) AS date, SUM(amount) AS total
      FROM Payment
      WHERE status = 'SUCCESS' AND createdAt >= ${thirtyDaysAgo}
      GROUP BY date
      ORDER BY date ASC
    `;

    // 3. User Growth registration trend
    const userGrowthData = await prisma.$queryRaw`
      SELECT DATE(createdAt) AS date, COUNT(id) AS count
      FROM User
      WHERE roleId = 2
      GROUP BY date
      ORDER BY date ASC
      LIMIT 30
    `;

    return res.status(200).json({
      success: true,
      monthly: monthlyData,
      daily: dailyData,
      growth: userGrowthData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get core settings config parameters
 */
export const getSettings = async (req, res, next) => {
  try {
    const settings = await prisma.settings.findUnique({
      where: { id: 1 }
    });
    return res.status(200).json({ success: true, settings });
  } catch (error) {
    next(error);
  }
};

/**
 * Update global platform setting variables
 */
export const updateSettings = async (req, res, next) => {
  try {
    const updated = await prisma.settings.update({
      where: { id: 1 },
      data: req.body
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'Updated global platform configuration settings',
        ipAddress: req.ip
      }
    });

    return res.status(200).json({ success: true, message: 'Settings updated successfully.', settings: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * Audit log monitoring
 */
export const getActivityLogs = async (req, res, next) => {
  const { limit = 50 } = req.query;
  try {
    const logs = await prisma.activityLog.findMany({
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, role: { select: { name: true } } } }
      }
    });
    return res.status(200).json({ success: true, logs });
  } catch (error) {
    next(error);
  }
};

/**
 * Staff Roster: Get Employees & Volunteers
 */
export const getEmployeesAndVolunteers = async (req, res, next) => {
  try {
    const staff = await prisma.user.findMany({
      where: {
        role: { name: { in: ['EMPLOYEE', 'VOLUNTEER'] } }
      },
      include: {
        role: true,
        employeeProfile: true,
        attendances: { orderBy: { checkIn: 'desc' }, take: 5 }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({ success: true, staff });
  } catch (error) {
    next(error);
  }
};

/**
 * Add / Create new Staff Member (EMPLOYEE / VOLUNTEER)
 */
export const createStaffMember = async (req, res, next) => {
  try {
    const { name, phone, email, roleName, specialization, bio, password } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Staff name and phone number are required.' });
    }

    // Role lookup
    let targetRole = 'EMPLOYEE';
    if (roleName === 'VOLUNTEER') targetRole = 'VOLUNTEER';
    if (roleName === 'ADMIN') targetRole = 'ADMIN';

    let role = await prisma.role.findUnique({ where: { name: targetRole } });
    
    if (!role) {
      // Auto-create role if missing in DB
      const roleIdMap = { ADMIN: 1, EMPLOYEE: 3, VOLUNTEER: 4 };
      role = await prisma.role.create({
        data: { id: roleIdMap[targetRole] || 3, name: targetRole }
      });
    }

    const username = `staff_${Math.random().toString(36).substring(2, 8)}`;
    
    let passwordHash = null;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password, salt);
    }

    const newStaff = await prisma.user.create({
      data: {
        username,
        name,
        phone,
        email,
        passwordHash,
        roleId: role.id,
        employeeProfile: {
          create: {
            specialization: specialization || (targetRole === 'ADMIN' ? 'System Administrator' : 'Energy Healer'),
            dutyStatus: 'OFF_DUTY',
            bio
          }
        }
      },
      include: { role: true, employeeProfile: true }
    });

    return res.status(201).json({
      success: true,
      message: `${targetRole} created successfully.`,
      staff: newStaff
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Staff Member (EMPLOYEE / VOLUNTEER)
 */
export const updateStaffMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, email, roleName, specialization, bio, password } = req.body;

    // Check if staff user exists
    const staff = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: { role: true }
    });

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    // Role lookup
    let targetRole = 'EMPLOYEE';
    if (roleName === 'VOLUNTEER') targetRole = 'VOLUNTEER';
    if (roleName === 'ADMIN') targetRole = 'ADMIN';

    let role = await prisma.role.findUnique({ where: { name: targetRole } });
    if (!role) {
      const roleIdMap = { ADMIN: 1, EMPLOYEE: 3, VOLUNTEER: 4 };
      role = await prisma.role.create({
        data: { id: roleIdMap[targetRole] || 3, name: targetRole }
      });
    }

    const updateData = {
      name,
      phone,
      email,
      roleId: role.id
    };

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(password, salt);
    }

    const updatedStaff = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        ...updateData,
        employeeProfile: {
          upsert: {
            create: {
              specialization: specialization || 'Energy Healer',
              bio
            },
            update: {
              specialization: specialization || 'Energy Healer',
              bio
            }
          }
        }
      },
      include: { role: true, employeeProfile: true }
    });

    return res.status(200).json({
      success: true,
      message: 'Staff member updated successfully.',
      staff: updatedStaff
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Staff Member
 */
export const deleteStaffMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id: parseInt(id) } });
    return res.status(200).json({ success: true, message: 'Staff member permanently deleted.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all Attendance Logs for Admin
 */
export const getAllAttendanceLogs = async (req, res, next) => {
  try {
    const logs = await prisma.attendance.findMany({
      include: {
        user: { select: { id: true, name: true, phone: true, role: { select: { name: true } } } }
      },
      orderBy: { checkIn: 'desc' },
      take: 100
    });

    return res.status(200).json({ success: true, logs });
  } catch (error) {
    next(error);
  }
};

/**
 * Create Live Stream / Healing Session
 */
export const createLiveSession = async (req, res, next) => {
  try {
    const { title, description, hostName, scheduledAt, durationMinutes, meetingUrl, type } = req.body;

    if (!title || !meetingUrl) {
      return res.status(400).json({ success: false, message: 'Title and meeting URL are required.' });
    }

    const liveSession = await prisma.liveSession.create({
      data: {
        title,
        description,
        hostName: hostName || 'Master Energy Guide',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
        durationMinutes: durationMinutes ? parseInt(durationMinutes) : 60,
        meetingUrl,
        type: type || 'HEALING',
        status: 'UPCOMING'
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Live session created.',
      session: liveSession
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Live Session Status & Broadcast WhatsApp notification to all active members
 */
export const broadcastLiveSessionAlert = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { sendWhatsAppAlert } = req.body;

    const session = await prisma.liveSession.update({
      where: { id: parseInt(sessionId) },
      data: { status: 'LIVE' }
    });

    let broadcastCount = 0;
    if (sendWhatsAppAlert) {
      const activeMembers = await prisma.user.findMany({
        where: { status: 'ACTIVE', role: { name: { in: ['MEMBER', 'USER'] } } },
        select: { name: true, phone: true }
      });

      // Log WhatsApp Broadcast alert
      const { sendWhatsAppYouTubeLive } = await import('../services/whatsapp.service.js');
      for (const member of activeMembers) {
        if (member.phone) {
          try {
            await sendWhatsAppYouTubeLive(member.phone, member.name, session.meetingUrl);
            broadcastCount++;
          } catch (e) {
            console.warn('[WhatsApp-Broadcast] Failed for:', member.phone, e.message);
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: `Live session is now LIVE! Broadcasted to ${broadcastCount} members via WhatsApp Test Mode.`,
      session
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all 1-on-1 member bookings for Admin Overview
 */
export const getAdminBookings = async (req, res, next) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
        healer: { select: { id: true, name: true, phone: true } }
      },
      orderBy: { bookingDate: 'desc' }
    });

    return res.status(200).json({ success: true, bookings });
  } catch (error) {
    next(error);
  }
};

