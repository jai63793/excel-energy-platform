import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { servicesData } from '../data/servicesData';
import SharedAbout from '../components/SharedAbout';
import SharedGallery from '../components/SharedGallery';

const getImageUrl = (name) => {
    return new URL(`../assets/images/${name}`, import.meta.url).href;
};

const getServiceImageUrl = (name) => {
    return new URL(`../assets/images/heal-serve/${name}`, import.meta.url).href;
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

const CATEGORIES = [
    { id: 'all', label: 'All Services' },
    { id: 'physical', label: 'Physical Healing' },
    { id: 'psychological', label: 'Psychological Healing' },
    { id: 'prosperity', label: 'Prosperity & Career' },
    { id: 'special', label: 'Special Therapies' }
];

export default function Programs() {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [filteredServices, setFilteredServices] = useState(servicesData);
    const [selectedService, setSelectedService] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();
    const gridRef = useRef(null);
    const [animateGrid, setAnimateGrid] = useState(false);
    const mainSectionRef = useRef(null);

    // Handle selecting and scrolling to a service from state or URL query
    useEffect(() => {
        let targetServiceId = null;
        
        if (location.state && typeof location.state.serviceIndex === 'number') {
            const svc = servicesData[location.state.serviceIndex];
            if (svc) {
                targetServiceId = svc.id;
            }
        } else if (location.state && location.state.category) {
            setTimeout(() => {
                setSelectedCategory(location.state.category);
                const results = servicesData.filter(s => s.category === location.state.category);
                setFilteredServices(results);
                setSelectedService(null);
            }, 0);
            return;
        } else {
            const params = new URLSearchParams(location.search);
            const idParam = params.get('id');
            if (idParam) {
                targetServiceId = idParam;
            }
        }

        if (targetServiceId) {
            // Ensure double digit padding matching '01', '02', ...
            const formattedId = targetServiceId.toString().padStart(2, '0');
            const targetService = servicesData.find(s => s.id === formattedId);
            
            if (targetService) {
                setTimeout(() => {
                    setSelectedCategory(targetService.category);
                    const results = servicesData.filter(s => s.category === targetService.category);
                    setFilteredServices(results);
                    setSelectedService(targetService);
                    setAnimateGrid(true);

                    // Animate grid items back in
                    if (gridRef.current) {
                        gsap.fromTo(gridRef.current.children, 
                            { opacity: 0, scale: 0.95, y: 15 },
                            {
                                opacity: 1,
                                scale: 1,
                                y: 0,
                                duration: 0.35,
                                stagger: 0.02,
                                ease: 'power2.out'
                            }
                        );
                    }
                }, 0);

                setTimeout(() => {
                    const el = document.getElementById(`service-card-${formattedId}`);
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el.classList.add('highlight-pulse');
                        setTimeout(() => {
                            el.classList.remove('highlight-pulse');
                        }, 2500);
                    }
                }, 150);
            }
        } else {
            setTimeout(() => {
                setSelectedCategory('all');
                setFilteredServices(servicesData);
                setSelectedService(null);
                setAnimateGrid(true);

                if (gridRef.current) {
                    gsap.fromTo(gridRef.current.children, 
                        { opacity: 0, scale: 0.95, y: 15 },
                        {
                            opacity: 1,
                            scale: 1,
                            y: 0,
                            duration: 0.35,
                            stagger: 0.02,
                            ease: 'power2.out'
                        }
                    );
                }
            }, 0);
        }
    }, [location.state, location.search]);

    // Initial load animations
    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo('.courses-hero-content h1, .courses-hero-content p, .courses-hero-content .breadcrumbs', 
                { y: 40, opacity: 0 },
                { y: 0, opacity: 1, duration: 1, stagger: 0.15, ease: 'power3.out', clearProps: 'opacity,transform' }
            );

            gsap.fromTo('.courses-filter-btn', 
                { scale: 0.9, opacity: 0 },
                { 
                    scale: 1, 
                    opacity: 1, 
                    duration: 0.6, 
                    stagger: 0.05, 
                    ease: 'back.out(1.7)', 
                    delay: 0.3,
                    clearProps: 'opacity,scale,transform'
                }
            );
        });
        return () => ctx.revert();
    }, []);

    // IntersectionObserver to reveal cards
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setAnimateGrid(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.05 }
        );
        if (mainSectionRef.current) {
            observer.observe(mainSectionRef.current);
        }
        return () => observer.disconnect();
    }, []);

    // Trigger GSAP 3D spring-in animation when scrolled in
    useEffect(() => {
        if (animateGrid && gridRef.current) {
            gsap.to(gridRef.current.children, {
                opacity: 1,
                scale: 1,
                y: 0,
                duration: 0.8,
                stagger: 0.06,
                ease: 'power2.out'
            });
        }
    }, [animateGrid]);

    const handleFilterChange = (catId) => {
        setSelectedCategory(catId);
        const results = catId === 'all' 
            ? servicesData 
            : servicesData.filter(s => s.category === catId);
        setFilteredServices(results);

        setTimeout(() => {
            if (gridRef.current) {
                gsap.fromTo(gridRef.current.children, 
                    { opacity: 0, scale: 0.95, y: 15 },
                    {
                        opacity: 1,
                        scale: 1,
                        y: 0,
                        duration: 0.35,
                        stagger: 0.02,
                        ease: 'power2.out'
                    }
                );
            }
        }, 20);
    };

    return (
        <div className="courses-page-wrapper">
            {/* Hero Banner Section using courses style */}
            <section className="courses-hero page-hero-banner">
                <div className="courses-hero-content">
                    <span className="section-tagline">OUR SERVICES</span>
                    <h1>Our Healing Services</h1>
                    <p>
                        Grounded in the core teachings of Grand Master Choa Kok Sui. Delivered by Associate Certified & Certified Pranic Healers, with virtual and in-person guidance.
                    </p>
                    <div className="breadcrumbs">
                        <Link to="/">Home</Link>
                        <span className="crumb-separator">/</span>
                        <span className="active-crumb">Services</span>
                    </div>
                </div>
            </section>

            {/* Main Content Area using courses style */}
            <section className="courses-main-section" ref={mainSectionRef}>
                <div className="courses-container">
                    
                    {/* Category Filter Pills */}
                    <div className="courses-filter-wrapper">
                        <div className="courses-filter-tabs">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat.id}
                                    className={`courses-filter-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                                    onClick={() => handleFilterChange(cat.id)}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Services Grid */}
                    <div className="courses-grid-container">
                        <div ref={gridRef} className="courses-grid">
                            {filteredServices.map((svc) => (
                                <div 
                                    key={svc.id} 
                                    id={`service-card-${svc.id}`}
                                    className="course-card"
                                    onClick={() => setSelectedService(svc)}
                                    style={{ 
                                        '--card-accent': 'var(--color-primary-medium)',
                                        opacity: 0,
                                        transform: 'translate3d(0, 40px, 0) scale(0.96)'
                                    }}
                                >
                                    <div className="course-card-image-wrapper">
                                        <img 
                                            src={svc.image} 
                                            alt={svc.title} 
                                            className="course-card-image"
                                            onError={(e) => {
                                                e.target.src = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80';
                                            }}
                                        />
                                        <div className="course-badge" style={{ backgroundColor: 'var(--color-accent)' }}>
                                            {svc.id}
                                        </div>
                                    </div>
                                    <div className="course-card-body">
                                        <span className="course-level">{svc.tagline}</span>
                                        <h3 className="course-title">{svc.title}</h3>
                                        <p className="course-description">{svc.summary}</p>
                                        <div className="course-card-footer" style={{ marginTop: 'auto', borderTop: '1px solid rgba(8, 50, 38, 0.05)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.88rem', fontWeight: 'bold', color: 'var(--color-primary-medium)' }}>View Details</span>
                                            <span className="course-btn-action" style={{ padding: '8px' }}>
                                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                                    <polyline points="12 5 19 12 12 19"></polyline>
                                                </svg>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Premium Service Modal Overlay */}
                    {selectedService && (
                        <div className="service-modal-overlay" onClick={() => {
                            setSelectedService(null);
                        }}>
                            <div className="service-modal-content" onClick={(e) => e.stopPropagation()}>
                                <button className="service-modal-close" onClick={() => {
                                    setSelectedService(null);
                                }} aria-label="Close modal">&times;</button>
                                <div className="service-modal-body">
                                    <div className="service-modal-image-wrapper">
                                        <img 
                                            src={selectedService.image} 
                                            alt={selectedService.title} 
                                            className="service-modal-image"
                                            onError={(e) => {
                                                e.target.src = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80';
                                            }}
                                        />
                                    </div>
                                    <div className="service-modal-info">
                                        <span className="service-modal-tagline">{selectedService.tagline}</span>
                                        <h2 className="service-modal-title">{selectedService.title}</h2>
                                        <p className="service-modal-desc">{selectedService.details}</p>
                                        
                                        {selectedService.idealFor && (
                                            <div className="service-modal-ideal">
                                                <strong>Ideal For:</strong> {selectedService.idealFor}
                                            </div>
                                        )}

                                        {/* 8 Miracles Available link */}
                                        {!['09', '10', '12'].includes(selectedService.id) && (
                                            <div style={{ marginBottom: '16px', borderTop: '1px solid rgba(8, 50, 38, 0.05)', paddingTop: '16px', display: 'flex' }}>
                                                <a 
                                                    href={`#/miraclesbooking?service=${selectedService.id}`}
                                                    onClick={() => setSelectedService(null)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: 'var(--color-accent)',
                                                        padding: '0',
                                                        fontSize: '0.92rem',
                                                        fontWeight: '600',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        cursor: 'pointer',
                                                        textDecoration: 'underline'
                                                    }}
                                                >
                                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                                    </svg>
                                                    <span>8 Miracles Healing Available</span>
                                                </a>
                                            </div>
                                        )}
                                        
                                        <div className="service-modal-actions" style={{ marginTop: 'auto', display: 'flex', gap: '10px', flexWrap: 'nowrap', width: '100%' }}>
                                            <Link 
                                                to={`/contact?service=${encodeURIComponent(selectedService.title)}`}
                                                state={{ selectedService: selectedService.title }}
                                                className="btn-primary"
                                                style={{ display: 'inline-flex', flex: 1, padding: '10px 14px', fontSize: '0.85rem', justifyContent: 'center', alignItems: 'center', whiteSpace: 'nowrap' }}
                                            >
                                                <span>Book Now</span>
                                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginLeft: '4px' }}>
                                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                                    <polyline points="12 5 19 12 12 19"></polyline>
                                                </svg>
                                            </Link>
                                            <Link 
                                                to="/join-member" 
                                                className="btn-secondary"
                                                style={{ display: 'inline-flex', flex: 1, padding: '10px 14px', fontSize: '0.85rem', justifyContent: 'center', alignItems: 'center', whiteSpace: 'nowrap' }}
                                            >
                                                <span>Join Member</span>
                                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginLeft: '4px' }}>
                                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                                    <polyline points="12 5 19 12 12 19"></polyline>
                                                </svg>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </section>

            <SharedAbout
                tagline="OUR HEALING MISSION"
                title="Systematic Energy Science"
                desc="Our healing therapies utilize Pranic Healing®, a highly evolved system of energy medicine that cleanses and energizes the invisible energy body (aura). By restoring energetic balance, we stimulate the body's innate self-healing capabilities."
                points={[
                    "No-touch, drugless therapy format",
                    "Distant healing sessions available globally",
                    "Aura mapping and Bio-well GDV analysis"
                ]}
                imageSrc={getImageUrl('pranic_healing_left.png')}
                isLightBg={true}
                imageLeft={true}
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
