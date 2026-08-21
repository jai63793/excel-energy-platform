import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const decodePassword = (val) => {
  if (val && typeof val === 'string' && val.startsWith('base64:')) {
    return Buffer.from(val.substring(7), 'base64').toString('utf-8');
  }
  return val;
};
import prisma from '../config/db.js';
import { sendSMS } from '../services/sms.service.js';
import { sendPasswordResetEmail } from '../services/email.service.js';
import { createRazorpayPaymentLink } from '../services/razorpay.service.js';
import { sendWhatsAppMessage } from '../services/whatsapp.service.js';

const sanitizeUser = (user) => {
  if (!user) return user;
  const sanitized = { ...user };
  delete sanitized.passwordHash;
  return sanitized;
};

const sanitizeUsers = (users) => {
  if (!Array.isArray(users)) return users;
  return users.map(u => sanitizeUser(u));
};

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
          },
          subUsers: true
        },
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.user.count({ where })
    ]);

    return res.status(200).json({
      success: true,
      users: sanitizeUsers(users),
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
      data: { status: 'INACTIVE' }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: `Deactivated user account: ${user.name} (ID: ${user.id})`,
        ipAddress: req.ip
      }
    });

    return res.status(200).json({ success: true, message: 'User deactivated successfully.' });
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

    return res.status(200).json({ success: true, user: sanitizeUser(user) });
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

    return res.status(200).json({ success: true, staff: sanitizeUsers(staff) });
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
      passwordHash = await bcrypt.hash(decodePassword(password), salt);
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
      staff: sanitizeUser(newStaff)
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
      updateData.passwordHash = await bcrypt.hash(decodePassword(password), salt);
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
      staff: sanitizeUser(updatedStaff)
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
    // 1. Auto-checkout any stale records (> 8 hours) first
    const eightHoursAgo = new Date();
    eightHoursAgo.setHours(eightHoursAgo.getHours() - 8);

    const openAttendances = await prisma.attendance.findMany({
      where: {
        checkOut: null,
        checkIn: { lte: eightHoursAgo }
      }
    });

    for (const record of openAttendances) {
      const autoCheckOutTime = new Date(record.checkIn.getTime() + 8 * 60 * 60 * 1000);
      await prisma.attendance.update({
        where: { id: record.id },
        data: {
          checkOut: autoCheckOutTime,
          notes: record.notes 
            ? `${record.notes} | Auto checkout after 8 hours` 
            : 'Auto checkout after 8 hours'
        }
      });
      await prisma.employeeProfile.update({
        where: { userId: record.userId },
        data: { dutyStatus: 'OFF_DUTY' }
      }).catch(() => {});
    }

    // 2. Query logs with filters
    const { userId, month, year } = req.query;
    const where = {};

    if (userId) {
      where.userId = Number(userId);
    }

    if (year) {
      const yr = Number(year);
      if (month) {
        const mo = Number(month); // 1-indexed (1 = Jan, 12 = Dec)
        const startDate = new Date(yr, mo - 1, 1);
        const endDate = new Date(yr, mo, 0, 23, 59, 59, 999);
        where.checkIn = {
          gte: startDate,
          lte: endDate
        };
      } else {
        const startDate = new Date(yr, 0, 1);
        const endDate = new Date(yr, 11, 31, 23, 59, 59, 999);
        where.checkIn = {
          gte: startDate,
          lte: endDate
        };
      }
    }

    const takeLimit = (userId || month || year) ? 1000 : 100;

    const logs = await prisma.attendance.findMany({
      where,
      include: {
        user: { 
          select: { 
            id: true, 
            name: true, 
            phone: true, 
            role: { select: { name: true } } 
          } 
        }
      },
      orderBy: { checkIn: 'desc' },
      take: takeLimit
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

/**
 * Assign / Re-assign a healer to a booking by Admin
 */
export const assignBookingHealer = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { healerId } = req.body;

    if (!healerId) {
      return res.status(400).json({ success: false, message: 'Healer ID is required.' });
    }

    const healer = await prisma.user.findUnique({
      where: { id: parseInt(healerId) }
    });

    if (!healer) {
      return res.status(404).json({ success: false, message: 'Healer not found.' });
    }

    const updated = await prisma.booking.update({
      where: { id: parseInt(bookingId) },
      data: {
        healerId: parseInt(healerId)
      },
      include: {
        user: { select: { name: true, phone: true } },
        healer: { select: { name: true } }
      }
    });

    return res.status(200).json({
      success: true,
      message: `Booking successfully assigned to ${healer.name}`,
      booking: updated
    });
  } catch (error) {
    next(error);
  }
};


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
 * Register user & generate Razorpay Payment Link
 */
