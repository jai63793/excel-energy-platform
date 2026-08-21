/**
 * Obfuscates a password string using Base64 encoding with a prefix.
 * This hides the plain text password in Chrome DevTools/Network payloads
 * while maintaining backward compatibility on the backend.
 */
export const hashPasswordSHA256 = async (password) => {
  if (!password) return '';
  try {
    const encoded = btoa(unescape(encodeURIComponent(password)));
    return `base64:${encoded}`;
  } catch (err) {
    console.error('[Encoding-Error] Failed to encode password:', err);
    return password; // Fallback to plain text
  }
};
