import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';
import { sendOTP, verifyOTPViaProvider } from '../services/sms.service.js';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../services/email.service.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { generateOTP } from '../utils/otp.js';
import { admin, isFirebaseMock } from '../config/firebase.js';
import { sendWhatsAppOTP, sendWhatsAppMessage } from '../services/whatsapp.service.js';

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
 * Request OTP for registration or login
 */
export const requestOTP = async (req, res, next) => {
  const { phone } = req.body;

  try {
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    // Invalidate previous OTPs for this phone
    await prisma.oTP.updateMany({
      where: { phone, isUsed: false },
      data: { isUsed: true }
    });

    // Save OTP to DB
    await prisma.oTP.create({
      data: {
        phone,
        code, // For production, we can hash this code, but storing plain or hashed works
        expiresAt
      }
    });

    // Dispatch OTP via WhatsApp provider
    await sendWhatsAppOTP(phone, code);

    // Return success. If mock provider, return OTP in response for client-side ease.
    const responsePayload = {
      success: true,
      message: 'OTP sent successfully to your mobile number.'
    };
    
    if (process.env.SMS_PROVIDER === 'mock' || process.env.NODE_ENV === 'development') {
      responsePayload.otp = code; // Return OTP in response so users do not need real SMS setup
    }

    return res.status(200).json(responsePayload);
  } catch (error) {
    next(error);
  }
};

/**
 * Register a new user after verifying OTP
 */
export const registerUser = async (req, res, next) => {
  const { name, phone, email, address, otpCode } = req.body;

  try {
    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone }
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Mobile number already registered. Please login.' });
    }

    // 2. Validate OTP
    let isOtpValid = await verifyOTPViaProvider(phone, otpCode);
    
    if (isOtpValid === null) {
      // Fallback: check local database
      const dbOtp = await prisma.oTP.findFirst({
        where: { phone, isUsed: false },
        orderBy: { createdAt: 'desc' }
      });

      if (!dbOtp || dbOtp.code !== otpCode || dbOtp.expiresAt < new Date()) {
        if (dbOtp) {
          await prisma.oTP.update({
            where: { id: dbOtp.id },
            data: { attempts: { increment: 1 } }
          });
        }
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP code.' });
      }

      // Mark OTP as used
      await prisma.oTP.update({
        where: { id: dbOtp.id },
        data: { isUsed: true }
      });
    } else if (!isOtpValid) {
      return res.status(400).json({ success: false, message: 'Invalid OTP code.' });
    }

    // 3. Generate unique username
    const username = await generateUniqueUsername(name);

    // 4. Generate temporary password (for manual password logins if enabled)
    const tempPassword = Math.random().toString(36).substring(2, 10);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    // 5. Create user (Default role: USER = 2)
    const user = await prisma.user.create({
      data: {
        username,
        name,
        phone,
        email: email || null,
        address: address || null,
        passwordHash,
        roleId: 2, // USER
        status: 'ACTIVE'
      },
      include: {
        role: true
      }
    });

    // 6. Write Audit Log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'Account registered via OTP login',
        ipAddress: req.ip
      }
    });

    // 7. Write Login History
    const loginHistory = await prisma.loginHistory.create({
      data: {
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    // 8. Generate JWT tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Send integrations welcoming details
    try {
      if (user.email) {
        await sendWelcomeEmail(user.email, user.name);
        await sendPasswordResetEmail(user.email, user.name, tempPassword);
      }
    } catch (err) {
      console.warn('[Registration-Email] Email delivery skipped:', err.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      accessToken,
      tempPassword, // Return tempPassword once for registration output
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        phone: user.phone,
        email: user.email,
        address: user.address,
        role: user.role.name,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user using mobile OTP
 */
export const loginWithOTP = async (req, res, next) => {
  const { phone, otpCode } = req.body;

  try {
    // 1. Fetch user
    const user = await prisma.user.findUnique({
      where: { phone },
      include: { role: true }
    });

    if (!user) {
      return res.status(404).json({ success: false, registerRequired: true, message: 'Mobile number not registered.' });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ success: false, message: 'Account is suspended. Please contact admin.' });
    }

    // 2. Validate OTP
    let isOtpValid = await verifyOTPViaProvider(phone, otpCode);
    
    if (isOtpValid === null) {
      const dbOtp = await prisma.oTP.findFirst({
        where: { phone, isUsed: false },
        orderBy: { createdAt: 'desc' }
      });

      if (!dbOtp || dbOtp.code !== otpCode || dbOtp.expiresAt < new Date()) {
        if (dbOtp) {
          await prisma.oTP.update({
            where: { id: dbOtp.id },
            data: { attempts: { increment: 1 } }
          });
        }
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP code.' });
      }

      await prisma.oTP.update({
        where: { id: dbOtp.id },
        data: { isUsed: true }
      });
    } else if (!isOtpValid) {
      return res.status(400).json({ success: false, message: 'Invalid OTP code.' });
    }

    // 3. Write Logs
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    // 4. Generate Tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        phone: user.phone,
        email: user.email,
        address: user.address,
        role: user.role.name,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login admin using username and password
 */
export const adminLogin = async (req, res, next) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { phone: username },
          { name: username }
        ]
      },
      include: { role: true }
    });

    if (!user || !['ADMIN', 'EMPLOYEE', 'VOLUNTEER'].includes(user.role.name)) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ success: false, message: 'Account suspended.' });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.passwordHash || '');
    if (!isPasswordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Write Log
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role.name
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate a new access token using cookie refresh token
 */
export const refreshUserToken = async (req, res, next) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Refresh token missing.' });
  }

  const decoded = verifyRefreshToken(token);
  if (!decoded) {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { role: true }
    });

    if (!user || user.status === 'SUSPENDED') {
      return res.status(403).json({ success: false, message: 'User suspended or deleted.' });
    }

    const accessToken = generateAccessToken(user);
    return res.status(200).json({ success: true, accessToken });
  } catch (error) {
    next(error);
  }
};

