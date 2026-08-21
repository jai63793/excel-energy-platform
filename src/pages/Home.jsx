import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import TiltCard from '../components/TiltCard';
import SharedAbout from '../components/SharedAbout';

gsap.registerPlugin(ScrollTrigger);

const getImageUrl = (name) => {
    return new URL(`../assets/images/${name}`, import.meta.url).href;
};

const getServiceImageUrl = (name) => {
    return new URL(`../assets/images/heal-serve/${name}`, import.meta.url).href;
};

const HOME_SERVICES = [
    {
        type: 'category',
        category: 'physical',
        title: 'Physical Healing',
        tagline: 'CHRONIC & PHYSICAL RECOVERY',
        desc: 'Comprehensive energy healing addressing common ailments as well as chronic and serious illnesses.',
        image: getServiceImageUrl('physical_healing.png'),
        icon: (
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
        )
    },
    {
        type: 'category',
        category: 'psychological',
        title: 'Psychological Healing',
        tagline: 'EMOTIONAL HARMONY & TRAUMA RECOVERY',
        desc: 'Direct energy psychotherapy targeting stress, anxiety, longstanding depression, phobias, and deep trauma.',
        image: getServiceImageUrl('psychological_healing.png'),
        icon: (
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2a5 5 0 0 0-5 5v3.18a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3V7a5 5 0 0 0-5-5z" />
                <path d="M19 12v1a7 7 0 0 1-14 0v-1" />
                <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
        )
    },
    {
        type: 'category',
        category: 'prosperity',
        title: 'Prosperity & Career',
        tagline: 'ABUNDANCE & BUSINESS ALIGNMENT',
        desc: 'Systematic clearing of financial blocks, career stagnation, and revitalization of business energy bodies.',
        image: getServiceImageUrl('prosperity_career.png'),
        icon: (
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
        )
    },
    {
        type: 'category',
        category: 'special',
        title: 'Special Therapies',
        tagline: 'CRYSTAL & ESOTERIC HEALING',
        desc: 'Advanced modalities including laying of consecrated crystal layouts and esoterically grounded spiritual guidance.',
        image: getServiceImageUrl('special_therapies.png'),
        icon: (
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
                <line x1="12" y1="22" x2="12" y2="2" />
                <line x1="2" y1="8.5" x2="22" y2="8.5" />
                <line x1="2" y1="15.5" x2="22" y2="15.5" />
            </svg>
        )
    },
    {
        type: 'service',
        index: 5,
        title: 'Financial Healing',
        tagline: 'KRIYASHAKTI ABUNDANCE SYSTEM',
        desc: 'Targeted clearing of scarcity consciousness and negative thought forms to manifest financial flow.',
        image: getServiceImageUrl('financial_healing.png'),
        icon: (
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
        )
    },
    {
        type: 'service',
        index: 9,
        title: 'Bio-Well GDV Scanning',
        tagline: 'ENERGY AUDIT & AURA ANALYSIS',
        desc: 'Non-invasive Gas Discharge Visualization fingertip scanning mapping organ vitality indices and chakra levels.',
        image: getServiceImageUrl('bio_well_gdv_scanning.png'),
        icon: (
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="M12 6v6l4 2" />
            </svg>
        )
    }
];



