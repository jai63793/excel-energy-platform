import prisma from '../config/db.js';
import { verifyAccessToken } from '../utils/jwt.js';

/**
 * Authenticates requests checking for valid Bearer token
 */
export const authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyAccessToken(token);

  if (!decoded) {
    return res.status(401).json({ success: false, message: 'Invalid or expired access token.', tokenExpired: true });
  }

  try {
    // Retrieve user and check active status
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { role: true }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    if (user.status === 'SUSPENDED' || user.status === 'INACTIVE') {
      return res.status(403).json({ success: false, message: 'Your account is inactive. Contact administrator.' });
    }

    // Attach user information to request
    req.user = user;
    next();
  } catch (error) {
    console.error('[Auth-Middleware] Verification Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server authentication error.' });
  }
};

/**
 * Require specific user roles to access endpoint
 * @param {string[]} roles - Allowed role names e.g. ['ADMIN', 'USER']
 */
export const requireRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const hasRole = roles.includes(req.user.role.name);
    if (!hasRole) {
      return res.status(403).json({ success: false, message: 'Forbidden. Insufficient permissions.' });
    }

    next();
  };
};