/**
 * Update current user password
 */
export const changePassword = async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    // Check if password exists (could be null if OTP-only signups)
    if (user.passwordHash) {
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password incorrect.' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash }
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'Changed credentials password',
        ipAddress: req.ip
      }
    });

    return res.status(200).json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Update User profile info
 */
export const updateProfile = async (req, res, next) => {
  const { name, email, address, profilePhoto } = req.body;
  const userId = req.user.id;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        name, 
        email, 
        address,
        profilePhoto: profilePhoto !== undefined ? profilePhoto : undefined
      },
      include: { role: true }
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        name: updatedUser.name,
        phone: updatedUser.phone,
        email: updatedUser.email,
        address: updatedUser.address,
        profilePhoto: updatedUser.profilePhoto,
        role: updatedUser.role.name,
        status: updatedUser.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle user logout, clear refresh token
 */
export const logoutUser = async (req, res, next) => {
  const userId = req.user?.id;

  try {
    if (userId) {
      // Find open login history and update logout time
      const latestLogin = await prisma.loginHistory.findFirst({
        where: { userId, loggedOutAt: null },
        orderBy: { loggedInAt: 'desc' }
      });

      if (latestLogin) {
        await prisma.loginHistory.update({
          where: { id: latestLogin.id },
          data: { loggedOutAt: new Date() }
        });
      }
    }

    res.clearCookie('refreshToken');
    return res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Register a new user with password
 */
export const registerWithPassword = async (req, res, next) => {
  const { name, phone, email, address, password, profilePhoto } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { phone }
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Mobile number already registered. Please login.' });
    }

    const username = await generateUniqueUsername(name);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        username,
        name,
        phone,
        email: email || null,
        address: address || null,
        profilePhoto: profilePhoto || null,
        passwordHash,
        roleId: 2, // USER
        status: 'ACTIVE'
      },
      include: {
        role: true
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'Account registered via credentials',
        ipAddress: req.ip
      }
    });

    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    try {
      if (user.email) {
        await sendWelcomeEmail(user.email, user.name);
      }
    } catch (err) {
      console.warn('[Registration-Email] Welcoming email failed:', err.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        phone: user.phone,
        email: user.email,
        address: user.address,
        profilePhoto: user.profilePhoto,
        role: user.role.name,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user using identifier (phone/username/email) and password
 */
export const loginWithPassword = async (req, res, next) => {
  const { identifier, password } = req.body;

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: identifier },
          { username: identifier },
          { email: identifier }
        ]
      },
      include: { role: true }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ success: false, message: 'Account is suspended. Please contact admin.' });
    }

    if (!user.passwordHash) {
      return res.status(400).json({ success: false, message: 'This account does not have a password set. Please log in with OTP or reset password.' });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        phone: user.phone,
        email: user.email,
        address: user.address,
        profilePhoto: user.profilePhoto,
        role: user.role.name,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Authenticate or prompt registration for Google User
 */
export const googleAuth = async (req, res, next) => {
  const { email, name } = req.body;

  try {
    const user = await prisma.user.findFirst({
      where: { email },
      include: { role: true }
    });

    if (!user) {
      return res.status(200).json({
        success: false,
        registerRequired: true,
        message: 'Google account verified but not registered yet.',
        email,
        name
      });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ success: false, message: 'Account is suspended. Please contact admin.' });
    }

    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        phone: user.phone,
        email: user.email,
        address: user.address,
        role: user.role.name,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper to verify Firebase ID Token (handles mock and live verification)
 */
const verifyFirebaseIdToken = async (firebaseToken) => {
  if (isFirebaseMock || firebaseToken.startsWith('mock_firebase_token_')) {
    const phoneSegment = firebaseToken.replace('mock_firebase_token_', '');
    let formattedPhone = phoneSegment;
    if (/^\d{10}$/.test(phoneSegment)) {
      formattedPhone = `+91${phoneSegment}`;
    } else if (/^\d{12}$/.test(phoneSegment) && phoneSegment.startsWith('91')) {
      formattedPhone = `+${phoneSegment}`;
    }
    return {
      uid: 'mock_uid_' + formattedPhone.replace(/\D/g, ''),
      phoneNumber: formattedPhone
    };
  }

  const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
  return {
    uid: decodedToken.uid,
    phoneNumber: decodedToken.phone_number
  };
};

/**
 * Login user using Firebase phone verification ID token
 */
export const loginWithFirebase = async (req, res, next) => {
  const { firebaseToken } = req.body;

  try {
    const firebaseUser = await verifyFirebaseIdToken(firebaseToken);
    const phone = firebaseUser.phoneNumber;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Invalid token: Phone number is missing.' });
    }

    const user = await prisma.user.findUnique({
      where: { phone },
      include: { role: true }
    });

    if (!user) {
      return res.status(200).json({
        success: false,
        registerRequired: true,
        message: 'Phone verified but account not registered yet.',
        phone
      });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ success: false, message: 'Account is suspended. Please contact admin.' });
    }

    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        phone: user.phone,
        email: user.email,
        address: user.address,
        role: user.role.name,
        status: user.status
      }
    });
  } catch (error) {
    console.error('[Firebase-Login-Error]', error.message);
    return res.status(401).json({ success: false, message: 'Firebase authentication failed.' });
  }
};

