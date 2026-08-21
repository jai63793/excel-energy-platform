import { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { authSuccess, logoutSuccess } from './store/authSlice';
import api from './services/api';
import axios from 'axios';
import Header from './components/Header';
import Footer from './components/Footer';
import InvitationPopup from './components/InvitationPopup';
import Home from './pages/Home';
import About from './pages/About';
import Programs from './pages/Programs';
import Courses from './pages/Courses';
import Knowledge from './pages/Knowledge';
import Contact from './pages/Contact';
import JoinMember from './pages/JoinMember';
import MiraclesBooking from './pages/MiraclesBooking';

// New auth & dashboards
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SecureAdminLogin from './pages/SecureAdminLogin';
import EmployeeLogin from './pages/EmployeeLogin';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';

// Scroll reset component to bring page to top on navigation route change
function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
}

function ScrollToTopButton() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <button
            onClick={scrollToTop}
            className={`scroll-to-top-btn ${isVisible ? 'visible' : ''}`}
            aria-label="Scroll to top"
        >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
        </button>
    );
}

// Protected route wrapper for subscribers
function PrivateRoute({ children }) {
    const { isAuthenticated } = useSelector((state) => state.auth);
    return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// Protected route wrapper for staff members
function EmployeeRoute({ children }) {
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const isStaff = isAuthenticated && (user?.role === 'EMPLOYEE' || user?.role === 'VOLUNTEER' || user?.role === 'ADMIN');
    return isStaff ? children : <Navigate to="/login" replace />;
}

// Protected route wrapper for system administrators
function AdminRoute({ children }) {
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    return isAuthenticated && user?.role === 'ADMIN' ? children : <Navigate to="/secure-admin-login" replace />;
}

// Global Distant Healing Promotion Banner Component
const getImageUrl = (name) => {
    return new URL(`./assets/images/${name}`, import.meta.url).href;
};

function DistantHealingPromoBanner() {
    return (
        <section className="distant-healing-promo-banner" style={{
            background: `linear-gradient(rgba(8, 50, 38, 0.75), rgba(8, 50, 38, 0.85)), url(${getImageUrl('distant_healing_banner.jpg')})`
        }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', padding: '0 20px' }}>
                <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: '700', 
                    letterSpacing: '3px', 
                    color: 'var(--color-accent)', 
                    textTransform: 'uppercase',
                    display: 'block',
                    marginBottom: '12px'
                }}>
                    SPECIAL REMOTE PROGRAM
                </span>
                <h2 style={{ 
                    fontSize: '2.4rem', 
                    fontFamily: 'var(--font-heading)', 
                    marginBottom: '16px', 
                    fontWeight: '700',
                    lineHeight: '1.3',
                    color: 'var(--color-white)'
                }}>
                    Receive 12 Distant Healing Sessions for Just ₹1500/Month
                </h2>
                <Link 
                    to="/join-member"
                    className="btn-primary" 
                    style={{ 
                        display: 'inline-flex', 
                        padding: '14px 32px', 
                        backgroundColor: 'var(--color-accent)',
                        color: 'var(--color-white)'
                    }}
                >
                    Apply / Register Interest
                </Link>
            </div>
        </section>
    );
}



// Floating Caller Widget rendered on all pages (bottom-left corner)
function FloatingCallWidget() {
    const location = useLocation();
    
    const isDashboardOrAdmin = 
        location.pathname.startsWith('/admin') || 
        location.pathname.startsWith('/employee') || 
        location.pathname === '/dashboard' || 
        location.pathname === '/login' || 
        location.pathname === '/secure-admin-login' || 
        location.pathname === '/employee-login';

    if (isDashboardOrAdmin) return null;

    return (
        <a 
            href="tel:+918310728826"
            className="floating-call-btn"
            style={{
                position: 'fixed',
                bottom: '30px',
                left: '30px',
                width: '56px',
                height: '56px',
                backgroundColor: '#25D366',
                color: 'var(--color-white)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(37, 211, 102, 0.4)',
                zIndex: '99',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                cursor: 'pointer',
                animation: 'pulse-glow-green 2s infinite'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 211, 102, 0.6)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(37, 211, 102, 0.4)';
            }}
            aria-label="Call Excel Energy support"
        >
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
        </a>
    );
}

