import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { logoutAction } from '../store/authSlice';
import api from '../services/api';

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

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

  // Tabs: 'stats' | 'users' | 'payments' | 'broadcast' | 'contacts' | 'settings' | 'logs'
  const [activeTab, setActiveTab] = useState('stats');

  // Stats States
  const [stats, setStats] = useState({
    totalUsers: 0,
    paidUsers: 0,
    unpaidUsers: 0,
    todayRevenue: 0,
    monthlyRevenue: 0,
    totalRevenue: 0,
    todayRegistrations: 0,
    expiringSoon: 0,
    expiredUsers: 0
  });
  const [latestPayments, setLatestPayments] = useState([]);
  const [latestLogins, setLatestLogins] = useState([]);

  // Users List States
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');
  const [userPagination, setUserPagination] = useState({ currentPage: 1, pages: 1 });

  // Payments List States
  const [payments, setPayments] = useState([]);
  
  // Contacts Inbox States
  const [contacts, setContacts] = useState([]);

  // Activity Logs States
  const [logs, setLogs] = useState([]);

  // Broadcast Builder States
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastDesc, setBroadcastDesc] = useState('');
  const [broadcastAudience, setBroadcastAudience] = useState('ALL');
  const [liveUrl, setLiveUrl] = useState('');

  // Settings Configuration states
  const [settings, setSettings] = useState({
    companyName: '',
    gstNumber: '',
    logo: '',
    address: '',
    email: '',
    phone: '',
    razorpayKeyId: '',
    razorpayKeySecret: '',
    smsApiKey: '',
    whatsappApiKey: '',
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: ''
  });

  // Staff States
  const [staffList, setStaffList] = useState([]);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  
  // Staff Form Inputs
  const [staffName, setStaffName] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffRole, setStaffRole] = useState('EMPLOYEE');
  const [staffSpecialization, setStaffSpecialization] = useState('Energy Healer');
  const [staffBio, setStaffBio] = useState('');
  const [staffPassword, setStaffPassword] = useState('');

  const loadStaffList = async () => {
    try {
      const response = await api.get('/admin/staff');
      if (response.data.success) {
        setStaffList(response.data.staff || []);
      }
    } catch (err) {
      toast.error('Failed to load staff list.');
    }
  };

  const handleOpenCreateStaff = () => {
    setEditingStaff(null);
    setStaffName('');
    setStaffPhone('');
    setStaffEmail('');
    setStaffRole('EMPLOYEE');
    setStaffSpecialization('Energy Healer');
    setStaffBio('');
    setStaffPassword('');
    setShowStaffModal(true);
  };

  const handleOpenEditStaff = (member) => {
    setEditingStaff(member);
    setStaffName(member.name || '');
    setStaffPhone(member.phone || '');
    setStaffEmail(member.email || '');
    setStaffRole(member.role?.name || 'EMPLOYEE');
    setStaffSpecialization(member.employeeProfile?.specialization || 'Energy Healer');
    setStaffBio(member.employeeProfile?.bio || '');
    setStaffPassword('');
    setShowStaffModal(true);
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    if (!staffName || !staffPhone) {
      toast.error('Name and Phone/WhatsApp number are required.');
      return;
    }

    const payload = {
      name: staffName,
      phone: staffPhone,
      email: staffEmail || null,
      roleName: staffRole,
      specialization: staffSpecialization,
      bio: staffBio,
      password: staffPassword || undefined
    };

    try {
      if (editingStaff) {
        toast.loading('Updating staff member...');
        const res = await api.put(`/admin/staff/${editingStaff.id}`, payload);
        toast.dismiss();
        if (res.data.success) {
          toast.success('Staff member updated successfully!');
          setShowStaffModal(false);
          loadStaffList();
        }
      } else {
        if (!staffPassword) {
          toast.error('Password is required for new employees.');
          return;
        }
        toast.loading('Creating staff member...');
        const res = await api.post('/admin/staff', payload);
        toast.dismiss();
        if (res.data.success) {
          toast.success('Staff member created successfully!');
          setShowStaffModal(false);
          loadStaffList();
        }
      }
    } catch (err) {
      toast.dismiss();
      toast.error(err.response?.data?.message || 'Failed to save staff member.');
    }
  };

  const handleDeleteStaff = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this employee/staff member?')) return;
    try {
      toast.loading('Deleting staff member...');
      const res = await api.delete(`/admin/staff/${id}`);
      toast.dismiss();
      if (res.data.success) {
        toast.success('Staff member deleted successfully!');
        loadStaffList();
      }
    } catch (err) {
      toast.dismiss();
      toast.error(err.response?.data?.message || 'Failed to delete staff member.');
    }
  };

  // Pull configurations on load
  useEffect(() => {
    if (activeTab === 'stats') loadDashboardStats();
    if (activeTab === 'users') loadUsersList(1);
    if (activeTab === 'payments') loadPaymentsList();
    if (activeTab === 'contacts') loadContactsList();
    if (activeTab === 'logs') loadActivityLogs();
    if (activeTab === 'settings') loadGlobalSettings();
    if (activeTab === 'staff') loadStaffList();
  }, [activeTab, userSearch, userStatusFilter]);

  const loadDashboardStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      if (response.data.success) {
        setStats(response.data.stats);
        setLatestPayments(response.data.latestPayments || []);
        setLatestLogins(response.data.latestLogins || []);
      }
    } catch (err) {
      toast.error('Failed to load dashboard metrics.');
    }
  };

  const loadUsersList = async (page = 1) => {
    try {
      const response = await api.get('/admin/users', {
        params: {
          search: userSearch || undefined,
          status: userStatusFilter || undefined,
          page,
          limit: 10
        }
      });
      if (response.data.success) {
        setUsers(response.data.users || []);
        setUserPagination(response.data.pagination);
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  const loadPaymentsList = async () => {
    try {
      const response = await api.get('/admin/payments');
      if (response.data.success) {
        setPayments(response.data.payments || []);
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  const loadContactsList = async () => {
    try {
      const response = await api.get('/admin/contacts');
      if (response.data.success) {
        setContacts(response.data.contacts || []);
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  const loadActivityLogs = async () => {
    try {
      const response = await api.get('/admin/activity-logs');
      if (response.data.success) {
        setLogs(response.data.logs || []);
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  const loadGlobalSettings = async () => {
    try {
      const response = await api.get('/admin/settings');
      if (response.data.success && response.data.settings) {
        setSettings(response.data.settings);
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  // Admin Actions
  const handleUserSuspend = async (userId) => {
    try {
      const response = await api.put(`/admin/users/suspend/${userId}`);
      if (response.data.success) {
        toast.success('User suspended.');
        loadUsersList(userPagination.currentPage);
      }
    } catch (err) {
      toast.error('Failed to suspend user.');
    }
  };

  const handleUserActivate = async (userId) => {
    try {
      const response = await api.put(`/admin/users/activate/${userId}`);
      if (response.data.success) {
        toast.success('User activated.');
        loadUsersList(userPagination.currentPage);
      }
    } catch (err) {
      toast.error('Failed to activate user.');
    }
  };

  const handleUserResetPassword = async (userId) => {
    try {
      const response = await api.put(`/admin/users/reset-password/${userId}`);
      if (response.data.success) {
        toast.success(`Password reset. Temp code is: ${response.data.tempPassword}`, { duration: 8000 });
      }
    } catch (err) {
      toast.error('Failed to reset user password.');
    }
  };

  const handleUserDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently delete this user?')) return;
    try {
      const response = await api.delete(`/admin/users/${userId}`);
      if (response.data.success) {
        toast.success('User deleted permanently.');
        loadUsersList(userPagination.currentPage);
      }
    } catch (err) {
      toast.error('Failed to delete user.');
    }
  };

  // Contacts Actions
  const markContactRead = async (contactId) => {
    try {
      const response = await api.put(`/admin/contacts/read/${contactId}`);
      if (response.data.success) {
        toast.success('Message marked read.');
        loadContactsList();
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  const deleteContact = async (contactId) => {
    try {
      const response = await api.delete(`/admin/contacts/${contactId}`);
      if (response.data.success) {
        toast.success('Message deleted.');
        loadContactsList();
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  // Broadcast builders
  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastDesc) {
      toast.error('Title and message text are required.');
      return;
    }

    try {
      toast.loading('Sending broadcast...');
      const response = await api.post('/admin/notify-bulk', {
        title: broadcastTitle,
        description: broadcastDesc,
        targetAudience: broadcastAudience
      });
      toast.dismiss();

      if (response.data.success) {
        toast.success(response.data.message);
        setBroadcastTitle('');
        setBroadcastDesc('');
      }
    } catch (err) {
      toast.dismiss();
      toast.error('Failed to send announcement broadcast.');
    }
  };

  const handleSendLiveBroadcast = async (e) => {
    e.preventDefault();
    if (!liveUrl) {
      toast.error('Please enter a valid stream link URL.');
      return;
    }

    try {
      toast.loading('Sending stream invites...');
      const response = await api.post('/admin/notify-live', { liveUrl });
      toast.dismiss();

      if (response.data.success) {
        toast.success(response.data.message);
        setLiveUrl('');
      }
    } catch (err) {
      toast.dismiss();
      toast.error('Failed to send live invites.');
    }
  };

  // Settings Save
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put('/admin/settings', settings);
      if (response.data.success) {
        toast.success('System configuration saved successfully.');
      }
    } catch (err) {
      toast.error('Failed to save settings.');
    }
  };

  // Simulated Excel export helper
  const handleExportPayments = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Invoice Number,Customer Name,Customer Phone,Amount,Status,Date"].join(",") + "\n"
      + payments.map(p => `"${p.invoiceNumber}","${p.user.name}","${p.user.phone}",${p.amount},"${p.status}","${new Date(p.createdAt).toLocaleDateString()}"`).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `excel_energy_payments_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    toast.success('Payments export generated.');
  };

  const handleDownloadUsersPDF = async (type) => {
    toast.loading(`Loading users directory for ${type} list...`);
    try {
      const response = await api.get('/admin/users?limit=10000');
      toast.dismiss();

      if (!response.data.success) {
        toast.error('Failed to load user records.');
        return;
      }

      const allUsers = response.data.users || [];
      const now = new Date();

      let filteredUsers = [];
      let reportTitle = '';
      let badgeColor = '';

      if (type === 'all') {
        filteredUsers = allUsers;
        reportTitle = 'All Registered Members Directory';
        badgeColor = '#0f172a';
      } else if (type === 'paid') {
        filteredUsers = allUsers.filter(u => {
          if (u.subscriptions.length === 0) return false;
          const sub = u.subscriptions[0];
          return sub.status === 'ACTIVE' && new Date(sub.endDate) >= now;
        });
        reportTitle = 'Active Paid Subscribers Directory';
        badgeColor = '#16a34a';
      } else if (type === 'unpaid') {
        filteredUsers = allUsers.filter(u => {
          if (u.subscriptions.length === 0) return true;
          const sub = u.subscriptions[0];
          return sub.status !== 'ACTIVE' || new Date(sub.endDate) < now;
        });
        reportTitle = 'Unpaid & Expired Users Log';
        badgeColor = '#dc2626';
      }

      if (filteredUsers.length === 0) {
        toast.error(`No user records found matching '${type}' filter.`);
        return;
      }

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Pop-up blocked. Please allow pop-ups to print PDF.');
        return;
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>${reportTitle}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
              body {
                font-family: 'Inter', sans-serif;
                color: #1e293b;
                margin: 40px;
                padding: 0;
              }
              .header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                border-bottom: 2px solid #e2e8f0;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              .title-block {
                display: flex;
                align-items: center;
                gap: 15px;
              }
              .logo {
                width: 60px;
                height: 60px;
                object-fit: contain;
              }
              .report-info {
                text-align: right;
                font-size: 0.85rem;
                color: #64748b;
              }
              .report-badge {
                display: inline-block;
                background: ${badgeColor};
                color: #fff;
                padding: 4px 10px;
                border-radius: 4px;
                font-size: 0.8rem;
                font-weight: 700;
                margin-bottom: 10px;
                text-transform: uppercase;
              }
              .stats-summary {
                background: #f8fafc;
                padding: 15px 20px;
                border-radius: 8px;
                margin-bottom: 25px;
                font-size: 0.9rem;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                text-align: left;
                margin-top: 10px;
              }
              th, td {
                padding: 12px 15px;
                border-bottom: 1px solid #e2e8f0;
                font-size: 0.88rem;
              }
              th {
                background: #f1f5f9;
                color: #475569;
                font-weight: 700;
                text-transform: uppercase;
                font-size: 0.75rem;
                letter-spacing: 0.5px;
              }
              .avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                object-fit: cover;
                border: 1px solid #e2e8f0;
                background-color: #f1f5f9;
              }
              .status-badge {
                display: inline-block;
                padding: 3px 8px;
                border-radius: 12px;
                font-size: 0.75rem;
                font-weight: 700;
              }
              .status-active { background: #dcfce7; color: #16a34a; }
              .status-suspended { background: #fee2e2; color: #dc2626; }
              .footer {
                margin-top: 50px;
                text-align: center;
                font-size: 0.75rem;
                color: #94a3b8;
                border-top: 1px solid #e2e8f0;
                padding-top: 15px;
              }
              @media print {
                body { margin: 20px; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title-block">
                <img src="${new URL('../assets/images/logo.png', import.meta.url).href}" class="logo" />
                <div>
                  <h1 style="font-size: 1.4rem; font-weight: 700; margin: 0; color: #0f172a;">Excel Energy</h1>
                  <span style="font-size: 0.8rem; color: #64748b; font-weight: 600;">Divine Wellness Portal</span>
                </div>
              </div>
              <div class="report-info">
                <div class="report-badge">${type} Users</div>
                <div><strong>Printed On:</strong> ${now.toLocaleString()}</div>
              </div>
            </div>

            <h2 style="font-size: 1.3rem; font-weight: 700; color: #1e293b; margin-bottom: 8px;">${reportTitle}</h2>
            <div class="stats-summary">
              <strong>Total Records:</strong> ${filteredUsers.length} users | <strong>Report Category:</strong> ${type.toUpperCase()}
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 60px;">Photo</th>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th>WhatsApp Phone</th>
                  <th>Email</th>
                  <th>Account Status</th>
                  <th>Subscription Validity</th>
                </tr>
              </thead>
              <tbody>
                ${filteredUsers.map(u => {
                  const latestSub = u.subscriptions[0];
                  let validityText = 'No Subscription';
                  if (latestSub) {
                    const isSubActive = latestSub.status === 'ACTIVE' && new Date(latestSub.endDate) >= now;
                    validityText = `${latestSub.status} (Exp: ${new Date(latestSub.endDate).toLocaleDateString('en-IN')})`;
                  }
                  
                  const photoSrc = u.profilePhoto || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23cbd5e1"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';

                  return `
                    <tr>
                      <td><img src="${photoSrc}" class="avatar" /></td>
                      <td style="font-weight: 600;">${u.username}</td>
                      <td>${u.name}</td>
                      <td style="font-family: monospace;">${u.phone}</td>
                      <td>${u.email || 'N/A'}</td>
                      <td>
                        <span class="status-badge ${u.status === 'ACTIVE' ? 'status-active' : 'status-suspended'}">
                          ${u.status}
                        </span>
                      </td>
                      <td>${validityText}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>

            <div class="footer">
              This document is an administrative output generated by Excel Energy wellness portal. Confidential - Internal Use Only.
            </div>
            
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (err) {
      toast.dismiss();
      console.error('PDF Generation Error:', err);
      toast.error(`Failed to generate user list PDF: ${err.response?.data?.message || err.message}`);
    }
  };

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
              Excel Energy
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Admin Console</span>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { id: 'stats', label: 'Stats & Analytics' },
            { id: 'users', label: 'Member Accounts' },
            { id: 'staff', label: 'Employee & Volunteer Roster' },
            { id: 'liveControl', label: 'Live Session Control & WhatsApp' },
            { id: 'bookingsAdmin', label: '1-on-1 Member Bookings' },
            { id: 'payments', label: 'Payments & Invoices Log' },
            { id: 'broadcast', label: 'Broadcast Stream' },
            { id: 'contacts', label: 'Contact Forms', count: contacts.filter(c => c.status === 'UNREAD').length },
            { id: 'logs', label: 'Audit History' },
            { id: 'settings', label: 'Settings Setup' }
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
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              {tab.label}
              {tab.count > 0 && (
                <span style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'var(--color-accent)',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem'
                }}>
                  {tab.count}
                </span>
              )}
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
              Excel Energy Admin
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
                Admin Dashboard
              </h1>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>
                System Configuration & Operations Management
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
                System Console Active
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
        
        {/* STATS DASHBOARD TAB */}
        {activeTab === 'stats' && (
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '30px' }}>Dashboard Overview</h2>
            
            {/* Grid Metrics cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '20px',
              marginBottom: '40px'
            }}>
              <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize: '0.8rem', color: '#777', fontWeight: 'bold' }}>TOTAL REGISTERED</span>
                <h3 style={{ fontSize: '2rem', margin: '5px 0' }}>{stats.totalUsers}</h3>
                <span style={{ fontSize: '0.75rem', color: '#22c55e' }}>+{stats.todayRegistrations} Today</span>
              </div>
              <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize: '0.8rem', color: '#777', fontWeight: 'bold' }}>PAID SUBSCRIBERS</span>
                <h3 style={{ fontSize: '2rem', margin: '5px 0', color: '#15803d' }}>{stats.paidUsers}</h3>
                <span style={{ fontSize: '0.75rem', color: '#999' }}>{stats.unpaidUsers} Unpaid</span>
              </div>
              <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize: '0.8rem', color: '#777', fontWeight: 'bold' }}>MONTHLY REVENUE</span>
                <h3 style={{ fontSize: '2rem', margin: '5px 0' }}>₹{stats.monthlyRevenue}</h3>
                <span style={{ fontSize: '0.75rem', color: '#22c55e' }}>₹{stats.todayRevenue} Today</span>
              </div>
              <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize: '0.8rem', color: '#777', fontWeight: 'bold' }}>TOTAL REVENUE</span>
                <h3 style={{ fontSize: '2rem', margin: '5px 0', color: 'var(--color-accent)' }}>₹{stats.totalRevenue}</h3>
                <span style={{ fontSize: '0.75rem', color: '#e0702b' }}>{stats.expiringSoon} Expiring soon</span>
              </div>
            </div>

            {/* Split charts or list columns */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '30px' }}>
              <div style={{ background: '#fff', padding: '24px', borderRadius: '12px' }}>
                <h4 style={{ fontWeight: 'bold', marginBottom: '16px' }}>Latest User Sign-Ins</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <tbody>
                    {latestLogins.map(l => (
                      <tr key={l.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '10px 0', fontWeight: '600' }}>{l.user.name}</td>
                        <td style={{ padding: '10px 0', color: '#555' }}>{l.user.phone}</td>
                        <td style={{ padding: '10px 0', color: '#999', fontSize: '0.8rem' }}>{new Date(l.loggedInAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ background: '#fff', padding: '24px', borderRadius: '12px' }}>
                <h4 style={{ fontWeight: 'bold', marginBottom: '16px' }}>Recent Platform Payments</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <tbody>
                    {latestPayments.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '10px 0', fontWeight: '600' }}>{p.user.name}</td>
                        <td style={{ padding: '10px 0', fontWeight: 'bold' }}>₹{p.amount}</td>
                        <td style={{ padding: '10px 0' }}>
                          <span style={{
                            backgroundColor: p.status === 'SUCCESS' ? '#dcfce7' : '#fee2e2',
                            color: p.status === 'SUCCESS' ? '#15803d' : '#b91c1c',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                          }}>{p.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* USER LIST ACCOUNTS TAB */}
        {activeTab === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: '12px', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0 }}>User Accounts Directory</h2>
              
              <div style={{ display: 'flex', gap: '10px', flexDirection: isMobile ? 'column' : 'row' }}>
                <button
                  type="button"
                  onClick={() => handleDownloadUsersPDF('all')}
                  style={{
                    padding: '8px 16px',
                    background: '#f1f5f9',
                    color: '#1e293b',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  📄 PDF All Users
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadUsersPDF('paid')}
                  style={{
                    padding: '8px 16px',
                    background: '#dcfce7',
                    color: '#15803d',
                    border: '1px solid #bbf7d0',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  🟢 PDF Paid Users
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadUsersPDF('unpaid')}
                  style={{
                    padding: '8px 16px',
                    background: '#fee2e2',
                    color: '#b91c1c',
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  🔴 PDF Unpaid Users
                </button>
              </div>
            </div>
            
            {/* Filter Panel */}
            <div style={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row', 
              gap: '12px', 
              marginBottom: '20px',
              width: '100%'
            }}>
              <input
                type="text"
                placeholder="Search by name, phone, email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={{ 
                  padding: '10px 14px', 
                  borderRadius: '6px', 
                  border: '1px solid #ddd', 
                  width: isMobile ? '100%' : '300px' 
                }}
              />
              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                style={{ 
                  padding: '10px 14px', 
                  borderRadius: '6px', 
                  border: '1px solid #ddd',
                  width: isMobile ? '100%' : 'auto'
                }}
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>

            {/* Grid Table */}
            <div style={{ background: '#fff', borderRadius: '12px', overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '750px', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8faf9', borderBottom: '2px solid #eee' }}>
                    <th style={{ padding: '15px' }}>Username</th>
                    <th style={{ padding: '15px' }}>Name / Phone</th>
                    <th style={{ padding: '15px' }}>Email</th>
                    <th style={{ padding: '15px' }}>Status</th>
                    <th style={{ padding: '15px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '15px', fontWeight: '600' }}>{u.username}</td>
                      <td style={{ padding: '15px' }}>
                        <div>{u.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#777' }}>{u.phone}</div>
                      </td>
                      <td style={{ padding: '15px' }}>{u.email || 'N/A'}</td>
                      <td style={{ padding: '15px' }}>
                        <span style={{
                          backgroundColor: u.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2',
                          color: u.status === 'ACTIVE' ? '#15803d' : '#b91c1c',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: 'bold'
                        }}>{u.status}</span>
                      </td>
                      <td style={{ padding: '15px', display: 'flex', gap: '8px' }}>
                        {u.status === 'ACTIVE' ? (
                          <button onClick={() => handleUserSuspend(u.id)} style={{ padding: '5px 10px', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>
                            Suspend
                          </button>
                        ) : (
                          <button onClick={() => handleUserActivate(u.id)} style={{ padding: '5px 10px', background: '#dcfce7', color: '#15803d', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>
                            Activate
                          </button>
                        )}
                        <button onClick={() => handleUserResetPassword(u.id)} style={{ padding: '5px 10px', background: '#fef08a', color: '#854d0e', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>
                          Reset Key
                        </button>
                        <button onClick={() => handleUserDelete(u.id)} style={{ padding: '5px 10px', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
              <button
                disabled={userPagination.currentPage === 1}
                onClick={() => loadUsersList(userPagination.currentPage - 1)}
                style={{ padding: '6px 12px', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
              >
                Previous
              </button>
              <span style={{ alignSelf: 'center', fontSize: '0.9rem' }}>Page {userPagination.currentPage} of {userPagination.pages}</span>
              <button
                disabled={userPagination.currentPage === userPagination.pages}
                onClick={() => loadUsersList(userPagination.currentPage + 1)}
                style={{ padding: '6px 12px', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* PAYMENTS REGISTRY TAB */}
        {activeTab === 'payments' && (
          <div>
            <div style={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row', 
              justifyContent: 'space-between', 
              alignItems: isMobile ? 'stretch' : 'center', 
              gap: '12px',
              marginBottom: '24px' 
            }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0 }}>Payments Register</h2>
              <button 
                onClick={handleExportPayments} 
                style={{ 
                  padding: '10px 20px', 
                  background: 'var(--color-primary-medium)', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '6px', 
                  fontWeight: '600', 
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                📥 Export CSV / Excel
              </button>
            </div>

            <div style={{ background: '#fff', borderRadius: '12px', overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8faf9', borderBottom: '2px solid #eee' }}>
                    <th style={{ padding: '15px' }}>Invoice ID</th>
                    <th style={{ padding: '15px' }}>Customer Details</th>
                    <th style={{ padding: '15px' }}>Paid Date</th>
                    <th style={{ padding: '15px' }}>Amount</th>
                    <th style={{ padding: '15px' }}>Gateway Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '15px', fontWeight: '600' }}>{p.invoiceNumber || 'Pending'}</td>
                      <td style={{ padding: '15px' }}>
                        <div>{p.user.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#777' }}>{p.user.phone}</div>
                      </td>
                      <td style={{ padding: '15px' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '15px', fontWeight: 'bold' }}>₹{p.amount}</td>
                      <td style={{ padding: '15px' }}>
                        <span style={{
                          backgroundColor: p.status === 'SUCCESS' ? '#dcfce7' : p.status === 'PENDING' ? '#fef3c7' : '#fee2e2',
                          color: p.status === 'SUCCESS' ? '#15803d' : p.status === 'PENDING' ? '#d97706' : '#b91c1c',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: 'bold'
                        }}>{p.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BROADCAST ANNOUNCEMENTS TAB */}
        {activeTab === 'broadcast' && (
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '30px' }}>Broadcast stream notifications</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '20px' : '40px' }}>
              {/* Form 1: General Notification */}
              <div style={{ background: '#fff', padding: '30px', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                  Create Announcement Warning
                </h3>
                
                <form onSubmit={handleSendBroadcast}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px' }}>Target Audience</label>
                    <select
                      value={broadcastAudience}
                      onChange={(e) => setBroadcastAudience(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                    >
                      <option value="ALL">All Registered Users</option>
                      <option value="PAID">Paid Subscribers Only</option>
                      <option value="UNPAID">Unpaid / Expired Users Only</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px' }}>Title</label>
                    <input
                      type="text"
                      placeholder="Enter announcement title"
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px' }}>Message Description</label>
                    <textarea
                      placeholder="Write message description details..."
                      value={broadcastDesc}
                      onChange={(e) => setBroadcastDesc(e.target.value)}
                      rows={4}
                      required
                      style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', resize: 'none', fontFamily: 'inherit' }}
                    />
                  </div>

                  <button type="submit" style={{ width: '100%', padding: '12px', background: 'var(--color-primary-medium)', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: '600', cursor: 'pointer' }}>
                    Broadcast Notification & WhatsApp
                  </button>
                </form>
              </div>

              {/* Form 2: YouTube Live Broadcast Link */}
              <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', alignSelf: 'start' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                  🎥 YouTube Live Session Invitation
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#777', marginBottom: '20px' }}>
                  Only active paid subscribers will receive the invitation notification on their WhatsApp Business and Dashboard banners.
                </p>

                <form onSubmit={handleSendLiveBroadcast}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px' }}>YouTube Live URL</label>
                    <input
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={liveUrl}
                      onChange={(e) => setLiveUrl(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                  </div>

                  <button type="submit" style={{ width: '100%', padding: '12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: '600', cursor: 'pointer' }}>
                    🔴 Go Live & Notify Paid Users
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* STAFF & VOLUNTEER ROSTER TAB (CRUD) */}
        {activeTab === 'staff' && (
          <div>
            <div style={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row', 
              justifyContent: 'space-between', 
              alignItems: isMobile ? 'stretch' : 'center', 
              gap: '12px',
              marginBottom: '24px' 
            }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0 }}>Employee & Volunteer Roster</h2>
              <button 
                onClick={handleOpenCreateStaff} 
                style={{
                  padding: '10px 20px',
                  background: 'var(--color-primary-medium)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                  textAlign: 'center'
                }}
              >
                + Add Staff Member
              </button>
            </div>

            <div style={{ background: '#fff', borderRadius: '12px', overflowX: 'auto', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <table style={{ width: '100%', minWidth: '650px', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8faf9', borderBottom: '2px solid #eee' }}>
                    <th style={{ padding: '15px', color: '#555', fontSize: '0.85rem', fontWeight: '700' }}>Name</th>
                    <th style={{ padding: '15px', color: '#555', fontSize: '0.85rem', fontWeight: '700' }}>Role</th>
                    <th style={{ padding: '15px', color: '#555', fontSize: '0.85rem', fontWeight: '700' }}>WhatsApp Number</th>
                    <th style={{ padding: '15px', color: '#555', fontSize: '0.85rem', fontWeight: '700' }}>Specialization</th>
                    <th style={{ padding: '15px', color: '#555', fontSize: '0.85rem', fontWeight: '700' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staffList.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#777' }}>
                        No staff members found. Click '+ Add Staff Member' to create one.
                      </td>
                    </tr>
                  ) : (
                    staffList.map(member => (
                      <tr key={member.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '15px', fontWeight: '600' }}>{member.name}</td>
                        <td style={{ padding: '15px' }}>
                          <span style={{
                            backgroundColor: member.role?.name === 'VOLUNTEER' ? '#e0f2fe' : '#fef3c7',
                            color: member.role?.name === 'VOLUNTEER' ? '#0369a1' : '#b45309',
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: '600'
                          }}>
                            {member.role?.name}
                          </span>
                        </td>
                        <td style={{ padding: '15px', fontFamily: 'monospace' }}>{member.phone}</td>
                        <td style={{ padding: '15px', color: '#555' }}>
                          {member.employeeProfile?.specialization || 'N/A'}
                        </td>
                        <td style={{ padding: '15px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleOpenEditStaff(member)}
                              style={{
                                padding: '6px 12px',
                                background: '#f1f5f9',
                                color: '#1e293b',
                                border: 'none',
                                borderRadius: '4px',
                                fontWeight: '600',
                                fontSize: '0.8rem',
                                cursor: 'pointer'
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteStaff(member.id)}
                              style={{
                                padding: '6px 12px',
                                background: '#fee2e2',
                                color: '#b91c1c',
                                border: 'none',
                                borderRadius: '4px',
                                fontWeight: '600',
                                fontSize: '0.8rem',
                                cursor: 'pointer'
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* CREATE / EDIT STAFF MODAL */}
            {showStaffModal && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(3px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 999
              }}>
                <div style={{
                  background: '#fff',
                  borderRadius: '12px',
                  width: '95%',
                  maxWidth: '500px',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  padding: isMobile ? '20px 15px' : '30px',
                  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px', color: 'var(--color-primary-dark)' }}>
                    {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
                  </h3>

                  <form onSubmit={handleSaveStaff}>
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '6px', color: '#555' }}>Full Name</label>
                      <input 
                        type="text"
                        value={staffName}
                        onChange={(e) => setStaffName(e.target.value)}
                        required
                        placeholder="e.g. Dr. Rajesh Iyer"
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.9rem', outline: 'none' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '6px', color: '#555' }}>WhatsApp Number</label>
                        <input 
                          type="text"
                          value={staffPhone}
                          onChange={(e) => setStaffPhone(e.target.value)}
                          required
                          placeholder="e.g. +917654321098"
                          style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.9rem', outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '6px', color: '#555' }}>Staff Role</label>
                        <select
                          value={staffRole}
                          onChange={(e) => setStaffRole(e.target.value)}
                          style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.9rem', outline: 'none', background: '#fff' }}
                        >
                          <option value="EMPLOYEE">EMPLOYEE</option>
                          <option value="VOLUNTEER">VOLUNTEER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '6px', color: '#555' }}>Email Address (Optional)</label>
                      <input 
                        type="email"
                        value={staffEmail}
                        onChange={(e) => setStaffEmail(e.target.value)}
                        placeholder="e.g. rajesh@excelenergy.com"
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.9rem', outline: 'none' }}
                      />
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '6px', color: '#555' }}>Specialization / Designation</label>
                      <input 
                        type="text"
                        value={staffSpecialization}
                        onChange={(e) => setStaffSpecialization(e.target.value)}
                        placeholder="e.g. Advanced Pranic Healer"
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.9rem', outline: 'none' }}
                      />
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '6px', color: '#555' }}>Password {editingStaff && '(Leave blank to keep current)'}</label>
                      <input 
                        type="password"
                        value={staffPassword}
                        onChange={(e) => setStaffPassword(e.target.value)}
                        required={!editingStaff}
                        placeholder={editingStaff ? "••••••••" : "Enter account password"}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.9rem', outline: 'none' }}
                      />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '6px', color: '#555' }}>Bio / Description</label>
                      <textarea 
                        value={staffBio}
                        onChange={(e) => setStaffBio(e.target.value)}
                        rows={2}
                        placeholder="Enter bio or volunteer roles description details..."
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.9rem', outline: 'none', resize: 'none', fontFamily: 'inherit' }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifySelf: 'flex-end', gap: '10px' }}>
                      <button 
                        type="button" 
                        onClick={() => setShowStaffModal(false)}
                        style={{
                          padding: '10px 20px',
                          background: '#f1f5f9',
                          color: '#1e293b',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        style={{
                          padding: '10px 20px',
                          background: 'var(--color-primary-medium)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Save
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CONTACT FORMS TAB */}
        {activeTab === 'contacts' && (
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '24px' }}>Contact Form Queries Inbox</h2>
            
            {contacts.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)' }}>No messages found in Inbox.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {contacts.map(c => (
                  <div key={c.id} style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: c.status === 'UNREAD' ? '1px solid var(--color-accent)' : '1px solid #eee' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div>
                        <h4 style={{ fontWeight: 'bold' }}>{c.name}</h4>
                        <span style={{ fontSize: '0.8rem', color: '#666' }}>{c.phone} | {c.email}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {c.status === 'UNREAD' && (
                          <button onClick={() => markContactRead(c.id)} style={{ padding: '4px 10px', background: '#dcfce7', color: '#15803d', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>
                            Mark Read
                          </button>
                        )}
                        <button onClick={() => deleteContact(c.id)} style={{ padding: '4px 10px', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>
                          Delete
                        </button>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
                      {c.message}
                    </p>
                    <span style={{ fontSize: '0.75rem', color: '#999', display: 'block', marginTop: '10px' }}>
                      Submitted on: {new Date(c.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AUDIT LOGS TAB */}
        {activeTab === 'logs' && (
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '24px' }}>Administrative Audit Logs</h2>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', maxHeight: '500px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {logs.map(l => (
                  <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '8px', fontSize: '0.9rem' }}>
                    <div>
                      <span style={{ fontWeight: '600', color: 'var(--color-primary-medium)' }}>
                        [{l.user ? l.user.name : 'System'}]
                      </span>{' '}
                      <span>{l.action}</span>
                    </div>
                    <div style={{ color: '#999', fontSize: '0.8rem' }}>
                      IP: {l.ipAddress || 'Internal'} | {new Date(l.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '24px' }}>System Setup & API Credentials</h2>
            
            <form onSubmit={handleSaveSettings} style={{ background: '#fff', padding: isMobile ? '20px 15px' : '35px', borderRadius: '12px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '16px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                Company & GST Setup
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px' }}>Company Name</label>
                  <input
                    type="text"
                    value={settings.companyName}
                    onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px' }}>GST Number</label>
                  <input
                    type="text"
                    value={settings.gstNumber || ''}
                    onChange={(e) => setSettings({ ...settings, gstNumber: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                </div>
              </div>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '30px', marginBottom: '16px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                Razorpay API Gateway Credentials
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px' }}>Razorpay Key ID</label>
                  <input
                    type="text"
                    value={settings.razorpayKeyId || ''}
                    onChange={(e) => setSettings({ ...settings, razorpayKeyId: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px' }}>Razorpay Key Secret</label>
                  <input
                    type="password"
                    value={settings.razorpayKeySecret || ''}
                    onChange={(e) => setSettings({ ...settings, razorpayKeySecret: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                </div>
              </div>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '30px', marginBottom: '16px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                Notifications APIs Keys (SMS & WhatsApp)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px' }}>SMS API Provider Key</label>
                  <input
                    type="text"
                    value={settings.smsApiKey || ''}
                    onChange={(e) => setSettings({ ...settings, smsApiKey: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px' }}>WhatsApp Business Access token</label>
                  <input
                    type="text"
                    value={settings.whatsappApiKey || ''}
                    onChange={(e) => setSettings({ ...settings, whatsappApiKey: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                </div>
              </div>

              <button type="submit" style={{ padding: '12px 24px', background: 'var(--color-primary-medium)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', marginTop: '20px' }}>
                💾 Save Global Configurations
              </button>
            </form>
          </div>
        )}

        </div>
      </div>
    </div>
  );
}
