import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminLoginAction } from '../store/authSlice';

export default function EmployeeLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleEmployeeSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Please fill in all credentials fields.');
      return;
    }

    toast.loading('Authenticating employee portal access...');
    const result = await dispatch(adminLoginAction(username, password));
    toast.dismiss();

    if (result.success) {
      if (result.role === 'EMPLOYEE' || result.role === 'VOLUNTEER') {
        toast.success('Employee authenticated successfully.');
        navigate('/employee/dashboard');
      } else {
        toast.error('Access denied. Administrator accounts must use the secure admin URL.');
        dispatch({ type: 'auth/logoutSuccess' }); // clear session
      }
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#041712', // Dark forest green
      padding: '40px 20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <style>{`
        @media (max-width: 480px) {
          .employee-login-card {
            padding: 30px 15px !important;
          }
        }
      `}</style>
      <div className="employee-login-card" style={{
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
          EMPLOYEE PORTAL
        </div>
        
        <h2 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '1.6rem',
          fontWeight: '600',
          marginBottom: '28px',
          color: 'var(--color-bg-sand)',
          lineHeight: '1.2'
        }}>
          Staff &amp; Practitioner Login
        </h2>

        <form onSubmit={handleEmployeeSubmit}>
          <div style={{ textAlign: 'left', marginBottom: '20px' }}>
            <label htmlFor="username" style={{
              display: 'block',
              fontSize: '0.85rem',
              color: 'rgba(255,255,255,0.7)',
              marginBottom: '6px',
              fontWeight: '650'
            }}>
              Username or WhatsApp Phone
            </label>
            <input
              id="username"
              type="text"
              placeholder="Username or Phone number"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
                outline: 'none'
              }}
            />
          </div>

          <div style={{ textAlign: 'left', marginBottom: '32px' }}>
            <label htmlFor="password" style={{
              display: 'block',
              fontSize: '0.85rem',
              color: 'rgba(255,255,255,0.7)',
              marginBottom: '6px',
              fontWeight: '650'
            }}>
              Secret Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {loading ? 'Authenticating...' : 'Enter Employee Console'}
          </button>
        </form>
      </div>
    </div>
  );
}