function AppContent() {
    const location = useLocation();
    const dispatch = useDispatch();
    const [checkingSession, setCheckingSession] = useState(true);
    const [animationLoading, setAnimationLoading] = useState(true);
    const [isFadingOut, setIsFadingOut] = useState(false);
    const [preloaderDestroyed, setPreloaderDestroyed] = useState(false);

    // Minimum animation display duration of 3 seconds (3000ms)
    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimationLoading(false);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const verifySession = async () => {
            try {
                const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');
                const response = await axios.post(
                    `${API_BASE_URL}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                 if (response.data?.success) {
                    const { user } = response.data;
                    dispatch(authSuccess({ user, accessToken: null }));
                } else {
                    dispatch(logoutSuccess());
                }
            } catch (err) {
                dispatch(logoutSuccess());
            } finally {
                setCheckingSession(false);
            }
        };
        verifySession();
    }, [dispatch]);

    // Handle smooth transition fadeout once both session check and minimum animation time finish
    useEffect(() => {
        if (!checkingSession && !animationLoading) {
            setIsFadingOut(true);
            const timer = setTimeout(() => {
                setPreloaderDestroyed(true);
            }, 500); // Matches the 0.5s CSS transition duration
            return () => clearTimeout(timer);
        }
    }, [checkingSession, animationLoading]);

    // Hide standard Header & Footer inside full-page dashboard consoles
    const isDashboardOrAdmin = location.pathname.startsWith('/admin') || location.pathname.startsWith('/employee') || location.pathname === '/dashboard' || location.pathname === '/login' || location.pathname === '/secure-admin-login' || location.pathname === '/employee-login';

    const renderPreloader = () => (
        <div className={`opening-animation-overlay ${isFadingOut ? 'fade-out' : ''}`}>
            <img 
                src={getImageUrl('excel-energies-logo-opening-animation.gif')} 
                alt="Excel Energy Opening Animation" 
                className="opening-animation-gif" 
            />
        </div>
    );

    const renderMainContent = () => (
        <div className="app-wrapper">
            <ScrollToTop />
            
            {/* Common Header navigation (hidden on consoles) */}
            {!isDashboardOrAdmin && <Header />}

            {/* Wellness Invitation Popup */}
            <InvitationPopup />

            <main>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/services" element={<Programs />} />
                    <Route path="/courses" element={<Courses />} />
                    <Route path="/knowledge" element={<Knowledge />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/join-member" element={<JoinMember />} />
                    <Route path="/8-miracles-booking" element={<MiraclesBooking />} />
                    <Route path="/miraclesbooking" element={<MiraclesBooking />} />
                    
                    {/* Subscription Platform Portals */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                    <Route path="/employee/dashboard" element={<EmployeeRoute><EmployeeDashboard /></EmployeeRoute>} />
                    <Route path="/employee-login" element={<EmployeeLogin />} />
                    <Route path="/secure-admin-login" element={<SecureAdminLogin />} />
                    <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                </Routes>
            </main>

            {!isDashboardOrAdmin && <DistantHealingPromoBanner />}

            {/* Scroll to Top float button */}
            <ScrollToTopButton />

            {/* Floating Caller Icon (Direct Call) */}
            <FloatingCallWidget />

            {/* Common Footer elements (hidden on consoles) */}
            {!isDashboardOrAdmin && <Footer />}
        </div>
    );

    if (!preloaderDestroyed) {
        const showWebsite = !checkingSession && !animationLoading;
        return (
            <>
                {renderPreloader()}
                {showWebsite && renderMainContent()}
            </>
        );
    }

    return renderMainContent();
}

export default function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}
