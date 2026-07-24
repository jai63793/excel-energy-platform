import { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { servicesData } from '../data/servicesData';

export default function Header() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
    const [mobileKnowledgeOpen, setMobileKnowledgeOpen] = useState(false);
    const [mobileLoginOpen, setMobileLoginOpen] = useState(false);
    const location = useLocation();
    const { isAuthenticated, user } = useSelector((state) => state.auth);

    // Add scroll listener to shrink/blur header on scroll
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu and submenus on page navigate
    useEffect(() => {
        setTimeout(() => {
            setMobileOpen(false);
            setMobileServicesOpen(false);
            setMobileKnowledgeOpen(false);
            setMobileLoginOpen(false);
        }, 0);
    }, [location.pathname]);

    return (
        <header className={`site-header ${scrolled ? 'scrolled' : ''}`} id="site-header">
            {/* Top Row: Language selection and Centered Logo */}
            <div className="header-top">
                <div className="header-top-container">
                    <div className="header-top-left">
                        <div className="region-selector">
                            <span>India - English</span>
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" className="chevron-down">
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </div>
                    </div>
                    
                    <div className="header-top-center">
                        <Link to="/" className="logo-center" id="header-logo">
                            <img src={new URL('../assets/images/logo.png', import.meta.url).href} alt="Excel Energy Logo" className="logo-img" />
                        </Link>
                    </div>

                    <div className="header-top-right">
                        <button 
                            className={`mobile-toggle ${mobileOpen ? 'open' : ''}`} 
                            id="mobile-toggle" 
                            onClick={() => setMobileOpen(!mobileOpen)}
                            aria-label="Toggle navigation menu"
                        >
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Centered Navigation links */}
            <div className="header-bottom">
                <div className="header-bottom-container">
                    {/* Mobile Menu Backdrop Overlay */}
                    {mobileOpen && (
                        <div 
                            className="nav-menu-backdrop" 
                            onClick={() => setMobileOpen(false)}
                            aria-hidden="true"
                        />
                    )}

                    <nav className={`nav-menu ${mobileOpen ? 'open' : ''}`} id="nav-menu">
                        <NavLink to="/about" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            About Us
                        </NavLink>
                        
                        {/* Services Dropdown */}
                        <div className={`nav-item-dropdown ${mobileServicesOpen ? 'submenu-open' : ''}`}>
                            <Link 
                                to="/services"
                                className={`nav-link dropdown-toggle ${location.pathname === '/services' ? 'active' : ''}`}
                                onClick={(e) => {
                                    if (window.innerWidth <= 768) {
                                        e.preventDefault();
                                        setMobileServicesOpen(!mobileServicesOpen);
                                    }
                                }}
                                aria-expanded={mobileServicesOpen}
                            >
                                <span>Services</span>
                                <svg className="dropdown-chevron" viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </Link>
                            <div className="dropdown-menu">
                                <Link to="/services" className="dropdown-item main-link" onClick={() => setMobileOpen(false)}>
                                    All Services
                                </Link>
                                {servicesData.map((service, index) => (
                                    <Link 
                                        key={service.id} 
                                        to={`/services?id=${service.id}`} 
                                        state={{ serviceIndex: index }} 
                                        className="dropdown-item"
                                        onClick={() => setMobileOpen(false)}
                                    >
                                        {service.title}
                                    </Link>
                                ))}
                            </div>
                        </div>
                        
                        <NavLink to="/courses" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            Courses
                        </NavLink>

                        {/* Knowledge Dropdown */}
                        <div className={`nav-item-dropdown ${mobileKnowledgeOpen ? 'submenu-open' : ''}`}>
                            <Link 
                                to="/knowledge"
                                className={`nav-link dropdown-toggle ${location.pathname === '/knowledge' ? 'active' : ''}`}
                                onClick={(e) => {
                                    if (window.innerWidth <= 768) {
                                        e.preventDefault();
                                        setMobileKnowledgeOpen(!mobileKnowledgeOpen);
                                    }
                                }}
                                aria-expanded={mobileKnowledgeOpen}
                            >
                                <span>Knowledge</span>
                                <svg className="dropdown-chevron" viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </Link>
                            <div className="dropdown-menu">
                                <Link to="/knowledge" className="dropdown-item main-link" onClick={() => setMobileOpen(false)}>
                                    All Knowledge
                                </Link>
                                <Link to="/knowledge?tab=chakras" className="dropdown-item" onClick={() => setMobileOpen(false)}>
                                    Chakras &amp; Energy Body
                                </Link>
                                <Link to="/knowledge?tab=arhatic" className="dropdown-item" onClick={() => setMobileOpen(false)}>
                                    Arhatic Yoga&#174;
                                </Link>
                                <Link to="/knowledge?tab=practice" className="dropdown-item" onClick={() => setMobileOpen(false)}>
                                    Meditation &amp; Bio-Well
                                </Link>
                            </div>
                        </div>
                        
                        <NavLink to="/contact" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            Contact Us
                        </NavLink>

                        {isAuthenticated ? (
                            <Link 
                                to={
                                    user?.role === 'ADMIN' 
                                        ? '/admin/dashboard' 
                                        : (user?.role === 'EMPLOYEE' || user?.role === 'VOLUNTEER') 
                                            ? '/employee/dashboard' 
                                            : '/dashboard'
                                } 
                                className="btn-join" 
                                onClick={() => setMobileOpen(false)}
                            >
                                <span>Dashboard</span>
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                    <polyline points="12 5 19 12 12 19"></polyline>
                                </svg>
                            </Link>
                        ) : (
                            <>
                                {/* Login Portal Dropdown */}
                                <div className={`nav-item-dropdown ${mobileLoginOpen ? 'submenu-open' : ''}`}>
                                    <Link 
                                        to="/login"
                                        className={`nav-link dropdown-toggle ${location.pathname === '/login' || location.pathname === '/employee-login' ? 'active' : ''}`}
                                        onClick={(e) => {
                                            if (window.innerWidth <= 768) {
                                                e.preventDefault();
                                                setMobileLoginOpen(!mobileLoginOpen);
                                            }
                                        }}
                                        aria-expanded={mobileLoginOpen}
                                    >
                                        <span>Login Portal</span>
                                        <svg className="dropdown-chevron" viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                    </Link>
                                    <div className="dropdown-menu">
                                        <Link to="/login" className="dropdown-item" onClick={() => setMobileOpen(false)}>
                                            👤 User Login
                                        </Link>
                                        <Link to="/employee-login" className="dropdown-item" onClick={() => setMobileOpen(false)}>
                                            💼 Employee Portal
                                        </Link>
                                    </div>
                                </div>

                                <Link 
                                    to="/join-member" 
                                    className="btn-join" 
                                    onClick={() => setMobileOpen(false)}
                                >
                                    <span>Join Member</span>
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                        <polyline points="12 5 19 12 12 19"></polyline>
                                    </svg>
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            </div>
        </header>
    );
}

