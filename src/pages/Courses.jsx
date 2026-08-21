import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { COURSES_DATA, CATEGORIES } from '../data/coursesData';
import SharedAbout from '../components/SharedAbout';
import SharedGallery from '../components/SharedGallery';
import './Programs.css'; // adopting the interactive showcase styles

const getImageUrl = (name) => {
    return new URL(`../assets/images/${name}`, import.meta.url).href;
};

const getServiceImageUrl = (name) => {
    return new URL(`../assets/images/heal-serve/${name}`, import.meta.url).href;
};

const PROGRAMS_GALLERY_IMAGES = [
    { id: '02', src: getServiceImageUrl('advanced_physical_healing.png'), title: 'Advanced Physical Healing', category: 'Therapy', description: 'Treating chronic conditions using specialized color prana protocols.' },
    { id: '04', src: getServiceImageUrl('complex_psychological_healing.png'), title: 'Complex Psychological Healing', category: 'Psychotherapy', description: 'Deep emotional cleansing to resolve longstanding trauma.' },
    { id: '08', src: getServiceImageUrl('healing_for_businesses.png'), title: 'Healing for Businesses', category: 'Business', description: 'Cleansing group and organizational wellness energy fields.' },
    { id: '07', src: getServiceImageUrl('healing_for_profession.png'), title: 'Healing for Profession', category: 'Career', description: 'Charging vital throat and solar plexus chakras to restore clarity.' }
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
    const [activeSubLevel, setActiveSubLevel] = useState(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const containerRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();

    const handleGalleryCardClick = (img) => {
        if (img.id) {
            navigate(`/programs?id=${img.id}`);
        } else {
            navigate('/programs');
        }
    };

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

    const activeCourse = activeIndex !== null ? (COURSES_DATA[activeIndex] || COURSES_DATA[0]) : COURSES_DATA[0];

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

    // Entrance animation for active course content (Desktop card view)
    useEffect(() => {
        if (activeIndex === null) {
            setIsTransitioning(false);
            return;
        }

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
        if (index === activeIndex) {
            // Toggle closed
            setActiveIndex(null);
            setActiveSubLevel(null);
            return;
        }

        if (isTransitioning) return;
        setIsTransitioning(true);
        setActiveSubLevel(null); // Reset sub-level selection when switching courses

        if (activeIndex === null) {
            setActiveIndex(index);
            setIsTransitioning(false);
            return;
        }

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

    // Shared content renderer for both Desktop Showcase and Mobile Accordion
    const renderShowcaseContent = (course, isMobile = false) => {
        return (
            <>
                {/* Center Heading */}
                <div style={{ 
                    gridColumn: '1 / -1', 
                    width: '100%', 
                    textAlign: 'center', 
                    marginBottom: '24px', 
                    borderBottom: '1px solid rgba(8, 50, 38, 0.08)', 
                    paddingBottom: '12px' 
                }}>
                    <h4 style={{ 
                        margin: 0, 
                        fontSize: '0.82rem', 
                        fontWeight: '850', 
                        color: 'var(--color-accent)', 
                        textTransform: 'uppercase', 
                        letterSpacing: '1.5px',
                        fontFamily: 'var(--font-heading)'
                    }}>
                        Grand Master Choa Kok Sui course
                    </h4>
                </div>

                {/* Left Column (Details) */}
                <div className="services-content-left">
                    <span className="service-details-tag">
                        {activeSubLevel !== null ? `Level ${activeSubLevel + 1} Details` : course.level}
                    </span>
                    <div className="service-title-container">
                        {isMobile ? (
                            <h2 className="service-title" style={{ fontSize: '1.8rem' }}>
                                {activeSubLevel !== null ? course.levels[activeSubLevel].title : course.title}
                            </h2>
                        ) : (
                            <h2 className="service-title">
                                <SplitText 
                                    text={activeSubLevel !== null ? course.levels[activeSubLevel].title : course.title} 
                                    key={activeSubLevel !== null ? `sub-${activeSubLevel}` : 'main'}
                                />
                            </h2>
                        )}
                    </div>
                    
                    {activeSubLevel !== null ? (
                        <div style={{ marginTop: '16px', marginBottom: '24px' }}>
                            <p style={{ fontSize: '0.96rem', color: 'var(--color-text-muted)', lineHeight: '1.6', margin: '0 0 20px 0' }}>
                                {course.levels[activeSubLevel].desc}
                            </p>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveSubLevel(null);
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--color-accent)',
                                    fontWeight: '600',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.92rem',
                                    padding: '0',
                                    textDecoration: 'underline'
                                }}
                            >
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: 'rotate(180deg)' }}>
                                    <polyline points="9 6 15 12 9 18" />
                                </svg>
                                <span>Back to Course Overview</span>
                            </button>
                        </div>
                    ) : (
                        <>
                            {course.badge && <h3 className="service-summary">{course.badge}</h3>}
                            
                            {course.isCombined ? (
                                <div className="service-levels-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px', marginBottom: '20px' }}>
                                    {course.levels.map((lvl, lIdx) => (
                                        <div 
                                            key={lIdx} 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveSubLevel(lIdx);
                                            }}
                                            className="service-level-item" 
                                            style={{ 
                                                background: 'rgba(8, 50, 38, 0.02)', 
                                                borderLeft: '3px solid var(--color-accent)', 
                                                padding: '12px 16px', 
                                                borderRadius: '0 var(--border-radius-sm) var(--border-radius-sm) 0',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                textAlign: 'left'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'rgba(8, 50, 38, 0.05)';
                                                e.currentTarget.style.transform = 'translateX(4px)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'rgba(8, 50, 38, 0.02)';
                                                e.currentTarget.style.transform = 'translateX(0)';
                                            }}
                                        >
                                            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', color: 'var(--color-primary-dark)', marginBottom: '4px', fontWeight: 'bold', margin: '0 0 4px 0' }}>{lvl.title}</h4>
                                            <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: '1.5', margin: 0 }}>{lvl.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="service-description" style={{ fontSize: '0.96rem', lineHeight: '1.6' }}>{course.description}</p>
                            )}
                        </>
                    )}
                    
                    <div className="service-meta-box" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px', marginBottom: '24px' }}>
                        <div className="service-meta-item">
                            <div className="service-meta-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="16" x2="12" y2="12" />
                                    <line x1="12" y1="8" x2="12.01" y2="8" />
                                </svg>
                            </div>
                            <div className="service-meta-text">
                                <strong>Category:</strong> <span>{CATEGORIES.find(c => c.id === course.category)?.label || course.category}</span>
                            </div>
                        </div>

                        {course.eligibility && (
                            <div className="service-meta-item">
                                <div className="service-meta-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                </div>
                                <div className="service-meta-text">
                                    <strong>Eligibility:</strong> <span>{course.eligibility}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <Link 
                        to="/contact?course=Find%20a%20Course"
                        state={{ selectedCourse: 'Find a Course' }}
                        className="service-cta-btn" 
                        id="services-cta-button"
                        style={{ alignSelf: 'flex-start', textDecoration: 'none' }}
                    >
                        <span>Register Interest</span>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                        </svg>
                    </Link>
                </div>

                {/* Right Column (Image/Visual) */}
                <div className="services-content-right" style={{ display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center', width: '100%', alignItems: 'center' }}>
                    {course.isCombined ? (
                        <div className="combined-course-images-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '360px' }}>
                            {course.images.map((imgSrc, imgIdx) => {
                                const isSubActive = activeSubLevel === imgIdx;
                                return (
                                    <div 
                                        key={imgIdx} 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveSubLevel(isSubActive ? null : imgIdx);
                                        }}
                                        className="combined-img-card" 
                                        style={{ 
                                            display: 'flex', 
                                            gap: '12px', 
                                            alignItems: 'center', 
                                            background: 'var(--color-white)', 
                                            padding: '6px 12px', 
                                            borderRadius: 'var(--border-radius-sm)', 
                                            border: isSubActive ? '2px solid var(--color-accent)' : '1px solid rgba(8, 50, 38, 0.05)', 
                                            boxShadow: isSubActive ? 'var(--shadow-md)' : 'var(--shadow-sm)', 
                                            cursor: 'pointer',
                                            transform: isSubActive ? 'scale(1.03)' : 'none',
                                            transition: 'all 0.3s ease',
                                            overflow: 'hidden'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isSubActive) {
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.border = '1px solid rgba(8, 50, 38, 0.15)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isSubActive) {
                                                e.currentTarget.style.transform = 'none';
                                                e.currentTarget.style.border = '1px solid rgba(8, 50, 38, 0.05)';
                                            }
                                        }}
                                    >
                                        <div style={{ width: '90px', height: '60px', overflow: 'hidden', borderRadius: 'var(--border-radius-xs)', flexShrink: 0, background: 'var(--color-white)', border: '1px solid rgba(8, 50, 38, 0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <img 
                                                src={imgSrc} 
                                                alt={`Level ${imgIdx + 1}`} 
                                                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left', overflow: 'hidden', flexGrow: 1 }}>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Level {imgIdx + 1}</span>
                                            <span style={{ fontSize: '0.84rem', fontWeight: '800', color: 'var(--color-primary-dark)', fontFamily: 'var(--font-heading)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                                {imgIdx === 0 ? 'Elementary Pranic Healing' : imgIdx === 1 ? 'Intermediate Pranic Healing' : 'Distant Pranic Healing'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="service-image-wrapper">
                            <img 
                                src={course.image} 
                                alt={course.title} 
                                className="service-img" 
                                style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 'var(--border-radius-sm)' }}
                                onError={(e) => {
                                    e.target.src = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80';
                                }}
                            />
                        </div>
                    )}
                </div>
            </>
        );
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
                        const isActive = activeIndex === idx;
                        return (
                            <React.Fragment key={course.id}>
                                <button
                                    className={`service-tab-btn ${isActive ? 'active' : ''}`}
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
                                
                                {/* Mobile Accordion Content (Only visible on mobile via media queries) */}
                                {isActive && (
                                    <div className="mobile-accordion-content">
                                        {renderShowcaseContent(course, true)}
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Content Showcase Card (Desktop) */}
                <div className="services-content-showcase">
                    <div className="services-card-grid-decor"></div>
                    
                    {activeIndex !== null ? (
                        <>
                            {/* Watermark Index */}
                            <div className="service-watermark">{(activeIndex + 1).toString().padStart(2, '0')}</div>
                            {renderShowcaseContent(activeCourse, false)}
                        </>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gridColumn: 'span 2', padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)', width: '100%' }}>
                            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '16px', color: 'var(--color-accent)', opacity: 0.7 }}>
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="16" x2="12" y2="12" />
                                <line x1="12" y1="8" x2="12.01" y2="8" />
                            </svg>
                            <h3 style={{ fontSize: '1.25rem', color: 'var(--color-primary-dark)', fontFamily: 'var(--font-heading)', margin: '0 0 8px 0' }}>Discover Our Programmes</h3>
                            <p style={{ fontSize: '0.95rem', maxWidth: '380px', margin: 0, lineHeight: '1.5' }}>Select any course from the list to explore curriculum modules, certification levels, and eligibility details.</p>
                        </div>
                    )}
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
                tagline="THERAPY & AURA SCANNING"
                title="Healing Services Showcase"
                images={PROGRAMS_GALLERY_IMAGES}
                isSandBg={false}
                onCardClick={handleGalleryCardClick}
            />
        </div>
    );
}