export default function Home() {
    const navigate = useNavigate();

    const categories = [
        {
            id: 'stress',
            label: 'Stress',
            tabId: 'stress',
            icon: <img src={getImageUrl('icon_stress.png')} alt="Stress" className="hero-category-png-icon" />
        },
        {
            id: 'mental-health',
            label: 'Mental Health',
            tabId: 'mental-health',
            icon: <img src={getImageUrl('icon_mental_health.png')} alt="Mental Health" className="hero-category-png-icon" />
        },
        {
            id: 'back-pain',
            label: 'Back Pain',
            tabId: 'back-pain',
            icon: (
                <svg className="hero-category-svg" viewBox="0 0 64 64">
                    <line x1="32" y1="12" x2="32" y2="52" />
                    <circle cx="32" cy="18" r="4" />
                    <circle cx="32" cy="28" r="4" />
                    <circle cx="32" cy="38" r="4" />
                    <circle cx="32" cy="48" r="4" />
                    <path d="M24 24h16M22 34h20M24 44h16" />
                </svg>
            )
        },
        {
            id: 'headache',
            label: 'Headache',
            tabId: 'headache',
            icon: (
                <svg className="hero-category-svg" viewBox="0 0 64 64">
                    <path d="M32 14a12 12 0 0 0-12 12v10a12 12 0 0 0 24 0V26a12 12 0 0 0-12-12z" />
                    <path d="M32 48v6M24 54h16" />
                    <path d="M12 16a22 22 0 0 1 8-8M44 8a22 22 0 0 1 8 8" />
                </svg>
            )
        },
        {
            id: 'depression',
            label: 'Depression',
            tabId: 'depression',
            icon: <img src={getImageUrl('icon_depression.png')} alt="Depression" className="hero-category-png-icon" />
        },
        {
            id: 'anger',
            label: 'Anger',
            tabId: 'anger',
            icon: <img src={getImageUrl('icon_anger.png')} alt="Anger" className="hero-category-png-icon" />
        },
        {
            id: 'sleep',
            label: 'Sleep',
            tabId: 'sleep',
            icon: <img src={getImageUrl('icon_sleep.png')} alt="Sleep" className="hero-category-png-icon" />
        },
        {
            id: 'wellness',
            label: 'Wellness',
            tabId: 'wellness',
            icon: <img src={getImageUrl('icon_wellness.png')} alt="Wellness" className="hero-category-png-icon" />
        },
        {
            id: 'relationships',
            label: 'Relationships',
            tabId: 'relationships',
            icon: <img src={getImageUrl('icon_relationships.png')} alt="Relationships" className="hero-category-png-icon" />
        },
        {
            id: 'parenting',
            label: 'Parenting',
            tabId: 'parenting',
            icon: <img src={getImageUrl('icon_parenting.png')} alt="Parenting" className="hero-category-png-icon" />
        },
        {
            id: 'addiction',
            label: 'Addiction',
            tabId: 'addiction',
            icon: (
                <svg className="hero-category-svg" viewBox="0 0 64 64">
                    <path d="M22 26a6 6 0 0 1-6-6v-4a6 6 0 0 1 12 0v4a6 6 0 0 1-6 6z" />
                    <path d="M42 38a6 6 0 0 0-6-6v-4a6 6 0 0 0 12 0v4a6 6 0 0 0-6 6z" />
                    <path d="M26 36l4-4M34 32l4-4" />
                </svg>
            )
        },
        {
            id: 'exam-tension',
            label: 'Exam Tension',
            tabId: 'exam-tension',
            icon: (
                <svg className="hero-category-svg" viewBox="0 0 64 64">
                    <path d="M16 48a6 6 0 0 1 6-6h26v8H22a6 6 0 0 1-6-6z" />
                    <path d="M22 8h26v34H22A6 6 0 0 1 16 36V14A6 6 0 0 1 22 8z" />
                    <circle cx="32" cy="24" r="6" />
                    <line x1="32" y1="14" x2="32" y2="18" />
                    <line x1="32" y1="30" x2="32" y2="34" />
                </svg>
            )
        }
    ];

    const [isMobile, setIsMobile] = useState(false);
    const [currentCenterIndex, setCurrentCenterIndex] = useState(0);

    // Detect mobile screen width
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Auto-slide mobile category carousel
    useEffect(() => {
        if (!isMobile) return;
        const timer = setInterval(() => {
            setCurrentCenterIndex((prev) => (prev + 1) % categories.length);
        }, 3000);
        return () => clearInterval(timer);
    }, [isMobile, categories.length]);

    // Calculate shortest distance in a circular array
    const getOffset = (index) => {
        let diff = index - currentCenterIndex;
        const half = Math.floor(categories.length / 2);
        if (diff > half) diff -= categories.length;
        if (diff < -half) diff += categories.length;
        return diff;
    };

    // Staggered reveals and scroll animations inside React scope
    useEffect(() => {
        const ctx = gsap.context(() => {
            // Specific line-mask reveal animation for the main title text
            gsap.fromTo('.hero-title-line-content',
                { y: '102%', opacity: 0 },
                {
                    y: '0%',
                    opacity: 1,
                    duration: 1.4,
                    stagger: 0.2,
                    ease: 'power4.out',
                    delay: 0.05,
                    clearProps: 'opacity,transform'
                }
            );

            // Scroll title from vertical center to normal layout position on scroll
            gsap.fromTo('.hero-content',
                { y: '10vh' },
                {
                    y: '0vh',
                    scrollTrigger: {
                        trigger: '.hero-section',
                        start: 'top top',
                        end: 'bottom 35%',
                        scrub: 1
                    }
                }
            );

            // ScrollTrigger animation to reveal the entire solution category wrapper when user scrolls
            gsap.fromTo('.hero-categories-wrapper',
                { opacity: 0, y: 30 },
                {
                    scrollTrigger: {
                        trigger: '.hero-section',
                        start: 'top -20px', // Triggers when user scrolls down by 20px
                        toggleActions: 'play none none reverse',
                    },
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    ease: 'power2.out',
                    clearProps: 'transform'
                }
            );

            // ScrollTrigger animation to reveal solution category icons when user scrolls
            gsap.fromTo('.hero-categories-carousel:not(.mobile-carousel) .hero-category-item',
                { opacity: 0, scale: 0.85, y: 20 },
                {
                    scrollTrigger: {
                        trigger: '.hero-section',
                        start: 'top -20px', // Triggers when user scrolls down by 20px
                        toggleActions: 'play none none reverse',
                    },
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    duration: 0.6,
                    stagger: 0.08,
                    ease: 'back.out(1.4)',
                    clearProps: 'transform' // Allow CSS hover transition: transform to work after animation completes
                }
            );

            // ScrollTrigger reveals for About Us content blocks
            // Staggered reveals for Grand Master section
            const aboutTimeline = gsap.timeline({
                scrollTrigger: {
                    trigger: '.about-stories-section',
                    start: 'top 75%'
                }
            });

            aboutTimeline.from('.about-wisdom-content', {
                x: -60,
                opacity: 0,
                duration: 1,
                ease: 'power3.out'
            })
                .from('.about-wisdom-content h2', {
                    y: 20,
                    opacity: 0,
                    duration: 0.6,
                    ease: 'power2.out'
                }, 0.2)
                .from('.about-wisdom-content .wisdom-text', {
                    y: 30,
                    opacity: 0,
                    duration: 0.8,
                    stagger: 0.15,
                    ease: 'power2.out'
                }, 0.3)
                .from('.about-wisdom-content blockquote', {
                    x: -30,
                    opacity: 0,
                    duration: 0.8,
                    ease: 'power2.out'
                }, 0.5)
                .from('.about-guru-visual .guru-image-outer', {
                    scale: 0.7,
                    rotation: -12,
                    opacity: 0,
                    duration: 1.2,
                    ease: 'back.out(1.3)'
                }, 0.1)
                .from('.about-guru-visual .guru-leaf-1, .about-guru-visual .guru-leaf-2', {
                    scale: 0,
                    rotation: 45,
                    opacity: 0,
                    duration: 1,
                    stagger: 0.2,
                    ease: 'back.out(1.5)'
                }, 0.4);

            // ScrollTrigger stagger reveal for home services cards (with mobile stacking scroll animation)
            if (window.innerWidth <= 768) {
                const cards = gsap.utils.toArray('.home-service-card');
                cards.forEach((card) => {
                    gsap.fromTo(card, {
                        y: 100,
                        opacity: 0,
                        scale: 0.92
                    }, {
                        scrollTrigger: {
                            trigger: card,
                            start: 'top 92%',
                            end: 'top 60%',
                            scrub: 1
                        },
                        y: 0,
                        opacity: 1,
                        scale: 1,
                        ease: 'power2.out'
                    });
                });
            } else {
                gsap.fromTo('.home-service-card', {
                    y: 50,
                    opacity: 0
                }, {
                    scrollTrigger: {
                        trigger: '.home-services-grid',
                        start: 'top 80%'
                    },
                    y: 0,
                    opacity: 1,
                    duration: 0.8,
                    stagger: 0.15,
                    ease: 'power3.out',
                    clearProps: 'opacity,transform'
                });
            }




        });

        return () => ctx.revert(); // clean up GSAP animation context
    }, []);





    return (
        <>
            {/* Hero Section */}
            <section className="hero-section" id="home">
                {/* Background Video */}
                <div className="video-background">
                    <video
                        className="active"
                        src="/videos/Healing Angel.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                    />
                </div>


                <div className="hero-container">
                    <div className="hero-content" style={{ transform: 'translateY(10vh)' }}>
                        <h1 className="hero-title">
                            <span className="hero-title-line-mask">
                                <span className="hero-title-line-content">
                                    Experience the&nbsp;
                                </span>
                            </span>
                            <br className="mobile-only-br" />
                            <span className="hero-title-line-mask">
                                <span className="hero-title-line-content">
                                    Miracles&nbsp;
                                </span>
                            </span>
                            <br className="desktop-only-br" />
                            <span className="hero-title-line-mask">
                                <span className="hero-title-line-content">
                                    Through&nbsp;
                                </span>
                            </span>
                            <br className="mobile-only-br" />
                            <span className="hero-title-line-mask">
                                <span className="hero-title-line-content">
                                    Pranic Healing
                                </span>
                            </span>
                        </h1>
                    </div>


                    {/* Circular Categories links */}
                    <div className="hero-categories-wrapper" style={{ marginTop: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', opacity: 0 }}>
                        <h2 style={{ 
                            fontFamily: 'var(--font-heading)', 
                            color: 'var(--color-white)', 
                            fontSize: '1.8rem', 
                            fontWeight: '600', 
                            marginBottom: '10px', 
                            letterSpacing: '1px', 
                            textTransform: 'uppercase',
                            alignSelf: 'flex-start',
                            marginLeft: 'max(0px, calc((100vw - 1280px) / 2))',
                            paddingLeft: '40px',
                            WebkitTextStroke: '1.5px #000000',
                            textShadow: '0 2px 8px rgba(0,0,0,0.6)',
                            marginTop: '15px'
                        }}>
                            Find a Solution
                        </h2>
                        <div className={`hero-categories-carousel ${isMobile ? 'mobile-carousel' : ''}`}>
                            {categories.map((cat, index) => {
                                const offset = isMobile ? getOffset(index) : 0;
                                const isVisible = !isMobile || Math.abs(offset) <= 1;

                                return (
                                    <div
                                        key={cat.id}
                                        className={`hero-category-item ${offset === 0 && isMobile ? 'active-pop' : ''}`}
                                        style={isMobile ? {
                                            cursor: 'default',
                                            position: 'absolute',
                                            left: '50%',
                                            ...(offset !== 0 ? {
                                                transform: `translate(calc(-50% + ${offset * 105}px), 0) scale(0.85)`
                                            } : {}),
                                            opacity: isVisible ? (offset === 0 ? 1 : 0.6) : 0,
                                            pointerEvents: offset === 0 ? 'auto' : 'none',
                                            zIndex: offset === 0 ? 2 : 1
                                        } : { cursor: 'default' }}
                                    >
                                        <div className="hero-category-circle">
                                            {cat.icon}
                                        </div>
                                        <span className="hero-category-label">{cat.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* About Us & Stories Section */}
            <section className="about-stories-section" id="about">
                <div className="section-container">

                    {/* Eternal Guru & Pranic Healing */}
                    <div className="about-stories-grid">
                        <div className="about-wisdom-content">
                            <span className="section-tagline">OUR ETERNAL GURU</span>
                            <h2 className="section-title">Grand Master<br />Choa Kok Sui</h2>
                            <div className="decorative-wave">
                                <svg viewBox="0 0 100 10" width="80" height="8">
                                    <path d="M0 5 Q 25 0, 50 5 T 100 5" fill="none" stroke="#E0702B" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </div>
                            <p className="wisdom-text" style={{ fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '12px' }}>
                                Born into a wealthy family in Cebu, Philippines, Grand Master Choa Kok Sui was never interested in a life of luxury. Driven by deep compassion, he dedicated his life to researching energy laws to alleviate human suffering. Guided by Sat Guru Mahaguruji Mei Ling, he systematically cleansed and restructured ancient esoteric practices.
                            </p>
                            <p className="wisdom-text" style={{ fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '12px' }}>
                                With an educational background in Chemical Engineering, he approached energy healing as an empirical science. Collaborating with clairvoyants, he conducted repeatable experiments to validate chakra processes, culminating in the formulation of Modern Pranic Healing® and Arhatic Yoga®.
                            </p>
                            <p className="wisdom-text" style={{ fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '16px' }}>
                                An author of 20+ books translated into 27+ languages, he was also a tireless philanthropist who established humanitarian feeding programs and global healing centers, leaving a legacy of spiritual service.
                            </p>
                            <blockquote style={{ borderLeft: '3px solid var(--color-accent)', paddingLeft: '14px', fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '20px', lineHeight: '1.5' }}>
                                “Miracles are fantastic events which utilise hidden laws of nature that most people are not yet aware of.”
                                <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginTop: '4px', color: 'var(--color-primary-dark)', fontStyle: 'normal' }}>
                                    — Grand Master Choa Kok Sui
                                </span>
                            </blockquote>
                            <Link to="/about" className="btn-dark" id="about-btn-more-eternal">
                                <span>Learn More</span>
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                    <polyline points="12 5 19 12 12 19"></polyline>
                                </svg>
                            </Link>
                        </div>

                        <div className="about-guru-visual">
                            <div className="guru-image-outer">
                                <div className="guru-image-inner">
                                    <img src={getImageUrl('gmcks_portrait.png')} alt="Grand Master Choa Kok Sui portrait" className="guru-img" />
                                </div>
                                <div className="guru-leaf-1">
                                    <svg viewBox="0 0 100 100" width="80" height="80" fill="#083226">
                                        <path d="M10 80 C40 80, 70 70, 80 20 C70 50, 40 60, 10 80 Z" />
                                    </svg>
                                </div>
                                <div className="guru-leaf-2">
                                    <svg viewBox="0 0 100 100" width="60" height="60" fill="#E0702B">
                                        <path d="M20 90 C50 80, 80 50, 90 10 C60 30, 30 60, 20 90 Z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>
            </section>



            {/* Golden Words of Our Guru Section */}
            <section className="guru-quotes-section">
                <div className="section-container">
                    <div className="section-header center">
                        <span className="section-tagline">WORDS OF WISDOM</span>
                        <h2 className="section-title">Golden Words of Our Guru</h2>
                        <div className="decorative-wave">
                            <svg viewBox="0 0 100 100" width="60" height="60" fill="#E0702B">
                                <path d="M20 90 C50 80, 80 50, 90 10 C60 30, 30 60, 20 90 Z" />
                            </svg>
                        </div>
                    </div>

                    <div className="quotes-grid">
                        {/* Left Side Quotes */}
                        <div className="quotes-column left">
                            <div className="quote-card-item">
                                <span className="quote-quote-icon">“</span>
                                <p className="quote-text">
                                    Inner forgiveness is therapeutic. If you do not forgive, you cannot be internally healed. Forgiving heals the soul.
                                </p>
                            </div>
                            <div className="quote-card-item">
                                <span className="quote-quote-icon">“</span>
                                <p className="quote-text">
                                    People on the spiritual path are not anemic. They must be sharp, strong, and courageous. Being spiritual means being powerful, dynamic, and intelligent.
                                </p>
                            </div>
                            <div className="quote-card-item">
                                <span className="quote-quote-icon">“</span>
                                <p className="quote-text">
                                    When you are filled with soul energy, you become magnetic.
                                </p>
                            </div>
                        </div>

                        {/* Center Image/Mandala */}
                        <div className="quotes-center-visual">
                            <div className="quotes-mandala-wrapper">
                                <div className="quotes-mandala-glow"></div>
                                <div className="quotes-mandala-circle">
                                    <img
                                        src={getImageUrl('eternal_guru_bg.png')}
                                        alt="Spiritual Energy Mandala"
                                        className="quotes-mandala-img"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right Side Quotes */}
                        <div className="quotes-column right">
                            <div className="quote-card-item">
                                <span className="quote-quote-icon">“</span>
                                <p className="quote-text">
                                    The key to prosperity is in giving. If you want to be rich and prosperous, you have to practice generosity and non-stealing first.
                                </p>
                            </div>
                            <div className="quote-card-item mobile-hide-quote">
                                <span className="quote-quote-icon">“</span>
                                <p className="quote-text">
                                    According to the Law of Cycle, everything is subject to change. Nothing lasts forever.
                                </p>
                            </div>
                            <div className="quote-card-item mobile-hide-quote">
                                <span className="quote-quote-icon">“</span>
                                <p className="quote-text">
                                    What is impossible for an ordinary person is possible with the blessings of God, the Guru, and the higher beings.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Healing Services Grid Section */}
            <section className="home-services-section" id="services">
                <div className="section-container">
                    <div className="section-header center">
                        <span className="section-tagline">ENERGY MEDICINE SERVICES</span>
                        <h2 className="section-title">Our Healing Services</h2>
                        <div className="decorative-wave">
                            <svg viewBox="0 0 100 10" width="80" height="8">
                                <path d="M0 5 Q 25 0, 50 5 T 100 5" fill="none" stroke="#E0702B" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>
                    </div>

                    <div className="home-services-grid">
                        {HOME_SERVICES.map((svc) => (
                            <div
                                key={svc.title}
                                className="home-service-card"
                                onClick={() => {
                                    if (svc.type === 'category') {
                                        navigate('/services', { state: { category: svc.category } });
                                    } else {
                                        navigate('/services', { state: { serviceIndex: svc.index } });
                                    }
                                }}
                            >
                                <div className="home-service-card-image-wrapper">
                                    <img src={svc.image} alt={svc.title} className="home-service-card-image" />
                                </div>
                                <div className="home-service-card-content">
                                    <h3 className="home-service-card-title">{svc.title}</h3>
                                    <span className="home-service-card-tagline">{svc.tagline}</span>
                                    <p className="home-service-card-desc">{svc.desc}</p>
                                    <div className="home-service-card-footer">
                                        <span>Learn more & select</span>
                                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                            <polyline points="12 5 19 12 12 19"></polyline>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>


            {/* Testimonials Section */}


            <SharedAbout
                tagline="ABOUT EXCEL ENERGY"
                title="A Sanctuary for Your Soul"
                desc="Excel Energy is a premier holistic wellness and meditation hub in Malleshwaram, Bengaluru. Dedicated to the lineage of Grand Master Choa Kok Sui, we provide a warm, peaceful space for individuals to recover physically, find emotional balance, and accelerate their spiritual evolution."
                points={[
                    "Guided by certified practitioners and senior healers",
                    "Comprehensive study groups and Arhatic Yoga support",
                    "Free weekly community meditation sessions"
                ]}
                imageSrc={getImageUrl('story_community.png')}
                isLightBg={true}
            />



        </>
    );
}
