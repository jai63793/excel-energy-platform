import jwt from 'jsonwebtoken';

const accessSecret = process.env.JWT_SECRET || 'supersecretjwtkey12345!@#';
const refreshSecret = process.env.JWT_REFRESH_SECRET || 'supersecretrefreshjwtkey98765!@#';

/**
 * Generate a short-lived access token
 */
export const generateAccessToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      phone: user.phone, 
      role: user.role.name 
    },
    accessSecret,
    { expiresIn: '15m' } // 15 minutes validity
  );
};

/**
 * Generate a long-lived refresh token
 */
export const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    refreshSecret,
    { expiresIn: '7d' } // 7 days validity
  );
};

/**
 * Verify access token and decode payload
 */
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, accessSecret);
  } catch (error) {
    return null;
  }
};

/**
 * Verify refresh token and decode payload
 */
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, refreshSecret);
  } catch (error) {
    return null;
  }
};
