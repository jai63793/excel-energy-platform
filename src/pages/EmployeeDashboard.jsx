import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { logoutAction } from '../store/authSlice';
import api from '../services/api';
import { 
  FiUserCheck as UserCheck, 
  FiClock as Clock, 
  FiCalendar as Calendar, 
  FiLogOut as LogOut, 
  FiEdit3 as Edit3, 
  FiFileText as FileText, 
  FiUser as User,
  FiCoffee as Coffee,
  FiCheck as Check,
  FiPhone as Phone
} from 'react-icons/fi';

export default function EmployeeDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState('duty');
  const [profile, setProfile] = useState(null);
  const [dutyStatus, setDutyStatus] = useState('OFF_DUTY');
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [assignedBookings, setAssignedBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Shift & Note form state
  const [shiftNotes, setShiftNotes] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingStatus, setBookingStatus] = useState('CONFIRMED');

  // Availability schedule state
  const [availability, setAvailability] = useState({
    Monday: '09:00 AM - 05:00 PM',
    Tuesday: '09:00 AM - 05:00 PM',
    Wednesday: '09:00 AM - 05:00 PM',
    Thursday: '09:00 AM - 05:00 PM',
    Friday: '09:00 AM - 05:00 PM',
    Saturday: '10:00 AM - 02:00 PM',
    Sunday: 'OFF'
  });
  const [specialization, setSpecialization] = useState('');
  const [bio, setBio] = useState('');

  // Mobile responsiveness states
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchEmployeeData();
  }, [activeTab]);

  const fetchEmployeeData = async () => {
    setLoading(true);
    try {
      const [profileRes, historyRes, bookingsRes] = await Promise.allSettled([
        api.get('/employee/profile'),
        api.get('/employee/attendance/history'),
        api.get('/employee/bookings')
      ]);

      if (profileRes.status === 'fulfilled' && profileRes.value.data.success) {
        const p = profileRes.value.data.profile;
        setProfile(p);
        setDutyStatus(p.dutyStatus || 'OFF_DUTY');
        setSpecialization(p.specialization || 'Energy Practitioner');
        setBio(p.bio || '');
        if (p.availability) {
          try {
            setAvailability(typeof p.availability === 'string' ? JSON.parse(p.availability) : p.availability);
          } catch (e) {
            console.warn('Could not parse availability JSON:', e);
          }
        }
      }

      if (historyRes.status === 'fulfilled' && historyRes.value.data.success) {
        setAttendanceHistory(historyRes.value.data.history || []);
      }

      if (bookingsRes.status === 'fulfilled' && bookingsRes.value.data.success) {
        setAssignedBookings(bookingsRes.value.data.bookings || []);
      }
    } catch (err) {
      console.error('Failed to load employee dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDutyChange = async (status) => {
    try {
      const res = await api.put('/employee/duty-status', { dutyStatus: status });
      if (res.data.success) {
        setDutyStatus(status);
        toast.success(`Status updated to ${status}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleCheckIn = async () => {
    try {
      toast.loading('Checking in...');
      const res = await api.post('/employee/attendance/check-in', { notes: shiftNotes });
      toast.dismiss();
      if (res.data.success) {
        setDutyStatus('ON_DUTY');
        setShiftNotes('');
        toast.success('Shift Check-In successful!');
        fetchEmployeeData();
      }
    } catch (err) {
      toast.dismiss();
      toast.error(err.response?.data?.message || 'Check-In failed');
    }
  };

  const handleCheckOut = async () => {
    try {
      toast.loading('Checking out...');
      const res = await api.post('/employee/attendance/check-out', { notes: shiftNotes });
      toast.dismiss();
      if (res.data.success) {
        setDutyStatus('OFF_DUTY');
        setShiftNotes('');
        toast.success('Shift Check-Out recorded!');
        fetchEmployeeData();
      }
    } catch (err) {
      toast.dismiss();
      toast.error(err.response?.data?.message || 'Check-Out failed');
    }
  };

  const handleSaveAvailability = async () => {
    try {
      toast.loading('Saving settings...');
      const res = await api.put('/employee/availability', {
        availability,
        specialization,
        bio
      });
      toast.dismiss();
      if (res.data.success) {
        toast.success('Availability and profile saved successfully!');
      }
    } catch (err) {
      toast.dismiss();
      toast.error('Failed to save availability settings');
    }
  };

  const handleSaveBookingNotes = async (bookingId) => {
    try {
      toast.loading('Saving session notes...');
      const res = await api.put(`/employee/bookings/${bookingId}`, {
        notes: bookingNotes,
        status: bookingStatus
      });
      toast.dismiss();
      if (res.data.success) {
        toast.success('Member session notes saved.');
        setSelectedBooking(null);
        fetchEmployeeData();
      }
    } catch (err) {
      toast.dismiss();
      toast.error('Failed to update booking notes.');
    }
  };

  const activeCheckIn = attendanceHistory.find((a) => !a.checkOut);

  const renderSidebarContent = () => (
    <>
      <div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '35px', textAlign: 'center', width: '100%' }}>
          <img 
            src={new URL('../assets/images/logo.png', import.meta.url).href} 
            alt="Excel Energy Brand Logo" 
            style={{ width: '80px', height: '80px', objectFit: 'contain' }}
          />
          <div>
            <h2 style={{
              fontSize: '1.25rem',
              fontFamily: 'var(--font-heading)',
              color: 'var(--color-bg-sand)',
              margin: 0,
              fontWeight: '600',
              lineHeight: '1.2'
            }}>
              {user?.name || 'Practitioner'}
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{specialization || 'Practitioner Portal'}</span>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { id: 'duty', label: 'Duty & Attendance' },
            { id: 'bookings', label: `Assigned Bookings (${assignedBookings.length})` },
            { id: 'availability', label: 'Shift & Availability' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (isMobile) setIsSidebarOpen(false);
              }}
              style={{
                width: '100%',
                padding: '12px 15px',
                borderRadius: '6px',
                border: 'none',
                textAlign: 'left',
                background: activeTab === tab.id ? 'rgba(255,255,255,0.1)' : 'none',
                color: '#fff',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <button
        onClick={() => {
          dispatch(logoutAction());
          toast.success('Logged out.');
          navigate('/secure-admin-login');
        }}
        style={{
          background: '#ef4444',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          padding: '10px 15px',
          fontWeight: '600',
          cursor: 'pointer',
          marginTop: '20px'
        }}
      >
        Logout Panel
      </button>
    </>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f4f7f6',
      fontFamily: 'var(--font-body)',
      color: 'var(--color-primary-dark)',
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      position: 'relative'
    }}>
      <style>{`
        @media (max-width: 480px) {
          .availability-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 8px !important;
          }
          .availability-input {
            width: 100% !important;
            text-align: left !important;
          }
        }
      `}</style>
      {/* Mobile Top Header Bar */}
      {isMobile && (
        <header style={{
          background: '#041712',
          color: '#fff',
          padding: '15px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 99,
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img 
              src={new URL('../assets/images/logo.png', import.meta.url).href} 
              alt="Brand Logo" 
              style={{ width: '40px', height: '40px', objectFit: 'contain' }}
            />
            <h2 style={{ fontSize: '1rem', color: '#fff', margin: 0, fontWeight: '700' }}>
              Excel Energy Staff
            </h2>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '1.8rem',
              cursor: 'pointer',
              padding: '5px'
            }}
          >
            ☰
          </button>
        </header>
      )}

      {/* Mobile Drawer (Sidebar Panel for Mobile) */}
      {isMobile && isSidebarOpen && (
        <>
          <div 
            onClick={() => setIsSidebarOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0,0,0,0.5)',
              zIndex: 999,
              backdropFilter: 'blur(2px)'
            }}
          />
          <aside style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '260px',
            height: '100vh',
            background: '#041712',
            color: '#fff',
            padding: '30px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            zIndex: 1000,
            boxShadow: '4px 0 15px rgba(0,0,0,0.2)',
            overflowY: 'auto'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '1.5rem',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>
              {renderSidebarContent()}
            </div>
          </aside>
        </>
      )}

      {/* Desktop Sidebar Panel */}
      {!isMobile && (
        <aside style={{
          width: '260px',
          background: '#041712',
          color: '#fff',
          padding: '30px 20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100vh',
          position: 'sticky',
          top: 0,
          flexShrink: 0
        }}>
          {renderSidebarContent()}
        </aside>
      )}

      {/* Main Content Area */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        flex: 1, 
        height: isMobile ? 'auto' : '100vh', 
        overflow: isMobile ? 'visible' : 'hidden' 
      }}>
        {/* Top Header Bar (Desktop only) */}
        {!isMobile && (
          <header style={{
            background: '#fff',
            borderBottom: '1px solid #e2e8f0',
            padding: '20px 40px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: '700', color: '#041712', margin: 0, fontFamily: 'var(--font-heading)', letterSpacing: '-0.5px' }}>
                Practitioner Console
              </h1>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>
                Excel Energy Staff & Practitioner Portal
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{
                background: 'rgba(224, 112, 43, 0.1)',
                color: 'var(--color-accent)',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: '700',
                letterSpacing: '0.5px'
              }}>
                {dutyStatus.replace('_', ' ')}
              </span>
            </div>
          </header>
        )}

        {/* Scrollable Content Container */}
        <div style={{ 
          flex: 1, 
          padding: isMobile ? '20px 15px' : '40px', 
          overflowY: isMobile ? 'visible' : 'auto', 
          background: '#f8fafc' 
        }}>
        
          {/* Tab 1: Duty & Attendance Control */}
          {activeTab === 'duty' && (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr', gap: '30px' }}>
              {/* Shift Check-In / Check-Out Control Card */}
              <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', alignSelf: 'start' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserCheck style={{ color: 'var(--color-accent)' }} />
                  <span>Shift Control</span>
                </h3>

                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748b' }}>
                    <span>Current Shift Status</span>
                    <span style={{
                      background: activeCheckIn ? '#dcfce7' : '#f1f5f9',
                      color: activeCheckIn ? '#15803d' : '#475569',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: '700'
                    }}>
                      {activeCheckIn ? 'ACTIVE SHIFT' : 'NO ACTIVE SHIFT'}
                    </span>
                  </div>

                  {activeCheckIn && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-accent)', fontWeight: 'bold', marginTop: '10px', fontFamily: 'monospace' }}>
                      Checked In: {new Date(activeCheckIn.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>

                {/* Duty Status Selector */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '8px', color: '#64748b' }}>Quick Duty Selector</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    <button
                      onClick={() => handleDutyChange('ON_DUTY')}
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        border: 'none',
                        background: dutyStatus === 'ON_DUTY' ? '#16a34a' : '#f1f5f9',
                        color: dutyStatus === 'ON_DUTY' ? '#fff' : '#1e293b',
                        fontWeight: '700',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      On Duty
                    </button>
                    <button
                      onClick={() => handleDutyChange('ON_BREAK')}
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        border: 'none',
                        background: dutyStatus === 'ON_BREAK' ? '#d97706' : '#f1f5f9',
                        color: dutyStatus === 'ON_BREAK' ? '#fff' : '#1e293b',
                        fontWeight: '700',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      Break
                    </button>
                    <button
                      onClick={() => handleDutyChange('OFF_DUTY')}
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        border: 'none',
                        background: dutyStatus === 'OFF_DUTY' ? '#dc2626' : '#f1f5f9',
                        color: dutyStatus === 'OFF_DUTY' ? '#fff' : '#1e293b',
                        fontWeight: '700',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      Off Duty
                    </button>
                  </div>
                </div>

                {/* Shift Notes Input */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '8px', color: '#64748b' }}>Shift Notes / Remarks</label>
                  <textarea
                    value={shiftNotes}
                    onChange={(e) => setShiftNotes(e.target.value)}
                    placeholder="Enter shift handover comments or update info..."
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '0.85rem',
                      outline: 'none',
                      minHeight: '80px',
                      resize: 'none',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                {/* Check-In / Check-Out Actions */}
                <div>
                  {!activeCheckIn ? (
                    <button
                      onClick={handleCheckIn}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: '#16a34a',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: '700',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      Check In Shift
                    </button>
                  ) : (
                    <button
                      onClick={handleCheckOut}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: '#dc2626',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: '700',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      Check Out Shift
                    </button>
                  )}
                </div>
              </div>

              {/* Attendance Logs History Card */}
              <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock style={{ color: 'var(--color-accent)' }} />
                  <span>Recent Attendance Log History</span>
                </h3>

                {attendanceHistory.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#777', fontSize: '0.9rem' }}>
                    No recent attendance records found.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', minWidth: '550px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: '#f8faf9', borderBottom: '2px solid #eee' }}>
                          <th style={{ padding: '12px 15px' }}>Date</th>
                          <th style={{ padding: '12px 15px' }}>Check In</th>
                          <th style={{ padding: '12px 15px' }}>Check Out</th>
                          <th style={{ padding: '12px 15px' }}>Status</th>
                          <th style={{ padding: '12px 15px' }}>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceHistory.map((item) => (
                          <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '12px 15px', fontWeight: '600' }}>{new Date(item.checkIn).toLocaleDateString()}</td>
                            <td style={{ padding: '12px 15px', color: '#16a34a', fontWeight: 'bold' }}>
                              {new Date(item.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td style={{ padding: '12px 15px', color: '#64748b' }}>
                              {item.checkOut ? new Date(item.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'On Shift'}
                            </td>
                            <td style={{ padding: '12px 15px' }}>
                              <span style={{
                                background: '#dcfce7',
                                color: '#16a34a',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontWeight: '700',
                                fontSize: '0.75rem'
                              }}>
                                {item.status}
                              </span>
                            </td>
                            <td style={{ padding: '12px 15px', color: '#64748b', maxW: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.notes || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Assigned Bookings */}
          {activeTab === 'bookings' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>Assigned Member Bookings</h2>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>Review and record Energy session notes for member bookings</p>
              </div>

              {assignedBookings.length === 0 ? (
                <div style={{ background: '#fff', padding: '50px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <Calendar style={{ width: '40px', height: '40px', color: '#94a3b8', marginBottom: '15px' }} />
                  <p style={{ margin: 0, fontWeight: '600', color: '#475569' }}>No member bookings assigned yet.</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>Assigned practitioner bookings will appear here automatically.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {assignedBookings.map((b) => (
                    <div key={b.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                      <div style={{ marginBottom: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span style={{
                            background: b.status === 'COMPLETED' ? '#dcfce7' : b.status === 'CANCELLED' ? '#fee2e2' : '#fef3c7',
                            color: b.status === 'COMPLETED' ? '#15803d' : b.status === 'CANCELLED' ? '#b91c1c' : '#b45309',
                            padding: '3px 10px',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: '700'
                          }}>{b.status}</span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>₹{b.amount}</span>
                        </div>

                        <h3 style={{ fontSize: '1.05rem', fontWeight: '700', margin: '0 0 10px 0' }}>{b.sessionType}</h3>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#334155', marginBottom: '4px' }}>
                          <User style={{ color: 'var(--color-accent)', width: '14px' }} />
                          <strong>{b.user?.name || 'Member Client'}</strong>
                        </div>
                        {b.user?.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#64748b' }}>
                            <Phone style={{ color: '#64748b', width: '14px' }} />
                            <span>{b.user.phone}</span>
                          </div>
                        )}

                        <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', marginTop: '12px', border: '1px solid #f1f5f9', fontSize: '0.8rem' }}>
                          <div style={{ color: 'var(--color-accent)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar style={{ width: '12px' }} />
                            <span>{new Date(b.bookingDate).toLocaleDateString()}</span>
                          </div>
                          <div style={{ color: '#64748b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock style={{ width: '12px' }} />
                            <span>{b.timeSlot}</span>
                          </div>
                        </div>

                        {b.notes && (
                          <div style={{ fontSize: '0.78rem', background: '#fffbeb', border: '1px solid #fef3c7', padding: '8px', borderRadius: '6px', marginTop: '12px', color: '#b45309' }}>
                            <strong>Session Remarks: </strong> {b.notes}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setSelectedBooking(b);
                          setBookingNotes(b.notes || '');
                          setBookingStatus(b.status || 'CONFIRMED');
                        }}
                        style={{
                          width: '100%',
                          padding: '10px',
                          background: '#f1f5f9',
                          color: '#1e293b',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <FileText style={{ color: 'var(--color-accent)' }} />
                        <span>Update Session Notes</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bookings Notes Editor Modal */}
          {selectedBooking && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)' }}>
              <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', width: '90%', maxWidth: '440px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', margin: '0 0 5px 0' }}>Session Record Editor</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 20px 0' }}>Client: {selectedBooking.user?.name} | {selectedBooking.sessionType}</p>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '6px', color: '#64748b' }}>Session Status</label>
                  <select
                    value={bookingStatus}
                    onChange={(e) => setBookingStatus(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.85rem', background: '#fff' }}
                  >
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '6px', color: '#64748b' }}>Practitioner Energy Remarks</label>
                  <textarea
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    placeholder="Enter details on chakra analysis, healing remarks or recommendations..."
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '0.85rem',
                      minHeight: '100px',
                      resize: 'none',
                      fontFamily: 'inherit',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setSelectedBooking(null)}
                    style={{ flex: 1, padding: '10px', border: '1px solid #ccc', background: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveBookingNotes(selectedBooking.id)}
                    style={{ flex: 1, padding: '10px', border: 'none', background: 'var(--color-primary-medium)', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}
                  >
                    Save Notes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Practitioner Profile & Availability Settings */}
          {activeTab === 'availability' && (
            <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', maxWidth: '750px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 style={{ color: 'var(--color-accent)' }} />
                <span>Practitioner Profile & Availability Hours</span>
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '6px', color: '#64748b' }}>Specialization Title</label>
                  <input
                    type="text"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder="e.g. Master Pranic Healer"
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '6px', color: '#64748b' }}>Practitioner Bio / Description</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Record your experience details, healing methods, or meditation guidance background..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '0.85rem',
                    minHeight: '80px',
                    fontFamily: 'inherit',
                    resize: 'none'
                  }}
                />
              </div>

              <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#334155', borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '16px' }}>
                Weekly Work Availability Slots
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px', marginBottom: '30px' }}>
                {Object.keys(availability).map((day) => (
                  <div key={day} className="availability-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '10px 15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>{day}</span>
                    <input
                      type="text"
                      className="availability-input"
                      value={availability[day]}
                      onChange={(e) => setAvailability({ ...availability, [day]: e.target.value })}
                      style={{
                        background: '#fff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        color: 'var(--color-accent)',
                        textAlign: 'right',
                        width: '150px',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={handleSaveAvailability}
                style={{
                  padding: '12px 24px',
                  background: 'var(--color-primary-medium)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Check />
                <span>Save Roster Preferences</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