export const registerUserWithPaymentLink = async (req, res, next) => {
  const { name, phone, email, address, plan } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ success: false, message: 'Name and Mobile number are required.' });
  }

  try {
    // 1. Check if user already exists
    let user = await prisma.user.findUnique({
      where: { phone }
    });

    if (user) {
      // Existing user: proceed normally by generating payment link and creating pending payment record
      // 2. Determine pricing plan amount
      const settings = await prisma.settings.findUnique({ where: { id: 1 } });
      let baseAmount = 1500.0;
      let totalAmount;

      if (plan === 'test_1rupee') {
        totalAmount = 1.0;
      } else {
        if (plan === '3month') {
          baseAmount = 4500.0;
        } else if (plan === '6month') {
          baseAmount = 9000.0;
        }

        const gstRate = 0.18;
        const gstAmount = baseAmount * gstRate;
        totalAmount = baseAmount + gstAmount;
      }

      // 3. Request Razorpay Payment Link
      const description = `Excel Energy Membership - ${plan || '1month'} plan`;
      const plink = await createRazorpayPaymentLink(totalAmount, { ...user, plan }, description);

      // 4. Save pending payment record using Payment Link ID in razorpayOrderId column
      await prisma.payment.create({
        data: {
          userId: user.id,
          amount: totalAmount,
          status: 'PENDING',
          razorpayOrderId: plink.id
        }
      });

      // 5. Send payment link via WhatsApp (non-blocking)
      let welcomeMsg = `Hello ${user.name},\n\nYour Excel Energy account has been registered! To activate your subscription access, please complete your payment using this link:\n\n🔗 ${plink.short_url}\n\n`;
      welcomeMsg += `Please log in using your existing account credentials.`;
      welcomeMsg += `\n\nThank you for choosing Excel Energy!`;

      sendWhatsAppMessage(user.phone, welcomeMsg)
        .catch(notifyError => console.warn('[Admin-Registration-Notifications] WhatsApp link failed:', notifyError.message));

      sendSMS(user.phone, `Account registered! Pay here: ${plink.short_url}`)
        .catch(notifyError => console.warn('[Admin-Registration-Notifications] SMS link failed:', notifyError.message));

      return res.status(201).json({
        success: true,
        message: 'Existing user found. Payment link generated.',
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          phone: user.phone,
          email: user.email,
          isNewUser: false
        },
        paymentLinkId: plink.id,
        paymentLinkUrl: plink.short_url,
        amount: totalAmount
      });
    } else {
      // New user: Create user record in DB with INACTIVE status first
      // 2. Determine pricing plan amount
      const settings = await prisma.settings.findUnique({ where: { id: 1 } });
      let baseAmount = 1500.0;
      let totalAmount;

      if (plan === 'test_1rupee') {
        totalAmount = 1.0;
      } else {
        if (plan === '3month') {
          baseAmount = 4500.0;
        } else if (plan === '6month') {
          baseAmount = 9000.0;
        }

        const gstRate = 0.18;
        const gstAmount = baseAmount * gstRate;
        totalAmount = baseAmount + gstAmount;
      }

      // Generate credentials
      const generateUniqueUsername = async (name) => {
        const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        return `${cleanName}${randomSuffix}`;
      };
      const username = await generateUniqueUsername(name);
      const tempPassword = Math.random().toString(36).substring(2, 10);
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(tempPassword, salt);

      // Create new user in status INACTIVE
      user = await prisma.user.create({
        data: {
          username,
          name,
          phone,
          email: email || null,
          address: address || null,
          passwordHash,
          roleId: 2, // USER
          status: 'INACTIVE'
        }
      });

      // 3. Request Razorpay Payment Link (which will contain notes with userId = user.id)
      const description = `Excel Energy Membership - ${plan || '1month'} plan`;
      const plink = await createRazorpayPaymentLink(totalAmount, { ...user, plan }, description);

      // 4. Save pending payment record using Payment Link ID in razorpayOrderId column
      await prisma.payment.create({
        data: {
          userId: user.id,
          amount: totalAmount,
          status: 'PENDING',
          razorpayOrderId: plink.id
        }
      });

      // 5. Send welcome message with payment link (non-blocking)
      let welcomeMsg = `Hello ${name},\n\nYour Excel Energy account is ready! To complete your registration and activate your membership access, please complete your payment using this link:\n\n🔗 ${plink.short_url}\n\n`;
      welcomeMsg += `Upon successful payment, your login credentials (username and temporary password) will be activated.`;
      welcomeMsg += `\n\nThank you for choosing Excel Energy!`;

      sendWhatsAppMessage(phone, welcomeMsg)
        .catch(notifyError => console.warn('[Admin-Registration-Notifications] WhatsApp link failed:', notifyError.message));

      sendSMS(phone, `Register account! Pay here: ${plink.short_url}`)
        .catch(notifyError => console.warn('[Admin-Registration-Notifications] SMS link failed:', notifyError.message));

      return res.status(201).json({
        success: true,
        message: 'Registration payment link generated. Account will be created/activated upon successful payment.',
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          phone: user.phone,
          email: user.email,
          isNewUser: true
        },
        tempPassword,
        paymentLinkId: plink.id,
        paymentLinkUrl: plink.short_url,
        amount: totalAmount
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Admin Create Customer User directly
 */
export const createAdminUser = async (req, res, next) => {
  const { name, phone, email, address, password, plan } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ success: false, message: 'Name and Phone/WhatsApp number are required.' });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { phone }
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Mobile number already registered.' });
    }

    const username = await generateUniqueUsername(name);
    
    // Hash password or create a default temp one
    let userPassword = password;
    if (!password) {
      userPassword = Math.random().toString(36).substring(2, 10);
    } else {
      userPassword = decodePassword(password);
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(userPassword, salt);

    const newUser = await prisma.user.create({
      data: {
        username,
        name,
        phone,
        email: email || null,
        address: address || null,
        passwordHash,
        roleId: 2, // USER
        status: 'ACTIVE'
      }
    });

    // Create direct subscription in DB if a plan is specified
    if (plan) {
      let durationDays = 30;
      let amount = 1500.0;
      const isTestPlan = plan === 'test_1rupee';
      
      if (plan === '3month') {
        durationDays = 90;
        amount = 4500.0;
      } else if (plan === '6month') {
        durationDays = 180;
        amount = 9000.0;
      } else if (isTestPlan) {
        durationDays = 0;
        amount = 1.0;
      }

      if (!isTestPlan) {
        amount = amount * 1.18; // Apply 18% GST
      }

      const now = new Date();
      const endDate = new Date();
      if (isTestPlan) {
        endDate.setMinutes(endDate.getMinutes() + 30);
      } else {
        endDate.setDate(endDate.getDate() + durationDays);
      }

      // Create subscription
      const subscription = await prisma.subscription.create({
        data: {
          userId: newUser.id,
          status: 'ACTIVE',
          amount,
          startDate: now,
          endDate,
          razorpayOrderId: 'direct_admin_create'
        }
      });

      // Create payment log
      const invoiceNumber = `INV-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      await prisma.payment.create({
        data: {
          userId: newUser.id,
          subscriptionId: subscription.id,
          amount,
          status: 'SUCCESS',
          razorpayOrderId: `direct_admin_create_${Date.now()}`,
          invoiceNumber
        }
      });
    }

    // Write Log
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: `Admin directly created user account: ${username} with plan: ${plan || 'none'}`,
        ipAddress: req.ip
      }
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully.',
      user: {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        phone: newUser.phone,
        email: newUser.email,
        address: newUser.address
      },
      tempPassword: userPassword
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk Create Customer Users directly
 */
export const createBulkAdminUsers = async (req, res, next) => {
  const { users } = req.body;

  if (!users || !Array.isArray(users) || users.length === 0) {
    return res.status(400).json({ success: false, message: 'An array of users is required.' });
  }

  const successList = [];
  const failedList = [];

  try {
    for (let i = 0; i < users.length; i++) {
      const u = users[i];
      const { name, phone, email, password } = u;

      if (!name || !phone) {
        failedList.push({
          name: name || '',
          phone: phone || '',
          error: 'Name and Phone/WhatsApp number are required.'
        });
        continue;
      }

      // Check if duplicate in successList
      const isDuplicateInBatch = successList.some(item => item.phone === phone);
      if (isDuplicateInBatch) {
        failedList.push({
          name,
          phone,
          error: 'Duplicate phone number in the upload batch.'
        });
        continue;
      }

      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: phone },
            { phone: phone.startsWith('+91') ? phone.replace('+91', '') : `+91${phone}` }
          ]
        }
      });

      if (existingUser) {
        failedList.push({
          name,
          phone,
          error: 'Mobile number already registered.'
        });
        continue;
      }

      try {
        const username = await generateUniqueUsername(name);
        
        // Hash password or create a default temp one
        let userPassword = password;
        if (!password) {
          userPassword = Math.random().toString(36).substring(2, 10);
        } else {
          userPassword = decodePassword(password);
        }
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(userPassword, salt);

        const newUser = await prisma.user.create({
          data: {
            username,
            name,
            phone,
            email: email || null,
            passwordHash,
            roleId: 2, // USER
            status: 'ACTIVE'
          }
        });

        successList.push({
          id: newUser.id,
          username: newUser.username,
          name: newUser.name,
          phone: newUser.phone,
          email: newUser.email,
          temporaryPassword: password ? undefined : userPassword
        });

        // Write activity log for this creation
        await prisma.activityLog.create({
          data: {
            userId: req.user.id,
            action: `Admin directly created user account (Bulk): ${username}`,
            ipAddress: req.ip
          }
        });
      } catch (err) {
        failedList.push({
          name,
          phone,
          error: err.message || 'Database creation failure.'
        });
      }
    }

    return res.status(200).json({
      success: true,
      registeredCount: successList.length,
      failedCount: failedList.length,
      successUsers: successList,
      failedUsers: failedList
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin Update Customer User details & password
 */
export const updateAdminUser = async (req, res, next) => {
  const { id } = req.params;
  const { name, phone, email, address, status, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Check phone unique constraint if phone has changed
    if (phone !== user.phone) {
      const phoneExists = await prisma.user.findFirst({
        where: { phone, id: { not: parseInt(id) } }
      });
      if (phoneExists) {
        return res.status(400).json({ success: false, message: 'Mobile number already registered to another account.' });
      }
    }

    const updateData = {
      name,
      phone,
      email: email || null,
      address: address || null,
      status: status || 'ACTIVE'
    };

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(decodePassword(password), salt);
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    // Write Log
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: `Admin updated user details/password for: ${updatedUser.username}`,
        ipAddress: req.ip
      }
    });

    return res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        name: updatedUser.name,
        phone: updatedUser.phone,
        email: updatedUser.email,
        address: updatedUser.address,
        status: updatedUser.status
      }
    });
  } catch (error) {
    next(error);
  }
};

export const verifyPaymentLinkStatusManual = async (req, res, next) => {
  const { id } = req.params; // The payment ID in the database

  try {
    const paymentRecord = await prisma.payment.findUnique({
      where: { id: parseInt(id, 10) }
    });

    if (!paymentRecord) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    if (paymentRecord.status === 'SUCCESS') {
      return res.status(200).json({ success: true, message: 'Payment is already marked as SUCCESS.' });
    }

    const paymentLinkId = paymentRecord.razorpayOrderId; // This is the Payment Link ID
    if (!paymentLinkId) {
      return res.status(400).json({ success: false, message: 'No Razorpay Payment Link associated with this payment.' });
    }

    // Fetch details directly from Razorpay API
    const { fetchRazorpayPaymentLink } = await import('../services/razorpay.service.js');
    const paymentLink = await fetchRazorpayPaymentLink(paymentLinkId);

    if (paymentLink.status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: `Payment Link status is currently: ${paymentLink.status}. Not paid yet.`
      });
    }

    // Payment is paid! Process the registration and activation!
    const amount = paymentLink.amount / 100;
    const notes = paymentLink.notes || {};
    const isNew = notes.userId === 'new';

    let user = null;
    let tempPassword = null;
    let isNewUserCreated = false;
    let userId = paymentRecord.userId;

    if (isNew) {
      // Double check if the user is already created (to avoid duplicates)
      user = await prisma.user.findFirst({
        where: { phone: notes.phone }
      });

      if (!user) {
        isNewUserCreated = true;
        const generateUniqueUsername = async (name) => {
          const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
          const randomSuffix = Math.floor(1000 + Math.random() * 9000);
          return `${cleanName}${randomSuffix}`;
        };
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
            action: `User registered automatically via manual payment verification: ${username} (${notes.phone})`,
            ipAddress: req.ip || '127.0.0.1'
          }
        });
      }
      userId = user.id;
    }

    if (!userId) {
      return res.status(400).json({ success: false, message: 'Could not determine user association for this payment.' });
    }

    // Activate user if they are currently INACTIVE
    await prisma.user.updateMany({
      where: { id: userId, status: 'INACTIVE' },
      data: { status: 'ACTIVE' }
    });

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

    let paySelf = true;
    let subUserIds = [];
    if (paymentRecord.metadata) {
      try {
        const parsed = JSON.parse(paymentRecord.metadata);
        paySelf = parsed.paySelf !== undefined ? parsed.paySelf : true;
        subUserIds = parsed.subUserIds || [];
      } catch (err) {
        console.warn('Failed to parse manual payment metadata:', err.message);
      }
    }

    const count = (paySelf ? 1 : 0) + subUserIds.length || 1;
    const perUserAmount = amount / count;

    // Determine duration based on amount paid
    let durationDays = 30;
    const isTestPlan = Number(perUserAmount) === 1.0;
    if (isTestPlan) {
      durationDays = 0;
    } else if (perUserAmount === 5310 || perUserAmount === 5400) {
      durationDays = 90;
    } else if (perUserAmount === 10620 || perUserAmount === 10800) {
      durationDays = 180;
    } else if (perUserAmount === 21240 || perUserAmount === 21600) {
      durationDays = 365;
    }

    let startDate = new Date();
    let endDate = new Date();
    let subscription = null;

    if (paySelf) {
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
            amount: latestActiveSub.amount + perUserAmount
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
            amount: perUserAmount,
            startDate,
            endDate,
            razorpayOrderId: paymentLinkId
          }
        });
      }
    }

    // Activate/Extend Sub-users
    for (const subUserId of subUserIds) {
      const subUser = await prisma.subUser.findUnique({ where: { id: subUserId } });
      if (subUser) {
        let subEndDate = new Date();
        if (subUser.subscriptionStatus === 'ACTIVE' && subUser.subscriptionEndDate && subUser.subscriptionEndDate >= new Date()) {
          subEndDate = new Date(subUser.subscriptionEndDate);
          if (isTestPlan) {
            subEndDate.setMinutes(subEndDate.getMinutes() + 30);
          } else {
            subEndDate.setDate(subEndDate.getDate() + durationDays);
          }
        } else {
          if (isTestPlan) {
            subEndDate.setMinutes(subEndDate.getMinutes() + 30);
          } else {
            subEndDate.setDate(subEndDate.getDate() + durationDays);
          }
        }

        await prisma.subUser.update({
          where: { id: subUserId },
          data: {
            subscriptionStatus: 'ACTIVE',
            subscriptionEndDate: subEndDate
          }
        });
      }
    }

    const invoiceNumber = `INV-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    // Update payment record to SUCCESS
    await prisma.payment.update({
      where: { id: paymentRecord.id },
      data: {
        userId,
        status: 'SUCCESS',
        subscriptionId: subscription ? subscription.id : null,
        invoiceNumber
      }
    });

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

    // Send notifications in background (non-blocking)
    const finalUser = user || (await prisma.user.findUnique({ where: { id: userId } }));
    const formattedExpiry = endDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    try {
      const welcomeMsg = `Hello ${finalUser.name},\n\nYour payment of ₹${amount} is successful and your subscription is active! Expiring on ${formattedExpiry}.\n\nInvoice Number: ${invoiceNumber}`;
      await sendWhatsAppMessage(finalUser.phone, welcomeMsg);
    } catch (err) {
      console.warn('[Manual-Verification-Notifications] WhatsApp failed:', err.message);
    }

    if (isNewUserCreated && tempPassword) {
      try {
        const credentialsMsg = `Welcome to Excel Energy!\n\nYour account has been successfully created. Here are your temporary login details:\n\n👤 Username: ${finalUser.username}\n🔑 Temporary Password: ${tempPassword}\n\nPlease log in and change your password as soon as possible.`;
        await sendWhatsAppMessage(finalUser.phone, credentialsMsg);
      } catch (err) {
        console.warn('[Manual-Verification-Notifications] WhatsApp credentials failed:', err.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified and account/subscription successfully created/activated!',
      user: {
        username: finalUser.username,
        name: finalUser.name,
        phone: finalUser.phone
      },
      tempPassword
    });

  } catch (error) {
    next(error);
  }
};

