import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import gsap from 'gsap';
import api from '../services/api';
import SharedAbout from '../components/SharedAbout';

// Helper to resolve local image URLs
const getImageUrl = (name) => {
    return new URL(`../assets/images/${name}`, import.meta.url).href;
};

const BENEFITS = [
    {
        title: 'Twelve Distant Divine Healing Sessions',
        desc: 'Receive 12 Distant Divine Healing sessions every month, conducted three days a week. These sessions are conducted remotely, allowing you to receive healing support wherever you are.',
        icon: (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                <path d="M12 6a15.3 15.3 0 0 1 2.5 6 15.3 15.3 0 0 1-2.5 6 15.3 15.3 0 0 1-2.5-6 15.3 15.3 0 0 1 2.5-6z" />
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v4M12 18v4M4 12h4M16 12h4" />
            </svg>
        )
    },
    {
        title: 'Monthly Sacred Homa',
        desc: 'Be included in a sacred Homa conducted once every month for divine blessings, purification and overall well-being.',
        icon: (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 3.5 3.5z" />
            </svg>
        )
    },
    {
        title: 'Crystal Spa Therapy Privilege',
        desc: 'Receive an exclusive 10% discount on Crystal Spa Therapy sessions.',
        icon: (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 3h12l4 6-10 12L2 9z" />
                <path d="M11 3 8 9l4 12 4-12-3-6" />
                <path d="M2 9h20" />
            </svg>
        )
    },
    {
        title: 'Monthly Family Seva Opportunity',
        desc: 'Join us with your family for one charitable activity every month and experience the joy of serving others together. Activities may include: Food distribution, Rice distribution, Support for people in need, and other meaningful service initiatives.',
        icon: (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
        )
    },
    {
        title: 'Complimentary Meditation Training',
        desc: 'Learn a powerful meditation practice, offered complimentary as part of your membership.',
        icon: (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
        )
    },
    {
        title: 'Daily Online Meditation Sessions',
        desc: 'Join our everyday online group meditation sessions and develop greater peace, inner strength and spiritual connection through regular practice.',
        icon: (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                <path d="M2 12h20" />
            </svg>
        )
    },
    {
        title: 'Guidance for Pranic Healing and Arhatic Yoga Courses',
        desc: 'Receive proper guidance to understand and progress through the various Pranic Healing and Arhatic Yoga courses according to your interests and level of learning. Course fees and eligibility requirements apply separately.',
        icon: (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
            </svg>
        )
    },
    {
        title: 'Special Discount on GDV Camera Reports',
        desc: 'Receive a special membership discount on GDV Camera Energy Reading and Scanning Reports. These reports provide an informative assessment of the energy body and its condition at the time of scanning.',
        icon: (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
            </svg>
        )
    },
    {
        title: 'Full Moon Meditation in Your Community',
        desc: 'Members can invite the Excel Energy team to conduct a powerful Full Moon Meditation within their apartment, neighbourhood, organisation or community—helping create greater peace, harmony and positive energy in the surrounding area. Subject to prior arrangement, location and team availability.',
        icon: (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 3a9 9 0 0 0 0 18" fill="rgba(224, 112, 43, 0.15)" />
            </svg>
        )
    }
];

const PLANS = [
    { id: '1month', name: '1 Month Plan', price: 1500, label: '1 Month Membership Fee', tag: 'Monthly Renewal' },
    { id: '3month', name: '3 Month Plan', price: 4500, label: '3 Months Membership Fee', tag: 'Quarterly Renewal', badge: 'Most Popular' },
    { id: '6month', name: '6 Month Plan', price: 9000, label: '6 Months Membership Fee', tag: 'Half-Yearly Renewal', badge: 'Best Value' }
];

