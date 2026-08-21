import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import toast from 'react-hot-toast';
import api from '../services/api';
import TiltCard from '../components/TiltCard';
import SharedAbout from '../components/SharedAbout';
import SharedGallery from '../components/SharedGallery';

const getImageUrl = (name) => {
    return new URL(`../assets/images/${name}`, import.meta.url).href;
};

const getServiceImageUrl = (name) => {
    return new URL(`../assets/images/heal-serve/${name}`, import.meta.url).href;
};

const CONTACT_GALLERY_IMAGES = [
    { src: getServiceImageUrl('crystal_therapy.png'), title: 'Crystal Therapy Room', category: 'Therapy Room', description: 'Experience consecrated crystal layouts for accelerated energy balancing.' },
    { src: getServiceImageUrl('bio_well_gdv_scanning.png'), title: 'Bio-Well Assessment Area', category: 'Aura Analysis', description: 'Schedule personal aura and chakra activity energy audits.' },
    { src: getServiceImageUrl('spiritual_counselling.png'), title: 'Counselling Sanctuary', category: 'Consultation', description: 'One-on-one sessions for life guidance, relationship blocks, and karma.' },
    { src: getServiceImageUrl('healing_for_children_teens.png'), title: 'Teens & Children Sanctuary', category: 'Nurture Space', description: 'Safe space for gentle, non-invasive energy work for younger age groups.' }
];

