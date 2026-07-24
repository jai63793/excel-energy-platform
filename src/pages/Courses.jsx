import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { COURSES_DATA, CATEGORIES } from '../data/coursesData';
import SharedAbout from '../components/SharedAbout';
import SharedGallery from '../components/SharedGallery';
import './Programs.css'; // adopting the interactive showcase styles

const getImageUrl = (name) => {
    return new URL(`../assets/images/${name}`, import.meta.url).href;
};

const getCourseImageUrl = (name) => {
    return new URL(`../assets/images/heal-course/${name}`, import.meta.url).href;
};

const COURSES_GALLERY_IMAGES = [
    { src: getCourseImageUrl('04_advanced_pranic_healing.png'), title: 'Advanced Pranic Healing Class', category: 'Classroom', description: 'Advanced color prana methodologies for severe physical conditions.' },
    { src: getCourseImageUrl('05_pranic_psychotherapy.png'), title: 'Pranic Psychotherapy Group', category: 'Psychotherapy', description: 'Practical training on chakra cleansing for emotional and mental health.' },
    { src: getCourseImageUrl('08_pranic_psychic_self_defence.png'), title: 'Self-Defence Training', category: 'Self-Defence', description: 'Creating shields and protecting against negative energetic contamination.' },
    { src: getCourseImageUrl('10_achieving_oneness.png'), title: 'Achieving Oneness Study', category: 'Meditation', description: 'Deep meditation for soul alignment and inner peace.' }
];

function SplitText({ text, className }) {
    if (!text) return null;
    const words = text.split(' ');
    return (
        <span className={className} style={{ display: 'inline' }}>
            {words.map((word, wordIndex) => (
                <React.Fragment key={wordIndex}>
                    <span 
                        style={{ 
                            display: 'inline-block', 
                            whiteSpace: 'nowrap', 
                            overflow: 'hidden',
                            verticalAlign: 'bottom'
                        }}
                    >
                        {word.split('').map((char, charIndex) => (
                            <span 
                                key={charIndex} 
                                className="char" 
                                style={{ 
                                    display: 'inline-block', 
                                    willChange: 'transform, opacity'
                                }}
                            >
                                {char}
                            </span>
                        ))}
                    </span>
                    {wordIndex < words.length - 1 && (
                        <span style={{ display: 'inline-block', whiteSpace: 'pre' }}> </span>
                    )}
                </React.Fragment>
            ))}
        </span>
    );
}

