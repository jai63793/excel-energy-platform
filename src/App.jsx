import { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Programs from './pages/Programs';
import Courses from './pages/Courses';
import Knowledge from './pages/Knowledge';
import Contact from './pages/Contact';
import JoinMember from './pages/JoinMember';

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

function AppContent() {
    const location = useLocation();
    
    // Hide standard Header & Footer inside full-page dashboard consoles
    const isDashboardOrAdmin = location.pathname.startsWith('/admin') || location.pathname.startsWith('/employee') || location.pathname === '/dashboard' || location.pathname === '/login' || location.pathname === '/secure-admin-login' || location.pathname === '/employee-login';

    return (
        <div className="app-wrapper">
            <ScrollToTop />
            
            {/* Common Header navigation (hidden on consoles) */}
            {!isDashboardOrAdmin && <Header />}

            <main>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/services" element={<Programs />} />
                    <Route path="/courses" element={<Courses />} />
                    <Route path="/knowledge" element={<Knowledge />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/join-member" element={<JoinMember />} />
                    
                    {/* Subscription Platform Portals */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                    <Route path="/employee/dashboard" element={<EmployeeRoute><EmployeeDashboard /></EmployeeRoute>} />
                    <Route path="/employee-login" element={<EmployeeLogin />} />
                    <Route path="/secure-admin-login" element={<SecureAdminLogin />} />
                    <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                </Routes>
            </main>

            {/* Common Footer elements (hidden on consoles) */}
            {!isDashboardOrAdmin && <Footer />}
        </div>
    );
}

export default function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}
