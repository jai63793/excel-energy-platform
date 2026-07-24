import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import gsap from 'gsap';
import { knowledgeImages } from '../data/knowledgeImages';
import SharedAbout from '../components/SharedAbout';
import SharedGallery from '../components/SharedGallery';

const getImageUrl = (name) => {
    return new URL(`../assets/images/${name}`, import.meta.url).href;
};

const getServiceImageUrl = (name) => {
    return new URL(`../assets/images/heal-serve/${name}`, import.meta.url).href;
};

const PROGRAMS_GALLERY_IMAGES = [
    { src: getServiceImageUrl('advanced_physical_healing.png'), title: 'Advanced Physical Healing', category: 'Therapy', description: 'Treating chronic conditions using specialized color prana protocols.' },
    { src: getServiceImageUrl('complex_psychological_healing.png'), title: 'Complex Psychotherapy', category: 'Psychotherapy', description: 'Deep emotional cleansing to resolve longstanding trauma.' },
    { src: getServiceImageUrl('healing_for_businesses.png'), title: 'Corporate Alignment Room', category: 'Business', description: 'Cleansing group and organizational wellness energy fields.' },
    { src: getServiceImageUrl('healing_for_profession.png'), title: 'Professional Effectiveness', category: 'Career', description: 'Charging vital throat and solar plexus chakras to restore clarity.' }
];

const TAB_HERO_DATA = {
    chakras: {
        tagline: "UNDERSTANDING THE ENERGY BODY",
        title: "Chakras — Energy Centres",
        desc: "Major Chakras or Energy Centers serve as entry points for life energy — Prana — into your body. They not only control and energise the vital organs but also control and affect a person's psychological and spiritual conditions."
    },
    arhatic: {
        tagline: "THE YOGA OF SYNTHESIS",
        title: "Arhatic Yoga®",
        desc: "A comprehensive spiritual system developed by Grand Master Choa Kok Sui — synthesising the essence of seven yogic traditions into one of the most powerful and efficient paths for soul evolution available today."
    },
    practice: {
        tagline: "SACRED PRACTICES & SCIENTIFIC MEASUREMENT",
        title: "Meditation & Bio-Well",
        desc: "The Meditation on Twin Hearts — one of humanity's most beautiful gifts — alongside Bio-Well GDV scanning, which makes the invisible energy field visible and measurable."
    }
};

