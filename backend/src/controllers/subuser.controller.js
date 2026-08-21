import prisma from '../config/db.js';

/**
 * Add a new sub-user under the authenticated primary user
 */
export const createSubUser = async (req, res, next) => {
  const { name, phone, nakshatram, photo } = req.body;
  const parentId = req.user.id;

  if (!name || !nakshatram) {
    return res.status(400).json({ success: false, message: 'Name and Nakshatram are required.' });
  }

  try {
    const subUser = await prisma.subUser.create({
      data: {
        parentId,
        name,
        phone: phone || null,
        nakshatram,
        photo: photo || null
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Sub-user added successfully.',
      subUser
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve all sub-users under the authenticated user
 */
export const getSubUsers = async (req, res, next) => {
  const parentId = req.user.id;

  try {
    const now = new Date();

    // Dynamically mark any expired sub-user subscriptions as EXPIRED in the database
    await prisma.subUser.updateMany({
      where: {
        parentId,
        subscriptionStatus: 'ACTIVE',
        subscriptionEndDate: { lt: now }
      },
      data: {
        subscriptionStatus: 'EXPIRED'
      }
    });

    const subUsers = await prisma.subUser.findMany({
      where: { parentId },
      orderBy: { createdAt: 'asc' }
    });

    return res.status(200).json({
      success: true,
      subUsers
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a sub-user (must be owned by the calling user)
 */
export const deleteSubUser = async (req, res, next) => {
  const { id } = req.params;
  const parentId = req.user.id;

  try {
    const subUser = await prisma.subUser.findUnique({
      where: { id: parseInt(id, 10) }
    });

    if (!subUser) {
      return res.status(404).json({ success: false, message: 'Sub-user not found.' });
    }

    if (subUser.parentId !== parentId) {
      return res.status(403).json({ success: false, message: 'Unauthorized. You do not own this sub-user profile.' });
    }

    await prisma.subUser.delete({
      where: { id: parseInt(id, 10) }
    });

    return res.status(200).json({
      success: true,
      message: 'Sub-user deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
