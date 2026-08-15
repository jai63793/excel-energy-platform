import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { logoutAction, updateProfileSuccess } from '../store/authSlice';
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

  // User Modal CRUD & Payment Link States
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [uName, setUName] = useState('');
  const [uPhone, setUPhone] = useState('');
  const [uEmail, setUEmail] = useState('');
  const [uAddress, setUAddress] = useState('');
  const [uPassword, setUPassword] = useState('');
  const [uStatus, setUStatus] = useState('ACTIVE');
  const [uPlan, setUPlan] = useState('1month');
  const [isPaymentLinkMode, setIsPaymentLinkMode] = useState(false);
  const [registrationResult, setRegistrationResult] = useState(null);

  // Payments List States
  const [payments, setPayments] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Contacts Inbox States
  const [contacts, setContacts] = useState([]);

  // Activity Logs States
  const [logs, setLogs] = useState([]);

  // Broadcast Builder States
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastDesc, setBroadcastDesc] = useState('');
  const [broadcastAudience, setBroadcastAudience] = useState('ALL');
  const [liveUrl, setLiveUrl] = useState('');
  const [broadcastLinkLabel, setBroadcastLinkLabel] = useState('');
  const [broadcastLinkUrl, setBroadcastLinkUrl] = useState('');
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [broadcastHistory, setBroadcastHistory] = useState([]);

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

  // Profile edit states
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profileAddress, setProfileAddress] = useState(user?.address || '');
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileEmail(user.email || '');
      setProfileAddress(user.address || '');
    }
  }, [user]);

  // Staff States
  const [staffList, setStaffList] = useState([]);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  
  // Bookings Admin States
  const [adminBookings, setAdminBookings] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [assignHealerId, setAssignHealerId] = useState('');

  // Attendance Logs States
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [attendanceEmployeeFilter, setAttendanceEmployeeFilter] = useState('');
  const [attendanceMonthFilter, setAttendanceMonthFilter] = useState(String(new Date().getMonth() + 1));
  const [attendanceYearFilter, setAttendanceYearFilter] = useState(String(new Date().getFullYear()));
  
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

  const loadAdminBookings = async () => {
    try {
      const response = await api.get('/admin/bookings');
      if (response.data.success) {
        setAdminBookings(response.data.bookings || []);
      }
    } catch (err) {
      toast.error('Failed to load bookings list.');
    }
  };

  const loadAttendanceLogs = async () => {
    try {
      const params = {};
      if (attendanceEmployeeFilter) params.userId = attendanceEmployeeFilter;
      if (attendanceYearFilter && attendanceYearFilter !== 'all') params.year = attendanceYearFilter;
      if (attendanceMonthFilter && attendanceMonthFilter !== 'all') params.month = attendanceMonthFilter;

      const response = await api.get('/admin/attendance', { params });
      if (response.data.success) {
        setAttendanceLogs(response.data.logs || []);
      }
    } catch (err) {
      toast.error('Failed to load attendance logs.');
    }
  };

  const downloadAttendanceExcel = () => {
    if (attendanceLogs.length === 0) {
      toast.error('No attendance data available to download.');
      return;
    }

    const headers = [
      'Employee ID',
      'Employee Name',
      'Phone Number',
      'Role',
      'Check-In Date & Time',
      'Check-Out Date & Time',
      'Duration Worked (Hours)',
      'Status',
      'Notes'
    ];

    const rows = attendanceLogs.map(log => {
      const checkInDate = new Date(log.checkIn);
      const checkOutDate = log.checkOut ? new Date(log.checkOut) : null;
      
      const checkInStr = checkInDate.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      
      const checkOutStr = checkOutDate 
        ? checkOutDate.toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })
        : 'Active / Checked In';

      let durationHours = 'N/A';
      if (checkOutDate) {
        const diffMs = checkOutDate - checkInDate;
        durationHours = (diffMs / (1000 * 60 * 60)).toFixed(2);
      }

      const escapeCSV = (val) => {
        if (val === null || val === undefined) return '';
        const stringVal = String(val);
        if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
          return `"${stringVal.replace(/"/g, '""')}"`;
        }
        return stringVal;
      };

      return [
        log.userId,
        log.user?.name,
        log.user?.phone,
        log.user?.role?.name || 'EMPLOYEE',
        checkInStr,
        checkOutStr,
        durationHours,
        log.status,
        log.notes || ''
      ].map(escapeCSV).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthName = attendanceMonthFilter === 'all' 
      ? 'All_Months' 
      : monthNames[Number(attendanceMonthFilter) - 1];
    const yearName = attendanceYearFilter === 'all' ? 'All_Years' : attendanceYearFilter;
    
    link.href = url;
    link.setAttribute('download', `attendance_report_${monthName}_${yearName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Attendance report downloaded successfully.');
  };

  const handleOpenAssignModal = (booking) => {
    setSelectedBooking(booking);
    setAssignHealerId(booking.healerId ? String(booking.healerId) : '');
    setShowAssignModal(true);
  };

  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    if (!assignHealerId) {
      toast.error('Please select a healer/staff member.');
      return;
    }

    try {
      toast.loading('Assigning healer...');
      const response = await api.put(`/admin/bookings/${selectedBooking.id}`, { healerId: Number(assignHealerId) });
      toast.dismiss();

      if (response.data.success) {
        toast.success(response.data.message || 'Healer assigned successfully!');
        setShowAssignModal(false);
        loadAdminBookings();
      }
    } catch (err) {
      toast.dismiss();
      toast.error(err.response?.data?.message || 'Failed to assign healer.');
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

  // Load templates on mount
  useEffect(() => {
    const stored = localStorage.getItem('excel_energy_broadcast_templates');
    if (stored) {
      try {
        setSavedTemplates(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse saved templates:', e);
      }
    }
  }, []);

  // Pull configurations on load
  useEffect(() => {
    if (activeTab === 'stats') loadDashboardStats();
    if (activeTab === 'users') loadUsersList(1);
    if (activeTab === 'payments') loadPaymentsList();
    if (activeTab === 'contacts') loadContactsList();
    if (activeTab === 'logs') loadActivityLogs();
    if (activeTab === 'settings') {
      // settings loading no longer required for system configuration
    }
    if (activeTab === 'staff') loadStaffList();
    if (activeTab === 'broadcast') loadBroadcastHistory();
    if (activeTab === 'bookingsAdmin') {
      loadAdminBookings();
      loadStaffList();
    }
    if (activeTab === 'attendance') {
      loadAttendanceLogs();
      loadStaffList();
    }
  }, [activeTab, userSearch, userStatusFilter, attendanceEmployeeFilter, attendanceMonthFilter, attendanceYearFilter]);

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

  const handleVerifyPaymentLink = async (paymentId) => {
    toast.loading('Checking payment link status directly from Razorpay API...');
    try {
      const res = await api.post(`/admin/payments/verify-link/${paymentId}`);
      toast.dismiss();
      if (res.data.success) {
        toast.success(res.data.message || 'Payment verified and account activated successfully!');
        loadPaymentsList();
        loadUsersList(userPagination.currentPage);
      }
    } catch (err) {
      toast.dismiss();
      toast.error(err.response?.data?.message || 'Verification failed. Payment might still be pending.');
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
        toast.success('User deactivated.');
        loadUsersList(userPagination.currentPage);
      }
    } catch (err) {
      toast.error('Failed to deactivate user.');
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

  const handleOpenCreateUser = () => {
    setEditingUser(null);
    setUName('');
    setUPhone('');
    setUEmail('');
    setUAddress('');
    setUPassword('');
    setUPlan('1month');
    setUStatus('ACTIVE');
    setIsPaymentLinkMode(true);
    setRegistrationResult(null);
    setShowUserModal(true);
  };

  const handleOpenEditUser = (member) => {
    setEditingUser(member);
    setUName(member.name || '');
    setUPhone(member.phone || '');
    setUEmail(member.email || '');
    setUAddress(member.address || '');
    setUPassword('');
    setUStatus(member.status || 'ACTIVE');
    setIsPaymentLinkMode(false);
    setRegistrationResult(null);
    setShowUserModal(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!uName || !uPhone) {
      toast.error('Name and Phone/WhatsApp number are required.');
      return;
    }

    const payload = {
      name: uName,
      phone: uPhone,
      email: uEmail || null,
      address: uAddress || null,
      status: uStatus,
      password: uPassword || undefined
    };

    try {
      if (editingUser) {
        toast.loading('Updating user account...');
        const res = await api.put(`/admin/users/${editingUser.id}`, payload);
        toast.dismiss();
        if (res.data.success) {
          toast.success('User updated successfully!');
          setShowUserModal(false);
          loadUsersList(userPagination.currentPage);
        }
      } else {
        if (isPaymentLinkMode) {
          toast.loading('Registering user and generating payment link...');
          const res = await api.post('/admin/register-user-payment-link', {
            ...payload,
            plan: uPlan
          });
          toast.dismiss();
          if (res.data.success) {
            toast.success(res.data.message);
            setRegistrationResult(res.data);
            loadUsersList(1);
          }
        } else {
          toast.loading('Creating user directly...');
          const res = await api.post('/admin/users', {
            ...payload,
            plan: uPlan
          });
          toast.dismiss();
          if (res.data.success) {
            toast.success('User created successfully!');
            setRegistrationResult(res.data);
            loadUsersList(1);
          }
        }
      }
    } catch (err) {
      toast.dismiss();
      toast.error(err.response?.data?.message || 'Failed to save user.');
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

  const loadBroadcastHistory = async () => {
    try {
      const response = await api.get('/admin/broadcasts');
      if (response.data.success) {
        setBroadcastHistory(response.data.broadcasts || []);
      }
    } catch (err) {
      console.error('Failed to load broadcast history:', err.message);
    }
  };

  const fillFormFromBroadcast = (b) => {
    setBroadcastTitle(b.title || '');
    setBroadcastAudience(b.targetAudience || 'ALL');
    
    const desc = b.description || '';
    const linkRegex = /\n\n🔗 (.*?): (https?:\/\/\S+)/;
    const match = desc.match(linkRegex);
    
    if (match) {
      const rawDesc = desc.replace(linkRegex, '');
      setBroadcastDesc(rawDesc.trim());
      setBroadcastLinkLabel(match[1] === 'Link' ? '' : match[1]);
      setBroadcastLinkUrl(match[2]);
    } else {
      setBroadcastDesc(desc.trim());
      setBroadcastLinkLabel('');
      setBroadcastLinkUrl('');
    }
    toast.success('Form pre-filled with selected broadcast history.');
  };

  // Broadcast builders
  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastDesc) {
      toast.error('Title and message text are required.');
      return;
    }

    let finalDesc = broadcastDesc;
    if (broadcastLinkUrl) {
      const labelText = broadcastLinkLabel ? `${broadcastLinkLabel}: ` : 'Link: ';
      finalDesc += `\n\n🔗 ${labelText}${broadcastLinkUrl}`;
    }

    try {
      toast.loading('Sending broadcast...');
      const response = await api.post('/admin/notify-bulk', {
        title: broadcastTitle,
        description: finalDesc,
        targetAudience: broadcastAudience
      });
      toast.dismiss();

      if (response.data.success) {
        toast.success(response.data.message);

        // Save this template in history
        const newTemplate = {
          id: Date.now(),
          title: broadcastTitle,
          description: broadcastDesc,
          linkLabel: broadcastLinkLabel,
          linkUrl: broadcastLinkUrl,
          audience: broadcastAudience
        };

        const updated = [newTemplate, ...savedTemplates.filter(t => t.title !== broadcastTitle || t.description !== broadcastDesc)].slice(0, 10);
        setSavedTemplates(updated);
        localStorage.setItem('excel_energy_broadcast_templates', JSON.stringify(updated));

        // Reset
        setBroadcastTitle('');
        setBroadcastDesc('');
        setBroadcastLinkLabel('');
        setBroadcastLinkUrl('');
        loadBroadcastHistory();
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

  // Profile update action
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profileName || !profileEmail) {
      toast.error('Name and Email are required.');
      return;
    }

    try {
      toast.loading('Saving profile updates...');
      const response = await api.put('/auth/profile', {
        name: profileName,
        email: profileEmail,
        address: profileAddress
      });
      toast.dismiss();

      if (response.data.success) {
        dispatch(updateProfileSuccess(response.data.user));
        toast.success('Profile details updated successfully!');
      }
    } catch (err) {
      toast.dismiss();
      toast.error(err.response?.data?.message || 'Failed to update profile details.');
    }
  };

  // Password update action
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error('Both current password and new password are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }

    try {
      toast.loading('Updating password...');
      const response = await api.put('/auth/change-password', {
        currentPassword,
        newPassword
      });
      toast.dismiss();

      if (response.data.success) {
        toast.success('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      toast.dismiss();
      toast.error(err.response?.data?.message || 'Failed to change password.');
    }
  };

  // Simulated Excel export helper
  const handleExportPayments = () => {
    const baseList = selectedMonth === 'all' ? payments : payments.filter(p => {
      const d = new Date(p.createdAt);
      return d.getMonth() === Number(selectedMonth) && d.getFullYear() === selectedYear;
    });
    const filtered = baseList.filter(p => p.status === 'SUCCESS');

    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Invoice Number,Customer Name,Customer Phone,Amount,Status,Date"].join(",") + "\n"
      + filtered.map(p => `"${p.invoiceNumber || 'Pending'}","${p.user?.name || 'N/A'}","${p.user?.phone || 'N/A'}",${p.amount},"${p.status}","${new Date(p.createdAt).toLocaleDateString()}"`).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const filename = selectedMonth === 'all' 
      ? `excel_energy_payments_all_${Date.now()}.csv` 
      : `excel_energy_payments_${selectedYear}_month_${Number(selectedMonth)+1}_${Date.now()}.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              .status-inactive { background: #fee2e2; color: #dc2626; }
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
                        <span class="status-badge ${u.status === 'ACTIVE' ? 'status-active' : 'status-inactive'}">
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

  const handleDownloadUsersExcel = async (type) => {
    toast.loading(`Loading user records for ${type} Excel export...`);
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
      if (type === 'all') {
        filteredUsers = allUsers;
      } else if (type === 'paid') {
        filteredUsers = allUsers.filter(u => {
          if (u.subscriptions.length === 0) return false;
          const sub = u.subscriptions[0];
          return sub.status === 'ACTIVE' && new Date(sub.endDate) >= now;
        });
      } else if (type === 'unpaid') {
        filteredUsers = allUsers.filter(u => {
          if (u.subscriptions.length === 0) return true;
          const sub = u.subscriptions[0];
          return sub.status !== 'ACTIVE' || new Date(sub.endDate) < now;
        });
      }

      const headers = ['Username', 'Full Name', 'WhatsApp Phone', 'Email', 'Address', 'Status', 'Subscription Validity'];
      const rows = filteredUsers.map(u => {
        const latestSub = u.subscriptions[0];
        let validityText = 'No Subscription';
        if (latestSub) {
          validityText = `${latestSub.status} (Exp: ${new Date(latestSub.endDate).toLocaleDateString('en-IN')})`;
        }
        return [
          u.username || 'N/A',
          u.name || 'N/A',
          u.phone || 'N/A',
          u.email || 'N/A',
          u.address || 'N/A',
          u.status || 'ACTIVE',
          validityText
        ];
      });

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(",")].concat(rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))).join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `excel_energy_users_${type}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`${type.toUpperCase()} Users Excel downloaded successfully.`);
    } catch (err) {
      toast.dismiss();
      console.error('Excel Export Error:', err);
      toast.error('Failed to export Excel.');
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
            { id: 'attendance', label: 'Employee Attendance Logs' },
            { id: 'liveControl', label: 'Live Session Control & WhatsApp' },
            { id: 'bookingsAdmin', label: '1-on-1 Member Bookings' },
            { id: 'payments', label: 'Payments & Invoices Log' },
            { id: 'broadcast', label: 'Broadcast Stream' },
            { id: 'contacts', label: 'Contact Forms', count: contacts.filter(c => c.status === 'UNREAD').length },
            { id: 'logs', label: 'Audit History' },
            { id: 'settings', label: 'Edit Profile' }
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'var(--color-primary-medium)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '10px 15px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          🏠 Go to Website Home
        </button>

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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          🚪 Logout Panel
        </button>
      </div>
    </>
  );

  // Calculate dynamic monthly report stats for payments register
  const getMonthlyStats = () => {
    const targets = selectedMonth === 'all' ? payments : payments.filter(p => {
      const d = new Date(p.createdAt);
      return d.getMonth() === Number(selectedMonth) && d.getFullYear() === selectedYear;
    });

    const successPayments = targets.filter(p => p.status === 'SUCCESS');
    const totalRev = successPayments.reduce((sum, p) => sum + p.amount, 0);
    
    const plans = { '1month': 0, '3month': 0, '6month': 0 };
    successPayments.forEach(p => {
      if (p.amount === 1770) plans['1month']++;
      else if (p.amount === 5310) plans['3month']++;
      else if (p.amount === 10620) plans['6month']++;
    });

    return {
      filteredList: targets,
      successCount: successPayments.length,
      revenue: totalRev,
      plans
    };
  };

  const monthStats = getMonthlyStats();

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
                  onClick={handleOpenCreateUser}
                  style={{
                    padding: '8px 16px',
                    background: 'var(--color-primary-medium)',
                    color: '#fff',
                    border: 'none',
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
                  + Add User / Send Link
                </button>
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
                <button
                  type="button"
                  onClick={() => handleDownloadUsersExcel('all')}
                  style={{
                    padding: '8px 16px',
                    background: '#f8fafc',
                    color: '#0f172a',
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
                  📊 Excel All Users
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadUsersExcel('paid')}
                  style={{
                    padding: '8px 16px',
                    background: '#ecfdf5',
                    color: '#047857',
                    border: '1px solid #a7f3d0',
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
                  🟢 Excel Paid Users
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadUsersExcel('unpaid')}
                  style={{
                    padding: '8px 16px',
                    background: '#fff5f5',
                    color: '#c53030',
                    border: '1px solid #feb2b2',
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
                  🔴 Excel Unpaid Users
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
                <option value="INACTIVE">INACTIVE</option>
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
                      <td style={{ padding: '15px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button onClick={() => handleOpenEditUser(u)} style={{ padding: '5px 10px', background: '#f1f5f9', color: '#1e293b', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>
                          Edit
                        </button>
                        {u.status === 'ACTIVE' ? (
                          <button onClick={() => handleUserSuspend(u.id)} style={{ padding: '5px 10px', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>
                            Deactivate
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

            {/* CREATE / EDIT USER MODAL */}
            {showUserModal && (
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
                  {registrationResult ? (
                    // Registration Success / Payment Link Result View
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '20px', color: '#16a34a', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                        Success! Profile Configured
                      </h3>
                      
                      <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', color: '#334155' }}>
                        {registrationResult.user.username && (
                          <p style={{ margin: '8px 0' }}><strong>Username:</strong> {registrationResult.user.username}</p>
                        )}
                        {registrationResult.tempPassword && (
                          <p style={{ margin: '8px 0' }}><strong>Temporary Password:</strong> {registrationResult.tempPassword}</p>
                        )}
                        {registrationResult.paymentLinkUrl && (
                          <p style={{ margin: '8px 0', wordBreak: 'break-all' }}>
                            <strong>Payment Link:</strong> <a href={registrationResult.paymentLinkUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary-medium)', fontWeight: 'bold' }}>{registrationResult.paymentLinkUrl}</a>
                          </p>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {registrationResult.paymentLinkUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(registrationResult.paymentLinkUrl);
                              toast.success('Payment Link copied to clipboard!');
                            }}
                            style={{ padding: '10px', background: 'var(--color-primary-medium)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                          >
                            📋 Copy Payment Link
                          </button>
                        )}
                        
                        {registrationResult.paymentLinkUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              let text = `Hello ${registrationResult.user.name},\n\n`;
                              if (registrationResult.user.isNewUser) {
                                text += `Your Excel Energy account is ready to be created! To complete your registration and activate your membership access, please complete your payment of ₹${registrationResult.amount} using this link:\n\n🔗 ${registrationResult.paymentLinkUrl}\n\n`;
                                if (registrationResult.tempPassword) {
                                  text += `Login Credentials (will activate upon successful payment):\n👤 Username: ${registrationResult.user.username}\n🔑 Temporary Password: ${registrationResult.tempPassword}\n\n`;
                                }
                              } else {
                                text += `Your Excel Energy account has been registered! To activate your subscription access, please complete your payment of ₹${registrationResult.amount} using this link:\n\n🔗 ${registrationResult.paymentLinkUrl}\n\n`;
                                text += `Please log in using your existing account credentials.\n\n`;
                              }
                              text += `Thank you for choosing Excel Energy!`;

                              const cleanPhone = registrationResult.user.phone.replace(/[+\s-]/g, '');
                              const encodedText = encodeURIComponent(text);
                              const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;
                              window.open(whatsappUrl, '_blank');
                            }}
                            style={{ padding: '10px', background: '#128C7E', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                          >
                            💬 Send to WhatsApp
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            let text = `Hello ${registrationResult.user.name},\n\n`;
                            if (registrationResult.user.isNewUser) {
                              text += `Your Excel Energy account is ready to be created! To complete your registration and activate your membership access, please complete your payment of ₹${registrationResult.amount} using this link:\n\n🔗 ${registrationResult.paymentLinkUrl || ''}\n\n`;
                              if (registrationResult.tempPassword) {
                                text += `Login Credentials (will activate upon successful payment):\n👤 Username: ${registrationResult.user.username}\n🔑 Temporary Password: ${registrationResult.tempPassword}\n\n`;
                              }
                            } else {
                              text += `Your Excel Energy account has been registered! To activate your subscription access, please complete your payment of ₹${registrationResult.amount} using this link:\n\n🔗 ${registrationResult.paymentLinkUrl || ''}\n\n`;
                              text += `Please log in using your existing account credentials.\n\n`;
                            }
                            text += `Thank you for choosing Excel Energy!`;
                            
                            navigator.clipboard.writeText(text);
                            toast.success('WhatsApp message template copied!');
                          }}
                          style={{ padding: '10px', background: '#25d366', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                        >
                          📋 Copy WhatsApp Message
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowUserModal(false);
                            setRegistrationResult(null);
                          }}
                          style={{ padding: '10px', background: '#e2e8f0', color: '#1e293b', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                        >
                          Close Panel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Standard Form View
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px', color: 'var(--color-primary-dark)' }}>
                        {editingUser ? 'Edit Member Profile' : 'Register New Member'}
                      </h3>

                      <form onSubmit={handleSaveUser}>
                        <div style={{ marginBottom: '14px' }}>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '6px', color: '#555' }}>Full Name</label>
                          <input 
                            type="text"
                            value={uName}
                            onChange={(e) => setUName(e.target.value)}
                            required
                            placeholder="e.g. Sanjay Kumar"
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.9rem', outline: 'none' }}
                          />
                        </div>

                        <div style={{ marginBottom: '14px' }}>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '6px', color: '#555' }}>WhatsApp / Mobile Number</label>
                          <input 
                            type="text"
                            value={uPhone}
                            onChange={(e) => setUPhone(e.target.value)}
                            required
                            placeholder="e.g. +919876543210"
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.9rem', outline: 'none' }}
                          />
                        </div>

                        <div style={{ marginBottom: '14px' }}>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '6px', color: '#555' }}>Email Address (Optional)</label>
                          <input 
                            type="email"
                            value={uEmail}
                            onChange={(e) => setUEmail(e.target.value)}
                            placeholder="e.g. sanjay@gmail.com"
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.9rem', outline: 'none' }}
                          />
                        </div>

                        <div style={{ marginBottom: '14px' }}>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '6px', color: '#555' }}>Physical Address (Optional)</label>
                          <input 
                            type="text"
                            value={uAddress}
                            onChange={(e) => setUAddress(e.target.value)}
                            placeholder="e.g. Bengaluru, India"
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.9rem', outline: 'none' }}
                          />
                        </div>

                        {editingUser && (
                          // Edit mode status input
                          <div style={{ marginBottom: '14px' }}>
                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '6px', color: '#555' }}>Account Status</label>
                            <select
                              value={uStatus}
                              onChange={(e) => setUStatus(e.target.value)}
                              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.9rem', outline: 'none', background: '#fff' }}
                            >
                              <option value="ACTIVE">ACTIVE</option>
                              <option value="INACTIVE">INACTIVE</option>
                            </select>
                          </div>
                        )}

                        <div style={{ marginBottom: '20px' }}>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '6px', color: '#555' }}>
                            {editingUser ? 'Change Password (Leave blank to keep current)' : 'Account Password (Optional)'}
                          </label>
                          <input 
                            type="password"
                            value={uPassword}
                            onChange={(e) => setUPassword(e.target.value)}
                            placeholder={editingUser ? "••••••••" : "Leave blank to auto-generate"}
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.9rem', outline: 'none' }}
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                          <button 
                            type="button" 
                            onClick={() => setShowUserModal(false)}
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
                            {editingUser ? 'Save Changes' : 'Register'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            )}
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
              <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0 }}>Payments Register & Sales Reports</h2>
              
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label htmlFor="month-select" style={{ fontSize: '0.85rem', fontWeight: '600', color: '#555' }}>Month:</label>
                  <select
                    id="month-select"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', background: '#fff', fontSize: '0.9rem' }}
                  >
                    <option value="all">All Months (All Time)</option>
                    <option value={0}>January</option>
                    <option value={1}>February</option>
                    <option value={2}>March</option>
                    <option value={3}>April</option>
                    <option value={4}>May</option>
                    <option value={5}>June</option>
                    <option value={6}>July</option>
                    <option value={7}>August</option>
                    <option value={8}>September</option>
                    <option value={9}>October</option>
                    <option value={10}>November</option>
                    <option value={11}>December</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label htmlFor="year-select" style={{ fontSize: '0.85rem', fontWeight: '600', color: '#555' }}>Year:</label>
                  <select
                    id="year-select"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', background: '#fff', fontSize: '0.9rem' }}
                  >
                    <option value={2024}>2024</option>
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                    <option value={2027}>2027</option>
                  </select>
                </div>

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
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  📥 Export CSV / Excel
                </button>
              </div>
            </div>

            {/* Monthly Sales Report Card Panel */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: '20px',
              marginBottom: '24px'
            }}>
              {/* Monthly Revenue Card */}
              <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1.5px solid #edf2f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <span style={{ fontSize: '0.78rem', color: '#777', fontWeight: '600', textTransform: 'uppercase' }}>
                  {selectedMonth === 'all' ? 'All-Time Revenue' : 'Selected Monthly Revenue'}
                </span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--color-primary-medium)', margin: '6px 0 0 0' }}>
                  ₹{monthStats.revenue.toLocaleString('en-IN')}
                </h3>
              </div>

              {/* Successful Sales Card */}
              <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1.5px solid #edf2f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <span style={{ fontSize: '0.78rem', color: '#777', fontWeight: '600', textTransform: 'uppercase' }}>
                  Successful Transactions
                </span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--color-primary-dark)', margin: '6px 0 0 0' }}>
                  {monthStats.successCount} Sales
                </h3>
              </div>

              {/* Subscription Breakdown Card */}
              <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1.5px solid #edf2f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <span style={{ fontSize: '0.78rem', color: '#777', fontWeight: '600', textTransform: 'uppercase' }}>
                  Plan Breakdown
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: '#555', fontWeight: '500' }}>1 Month (₹1,770):</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>{monthStats.plans['1month']} sold</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: '#555', fontWeight: '500' }}>3 Month (₹5,310):</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>{monthStats.plans['3month']} sold</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: '#555', fontWeight: '500' }}>6 Month (₹10,620):</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>{monthStats.plans['6month']} sold</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: '12px', overflowX: 'auto', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8faf9', borderBottom: '2px solid #eee' }}>
                    <th style={{ padding: '15px' }}>Invoice ID</th>
                    <th style={{ padding: '15px' }}>Customer Details</th>
                    <th style={{ padding: '15px' }}>Date</th>
                    <th style={{ padding: '15px' }}>Amount</th>
                    <th style={{ padding: '15px' }}>Gateway Status</th>
                    <th style={{ padding: '15px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {monthStats.filteredList.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#777' }}>
                        No transactions recorded for this month criteria.
                      </td>
                    </tr>
                  ) : (
                    monthStats.filteredList.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '15px', fontWeight: '600' }}>{p.invoiceNumber || 'Pending'}</td>
                        <td style={{ padding: '15px' }}>
                          <div>{p.user?.name || 'N/A'}</div>
                          <div style={{ fontSize: '0.8rem', color: '#777' }}>{p.user?.phone || 'N/A'}</div>
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
                        <td style={{ padding: '15px' }}>
                          {p.status === 'PENDING' && (
                            <button
                              type="button"
                              onClick={() => handleVerifyPaymentLink(p.id)}
                              style={{
                                padding: '4px 8px',
                                background: 'var(--color-primary-medium)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '0.78rem',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              🔄 Verify Status
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BROADCAST ANNOUNCEMENTS TAB */}
        {activeTab === 'broadcast' && (
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '30px' }}>Broadcast stream notifications</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr 1.2fr', gap: isMobile ? '20px' : '25px' }}>
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

                  <div style={{ marginBottom: '16px' }}>
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

                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '6px', color: '#555' }}>LinkLabel (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Join Session, Watch video"
                        value={broadcastLinkLabel}
                        onChange={(e) => setBroadcastLinkLabel(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.9rem', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '6px', color: '#555' }}>Link URL (Optional)</label>
                      <input
                        type="url"
                        placeholder="e.g. https://youtube.com/watch?v=..."
                        value={broadcastLinkUrl}
                        onChange={(e) => setBroadcastLinkUrl(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.9rem', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <button type="submit" style={{ width: '100%', padding: '12px', background: 'var(--color-primary-medium)', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: '600', cursor: 'pointer' }}>
                    Broadcast Notification & WhatsApp
                  </button>
                </form>
              </div>

              {/* Column 2: Previous Broadcasts History */}
              <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '680px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #eee', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📢</span> Sent Broadcasts
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#777', marginBottom: '15px' }}>
                  Click on any title below to quickly autofill and reuse the message.
                </p>

                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }} className="custom-scrollbar">
                  {broadcastHistory.length === 0 ? (
                    <div style={{ padding: '40px 10px', textAlign: 'center', color: '#999', fontSize: '0.9rem', border: '1px dashed #e2e8f0', borderRadius: '8px' }}>
                      No previous broadcasts found.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {broadcastHistory.map((b) => (
                        <div
                          key={b.id}
                          onClick={() => fillFormFromBroadcast(b)}
                          style={{
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            textAlign: 'left',
                            background: '#f8fafc'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-primary-medium)';
                            e.currentTarget.style.backgroundColor = '#f1f5f9';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#e2e8f0';
                            e.currentTarget.style.backgroundColor = '#f8fafc';
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                            <span style={{
                              backgroundColor: b.targetAudience === 'ALL' ? '#dbeafe' : b.targetAudience === 'PAID' ? '#dcfce7' : '#fee2e2',
                              color: b.targetAudience === 'ALL' ? '#1e40af' : b.targetAudience === 'PAID' ? '#15803d' : '#b91c1c',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '0.7rem',
                              fontWeight: '600'
                            }}>
                              {b.targetAudience === 'ALL' ? 'ALL' : b.targetAudience === 'PAID' ? 'PAID' : 'UNPAID'}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                              {new Date(b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                          
                          <h4 style={{ fontWeight: '600', fontSize: '0.92rem', color: '#1e293b', marginBottom: '4px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {b.title}
                          </h4>
                          
                          <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0, display: '-webkit-box', WebKitLineClamp: 2, WebKitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.2' }}>
                            {b.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Form 3: YouTube Live Broadcast Link */}
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
        {activeTab === 'bookingsAdmin' && (
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '24px' }}>1-on-1 Healer Consultations Bookings</h2>
            
            <div style={{ background: '#fff', borderRadius: '12px', overflowX: 'auto', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8faf9', borderBottom: '2px solid #eee' }}>
                    <th style={{ padding: '15px', color: '#555', fontSize: '0.85rem', fontWeight: '700' }}>Booking ID</th>
                    <th style={{ padding: '15px', color: '#555', fontSize: '0.85rem', fontWeight: '700' }}>Member Details</th>
                    <th style={{ padding: '15px', color: '#555', fontSize: '0.85rem', fontWeight: '700' }}>Session Details</th>
                    <th style={{ padding: '15px', color: '#555', fontSize: '0.85rem', fontWeight: '700' }}>Date & Slot</th>
                    <th style={{ padding: '15px', color: '#555', fontSize: '0.85rem', fontWeight: '700' }}>Assigned Practitioner</th>
                    <th style={{ padding: '15px', color: '#555', fontSize: '0.85rem', fontWeight: '700' }}>Status</th>
                    <th style={{ padding: '15px', color: '#555', fontSize: '0.85rem', fontWeight: '700' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {adminBookings.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: '#777' }}>
                        No 1-on-1 bookings found.
                      </td>
                    </tr>
                  ) : (
                    adminBookings.map((b) => (
                      <tr key={b.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '15px', fontWeight: '600' }}>#{b.id}</td>
                        <td style={{ padding: '15px' }}>
                          <div style={{ fontWeight: '600' }}>{b.user?.name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#666' }}>{b.user?.phone}</div>
                        </td>
                        <td style={{ padding: '15px', fontSize: '0.9rem' }}>{b.sessionType}</td>
                        <td style={{ padding: '15px', fontSize: '0.9rem' }}>
                          <div>{new Date(b.bookingDate).toLocaleDateString('en-IN')}</div>
                          <div style={{ fontSize: '0.8rem', color: '#666' }}>{b.timeSlot}</div>
                        </td>
                        <td style={{ padding: '15px' }}>
                          {b.healer ? (
                            <div>
                              <div style={{ fontWeight: '600', color: 'var(--color-primary-medium)' }}>{b.healer.name}</div>
                              <div style={{ fontSize: '0.78rem', color: '#777' }}>{b.healer.phone}</div>
                            </div>
                          ) : (
                            <span style={{
                              backgroundColor: '#fee2e2',
                              color: '#b91c1c',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontSize: '0.78rem',
                              fontWeight: '600'
                            }}>
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '15px' }}>
                          <span style={{
                            backgroundColor:
                              b.status === 'CONFIRMED' ? '#dcfce7' :
                              b.status === 'PENDING' ? '#fef3c7' :
                              b.status === 'COMPLETED' ? '#dbeafe' : '#fee2e2',
                            color:
                              b.status === 'CONFIRMED' ? '#15803d' :
                              b.status === 'PENDING' ? '#b45309' :
                              b.status === 'COMPLETED' ? '#1e40af' : '#b91c1c',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold'
                          }}>
                            {b.status}
                          </span>
                        </td>
                        <td style={{ padding: '15px' }}>
                          <button
                            onClick={() => handleOpenAssignModal(b)}
                            style={{
                              padding: '6px 12px',
                              background: 'var(--color-primary-light)',
                              color: 'var(--color-primary-medium)',
                              border: 'none',
                              borderRadius: '4px',
                              fontWeight: '600',
                              fontSize: '0.8rem',
                              cursor: 'pointer'
                            }}
                          >
                            Assign Staff
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* ASSIGN HEALER MODAL */}
            {showAssignModal && selectedBooking && (
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
                  maxWidth: '450px',
                  padding: '30px',
                  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '16px', borderBottom: '1px solid #eee', paddingBottom: '10px', color: 'var(--color-primary-dark)' }}>
                    Assign Staff Member
                  </h3>

                  <div style={{ fontSize: '0.9rem', marginBottom: '20px', color: '#555' }}>
                    <p style={{ margin: '4px 0' }}><strong>Booking ID:</strong> #{selectedBooking.id}</p>
                    <p style={{ margin: '4px 0' }}><strong>Client Name:</strong> {selectedBooking.user?.name}</p>
                    <p style={{ margin: '4px 0' }}><strong>Session Type:</strong> {selectedBooking.sessionType}</p>
                    <p style={{ margin: '4px 0' }}><strong>Date & Slot:</strong> {new Date(selectedBooking.bookingDate).toLocaleDateString('en-IN')} ({selectedBooking.timeSlot})</p>
                  </div>

                  <form onSubmit={handleSaveAssignment}>
                    <div style={{ marginBottom: '24px' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                        Select Staff / Employee
                      </label>
                      <select
                        value={assignHealerId}
                        onChange={(e) => setAssignHealerId(e.target.value)}
                        required
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.9rem', background: '#fff', outline: 'none' }}
                      >
                        <option value="">-- Choose Staff Member --</option>
                        {staffList
                          .filter(s => s.role?.name === 'EMPLOYEE' || s.role?.name === 'VOLUNTEER' || s.role?.name === 'ADMIN')
                          .map(s => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.role?.name || 'Staff'} - {s.employeeProfile?.specialization || 'Healer'})
                            </option>
                          ))
                        }
                      </select>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setShowAssignModal(false)}
                        style={{
                          padding: '10px 18px',
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
                          padding: '10px 18px',
                          background: 'var(--color-primary-medium)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Confirm Assignment
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
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

        {/* ATTENDANCE TAB */}
        {activeTab === 'attendance' && (
          <div>
            <div style={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row', 
              justifyContent: 'space-between', 
              alignItems: isMobile ? 'stretch' : 'center', 
              gap: '12px',
              marginBottom: '24px' 
            }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0 }}>Employee & Volunteer Attendance Logs</h2>
              
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label htmlFor="att-employee" style={{ fontSize: '0.85rem', fontWeight: '600', color: '#555' }}>Employee:</label>
                  <select
                    id="att-employee"
                    value={attendanceEmployeeFilter}
                    onChange={(e) => setAttendanceEmployeeFilter(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', background: '#fff', fontSize: '0.9rem' }}
                  >
                    <option value="">All Employees</option>
                    {staffList.map(member => (
                      <option key={member.id} value={member.id}>{member.name} ({member.role?.name || 'Practitioner'})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label htmlFor="att-month" style={{ fontSize: '0.85rem', fontWeight: '600', color: '#555' }}>Month:</label>
                  <select
                    id="att-month"
                    value={attendanceMonthFilter}
                    onChange={(e) => setAttendanceMonthFilter(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', background: '#fff', fontSize: '0.9rem' }}
                  >
                    <option value="all">All Months (All Time)</option>
                    <option value="1">January</option>
                    <option value="2">February</option>
                    <option value="3">March</option>
                    <option value="4">April</option>
                    <option value="5">May</option>
                    <option value="6">June</option>
                    <option value="7">July</option>
                    <option value="8">August</option>
                    <option value="9">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label htmlFor="att-year" style={{ fontSize: '0.85rem', fontWeight: '600', color: '#555' }}>Year:</label>
                  <select
                    id="att-year"
                    value={attendanceYearFilter}
                    onChange={(e) => setAttendanceYearFilter(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', background: '#fff', fontSize: '0.9rem' }}
                  >
                    <option value="all">All Years</option>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                  </select>
                </div>

                <button 
                  onClick={downloadAttendanceExcel} 
                  style={{ 
                    padding: '10px 20px', 
                    background: 'var(--color-primary-medium)', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: '6px', 
                    fontWeight: '600', 
                    cursor: 'pointer',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  📥 Download Excel File
                </button>
              </div>
            </div>

            {/* Attendance Analytics Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: '20px',
              marginBottom: '24px'
            }}>
              {/* Total Hours Card */}
              <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1.5px solid #edf2f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <span style={{ fontSize: '0.78rem', color: '#777', fontWeight: '600', textTransform: 'uppercase' }}>
                  Total Hours Logged
                </span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--color-primary-medium)', margin: '6px 0 0 0' }}>
                  {attendanceLogs.reduce((sum, log) => {
                    if (log.checkIn && log.checkOut) {
                      return sum + (new Date(log.checkOut) - new Date(log.checkIn)) / (1000 * 60 * 60);
                    }
                    return sum;
                  }, 0).toFixed(1)} Hrs
                </h3>
              </div>

              {/* Active Shifts Card */}
              <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1.5px solid #edf2f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <span style={{ fontSize: '0.78rem', color: '#777', fontWeight: '600', textTransform: 'uppercase' }}>
                  Active Shifts Right Now
                </span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#d97706', margin: '6px 0 0 0' }}>
                  {attendanceLogs.filter(log => !log.checkOut).length} Online
                </h3>
              </div>

              {/* Completed Shifts Card */}
              <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1.5px solid #edf2f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <span style={{ fontSize: '0.78rem', color: '#777', fontWeight: '600', textTransform: 'uppercase' }}>
                  Completed Work Shifts
                </span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--color-primary-dark)', margin: '6px 0 0 0' }}>
                  {attendanceLogs.filter(log => log.checkOut).length} Shifts
                </h3>
              </div>
            </div>

            {/* Attendance Table Panel */}
            <div style={{ background: '#fff', borderRadius: '12px', overflowX: 'auto', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <table style={{ width: '100%', minWidth: '850px', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8faf9', borderBottom: '2px solid #eee' }}>
                    <th style={{ padding: '15px' }}>Employee</th>
                    <th style={{ padding: '15px' }}>Role</th>
                    <th style={{ padding: '15px' }}>Date</th>
                    <th style={{ padding: '15px' }}>Check-In</th>
                    <th style={{ padding: '15px' }}>Check-Out</th>
                    <th style={{ padding: '15px' }}>Duration</th>
                    <th style={{ padding: '15px' }}>Status</th>
                    <th style={{ padding: '15px' }}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceLogs.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ padding: '30px', textAlign: 'center', color: '#777' }}>
                        No attendance logs found matching the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    attendanceLogs.map(log => {
                      const checkInDate = new Date(log.checkIn);
                      const checkOutDate = log.checkOut ? new Date(log.checkOut) : null;
                      
                      let durationHours = 'N/A';
                      if (checkOutDate) {
                        const diffMs = checkOutDate - checkInDate;
                        durationHours = `${(diffMs / (1000 * 60 * 60)).toFixed(2)} hrs`;
                      }

                      return (
                        <tr key={log.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '15px' }}>
                            <div style={{ fontWeight: '600' }}>{log.user?.name || 'Deleted User'}</div>
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>{log.user?.phone}</div>
                          </td>
                          <td style={{ padding: '15px', textTransform: 'capitalize' }}>
                            <span style={{ fontSize: '0.85rem', color: '#555', background: '#f3f4f6', padding: '3px 8px', borderRadius: '4px' }}>
                              {log.user?.role?.name || 'EMPLOYEE'}
                            </span>
                          </td>
                          <td style={{ padding: '15px' }}>
                            {checkInDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td style={{ padding: '15px', color: '#059669', fontWeight: '500' }}>
                            {checkInDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </td>
                          <td style={{ padding: '15px', color: checkOutDate ? '#374151' : '#d97706', fontWeight: checkOutDate ? 'normal' : '600' }}>
                            {checkOutDate 
                              ? checkOutDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
                              : 'ON DUTY (Active)'
                            }
                          </td>
                          <td style={{ padding: '15px', fontWeight: '600' }}>
                            {durationHours}
                          </td>
                          <td style={{ padding: '15px' }}>
                            <span style={{ 
                              fontSize: '0.75rem', 
                              fontWeight: 'bold', 
                              padding: '4px 8px', 
                              borderRadius: '9999px',
                              background: log.status === 'PRESENT' ? '#d1fae5' : log.status === 'HALF_DAY' ? '#fef3c7' : '#fee2e2',
                              color: log.status === 'PRESENT' ? '#065f46' : log.status === 'HALF_DAY' ? '#92400e' : '#991b1b'
                            }}>
                              {log.status}
                            </span>
                          </td>
                          <td style={{ padding: '15px', fontSize: '0.85rem', color: '#555', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.notes}>
                            {log.notes || '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '24px' }}>Edit Admin Profile</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '30px' }}>
              {/* Profile Details Form */}
              <form onSubmit={handleUpdateProfile} style={{ background: '#fff', padding: isMobile ? '20px 15px' : '35px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '8px', color: 'var(--color-primary-dark)' }}>
                  👤 Profile Details
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px', color: '#555' }}>Username (Read-Only)</label>
                    <input
                      type="text"
                      value={user?.username || ''}
                      disabled
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', background: '#f5f5f5', color: '#888', cursor: 'not-allowed' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px', color: '#555' }}>WhatsApp Number (Read-Only)</label>
                    <input
                      type="text"
                      value={user?.phone || ''}
                      disabled
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', background: '#f5f5f5', color: '#888', cursor: 'not-allowed' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px', color: '#555' }}>Full Name</label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      required
                      placeholder="Enter full name"
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px', color: '#555' }}>Email Address</label>
                    <input
                      type="email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      required
                      placeholder="Enter email address"
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px', color: '#555' }}>Office Address</label>
                    <textarea
                      value={profileAddress}
                      onChange={(e) => setProfileAddress(e.target.value)}
                      placeholder="Enter office address"
                      rows={3}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  </div>
                </div>

                <button type="submit" style={{ width: '100%', padding: '12px', background: 'var(--color-primary-medium)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', marginTop: '30px', transition: 'background var(--transition-fast)' }}>
                  💾 Save Profile Details
                </button>
              </form>

              {/* Password Change Form */}
              <form onSubmit={handleUpdatePassword} style={{ background: '#fff', padding: isMobile ? '20px 15px' : '35px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '8px', color: 'var(--color-primary-dark)' }}>
                  🔑 Change Password
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px', color: '#555' }}>Current Secret Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px', color: '#555' }}>New Secret Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="Min 6 characters"
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px', color: '#555' }}>Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Repeat new password"
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', outline: 'none' }}
                    />
                  </div>
                </div>

                <button type="submit" style={{ width: '100%', padding: '12px', background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', marginTop: '30px', transition: 'background var(--transition-fast)', boxShadow: '0 4px 10px rgba(224, 112, 43, 0.2)' }}>
                  🔒 Update Secret Password
                </button>
              </form>
            </div>
          </div>
        )}

        </div>
      </div>
    </div>
  );
}
