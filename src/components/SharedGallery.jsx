import { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './SharedComponents.css';

// Ensure ScrollTrigger is registered
gsap.registerPlugin(ScrollTrigger);

export default function SharedGallery({ title = "Gallery Showcase", tagline = "VISUAL GLIMPSES", images = [], isSandBg = false, onCardClick = null }) {
    const [lightboxIndex, setLightboxIndex] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const gridRef = useRef(null);
    const sectionRef = useRef(null);
 
    // Initial GSAP reveal animations when scrolled into view
    useEffect(() => {
        const ctx = gsap.context(() => {
            // Header animation
            gsap.fromTo('.shared-gallery-header', 
                { opacity: 0, y: 30 },
                {
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top 80%',
                        toggleActions: 'play none none none'
                    },
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    ease: 'power3.out'
                }
            );

            // Card items entrance stagger
            if (gridRef.current && gridRef.current.children.length > 0) {
                gsap.fromTo(gridRef.current.children, 
                    { opacity: 0, scale: 0.9, y: 30 },
                    {
                        scrollTrigger: {
                            trigger: gridRef.current,
                            start: 'top 85%',
                            toggleActions: 'play none none none'
                        },
                        opacity: 1,
                        scale: 1,
                        y: 0,
                        duration: 0.8,
                        stagger: 0.08,
                        ease: 'power2.out'
                    }
                );
            }
        }, sectionRef);

        return () => ctx.revert();
    }, [images]);

    const handleOpen = (index) => {
        setLightboxIndex(index);
        setTimeout(() => {
            setIsOpen(true);
        }, 10);
    };

    const handleClose = useCallback(() => {
        setIsOpen(false);
        setTimeout(() => {
            setLightboxIndex(null);
        }, 400);
    }, []);

    const handleNext = useCallback((e) => {
        if (e) e.stopPropagation();
        setLightboxIndex((prev) => (prev !== null ? (prev + 1) % images.length : null));
    }, [images.length]);

    const handlePrev = useCallback((e) => {
        if (e) e.stopPropagation();
        setLightboxIndex((prev) => (prev !== null ? (prev - 1 + images.length) % images.length : null));
    }, [images.length]);

    // Keyboard controls for lightbox
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (lightboxIndex === null) return;
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'Escape') handleClose();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxIndex, handleNext, handlePrev, handleClose]);

    if (!images || images.length === 0) return null;

    return (
        <section ref={sectionRef} className={`shared-gallery-section ${isSandBg ? 'sand-bg' : ''}`}>
            <div className="shared-gallery-container">
                <div className="shared-gallery-header">
                    <span className="section-tagline">{tagline}</span>
                    <h2 className="section-title">{title}</h2>
                </div>

                <div ref={gridRef} className="shared-gallery-grid">
                    {images.map((img, idx) => (
                        <div 
                            key={idx} 
                            className="shared-gallery-card"
                            onClick={() => {
                                if (onCardClick) {
                                    onCardClick(img, idx);
                                } else {
                                    handleOpen(idx);
                                }
                            }}
                            style={{ cursor: 'pointer' }}
                        >
                            <img src={img.src} alt={img.title} className="shared-gallery-card-img" />
                            <div className="shared-gallery-zoom-icon">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                    <line x1="11" y1="8" x2="11" y2="14"></line>
                                    <line x1="8" y1="11" x2="14" y2="11"></line>
                                </svg>
                            </div>
                            <div className="shared-gallery-card-overlay">
                                {img.category && <span className="shared-gallery-card-cat">{img.category}</span>}
                                <h4 className="shared-gallery-card-title">{img.title}</h4>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Lightbox Modal overlay */}
            {lightboxIndex !== null && (
                <div 
                    className={`shared-lightbox-overlay ${isOpen ? 'active' : ''}`} 
                    onClick={handleClose}
                >
                    <div className="shared-lightbox-backdrop" />
                    
                    <button className="shared-lightbox-close" onClick={handleClose} aria-label="Close lightbox">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>

                    <button className="shared-lightbox-arrow shared-lightbox-arrow-left" onClick={handlePrev} aria-label="Previous image">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>

                    <div className="shared-lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <div className="shared-lightbox-img-wrapper">
                            <img 
                                src={images[lightboxIndex].src} 
                                alt={images[lightboxIndex].title} 
                                className="shared-lightbox-img" 
                            />
                        </div>
                        <div className="shared-lightbox-caption">
                            <h4>{images[lightboxIndex].title}</h4>
                            {images[lightboxIndex].description && <p>{images[lightboxIndex].description}</p>}
                        </div>
                    </div>

                    <button className="shared-lightbox-arrow shared-lightbox-arrow-right" onClick={handleNext} aria-label="Next image">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </button>
                </div>
            )}
        </section>
    );
}
