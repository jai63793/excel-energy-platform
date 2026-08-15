import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  loginWithOTPAction, 
  registerWithPasswordAction,
  loginWithPasswordAction,
  loginWithFirebaseAction,
  registerWithFirebaseAction
} from '../store/authSlice';
import api from '../services/api';
import { initRecaptcha, sendOTPWithFirebase } from '../services/firebase';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading } = useSelector((state) => state.auth);

  // Auth Modes & Steps
  const [isSignup, setIsSignup] = useState(false);
  const [loginType, setLoginType] = useState('password'); // 'otp' | 'forgot' | 'firebase'
  const [step, setStep] = useState('phone-input'); // 'phone-input' | 'otp-verify' | 'forgot-phone' | 'forgot-otp' | 'forgot-new-password'

  // Firebase Phone Auth States
  const [firebaseConfirmResult, setFirebaseConfirmResult] = useState(null);
  const [firebaseToken, setFirebaseToken] = useState('');
  const [isFirebaseRegisterPending, setIsFirebaseRegisterPending] = useState(false);
  const recaptchaVerifierRef = useRef(null);

  // Input states
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [otpCode, setOtpCode] = useState('');

  // Forgot password input states
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loadingReset, setLoadingReset] = useState(false);
  const [loadingPasswordReset, setLoadingPasswordReset] = useState(false);

  // 5 Minute Timer for OTP (300 seconds)
  const [timer, setTimer] = useState(300);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef(null);



  const from = location.state?.from?.pathname || '/dashboard';
  const fromSearch = location.state?.from?.search || '';



  // Countdown timer logic
  useEffect(() => {
    if (timerActive && timer > 0) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setTimerActive(false);
      clearInterval(timerRef.current);
      toast.error('OTP has expired. Please request a new one.');
      if (loginType === 'forgot') {
        setStep('forgot-phone');
      } else {
        setStep('phone-input');
      }
    }

    return () => clearInterval(timerRef.current);
  }, [timerActive, timer, loginType]);

  // Handle Photo base64 upload
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 1. WhatsApp OTP Request (For OTP Login)
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number.');
      return;
    }

    let formattedPhone = phone;
    if (!phone.startsWith('+')) {
      formattedPhone = phone.length === 10 ? `+91${phone}` : phone;
    }

    try {
      toast.loading('Sending OTP...');
      const res = await api.post('/auth/request-otp', { phone: formattedPhone });
      toast.dismiss();

      if (res.data?.success) {
        setPhone(formattedPhone);
        setStep('otp-verify');
        setTimer(300); // 5 minutes
        setTimerActive(true);
        toast.success('OTP sent successfully to your mobile phone!');
      }
    } catch (err) {
      toast.dismiss();
      toast.error(err.response?.data?.message || 'Failed to send OTP.');
    }
  };

  // 2. Verify WhatsApp OTP (For OTP Login)
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      toast.error('Please enter a 6-digit OTP code.');
      return;
    }

    toast.loading('Verifying code...');
    const result = await dispatch(loginWithOTPAction(phone, otpCode));
    toast.dismiss();

    if (result.success) {
      setTimerActive(false);
      clearInterval(timerRef.current);
      toast.success('Welcome back!');
      navigate(from + fromSearch, { replace: true });
    } else {
      toast.error(result.error || 'Login verification failed.');
    }
  };

  // 1b. Firebase Phone OTP Request
  const handleRequestFirebaseOTP = async (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number.');
      return;
    }

    let formattedPhone = phone;
    if (!phone.startsWith('+')) {
      formattedPhone = phone.length === 10 ? `+91${phone}` : phone;
    }

    try {
      toast.loading('Initializing verification...');
      
      // Initialize recaptcha if it hasn't been initialized
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = initRecaptcha('firebase-recaptcha-container');
      }

      const appVerifier = recaptchaVerifierRef.current;
      toast.dismiss();

      toast.loading('Sending OTP via Firebase...');
      const confirmationResult = await sendOTPWithFirebase(formattedPhone, appVerifier);
      toast.dismiss();

      setPhone(formattedPhone);
      setFirebaseConfirmResult(confirmationResult);
      setStep('otp-verify');
      setTimer(300); // 5 minutes
      setTimerActive(true);
      
      if (confirmationResult.isMock) {
        toast.success(`Mock OTP initialized. Code is ${confirmationResult.otp} (or 123456)`);
      } else {
        toast.success('OTP sent successfully to your mobile phone!');
      }
    } catch (err) {
      toast.dismiss();
      console.error('[Firebase-Send-Error]', err);
      toast.error(err.message || 'Failed to send Firebase OTP. Please retry.');
      if (recaptchaVerifierRef.current && recaptchaVerifierRef.current.clear) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (_) {}
        recaptchaVerifierRef.current = null;
      }
    }
  };

  // 2b. Verify Firebase Phone OTP & Login or Prompt Registration
  const handleVerifyFirebaseOTP = async (e) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      toast.error('Please enter a 6-digit OTP code.');
      return;
    }

    if (!firebaseConfirmResult) {
      toast.error('No verification active. Please request a new OTP.');
      setStep('phone-input');
      return;
    }

    toast.loading('Verifying OTP code...');
    try {
      const userCredential = await firebaseConfirmResult.confirm(otpCode);
      const token = await userCredential.user.getIdToken();
      setFirebaseToken(token);
      toast.dismiss();

      toast.loading('Checking registration status...');
      const result = await dispatch(loginWithFirebaseAction(token));
      toast.dismiss();

      if (result.success) {
        setTimerActive(false);
        clearInterval(timerRef.current);
        toast.success('Welcome back!');
        navigate(from + fromSearch, { replace: true });
      } else if (result.registerRequired) {
        setTimerActive(false);
        clearInterval(timerRef.current);
        // Show complete registration form
        setIsFirebaseRegisterPending(true);
        toast.success('OTP verified! Please complete your profile registration.');
      } else {
        toast.error(result.error || 'Authentication check failed.');
      }
    } catch (err) {
      toast.dismiss();
      console.error('[Firebase-Verify-Error]', err);
      toast.error(err.message || 'Invalid verification code. Please try again.');
    }
  };

  // 2c. Complete Firebase Registration Flow
  const handleFirebaseRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!name) {
      toast.error('Name is required to register.');
      return;
    }

    if (!firebaseToken) {
      toast.error('Session expired. Please start over.');
      setIsFirebaseRegisterPending(false);
      setStep('phone-input');
      return;
    }

    toast.loading('Creating your account...');
    const result = await dispatch(registerWithFirebaseAction({
      firebaseToken,
      name,
      email: email || undefined,
      address: address || undefined
    }));
    toast.dismiss();

    if (result.success) {
      setIsFirebaseRegisterPending(false);
      toast.success('Account registered successfully!');
      navigate(from + fromSearch, { replace: true });
    } else {
      toast.error(result.error || 'Registration failed.');
    }
  };

  // 3. Username/Password Sign In
  const handlePasswordLoginSubmit = async (e) => {
    e.preventDefault();
    if (!phone || !password) {
      toast.error('Both WhatsApp number and password are required.');
      return;
    }

    let formattedPhone = phone;
    if (!phone.startsWith('+')) {
      formattedPhone = phone.length === 10 ? `+91${phone}` : phone;
    }

    toast.loading('Logging in...');
    const result = await dispatch(loginWithPasswordAction(formattedPhone, password));
    toast.dismiss();

    if (result.success) {
      toast.success('Welcome back!');
      navigate(from + fromSearch, { replace: true });
    } else {
      toast.error(result.error || 'Login failed. Please check credentials.');
    }
  };

  // 4. Create Account / Register
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!name || !phone || !password) {
      toast.error('Name, WhatsApp number and password are required.');
      return;
    }

    let formattedPhone = phone;
    if (!phone.startsWith('+')) {
      formattedPhone = phone.length === 10 ? `+91${phone}` : phone;
    }

    toast.loading('Creating account...');
    const result = await dispatch(registerWithPasswordAction({
      name,
      phone: formattedPhone,
      email: email || undefined,
      address: address || undefined,
      password,
      profilePhoto: profilePhoto || undefined
    }));
    toast.dismiss();

    if (result.success) {
      toast.success('Account registered successfully!');
      navigate(from + fromSearch, { replace: true });
    } else {
      toast.error(result.error || 'Registration failed.');
    }
  };

  // 5. Forgot Password: Request OTP
  const handleForgotPhoneSubmit = async (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      toast.error('Please enter a valid 10-digit WhatsApp number.');
      return;
    }

    let formattedPhone = phone;
    if (!phone.startsWith('+')) {
      formattedPhone = phone.length === 10 ? `+91${phone}` : phone;
    }

    setLoadingReset(true);
    try {
      const res = await api.post('/auth/forgot-password-request', { phone: formattedPhone });
      if (res.data?.success) {
        setPhone(formattedPhone);
        setStep('forgot-otp');
        setOtpCode('');
        setTimer(300); // 5 minutes
        setTimerActive(true);
        toast.success('Password Reset OTP sent to your mobile phone!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request password reset OTP.');
    } finally {
      setLoadingReset(false);
    }
  };

  // 6. Forgot Password: Verify OTP step (Moves to password screen)
  const handleForgotVerifySubmit = (e) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      toast.error('Please enter a 6-digit OTP code.');
      return;
    }
    // Success locally, proceed to collect new password
    setStep('forgot-new-password');
    setTimerActive(false);
    clearInterval(timerRef.current);
  };

  // 7. Forgot Password: Submit New Password
  const handleForgotNewPasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoadingPasswordReset(true);
    try {
      const res = await api.post('/auth/forgot-password-reset', {
        phone,
        otpCode,
        newPassword
      });
      if (res.data?.success) {
        toast.success('Password changed successfully! You can now log in.');
        
        // Return to standard login
        setLoginType('password');
        setStep('phone-input');
        setPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoadingPasswordReset(false);
    }
  };

  // Google Login selector trigger
  const handleGoogleSelect = async (name, email) => {
    setShowGoogleModal(false);
    toast.loading('Authenticating Google account...');
    
    const result = await dispatch(loginWithGoogleAction({ name, email }));
    toast.dismiss();

    if (result.success) {
      toast.success('Google login successful!');
      navigate(from + fromSearch, { replace: true });
    } else {
      toast.error(result.error || 'Google login failed.');
    }
  };

  // Format timer text
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary-medium) 100%)',
      padding: '40px 20px',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'var(--font-body)'
    }}>
      <style>{`
        @media (max-width: 768px) {
          .login-split-panel {
            flex-direction: column !important;
            min-height: auto !important;
            max-width: 460px !important;
          }
          .branding-logo-panel {
            display: none !important;
          }
          .login-form-panel {
            padding: 30px 20px 40px 20px !important;
          }
          .login-brand-header {
            margin-bottom: 10px !important;
          }
          .login-brand-header img {
            width: 120px !important;
            height: 120px !important;
          }
        }
      `}</style>
      {/* Background Decorator Accents */}
      <div style={{
        position: 'absolute',
        width: '350px',
        height: '350px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 70%)',
        opacity: 0.15,
        top: '-10%',
        right: '-10%',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        width: '350px',
        height: '350px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 70%)',
        opacity: 0.12,
        bottom: '-10%',
        left: '-10%',
        zIndex: 0
      }} />

      {/* TOP SECTION: BRAND LOGO */}
      <div className="login-brand-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px', zIndex: 1 }}>
        <img 
          src={new URL('../assets/images/logo.png', import.meta.url).href} 
          alt="Brand Logo" 
          style={{ width: '180px', height: '180px', objectFit: 'contain', display: 'block', margin: '0 auto' }}
        />
        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#fff', marginTop: '10px', fontSize: '1.9rem', fontWeight: '500', letterSpacing: '0.5px' }}>
          Excel Energy
        </h2>
      </div>

      {/* MAIN LAYOUT SPLIT PANEL */}
      <div className="login-split-panel" style={{
        display: 'flex',
        flexDirection: isSignup ? 'row' : 'row-reverse', // Left Form/Right Logo on Sign Up; Left Logo/Right Form on Login
        width: '100%',
        maxWidth: '900px',
        minHeight: '620px',
        background: 'rgba(255, 255, 255, 0.07)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
        color: '#fff'
      }}>
        
        {/* COLUMN 1: FORM INTERFACE PANEL */}
        <div className="login-form-panel" style={{
          flex: 1,
          padding: '30px 40px 40px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: 'rgba(10, 40, 32, 0.4)'
        }}>
          {/* Back and Home navigation buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '24px',
            width: '100%'
          }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                padding: '6px 14px',
                fontSize: '0.8rem',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                padding: '6px 14px',
                fontSize: '0.8rem',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              🏠 Home
            </button>
          </div>
          {isSignup ? (
            /* ================= CREATE ACCOUNT FORM ================= */
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: '600', marginBottom: '8px', color: 'var(--color-bg-sand)' }}>
                Create Account
              </h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem', marginBottom: '24px' }}>
                Join Excel Energy spiritual wellness community
              </p>

              <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Photo Upload Option */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '6px' }}>
                  <div style={{ position: 'relative' }}>
                    {profilePhoto ? (
                      <img 
                        src={profilePhoto} 
                        alt="Profile Preview" 
                        style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-accent)' }} 
                      />
                    ) : (
                      <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px dashed rgba(255, 255, 255, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.2rem',
                        color: 'rgba(255, 255, 255, 0.7)'
                      }}>
                        📷
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-bg-sand)' }}>Profile Picture</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handlePhotoChange} 
                      style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
                    />
                  </div>
                </div>

                <div style={{ textAlign: 'left' }}>
                  <label htmlFor="reg-name" style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: '5px' }}>Full Name *</label>
                  <input
                    id="reg-name"
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(0, 0, 0, 0.2)', color: '#fff', outline: 'none', fontSize: '0.92rem' }}
                  />
                </div>

                <div style={{ textAlign: 'left' }}>
                  <label htmlFor="reg-phone" style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: '5px' }}>WhatsApp Number *</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)', fontSize: '0.92rem', fontWeight: '600' }}>+91</span>
                    <input
                      id="reg-phone"
                      type="tel"
                      placeholder="10 digit WhatsApp number"
                      value={phone.replace(/^\+91/, '')}
                      onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                      maxLength={10}
                      required
                      style={{ width: '100%', padding: '12px 12px 12px 45px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(0, 0, 0, 0.2)', color: '#fff', outline: 'none', fontSize: '0.92rem' }}
                    />
                  </div>
                </div>

                <div style={{ textAlign: 'left' }}>
                  <label htmlFor="reg-email" style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: '5px' }}>Email Address (Optional)</label>
                  <input
                    id="reg-email"
                    type="email"
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(0, 0, 0, 0.2)', color: '#fff', outline: 'none', fontSize: '0.92rem' }}
                  />
                </div>

                <div style={{ textAlign: 'left' }}>
                  <label htmlFor="reg-password" style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: '5px' }}>Password *</label>
                  <input
                    id="reg-password"
                    type="password"
                    placeholder="Create security password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(0, 0, 0, 0.2)', color: '#fff', outline: 'none', fontSize: '0.92rem' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '6px',
                    background: 'var(--color-accent)',
                    color: '#fff',
                    fontWeight: '600',
                    fontSize: '1rem',
                    border: 'none',
                    cursor: 'pointer',
                    marginTop: '10px',
                    boxShadow: '0 4px 10px rgba(224, 112, 43, 0.25)'
                  }}
                >
                  {loading ? 'Registering...' : 'Sign Up Account'}
                </button>
              </form>

              <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Already have an account? </span>
                <button 
                  type="button" 
                  onClick={() => setIsSignup(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-accent)', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Sign In
                </button>
              </div>
            </div>
          ) : (
            /* ================= SIGN IN / LOGIN FORM ================= */
            <div>
              {loginType !== 'forgot' ? (
                <>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: '600', marginBottom: '8px', color: 'var(--color-bg-sand)' }}>
                    Welcome Back
                  </h3>
                  <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem', marginBottom: '24px' }}>
                    Sign in to manage your wellness journey
                  </p>

                    <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '20px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginType('password');
                        setStep('phone-input');
                        setIsFirebaseRegisterPending(false);
                      }}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: 'none',
                        border: 'none',
                        borderBottom: loginType === 'password' ? '2px solid var(--color-accent)' : 'none',
                        color: loginType === 'password' ? 'var(--color-bg-sand)' : 'rgba(255, 255, 255, 0.5)',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      Password
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginType('otp');
                        setStep('phone-input');
                        setIsFirebaseRegisterPending(false);
                      }}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: 'none',
                        border: 'none',
                        borderBottom: loginType === 'otp' ? '2px solid var(--color-accent)' : 'none',
                        color: loginType === 'otp' ? 'var(--color-bg-sand)' : 'rgba(255, 255, 255, 0.5)',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      Mobile OTP
                    </button>
                  </div>

                  {isFirebaseRegisterPending ? (
                    <form onSubmit={handleFirebaseRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: '600', marginBottom: '4px', color: 'var(--color-bg-sand)' }}>
                        Complete Profile
                      </h3>
                      <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.85rem', marginBottom: '12px', lineHeight: '1.4' }}>
                        Your phone number <strong>{phone}</strong> is verified. Please complete your registration.
                      </p>

                      <div style={{ textAlign: 'left' }}>
                        <label htmlFor="firebase-reg-name" style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: '5px' }}>Full Name *</label>
                        <input
                          id="firebase-reg-name"
                          type="text"
                          placeholder="Enter your name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(0, 0, 0, 0.2)', color: '#fff', outline: 'none', fontSize: '0.92rem' }}
                        />
                      </div>

                      <div style={{ textAlign: 'left' }}>
                        <label htmlFor="firebase-reg-email" style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: '5px' }}>Email Address (Optional)</label>
                        <input
                          id="firebase-reg-email"
                          type="email"
                          placeholder="Enter email address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(0, 0, 0, 0.2)', color: '#fff', outline: 'none', fontSize: '0.92rem' }}
                        />
                      </div>

                      <div style={{ textAlign: 'left' }}>
                        <label htmlFor="firebase-reg-address" style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: '5px' }}>Address (Optional)</label>
                        <input
                          id="firebase-reg-address"
                          type="text"
                          placeholder="Enter address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(0, 0, 0, 0.2)', color: '#fff', outline: 'none', fontSize: '0.92rem' }}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        style={{
                          width: '100%',
                          padding: '14px',
                          borderRadius: '6px',
                          background: 'var(--color-accent)',
                          color: '#fff',
                          fontWeight: '600',
                          fontSize: '1rem',
                          border: 'none',
                          cursor: 'pointer',
                          marginTop: '10px',
                          boxShadow: '0 4px 10px rgba(224, 112, 43, 0.25)'
                        }}
                      >
                        {loading ? 'Registering...' : 'Complete & Register'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsFirebaseRegisterPending(false);
                          setStep('phone-input');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'rgba(255, 255, 255, 0.6)',
                          textDecoration: 'underline',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          textAlign: 'center',
                          marginTop: '5px',
                          display: 'block',
                          width: '100%'
                        }}
                      >
                        Cancel
                      </button>
                    </form>
                  ) : step === 'phone-input' ? (
                    loginType === 'otp' ? (
                      <form onSubmit={handleRequestOTP} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ textAlign: 'left' }}>
                          <label htmlFor="otp-phone" style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: '5px' }}>WhatsApp Number</label>
                          <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)', fontSize: '0.92rem', fontWeight: '600' }}>+91</span>
                            <input
                              id="otp-phone"
                              type="tel"
                              placeholder="10 digit WhatsApp number"
                              value={phone.replace(/^\+91/, '')}
                              onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                              maxLength={10}
                              required
                              style={{ width: '100%', padding: '12px 12px 12px 45px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(0, 0, 0, 0.2)', color: '#fff', outline: 'none', fontSize: '0.92rem' }}
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          style={{
                            width: '100%',
                            padding: '14px',
                            borderRadius: '6px',
                            background: 'var(--color-accent)',
                            color: '#fff',
                            fontWeight: '600',
                            fontSize: '1rem',
                            border: 'none',
                            cursor: 'pointer',
                            marginTop: '10px',
                            boxShadow: '0 4px 10px rgba(224, 112, 43, 0.25)'
                          }}
                        >
                          {loading ? 'Requesting...' : 'Send OTP via WhatsApp'}
                        </button>

                        {/* Forgot Password Trigger */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setLoginType('forgot');
                              setStep('forgot-phone');
                              setTimerActive(false);
                              clearInterval(timerRef.current);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--color-accent)',
                              fontWeight: '600',
                              fontSize: '0.82rem',
                              cursor: 'pointer',
                              textDecoration: 'underline',
                              padding: 0
                            }}
                          >
                            Forgot Password?
                          </button>
                        </div>
                      </form>
                    ) : loginType === 'firebase' ? (
                      <form onSubmit={handleRequestFirebaseOTP} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ textAlign: 'left' }}>
                          <label htmlFor="firebase-phone" style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: '5px' }}>Mobile Number</label>
                          <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)', fontSize: '0.92rem', fontWeight: '600' }}>+91</span>
                            <input
                              id="firebase-phone"
                              type="tel"
                              placeholder="10 digit mobile number"
                              value={phone.replace(/^\+91/, '')}
                              onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                              maxLength={10}
                              required
                              style={{ width: '100%', padding: '12px 12px 12px 45px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(0, 0, 0, 0.2)', color: '#fff', outline: 'none', fontSize: '0.92rem' }}
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          style={{
                            width: '100%',
                            padding: '14px',
                            borderRadius: '6px',
                            background: 'var(--color-accent)',
                            color: '#fff',
                            fontWeight: '600',
                            fontSize: '1rem',
                            border: 'none',
                            cursor: 'pointer',
                            marginTop: '10px',
                            boxShadow: '0 4px 10px rgba(224, 112, 43, 0.25)'
                          }}
                        >
                          {loading ? 'Requesting...' : 'Send OTP via Firebase'}
                        </button>
                        
                        <div id="firebase-recaptcha-container" style={{ marginTop: '10px' }}></div>
                      </form>
                    ) : (
                      <form onSubmit={handlePasswordLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ textAlign: 'left' }}>
                          <label htmlFor="pass-phone" style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: '5px' }}>WhatsApp Number</label>
                          <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)', fontSize: '0.92rem', fontWeight: '600' }}>+91</span>
                            <input
                              id="pass-phone"
                              type="tel"
                              placeholder="10 digit WhatsApp number"
                              value={phone.replace(/^\+91/, '')}
                              onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                              maxLength={10}
                              required
                              style={{ width: '100%', padding: '12px 12px 12px 45px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(0, 0, 0, 0.2)', color: '#fff', outline: 'none', fontSize: '0.92rem' }}
                            />
                          </div>
                        </div>

                        <div style={{ textAlign: 'left' }}>
                          <label htmlFor="pass-password" style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: '5px' }}>Password</label>
                          <input
                            id="pass-password"
                            type="password"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(0, 0, 0, 0.2)', color: '#fff', outline: 'none', fontSize: '0.92rem' }}
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          style={{
                            width: '100%',
                            padding: '14px',
                            borderRadius: '6px',
                            background: 'var(--color-accent)',
                            color: '#fff',
                            fontWeight: '600',
                            fontSize: '1rem',
                            border: 'none',
                            cursor: 'pointer',
                            marginTop: '10px',
                            boxShadow: '0 4px 10px rgba(224, 112, 43, 0.25)'
                          }}
                        >
                          {loading ? 'Logging in...' : 'Sign In with Password'}
                        </button>

                        {/* Forgot Password Trigger */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setLoginType('forgot');
                              setStep('forgot-phone');
                              setTimerActive(false);
                              clearInterval(timerRef.current);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--color-accent)',
                              fontWeight: '600',
                              fontSize: '0.82rem',
                              cursor: 'pointer',
                              textDecoration: 'underline',
                              padding: 0
                            }}
                          >
                            Forgot Password?
                          </button>
                        </div>
                      </form>
                    )
                  ) : (
                    <form onSubmit={loginType === 'firebase' ? handleVerifyFirebaseOTP : handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <label htmlFor="otp-verify" style={{ fontSize: '0.82rem', fontWeight: '600', color: 'rgba(255,255,255,0.8)' }}>Enter 6-Digit OTP</label>
                          <span style={{ fontSize: '0.82rem', color: 'var(--color-accent)', fontWeight: '700' }}>⏱ {formatTime(timer)}</span>
                        </div>
                        <input
                          id="otp-verify"
                          type="text"
                          placeholder="6 Digit Code"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                          disabled={loading}
                          required
                          style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            background: 'rgba(0, 0, 0, 0.2)',
                            color: '#fff',
                            fontSize: '1.2rem',
                            letterSpacing: '6px',
                            textAlign: 'center',
                            outline: 'none'
                          }}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        style={{
                          width: '100%',
                          padding: '14px',
                          borderRadius: '6px',
                          background: 'var(--color-accent)',
                          color: '#fff',
                          fontWeight: '600',
                          fontSize: '1rem',
                          border: 'none',
                          cursor: 'pointer',
                          boxShadow: '0 4px 10px rgba(224, 112, 43, 0.25)'
                        }}
                      >
                        {loading ? 'Verifying...' : 'Verify & Log In'}
                      </button>

                      <button
                        type="button"
                        onClick={() => { setStep('phone-input'); setTimerActive(false); clearInterval(timerRef.current); }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'rgba(255, 255, 255, 0.6)',
                          textDecoration: 'underline',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          textAlign: 'center',
                          marginTop: '5px'
                        }}
                      >
                        Request new OTP
                      </button>
                    </form>
                  )}

                  <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem' }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>Don't have an account? </span>
                    <button 
                      type="button" 
                      onClick={() => setIsSignup(true)}
                      style={{ background: 'none', border: 'none', color: 'var(--color-accent)', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Sign Up
                    </button>
                  </div>

                  {/* Social login removed for live production */}


                </>
              ) : (
                /* ================= FORGOT PASSWORD STEPS ================= */
                <div>
                  {step === 'forgot-phone' && (
                    <form onSubmit={handleForgotPhoneSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: '600', marginBottom: '4px', color: 'var(--color-bg-sand)' }}>
                        Forgot Password
                      </h3>
                      <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.85rem', marginBottom: '12px', lineHeight: '1.4' }}>
                        Enter your registered WhatsApp number. We will send a 6-digit OTP code to verify your account.
                      </p>

                      <div style={{ textAlign: 'left' }}>
                        <label htmlFor="forgot-phone" style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: '5px' }}>WhatsApp Number</label>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)', fontSize: '0.92rem', fontWeight: '600' }}>+91</span>
                          <input
                            id="forgot-phone"
                            type="tel"
                            placeholder="10 digit WhatsApp number"
                            value={phone.replace(/^\+91/, '')}
                            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                            maxLength={10}
                            required
                            style={{ width: '100%', padding: '12px 12px 12px 45px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(0, 0, 0, 0.2)', color: '#fff', outline: 'none', fontSize: '0.92rem' }}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loadingReset}
                        style={{
                          width: '100%',
                          padding: '14px',
                          borderRadius: '6px',
                          background: 'var(--color-accent)',
                          color: '#fff',
                          fontWeight: '600',
                          fontSize: '1rem',
                          border: 'none',
                          cursor: 'pointer',
                          marginTop: '5px',
                          boxShadow: '0 4px 10px rgba(224, 112, 43, 0.25)'
                        }}
                      >
                        {loadingReset ? 'Sending...' : 'Send Reset OTP'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setLoginType('password');
                          setStep('phone-input');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'rgba(255, 255, 255, 0.6)',
                          textDecoration: 'underline',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          marginTop: '5px'
                        }}
                      >
                        Back to Sign In
                      </button>
                    </form>
                  )}

                  {step === 'forgot-otp' && (
                    <form onSubmit={handleForgotVerifySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: '600', marginBottom: '4px', color: 'var(--color-bg-sand)' }}>
                        Verify OTP Code
                      </h3>
                      <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem', marginBottom: '12px', lineHeight: '1.4' }}>
                        Enter the 6-digit OTP code sent to your WhatsApp number: <strong>{phone}</strong>.
                      </p>

                      <div style={{ textAlign: 'left' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <label htmlFor="forgot-otp-input" style={{ fontSize: '0.82rem', fontWeight: '600', color: 'rgba(255,255,255,0.8)' }}>Enter 6-Digit OTP</label>
                          <span style={{ fontSize: '0.82rem', color: 'var(--color-accent)', fontWeight: '700' }}>⏱ {formatTime(timer)}</span>
                        </div>
                        <input
                          id="forgot-otp-input"
                          type="text"
                          placeholder="6 Digit Code"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                          disabled={loading}
                          required
                          style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            background: 'rgba(0, 0, 0, 0.2)',
                            color: '#fff',
                            fontSize: '1.2rem',
                            letterSpacing: '6px',
                            textAlign: 'center',
                            outline: 'none'
                          }}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        style={{
                          width: '100%',
                          padding: '14px',
                          borderRadius: '6px',
                          background: 'var(--color-accent)',
                          color: '#fff',
                          fontWeight: '600',
                          fontSize: '1rem',
                          border: 'none',
                          cursor: 'pointer',
                          boxShadow: '0 4px 10px rgba(224, 112, 43, 0.25)'
                        }}
                      >
                        Verify OTP Code
                      </button>

                      <button
                        type="button"
                        onClick={() => setStep('forgot-phone')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'rgba(255, 255, 255, 0.6)',
                          textDecoration: 'underline',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          marginTop: '5px'
                        }}
                      >
                        Change WhatsApp Number
                      </button>
                    </form>
                  )}

                  {step === 'forgot-new-password' && (
                    <form onSubmit={handleForgotNewPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: '600', marginBottom: '4px', color: 'var(--color-bg-sand)' }}>
                        New Password
                      </h3>
                      <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem', marginBottom: '12px', lineHeight: '1.4' }}>
                        OTP verified! Please create your new secure login password.
                      </p>

                      <div style={{ textAlign: 'left' }}>
                        <label htmlFor="new-password" style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: '5px' }}>New Password *</label>
                        <input
                          id="new-password"
                          type="password"
                          placeholder="At least 6 characters"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          minLength={6}
                          style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(0, 0, 0, 0.2)', color: '#fff', outline: 'none', fontSize: '0.92rem' }}
                        />
                      </div>

                      <div style={{ textAlign: 'left' }}>
                        <label htmlFor="confirm-new-password" style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: '5px' }}>Confirm New Password *</label>
                        <input
                          id="confirm-new-password"
                          type="password"
                          placeholder="Confirm new password"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          required
                          minLength={6}
                          style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(0, 0, 0, 0.2)', color: '#fff', outline: 'none', fontSize: '0.92rem' }}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loadingPasswordReset}
                        style={{
                          width: '100%',
                          padding: '14px',
                          borderRadius: '6px',
                          background: 'var(--color-accent)',
                          color: '#fff',
                          fontWeight: '600',
                          fontSize: '1rem',
                          border: 'none',
                          cursor: 'pointer',
                          marginTop: '5px',
                          boxShadow: '0 4px 10px rgba(224, 112, 43, 0.25)'
                        }}
                      >
                        {loadingPasswordReset ? 'Saving Password...' : 'Reset & Save Password'}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* COLUMN 2: BRANDING LOGO DISPLAY PANEL */}
        <div className="branding-logo-panel" style={{
          flex: 1,
          background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary-medium) 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          textAlign: 'center',
          borderLeft: isSignup ? '1px solid rgba(255, 255, 255, 0.12)' : 'none',
          borderRight: !isSignup ? '1px solid rgba(255, 255, 255, 0.12)' : 'none'
        }}>
          <div style={{ maxWidth: '300px' }}>
            <img 
              src={new URL('../assets/images/logo.png', import.meta.url).href} 
              alt="Excel Energy Banner Logo" 
              style={{ width: '240px', height: '240px', objectFit: 'contain', display: 'block', margin: '0 auto 24px auto' }}
            />
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: '#fff', marginBottom: '12px', fontWeight: '500' }}>
              Excel Energy
            </h4>
            <p style={{ color: 'var(--color-accent)', fontWeight: '600', fontSize: '0.88rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px' }}>
              Abode of Healing & Meditation
            </p>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85rem', lineHeight: '1.6' }}>
              Complementary wellness practice designed to support your physical, emotional and spiritual well-being.
            </p>
          </div>
        </div>

      </div>



      {/* Mock Google Modal removed for live production */}
    </div>
  );
}