export default function Knowledge() {
    const [searchParams, setSearchParams] = useSearchParams();
    const tabParam = searchParams.get('tab') || 'chakras';
    const [activeTab, setActiveTab] = useState(tabParam);
    const contentRef = useRef(null);

    useEffect(() => {
        if (tabParam && ['chakras', 'arhatic', 'practice'].includes(tabParam)) {
            setActiveTab(tabParam);
        }
    }, [tabParam]);

    const handleTabChange = (tabId) => {
        setSearchParams({ tab: tabId });
        setActiveTab(tabId);

        // Animate the container when switching tabs
        if (contentRef.current) {
            gsap.fromTo(contentRef.current,
                { opacity: 0, y: 15 },
                { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
            );
        }
    };

    // FAQ Accordion Handler
    const handleFaqToggle = (e) => {
        const item = e.currentTarget.parentElement;
        const isOpen = item.classList.contains('on');
        
        // Close other FAQs
        const allItems = document.querySelectorAll('.fi');
        allItems.forEach(i => i.classList.remove('on'));
        
        if (!isOpen) {
            item.classList.add('on');
        }
    };

    // Arhatic / twin hearts courses dynamic triggers (standard tabs helper if any)
    const handleCourseTab = (id, e) => {
        document.querySelectorAll('.cpnl').forEach(p => p.classList.remove('on'));
        document.querySelectorAll('.ct').forEach(b => b.classList.remove('on'));
        
        const targetPanel = document.getElementById('cb-' + id);
        if (targetPanel) targetPanel.classList.add('on');
        if (e && e.currentTarget) e.currentTarget.classList.add('on');
    };

    const hero = TAB_HERO_DATA[activeTab] || TAB_HERO_DATA.chakras;

    return (
        <div className="courses-page-wrapper">
            {/* Page Hero using dynamic tab details */}
            <section className="courses-hero page-hero-banner">
                <div className="courses-hero-content">
                    <span className="section-tagline">{hero.tagline}</span>
                    <h1>{hero.title}</h1>
                    <p>{hero.desc}</p>
                    <div className="breadcrumbs">
                        <Link to="/">Home</Link>
                        <span className="crumb-separator">/</span>
                        <span className="active-crumb">Knowledge</span>
                    </div>
                </div>
            </section>

            {/* Tab Selection Filter Wrapper */}
            <div className="courses-filter-wrapper" style={{ background: 'var(--color-bg-sand)', borderBottom: '1px solid rgba(8, 50, 38, 0.05)', padding: '24px 0' }}>
                <div className="courses-container" style={{ display: 'flex', justifyContent: 'center' }}>
                    <div className="courses-filter-tabs" style={{ margin: 0 }}>
                        <button
                            className={`courses-filter-btn ${activeTab === 'chakras' ? 'active' : ''}`}
                            onClick={() => handleTabChange('chakras')}
                        >
                            Chakras &amp; Energy Body
                        </button>
                        <button
                            className={`courses-filter-btn ${activeTab === 'arhatic' ? 'active' : ''}`}
                            onClick={() => handleTabChange('arhatic')}
                        >
                            Arhatic Yoga&#174;
                        </button>
                        <button
                            className={`courses-filter-btn ${activeTab === 'practice' ? 'active' : ''}`}
                            onClick={() => handleTabChange('practice')}
                        >
                            Meditation &amp; Bio-Well
                        </button>
                    </div>
                </div>
            </div>

            {/* Tab Contents */}
            <div ref={contentRef} className="knowledge-tab-content">
                {activeTab === 'chakras' && (
                    <div className="tab-pane-wrapper">
                        {/* Chakras section */}
                        <section className="pa sp" style={{ background: 'var(--color-bg-light)' }}>
                            <div className="courses-container">
                                <div className="chki">
                                    <div style={{ textAlign: 'center' }}>
                                        <img 
                                            src={knowledgeImages.chakras_img_0} 
                                            alt="Chakras and their Functions in the Human Body" 
                                            style={{ width: '100%', maxWidth: '380px', borderRadius: 'var(--border-radius-md)', boxShadow: '0 4px 20px rgba(8, 50, 38, 0.06)', margin: '0 auto' }}
                                        />
                                    </div>
                                    <div>
                                        <span className="section-tagline">AS TAUGHT BY GRAND MASTER CHOA KOK SUI</span>
                                        <h2 className="section-title" style={{ textAlign: 'left', margin: '8px 0 20px 0' }}>What Are Chakras?</h2>
                                        <div className="bl" style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: 'var(--color-text-muted)', lineHeight: '1.7' }}>
                                            <p>Chakras serve as entry points for life energy — Prana — into your body. Grand Master Choa Kok Sui identified <strong>12 Major Chakras</strong> in Pranic Healing and Arhatic Yoga, each corresponding to specific organs and glands of the physical body based on their positions.</p>
                                            <p>The major chakras not only control and energise the vital organs of the body but also control and affect a person’s psychological and spiritual conditions. Just as the visible physical body has vital and minor organs, the energy body has major, minor, and mini chakras.</p>
                                            <p>When any chakra becomes congested with diseased energy or depleted of prana, the corresponding physical organs and psychological functions begin to suffer. This is why Pranic Healing works at the level of the energy body: addressing root causes rather than surface symptoms.</p>
                                        </div>
                                        <blockquote style={{ borderLeft: '4px solid var(--color-accent)', paddingLeft: '20px', fontFamily: 'var(--font-heading)', fontStyle: 'italic', fontSize: '1.15rem', color: 'var(--color-primary-medium)', margin: '30px 0 0 0', lineHeight: '1.6' }}>
                                            "The chakras are like the power stations of the body, bringing life to the major organs and keeping us mentally, emotionally and physically healthy."
                                            <cite style={{ display: 'block', fontSize: '0.75rem', fontStyle: 'normal', fontWeight: 'bold', color: 'var(--color-accent)', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>— Grand Master Choa Kok Sui</cite>
                                        </blockquote>
                                    </div>
                                </div>

                                <div style={{ marginTop: '80px', textAlign: 'center' }}>
                                    <span className="section-tagline">THE 11 MAJOR CHAKRAS</span>
                                    <h2 className="section-title" style={{ margin: '8px 0 12px 0' }}>Chakras Map</h2>
                                    <p style={{ color: 'var(--color-text-muted)', maxWidth: '600px', margin: '0 auto 40px auto' }}>As identified and mapped by Grand Master Choa Kok Sui through decades of systematic research and validation.</p>
                                    
                                    <div className="chkg">
                                        {/* Crown */}
                                        <div className="chkc" style={{ background: 'var(--color-white)', borderRadius: 'var(--border-radius-md)', border: '1px solid rgba(8, 50, 38, 0.04)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', textAlign: 'left' }}>
                                            <div className="chkt" style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(8, 50, 38, 0.05)', padding: '16px' }}>
                                                <img src={knowledgeImages.chakras_img_1} alt="Crown Chakra" style={{ width: '80px', height: '80px', objectFit: 'contain', background: 'var(--color-bg-sand)', borderRadius: 'var(--border-radius-sm)', marginRight: '16px' }} />
                                                <div>
                                                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', margin: '0 0 4px 0', color: 'var(--color-primary-dark)' }}>Crown Chakra</h3>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Top of the Head</span>
                                                </div>
                                            </div>
                                            <p style={{ padding: '20px', fontSize: '0.92rem', color: 'var(--color-text-muted)', lineHeight: '1.6', margin: 0 }}>
                                                Located at the top of the head, the Crown Chakra is the entry point of divine energy — Tian Chi. It governs the pineal gland, the brain, and the higher mind. Known in Taoist yoga as <em>bai hui</em> — “meeting point for the hundreds.” Its activation is associated with spiritual illumination and connection to the Higher Soul.
                                            </p>
                                        </div>

                                        {/* Forehead */}
                                        <div className="chkc" style={{ background: 'var(--color-white)', borderRadius: 'var(--border-radius-md)', border: '1px solid rgba(8, 50, 38, 0.04)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', textAlign: 'left' }}>
                                            <div className="chkt" style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(8, 50, 38, 0.05)', padding: '16px' }}>
                                                <img src={knowledgeImages.chakras_img_2} alt="Forehead Chakra" style={{ width: '80px', height: '80px', objectFit: 'contain', background: 'var(--color-bg-sand)', borderRadius: 'var(--border-radius-sm)', marginRight: '16px' }} />
                                                <div>
                                                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', margin: '0 0 4px 0', color: 'var(--color-primary-dark)' }}>Forehead Chakra</h3>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Centre of the Forehead</span>
                                                </div>
                                            </div>
                                            <p style={{ padding: '20px', fontSize: '0.92rem', color: 'var(--color-text-muted)', lineHeight: '1.6', margin: 0 }}>
                                                Governs the nervous system, the brain, and clairvoyant faculties. Closely associated with memory and higher cognitive function. When activated and refined, this chakra supports advanced intuition and spiritual perception.
                                            </p>
                                        </div>

                                        {/* Ajna */}
                                        <div className="chkc" style={{ background: 'var(--color-white)', borderRadius: 'var(--border-radius-md)', border: '1px solid rgba(8, 50, 38, 0.04)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', textAlign: 'left' }}>
                                            <div className="chkt" style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(8, 50, 38, 0.05)', padding: '16px' }}>
                                                <img src={knowledgeImages.chakras_img_3} alt="Ajna Chakra" style={{ width: '80px', height: '80px', objectFit: 'contain', background: 'var(--color-bg-sand)', borderRadius: 'var(--border-radius-sm)', marginRight: '16px' }} />
                                                <div>
                                                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', margin: '0 0 4px 0', color: 'var(--color-primary-dark)' }}>Ajna Chakra</h3>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Between the Eyebrows</span>
                                                </div>
                                            </div>
                                            <p style={{ padding: '20px', fontSize: '0.92rem', color: 'var(--color-text-muted)', lineHeight: '1.6', margin: 0 }}>
                                                Governs the pituitary gland and the entire endocrine system. The Ajna is the centre of higher intelligence, decision-making, and intuition. In Sanskrit, <em>ajna</em> means “to command.” Through this chakra the higher will directs the lower self.
                                            </p>
                                        </div>

                                        {/* Throat */}
                                        <div className="chkc" style={{ background: 'var(--color-white)', borderRadius: 'var(--border-radius-md)', border: '1px solid rgba(8, 50, 38, 0.04)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', textAlign: 'left' }}>
                                            <div className="chkt" style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(8, 50, 38, 0.05)', padding: '16px' }}>
                                                <img src={knowledgeImages.chakras_img_4} alt="Throat Chakra" style={{ width: '80px', height: '80px', objectFit: 'contain', background: 'var(--color-bg-sand)', borderRadius: 'var(--border-radius-sm)', marginRight: '16px' }} />
                                                <div>
                                                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', margin: '0 0 4px 0', color: 'var(--color-primary-dark)' }}>Throat Chakra</h3>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Centre of the Throat</span>
                                                </div>
                                            </div>
                                            <p style={{ padding: '20px', fontSize: '0.92rem', color: 'var(--color-text-muted)', lineHeight: '1.6', margin: 0 }}>
                                                Governs communication, the throat, tonsils, thyroid, and parathyroid glands. This chakra influences how we express ourselves — verbally, creatively, and spiritually. Imbalance manifests as thyroid disorders or creative blocks.
                                            </p>
                                        </div>

                                        {/* Heart */}
                                        <div className="chkc" style={{ background: 'var(--color-white)', borderRadius: 'var(--border-radius-md)', border: '1px solid rgba(8, 50, 38, 0.04)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', textAlign: 'left' }}>
                                            <div className="chkt" style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(8, 50, 38, 0.05)', padding: '16px' }}>
                                                <img src={knowledgeImages.chakras_img_5} alt="Heart Chakra" style={{ width: '80px', height: '80px', objectFit: 'contain', background: 'var(--color-bg-sand)', borderRadius: 'var(--border-radius-sm)', marginRight: '16px' }} />
                                                <div>
                                                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', margin: '0 0 4px 0', color: 'var(--color-primary-dark)' }}>Heart Chakra</h3>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Centre of the Chest</span>
                                                </div>
                                            </div>
                                            <p style={{ padding: '20px', fontSize: '0.92rem', color: 'var(--color-text-muted)', lineHeight: '1.6', margin: 0 }}>
                                                Governs the physical heart, circulatory system, and thymus gland. The seat of higher emotions — love, compassion, joy, and inner peace. One of the two “twin hearts” activated in the Meditation on Twin Hearts.
                                            </p>
                                        </div>

                                        {/* Solar Plexus */}
                                        <div className="chkc" style={{ background: 'var(--color-white)', borderRadius: 'var(--border-radius-md)', border: '1px solid rgba(8, 50, 38, 0.04)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', textAlign: 'left' }}>
                                            <div className="chkt" style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(8, 50, 38, 0.05)', padding: '16px' }}>
                                                <img src={knowledgeImages.chakras_img_6} alt="Solar Plexus Chakra" style={{ width: '80px', height: '80px', objectFit: 'contain', background: 'var(--color-bg-sand)', borderRadius: 'var(--border-radius-sm)', marginRight: '16px' }} />
                                                <div>
                                                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', margin: '0 0 4px 0', color: 'var(--color-primary-dark)' }}>Solar Plexus Chakra</h3>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Solar Plexus Region</span>
                                                </div>
                                            </div>
                                            <p style={{ padding: '20px', fontSize: '0.92rem', color: 'var(--color-text-muted)', lineHeight: '1.6', margin: 0 }}>
                                                Governs the stomach, liver, pancreas, gallbladder, and diaphragm. A major clearing house for emotional energies — fear, anger, stress, and grief are processed here. Congestion here is a source of many physical ailments.
                                            </p>
                                        </div>

                                        {/* Spleen */}
                                        <div className="chkc" style={{ background: 'var(--color-white)', borderRadius: 'var(--border-radius-md)', border: '1px solid rgba(8, 50, 38, 0.04)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', textAlign: 'left' }}>
                                            <div className="chkt" style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(8, 50, 38, 0.05)', padding: '16px' }}>
                                                <img src={knowledgeImages.chakras_img_7} alt="Spleen Chakra" style={{ width: '80px', height: '80px', objectFit: 'contain', background: 'var(--color-bg-sand)', borderRadius: 'var(--border-radius-sm)', marginRight: '16px' }} />
                                                <div>
                                                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', margin: '0 0 4px 0', color: 'var(--color-primary-dark)' }}>Spleen Chakra</h3>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Left Side of the Abdomen</span>
                                                </div>
                                            </div>
                                            <p style={{ padding: '20px', fontSize: '0.92rem', color: 'var(--color-text-muted)', lineHeight: '1.6', margin: 0 }}>
                                                The primary entry point for ground, solar, and air prana — environmental life force that sustains the body. Crucial for overall vitality and immune function. Weakness here directly reduces life force and immune capacity.
                                            </p>
                                        </div>

                                        {/* Navel */}
                                        <div className="chkc" style={{ background: 'var(--color-white)', borderRadius: 'var(--border-radius-md)', border: '1px solid rgba(8, 50, 38, 0.04)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', textAlign: 'left' }}>
                                            <div className="chkt" style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(8, 50, 38, 0.05)', padding: '16px' }}>
                                                <img src={knowledgeImages.chakras_img_8} alt="Navel Chakra" style={{ width: '80px', height: '80px', objectFit: 'contain', background: 'var(--color-bg-sand)', borderRadius: 'var(--border-radius-sm)', marginRight: '16px' }} />
                                                <div>
                                                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', margin: '0 0 4px 0', color: 'var(--color-primary-dark)' }}>Navel Chakra</h3>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Navel Area</span>
                                                </div>
                                            </div>
                                            <p style={{ padding: '20px', fontSize: '0.92rem', color: 'var(--color-text-muted)', lineHeight: '1.6', margin: 0 }}>
                                                Governs the small intestine, large intestine, and appendix. Also related to intuition, personal power, and emotional stability. Regarded as the body’s centre of gravity and a reservoir of vital energy.
                                            </p>
                                        </div>

                                        {/* Meng Mein */}
                                        <div className="chkc" style={{ background: 'var(--color-white)', borderRadius: 'var(--border-radius-md)', border: '1px solid rgba(8, 50, 38, 0.04)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', textAlign: 'left' }}>
                                            <div className="chkt" style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(8, 50, 38, 0.05)', padding: '16px' }}>
                                                <img src={knowledgeImages.chakras_img_9} alt="Meng Mein Chakra" style={{ width: '80px', height: '80px', objectFit: 'contain', background: 'var(--color-bg-sand)', borderRadius: 'var(--border-radius-sm)', marginRight: '16px' }} />
                                                <div>
                                                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', margin: '0 0 4px 0', color: 'var(--color-primary-dark)' }}>Meng Mein</h3>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Back, Opposite the Navel</span>
                                                </div>
                                            </div>
                                            <p style={{ padding: '20px', fontSize: '0.92rem', color: 'var(--color-text-muted)', lineHeight: '1.6', margin: 0 }}>
                                                A powerful energy centre on the back, governing blood pressure, the kidneys, and the upward distribution of earth prana. Must be treated with great care — improper energising can cause dangerous increases in blood pressure.
                                            </p>
                                        </div>

                                        {/* Sex */}
                                        <div className="chkc" style={{ background: 'var(--color-white)', borderRadius: 'var(--border-radius-md)', border: '1px solid rgba(8, 50, 38, 0.04)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', textAlign: 'left' }}>
                                            <div className="chkt" style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(8, 50, 38, 0.05)', padding: '16px' }}>
                                                <img src={knowledgeImages.chakras_img_10} alt="Sex Chakra" style={{ width: '80px', height: '80px', objectFit: 'contain', background: 'var(--color-bg-sand)', borderRadius: 'var(--border-radius-sm)', marginRight: '16px' }} />
                                                <div>
                                                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', margin: '0 0 4px 0', color: 'var(--color-primary-dark)' }}>Sex Chakra</h3>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pubic Region</span>
                                                </div>
                                            </div>
                                            <p style={{ padding: '20px', fontSize: '0.92rem', color: 'var(--color-text-muted)', lineHeight: '1.6', margin: 0 }}>
                                                Governs the sexual organs, reproductive health, and creativity. Influences the quality of relationships. In Arhatic Yoga, the management of these energies is an important aspect of practice.
                                            </p>
                                        </div>

                                        {/* Basic */}
                                        <div className="chkc" style={{ background: 'var(--color-white)', borderRadius: 'var(--border-radius-md)', border: '1px solid rgba(8, 50, 38, 0.04)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', textAlign: 'left' }}>
                                            <div className="chkt" style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(8, 50, 38, 0.05)', padding: '16px' }}>
                                                <img src={knowledgeImages.chakras_img_11} alt="Basic Chakra" style={{ width: '80px', height: '80px', objectFit: 'contain', background: 'var(--color-bg-sand)', borderRadius: 'var(--border-radius-sm)', marginRight: '16px' }} />
                                                <div>
                                                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', margin: '0 0 4px 0', color: 'var(--color-primary-dark)' }}>Basic Chakra</h3>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Base of the Spine</span>
                                                </div>
                                            </div>
                                            <p style={{ padding: '20px', fontSize: '0.92rem', color: 'var(--color-text-muted)', lineHeight: '1.6', margin: 0 }}>
                                                The foundation of the energy body — governs physical vitality, the spine, bones, blood cells, adrenal glands, and the overall will to live. Controls basic heat and the kundalini energy.
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {/* Sourced line deleted */}
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'arhatic' && (
                    <div className="tab-pane-wrapper">
                        {/* Arhatic section */}
                        <section className="pa sp" style={{ background: 'var(--color-bg-light)' }}>
                            <div className="courses-container">
                                <div className="knowledge-g2-layout-1">
                                    <div>
                                        <span className="section-tagline">WHAT IS ARHATIC YOGA?</span>
                                        <h2 className="section-title" style={{ textAlign: 'left', margin: '8px 0 20px 0' }}>The Path of the Arhat</h2>
                                        <div className="bl" style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: 'var(--color-text-muted)', lineHeight: '1.7' }}>
                                            <p>The word <strong>Arhatic</strong> is derived from <em>Arhat</em> — a Sanskrit term for a highly evolved spiritual being who has largely mastered the lower nature and walks steadily in the light of the Higher Soul.</p>
                                            <p>Developed by Grand Master Choa Kok Sui after decades of research, Arhatic Yoga synthesises the essential power and wisdom of seven distinct yogic traditions into one integrated, modern, and accelerated system. It proportionally balances <strong>Divine Love, Divine Intelligence, and Divine Will.</strong></p>
                                            <p>Unlike conventional yoga, which often emphasises postures and breathwork, Arhatic Yoga is a complete system for soul evolution — developing higher intuition, advanced mental clarity, stable and refined emotions, deep character, and the direct experience of the Higher Soul.</p>
                                        </div>
                                        <blockquote style={{ borderLeft: '4px solid var(--color-accent)', paddingLeft: '20px', fontFamily: 'var(--font-heading)', fontStyle: 'italic', fontSize: '1.15rem', color: 'var(--color-primary-medium)', margin: '30px 0 30px 0', lineHeight: '1.6' }}>
                                            "Arhatic Yoga is a synthesis of various yoga techniques into one very powerful, advanced yoga that will produce a rapid and balanced evolution of the practitioner."
                                            <cite style={{ display: 'block', fontSize: '0.75rem', fontStyle: 'normal', fontWeight: 'bold', color: 'var(--color-accent)', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>— Grand Master Choa Kok Sui</cite>
                                        </blockquote>
                                        <div className="knowledge-yp">
                                            <div className="ypi" style={{ background: 'var(--color-white)', padding: '12px', borderRadius: 'var(--border-radius-sm)', border: '1px solid rgba(8, 50, 38, 0.05)', fontSize: '0.82rem', fontWeight: '700', color: 'var(--color-primary-medium)', textAlign: 'center' }}>Raja Yoga — Mastery of Mind</div>
                                            <div className="ypi" style={{ background: 'var(--color-white)', padding: '12px', borderRadius: 'var(--border-radius-sm)', border: '1px solid rgba(8, 50, 38, 0.05)', fontSize: '0.82rem', fontWeight: '700', color: 'var(--color-primary-medium)', textAlign: 'center' }}>Karma Yoga — Selfless Action</div>
                                            <div className="ypi" style={{ background: 'var(--color-white)', padding: '12px', borderRadius: 'var(--border-radius-sm)', border: '1px solid rgba(8, 50, 38, 0.05)', fontSize: '0.82rem', fontWeight: '700', color: 'var(--color-primary-medium)', textAlign: 'center' }}>Laya/Kundalini — Energy</div>
                                            <div className="ypi" style={{ background: 'var(--color-white)', padding: '12px', borderRadius: 'var(--border-radius-sm)', border: '1px solid rgba(8, 50, 38, 0.05)', fontSize: '0.82rem', fontWeight: '700', color: 'var(--color-primary-medium)', textAlign: 'center' }}>Jnana Yoga — Wisdom</div>
                                            <div className="ypi" style={{ background: 'var(--color-white)', padding: '12px', borderRadius: 'var(--border-radius-sm)', border: '1px solid rgba(8, 50, 38, 0.05)', fontSize: '0.82rem', fontWeight: '700', color: 'var(--color-primary-medium)', textAlign: 'center' }}>Bhakti Yoga — Devotion</div>
                                            <div className="ypi" style={{ background: 'var(--color-white)', padding: '12px', borderRadius: 'var(--border-radius-sm)', border: '1px solid rgba(8, 50, 38, 0.05)', fontSize: '0.82rem', fontWeight: '700', color: 'var(--color-primary-medium)', textAlign: 'center' }}>Mantra Yoga — Sacred Sound</div>
                                            <div className="ypi" style={{ gridColumn: 'span 2', background: 'var(--color-white)', padding: '12px', borderRadius: 'var(--border-radius-sm)', border: '1px solid rgba(8, 50, 38, 0.05)', fontSize: '0.82rem', fontWeight: '700', color: 'var(--color-primary-medium)', textAlign: 'center' }}>Simplified Hatha Yoga — Physical Foundation</div>
                                        </div>
                                    </div>
                                    <div>
                                        <img src={knowledgeImages.arhatic_img_0} alt="Grand Master Choa Kok Sui teaching Arhatic Yoga" style={{ width: '100%', borderRadius: 'var(--border-radius-md)', boxShadow: '0 4px 20px rgba(8, 50, 38, 0.06)', maxHeight: '440px', objectFit: 'cover' }} />
                                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic', marginTop: '12px', textAlign: 'center' }}>Grand Master Choa Kok Sui — Teaching Arhatic Yoga</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="dp sp" style={{ background: 'var(--color-primary-dark)', padding: '80px 0', color: 'var(--color-white)' }}>
                            <div className="courses-container">
                                <div className="knowledge-g2-layout-2">
                                    <div>
                                        <img src={knowledgeImages.arhatic_img_1} alt="Grand Master Choa Kok Sui in Arhatic Yoga" style={{ width: '100%', borderRadius: 'var(--border-radius-md)', boxShadow: '0 4px 24px rgba(0,0,0,0.15)', maxHeight: '440px', objectFit: 'cover' }} />
                                        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', marginTop: '12px', textAlign: 'center' }}>Grand Master Choa Kok Sui</p>
                                    </div>
                                    <div>
                                        <span className="section-tagline" style={{ color: 'var(--color-accent)' }}>WHAT YOU DEVELOP</span>
                                        <h2 className="section-title" style={{ textAlign: 'left', margin: '8px 0 20px 0', color: 'var(--color-white)' }}>Through Arhatic Yoga Practice</h2>
                                        <div className="ahf">
                                            <div className="ahfi" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--border-radius-sm)', padding: '20px' }}><div className="ahft" style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', fontWeight: '700', color: 'var(--color-accent)', marginBottom: '8px' }}>Higher Intuition</div><p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6', margin: 0 }}>Systematic development of the higher intuitive faculties — not as an accidental gift, but as a cultivated, reliable capacity.</p></div>
                                            <div className="ahfi" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--border-radius-sm)', padding: '20px' }}><div className="ahft" style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', fontWeight: '700', color: 'var(--color-accent)', marginBottom: '8px' }}>Advanced Mental Clarity</div><p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6', margin: 0 }}>A calmer, sharper, and more integrated mind — capable of clearer decisions and sustained focus.</p></div>
                                            <div className="ahfi" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--border-radius-sm)', padding: '20px' }}><div className="ahft" style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', fontWeight: '700', color: 'var(--color-accent)', marginBottom: '8px' }}>Emotional Refinement</div><p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6', margin: 0 }}>Stable, refined emotional states — less reactive, more compassionate, with greater inner equilibrium.</p></div>
                                            <div className="ahfi" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--border-radius-sm)', padding: '20px' }}><div className="ahft" style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', fontWeight: '700', color: 'var(--color-accent)', marginBottom: '8px' }}>Character Building</div><p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6', margin: 0 }}>The Five Virtues practised as the bedrock of spiritual life — transforming character from the inside out.</p></div>
                                            <div className="ahfi" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--border-radius-sm)', padding: '20px' }}><div className="ahft" style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', fontWeight: '700', color: 'var(--color-accent)', marginBottom: '8px' }}>Soul Realisation</div><p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6', margin: 0 }}>Direct experience of the Higher Soul — the divine aspect within — and an accelerated path toward oneness.</p></div>
                                            <div className="ahfi" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--border-radius-sm)', padding: '20px' }}><div className="ahft" style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', fontWeight: '700', color: 'var(--color-accent)', marginBottom: '8px' }}>Greater Capacity to Serve</div><p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6', margin: 0 }}>Becoming an increasingly effective instrument of healing and service to humanity — the highest purpose of the path.</p></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="pa sps" style={{ background: 'var(--color-bg-sand)', padding: '80px 0' }}>
                            <div className="courses-container">
                                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                                    <span className="section-tagline">AT EXCEL ENERGY</span>
                                    <h2 className="section-title" style={{ margin: '8px 0' }}>Arhatic Yoga at Excel Energy</h2>
                                </div>
                                <div className="knowledge-g3-layout">
                                    <div className="cd">
                                        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: 'var(--color-primary-dark)', marginBottom: '14px' }}>Arhatic Yoga Preparatory Level</h3>
                                        <p style={{ fontSize: '0.93rem', color: 'var(--color-text-muted)', lineHeight: '1.6', marginBottom: '20px', flex: 1 }}>The foundational entry point into the Arhatic Yoga system. Covers the Five Pillars, purification practices, Meditation on Twin Hearts, Arhatic Energy Circulation (microcosmic orbit meditation), and character building as the foundation of all spiritual development.</p>
                                        <p style={{ fontSize: '0.82rem', fontStyle: 'italic', fontWeight: 'bold', color: 'var(--color-accent)', margin: 0 }}>Prerequisite: Basic Pranic Healing (Level 3)</p>
                                    </div>
                                    <div className="cd">
                                        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: 'var(--color-primary-dark)', marginBottom: '14px' }}>Regular Practice Sessions</h3>
                                        <p style={{ fontSize: '0.93rem', color: 'var(--color-text-muted)', lineHeight: '1.6', marginBottom: '20px', flex: 1 }}>Structured, regular group practice sittings for initiated Arhatic Yoga practitioners at Preparatory and higher levels. A supported, energetically held environment for deepening practice under the lineage of GMCKS.</p>
                                        <p style={{ fontSize: '0.82rem', fontStyle: 'italic', fontWeight: 'bold', color: 'var(--color-accent)', margin: 0 }}>For initiated practitioners only</p>
                                    </div>
                                    <div className="cd" style={{ background: 'var(--color-white)', border: '1px solid rgba(8, 50, 38, 0.05)', borderRadius: 'var(--border-radius-md)', padding: '30px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                                        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: 'var(--color-primary-dark)', marginBottom: '14px' }}>Achieving Oneness with the Higher Soul&#174;</h3>
                                        <p style={{ fontSize: '0.93rem', color: 'var(--color-text-muted)', lineHeight: '1.6', marginBottom: '20px', flex: 1 }}>A profoundly transformative course teaching meditation and contemplative practices for experiencing the direct, living connection between the incarnated soul and the Higher Soul — the divine aspect within each of us.</p>
                                        <p style={{ fontSize: '0.82rem', fontStyle: 'italic', fontWeight: 'bold', color: 'var(--color-accent)', margin: 0 }}>Course offered at Excel Energy</p>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center', marginTop: '40px' }}>
                                    <Link to="/contact" className="btn-primary" style={{ display: 'inline-flex', padding: '14px 32px' }}>Enquire About Arhatic Yoga</Link>
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'practice' && (
                    <div className="tab-pane-wrapper">
                        {/* Practice / Meditation & Bio-Well section */}
                        <section className="pa sp" style={{ background: 'var(--color-bg-light)' }}>
                            <div className="courses-container">
                                <div className="knowledge-g2-layout-1">
                                    <div>
                                        <span className="section-tagline">A GIFT TO HUMANITY</span>
                                        <h2 className="section-title" style={{ textAlign: 'left', margin: '8px 0 20px 0' }}>Meditation on Twin Hearts</h2>
                                        <div className="bl" style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: 'var(--color-text-muted)', lineHeight: '1.7' }}>
                                            <p>The Meditation on Twin Hearts is one of Grand Master Choa Kok Sui’s most beautiful and far-reaching contributions to humanity — a meditation for world peace and personal illumination that activates the heart chakra and the crown chakra simultaneously.</p>
                                            <p>The ‘twin hearts’ refer to these two chakras: the heart — the centre of human love and compassion — and the crown — the centre of divine love and spiritual illumination. By activating both simultaneously, the practitioner becomes a conduit for a quality of healing energy that far exceeds ordinary mental or emotional effort.</p>
                                            <p style={{ fontStyle: 'italic', color: 'var(--color-primary-medium)', borderLeft: '3px solid var(--color-accent)', paddingLeft: '16px' }}>“Every day you take a shower. Practising the Meditation on Twin Hearts is like taking a Spiritual Shower. When your aura is clean, you experience a higher level of awareness.” — Grand Master Choa Kok Sui</p>
                                        </div>
                                        
                                        <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <div className="mri" style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                                                <div style={{ width: '6px', height: '6px', background: 'var(--color-accent)', borderRadius: '50%', marginTop: '8px', flexShrink: 0 }}></div>
                                                <p style={{ fontSize: '0.94rem', color: 'var(--color-text-muted)', lineHeight: '1.6', margin: 0 }}>
                                                    <strong>EEG brain studies</strong> — dramatic shift from beta to alpha and theta brainwaves in both experienced meditators and first-time practitioners. Both hemispheres showed increased synchrony.
                                                </p>
                                            </div>
                                            <div className="mri" style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                                                <div style={{ width: '6px', height: '6px', background: 'var(--color-accent)', borderRadius: '50%', marginTop: '8px', flexShrink: 0 }}></div>
                                                <p style={{ fontSize: '0.94rem', color: 'var(--color-text-muted)', lineHeight: '1.6', margin: 0 }}>
                                                    <strong>Published P300 study</strong> (Tarrant &amp; Raines, PhD — PubMed Central/NIH) — improved cognitive processing speed and long-term brain efficiency in regular practitioners.
                                                </p>
                                            </div>
                                            <div className="mri" style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                                                <div style={{ width: '6px', height: '6px', background: 'var(--color-accent)', borderRadius: '50%', marginTop: '8px', flexShrink: 0 }}></div>
                                                <p style={{ fontSize: '0.94rem', color: 'var(--color-text-muted)', lineHeight: '1.6', margin: 0 }}>
                                                    <strong>Heart rate and respiratory rate</strong> dropped up to 15–20% during practice; blood oxygen saturation increased measurably.
                                                </p>
                                            </div>
                                            <div className="mri" style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                                                <div style={{ width: '6px', height: '6px', background: 'var(--color-accent)', borderRadius: '50%', marginTop: '8px', flexShrink: 0 }}></div>
                                                <p style={{ fontSize: '0.94rem', color: 'var(--color-text-muted)', lineHeight: '1.6', margin: 0 }}>
                                                    Regular practitioners report <strong>greater happiness, lower anxiety</strong>, stronger emotional resilience, and a deeper sense of purpose.
                                                </p>
                                            </div>
                                        </div>
                                        <Link to="/contact" className="btn-primary" style={{ display: 'inline-flex', padding: '14px 32px', marginTop: '30px' }}>Join a Practice Session</Link>
                                    </div>
                                    <div>
                                        <img src={knowledgeImages.practice_img_0} alt="Meditation on Twin Hearts — activating heart and crown chakras for world peace" style={{ width: '100%', borderRadius: 'var(--border-radius-md)', boxShadow: '0 4px 20px rgba(8, 50, 38, 0.06)', maxHeight: '420px', objectFit: 'cover' }} />
                                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic', marginTop: '8px', textAlign: 'center' }}>The Meditation on Twin Hearts — a meditation for personal illumination and world peace</p>
                                        
                                        {/* CSS animation for concentric glowing rings */}
                                        <div className="mv" style={{ position: 'relative', height: '260px', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', marginTop: '32px' }}>
                                            <div className="mr" style={{ position: 'absolute', borderRadius: '50%', border: '1px solid rgba(8, 50, 38, 0.1)', width: '220px', height: '220px', animation: 'ringsPulse 4s ease-in-out infinite' }}></div>
                                            <div className="mr" style={{ position: 'absolute', borderRadius: '50%', border: '1px solid rgba(224, 112, 43, 0.15)', width: '160px', height: '160px', animation: 'ringsPulse 4s ease-in-out infinite', animationDelay: '1.2s' }}></div>
                                            <div className="mr" style={{ position: 'absolute', borderRadius: '50%', border: '1px solid rgba(8, 50, 38, 0.25)', width: '100px', height: '100px', animation: 'ringsPulse 4s ease-in-out infinite', animationDelay: '2.4s' }}></div>
                                            <div className="mc" style={{ width: '50px', height: '50px', background: 'radial-gradient(circle, var(--color-accent), var(--color-primary-medium))', borderRadius: '50%', position: 'absolute', animation: 'centerGlow 4s ease-in-out infinite' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="dp sp" style={{ background: 'var(--color-bg-sand)', padding: '80px 0' }}>
                            <div className="courses-container">
                                <div className="knowledge-g2-layout-3">
                                    <div>
                                        <span className="section-tagline">SCIENTIFIC ENERGY ASSESSMENT</span>
                                        <h2 className="section-title" style={{ textAlign: 'left', margin: '8px 0 20px 0' }}>Bio-Well GDV Scanning</h2>
                                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.98rem', lineHeight: '1.7', marginBottom: '16px' }}>Developed by Professor Konstantin Korotkov of St. Petersburg State Technical University, the Bio-Well GDV device makes your energy field visible — generating a comprehensive 24-page report in under 60 seconds.</p>
                                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: '1.7', fontStyle: 'italic', marginBottom: '24px' }}>“What we have discovered with Bio-Well is that consciousness itself leaves a measurable imprint on the physical world. Every thought, every emotion, every intention creates ripples in your biofield that we can now see and understand.” — Dr. Konstantin Korotkov</p>
                                        {/* Bio-Well statistics cards deleted */}
                                        <Link to="/contact" className="btn-primary" style={{ display: 'inline-flex', padding: '14px 32px', marginTop: '30px' }}>Book a Bio-Well Scan</Link>
                                    </div>
                                    <div>
                                        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', fontWeight: '700', color: 'var(--color-primary-medium)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>What Your 24-Page Report Shows</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div className="ri" style={{ display: 'flex', gap: '14px', background: 'var(--color-white)', padding: '16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid rgba(8, 50, 38, 0.04)', boxShadow: 'var(--shadow-sm)' }}><span style={{ fontSize: '1.3rem' }}>🌐</span><div><div style={{ fontWeight: 'bold', color: 'var(--color-primary-dark)', fontSize: '0.92rem', marginBottom: '2px' }}>Biofield Image</div><div style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>Your complete energy field — size, brightness, and coherence visualised as a full aura diagram.</div></div></div>
                                            <div className="ri" style={{ display: 'flex', gap: '14px', background: 'var(--color-white)', padding: '16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid rgba(8, 50, 38, 0.04)', boxShadow: 'var(--shadow-sm)' }}><span style={{ fontSize: '1.3rem' }}>🗺️</span><div><div style={{ fontWeight: 'bold', color: 'var(--color-primary-dark)', fontSize: '0.92rem', marginBottom: '2px' }}>Organ Energy Map</div><div style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>Energy levels of major organ systems — colour-coded for immediate assessment.</div></div></div>
                                            <div className="ri" style={{ display: 'flex', gap: '14px', background: 'var(--color-white)', padding: '16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid rgba(8, 50, 38, 0.04)', boxShadow: 'var(--shadow-sm)' }}><span style={{ fontSize: '1.3rem' }}>⚡</span><div><div style={{ fontWeight: 'bold', color: 'var(--color-primary-dark)', fontSize: '0.92rem', marginBottom: '2px' }}>Chakra Alignment</div><div style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>Activity and balance of each major energy centre — position, size, and relative coherence.</div></div></div>
                                            <div className="ri" style={{ display: 'flex', gap: '14px', background: 'var(--color-white)', padding: '16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid rgba(8, 50, 38, 0.04)', boxShadow: 'var(--shadow-sm)' }}><span style={{ fontSize: '1.3rem' }}>📊</span><div><div style={{ fontWeight: 'bold', color: 'var(--color-primary-dark)', fontSize: '0.92rem', marginBottom: '2px' }}>Stress Index</div><div style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>Your psycho-physiological stress level, scientifically correlated with Heart Rate Variability.</div></div></div>
                                            <div className="ri" style={{ display: 'flex', gap: '14px', background: 'var(--color-white)', padding: '16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid rgba(8, 50, 38, 0.04)', boxShadow: 'var(--shadow-sm)' }}><span style={{ fontSize: '1.3rem' }}>🔋</span><div><div style={{ fontWeight: 'bold', color: 'var(--color-primary-dark)', fontSize: '0.92rem', marginBottom: '2px' }}>Energy Reserve</div><div style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>Your body’s total energetic capacity — your vitality “battery level” at the time of the scan.</div></div></div>
                                        </div>
                                        {/* Sources footnote deleted */}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                )}
            </div>

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
                tagline="THERAPY &amp; AURA SCANNING"
                title="Healing Services Showcase"
                images={PROGRAMS_GALLERY_IMAGES}
                isSandBg={false}
            />
        </div>
    );
}