export default function Courses() {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const containerRef = useRef(null);
    const location = useLocation();

    // Select active course based on URL query (?id=3) or state (courseId)
    useEffect(() => {
        let index = -1;
        if (location.state && typeof location.state.courseId === 'number') {
            const cid = location.state.courseId;
            if (cid === 1 || cid === 2 || cid === 3) {
                index = 0;
            } else {
                const foundIndex = COURSES_DATA.findIndex(c => c.id === cid);
                if (foundIndex !== -1) {
                    index = foundIndex;
                }
            }
        } else {
            const params = new URLSearchParams(location.search);
            const idParam = params.get('id');
            if (idParam) {
                const idInt = parseInt(idParam, 10);
                if (idInt === 1 || idInt === 2 || idInt === 3) {
                    index = 0;
                } else {
                    const foundIndex = COURSES_DATA.findIndex(c => c.id === idInt);
                    if (foundIndex !== -1) {
                        index = foundIndex;
                    }
                }
            }
        }

        if (index !== -1) {
            setTimeout(() => {
                setActiveIndex(index);
            }, 0);
            setTimeout(() => {
                const el = document.querySelector('.services-showcase-container');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 200);
        }
    }, [location.state, location.search]);

    const activeCourse = COURSES_DATA[activeIndex] || COURSES_DATA[0];

    // Initial load animations for Hero
    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo('.services-hero h1, .services-hero p, .services-breadcrumbs', 
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 1, stagger: 0.15, ease: 'power3.out' }
            );

            gsap.fromTo('.service-tab-btn',
                { x: -30, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.6, stagger: 0.04, ease: 'power3.out', delay: 0.2 }
            );
        });
        return () => ctx.revert();
    }, []);

    // Entrance animation for active course content
    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.set('.service-watermark', { opacity: 0, scale: 0.85 });
            gsap.set('.char', { y: '100%', opacity: 0 });
            gsap.set('.services-content-left .service-details-tag, .services-content-left .service-summary, .services-content-left .service-description, .services-content-left .service-meta-box, .services-content-left .service-cta-btn', {
                y: 20,
                opacity: 0
            });
            gsap.set('.service-image-wrapper', { scale: 0.95, opacity: 0, y: 15 });

            const tl = gsap.timeline({
                onComplete: () => {
                    setIsTransitioning(false);
                }
            });

            tl.to('.service-watermark', { opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out' })
              .to('.char', { y: '0%', opacity: 1, duration: 0.55, stagger: 0.015, ease: 'power3.out' }, 0.1)
              .to('.services-content-left .service-details-tag', { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }, 0.2)
              .to('.services-content-left .service-summary', { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }, 0.25)
              .to('.services-content-left .service-description', { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }, 0.3)
              .to('.services-content-left .service-meta-box', { y: 0, opacity: 1, duration: 0.45, ease: 'power2.out' }, 0.35)
              .to('.services-content-left .service-cta-btn', { y: 0, opacity: 1, duration: 0.45, ease: 'power2.out' }, 0.4)
              .to('.service-image-wrapper', { scale: 1, opacity: 1, y: 0, duration: 0.65, ease: 'power3.out' }, 0.15);
        }, containerRef);

        return () => ctx.revert();
    }, [activeIndex]);

    const handleCourseChange = (index) => {
        if (index === activeIndex || isTransitioning) return;
        setIsTransitioning(true);

        const tl = gsap.timeline({
            onComplete: () => {
                setActiveIndex(index);
            }
        });

        tl.to('.service-watermark', { opacity: 0, scale: 1.1, duration: 0.25, ease: 'power2.in' })
          .to('.char', { y: '-100%', opacity: 0, duration: 0.3, stagger: 0.008, ease: 'power2.in' }, 0)
          .to('.services-content-left .service-details-tag, .services-content-left .service-summary, .services-content-left .service-description, .services-content-left .service-meta-box, .services-content-left .service-cta-btn', {
              y: -20,
              opacity: 0,
              duration: 0.25,
              stagger: 0.04,
              ease: 'power2.in'
          }, 0)
          .to('.service-image-wrapper', {
              scale: 0.95,
              opacity: 0,
              y: -15,
              duration: 0.3,
              ease: 'power2.in'
          }, 0);
    };

    return (
        <div className="services-page-container">
            {/* Page Hero using Services banner styling */}
            <section className="services-hero page-hero-banner">
                <div className="services-hero-content">
                    <span className="section-tagline">COURSES</span>
                    <h1>Healing Courses & Training Programmes</h1>
                    <p>
                        The complete GMCKS curriculum conducted by authorised instructors. Certificates issued by the Institute for Inner Studies and World Pranic Healing Foundation — recognised in 90+ countries.
                    </p>
                    <div className="services-breadcrumbs">
                        <Link to="/">Home</Link>
                        <span className="services-crumb-separator">/</span>
                        <span className="services-active-crumb">Courses</span>
                    </div>
                </div>
            </section>

            {/* Interactive Section */}
            <section ref={containerRef} className="services-showcase-container">
                {/* Sidebar Navigation */}
                <div className="services-sidebar">
                    {COURSES_DATA.map((course, idx) => {
                        const formattedId = (idx + 1).toString().padStart(2, '0');
                        return (
                            <button
                                key={course.id}
                                className={`service-tab-btn ${activeIndex === idx ? 'active' : ''}`}
                                onClick={() => handleCourseChange(idx)}
                                disabled={isTransitioning}
                                aria-label={`View details for ${course.title}`}
                            >
                                <span style={{ display: 'flex', alignItems: 'center' }}>
                                    <span className="service-tab-number">{formattedId}</span>
                                    <span>{course.title}</span>
                                </span>
                                <span className="service-tab-arrow">
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Content Showcase Card */}
                <div className="services-content-showcase">
                    <div className="services-card-grid-decor"></div>
                    
                    {/* Watermark Index */}
                    <div className="service-watermark">{(activeIndex + 1).toString().padStart(2, '0')}</div>

                    {/* Left Column (Details) */}
                    <div className="services-content-left">
                        <span className="service-details-tag">{activeCourse.level}</span>
                        <div className="service-title-container">
                            <h2 className="service-title">
                                <SplitText text={activeCourse.title} />
                            </h2>
                        </div>
                        <h3 className="service-summary">{activeCourse.badge}</h3>
                        
                        {activeCourse.isCombined ? (
                            <div className="service-levels-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px', marginBottom: '20px' }}>
                                {activeCourse.levels.map((lvl, lIdx) => (
                                    <div key={lIdx} className="service-level-item" style={{ background: 'rgba(8, 50, 38, 0.02)', borderLeft: '3px solid var(--color-accent)', padding: '12px 16px', borderRadius: '0 var(--border-radius-sm) var(--border-radius-sm) 0' }}>
                                        <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', color: 'var(--color-primary-dark)', marginBottom: '4px', fontWeight: 'bold' }}>{lvl.title}</h4>
                                        <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: '1.5', margin: 0 }}>{lvl.desc}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="service-description">{activeCourse.description}</p>
                        )}
                        
                        <div className="service-meta-box">
                            <div className="service-meta-item">
                                <div className="service-meta-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="16" x2="12" y2="12" />
                                        <line x1="12" y1="8" x2="12.01" y2="8" />
                                    </svg>
                                </div>
                                <div className="service-meta-text">
                                    <strong>Category:</strong> <span>{CATEGORIES.find(c => c.id === activeCourse.category)?.label || activeCourse.category}</span>
                                </div>
                            </div>
                        </div>

                        <Link to="/contact" className="service-cta-btn" id="services-cta-button">
                            <span>Register Interest</span>
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                            </svg>
                        </Link>
                    </div>

                    {/* Right Column (Image/Visual) */}
                    <div className="services-content-right" style={{ display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center', width: '100%', alignItems: 'center' }}>
                        {activeCourse.isCombined ? (
                            <div className="combined-course-images-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '360px' }}>
                                {activeCourse.images.map((imgSrc, imgIdx) => (
                                    <div key={imgIdx} className="combined-img-card" style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'var(--color-white)', padding: '12px', borderRadius: 'var(--border-radius-sm)', border: '1px solid rgba(8, 50, 38, 0.05)', boxShadow: 'var(--shadow-sm)', transition: 'all 0.3s ease' }}>
                                        <div style={{ width: '110px', height: '75px', overflow: 'hidden', borderRadius: 'var(--border-radius-xs)', flexShrink: 0, background: 'var(--color-white)', border: '1px solid rgba(8, 50, 38, 0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <img 
                                                src={imgSrc} 
                                                alt={`Level ${imgIdx + 1}`} 
                                                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Level {imgIdx + 1}</span>
                                            <span style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--color-primary-dark)', fontFamily: 'var(--font-heading)' }}>
                                                {imgIdx === 0 ? 'Basic' : imgIdx === 1 ? 'Intermediate' : 'Distant'} Healing
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="service-image-wrapper">
                                <img 
                                    src={activeCourse.image} 
                                    alt={activeCourse.title} 
                                    className="service-img" 
                                    onError={(e) => {
                                        e.target.src = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80';
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <SharedAbout
                tagline="LEARN TO HEAL"
                title="Empower Your Hands to Heal"
                desc="Pranic Healing is not designed just for a gifted few. Grand Master Choa Kok Sui synthesized the techniques so that anyone with average intelligence can learn to scan, cleanse, and energize. Our certified courses provide you with the tools to heal yourself and your loved ones."
                points={[
                    "Globally recognized certification curriculum",
                    "Hands-on practical training workshops",
                    "Access to advanced Arhatic Yoga path"
                ]}
                imageSrc={getImageUrl('meditation_beginner.png')}
                isLightBg={false}
                imageLeft={false}
            />

            <SharedGallery
                tagline="CLASSROOM & PRACTICE"
                title="Training & Study Groups"
                images={COURSES_GALLERY_IMAGES}
                isSandBg={true}
            />
        </div>
    );
}