export default function JoinMember() {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, user } = useSelector((state) => state.auth);

    const [selectedPlan, setSelectedPlan] = useState(PLANS[0]);
    const [loadingPayment, setLoadingPayment] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [invoiceNum, setInvoiceNum] = useState('');
    const [expiryVal, setExpiryVal] = useState('');

    const containerRef = useRef(null);

    // Read selected plan from query parameters on load
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const planParam = queryParams.get('plan');
        if (planParam) {
            const planObj = PLANS.find(p => p.id === planParam);
            if (planObj) {
                setSelectedPlan(planObj);
            }
        }
    }, [location.search]);

    // Initial page entrance animations
    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo('.join-member-hero-content h1, .join-member-hero-content p', 
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'power3.out' }
            );

            gsap.fromTo('.benefits-column', 
                { x: -40, opacity: 0 },
                { x: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.3 }
            );

            gsap.fromTo('.form-column', 
                { x: 40, opacity: 0 },
                { x: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.4 }
            );

            gsap.fromTo('.benefit-card', 
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out', delay: 0.5 }
            );
        }, containerRef);

        return () => ctx.revert();
    }, []);

    const gstAmount = Math.round(selectedPlan.price * 0.18);
    const totalAmount = selectedPlan.price + gstAmount;

    // Load Razorpay Checkout dynamically
    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayNow = async () => {
        if (!isAuthenticated) {
            toast('Please sign in or register to purchase your Divine Wellness Membership.', { icon: '🔑' });
            navigate('/login', { 
                state: { 
                    from: { 
                        pathname: '/join-member', 
                        search: `?plan=${selectedPlan.id}` 
                    } 
                } 
            });
            return;
        }

        setLoadingPayment(true);
        const scriptLoaded = await loadRazorpayScript();
        
        if (!scriptLoaded) {
            toast.error('Failed to load payment portal script. Please check your network connection.');
            setLoadingPayment(false);
            return;
        }

        try {
            // 1. Create order on backend
            const orderRes = await api.post('/payments/create-order', { plan: selectedPlan.id });
            const { orderId, amount, currency, keyId } = orderRes.data;

            // 2. Open Razorpay checkout modal
            const options = {
                key: keyId,
                amount: amount,
                currency: currency,
                name: 'Excel Energy',
                description: `Divine Wellness Membership - ${selectedPlan.name}`,
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
                            toast.success('Membership activated successfully!');
                            setInvoiceNum(verifyRes.data.invoiceNumber);
                            setExpiryVal(new Date(verifyRes.data.expiryDate).toLocaleDateString('en-IN'));
                            setPaymentSuccess(true);
                        }
                    } catch (verifyErr) {
                        toast.dismiss();
                        toast.error(verifyErr.response?.data?.message || 'Verification failed. Contact support.');
                    } finally {
                        setLoadingPayment(false);
                    }
                },
                prefill: {
                    name: user?.name || '',
                    email: user?.email || '',
                    contact: user?.phone || ''
                },
                theme: {
                    color: '#0c4737' // Forest green
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

    return (
        <div className="join-member-page-wrapper" ref={containerRef}>
            {/* Hero Sub-Banner Section */}
            <section className="join-member-hero page-hero-banner">
                <div className="join-member-hero-content">
                    <span className="section-tagline">WELLNESS & SERVICE</span>
                    <h1>Excel Energy Divine Wellness Membership</h1>
                    <p style={{ fontStyle: 'italic', color: 'var(--color-accent)', fontSize: '1.25rem', marginBottom: '12px', fontWeight: '600' }}>
                        Healing • Meditation • Spiritual Growth • Seva
                    </p>
                    <p style={{ maxWidth: '750px', margin: '0 auto 20px auto', lineHeight: '1.6' }}>
                        A comprehensive monthly programme designed to support your physical, emotional and spiritual well-being through healing, meditation, spiritual guidance and charitable service.
                    </p>
                    <div className="breadcrumbs">
                        <Link to="/">Home</Link>
                        <span className="crumb-separator">/</span>
                        <span className="active-crumb">Membership</span>
                    </div>
                </div>
            </section>

            {/* Main Content Sections */}
            <section className="join-member-main-section">
                <div className="join-member-container">
                    <div className="join-member-grid">
                        
                        {/* Left Column: Benefits & Details */}
                        <div className="benefits-column">
                            {/* Membership Details */}
                            <div className="membership-price-card">
                                <span className="price-badge">DIVINE WELLNESS PROGRAMME</span>
                                <div className="price-label">Monthly Membership Fee</div>
                                <div className="price-value">₹1,500 <span className="price-taxes">+ applicable taxes</span></div>
                                <p className="price-subtext">A complete wellness program supporting your body, mind, and spirit.</p>
                            </div>

                            <h2 className="join-column-title" style={{ marginTop: '40px' }}>Membership Benefits</h2>
                            <div className="benefits-list">
                                {BENEFITS.map((benefit, index) => (
                                    <div key={index} className="benefit-card">
                                        <div className="benefit-card-header">
                                            <div className="benefit-icon-wrapper">
                                                {benefit.icon}
                                            </div>
                                            <h3>{benefit.title}</h3>
                                        </div>
                                        <p>{benefit.desc}</p>
                                    </div>
                                ))}
                            </div>

                            {/* A Complete Wellness Experience Summary */}
                            <div className="wellness-summary-card">
                                <h3 className="summary-card-title">A Complete Wellness Experience</h3>
                                <p className="summary-card-desc">The Divine Wellness Membership brings together:</p>
                                <ul className="summary-list">
                                    <li><span className="bullet-check">✓</span> Regular Divine Healing</li>
                                    <li><span className="bullet-check">✓</span> Daily group meditation</li>
                                    <li><span className="bullet-check">✓</span> Sacred Homa</li>
                                    <li><span className="bullet-check">✓</span> Meditation training</li>
                                    <li><span className="bullet-check">✓</span> Crystal Spa Therapy privileges</li>
                                    <li><span className="bullet-check">✓</span> Energy scanning reports</li>
                                    <li><span className="bullet-check">✓</span> Guidance for spiritual courses</li>
                                    <li><span className="bullet-check">✓</span> Family Seva activities</li>
                                    <li><span className="bullet-check">✓</span> Full Moon Meditation for your community</li>
                                </ul>
                            </div>

                            {/* Medical Disclaimer */}
                            <div className="membership-disclaimer">
                                <strong>Important Notice:</strong> Pranic Healing is a complementary wellness practice and is not intended to replace medical diagnosis, prescribed medication or professional medical treatment.
                            </div>
                        </div>

                        {/* Right Column: Plans and Payment */}
                        <div className="form-column">
                            <h2 className="join-column-title">Become an Excel Energy Member</h2>
                            <div className="join-form-card" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                                {!paymentSuccess ? (
                                    <>
                                        <div style={{ marginBottom: '24px' }}>
                                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem', marginBottom: '16px', lineHeight: '1.5' }}>
                                                Select your subscription plan. All plans include full access to the Divine Wellness program benefits.
                                            </p>
                                            
                                            {/* Plan Options Selector */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                {PLANS.map((plan) => {
                                                    const isSelected = selectedPlan.id === plan.id;
                                                    return (
                                                        <div 
                                                            key={plan.id}
                                                            onClick={() => setSelectedPlan(plan)}
                                                            style={{
                                                                border: isSelected ? '2px solid var(--color-accent)' : '1.5px solid rgba(8, 50, 38, 0.1)',
                                                                background: isSelected ? 'rgba(224, 112, 43, 0.04)' : '#fff',
                                                                borderRadius: '8px',
                                                                padding: '16px 20px',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s ease',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                position: 'relative'
                                                            }}
                                                        >
                                                            {plan.badge && (
                                                                <span style={{
                                                                    position: 'absolute',
                                                                    top: '-10px',
                                                                    right: '15px',
                                                                    background: 'var(--color-primary-medium)',
                                                                    color: '#fff',
                                                                    fontSize: '0.65rem',
                                                                    fontWeight: 'bold',
                                                                    padding: '2px 8px',
                                                                    borderRadius: '20px',
                                                                    textTransform: 'uppercase',
                                                                    letterSpacing: '0.5px'
                                                                }}>
                                                                    {plan.badge}
                                                                </span>
                                                            )}
                                                            
                                                            <div>
                                                                <h4 style={{ margin: '0 0 4px 0', color: 'var(--color-primary-dark)', fontSize: '1.05rem', fontWeight: '600' }}>
                                                                    {plan.name}
                                                                </h4>
                                                                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>
                                                                    {plan.tag}
                                                                </span>
                                                            </div>
                                                            <div style={{ textAlign: 'right' }}>
                                                                <div style={{ fontSize: '1.25rem', fontWeight: '750', color: isSelected ? 'var(--color-accent)' : 'var(--color-primary-dark)' }}>
                                                                    ₹{plan.price.toLocaleString('en-IN')}
                                                                </div>
                                                                <span style={{ fontSize: '0.72rem', color: '#888' }}>+ 18% GST</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Price Breakdown */}
                                        <div style={{
                                            background: '#fcfaf7',
                                            border: '1px solid rgba(224, 112, 43, 0.1)',
                                            borderRadius: '8px',
                                            padding: '16px 20px',
                                            marginBottom: '24px',
                                            fontSize: '0.9rem'
                                        }}>
                                            <h4 style={{ margin: '0 0 12px 0', color: 'var(--color-primary-dark)', borderBottom: '1px solid rgba(8,50,38,0.08)', paddingBottom: '8px', fontSize: '0.95rem' }}>
                                                Pricing Summary
                                            </h4>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--color-text-muted)' }}>
                                                <span>Base Amount:</span>
                                                <span>₹{selectedPlan.price.toLocaleString('en-IN')}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: 'var(--color-text-muted)' }}>
                                                <span>CGST & SGST (18%):</span>
                                                <span>₹{gstAmount.toLocaleString('en-IN')}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '750', fontSize: '1.05rem', color: 'var(--color-primary-dark)', borderTop: '1px solid rgba(8,50,38,0.08)', paddingTop: '10px' }}>
                                                <span>Total Payable:</span>
                                                <span>₹{totalAmount.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>

                                        {/* Payment Button */}
                                        <button 
                                            onClick={handlePayNow} 
                                            disabled={loadingPayment}
                                            className="join-submit-btn"
                                            style={{
                                                width: '100%',
                                                padding: '16px 24px',
                                                fontSize: '1.05rem',
                                                marginTop: 'auto'
                                            }}
                                        >
                                            {loadingPayment ? (
                                                <span>Processing Gateway...</span>
                                            ) : (
                                                <>
                                                    <span>{isAuthenticated ? 'Pay Now' : 'Login / Register to Pay'}</span>
                                                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                                        <polyline points="12 5 19 12 12 19"></polyline>
                                                    </svg>
                                                </>
                                            )}
                                        </button>
                                        
                                        <p style={{ textAlign: 'center', fontSize: '0.78rem', color: '#999', marginTop: '15px', lineHeight: '1.4' }}>
                                            By clicking above, you agree to our Terms of Service. Payments are secured and processed via Razorpay.
                                        </p>
                                    </>
                                ) : (
                                    <div className="join-success-overlay" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px 30px' }}>
                                        <div className="join-success-icon" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        </div>
                                        <h3 className="join-success-title" style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>Payment Successful!</h3>
                                        <p className="join-success-text" style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', margin: '10px 0 25px 0', lineHeight: '1.6' }}>
                                            Thank you, <strong>{user?.name || 'Valued Member'}</strong>! Your subscription is now active.
                                        </p>
                                        
                                        <div style={{
                                            width: '100%',
                                            background: 'var(--color-primary-light)',
                                            borderRadius: '8px',
                                            padding: '16px 20px',
                                            marginBottom: '30px',
                                            textAlign: 'left',
                                            fontSize: '0.9rem'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <span style={{ color: 'var(--color-text-muted)' }}>Invoice Number:</span>
                                                <strong style={{ color: 'var(--color-primary-dark)' }}>{invoiceNum}</strong>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <span style={{ color: 'var(--color-text-muted)' }}>Selected Plan:</span>
                                                <strong style={{ color: 'var(--color-primary-dark)' }}>{selectedPlan.name}</strong>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: 'var(--color-text-muted)' }}>Valid Until:</span>
                                                <strong style={{ color: 'var(--color-primary-dark)' }}>{expiryVal}</strong>
                                            </div>
                                        </div>
                                        
                                        <button onClick={() => navigate('/dashboard')} className="join-success-close-btn" style={{ padding: '12px 30px', fontSize: '1rem', width: '100%' }}>
                                            Go to Dashboard
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            <SharedAbout
                tagline="OUR SPIRITUAL FAMILY"
                title="Grow Together in Light"
                desc="Membership at Excel Energy is more than a subscription—it is a commitment to service and spiritual evolution. By joining us, you help support our food programs, community healings, and the maintenance of a pure space for meditation in Bangalore."
                points={[
                    "Direct support for feeding and social outreach",
                    "Access to advanced study groups and healer networks",
                    "A spiritual family dedicated to the Will-to-Do-Good"
                ]}
                imageSrc={getImageUrl('story_community.png')}
                isLightBg={false}
                imageLeft={false}
            />
        </div>
    );
}
