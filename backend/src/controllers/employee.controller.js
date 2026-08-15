import prisma from '../config/db.js';
import { sendWhatsAppBookingConfirmation } from '../services/whatsapp.service.js';

/**
 * Helper to check and automatically checkout stale check-in sessions (> 8 hours) for a user.
 */
export const checkAndCheckoutStaleSession = async (userId) => {
  try {
    const eightHoursAgo = new Date();
    eightHoursAgo.setHours(eightHoursAgo.getHours() - 8);

    const openAttendance = await prisma.attendance.findFirst({
      where: { userId, checkOut: null, checkIn: { lte: eightHoursAgo } }
    });

    if (openAttendance) {
      const autoCheckOutTime = new Date(openAttendance.checkIn.getTime() + 8 * 60 * 60 * 1000);
      await prisma.attendance.update({
        where: { id: openAttendance.id },
        data: {
          checkOut: autoCheckOutTime,
          notes: openAttendance.notes 
            ? `${openAttendance.notes} | Auto checkout after 8 hours` 
            : 'Auto checkout after 8 hours'
        }
      });

      await prisma.employeeProfile.update({
        where: { userId },
        data: { dutyStatus: 'OFF_DUTY' }
      }).catch(() => {});
      
      console.log(`[Auto-Checkout] User ${userId} session auto checked out after 8 hours.`);
    }
  } catch (error) {
    console.error(`[Auto-Checkout] Error checking stale session for user ${userId}:`, error);
  }
};

/**
 * Get current employee profile & stats
 */
export const getEmployeeProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Auto checkout if shift exceeds 8 hours
    await checkAndCheckoutStaleSession(userId);

    let profile = await prisma.employeeProfile.findUnique({
      where: { userId },
      include: { user: { select: { name: true, phone: true, email: true } } }
    });

    if (!profile) {
      // Auto-create profile if missing
      profile = await prisma.employeeProfile.create({
        data: {
          userId,
          specialization: 'Energy Healer & Practitioner',
          dutyStatus: 'OFF_DUTY',
          availability: JSON.stringify({
            Monday: '09:00 AM - 05:00 PM',
            Tuesday: '09:00 AM - 05:00 PM',
            Wednesday: '09:00 AM - 05:00 PM',
            Thursday: '09:00 AM - 05:00 PM',
            Friday: '09:00 AM - 05:00 PM'
          })
        },
        include: { user: { select: { name: true, phone: true, email: true } } }
      });
    }

    return res.status(200).json({
      success: true,
      profile
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update duty status (ON_DUTY, OFF_DUTY, ON_BREAK)
 */
export const updateDutyStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { dutyStatus } = req.body;

    const updated = await prisma.employeeProfile.upsert({
      where: { userId },
      update: { dutyStatus },
      create: {
        userId,
        specialization: 'Energy Healer',
        dutyStatus
      }
    });

    return res.status(200).json({
      success: true,
      message: `Duty status updated to ${dutyStatus}`,
      profile: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update weekly availability
 */
export const updateAvailability = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { availability, bio, specialization } = req.body;

    const updated = await prisma.employeeProfile.upsert({
      where: { userId },
      update: {
        ...(availability && { availability: typeof availability === 'string' ? availability : JSON.stringify(availability) }),
        ...(bio !== undefined && { bio }),
        ...(specialization && { specialization })
      },
      create: {
        userId,
        specialization: specialization || 'Energy Healer',
        availability: typeof availability === 'string' ? availability : JSON.stringify(availability),
        bio
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Availability schedule updated successfully.',
      profile: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Attendance Check In
 */
export const checkInAttendance = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { notes } = req.body;

    // Auto checkout if previous shift exceeds 8 hours and user forgot to checkout
    await checkAndCheckoutStaleSession(userId);

    // Check if open check-in exists
    const openAttendance = await prisma.attendance.findFirst({
      where: { userId, checkOut: null }
    });

    if (openAttendance) {
      return res.status(400).json({
        success: false,
        message: 'You are already checked in.'
      });
    }

    const attendance = await prisma.attendance.create({
      data: {
        userId,
        checkIn: new Date(),
        status: 'PRESENT',
        notes
      }
    });

    // Automatically set duty status to ON_DUTY
    await prisma.employeeProfile.upsert({
      where: { userId },
      update: { dutyStatus: 'ON_DUTY' },
      create: { userId, dutyStatus: 'ON_DUTY' }
    });

    return res.status(201).json({
      success: true,
      message: 'Shift Check-In recorded successfully.',
      attendance
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Attendance Check Out
 */
export const checkOutAttendance = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { notes } = req.body;

    const openAttendance = await prisma.attendance.findFirst({
      where: { userId, checkOut: null },
      orderBy: { createdAt: 'desc' }
    });

    if (!openAttendance) {
      return res.status(400).json({
        success: false,
        message: 'No active check-in record found for today.'
      });
    }

    const attendance = await prisma.attendance.update({
      where: { id: openAttendance.id },
      data: {
        checkOut: new Date(),
        notes: notes ? `${openAttendance.notes || ''} | Checkout: ${notes}` : openAttendance.notes
      }
    });

    // Automatically set duty status to OFF_DUTY
    await prisma.employeeProfile.update({
      where: { userId },
      data: { dutyStatus: 'OFF_DUTY' }
    });

    return res.status(200).json({
      success: true,
      message: 'Shift Check-Out recorded successfully.',
      attendance
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Attendance History
 */
export const getAttendanceHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Auto checkout if current active shift exceeds 8 hours
    await checkAndCheckoutStaleSession(userId);

    const history = await prisma.attendance.findMany({
      where: { userId },
      orderBy: { checkIn: 'desc' },
      take: 30
    });

    return res.status(200).json({
      success: true,
      history
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get assigned 1-on-1 bookings
 */
export const getAssignedBookings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const bookings = await prisma.booking.findMany({
      where: { healerId: userId },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } }
      },
      orderBy: { bookingDate: 'desc' }
    });

    return res.status(200).json({
      success: true,
      bookings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update session notes for member booking
 */
export const updateBookingNotes = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { status, notes } = req.body;

    const updated = await prisma.booking.update({
      where: { id: parseInt(bookingId) },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes })
      },
      include: {
        user: { select: { name: true, phone: true } },
        healer: { select: { name: true } }
      }
    });

    if (status === 'CONFIRMED' && updated.user?.phone) {
      try {
        await sendWhatsAppBookingConfirmation(
          updated.user.phone,
          updated.user.name,
          updated.healer.name,
          updated.sessionType,
          new Date(updated.bookingDate).toLocaleDateString('en-IN'),
          updated.timeSlot
        );
      } catch (waErr) {
        console.warn('[Employee-Controller] WhatsApp alert warning:', waErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Booking details updated.',
      booking: updated
    });
  } catch (error) {
    next(error);
  }
};
