import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import TiltCard from '../components/TiltCard';
import SharedGallery from '../components/SharedGallery';
import './About.css';

const getServiceImageUrl = (name) => {
    return new URL(`../assets/images/heal-serve/${name}`, import.meta.url).href;
};
const getCourseImageUrl = (name) => {
    return new URL(`../assets/images/heal-course/${name}`, import.meta.url).href;
};

const ABOUT_GALLERY_IMAGES = [
    { src: getCourseImageUrl('11_meditation_on_twin_hearts.png'), title: 'Meditation on Twin Hearts', category: 'Meditation', description: 'Introductory training and open group practice sittings.' },
    { src: getCourseImageUrl('07_arhatic_yoga_preparatory.png'), title: 'Arhatic Yoga Preparatory', category: 'Arhatic Yoga', description: 'The Five Pillars of Arhatic Yoga and character building.' },
    { src: getCourseImageUrl('01_elementary_pranic_healing.png'), title: 'Elementary Pranic Healing', category: 'Basic Healing', description: 'Learn to scan, clean, and energize the aura and chakras.' },
    { src: getCourseImageUrl('02_intermediate_pranic_healing.png'), title: 'Intermediate Pranic Healing', category: 'Intermediate Healing', description: 'Advance your understanding of the chakra system and refined techniques.' }
];

gsap.registerPlugin(ScrollTrigger);