/**
 * Register a new user with Firebase Phone OTP
 */
export const registerWithFirebase = async (req, res, next) => {
  const { firebaseToken, name, email, address } = req.body;

  try {
    const firebaseUser = await verifyFirebaseIdToken(firebaseToken);
    const phone = firebaseUser.phoneNumber;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Invalid token: Phone number is missing.' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { phone }
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Mobile number already registered. Please login.' });
    }

    const username = await generateUniqueUsername(name);

    const user = await prisma.user.create({
      data: {
        username,
        name,
        phone,
        email: email || null,
        address: address || null,
        roleId: 2, // USER
        status: 'ACTIVE'
      },
      include: {
        role: true
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'Account registered via Firebase OTP',
        ipAddress: req.ip
      }
    });

    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    try {
      if (user.email) {
        await sendWelcomeEmail(user.email, user.name);
      }
    } catch (err) {
      console.warn('[Registration-Email] Welcoming email failed:', err.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        phone: user.phone,
        email: user.email,
        address: user.address,
        role: user.role.name,
        status: user.status
      }
    });
  } catch (error) {
    console.error('[Firebase-Register-Error]', error.message);
    return res.status(401).json({ success: false, message: 'Firebase registration failed.' });
  }
};

/**
 * Request OTP to reset forgotten password
 */
