import prisma from '../config/db.js';

/**
 * Handle contact form submission
 */
export const submitContactForm = async (req, res, next) => {
  const { name, email, phone, message } = req.body;

  try {
    const contact = await prisma.contactForm.create({
      data: {
        name,
        email,
        phone,
        message
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Your inquiry has been submitted successfully. We will contact you soon.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all contact messages (Admin only)
 */
export const getContactForms = async (req, res, next) => {
  try {
    const contacts = await prisma.contactForm.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json({ success: true, contacts });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark contact message as read (Admin only)
 */
export const markContactFormRead = async (req, res, next) => {
  const { id } = req.params;

  try {
    await prisma.contactForm.update({
      where: { id: parseInt(id) },
      data: { status: 'READ' }
    });
    return res.status(200).json({ success: true, message: 'Message marked as read.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a contact message permanently (Admin only)
 */
export const deleteContactForm = async (req, res, next) => {
  const { id } = req.params;

  try {
    await prisma.contactForm.delete({
      where: { id: parseInt(id) }
    });
    return res.status(200).json({ success: true, message: 'Message deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