// Helper component to split text into character spans for GSAP character animations
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
                                className="char-reveal"
                                style={{
                                    display: 'inline-block',
                                    willChange: 'transform, opacity',
                                    transform: 'translateY(100%)',
                                    opacity: 0
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

export default function About() {
    const containerRef = useRef(null);

    const teamMembers = [
        { name: 'R. Madhavan', role: 'Business Professional & Partner, Rolls-Royce India', initials: 'RM' },
        { name: 'Sheela Madhavan', role: 'Business Professional & Partner, Rolls-Royce India', initials: 'SM' },
        { name: 'Anushree Jain', role: 'Transformation Coach - Founder, Padme Oasis', initials: 'AJ' },
        { name: 'Dharani Jeyaprakasam', role: 'Procurement Architect/ Consultant - Oro Labs', initials: 'DJ' },
        { name: 'Dr. Amita Kaushal', role: 'Editor-Heritage Amruth, Trans-Disciplinary University & Communication Professional, I-AIM Healthcare Center', initials: 'AK' },
        { name: 'Dr. Chandrashekhar Annamalai', role: 'Sr Consultant Nephrologist', initials: 'CA' },
        { name: 'Vidya B', role: 'Administrative Associate - P J Margo Pvt Ltd', initials: 'VB' }
    ];

    const virtues = [
        {
            id: '01',
            title: 'Loving Kindness & Non-Injury',
            desc: 'We approach every person with warmth and care, doing no harm in thought, word, or deed.'
        },
        {
            id: '02',
            title: 'Generosity & Non-Stealing',
            desc: 'We give freely of time, energy, and knowledge; we honour what belongs to others.'
        },
        {
            id: '03',
            title: 'Honesty & Non-Lying',
            desc: 'We speak and act with truthfulness and transparency at all times.'
        },
        {
            id: '04',
            title: 'Constancy of Aim & Non-Laziness',
            desc: 'We show up fully, practise diligently, and serve steadfastly, day after day.'
        },
        {
            id: '05',
            title: 'Moderation & Non-Excessiveness',
            desc: 'We live and work in balance, sustaining our energy and effectiveness over the long journey of service.'
        }
    ];

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Hero entrance animations
            gsap.fromTo('.about-hero-content p, .about-breadcrumbs',
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 1.2, stagger: 0.2, ease: 'power3.out' }
            );

            gsap.fromTo('.about-hero h1 .char-reveal',
                { y: '100%', opacity: 0 },
                { y: '0%', opacity: 1, duration: 0.8, stagger: 0.02, ease: 'power3.out' }
            );

            // Story Section scroll animations
            const storyTrigger = {
                trigger: '.about-story-section',
                start: 'top 80%'
            };

            gsap.fromTo('.about-story-content h2 .char-reveal',
                { y: '100%', opacity: 0 },
                {
                    y: '0%',
                    opacity: 1,
                    duration: 0.8,
                    stagger: 0.02,
                    ease: 'power3.out',
                    scrollTrigger: storyTrigger
                }
            );

            gsap.fromTo('.about-story-content h3, .about-story-content p',
                { y: 30, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.8,
                    stagger: 0.15,
                    ease: 'power2.out',
                    scrollTrigger: storyTrigger
                }
            );

            gsap.fromTo('.about-story-img-container, .about-visual-circle',
                { scale: 0.9, opacity: 0 },
                {
                    scale: 1,
                    opacity: 1,
                    duration: 1,
                    ease: 'back.out(1.2)',
                    scrollTrigger: storyTrigger
                }
            );

            // Team Core cards scroll animations
            gsap.fromTo('.about-team-card',
                { y: 40, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.8,
                    stagger: 0.08,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: '.about-team-section',
                        start: 'top 75%'
                    }
                }
            );

            // Healers Block
            gsap.fromTo('.about-healers-card',
                { scale: 0.95, opacity: 0, y: 30 },
                {
                    scale: 1,
                    opacity: 1,
                    y: 0,
                    duration: 0.9,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: '.about-healers-section',
                        start: 'top 80%'
                    }
                }
            );

            // Mission / Vision cards
            gsap.fromTo('.mv-card',
                { y: 50, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 1,
                    stagger: 0.2,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: '.about-mv-section',
                        start: 'top 75%'
                    }
                }
            );

            // Virtues list scroll animations
            gsap.fromTo('.virtue-card',
                { x: -50, opacity: 0 },
                {
                    x: 0,
                    opacity: 1,
                    duration: 0.8,
                    stagger: 0.12,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: '.about-virtues-section',
                        start: 'top 75%'
                    }
                }
            );

            // Parallax scroll background triggers
            gsap.utils.toArray('.parallax-bg').forEach((bg) => {
                gsap.fromTo(bg,
                    { yPercent: -12 },
                    {
                        yPercent: 12,
                        ease: 'none',
                        scrollTrigger: {
                            trigger: bg.closest('section'),
                            start: 'top bottom',
                            end: 'bottom top',
                            scrub: true
                        }
                    }
                );
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} className="about-page-container">
            {/* Hero Section */}
            <section className="about-hero page-hero-banner">
                <div className="about-shape-decor about-shape-1"></div>
                <div className="about-shape-decor about-shape-2"></div>
                <div className="about-hero-content">
                    <span className="section-tagline">OUR HISTORY & FOUNDATION</span>
                    <h1>
                        <SplitText text="About Excel Energy" />
                    </h1>
                    <p>
                        An Instrument of the Guru — dedicated to spreading the transformative sciences of Pranic Healing®, Arhatic Yoga®, and meditation to all who seek healing and growth.
                    </p>
                    <div className="about-breadcrumbs">
                        <Link to="/">Home</Link>
                        <span className="about-crumb-separator">/</span>
                        <span className="about-active-crumb">About Us</span>
                    </div>
                </div>
            </section>

            {/* Our Story Section */}
            <section className="about-story-section">
                <div className="parallax-bg-wrapper">
                    <div className="parallax-bg about-section-bg"></div>
                </div>
                <div className="about-story-content">
                    <h3>Our Story</h3>
                    <h2>
                        <SplitText text="How Excel Energy Came to Be" />
                    </h2>
                    <p>
                        Excel Energy was founded by R. Madhavan and Sheela Madhavan — successful business professionals and Partners of Rolls-Royce in India — who have been dedicated students and practitioners within the school of Grand Master Choa Kok Sui for over two decades.
                    </p>
                    <p>
                        Their journey with Pranic Healing and Arhatic Yoga has been deeply life-transforming. Over twenty years of sincere practice, study, and service shaped not only their personal and professional lives, but gave them a profound, first-hand understanding of the power of these teachings to heal, uplift, and transform every dimension of life.
                    </p>
                    <p>
                        It is from this place of gratitude and genuine conviction that Excel Energy was born — a heartfelt desire to be instrumental in spreading the Guru's teachings so that every person who seeks healing may receive it.
                    </p>
                    <p>
                        Excel Energy is run day-to-day by dedicated volunteers — Pranic Healers and Arhatic Yoga practitioners driven by the most powerful force in the universe: the Will to Do Good.
                    </p>
                </div>

                <div className="about-story-visual" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', height: 'auto' }}>
                    <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '420px' }}>
                        <div className="about-visual-circle"></div>
                        <div className="about-visual-leaf about-visual-leaf-1">
                            <svg viewBox="0 0 100 100" width="80" height="80" fill="currentColor">
                                <path d="M10 80 C40 80, 70 70, 80 20 C70 50, 40 60, 10 80 Z" />
                            </svg>
                        </div>
                        <div className="about-visual-leaf about-visual-leaf-2">
                            <svg viewBox="0 0 100 100" width="100" height="100" fill="currentColor">
                                <path d="M20 90 C50 80, 80 50, 90 10 C60 30, 30 60, 20 90 Z" />
                            </svg>
                        </div>
                        <div className="about-story-img-container" style={{ margin: 0 }}>
                            <img
                                src={new URL('../assets/images/gmc_meditation.jpg', import.meta.url).href}
                                alt="Grand Master Choa Kok Sui"
                                className="story-main-img"
                            />
                        </div>
                    </div>
                    {/* Brand Logo directly under the image container */}
                    <div className="about-story-logo-under" style={{ zIndex: 3, display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                        <img 
                            src={new URL('../assets/images/logo.png', import.meta.url).href} 
                            alt="Excel Energy Brand Logo" 
                            style={{ width: '190px', height: 'auto', display: 'block', filter: 'drop-shadow(0 2px 6px rgba(8,50,38,0.06))' }}
                        />
                    </div>
                </div>
            </section>

            {/* Team Members Section */}
            <section className="about-team-section">
                <div className="parallax-bg-wrapper">
                    <div className="parallax-bg about-section-bg"></div>
                </div>
                <div className="about-team-container">
                    <div className="section-header center">
                        <span className="section-tagline">OUR PARTNERS</span>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem', marginTop: '12px', maxWidth: '650px', textAlign: 'center', marginInline: 'auto' }}>
                            Together, they bring expertise spanning business, project management, life coaching, medicine, and more — united by their love for the teachings of GMCKS and their will to serve.
                        </p>
                    </div>

                    <div className="team-grid">
                        {teamMembers.map((member, idx) => (
                            <TiltCard key={idx} className="about-team-card">
                                <div className="team-avatar">{member.initials}</div>
                                <div className="team-details">
                                    <h4>{member.name}</h4>
                                    <p>{member.role}</p>
                                </div>
                            </TiltCard>
                        ))}
                    </div>
                </div>
            </section>

            {/* Our Healers Section */}
            <section className="about-healers-section">
                <div className="parallax-bg-wrapper">
                    <div className="parallax-bg about-section-bg"></div>
                </div>
                <div className="about-healers-card">
                    <div className="healers-icon">
                        <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                    </div>
                    <h2>Our Healers</h2>
                    <p>
                        Our healing team comprises Certified Pranic Healers and Associate Certified Pranic Healers — trained exclusively within the authentic lineage and curriculum of Grand Master Choa Kok Sui. Every healer is an active practitioner, continuing their training and living the teachings they share.
                    </p>
                </div>
            </section>

            {/* Mission & Vision Section */}
            <section className="about-mv-section">
                <div className="parallax-bg-wrapper">
                    <div className="parallax-bg about-section-bg"></div>
                </div>
                <div className="about-mv-container">
                    {/* Mission */}
                    <div className="mv-card">
                        <div className="mv-header">
                            <div className="mv-icon-circle green">
                                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                                </svg>
                            </div>
                            <h3>Our Mission</h3>
                        </div>
                        <ul className="mv-list">
                            {[
                                'To be a pure and effective Instrument of the Guru in all we do',
                                'Provide authentic, results-driven Pranic Healing services',
                                'Offer certified training so individuals become healers for their communities',
                                'Create regular practice, study, meditation, and service opportunities',
                                'Actively contribute to alleviation of poverty and hunger'
                            ].map((item, idx) => (
                                <li key={idx} className="mv-list-item">
                                    <span className="mv-check-icon">✓</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Vision */}
                    <div className="mv-card">
                        <div className="mv-header">
                            <div className="mv-icon-circle orange">
                                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            </div>
                            <h3>Our Vision</h3>
                        </div>
                        <ul className="mv-list">
                            {[
                                'Pranic Healing as a transformative tool present in every family',
                                'Alleviating the pain and suffering of all who seek healing',
                                'Opportunities for every person to be of service',
                                'Raising the vibration of Malleshwaram · Bengaluru · Karnataka · India · Earth',
                                'Hunger-Free Karnataka · Hunger-Free India'
                            ].map((item, idx) => (
                                <li key={idx} className="mv-list-item">
                                    <span className="mv-check-icon">✓</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* Virtues Section */}
            <section className="about-virtues-section">
                <div className="parallax-bg-wrapper">
                    <div className="parallax-bg about-section-bg"></div>
                </div>
                <div className="section-header center">
                    <span className="section-tagline">CHARACTER BUILDING</span>
                    <h2 className="section-title">The Five Virtues of GMCKS</h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem', marginTop: '12px', maxWidth: '650px', textAlign: 'center', marginInline: 'auto' }}>
                        The foundation of spiritual development and daily action within our lineage. Character building is an active practice.
                    </p>
                </div>

                <div className="virtues-list-container">
                    {virtues.map((v) => (
                        <div key={v.id} className="virtue-card">
                            <div className="virtue-index">{v.id}</div>
                            <div className="virtue-card-body">
                                <h3>{v.title}</h3>
                                <p>{v.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <SharedGallery
                tagline="LIFE AT EXCEL ENERGY"
                title="Glimpses of Our Sanctuary"
                images={ABOUT_GALLERY_IMAGES}
                isSandBg={true}
            />
        </div>
    );
}
