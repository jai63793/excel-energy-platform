import prisma from '../config/db.js';
import { sendWhatsAppBookingConfirmation } from '../services/whatsapp.service.js';

/**
 * Get available healers / practitioners for 1-on-1 booking
 */
export const getAvailableHealers = async (req, res, next) => {
  try {
    const healers = await prisma.user.findMany({
      where: {
        role: { name: { in: ['EMPLOYEE', 'ADMIN', 'VOLUNTEER'] } },
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        employeeProfile: true
      }
    });

    return res.status(200).json({
      success: true,
      healers
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a 1-on-1 session booking
 */
export const createBooking = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { healerId, sessionType, bookingDate, timeSlot, amount, notes } = req.body;

    if (!healerId || !bookingDate || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Healer, booking date, and time slot are required.'
      });
    }

    const healer = await prisma.user.findUnique({
      where: { id: parseInt(healerId) }
    });

    if (!healer) {
      return res.status(404).json({ success: false, message: 'Selected healer was not found.' });
    }

    const booking = await prisma.booking.create({
      data: {
        userId,
        healerId: parseInt(healerId),
        sessionType: sessionType || '1-on-1 Distance Healing',
        bookingDate: new Date(bookingDate),
        timeSlot,
        amount: amount ? parseFloat(amount) : 500.0,
        status: 'PENDING',
        notes
      },
      include: {
        healer: { select: { name: true, phone: true } },
        user: { select: { name: true, phone: true } }
      }
    });

    return res.status(201).json({
      success: true,
      message: '1-on-1 Session booked successfully!',
      booking
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get bookings for current user
 */
export const getUserBookings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        healer: { select: { id: true, name: true, phone: true, employeeProfile: true } }
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
 * Cancel booking
 */
export const cancelBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(bookingId) }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.userId !== userId && req.user.role?.name !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized to cancel this booking.' });
    }

    const updated = await prisma.booking.update({
      where: { id: parseInt(bookingId) },
      data: { status: 'CANCELLED' }
    });

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully.',
      booking: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get active & upcoming Live Sessions
 */
export const getLiveSessions = async (req, res, next) => {
  try {
    const sessions = await prisma.liveSession.findMany({
      orderBy: { scheduledAt: 'asc' },
      take: 20
    });

    return res.status(200).json({
      success: true,
      sessions
    });
  } catch (error) {
    next(error);
  }
};