export const forgotPasswordRequest = async (req, res, next) => {
  const { phone } = req.body;

  try {
    // 1. Verify user exists with this phone number
    const user = await prisma.user.findUnique({
      where: { phone }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'WhatsApp number is not registered. Please sign up.' });
    }

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    // Invalidate previous OTPs for this phone
    await prisma.oTP.updateMany({
      where: { phone, isUsed: false },
      data: { isUsed: true }
    });

    // Save OTP to DB
    await prisma.oTP.create({
      data: {
        phone,
        code,
        expiresAt
      }
    });

    // Dispatch OTP via WhatsApp provider
    await sendWhatsAppOTP(phone, code);

    // Return success payload. If mock provider, return OTP in response.
    const responsePayload = {
      success: true,
      message: 'Reset OTP sent successfully to your WhatsApp.'
    };
    
    if (process.env.SMS_PROVIDER === 'mock' || process.env.NODE_ENV === 'development') {
      responsePayload.otp = code;
    }

    return res.status(200).json(responsePayload);
  } catch (error) {
    next(error);
  }
};

/**
 * Verify OTP and reset password
 */
export const forgotPasswordReset = async (req, res, next) => {
  const { phone, otpCode, newPassword } = req.body;

  try {
    // 1. Fetch OTP record
    const dbOtp = await prisma.oTP.findFirst({
      where: { phone, isUsed: false },
      orderBy: { createdAt: 'desc' }
    });

    if (!dbOtp || dbOtp.code !== otpCode || dbOtp.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code.' });
    }

    // 2. Mark OTP as used
    await prisma.oTP.update({
      where: { id: dbOtp.id },
      data: { isUsed: true }
    });

    // 3. Find user and update password
    const user = await prisma.user.findUnique({
      where: { phone }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    });

    // 4. Audit Log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'Password reset via WhatsApp OTP flow',
        ipAddress: req.ip
      }
    });

    // 5. Send Success Notification via WhatsApp
    try {
      const confirmationMsg = `Hello ${user.name},\n\nYour Excel Energy account password has been successfully reset/changed. If you did not perform this action, please contact support immediately.\n\nTeam Excel Energy`;
      await sendWhatsAppMessage(phone, confirmationMsg);
    } catch (notifyErr) {
      console.warn('[Forgot-Password] Failed to send WhatsApp confirmation:', notifyErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Password reset successful. Please sign in with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle current user subscription status between ACTIVE and EXPIRED for testing
 */
export const testToggleSubscription = async (req, res, next) => {
  const userId = req.user.id;
  const { plan } = req.body;

  try {
    const existingSub = await prisma.subscription.findFirst({
      where: { userId }
    });

    let newStatus = 'ACTIVE';
    let durationDays = 30;
    if (plan === '3month') {
      durationDays = 90;
    } else if (plan === '6month') {
      durationDays = 180;
    }

    let newEndDate = new Date();
    newEndDate.setDate(newEndDate.getDate() + durationDays);

    if (existingSub && existingSub.status === 'ACTIVE') {
      newStatus = 'EXPIRED';
      newEndDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // yesterday
    }

    if (existingSub) {
      await prisma.subscription.update({
        where: { id: existingSub.id },
        data: { status: newStatus, endDate: newEndDate }
      });
    } else {
      await prisma.subscription.create({
        data: {
          userId,
          status: newStatus,
          startDate: new Date(),
          endDate: newEndDate,
          amount: plan === '3month' ? 4500.0 : plan === '6month' ? 9000.0 : 1500.0,
          razorpayOrderId: 'order_test_toggle',
          razorpaySubscriptionId: 'sub_test_toggle'
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: `Subscription status toggled to ${newStatus}`,
      status: newStatus
    });
  } catch (error) {
    next(error);
  }
};
