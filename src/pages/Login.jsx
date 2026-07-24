import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  loginWithOTPAction, 
  registerWithPasswordAction,
  loginWithPasswordAction,
  loginWithGoogleAction
} from '../store/authSlice';
import api from '../services/api';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading } = useSelector((state) => state.auth);

  // Read URL params to determine initial view
  const queryParams = new URLSearchParams(location.search);
  const isSignupInit = queryParams.get('signup') === 'true';

  // Auth Modes & Steps
  const [isSignup, setIsSignup] = useState(isSignupInit);
  const [loginType, setLoginType] = useState('password'); // 'password' | 'otp' | 'forgot'
  const [step, setStep] = useState('phone-input'); // 'phone-input' | 'otp-verify' | 'forgot-phone' | 'forgot-otp' | 'forgot-new-password'

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

  // Social Modal / Demo states
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';
  const fromSearch = location.state?.from?.search || '';

  // Synchronize signup url query param
  useEffect(() => {
    setIsSignup(isSignupInit);
  }, [isSignupInit]);

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
      toast.loading('Sending OTP via WhatsApp...');
      const res = await api.post('/auth/request-otp', { phone: formattedPhone });
      toast.dismiss();

      if (res.data?.success) {
        setPhone(formattedPhone);
        setStep('otp-verify');
        setTimer(300); // 5 minutes
        setTimerActive(true);
        toast.success('OTP sent successfully to your WhatsApp!');

        if (res.data.otp) {
          toast(`[TEST MODE] Mock WhatsApp OTP: ${res.data.otp}`, { icon: '🔑', duration: 10000 });
        }
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
        toast.success('Password Reset OTP sent to WhatsApp!');

        if (res.data.otp) {
          toast(`[TEST MODE] Mock Reset OTP: ${res.data.otp}`, { icon: '🔑', duration: 10000 });
        }
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px', zIndex: 1 }}>
        <img 
          src={new URL('../assets/images/logo.png', import.meta.url).href} 
          alt="Brand Logo" 
          style={{ width: '90px', height: '90px', objectFit: 'contain' }}
        />
        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#fff', marginTop: '10px', fontSize: '1.9rem', fontWeight: '500', letterSpacing: '0.5px' }}>
          Excel Energy
        </h2>
      </div>

      {/* MAIN LAYOUT SPLIT PANEL */}
      <div style={{
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
        <div style={{
          flex: 1,
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: 'rgba(10, 40, 32, 0.4)'
        }}>
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

                  {/* Login Type Tabs */}
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', background: 'rgba(255,255,255,0.06)', padding: '4px', borderRadius: '8px' }}>
                    <button
                      type="button"
                      onClick={() => { setLoginType('password'); setStep('phone-input'); }}
                      style={{
                        flex: 1,
                        padding: '10px',
                        border: 'none',
                        borderRadius: '6px',
                        background: loginType === 'password' ? 'var(--color-accent)' : 'none',
                        color: '#fff',
                        fontWeight: '600',
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease'
                      }}
                    >
                      Password Login
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoginType('otp')}
                      style={{
                        flex: 1,
                        padding: '10px',
                        border: 'none',
                        borderRadius: '6px',
                        background: loginType === 'otp' ? 'var(--color-accent)' : 'none',
                        color: '#fff',
                        fontWeight: '600',
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease'
                      }}
                    >
                      WhatsApp OTP
                    </button>
                  </div>

                  {loginType === 'password' ? (
                    /* PASSWORD SIGN IN FORM */
                    <form onSubmit={handlePasswordLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ textAlign: 'left' }}>
                        <label htmlFor="login-phone" style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: '5px' }}>WhatsApp Number</label>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)', fontSize: '0.92rem', fontWeight: '600' }}>+91</span>
                          <input
                            id="login-phone"
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
                        <label htmlFor="login-password" style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: '5px' }}>Password</label>
                        <input
                          id="login-password"
                          type="password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(0, 0, 0, 0.2)', color: '#fff', outline: 'none', fontSize: '0.92rem' }}
                        />
                      </div>

                      {/* Forgot Password Trigger */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-4px' }}>
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
                          marginTop: '5px',
                          boxShadow: '0 4px 10px rgba(224, 112, 43, 0.25)'
                        }}
                      >
                        {loading ? 'Signing In...' : 'Sign In'}
                      </button>
                    </form>
                  ) : (
                    /* OTP SIGN IN FORM */
                    <>
                      {step === 'phone-input' ? (
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
                        </form>
                      ) : (
                        <form onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                              fontSize: '0.85rem'
                            }}
                          >
                            Request new OTP
                          </button>
                        </form>
                      )}
                    </>
                  )}

                  {/* Social or Split divider */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    color: 'rgba(255,255,255,0.3)',
                    fontSize: '0.8rem',
                    margin: '24px 0 16px 0'
                  }}>
                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', flex: 1 }} />
                    <span>OR SOCIAL SIGN IN</span>
                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', flex: 1 }} />
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowGoogleModal(true)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '6px',
                      background: '#fff',
                      color: '#333',
                      fontWeight: '650',
                      fontSize: '0.9rem',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Sign In with Google
                  </button>

                  <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9rem' }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>Don't have an account? </span>
                    <button 
                      type="button" 
                      onClick={() => setIsSignup(true)}
                      style={{ background: 'none', border: 'none', color: 'var(--color-accent)', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Sign Up
                    </button>
                  </div>
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
        <div style={{
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
              style={{ width: '170px', height: '170px', objectFit: 'contain', marginBottom: '24px' }}
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

      {/* QUICK DEMO USER SELECTION BOX */}
      <div style={{
        marginTop: '30px',
        padding: '24px',
        background: 'rgba(255, 255, 255, 0.06)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '900px',
        zIndex: 1,
        color: '#fff',
        textAlign: 'left'
      }}>
        <h4 style={{
          fontSize: '0.85rem',
          color: 'var(--color-bg-sand)',
          fontWeight: '600',
          marginBottom: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          🔑 Quick Demo Accounts (Test Mode / Autofill)
        </h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
          {/* Paid User */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            padding: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff' }}>
                Amit Patel <span style={{ fontSize: '0.7rem', color: 'var(--color-accent)', background: 'rgba(224, 112, 43, 0.15)', padding: '2px 6px', borderRadius: '10px', marginLeft: '6px' }}>Paid Member</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>
                Phone: 9876543210 | Code: 123456
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setPhone('9876543210');
                setOtpCode('123456');
                setIsSignup(false);
                setLoginType('otp');
                setStep('otp-verify');
                toast.success('Amit\'s WhatsApp OTP flow prefilled!');
              }}
              style={{ background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: '4px', padding: '5px 10px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}
            >
              Autofill
            </button>
          </div>

          {/* Unpaid User */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            padding: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff' }}>
                Neha Singh <span style={{ fontSize: '0.7rem', color: '#9ca3af', background: 'rgba(255, 255, 255, 0.1)', padding: '2px 6px', borderRadius: '10px', marginLeft: '6px' }}>Unpaid User</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>
                Phone: 8765432109 | Code: 123456
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setPhone('8765432109');
                setOtpCode('123456');
                setIsSignup(false);
                setLoginType('otp');
                setStep('otp-verify');
                toast.success('Neha\'s WhatsApp OTP flow prefilled!');
              }}
              style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '4px', padding: '4px 9px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}
            >
              Autofill
            </button>
          </div>

          {/* Healer User */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            padding: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff' }}>
                Dr. Rajesh Iyer <span style={{ fontSize: '0.7rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', padding: '2px 6px', borderRadius: '10px', marginLeft: '6px' }}>Healer</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>
                Phone: 7654321098 | Code: 123456
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setPhone('7654321098');
                setOtpCode('123456');
                setIsSignup(false);
                setLoginType('otp');
                setStep('otp-verify');
                toast.success('Dr. Rajesh\'s WhatsApp OTP flow prefilled!');
              }}
              style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '4px', padding: '4px 9px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}
            >
              Autofill
            </button>
          </div>
        </div>
      </div>

      {/* MOCK GOOGLE SELECTOR MODAL */}
      {showGoogleModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '400px',
            padding: '30px',
            color: '#333',
            textAlign: 'left',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.25rem', fontWeight: 'bold' }}>Sign in with Google</h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '0.85rem', color: '#666' }}>
              Choose a mock Google Account to authenticate:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => handleGoogleSelect('Jai Ram', 'jai@gmail.com')}
                style={{
                  background: '#f8faf9',
                  border: '1px solid #ddd',
                  padding: '12px',
                  borderRadius: '8px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                <div>Jai Ram</div>
                <div style={{ fontSize: '0.75rem', color: '#777', fontWeight: 'normal' }}>jai@gmail.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleGoogleSelect('Priya Sharma', 'priya@gmail.com')}
                style={{
                  background: '#f8faf9',
                  border: '1px solid #ddd',
                  padding: '12px',
                  borderRadius: '8px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                <div>Priya Sharma</div>
                <div style={{ fontSize: '0.75rem', color: '#777', fontWeight: 'normal' }}>priya@gmail.com</div>
              </button>
            </div>

            <div style={{ height: '1px', background: '#eee', margin: '15px 0' }} />
            
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', fontWeight: 'bold' }}>Or Enter a Mock Custom Account</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="Google Account Full Name"
                value={customGoogleName}
                onChange={(e) => setCustomGoogleName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #ccc',
                  color: '#333'
                }}
              />
              <input
                type="email"
                placeholder="Google Email"
                value={customGoogleEmail}
                onChange={(e) => setCustomGoogleEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #ccc',
                  color: '#333'
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (!customGoogleEmail || !customGoogleName) {
                    toast.error('Please enter both name and email.');
                    return;
                  }
                  handleGoogleSelect(customGoogleName, customGoogleEmail);
                }}
                style={{
                  background: 'var(--color-primary-medium)',
                  color: '#fff',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Sign In with Custom Google Account
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowGoogleModal(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#ef4444',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.9rem',
                display: 'block',
                margin: '10px auto 0 auto'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
