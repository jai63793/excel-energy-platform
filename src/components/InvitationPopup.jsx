import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import remoteProgramImg from '../assets/images/distant_healing_banner.jpg';

export default function InvitationPopup() {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // Check if the current route is a dashboard, admin console, or login page
    const isDashboardOrAdmin = 
        location.pathname.startsWith('/admin') || 
        location.pathname.startsWith('/employee') || 
        location.pathname === '/dashboard' || 
        location.pathname === '/login' || 
        location.pathname === '/secure-admin-login' || 
        location.pathname === '/employee-login';

    useEffect(() => {
        // If it's a dashboard or admin/login page, make sure popup is closed
        if (isDashboardOrAdmin) {
            setIsOpen(false);
            return;
        }

        // Reset and trigger popup on every page navigation (pathname change)
        setIsOpen(false);
        const timer = setTimeout(() => {
            setIsOpen(true);
        }, 800);

        return () => clearTimeout(timer);
    }, [location.pathname, isDashboardOrAdmin]);

    const handleClose = () => {
        setIsOpen(false);
    };

    const handleJoinClick = () => {
        handleClose();
        navigate('/join-member');
    };

    if (!isOpen || isDashboardOrAdmin) return null;

    return (
        <div className="invitation-popup-overlay" onClick={handleClose}>
            <div className="invitation-popup-content" onClick={(e) => e.stopPropagation()}>
                {/* Close Button */}
                <button className="invitation-popup-close" onClick={handleClose} aria-label="Close invitation">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                {/* Poster Image */}
                <div className="invitation-popup-image-container" style={{ position: 'relative' }}>
                    <img 
                        src={remoteProgramImg} 
                        alt="Special Remote Program - Receive 12 Distant Healing Sessions for Just ₹1500/Month" 
                        className="invitation-popup-image" 
                    />
                    
                    {/* Text Overlay */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(rgba(8, 50, 38, 0.45), rgba(8, 50, 38, 0.65))',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                        padding: '30px',
                        color: 'var(--color-white)',
                        boxSizing: 'border-box'
                    }}>
                        <span style={{ 
                            fontSize: '0.78rem', 
                            fontWeight: '700', 
                            letterSpacing: '2.5px', 
                            color: 'var(--color-accent)', 
                            textTransform: 'uppercase',
                            marginBottom: '10px'
                        }}>
                            SPECIAL REMOTE PROGRAM
                        </span>
                        <h2 style={{ 
                            fontSize: '1.8rem', 
                            fontFamily: 'var(--font-heading)', 
                            fontWeight: '700', 
                            lineHeight: '1.3', 
                            maxWidth: '360px',
                            margin: 0,
                            color: 'var(--color-white)'
                        }}>
                            Receive 12 Distant Healing Sessions for Just ₹1500/Month
                        </h2>
                    </div>
                </div>

                {/* Join Member CTA Button Panel */}
                <div className="invitation-popup-footer">
                    <button className="btn-primary invitation-cta-btn" onClick={handleJoinClick}>
                        <span>Apply / Register Interest</span>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
