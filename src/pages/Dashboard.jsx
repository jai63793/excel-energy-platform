import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { logoutAction, fetchMyProfileAction } from '../store/authSlice';
import api from '../services/api';
import { hashPasswordSHA256 } from '../utils/hash';

export default function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const renderNotificationDescription = (description) => {
    if (!description) return null;
    
    // Regex to match the Link suffix: 🔗 (LinkLabel: )?(https?://\S+)
    const regex = /🔗\s*(.*?):\s*(https?:\/\/\S+)/i;
    const match = description.match(regex);
    
    if (match) {
      const label = match[1] || 'Link';
      const url = match[2];
      // Get the text before the emoji
      const textBefore = description.split(/🔗/)[0].trim();
      
      return (
        <div>
          {textBefore && <p style={{ fontSize: '0.82rem', color: '#555', lineHeight: '1.4', margin: '0 0 8px 0', whiteSpace: 'pre-line' }}>{textBefore}</p>}
          <div style={{ marginTop: '8px', marginBottom: '8px' }}>
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--color-accent)',
                fontWeight: '600',
                fontSize: '0.85rem',
                textDecoration: 'underline'
              }}
            >
              🔗 {label}
            </a>
          </div>
        </div>
      );
    }
    
    // Regular URL regex fallback for any raw URLs inside the text
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = description.split(urlRegex);
    if (parts.length > 1) {
      return (
        <p style={{ fontSize: '0.82rem', color: '#555', lineHeight: '1.4', margin: '0 0 8px 0', whiteSpace: 'pre-line' }}>
          {parts.map((part, index) => {
            if (part.match(urlRegex)) {
              return (
                <a 
                  key={index}
                  href={part} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{
                    color: 'var(--color-accent)',
                    fontWeight: '600',
                    textDecoration: 'underline'
                  }}
                >
                  {part}
                </a>
              );
            }
            return part;
          })}
        </p>
      );
    }
    
    return (
      <p style={{ fontSize: '0.82rem', color: '#555', lineHeight: '1.4', margin: '0 0 8px 0', whiteSpace: 'pre-line' }}>
        {description}
      </p>
    );
  };

  // Responsive state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState('overview');
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [payments, setPayments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  // Subscription parameters
  const [subscription, setSubscription] = useState(null);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [totalPlanDays, setTotalPlanDays] = useState(30);
  const [showPlanDetails, setShowPlanDetails] = useState(false);

  // Settings states
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState(user?.address || '');
  const [profileNakshatram, setProfileNakshatram] = useState(user?.nakshatram || 'Ashwini');
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || '');
  const [formPhotoPreview, setFormPhotoPreview] = useState(user?.profilePhoto || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);

  // Healer Consultation Booking States
  const [healersList, setHealersList] = useState([]);
  const [myBookingsList, setMyBookingsList] = useState([]);
  const [bookHealerId, setBookHealerId] = useState('');
  const [bookSessionType, setBookSessionType] = useState('1-on-1 Distance Healing');
  const [bookDate, setBookDate] = useState('');
  const [bookTimeSlot, setBookTimeSlot] = useState('');
  const [bookNotes, setBookNotes] = useState('');

  // Live video info
  const [liveUrl, setLiveUrl] = useState(null);
  const [dashPlan, setDashPlan] = useState('1month');

  // Sub-user States
  const [subUsers, setSubUsers] = useState([]);
  const [loadingSubUsers, setLoadingSubUsers] = useState(false);
  const [showAddSubModal, setShowAddSubModal] = useState(false);
  const [subName, setSubName] = useState('');
  const [subPhone, setSubPhone] = useState('');
  const [subNakshatram, setSubNakshatram] = useState('Ashwini');
  const [subPhotoBase64, setSubPhotoBase64] = useState('');
  const [addingSubUser, setAddingSubUser] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState({ self: true });

  const NAKSHATRAS = [
    'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha',
    'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
    'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
  ];

  const loadSubUsers = async () => {
    try {
      setLoadingSubUsers(true);
      const res = await api.get('/sub-users');
      setSubUsers(res.data.subUsers || []);
    } catch (err) {
      console.error('Failed to load sub-users:', err.message);
    } finally {
      setLoadingSubUsers(false);
    }
  };

  const handleSubPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSubPhotoBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSubUserSubmit = async (e) => {
    e.preventDefault();
    if (!subName || !subNakshatram) {
      toast.error('Name and Nakshatram are required.');
      return;
    }
    setAddingSubUser(true);
    try {
      await api.post('/sub-users', {
        name: subName,
        phone: subPhone,
        nakshatram: subNakshatram,
        photo: subPhotoBase64
      });
      toast.success('Sub-member profile created successfully.');
      setSubName('');
      setSubPhone('');
      setSubNakshatram('Ashwini');
      setSubPhotoBase64('');
      setShowAddSubModal(false);
      loadSubUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create sub-member profile.');
    } finally {
      setAddingSubUser(false);
    }
  };

  const handleDeleteSubUser = async (id) => {
    if (!window.confirm('Are you sure you want to remove this family member profile?')) {
      return;
    }
    try {
      await api.delete(`/sub-users/${id}`);
      toast.success('Member profile removed.');
      loadSubUsers();
      setSelectedMembers(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member profile.');
    }
  };

  const checkedCount = (selectedMembers.self ? 1 : 0) + subUsers.filter(s => selectedMembers[s.id]).length;

  const fileInputRef = useRef(null);

  // Monitor screen size adjustments
  useEffect(() => {
    const handleResize = () => {
      const mobileStatus = window.innerWidth < 768;
      setIsMobile(mobileStatus);
      if (!mobileStatus) {
        setIsSidebarOpen(false); // Reset sidebar state on large screens
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync details on mount
  useEffect(() => {
    dispatch(fetchMyProfileAction());
    loadDashboardDetails();
  }, [dispatch]);

  // Sync state values when user slice changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setAddress(user.address || '');
      setProfileNakshatram(user.nakshatram || 'Ashwini');
      setProfilePhoto(user.profilePhoto || '');
      setFormPhotoPreview(user.profilePhoto || '');
    }
  }, [user]);

  // Dynamically update totalPlanDays matching dropdown selection for expired/unpaid users
  useEffect(() => {
    if (!isSubscribed) {
      if (dashPlan === '1month') setTotalPlanDays(30);
      else if (dashPlan === '3month') setTotalPlanDays(90);
      else if (dashPlan === '6month') setTotalPlanDays(180);
      else if (dashPlan === '12month') setTotalPlanDays(365);
    }
  }, [dashPlan, isSubscribed]);

  const loadDashboardDetails = async () => {
    try {
      loadSubUsers();
      const subRes = await api.get('/payments/my-history');
      setPayments(subRes.data.payments || []);

      const activePayments = subRes.data.payments.filter(p => p.status === 'SUCCESS' && p.subscription);
      if (activePayments.length > 0) {
        const activeSub = activePayments[0].subscription;
        setSubscription(activeSub);
        
        const start = new Date(activeSub.startDate);
        const expiry = new Date(activeSub.endDate);
        const today = new Date();
        
        // Calculate dynamic plan duration in days (defaulting to 30)
        const totalDays = Math.ceil((expiry - start) / (1000 * 60 * 60 * 24)) || 30;
        setTotalPlanDays(totalDays);
        
        const diffTime = expiry - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 0 && activeSub.status === 'ACTIVE') {
          setIsSubscribed(true);
          setDaysRemaining(diffDays);
        } else {
          setIsSubscribed(false);
          setDaysRemaining(0);
        }
      } else {
        setIsSubscribed(false);
        setDaysRemaining(0);
        setTotalPlanDays(30);
      }

      const notifRes = await api.get('/notifications/my-notifications');
      setNotifications(notifRes.data.notifications || []);

      const liveNotif = notifRes.data.notifications.find(n => n.notification.title.includes('LIVE'));
      if (liveNotif) {
        const urlMatch = liveNotif.notification.description.match(/https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/\S+/);
        if (urlMatch) {
          setLiveUrl(urlMatch[0]);
        }
      }
    } catch (err) {
      console.warn('Dashboard loading error:', err.message);
    }
  };

  const handleLogout = async () => {
    await dispatch(logoutAction());
    toast.success('Logged out successfully.');
    navigate('/login');
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put('/auth/profile', { 
        name, 
        email, 
        address,
        nakshatram: profileNakshatram,
        profilePhoto
      });
      if (response.data.success) {
        toast.success('Profile updated successfully.');
        dispatch(fetchMyProfileAction());
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Photo = reader.result;
        toast.loading('Uploading profile picture...');
        try {
          const response = await api.put('/auth/profile', { 
            name, 
            email, 
            address, 
            profilePhoto: base64Photo 
          });
          toast.dismiss();
          if (response.data.success) {
            toast.success('Profile picture updated successfully!');
            dispatch(fetchMyProfileAction());
          }
        } catch (err) {
          toast.dismiss();
          toast.error(err.response?.data?.message || 'Failed to upload photo.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUploadInForm = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormPhotoPreview(reader.result);
        setProfilePhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error('All password fields are required.');
      return;
    }

    try {
      const hashedCurrent = await hashPasswordSHA256(currentPassword);
      const hashedNew = await hashPasswordSHA256(newPassword);
      const response = await api.put('/auth/change-password', { currentPassword: hashedCurrent, newPassword: hashedNew });
      if (response.data.success) {
        toast.success('Password updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    }
  };

  const markAsRead = async (notifId) => {
    try {
      const response = await api.put(`/notifications/mark-read/${notifId}`);
      if (response.data.success) {
        setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, isRead: true } : n));
        toast.success('Notification marked as read.');
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  const markAllRead = async () => {
    try {
      const response = await api.put('/notifications/mark-all-read');
      if (response.data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        toast.success('All notifications marked read.');
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        existingScript.onload = () => resolve(true);
        existingScript.onerror = () => resolve(false);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (planId = '1month') => {
    // Pre-payment validation: Check if agreed to privacy policy
    if (!agreedToPolicy) {
      toast.error('Please agree to the Privacy Policy to proceed.');
      return;
    }

    // Pre-payment validation: Check if logged-in primary user has uploaded profile photo and selected Nakshatram
    if (!user?.profilePhoto || !user?.nakshatram) {
      toast.error('Payment blocked: Please upload your Profile Photo and select your Nakshatram in the Profile tab first.');
      setActiveTab('profile');
      return;
    }

    const subUserIds = subUsers.filter(s => selectedMembers[s.id]).map(s => s.id);
    const paySelf = !!selectedMembers.self;

    if ((paySelf ? 1 : 0) + subUserIds.length === 0) {
      toast.error('Please select at least one member to pay for.');
      return;
    }

    setLoadingPayment(true);
    const scriptLoaded = await loadRazorpayScript();
    
    if (!scriptLoaded) {
      toast.error('Failed to load payment portal script. Please check connection.');
      setLoadingPayment(false);
      return;
    }

    try {
      const orderRes = await api.post('/payments/create-order', {
        plan: planId,
        subUserIds,
        paySelf
      });
      const { orderId, amount, currency, keyId } = orderRes.data;



      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: 'Excel Energy',
        description: 'Monthly Membership Subscription',
        image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=150&auto=format&fit=crop',
        order_id: orderId,
        handler: async (response) => {
          try {
            toast.loading('Processing payment activation...');
            const verifyRes = await api.post('/payments/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            toast.dismiss();

            if (verifyRes.data.success) {
              toast.success('Subscription activated successfully!');
              loadDashboardDetails();
            }
          } catch (verifyErr) {
            toast.dismiss();
            toast.error(verifyErr.response?.data?.message || 'Verification failed. Contact support.');
          }
        },
        prefill: {
          name: user.name,
          email: user.email || '',
          contact: user.phone
        },
        theme: {
          color: '#0c4737'
        },
        modal: {
          ondismiss: () => {
            setLoadingPayment(false);
            toast('Payment cancelled.');
          }
        }
      };

      const razorpayObj = new window.Razorpay(options);
      razorpayObj.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not initiate payment.');
      setLoadingPayment(false);
    }
  };

  const printInvoice = (payment) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - Excel Energy</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0c4737; padding-bottom: 20px; margin-bottom: 30px; }
            .logo-container { display: flex; align-items: center; gap: 12px; }
            .logo { width: 60px; height: 60px; object-fit: contain; }
            .company-details { display: flex; flex-direction: column; }
            .company-name { font-size: 24px; font-weight: bold; color: #0c4737; line-height: 1.2; }
            .company-tagline { font-size: 12px; color: #666; font-weight: 600; }
            .receipt-title-block { text-align: right; }
            .receipt-title { font-size: 20px; color: #0c4737; margin: 0 0 8px 0; font-weight: bold; }
            .receipt-title-block p { margin: 4px 0; font-size: 14px; color: #444; }
            .details { width: 100%; border-collapse: collapse; margin: 30px 0; }
            .details td, .details th { padding: 12px; border: 1px solid #ddd; text-align: left; }
            .details th { background: #f4f4f4; }
            .total { font-weight: bold; font-size: 18px; color: #0c4737; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="header">
            <div class="logo-container">
              <img src="${new URL('../assets/images/logo.png', import.meta.url).href}" class="logo" alt="Excel Energy Logo" />
              <div class="company-details">
                <span class="company-name">Excel Energy</span>
                <span class="company-tagline">Divine Wellness Portal</span>
              </div>
            </div>
            <div class="receipt-title-block">
              <h2 class="receipt-title">Subscription Receipt</h2>
              <p><strong>Invoice No:</strong> ${payment.invoiceNumber}</p>
              <p><strong>Date:</strong> ${new Date(payment.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div>
            <p><strong>Member Name:</strong> ${user.name}</p>
            <p><strong>Mobile:</strong> ${user.phone}</p>
            ${user.email ? `<p><strong>Email:</strong> ${user.email}</p>` : ''}
          </div>
          <table class="details">
            <thead>
              <tr>
                <th>Membership Subscription</th>
                <th>Validity</th>
                <th>Total Paid</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Pranic Meditation & Healing Premium Access</td>
                <td>30 Days</td>
                <td class="total">₹${payment.amount}</td>
              </tr>
            </tbody>
          </table>
          <p style="margin-top: 50px; text-align: center; color: #777; font-size: 12px;">This is a computer-generated invoice receipt. Thank you for practicing with us!</p>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const loadHealersList = async () => {
    try {
      const response = await api.get('/bookings/healers');
      if (response.data.success) {
        setHealersList(response.data.healers || []);
      }
    } catch (err) {
      console.error('Failed to load healers list:', err.message);
    }
  };

  const loadMyBookings = async () => {
    try {
      const response = await api.get('/bookings/my-bookings');
      if (response.data.success) {
        setMyBookingsList(response.data.bookings || []);
      }
    } catch (err) {
      console.error('Failed to load user bookings:', err.message);
    }
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (!bookHealerId || !bookDate || !bookTimeSlot) {
      toast.error('Practitioner, Date, and Time Slot are required.');
      return;
    }

    try {
      toast.loading('Booking consultation...');
      const response = await api.post('/bookings/create', {
        healerId: Number(bookHealerId),
        sessionType: bookSessionType,
        bookingDate: bookDate,
        timeSlot: bookTimeSlot,
        notes: bookNotes
      });
      toast.dismiss();

      if (response.data.success) {
        toast.success('Consultation booked! Waiting for Admin assignment and Staff acceptance.');
        // Reset form
        setBookHealerId('');
        setBookDate('');
        setBookTimeSlot('');
        setBookNotes('');
        // Reload list
        loadMyBookings();
      }
    } catch (err) {
      toast.dismiss();
      toast.error(err.response?.data?.message || 'Failed to submit booking.');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      toast.loading('Cancelling booking...');
      const response = await api.put(`/bookings/${bookingId}/cancel`);
      toast.dismiss();

      if (response.data.success) {
        toast.success('Booking cancelled successfully.');
        loadMyBookings();
      }
    } catch (err) {
      toast.dismiss();
      toast.error(err.response?.data?.message || 'Failed to cancel booking.');
    }
  };

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    setIsSidebarOpen(false); // Automatically dismiss drawer on mobile
    if (tabName === 'bookings') {
      loadHealersList();
      loadMyBookings();
    }
  };

  // Helper to render navigation items
  const renderNavMenu = () => (
    <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
      <button
        onClick={() => handleTabChange('overview')}
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: '8px',
          border: 'none',
          textAlign: 'left',
          fontWeight: '600',
          fontSize: '0.9rem',
          background: activeTab === 'overview' ? 'var(--color-primary-light)' : 'none',
          color: activeTab === 'overview' ? 'var(--color-primary-medium)' : '#444',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
      >
        🧘 Overview & Live Broadcast
      </button>
      
      <button
        onClick={() => handleTabChange('bookings')}
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: '8px',
          border: 'none',
          textAlign: 'left',
          fontWeight: '600',
          fontSize: '0.9rem',
          background: activeTab === 'bookings' ? 'var(--color-primary-light)' : 'none',
          color: activeTab === 'bookings' ? 'var(--color-primary-medium)' : '#444',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
      >
        ✨ 1-on-1 Healer Bookings
      </button>

      <button
        onClick={() => handleTabChange('notifications')}
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: '8px',
          border: 'none',
          textAlign: 'left',
          fontWeight: '600',
          fontSize: '0.9rem',
          background: activeTab === 'notifications' ? 'var(--color-primary-light)' : 'none',
          color: activeTab === 'notifications' ? 'var(--color-primary-medium)' : '#444',
          cursor: 'pointer',
          transition: 'all 0.2s',
          position: 'relative'
        }}
      >
        🔔 Notifications Center
        {notifications.filter(n => !n.isRead).length > 0 && (
          <span style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'var(--color-accent)',
            color: '#fff',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem'
          }}>
            {notifications.filter(n => !n.isRead).length}
          </span>
        )}
      </button>

      <button
        onClick={() => handleTabChange('payments')}
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: '8px',
          border: 'none',
          textAlign: 'left',
          fontWeight: '600',
          fontSize: '0.9rem',
          background: activeTab === 'payments' ? 'var(--color-primary-light)' : 'none',
          color: activeTab === 'payments' ? 'var(--color-primary-medium)' : '#444',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
      >
        💳 Payments & Subscription
      </button>

      <button
        onClick={() => handleTabChange('profile')}
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: '8px',
          border: 'none',
          textAlign: 'left',
          fontWeight: '600',
          fontSize: '0.9rem',
          background: activeTab === 'profile' ? 'var(--color-primary-light)' : 'none',
          color: activeTab === 'profile' ? 'var(--color-primary-medium)' : '#444',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
      >
        👤 Profile & Security Settings
      </button>
    </nav>
  );

  // Helper to render user profile block
  const renderProfileBlock = () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      padding: '16px 10px 24px 10px',
      borderBottom: '1px solid #edf2f0',
      marginBottom: '20px'
    }}>
      <div style={{ position: 'relative', marginBottom: '14px' }}>
        {user?.profilePhoto ? (
          <img 
            src={user.profilePhoto} 
            alt="Profile" 
            style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--color-primary-medium)', boxShadow: '0 4px 12px rgba(8, 50, 38, 0.15)' }} 
          />
        ) : (
          <div style={{
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            background: 'var(--color-primary-light)',
            color: 'var(--color-primary-medium)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            border: '3px solid var(--color-primary-medium)',
            boxShadow: '0 4px 12px rgba(8, 50, 38, 0.15)'
          }}>
            👤
          </div>
        )}
        <input 
          type="file" 
          ref={fileInputRef} 
          accept="image/*" 
          onChange={handlePhotoUpload} 
          style={{ display: 'none' }} 
        />
      </div>

      <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--color-primary-dark)', margin: '0 0 4px 0' }}>
        {user?.name}
      </h3>
      <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: '500', marginBottom: '12px', display: 'block' }}>
        📞 {user?.phone}
      </span>

      <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'center' }}>
        <button 
          type="button" 
          onClick={() => fileInputRef.current.click()}
          style={{
            background: 'none',
            border: '1.5px solid var(--color-primary-medium)',
            borderRadius: '16px',
            padding: '6px 14px',
            fontSize: '0.78rem',
            fontWeight: '600',
            color: 'var(--color-primary-medium)',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Change Photo
        </button>
        <button 
          type="button" 
          onClick={() => handleTabChange('profile')}
          style={{
            background: 'var(--color-primary-medium)',
            border: 'none',
            borderRadius: '16px',
            padding: '6px 14px',
            fontSize: '0.78rem',
            fontWeight: '600',
            color: '#fff',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(12, 71, 55, 0.2)',
            transition: 'all 0.2s'
          }}
        >
          Edit Profile
        </button>
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f7f6',
      fontFamily: 'var(--font-body)',
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden'
    }}>
      
      {/* HEADER NAVBAR */}
      <header style={{
        height: '70px',
        background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary-medium) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img 
            src={new URL('../assets/images/logo.png', import.meta.url).href} 
            alt="Excel Energy Logo" 
            style={{ width: '40px', height: '40px', objectFit: 'contain' }}
          />
          <h1 style={{ color: '#fff', fontSize: '1.3rem', fontFamily: 'var(--font-heading)', margin: 0, fontWeight: '500' }}>
            Excel Energy
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {!isMobile && (
            <div style={{ color: 'var(--color-bg-sand)', fontSize: '0.85rem', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Member Dashboard
            </div>
          )}
          {isMobile && (
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              aria-label="Toggle navigation menu"
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#fff',
                fontSize: '1.6rem',
                cursor: 'pointer',
                borderRadius: '8px',
                width: '42px',
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s'
              }}
            >
              ☰
            </button>
          )}
        </div>
      </header>

      {/* DASHBOARD SPLIT BODY CONTAINER */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'row',
        position: 'relative'
      }}>
        
        {/* DESKTOP SIDEBAR VIEW */}
        {!isMobile && (
          <aside style={{
            width: '320px',
            background: '#ffffff',
            borderRight: '1px solid rgba(8, 50, 38, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            padding: '24px 20px',
            position: 'sticky',
            top: '70px',
            height: 'calc(100vh - 70px)',
            overflowY: 'auto'
          }}>
            {renderProfileBlock()}
            {renderNavMenu()}
            <hr style={{ border: 'none', borderTop: '1px solid #edf2f0', margin: '20px 0 16px 0' }} />
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                textAlign: 'left',
                fontWeight: '600',
                fontSize: '0.9rem',
                color: '#ef4444',
                background: 'rgba(239, 68, 68, 0.06)',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              🚪 Sign Out Account
            </button>
          </aside>
        )}

        {/* MOBILE SIDEBAR DRAWER VIEW */}
        {isMobile && (
          <>
            {/* Dark Backdrop Overlay */}
            {isSidebarOpen && (
              <div 
                onClick={() => setIsSidebarOpen(false)}
                style={{
                  position: 'fixed',
                  top: '70px',
                  left: 0,
                  width: '100vw',
                  height: 'calc(100vh - 70px)',
                  background: 'rgba(0, 0, 0, 0.4)',
                  backdropFilter: 'blur(3px)',
                  zIndex: 98,
                  transition: 'opacity 0.25s ease'
                }}
              />
            )}
            
            {/* Sliding Sidebar Drawer */}
            <aside style={{
              position: 'fixed',
              top: '70px',
              left: isSidebarOpen ? 0 : '-300px',
              width: '290px',
              height: 'calc(100vh - 70px)',
              background: '#ffffff',
              boxShadow: isSidebarOpen ? '5px 0 20px rgba(0,0,0,0.15)' : 'none',
              display: 'flex',
              flexDirection: 'column',
              padding: '20px 16px',
              zIndex: 99,
              transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              overflowY: 'auto'
            }}>
              {renderProfileBlock()}
              {renderNavMenu()}
              <hr style={{ border: 'none', borderTop: '1px solid #edf2f0', margin: '20px 0 16px 0' }} />
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  color: '#ef4444',
                  background: 'rgba(239, 68, 68, 0.06)',
                  cursor: 'pointer'
                }}
              >
                🚪 Sign Out Account
              </button>
            </aside>
          </>
        )}

        {/* RIGHT SIDE DETAIL PANEL */}
        <main style={{
          flex: 1,
          padding: isMobile ? '12px' : '28px',
          overflowY: 'auto'
        }}>
          
          {/* PROFILE COMPLETION ALERT BANNER */}
          {user && (!user.email || !user.profilePhoto) && (
            <div style={{
              background: '#fff9f0',
              border: '1.5px solid #ffe8cc',
              borderRadius: '10px',
              padding: '16px 20px',
              marginBottom: '20px',
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'stretch' : 'center',
              gap: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
              animation: 'fadeIn 0.4s ease-out'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ fontSize: '1.5rem', marginTop: '-2px' }}>⚠️</span>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', color: '#c2410c' }}>
                    Complete Your Profile Setup
                  </h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#7c2d12', lineHeight: '1.4' }}>
                    Please update your missing details to ensure full access:
                    {(!user.email) && <span style={{ display: 'block', fontWeight: '600', marginTop: '4px' }}>• Email Address is missing</span>}
                    {(!user.profilePhoto) && <span style={{ display: 'block', fontWeight: '600', marginTop: '2px' }}>• Profile Photo is missing</span>}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                style={{
                  padding: '8px 16px',
                  background: '#e05e00',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'background 0.2s',
                  alignSelf: isMobile ? 'stretch' : 'center'
                }}
                onMouseOver={(e) => e.target.style.background = '#c2410c'}
                onMouseOut={(e) => e.target.style.background = '#e05e00'}
              >
                Configure Profile Now
              </button>
            </div>
          )}
          
          {/* Active Subscription Status Grid Cards */}
          {activeTab === 'overview' && (
            isMobile ? (
              <div style={{
                background: '#fff',
                borderRadius: '10px',
                border: '1.5px solid #edf2f0',
                padding: '12px 16px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>
                    Status: {isSubscribed ? '🟢 Active' : '🔴 Unpaid'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#666', marginTop: '2px' }}>
                    {isSubscribed ? `${daysRemaining} days left` : 'Renew membership'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowPlanDetails(true);
                    handleTabChange('payments');
                  }}
                  style={{
                    background: !isSubscribed ? 'var(--color-accent)' : 'none',
                    border: !isSubscribed ? 'none' : '1px solid var(--color-primary-medium)',
                    color: !isSubscribed ? '#fff' : 'var(--color-primary-medium)',
                    borderRadius: '5px',
                    padding: '6px 12px',
                    fontWeight: '600',
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  {!isSubscribed ? 'Subscribe' : 'Extend'}
                </button>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px',
                marginBottom: '24px'
              }}>
                {/* Subscription Status Card */}
                <div style={{
                  background: '#fff',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                  padding: '20px',
                  border: '1px solid #edf2f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px'
                }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#777', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      MEMBERSHIP STATUS
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '6px 0' }}>
                      <span style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: isSubscribed ? '#22c55e' : '#ef4444'
                      }} />
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-primary-dark)', margin: 0 }}>
                        {isSubscribed ? 'Active Subscriber' : 'Expired / Unpaid'}
                      </h3>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#666', margin: 0 }}>
                      {isSubscribed 
                        ? `Valid until ${new Date(subscription?.endDate).toLocaleDateString('en-IN')}`
                        : 'Renew to unlock live sessions and healing benefits.'
                      }
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                    <button
                      onClick={() => {
                        setShowPlanDetails(true);
                        handleTabChange('payments');
                      }}
                      style={{
                        background: !isSubscribed ? 'var(--color-accent)' : 'none',
                        border: !isSubscribed ? 'none' : '1.5px solid var(--color-primary-medium)',
                        color: !isSubscribed ? '#fff' : 'var(--color-primary-medium)',
                        borderRadius: '6px',
                        padding: '10px 16px',
                        fontWeight: '650',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      {!isSubscribed ? 'Subscribe Now' : 'Extend Duration'}
                    </button>
                  </div>
                </div>

                {/* Days Remaining Visual Progress Bar Card */}
                <div style={{
                  background: '#fff',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid #edf2f0'
                }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.78rem', color: '#777', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      DAYS REMAINING
                    </span>
                    <h2 style={{ fontSize: '2.2rem', fontWeight: '800', margin: '4px 0', color: 'var(--color-primary-dark)' }}>
                      {daysRemaining} <span style={{ fontSize: '0.85rem', color: '#777', fontWeight: 'normal' }}>/ {totalPlanDays} Days</span>
                    </h2>
                    <div style={{
                      width: '100%',
                      maxWidth: '220px',
                      height: '6px',
                      backgroundColor: '#edf2f0',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      marginTop: '8px'
                    }}>
                      <div style={{
                        width: `${Math.min(100, Math.max(0, (daysRemaining / totalPlanDays) * 100))}%`,
                        height: '100%',
                        backgroundColor: isSubscribed ? 'var(--color-primary-medium)' : '#ef4444',
                        borderRadius: '10px'
                      }} />
                    </div>
                  </div>
                  
                  <div style={{
                    background: 'var(--color-primary-light)',
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.3rem',
                    color: 'var(--color-primary-medium)'
                  }}>
                    ⏳
                  </div>
                </div>
              </div>
            )
          )}

          {/* MAIN PAGE TAB PANEL */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 4px 25px rgba(0,0,0,0.02)',
            padding: isMobile ? '14px' : '24px',
            minHeight: isMobile ? 'auto' : '450px',
            border: '1px solid #edf2f0'
          }}>
            
            {/* OVERVIEW PANEL */}
            {activeTab === 'overview' && (
              <div>
                <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)', marginBottom: '16px', color: 'var(--color-primary-dark)' }}>
                  Weekly Practices & Live Meditations
                </h2>
                
                {/* Live video broadcast box */}
                <div style={{
                  border: '1px solid #edf2f0',
                  borderRadius: '12px',
                  padding: '24px 16px',
                  background: isSubscribed ? 'var(--color-primary-light)' : '#fafbfa',
                  textAlign: 'center',
                  marginBottom: '24px',
                  position: 'relative'
                }}>
                  {!isSubscribed && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      backdropFilter: 'blur(4px)',
                      background: 'rgba(255, 255, 255, 0.65)',
                      borderRadius: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 2,
                      padding: '16px'
                    }}>
                      <span style={{ fontSize: '2.2rem' }}>🔒</span>
                      <h3 style={{ fontWeight: 'bold', color: 'var(--color-primary-dark)', margin: '8px 0', fontSize: '1.1rem' }}>Spiritual Broadcast Locked</h3>
                      <p style={{ maxWidth: '300px', fontSize: '0.82rem', color: '#666', marginBottom: '14px', lineHeight: '1.5' }}>
                        YouTube Live streaming classes are exclusive to active platform members.
                      </p>
                      <button
                        onClick={() => {
                          setShowPlanDetails(true);
                          handleTabChange('payments');
                        }}
                        style={{
                          background: 'var(--color-accent)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '10px 20px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        Subscribe to Join
                      </button>
                    </div>
                  )}

                  <span style={{ fontSize: '2rem' }}>🎥</span>
                  <h3 style={{ fontWeight: 'bold', color: 'var(--color-primary-dark)', margin: '8px 0 4px 0', fontSize: '1.1rem' }}>Daily Guided Meditation Session</h3>
                  <p style={{ fontSize: '0.82rem', color: '#666', marginBottom: '18px' }}>
                    Join Grand Master Choa Kok Sui's Twin Hearts meditation and healing practice.
                  </p>
                  
                  {liveUrl ? (
                    <a
                      href={liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        background: '#ef4444',
                        color: '#fff',
                        borderRadius: '6px',
                        padding: '10px 24px',
                        fontWeight: '600',
                        display: 'inline-block',
                        fontSize: '0.88rem',
                        boxShadow: '0 4px 10px rgba(239, 68, 68, 0.2)'
                      }}
                    >
                      🔴 Join YouTube Live Stream
                    </a>
                  ) : (
                    <div style={{
                      display: 'inline-block',
                      background: '#edf2f0',
                      color: '#666',
                      borderRadius: '6px',
                      padding: '10px 24px',
                      fontWeight: '600',
                      fontSize: '0.85rem'
                    }}>
                      No Active Broadcast (Scheduled Daily at 7:00 PM)
                    </div>
                  )}
                </div>

                {!isMobile && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                    <div style={{ border: '1px solid #edf2f0', borderRadius: '12px', padding: '16px', background: '#fafbfa' }}>
                      <h4 style={{ fontWeight: 'bold', color: 'var(--color-primary-dark)', marginBottom: '6px', fontSize: '0.95rem' }}>Weekly Guided Sessions</h4>
                      <p style={{ fontSize: '0.8rem', color: '#666', margin: 0, lineHeight: '1.4' }}>
                        Every Tuesday & Thursday, 7:00 PM onwards. Interactive questions and answers session for energy clearing.
                      </p>
                    </div>
                    <div style={{ border: '1px solid #edf2f0', borderRadius: '12px', padding: '16px', background: '#fafbfa' }}>
                      <h4 style={{ fontWeight: 'bold', color: 'var(--color-primary-dark)', marginBottom: '6px', fontSize: '0.95rem' }}>Pranic Distance Healing</h4>
                      <p style={{ fontSize: '0.8rem', color: '#666', margin: 0, lineHeight: '1.4' }}>
                        Unlock 15% discount coupons on professional distance healing packages. Request sessions directly inside the admin chat.
                      </p>
                    </div>
                  </div>
                )}

                {/* Family Members & Sub-members section on overview/front page */}
                <div style={{
                  background: '#fff',
                  borderRadius: '12px',
                  padding: isMobile ? '14px' : '24px',
                  border: '1.5px solid #edf2f0',
                  marginTop: isMobile ? '16px' : '30px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexDirection: isMobile ? 'column' : 'row', gap: '12px' }}>
                    <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '750', color: 'var(--color-primary-dark)', margin: 0 }}>
                        Family Members & Sub-members
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: '#777', margin: '4px 0 0 0' }}>
                        Add family members or dependent profiles to pay for their wellness subscriptions.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddSubModal(true)}
                      style={{
                        background: 'var(--color-primary-medium)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        fontSize: '0.82rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        width: isMobile ? '100%' : 'auto'
                      }}
                    >
                      + Add More
                    </button>
                  </div>

                  {subUsers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#888', fontSize: '0.85rem', border: '1px dashed #e0e6e4', borderRadius: '8px' }}>
                      No sub-members added yet. Click "+ Add More" to add family members.
                    </div>
                  ) : (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(220px, 1fr))',
                      gap: '16px'
                    }}>
                      {subUsers.map(sub => (
                        <div
                          key={sub.id}
                          style={{
                            border: '1.5px solid #edf2f0',
                            borderRadius: '8px',
                            padding: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            position: 'relative'
                          }}
                        >
                          <img
                            src={sub.photo || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23cbd5e1"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>'}
                            style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #ddd' }}
                            alt=""
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.88rem', fontWeight: 'bold', color: 'var(--color-primary-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {sub.name}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#555' }}>
                              Nakshatram: {sub.nakshatram}
                            </div>
                            {sub.phone && (
                              <div style={{ fontSize: '0.72rem', color: '#777' }}>
                                📱 {sub.phone}
                              </div>
                            )}
                            <div style={{ marginTop: '4px' }}>
                              <span style={{
                                fontSize: '0.65rem',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                fontWeight: 'bold',
                                backgroundColor: sub.subscriptionStatus === 'ACTIVE' ? '#dcfce7' : '#fee2e2',
                                color: sub.subscriptionStatus === 'ACTIVE' ? '#15803d' : '#b91c1c'
                              }}>
                                {sub.subscriptionStatus} {sub.subscriptionStatus === 'ACTIVE' && sub.subscriptionEndDate ? `(Exp: ${new Date(sub.subscriptionEndDate).toLocaleDateString('en-IN')})` : ''}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubUser(sub.id)}
                            style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              background: 'none',
                              border: 'none',
                              color: '#b91c1c',
                              cursor: 'pointer',
                              fontSize: '0.9rem'
                            }}
                            title="Remove Member"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* HEALER BOOKINGS */}
            {activeTab === 'bookings' && (
              <div>
                <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)', marginBottom: '14px', color: 'var(--color-primary-dark)' }}>
                  1-on-1 Energy Healer Consultations
                </h2>
                <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '30px', lineHeight: '1.5' }}>
                  Schedule private energy balancing and healing sessions. Book a slot, and the admin will assign and confirm your healer.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '30px', alignItems: 'start' }}>
                  {/* Left Side: Booking Form */}
                  <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', border: '1px solid #edf2f0' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--color-primary-dark)', marginBottom: '20px', borderBottom: '1px solid #edf2f0', paddingBottom: '8px' }}>
                      Schedule New Session
                    </h3>
                    
                    <form onSubmit={handleCreateBooking}>
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '6px', color: '#555' }}>
                          Select practitioner (Desired)
                        </label>
                        <select
                          value={bookHealerId}
                          onChange={(e) => setBookHealerId(e.target.value)}
                          required
                          style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.88rem', background: '#fff', outline: 'none' }}
                        >
                          <option value="">-- Choose practitioner --</option>
                          {healersList.map(h => (
                            <option key={h.id} value={h.id}>
                              {h.name} ({h.employeeProfile?.specialization || 'Energy Healer'})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '6px', color: '#555' }}>
                          Session Type
                        </label>
                        <select
                          value={bookSessionType}
                          onChange={(e) => setBookSessionType(e.target.value)}
                          required
                          style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.88rem', background: '#fff', outline: 'none' }}
                        >
                          <option value="1-on-1 Distance Healing">1-on-1 Distance Healing</option>
                          <option value="Pranic Psychotherapy Session">Pranic Psychotherapy Session</option>
                          <option value="Crystal Healing Balancing">Crystal Healing Balancing</option>
                          <option value="Meditation & Yoga Consultation">Meditation & Yoga Consultation</option>
                        </select>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '6px', color: '#555' }}>
                            Booking Date
                          </label>
                          <input
                            type="date"
                            value={bookDate}
                            onChange={(e) => setBookDate(e.target.value)}
                            required
                            min={new Date().toISOString().split('T')[0]}
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.88rem', outline: 'none' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '6px', color: '#555' }}>
                            Preferred Time Slot
                          </label>
                          <select
                            value={bookTimeSlot}
                            onChange={(e) => setBookTimeSlot(e.target.value)}
                            required
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.88rem', background: '#fff', outline: 'none' }}
                          >
                            <option value="">-- Choose Slot --</option>
                            <option value="09:00 AM - 10:00 AM">09:00 AM - 10:00 AM</option>
                            <option value="11:00 AM - 12:00 PM">11:00 AM - 12:00 PM</option>
                            <option value="02:00 PM - 03:00 PM">02:00 PM - 03:00 PM</option>
                            <option value="04:00 PM - 05:00 PM">04:00 PM - 05:00 PM</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '6px', color: '#555' }}>
                          Healing Request Notes
                        </label>
                        <textarea
                          placeholder="Please briefly explain any physical / emotional issues you want the session to focus on..."
                          value={bookNotes}
                          onChange={(e) => setBookNotes(e.target.value)}
                          rows={3}
                          style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.88rem', outline: 'none', resize: 'none', fontFamily: 'inherit' }}
                        />
                      </div>


                      <button
                        type="submit"
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: 'var(--color-primary-medium)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: '700',
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          boxShadow: '0 4px 10px rgba(12, 71, 55, 0.15)'
                        }}
                      >
                        Book Consultation Slot
                      </button>
                    </form>
                  </div>

                  {/* Right Side: Active Bookings */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--color-primary-dark)', marginBottom: '0px' }}>
                      Your Scheduled Bookings
                    </h3>

                    {myBookingsList.length === 0 ? (
                      <div style={{ padding: '40px 10px', textAlign: 'center', color: '#999', fontSize: '0.9rem', border: '1.5px dashed #edf2f0', borderRadius: '12px', background: '#fafbfa' }}>
                        No scheduled bookings found. Use the form to book your first session.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {myBookingsList.map((b) => (
                          <div
                            key={b.id}
                            style={{
                              background: '#fff',
                              border: '1px solid #edf2f0',
                              borderRadius: '12px',
                              padding: '20px',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                              <div>
                                <span style={{ fontSize: '0.72rem', color: '#999', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>
                                  Booking ID #{b.id}
                                </span>
                                <h4 style={{ fontWeight: 'bold', color: 'var(--color-primary-dark)', margin: '2px 0 0 0', fontSize: '1rem' }}>
                                  {b.sessionType}
                                </h4>
                              </div>
                              <span style={{
                                backgroundColor:
                                  b.status === 'CONFIRMED' ? '#dcfce7' :
                                  b.status === 'PENDING' ? '#fef3c7' :
                                  b.status === 'COMPLETED' ? '#dbeafe' : '#fee2e2',
                                color:
                                  b.status === 'CONFIRMED' ? '#15803d' :
                                  b.status === 'PENDING' ? '#b45309' :
                                  b.status === 'COMPLETED' ? '#1e40af' : '#b91c1c',
                                padding: '3px 8px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold'
                              }}>
                                {b.status}
                              </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem', marginBottom: '14px', color: '#555' }}>
                              <div>
                                <strong>Date:</strong> {new Date(b.bookingDate).toLocaleDateString('en-IN')}
                              </div>
                              <div>
                                <strong>Time:</strong> {b.timeSlot}
                              </div>
                              <div style={{ gridColumn: 'span 2' }}>
                                <strong>Healer:</strong> {b.healer?.name || 'Waiting for Admin allocation'}
                              </div>
                              {b.notes && (
                                <div style={{ gridColumn: 'span 2', fontSize: '0.8rem', color: '#777', borderTop: '1px solid #f5f5f5', paddingTop: '8px', marginTop: '4px' }}>
                                  <strong>Notes:</strong> {b.notes}
                                </div>
                              )}
                            </div>

                            {(b.status === 'PENDING' || b.status === 'CONFIRMED') && (
                              <button
                                onClick={() => handleCancelBooking(b.id)}
                                style={{
                                  background: 'none',
                                  border: '1.5px solid #fee2e2',
                                  color: '#dc2626',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  fontSize: '0.8rem',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                              >
                                Cancel Session
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS CENTER */}
            {activeTab === 'notifications' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)', color: 'var(--color-primary-dark)' }}>
                    Announcements Hub
                  </h2>
                  {notifications.some(n => !n.isRead) && (
                    <button
                      onClick={markAllRead}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-accent)',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.85rem'
                      }}
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <p style={{ color: '#777', fontSize: '0.9rem' }}>No announcements found.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        style={{
                          border: '1px solid #edf2f0',
                          borderRadius: '12px',
                          padding: '16px',
                          backgroundColor: n.isRead ? '#fff' : 'var(--color-primary-light)',
                          position: 'relative',
                          transition: 'background-color 0.2s'
                        }}
                      >
                        {!n.isRead && (
                          <button 
                            onClick={() => markAsRead(n.id)}
                            style={{
                              position: 'absolute',
                              top: '16px',
                              right: '16px',
                              background: 'var(--color-accent)',
                              color: '#fff',
                              fontSize: '0.68rem',
                              fontWeight: 'bold',
                              padding: '4px 8px',
                              borderRadius: '20px',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            Mark Read
                          </button>
                        )}
                        <h4 style={{ fontWeight: 'bold', color: 'var(--color-primary-dark)', marginBottom: '4px', fontSize: '0.95rem', paddingRight: '80px' }}>
                          {n.notification.title}
                        </h4>
                        {renderNotificationDescription(n.notification.description)}
                        <span style={{ fontSize: '0.72rem', color: '#999', display: 'block' }}>
                          📅 {new Date(n.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PAYMENTS & SUBSCRIPTION PANEL */}
            {activeTab === 'payments' && (
              <div>
                <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)', marginBottom: '20px', color: 'var(--color-primary-dark)' }}>
                  Payments & Subscription
                </h2>

                {/* Sub-members section */}
                <div style={{
                  background: '#fff',
                  borderRadius: '12px',
                  padding: '24px',
                  border: '1.5px solid #edf2f0',
                  marginBottom: '30px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexDirection: isMobile ? 'column' : 'row', gap: '12px' }}>
                    <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '750', color: 'var(--color-primary-dark)', margin: 0 }}>
                        Family Members & Sub-members
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: '#777', margin: '4px 0 0 0' }}>
                        Add family members or dependent profiles to pay for their wellness subscriptions.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddSubModal(true)}
                      style={{
                        background: 'var(--color-primary-medium)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        fontSize: '0.82rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        width: isMobile ? '100%' : 'auto'
                      }}
                    >
                      + Add More
                    </button>
                  </div>

                  {subUsers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#888', fontSize: '0.85rem', border: '1px dashed #e0e6e4', borderRadius: '8px' }}>
                      No sub-members added yet. Click "+ Add More" to add family members.
                    </div>
                  ) : (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(220px, 1fr))',
                      gap: '16px'
                    }}>
                      {subUsers.map(sub => (
                        <div
                          key={sub.id}
                          style={{
                            border: '1.5px solid #edf2f0',
                            borderRadius: '8px',
                            padding: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            position: 'relative'
                          }}
                        >
                          <img
                            src={sub.photo || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23cbd5e1"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>'}
                            style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #ddd' }}
                            alt=""
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.88rem', fontWeight: 'bold', color: 'var(--color-primary-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {sub.name}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#555' }}>
                              Nakshatram: {sub.nakshatram}
                            </div>
                            {sub.phone && (
                              <div style={{ fontSize: '0.72rem', color: '#777' }}>
                                📱 {sub.phone}
                              </div>
                            )}
                            <div style={{ marginTop: '4px' }}>
                              <span style={{
                                fontSize: '0.65rem',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                fontWeight: 'bold',
                                backgroundColor: sub.subscriptionStatus === 'ACTIVE' ? '#dcfce7' : '#fee2e2',
                                color: sub.subscriptionStatus === 'ACTIVE' ? '#15803d' : '#b91c1c'
                              }}>
                                {sub.subscriptionStatus} {sub.subscriptionStatus === 'ACTIVE' && sub.subscriptionEndDate ? `(Exp: ${new Date(sub.subscriptionEndDate).toLocaleDateString('en-IN')})` : ''}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubUser(sub.id)}
                            style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              background: 'none',
                              border: 'none',
                              color: '#b91c1c',
                              cursor: 'pointer',
                              fontSize: '0.9rem'
                            }}
                            title="Remove Member"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status and Details Row */}
                <div style={{
                  background: '#fff',
                  borderRadius: '12px',
                  padding: '24px',
                  border: '1.5px solid #edf2f0',
                  marginBottom: '30px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
                }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    justifyContent: 'space-between',
                    paddingBottom: showPlanDetails ? '20px' : '0px',
                    borderBottom: showPlanDetails ? '1px solid #edf2f0' : 'none',
                    marginBottom: showPlanDetails ? '20px' : '0px',
                    gap: '16px',
                    width: '100%'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.78rem', color: '#777', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        MEMBERSHIP STATUS
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '6px 0' }}>
                        <span style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: isSubscribed ? '#22c55e' : '#ef4444'
                        }} />
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-primary-dark)', margin: 0 }}>
                          {isSubscribed ? 'Active Subscriber' : 'Expired / Unpaid'}
                        </h3>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>
                        {isSubscribed 
                          ? `Your membership is active and valid until ${new Date(subscription?.endDate).toLocaleDateString('en-IN')}`
                          : 'Renew your membership to access all live guided meditation sessions and healer discounts.'
                        }
                      </p>
                    </div>

                    {!showPlanDetails && (
                      <button
                        type="button"
                        onClick={() => setShowPlanDetails(true)}
                        style={{
                          background: 'var(--color-accent)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '12px 24px',
                          fontWeight: '700',
                          fontSize: '0.88rem',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(251, 191, 36, 0.2)',
                          transition: 'all 0.2s',
                          alignSelf: isMobile ? 'stretch' : 'center'
                        }}
                      >
                        {!isSubscribed ? '💳 Subscribe Now' : '🔄 Extend / Renew'}
                      </button>
                    )}
                  </div>

                  {showPlanDetails && (
                    <div style={{
                      animation: 'fadeIn 0.3s ease-in-out'
                    }}>
                      <h4 style={{
                        fontSize: '1.05rem',
                        fontWeight: '700',
                        color: 'var(--color-primary-dark)',
                        marginBottom: '16px'
                      }}>
                        Select Subscription Plan
                      </h4>

                      <div style={{
                        background: '#f8faf9',
                        border: '1.5px solid #edf2f0',
                        borderRadius: '10px',
                        padding: '16px',
                        marginBottom: '20px'
                      }}>
                        <h5 style={{ margin: '0 0 10px 0', fontSize: '0.88rem', fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>
                          Select Members to Pay for:
                        </h5>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={!!selectedMembers.self}
                              onChange={(e) => setSelectedMembers(prev => ({ ...prev, self: e.target.checked }))}
                            />
                            <span>
                              <strong>Primary Account (Me): {user.name}</strong> 
                              <span style={{ fontSize: '0.78rem', color: '#777', marginLeft: '6px' }}>
                                ({isSubscribed ? 'Active' : 'Unpaid'})
                              </span>
                            </span>
                          </label>
                          
                          {subUsers.map(sub => (
                            <label key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={!!selectedMembers[sub.id]}
                                onChange={(e) => setSelectedMembers(prev => ({ ...prev, [sub.id]: e.target.checked }))}
                              />
                              <span>
                                <strong>{sub.name}</strong> ({sub.nakshatram}) 
                                <span style={{ fontSize: '0.78rem', color: '#777', marginLeft: '6px' }}>
                                  ({sub.subscriptionStatus === 'ACTIVE' ? 'Active' : 'Unpaid'})
                                </span>
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: isMobile ? '12px 10px' : '16px',
                        marginBottom: '24px'
                      }}>
                        {[
                          { id: '1month', name: '1 Month Plan', unitPrice: 1500, unitTotal: 1800, duration: '30 Days', desc: '12 distance healing per month' },
                          { id: '3month', name: '3 Months Plan', unitPrice: 4500, unitTotal: 5400, duration: '90 Days', desc: '36 distance healing + more' },
                          { id: '6month', name: '6 Months Plan', unitPrice: 9000, unitTotal: 10800, duration: '180 Days', desc: '72 distance healing + more', popular: true },
                          { id: '12month', name: '12 Months Plan', unitPrice: 18000, unitTotal: 21600, duration: '365 Days', desc: '144 distance healing + more', badge: 'Best Value' }
                        ].map((plan) => {
                          const isSelected = dashPlan === plan.id;
                          const count = checkedCount || 1;
                          const calculatedPrice = plan.unitPrice * count;
                          const calculatedTotal = plan.unitTotal * count;
                          return (
                            <div
                              key={plan.id}
                              onClick={() => setDashPlan(plan.id)}
                              style={{
                                background: isSelected ? 'rgba(12, 71, 55, 0.03)' : '#fff',
                                border: isSelected ? '2px solid var(--color-primary-medium)' : '1px solid rgba(8, 50, 38, 0.12)',
                                borderRadius: '10px',
                                padding: isMobile ? '14px 8px' : '20px 16px',
                                cursor: 'pointer',
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center',
                                boxShadow: isSelected ? '0 6px 16px rgba(12, 71, 55, 0.08)' : 'none',
                                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                                transition: 'all 0.2s ease-in-out'
                              }}
                            >
                              {(plan.badge || plan.popular) && (
                                <span style={{
                                  position: 'absolute',
                                  top: '-10px',
                                  background: 'var(--color-accent)',
                                  color: '#fff',
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontSize: '0.6rem',
                                  fontWeight: '700',
                                  textTransform: 'uppercase',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {plan.badge || 'Most Popular'}
                                </span>
                              )}
                              <span style={{ fontSize: isMobile ? '0.8rem' : '0.95rem', fontWeight: '700', color: 'var(--color-primary-dark)', marginBottom: '4px' }}>
                                {plan.name}
                              </span>
                              <span style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: '800', color: 'var(--color-primary-medium)', margin: '2px 0' }}>
                                ₹{calculatedPrice.toLocaleString('en-IN')}
                              </span>
                              <span style={{ fontSize: isMobile ? '0.62rem' : '0.75rem', color: '#666', marginBottom: '8px', lineHeight: '1.2' }}>
                                {plan.noGstLabel ? 'Inclusive of GST' : `+ 18% GST (Total: ₹${calculatedTotal.toLocaleString('en-IN')})`}
                              </span>
                              <span style={{ fontSize: isMobile ? '0.7rem' : '0.82rem', color: 'var(--color-primary-medium)', fontWeight: 'bold', margin: '4px 0 8px 0', minHeight: isMobile ? '30px' : '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                ✨ {plan.desc}
                              </span>
                              <span style={{
                                display: 'inline-block',
                                padding: isMobile ? '2px 6px' : '4px 10px',
                                backgroundColor: isSelected ? 'var(--color-primary-light)' : '#f5f7f6',
                                color: 'var(--color-primary-medium)',
                                borderRadius: '12px',
                                fontSize: isMobile ? '0.68rem' : '0.78rem',
                                fontWeight: '600',
                                marginTop: 'auto'
                              }}>
                                ⏳ {plan.duration} {isMobile ? '' : 'Validity'}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', justifyContent: 'flex-end', width: '100%' }}>
                        <input
                          type="checkbox"
                          id="dashboard-privacy-policy-agree"
                          checked={agreedToPolicy}
                          onChange={(e) => setAgreedToPolicy(e.target.checked)}
                          style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                        />
                        <label htmlFor="dashboard-privacy-policy-agree" style={{ fontSize: '0.85rem', color: '#555', cursor: 'pointer', userSelect: 'none' }}>
                          I agree to the <a href="/#/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary-medium)', fontWeight: 'bold', textDecoration: 'underline' }}>Privacy Policy</a> *
                        </label>
                      </div>

                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setShowPlanDetails(false)}
                          style={{
                            background: 'none',
                            border: '1.5px solid #dcdfdc',
                            color: '#666',
                            borderRadius: '6px',
                            padding: '10px 20px',
                            fontWeight: '600',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          Close Details
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePayment(dashPlan)}
                          disabled={loadingPayment}
                          style={{
                            background: 'var(--color-accent)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '10px 24px',
                            fontWeight: '700',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(251, 191, 36, 0.25)',
                            transition: 'all 0.2s'
                          }}
                        >
                          {loadingPayment ? 'Opening Portal...' : 'Subscribe'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', marginBottom: '16px', color: 'var(--color-primary-dark)' }}>
                  Billing History & GST Invoices
                </h3>

                {payments.length === 0 ? (
                  <p style={{ color: '#777', fontSize: '0.9rem' }}>No payment invoice records found.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #edf2f0' }}>
                          <th style={{ padding: '10px 6px', color: '#555', fontSize: '0.82rem' }}>Invoice ID</th>
                          <th style={{ padding: '10px 6px', color: '#555', fontSize: '0.82rem' }}>Paid Date</th>
                          <th style={{ padding: '10px 6px', color: '#555', fontSize: '0.82rem' }}>Amount</th>
                          <th style={{ padding: '10px 6px', color: '#555', fontSize: '0.82rem' }}>Status</th>
                          <th style={{ padding: '10px 6px', color: '#555', fontSize: '0.82rem' }}>Receipt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((p) => (
                          <tr key={p.id} style={{ borderBottom: '1px solid #edf2f0' }}>
                            <td style={{ padding: '10px 6px', fontWeight: '600', color: 'var(--color-primary-dark)', fontSize: '0.82rem' }}>{p.invoiceNumber || 'Pending'}</td>
                            <td style={{ padding: '10px 6px', color: '#666', fontSize: '0.82rem' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                            <td style={{ padding: '10px 6px', fontWeight: 'bold', color: 'var(--color-primary-dark)', fontSize: '0.82rem' }}>₹{p.amount}</td>
                            <td style={{ padding: '10px 6px' }}>
                              <span style={{
                                backgroundColor: p.status === 'SUCCESS' ? '#dcfce7' : '#fee2e2',
                                color: p.status === 'SUCCESS' ? '#15803d' : '#b91c1c',
                                padding: '3px 8px',
                                borderRadius: '20px',
                                fontSize: '0.72rem',
                                fontWeight: 'bold'
                              }}>
                                {p.status}
                              </span>
                            </td>
                            <td style={{ padding: '10px 6px' }}>
                              {p.status === 'SUCCESS' && (
                                <button
                                  onClick={() => printInvoice(p)}
                                  style={{
                                    background: 'none',
                                    border: '1px solid var(--color-primary-medium)',
                                    color: 'var(--color-primary-medium)',
                                    borderRadius: '4px',
                                    padding: '3px 6px',
                                    fontSize: '0.78rem',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                  }}
                                >
                                  🖨️ Print
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* PROFILE PANEL */}
            {activeTab === 'profile' && (
              <div>
                <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)', marginBottom: '20px', color: 'var(--color-primary-dark)' }}>
                  Profile Configurations & Security
                </h2>

                {/* Edit Details Form */}
                <form onSubmit={handleUpdateProfile} style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', color: 'var(--color-primary-dark)', marginBottom: '14px', borderBottom: '1px solid #edf2f0', paddingBottom: '6px' }}>
                    Personal Information
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 'bold', marginBottom: '4px', color: '#555' }}>Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.85rem', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 'bold', marginBottom: '4px', color: '#555' }}>Mobile Number (Read-only)</label>
                      <input
                        type="text"
                        value={user?.phone}
                        disabled
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.85rem', backgroundColor: '#f5f5f5', color: '#777' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 'bold', marginBottom: '4px', color: '#555' }}>Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.85rem', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 'bold', marginBottom: '4px', color: '#555' }}>Nakshatram *</label>
                      <select
                        value={profileNakshatram}
                        onChange={(e) => setProfileNakshatram(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.85rem', outline: 'none' }}
                      >
                        {NAKSHATRAS.map(n => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 'bold', marginBottom: '4px', color: '#555' }}>Profile Photo</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUploadInForm}
                        style={{ width: '100%', padding: '6px', fontSize: '0.85rem' }}
                      />
                      {formPhotoPreview && (
                        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img src={formPhotoPreview} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #ddd' }} alt="Preview" />
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-primary-medium)', fontWeight: '600' }}>Photo selected</span>
                        </div>
                      )}
                    </div>
                    <div style={{ visibility: 'hidden' }}>
                      {/* Empty column placeholder to maintain grid alignment */}
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 'bold', marginBottom: '4px', color: '#555' }}>Postal Address</label>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={2}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #ddd', resize: 'none', fontFamily: 'inherit', fontSize: '0.85rem', outline: 'none' }}
                    />
                  </div>

                  <button
                    type="submit"
                    style={{
                      background: 'var(--color-primary-medium)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 18px',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(12, 71, 55, 0.2)'
                    }}
                  >
                    Save Changes
                  </button>
                </form>

                {/* Change Credentials Password Form */}
                <form onSubmit={handleChangePassword}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', color: 'var(--color-primary-dark)', marginBottom: '14px', borderBottom: '1px solid #edf2f0', paddingBottom: '6px' }}>
                    Security Password Override
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 'bold', marginBottom: '4px', color: '#555' }}>Current Password</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.85rem', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 'bold', marginBottom: '4px', color: '#555' }}>New Secure Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.85rem', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    style={{
                      background: 'var(--color-primary-medium)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 18px',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(12, 71, 55, 0.2)'
                    }}
                  >
                    Change Password
                  </button>
                </form>
              </div>
            )}

      {showAddSubModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '24px',
            width: '100%',
            maxWidth: '450px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '1.2rem', margin: '0 0 16px 0', color: 'var(--color-primary-dark)', fontWeight: 'bold' }}>
              Add Family Member / Sub-member
            </h3>
            
            <form onSubmit={handleAddSubUserSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '6px', color: '#555' }}>
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                  placeholder="Enter full name"
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '6px', color: '#555' }}>
                  Mobile Number (Optional)
                </label>
                <input
                  type="tel"
                  value={subPhone}
                  onChange={(e) => setSubPhone(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                  placeholder="e.g. +919876543210"
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '6px', color: '#555' }}>
                  Nakshatram *
                </label>
                <select
                  value={subNakshatram}
                  onChange={(e) => setSubNakshatram(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                >
                  {NAKSHATRAS.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '6px', color: '#555' }}>
                  Profile Photo (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSubPhotoChange}
                  style={{ width: '100%' }}
                />
                {subPhotoBase64 && (
                  <img
                    src={subPhotoBase64}
                    style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', marginTop: '10px', border: '1px solid #ccc' }}
                    alt="Preview"
                  />
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSubModal(false);
                    setSubName('');
                    setSubPhone('');
                    setSubNakshatram('Ashwini');
                    setSubPhotoBase64('');
                  }}
                  style={{
                    background: 'none',
                    border: '1.5px solid #dcdfdc',
                    color: '#666',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingSubUser}
                  style={{
                    background: 'var(--color-primary-medium)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 20px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {addingSubUser ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

          </div>
        </main>

      </div>
    </div>
  );
}
