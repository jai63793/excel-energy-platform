import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

const getImageUrl = (name) => {
    return new URL(`../assets/images/${name}`, import.meta.url).href;
};

export default function MiraclesBooking() {
    const navigate = useNavigate();

    // Form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!phone || phone.trim().length < 10) {
            toast.error('Please enter a valid 10-digit mobile number.');
            return;
        }

        try {
            toast.loading('Submitting request...');
            const response = await api.post('/contacts/submit', {
                name,
                email: email || undefined,
                phone,
                message: '8 Miracles - Request for 8 Complimentary In-Person Healing Sessions (Offline session request)'
            });
            toast.dismiss();

            if (response.data?.success) {
                toast.success('Your request for 8 Complimentary Healing sessions has been received!');

                // Format and open WhatsApp message details
                const whatsappMsg = `Hello Excel Energy,

I would like to avail the 8 Complimentary In-Person Healing Sessions. Here are my details:

Name: ${name}
Email: ${email || 'Not Provided'}
Mobile: ${phone}

Kindly schedule my offline sessions. Thank you!`;

                const encodedMsg = encodeURIComponent(whatsappMsg);
                const whatsappUrl = `https://wa.me/918310728826?text=${encodedMsg}`;

                // Open WhatsApp chat
                window.open(whatsappUrl, '_blank');

                setName('');
                setEmail('');
                setPhone('');
                setTimeout(() => {
                    navigate('/services');
                }, 2000);
            } else {
                toast.error('Something went wrong. Please try again.');
            }
        } catch (err) {
            toast.dismiss();
            toast.error(err.response?.data?.message || 'Failed to submit request. Please try again.');
        }
    };

    return (
        <div className="contact-page-container" style={{ backgroundColor: 'var(--color-bg-light)', minHeight: '100vh', paddingTop: '130px' }}>
            {/* Page Header */}
            <section className="contact-hero page-hero-banner" style={{ padding: '60px 40px', textAlign: 'center', background: 'radial-gradient(circle, #FAF6F0 0%, #F3EFE9 100%)', borderBottom: '1px solid rgba(8, 50, 38, 0.05)' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <span className="section-tagline" style={{ color: 'var(--color-accent)', fontSize: '0.85rem', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
                        Special Wellness Invitation
                    </span>
                    <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-heading)', color: 'var(--color-primary-dark)', marginBottom: '16px', lineHeight: '1.2' }}>
                        Avail 8 Complimentary Healing Sessions
                    </h1>
                    <p style={{ fontSize: '1.1rem', color: 'var(--color-accent)', fontWeight: '600', marginBottom: '8px' }}>
                        Important Note: Healing sessions are available in person only (Offline Session)
                    </p>
                    <div className="breadcrumbs" style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                        <Link to="/" style={{ color: 'var(--color-text-muted)' }}>Home</Link>
                        <span className="crumb-separator">/</span>
                        <Link to="/services" style={{ color: 'var(--color-text-muted)' }}>Services</Link>
                        <span className="crumb-separator">/</span>
                        <span className="active-crumb" style={{ color: 'var(--color-primary-dark)', fontWeight: '600' }}>8 Complimentary Healings</span>
                    </div>
                </div>
            </section>

            {/* Split Screen Image & Form Layout */}
            <section className="section-container" style={{ padding: '60px 20px', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: '40px',
                    alignItems: 'start'
                }}>
                    
                    {/* Left Column: Image / Flyer */}
                    <div style={{
                        backgroundColor: 'var(--color-white)',
                        border: '1px solid rgba(8, 50, 38, 0.08)',
                        borderRadius: 'var(--border-radius-md)',
                        padding: '16px',
                        boxShadow: 'var(--shadow-md)',
                        textAlign: 'center'
                    }}>
                        <img 
                            src={getImageUrl('eight_healings_flyer.jpg')} 
                            alt="8 Complimentary Healing Sessions Flyer"
                            style={{
                                width: '100%',
                                height: 'auto',
                                borderRadius: 'var(--border-radius-sm)',
                                boxShadow: 'var(--shadow-sm)'
                            }}
                        />
                    </div>

                    {/* Right Column: Form */}
                    <div 
                        style={{ 
                            backgroundColor: 'var(--color-white)', 
                            border: '1px solid rgba(8, 50, 38, 0.08)',
                            padding: '40px', 
                            borderRadius: 'var(--border-radius-md)', 
                            boxShadow: 'var(--shadow-md)'
                        }}
                    >
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div>
                                <label className="contact-label" style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-primary-dark)', marginBottom: '8px' }}>
                                    Full Name <span style={{ color: 'var(--color-accent)' }}>*</span>
                                </label>
                                <input 
                                    type="text" 
                                    required 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)} 
                                    placeholder="Enter your full name"
                                    className="contact-input"
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        borderRadius: 'var(--border-radius-sm)',
                                        border: '1px solid rgba(8, 50, 38, 0.15)',
                                        fontSize: '0.98rem',
                                        outline: 'none',
                                        backgroundColor: 'var(--color-white)',
                                        color: 'var(--color-primary-dark)'
                                    }}
                                />
                            </div>

                            <div>
                                <label className="contact-label" style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-primary-dark)', marginBottom: '8px' }}>
                                    Email Address <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>(Optional)</span>
                                </label>
                                <input 
                                    type="email" 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)} 
                                    placeholder="Enter your email address"
                                    className="contact-input"
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        borderRadius: 'var(--border-radius-sm)',
                                        border: '1px solid rgba(8, 50, 38, 0.15)',
                                        fontSize: '0.98rem',
                                        outline: 'none',
                                        backgroundColor: 'var(--color-white)',
                                        color: 'var(--color-primary-dark)'
                                    }}
                                />
                            </div>

                            <div>
                                <label className="contact-label" style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-primary-dark)', marginBottom: '8px' }}>
                                    Mobile Number <span style={{ color: 'var(--color-accent)' }}>*</span>
                                </label>
                                <input 
                                    type="tel" 
                                    required 
                                    value={phone} 
                                    onChange={(e) => setPhone(e.target.value)} 
                                    placeholder="e.g. 8310728826"
                                    className="contact-input"
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        borderRadius: 'var(--border-radius-sm)',
                                        border: '1px solid rgba(8, 50, 38, 0.15)',
                                        fontSize: '0.98rem',
                                        outline: 'none',
                                        backgroundColor: 'var(--color-white)',
                                        color: 'var(--color-primary-dark)'
                                    }}
                                />
                            </div>

                            <div>
                                <label className="contact-label" style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-primary-dark)', marginBottom: '8px' }}>
                                    Program / Offer
                                </label>
                                <input 
                                    type="text" 
                                    readOnly 
                                    value="8 Complimentary In-Person Healing Sessions"
                                    className="contact-input"
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        borderRadius: 'var(--border-radius-sm)',
                                        border: '1px solid rgba(8, 50, 38, 0.15)',
                                        fontSize: '0.98rem',
                                        outline: 'none',
                                        backgroundColor: 'var(--color-bg-sand)',
                                        color: 'var(--color-primary-dark)',
                                        cursor: 'not-allowed'
                                    }}
                                />
                            </div>

                            <button 
                                type="submit" 
                                className="btn-primary" 
                                style={{ 
                                    width: '100%', 
                                    justifyContent: 'center',
                                    padding: '16px', 
                                    fontSize: '1rem', 
                                    cursor: 'pointer', 
                                    border: 'none', 
                                    borderRadius: 'var(--border-radius-xl)', 
                                    fontWeight: '600',
                                    marginTop: '10px'
                                }}
                            >
                                Submit
                            </button>
                        </form>
                    </div>

                </div>
            </section>
        </div>
    );
}
