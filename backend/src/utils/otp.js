/**
 * Generates a random 6-digit numeric OTP code
 * @returns {string}
 */
export const generateOTP = () => {
  if (process.env.NODE_ENV === 'development' || process.env.SMS_PROVIDER === 'mock') {
    // For mock testing ease, return a predictable test pattern or standard random
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
};