export default function Contact() {
    const location = useLocation();
    const navigate = useNavigate();
    
    const getInitialInterest = () => {
        const searchStr = location.search || (location.hash && location.hash.includes('?') ? location.hash.split('?')[1] : '');
        const params = new URLSearchParams(searchStr);
        return params.get('course') || params.get('service') || params.get('select') || location.state?.selectedCourse || location.state?.selectedService || 'Simple Physical Healing';
    };

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        interest: getInitialInterest(),
        message: ''
    });

    useEffect(() => {
        const searchStr = location.search || (location.hash && location.hash.includes('?') ? location.hash.split('?')[1] : '');
        const params = new URLSearchParams(searchStr);
        const resolvedInterest = params.get('course') || params.get('service') || params.get('select') || location.state?.selectedCourse || location.state?.selectedService;

        if (resolvedInterest) {
            setFormData(prev => ({
                ...prev,
                interest: resolvedInterest
            }));
        }
    }, [location.state, location.search, location.hash]);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo('.contact-hero h1, .contact-hero p', 
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 1, stagger: 0.15, ease: 'power3.out', clearProps: 'opacity,transform' }
            );

            gsap.fromTo('.contact-grid > *', 
                { y: 40, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8, stagger: 0.2, ease: 'power3.out', clearProps: 'opacity,transform' }
            );
        });
        return () => ctx.revert();
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.phone || formData.phone.length < 10) {
            toast.error('Please enter a valid 10-digit mobile number.');
            return;
        }

        try {
            toast.loading('Submitting message...');
            const response = await api.post('/contacts/submit', {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                message: `${formData.interest}: ${formData.message}`
            });
            toast.dismiss();

            if (response.data?.success) {
                toast.success('Your message has been received! We will contact you shortly.');
                setFormData({ name: '', phone: '', email: '', interest: 'Simple Physical Healing', message: '' });
            }
        } catch (err) {
            toast.dismiss();
            toast.error(err.response?.data?.message || 'Failed to submit contact request. Try again.');
        }
    };

    return (
        <div className="contact-page-container" style={{ backgroundColor: 'var(--color-bg-light)', minHeight: '100vh' }}>
            {/* Page Hero */}
            <section className="contact-hero page-hero-banner">
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <span className="section-tagline">GET IN TOUCH</span>
                    <h1>Contact Excel Energy</h1>
                    <p>
                        Have questions about our meditation courses or group events? Send us a message or visit our local centers.
                    </p>
                    <div className="breadcrumbs">
                        <Link to="/">Home</Link>
                        <span className="crumb-separator">/</span>
                        <span className="active-crumb">Contact</span>
                    </div>
                </div>
            </section>

            {/* Membership Enquiry Banner (Top Promotion) */}
            <section style={{ padding: '0 24px', marginTop: '40px', marginBottom: '10px' }}>
                <div 
                    onClick={() => navigate('/join-member')}
                    style={{
                        maxWidth: '1280px',
                        margin: '0 auto',
                        background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary-medium) 100%)',
                        color: 'var(--color-white)',
                        borderRadius: 'var(--border-radius-md)',
                        padding: '24px 30px',
                        display: 'flex',
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        boxShadow: 'var(--shadow-md)',
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '280px' }}>
                        <div style={{ fontSize: '2rem' }}>💎</div>
                        <div style={{ textAlign: 'left' }}>
                            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-white)', margin: '0 0 4px 0' }}>
                                Divine Wellness Membership Enquiry
                            </h4>
                            <p style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.8)', margin: 0 }}>
                                {/* Receive regular guided meditations, event discounts, and full moon sittings. Call us at <strong>+91 83107 28826</strong> or click here to explore membership plans. */}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                        <a 
                            href="tel:+918310728826" 
                            onClick={(e) => e.stopPropagation()} 
                            style={{ 
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '10px 20px', 
                                border: '1px solid rgba(255, 255, 255, 0.3)', 
                                borderRadius: 'var(--border-radius-xl)', 
                                color: 'var(--color-white)',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            📞 Call support
                        </a>
                        <button 
                            className="btn-primary" 
                            style={{ 
                                padding: '10px 20px', 
                                backgroundColor: 'var(--color-accent)', 
                                color: 'var(--color-white)',
                                fontSize: '0.85rem'
                            }}
                        >
                            Explore Plans
                        </button>
                    </div>
                </div>
            </section>

            {/* Contact Info and Form Grid */}
            <section className="section-container">
                <div className="contact-grid">
                    {/* Left: Contact Info Panels */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <TiltCard className="contact-general-card" style={{ backgroundColor: 'white', padding: '30px', borderRadius: 'var(--border-radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid rgba(8, 50, 38, 0.03)' }}>
                            <h3 style={{ fontSize: '1.25rem', color: 'var(--color-accent)', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>General Inquiries</h3>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginBottom: '8px' }}>
                                Email us directly for curriculum details, registrations, and scheduling updates.
                            </p>
                            <a href="mailto:excelenergy25@gmail.com" style={{ fontWeight: '600', color: 'var(--color-primary-dark)' }}>excelenergy25@gmail.com</a>
                        </TiltCard>

                        <TiltCard style={{ backgroundColor: 'white', padding: '30px', borderRadius: 'var(--border-radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid rgba(8, 50, 38, 0.03)' }}>
                            <h3 style={{ fontSize: '1.25rem', color: 'var(--color-primary-medium)', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>Location Headquarters</h3>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '8px' }}>
                                GMCKS Excel Energy 195, "Sriniketanam",<br />
                                W Park Road Malleshwaram, Bengaluru — 560055
                            </p>
                            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>📞 Phone: <a href="tel:+918310728826" style={{ fontWeight: '600', color: 'var(--color-primary-dark)' }}>+91 83107 28826</a></span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>🕒 Hours: 6:00 AM – 8:00 PM Daily</span>
                        </TiltCard>

                        <TiltCard style={{ backgroundColor: 'white', padding: '30px', borderRadius: 'var(--border-radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid rgba(8, 50, 38, 0.03)' }}>
                            <h3 style={{ fontSize: '1.25rem', color: '#6D3D7E', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>Global Support</h3>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginBottom: '8px' }}>
                                If you are a volunteer or center organizer outside of India, contact our global desk.
                            </p>
                            <a href="mailto:excelenergy25@gmail.com" style={{ fontWeight: '600', color: 'var(--color-primary-dark)' }}>excelenergy25@gmail.com</a>
                        </TiltCard>
                    </div>

                    {/* Right: Solid High-Contrast Inquiry Form */}
                    <div 
                        id="contact-form-section"
                        style={{ 
                            backgroundColor: 'var(--color-white)', 
                            border: '1px solid rgba(8, 50, 38, 0.08)',
                            padding: '40px', 
                            borderRadius: 'var(--border-radius-md)', 
                            boxShadow: 'var(--shadow-md)' 
                        }}
                    >
                        <h2 style={{ fontSize: '1.8rem', marginBottom: '24px', fontFamily: 'var(--font-heading)', color: 'var(--color-primary-dark)' }}>Send a Message</h2>
                         <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label className="contact-label">Mobile Number</label>
                                <input 
                                    type="tel" 
                                    name="phone" 
                                    value={formData.phone} 
                                    onChange={handleChange} 
                                    required 
                                    placeholder="e.g. +91 9876543210"
                                    className="contact-input"
                                />
                            </div>

                            <div>
                                <label className="contact-label">Full Name</label>
                                <input 
                                    type="text" 
                                    name="name" 
                                    value={formData.name} 
                                    onChange={handleChange} 
                                    required 
                                    className="contact-input"
                                />
                            </div>

                            <div>
                                <label className="contact-label">Email Address (Optional)</label>
                                <input 
                                    type="email" 
                                    name="email" 
                                    value={formData.email} 
                                    onChange={handleChange} 
                                    className="contact-input"
                                />
                            </div>

                            <div>
                                <label className="contact-label">Program of Interest</label>
                                <select 
                                    name="interest" 
                                    value={formData.interest} 
                                    onChange={handleChange} 
                                    className="contact-input"
                                    style={{ appearance: 'auto' }}
                                >
                                    <optgroup label="Healing Services">
                                        <option value="Simple Physical Healing">Simple Physical Healing</option>
                                        <option value="Advanced Physical Healing">Advanced Physical Healing</option>
                                        <option value="Simple Psychological Healing">Simple Psychological Healing</option>
                                        <option value="Complex Psychological Healing">Complex Psychological Healing</option>
                                        <option value="Relationship Healing">Relationship Healing</option>
                                        <option value="Financial Healing">Financial Healing</option>
                                        <option value="Healing for Profession">Healing for Profession</option>
                                        <option value="Healing for Businesses">Healing for Businesses</option>
                                        <option value="Crystal Therapy">Crystal Therapy</option>
                                        <option value="Bio-Well GDV Scanning">Bio-Well GDV Scanning</option>
                                        <option value="Healing for Children & Teens">Healing for Children & Teens</option>
                                        <option value="Spiritual Counselling">Spiritual Counselling</option>
                                        <option value="12 Distance Healing Sessions">12 Distance Healing Sessions (₹1500/month)</option>
                                    </optgroup>
                                    <option value="Find a Course">Find a Course</option>
                                    <option value="Membership Enquiry">Membership Enquiry</option>
                                </select>
                            </div>

                            <div>
                                <label className="contact-label">Your Message</label>
                                <textarea 
                                    name="message" 
                                    value={formData.message} 
                                    onChange={handleChange} 
                                    rows="5" 
                                    required 
                                    className="contact-input"
                                    style={{ resize: 'none' }}
                                ></textarea>
                            </div>

                            <button 
                                type="submit" 
                                className="newsletter-btn" 
                                style={{ width: '100%', padding: '16px', fontSize: '1rem', cursor: 'pointer', border: 'none', borderRadius: 'var(--border-radius-xl)', fontWeight: '600' }}
                            >
                                Submit Inquiry
                            </button>
                        </form>
                    </div>
                </div>
            </section>



            {/* Complimentary Healings Block */}
            <section className="complimentary-healings-promo" style={{ backgroundColor: 'var(--color-white)', padding: '60px 0', borderTop: '1px solid rgba(8, 50, 38, 0.05)', borderBottom: '1px solid rgba(8, 50, 38, 0.05)' }}>
                <div className="courses-container">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px', alignItems: 'center' }}>
                        {/* Image Panel */}
                        <div style={{ textAlign: 'center' }}>
                            <img 
                                src="/eight_complimentary_healings.jpg" 
                                alt="8 Complimentary Healings Poster" 
                                style={{ 
                                    width: '100%', 
                                    maxWidth: '420px', 
                                    borderRadius: 'var(--border-radius-md)', 
                                    boxShadow: 'var(--shadow-lg)',
                                    transition: 'transform 0.3s ease'
                                }} 
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            />
                        </div>

                        {/* Details Panel */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <span style={{ fontSize: '0.78rem', fontWeight: '700', letterSpacing: '2px', color: 'var(--color-accent)', textTransform: 'uppercase' }}>
                                    EXCEL ENERGY IN-PERSON PROGRAM
                                </span>
                                <h2 style={{ fontSize: '2rem', color: 'var(--color-primary-dark)', fontFamily: 'var(--font-heading)', marginTop: '8px', marginBottom: '12px', fontWeight: '700' }}>
                                    8 In-Person Complimentary Healings
                                </h2>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.96rem', lineHeight: '1.6', margin: 0 }}>
                                    Experience Pranic Healing — a highly effective, completely non-invasive, no-touch and no-drug therapy designed to balance and harmonize your energy field.
                                </p>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px', background: 'var(--color-bg-sand)', padding: '20px', borderRadius: 'var(--border-radius-sm)', border: '1px solid rgba(8, 50, 38, 0.03)' }}>
                                <div style={{ fontSize: '0.88rem', color: 'var(--color-primary-dark)', fontWeight: '600' }}>• Mental Health Support</div>
                                <div style={{ fontSize: '0.88rem', color: 'var(--color-primary-dark)', fontWeight: '600' }}>• Stress Relief & Meditation</div>
                                <div style={{ fontSize: '0.88rem', color: 'var(--color-primary-dark)', fontWeight: '600' }}>• Physical Health Support</div>
                                <div style={{ fontSize: '0.88rem', color: 'var(--color-primary-dark)', fontWeight: '600' }}>• Kids' Focus & Memory</div>
                                <div style={{ fontSize: '0.88rem', color: 'var(--color-primary-dark)', fontWeight: '600' }}>• Relationship Harmony</div>
                                <div style={{ fontSize: '0.88rem', color: 'var(--color-primary-dark)', fontWeight: '600' }}>• Financial Wellness</div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem', color: 'var(--color-text-muted)', borderLeft: '3px solid var(--color-primary-medium)', paddingLeft: '16px' }}>
                                <div><strong>🕒 Session Duration:</strong> 60 minutes per sitting</div>
                                <div><strong>📅 Availability:</strong> Mon, Wed, Sat (10:00 AM – 4:00 PM)</div>
                                <div><strong>📍 Venue:</strong> 195, Sriniketanam, West Park Road, Malleshwaram, Bengaluru — 560055</div>
                            </div>

                            <Link 
                                to="/8-miracles-booking" 
                                className="btn-primary" 
                                style={{ display: 'inline-flex', alignSelf: 'start', padding: '14px 32px', backgroundColor: 'var(--color-accent)', color: 'var(--color-white)' }}
                            >
                                Book Your Slot Now
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <SharedAbout
                tagline="VISIT OUR SANCTUARY"
                title="Welcome to Malleshwaram Center"
                desc="Located in the historic, quiet heart of Malleshwaram, our sanctuary is designed as an oasis from Bengaluru's busy urban life. Visitors are always welcome to explore our library, speak with healers, or join our regular weekly meditation sessions."
                points={[
                    "Convenient location near West Park Road",
                    "Quiet library and self-study resources",
                    "Friendly community coordinators available daily"
                ]}
                imageSrc={getImageUrl('healing_services_bg.png')}
                isLightBg={true}
                imageLeft={true}
            />

            <SharedGallery
                tagline="CENTER GLIMPSES"
                title="Sanctuary Spaces"
                images={CONTACT_GALLERY_IMAGES}
                isSandBg={false}
            />
        </div>
    );
}
