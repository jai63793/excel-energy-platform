import { Router } from 'express';
import { 
  requestOTP, 
  requestSignupOTP,
  registerUser, 
  loginWithOTP, 
  adminLogin, 
  refreshUserToken, 
  changePassword, 
  updateProfile, 
  logoutUser,
  registerWithPassword,
  loginWithPassword,
  googleAuth,
  loginWithFirebase,
  registerWithFirebase,
  forgotPasswordRequest,
  forgotPasswordReset,
  testToggleSubscription,
  getGoogleMockUsers
} from '../controllers/auth.controller.js';
import { authenticateJWT } from '../middleware/auth.js';
import { otpRateLimiter, loginRateLimiter } from '../middleware/rateLimit.js';
import { 
  validateRegister, 
  validateOTPRequest, 
  validateOTPVerify, 
  validateAdminLogin,
  validatePasswordRegister,
  validatePasswordLogin,
  validateGoogleAuth,
  validateFirebaseLogin,
  validateFirebaseRegister,
  validateForgotPasswordRequest,
  validateForgotPasswordReset
} from '../middleware/validation.js';

const router = Router();

// Public OTP flow
router.post('/request-otp', otpRateLimiter, validateOTPRequest, requestOTP);
router.post('/request-signup-otp', otpRateLimiter, validateOTPRequest, requestSignupOTP);
router.post('/register', validateRegister, registerUser);
router.post('/login-otp', loginRateLimiter, validateOTPVerify, loginWithOTP);

// Public Traditional Credentials flow
router.post('/register-password', validatePasswordRegister, registerWithPassword);
router.post('/login-password', loginRateLimiter, validatePasswordLogin, loginWithPassword);
router.post('/google', loginRateLimiter, validateGoogleAuth, googleAuth);
router.get('/google-users', getGoogleMockUsers);
router.post('/forgot-password-request', otpRateLimiter, validateForgotPasswordRequest, forgotPasswordRequest);
router.post('/forgot-password-reset', loginRateLimiter, validateForgotPasswordReset, forgotPasswordReset);

// Firebase OTP flow
router.post('/firebase-login', loginRateLimiter, validateFirebaseLogin, loginWithFirebase);
router.post('/firebase-register', validateFirebaseRegister, registerWithFirebase);

// Admin Credentials login
router.post('/admin-login', loginRateLimiter, validateAdminLogin, adminLogin);

// Token Refresh
router.post('/refresh', refreshUserToken);

// Protected routes (User dashboard updates)
router.get('/me', authenticateJWT, (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});
router.put('/profile', authenticateJWT, updateProfile);
router.put('/change-password', authenticateJWT, changePassword);
router.put('/test-toggle-subscription', authenticateJWT, testToggleSubscription);
router.post('/logout', authenticateJWT, logoutUser);

export default router;
