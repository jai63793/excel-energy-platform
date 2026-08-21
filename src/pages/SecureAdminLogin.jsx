import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { loginWithOTPAction, loginWithPasswordAction } from '../store/authSlice';
import api from '../services/api';
import { hashPasswordSHA256 } from '../utils/hash';

export default function SecureAdminLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);

  // Login flow states
  const [loginStep, setLoginStep] = useState('phone-input'); // 'phone-input' | 'otp-verify'
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState('password'); // Default: 'password' | 'otp'
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [password, setPassword] = useState('');

  // Forgot password flow states
  const [isForgot, setIsForgot] = useState(false);
  const [step, setStep] = useState('forgot-phone'); // 'forgot-phone' | 'forgot-otp' | 'forgot-new-password'
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loadingReset, setLoadingReset] = useState(false);
  const [loadingPasswordReset, setLoadingPasswordReset] = useState(false);

  // 5 Minute Timer for OTP (300 seconds)
  const [timer, setTimer] = useState(300);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef(null);

  // Countdown timer logic
  useEffect(() => {
    if (timerActive && timer > 0) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      timerActive(false);
      clearInterval(timerRef.current);
      toast.error('OTP has expired. Please request a new one.');
      if (isForgot) {
        setStep('forgot-phone');
      } else {
        setLoginStep('phone-input');
      }
    }

    return () => clearInterval(timerRef.current);
  }, [timerActive, timer, isForgot]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleLoginPhoneSubmit = async (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      toast.error('Please enter a valid 10-digit WhatsApp number.');
      return;
    }

    let formattedPhone = phone;
    if (!phone.startsWith('+')) {
      formattedPhone = phone.length === 10 ? `+91${phone}` : phone;
    }

    setLoginLoading(true);
    try {
      const res = await api.post('/auth/request-otp', { phone: formattedPhone });
      if (res.data?.success) {
        setPhone(formattedPhone);
        setLoginStep('otp-verify');
        setOtpCode('');
        setTimer(300); // 5 minutes
        setTimerActive(true);
        toast.success('Login OTP sent successfully to your mobile phone!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send login OTP.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handlePasswordLoginSubmit = async (e) => {
    e.preventDefault();
    if (!phone || !password) {
      toast.error('Both WhatsApp number/Username and password are required.');
      return;
    }

    let formattedPhone = phone;
    if (/^\d{10}$/.test(phone)) {
      formattedPhone = `+91${phone}`;
    }

    try {
      setLoginLoading(true);
      toast.loading('Logging in...');
      const result = await dispatch(loginWithPasswordAction(formattedPhone, password));
      toast.dismiss();

      if (result.success) {
        if (result.role === 'ADMIN') {
          toast.success('Admin authenticated successfully.');
          navigate('/admin/dashboard');
        } else {
          toast.error('Access denied. This login route is reserved for administrators.');
          dispatch({ type: 'auth/logoutSuccess' }); // clear session
        }
      } else {
        toast.error(result.error || 'Login failed. Please check credentials.');
      }
    } catch (err) {
      toast.dismiss();
      toast.error('An error occurred during login.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLoginVerifySubmit = async (e) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      toast.error('Please enter a 6-digit OTP code.');
      return;
    }

    toast.loading('Verifying code...');
    const result = await dispatch(loginWithOTPAction(phone, otpCode));
    toast.dismiss();

    if (result.success) {
      if (result.role === 'ADMIN') {
        setTimerActive(false);
        clearInterval(timerRef.current);
        toast.success('Admin authenticated successfully.');
        navigate('/admin/dashboard');
      } else {
        toast.error('Access denied. This login route is reserved for administrators.');
        dispatch({ type: 'auth/logoutSuccess' }); // clear session
      }
    } else {
      toast.error(result.error || 'Verification failed.');
    }
  };

  // Forgot Password: Request OTP
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

  // Forgot Password: Verify OTP
  const handleForgotVerifySubmit = (e) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      toast.error('Please enter a 6-digit OTP code.');
      return;
    }
    setStep('forgot-new-password');
    setTimerActive(false);
    clearInterval(timerRef.current);
  };

  // Forgot Password: Submit New Password
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
      const hashedPassword = await hashPasswordSHA256(newPassword);
      const res = await api.post('/auth/forgot-password-reset', {
        phone,
        otpCode,
        newPassword: hashedPassword
      });
      if (res.data?.success) {
        toast.success('Password changed successfully! You can now log in.');
        setIsForgot(false);
        setLoginMethod('password');
        setLoginStep('phone-input');
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

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary-medium) 100%)',
      padding: '40px 20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(30px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 'var(--border-radius-md)',
        width: '100%',
        maxWidth: '440px',
        padding: '50px 40px',
        color: '#fff',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
          <button 
            onClick={() => navigate('/')} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'rgba(255,255,255,0.7)', 
              cursor: 'pointer', 
              fontSize: '0.85rem', 
              fontWeight: '500', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px' 
            }}
          >
            ← Back to Site
          </button>
          <button 
            onClick={() => navigate('/')} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'rgba(255,255,255,0.7)', 
              cursor: 'pointer', 
              fontSize: '0.85rem', 
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Go to Website Home"
          >
            🏠 Home
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <img 
            src={new URL('../assets/images/logo.png', import.meta.url).href} 
            alt="Excel Energy Brand Logo" 
            style={{ width: '80px', height: '80px', objectFit: 'contain', margin: '0 auto' }}
          />
        </div>

        <div style={{
          background: 'rgba(224, 112, 43, 0.1)',
          padding: '8px 18px',
          borderRadius: '50px',
          display: 'inline-block',
          color: 'var(--color-accent)',
          fontSize: '0.8rem',
          fontWeight: '600',
          letterSpacing: '1.5px',
          marginBottom: '20px'
        }}>
          SECURE PORTAL ACCESS
        </div>
        
        <h2 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '1.6rem',
          fontWeight: '600',
          marginBottom: '28px',
          color: 'var(--color-bg-sand)',
          lineHeight: '1.2'
        }}>
          Admin Console Login
        </h2>

        {!isForgot ? (
          <div>
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('password');
                  setLoginStep('phone-input');
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'none',
                  border: 'none',
                  borderBottom: loginMethod === 'password' ? '2px solid var(--color-accent)' : 'none',
                  color: loginMethod === 'password' ? 'var(--color-bg-sand)' : 'rgba(255, 255, 255, 0.5)',
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
                  setLoginMethod('otp');
                  setLoginStep('phone-input');
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'none',
                  border: 'none',
                  borderBottom: loginMethod === 'otp' ? '2px solid var(--color-accent)' : 'none',
                  color: loginMethod === 'otp' ? 'var(--color-bg-sand)' : 'rgba(255, 255, 255, 0.5)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Mobile OTP
              </button>
            </div>

            {loginStep === 'phone-input' ? (
              loginMethod === 'password' ? (
                <form onSubmit={handlePasswordLoginSubmit}>
                  <div style={{ textAlign: 'left', marginBottom: '20px' }}>
                    <label htmlFor="login-phone-pass" style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      color: 'rgba(255,255,255,0.7)',
                      marginBottom: '6px',
                      fontWeight: '650'
                    }}>
                      Username or WhatsApp Phone
                    </label>
                    <input
                      id="login-phone-pass"
                      type="text"
                      placeholder="Username or 10 digit phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={loginLoading}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: 'var(--border-radius-sm)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: '#fff',
                        fontSize: '1rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ textAlign: 'left', marginBottom: '20px' }}>
                    <label htmlFor="login-password" style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      color: 'rgba(255,255,255,0.7)',
                      marginBottom: '6px',
                      fontWeight: '650'
                    }}>
                      Password
                    </label>
                    <input
                      id="login-password"
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loginLoading}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: 'var(--border-radius-sm)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: '#fff',
                        fontSize: '1rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: 'var(--border-radius-sm)',
                      background: 'var(--color-primary-medium)',
                      color: '#fff',
                      fontWeight: '600',
                      fontSize: '1rem',
                      border: '1px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer',
                      transition: 'background var(--transition-fast)'
                    }}
                  >
                    {loginLoading ? 'Logging in...' : 'Sign In with Password'}
                  </button>

                  <div style={{ marginTop: '16px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgot(true);
                        setStep('forgot-phone');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-bg-sand)',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleLoginPhoneSubmit}>
                  <div style={{ textAlign: 'left', marginBottom: '20px' }}>
                    <label htmlFor="login-phone" style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      color: 'rgba(255,255,255,0.7)',
                      marginBottom: '6px',
                      fontWeight: '650'
                    }}>
                      WhatsApp Number
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)', fontSize: '0.92rem', fontWeight: '600' }}>+91</span>
                      <input
                        id="login-phone"
                        type="tel"
                        placeholder="10 digit WhatsApp number"
                        value={phone.replace(/^\+91/, '')}
                        onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                        maxLength={10}
                        disabled={loginLoading}
                        required
                        style={{
                          width: '100%',
                          padding: '12px 12px 12px 45px',
                          borderRadius: 'var(--border-radius-sm)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          background: 'rgba(0, 0, 0, 0.3)',
                          color: '#fff',
                          fontSize: '1rem',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: 'var(--border-radius-sm)',
                      background: 'var(--color-primary-medium)',
                      color: '#fff',
                      fontWeight: '600',
                      fontSize: '1rem',
                      border: '1px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer',
                      transition: 'background var(--transition-fast)'
                    }}
                  >
                    {loginLoading ? 'Sending OTP...' : 'Send OTP via WhatsApp'}
                  </button>

                  <div style={{ marginTop: '16px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgot(true);
                        setStep('forgot-phone');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-bg-sand)',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                </form>
              )
            ) : (
              <form onSubmit={handleLoginVerifySubmit}>
                <div style={{ textAlign: 'left', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label htmlFor="login-otp-input" style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      color: 'rgba(255,255,255,0.7)',
                      fontWeight: '650'
                    }}>
                      Enter 6-Digit OTP
                    </label>
                    <span style={{ fontSize: '0.82rem', color: '#ff7e47', fontWeight: '700' }}>⏱ {formatTime(timer)}</span>
                  </div>
                  <input
                    id="login-otp-input"
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    disabled={loading}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: 'var(--border-radius-sm)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      background: 'rgba(0, 0, 0, 0.3)',
                      color: '#fff',
                      fontSize: '1rem',
                      outline: 'none',
                      letterSpacing: '8px',
                      textAlign: 'center'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: 'var(--border-radius-sm)',
                    background: 'var(--color-primary-medium)',
                    color: '#fff',
                    fontWeight: '600',
                    fontSize: '1rem',
                    border: '1px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer',
                    transition: 'background var(--transition-fast)'
                  }}
                >
                  {loading ? 'Authenticating...' : 'Enter System Console'}
                </button>
              </form>
            )}
          </div>
        ) : (
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-bg-sand)', textAlign: 'center', marginBottom: '20px' }}>
              Forgot Password
            </h3>
            
            {step === 'forgot-phone' && (
              <form onSubmit={handleForgotPhoneSubmit}>
                <div style={{ textAlign: 'left', marginBottom: '20px' }}>
                  <label htmlFor="forgot-phone-input" style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '6px', fontWeight: '650' }}>
                    WhatsApp Number
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)', fontSize: '0.92rem', fontWeight: '600' }}>+91</span>
                    <input
                      id="forgot-phone-input"
                      type="tel"
                      placeholder="10 digit WhatsApp number"
                      value={phone.replace(/^\+91/, '')}
                      onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                      maxLength={10}
                      disabled={loadingReset}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 12px 12px 45px',
                        borderRadius: 'var(--border-radius-sm)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: '#fff',
                        fontSize: '1rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loadingReset}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: 'var(--border-radius-sm)',
                    background: 'var(--color-primary-medium)',
                    color: '#fff',
                    fontWeight: '600',
                    fontSize: '1rem',
                    border: '1px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer'
                  }}
                >
                  {loadingReset ? 'Requesting...' : 'Send Reset OTP via WhatsApp'}
                </button>

                <button
                  type="button"
                  onClick={() => setIsForgot(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'block',
                    margin: '16px auto 0 auto',
                    textDecoration: 'underline'
                  }}
                >
                  Back to Login
                </button>
              </form>
            )}

            {step === 'forgot-otp' && (
              <form onSubmit={handleForgotVerifySubmit}>
                <div style={{ textAlign: 'left', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label htmlFor="forgot-otp-input" style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontWeight: '650' }}>
                      Enter 6-Digit OTP
                    </label>
                    <span style={{ fontSize: '0.82rem', color: '#ff7e47', fontWeight: '700' }}>⏱ {formatTime(timer)}</span>
                  </div>
                  <input
                    id="forgot-otp-input"
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: 'var(--border-radius-sm)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      background: 'rgba(0, 0, 0, 0.3)',
                      color: '#fff',
                      fontSize: '1rem',
                      outline: 'none',
                      letterSpacing: '8px',
                      textAlign: 'center'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: 'var(--border-radius-sm)',
                    background: 'var(--color-primary-medium)',
                    color: '#fff',
                    fontWeight: '600',
                    fontSize: '1rem',
                    border: '1px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer'
                  }}
                >
                  Verify Verification Code
                </button>

                <button
                  type="button"
                  onClick={() => setStep('forgot-phone')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'block',
                    margin: '16px auto 0 auto',
                    textDecoration: 'underline'
                  }}
                >
                  Back to Phone Entry
                </button>
              </form>
            )}

            {step === 'forgot-new-password' && (
              <form onSubmit={handleForgotNewPasswordSubmit}>
                <div style={{ textAlign: 'left', marginBottom: '20px' }}>
                  <label htmlFor="forgot-new-pass" style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '6px', fontWeight: '650' }}>
                    New Password
                  </label>
                  <input
                    id="forgot-new-pass"
                    type="password"
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: 'var(--border-radius-sm)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      background: 'rgba(0, 0, 0, 0.3)',
                      color: '#fff',
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ textAlign: 'left', marginBottom: '20px' }}>
                  <label htmlFor="forgot-new-pass-confirm" style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '6px', fontWeight: '650' }}>
                    Confirm New Password
                  </label>
                  <input
                    id="forgot-new-pass-confirm"
                    type="password"
                    placeholder="Repeat new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: 'var(--border-radius-sm)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      background: 'rgba(0, 0, 0, 0.3)',
                      color: '#fff',
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loadingPasswordReset}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: 'var(--border-radius-sm)',
                    background: 'var(--color-primary-medium)',
                    color: '#fff',
                    fontWeight: '600',
                    fontSize: '1rem',
                    border: '1px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer'
                  }}
                >
                  {loadingPasswordReset ? 'Saving Password...' : 'Save New Password'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
