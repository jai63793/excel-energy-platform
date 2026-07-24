const getImageUrl = (name) => {
    return new URL(`../assets/images/heal-serve/${name}`, import.meta.url).href;
};

export const servicesData = [
    {
        id: '01',
        category: 'physical',
        title: 'Simple Physical Healing',
        tagline: 'EVERYDAY PHYSICAL RECOVERY',
        summary: 'Targeted Pranic Healing for common and acute physical conditions.',
        details: 'Targeted Pranic Healing for common and acute physical conditions — headaches, colds, fever, joint pain, fatigue, respiratory and digestive issues. The healer scans, cleanses diseased energies, and replenishes affected areas with fresh prana.',
        idealFor: 'everyday health concerns, recurring mild conditions',
        image: getImageUrl('simple_physical_healing.png'),
        icon: (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
        )
    },
    {
        id: '02',
        category: 'physical',
        title: 'Advanced Physical Healing',
        tagline: 'CHRONIC & COMPLEX DISEASES',
        summary: 'Specialised sessions for chronic and serious conditions using advanced coloured prana protocols.',
        details: 'Specialised sessions for chronic and serious conditions using advanced coloured prana protocols. Covers hypertension, diabetes, heart conditions, cancer supportive care, autoimmune disorders, neurological conditions, thyroid issues, and post-surgical recovery.',
        idealFor: 'Complement to medical treatment — not a replacement',
        image: getImageUrl('advanced_physical_healing.png'),
        icon: (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
        )
    },
    {
        id: '03',
        category: 'psychological',
        title: 'Simple Psychological Healing',
        tagline: 'EMOTIONAL BALANCE & ANXIETY RELIEF',
        summary: 'Energy-based psychotherapy for mild-to-moderate emotional concerns.',
        details: 'Energy-based healing for mild-to-moderate emotional concerns — stress, anxiety, grief, low mood, loneliness, low confidence, and emotional sensitivity. Key chakras governing emotional function are carefully cleansed and balanced to restore stability and lightness.',
        idealFor: 'life transitions, emotional turbulence, mental heaviness',
        image: getImageUrl('simple_psychological_healing.png'),
        icon: (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a5 5 0 0 0-5 5v3.18a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3V7a5 5 0 0 0-5-5z" />
                <path d="M19 12v1a7 7 0 0 1-14 0v-1" />
                <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
        )
    },
    {
        id: '04',
        category: 'psychological',
        title: 'Complex Psychological Healing',
        tagline: 'TRAUMA RECOVERY & DEEP PSYCHOTHERAPY',
        summary: 'In-depth Pranic Psychotherapy for longstanding psychological conditions.',
        details: 'In-depth Pranic Psychotherapy for longstanding psychological conditions — depression, PTSD, phobias, trauma, obsessive patterns, addictive behaviours, and deep emotional wounds. Works directly on mental and emotional energy bodies. Results often come significantly faster than conventional approaches.',
        idealFor: 'Multiple sessions recommended; personalised healing plan provided',
        image: getImageUrl('complex_psychological_healing.png'),
        icon: (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
        )
    },
    {
        id: '05',
        category: 'psychological',
        title: 'Relationship Healing',
        tagline: 'HARMONY & CONSCIOUS RELATIONSHIPS',
        summary: 'Healing emotional fields to resolve conflicts and restore harmony.',
        details: 'Healthy relationships are vital for emotional well-being. Using advanced psychotherapy protocols, we cleanse the heart and solar plexus chakras of anger, resentment, jealousy, and heavy emotional projections. This establishes a space of mutual understanding, empathy, and clear communication between couples, family members, or business partners.',
        idealFor: 'relationship conflicts, divorce recovery, family disputes, team friction',
        image: getImageUrl('relationship_healing.jpg'),
        icon: (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <circle cx="16" cy="3.13" r="3" />
            </svg>
        )
    },
    {
        id: '06',
        category: 'prosperity',
        title: 'Financial Healing',
        tagline: 'ABUNDANCE & PROSPERITY ENERGY',
        summary: 'Clearing energetic blocks to manifest wealth and prosperity.',
        details: 'Drawing on Kriyashakti® principles, Financial Healing addresses energetic blocks in the chakras that govern prosperity, willpower, and the flow of abundance. Scarcity consciousness, negative thought forms around money, and limiting beliefs are identified and systematically cleared.',
        idealFor: 'financial stagnation, persistent debt, business losses',
        image: getImageUrl('financial_healing.png'),
        icon: (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
        )
    },
    {
        id: '07',
        category: 'prosperity',
        title: 'Healing for Profession',
        tagline: 'CAREER VITALITY & LEADERSHIP FOCUS',
        summary: 'Addressing energetic imbalances affecting professional effectiveness.',
        details: 'Professional challenges — stagnation, poor communication, lack of focus, leadership difficulties — are often rooted in energetic imbalances. Our healers work on the throat, ajna, and solar plexus chakras to restore clarity, confidence, and professional vitality.',
        idealFor: 'professionals, entrepreneurs, and leaders seeking greater effectiveness',
        image: getImageUrl('healing_for_profession.png'),
        icon: (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
        )
    },
    {
        id: '08',
        category: 'prosperity',
        title: 'Healing for Businesses',
        tagline: 'ORGANISATIONAL WELLNESS',
        summary: 'Cleansing and revitalising collective corporate energy bodies.',
        details: 'Organisations carry a collective energy body that can become depleted or contaminated by stress, conflict, and accumulated negativity. Business healing cleanses and revitalises the organisation\'s subtle energy. Corporate wellness programmes — including group healing and Meditation on Twin Hearts — also available.',
        idealFor: 'start-ups, established businesses, teams in transition',
        image: getImageUrl('healing_for_businesses.png'),
        icon: (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        )
    },
    {
        id: '09',
        category: 'special',
        title: 'Crystal Therapy',
        tagline: 'LAYING OF THE CRYSTALS',
        summary: 'Amplified healing through consecrated crystal layouts.',
        details: 'Carefully selected, consecrated, and programmed crystals are placed at precise points on and around the client\'s energy body. As taught in Pranic Crystal Healing® by GMCKS, crystals amplify healing, remove deeply embedded negativity, enhance protection, and support spiritual development.',
        idealFor: 'clients requiring deeper or accelerated energetic work',
        image: getImageUrl('crystal_therapy.png'),
        icon: (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
                <line x1="12" y1="22" x2="12" y2="2" />
                <line x1="2" y1="8.5" x2="22" y2="8.5" />
                <line x1="2" y1="15.5" x2="22" y2="15.5" />
            </svg>
        )
    },
    {
        id: '10',
        category: 'special',
        title: 'Bio-Well GDV Scanning',
        tagline: 'ENERGY AUDIT & AURA ANALYSIS',
        summary: 'Scientifically validated aura coherence and chakra activity scanning.',
        details: 'A scientifically validated, non-invasive scan of all ten fingertips using Gas Discharge Visualization technology — developed by Prof. Konstantin Korotkov. Generates a comprehensive 24-page report: aura coherence, chakra activity, organ energy levels, stress index, and vitality score. Full interpretation included.',
        idealFor: 'Ideal as a baseline before healing, or a standalone energy health check',
        image: getImageUrl('bio_well_gdv_scanning.png'),
        icon: (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="M12 6v6l4 2" />
            </svg>
        )
    },
    {
        id: '11',
        category: 'psychological',
        title: 'Healing for Children & Teens',
        tagline: 'NURTURING YOUNG EMOTIONS',
        summary: 'Gentle, non-invasive energy balancing for children and adolescents.',
        details: 'Children respond beautifully to Pranic Healing\'s gentle, non-invasive approach. Sessions address hyperactivity, attention difficulties, learning challenges, anxiety, sleep disturbances, grief, and the energetic effects of family stress. Age-appropriate, safe, and nurturing.',
        idealFor: 'A natural complement to conventional support for young ones',
        image: getImageUrl('healing_for_children_teens.png'),
        icon: (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="10" r="3" />
                <path d="M12 13c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4z" />
            </svg>
        )
    },
    {
        id: '12',
        category: 'special',
        title: 'Spiritual Counselling',
        tagline: 'WISDOM & LIFE DIRECTION',
        summary: 'One-on-one guidance grounded in esoteric principles and karma.',
        details: 'One-on-one guidance grounded in GMCKS teachings — for life direction, recurring patterns, inner conflicts, and spiritual growth. Drawing on Pranic Healing, Arhatic Yoga, and the GMCKS body of knowledge — including karma, soul purpose, and the chakra system\'s relationship to life circumstances.',
        idealFor: 'crossroads, spiritual awakening, deepening one\'s practice',
        image: getImageUrl('spiritual_counselling.png'),
        icon: (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
        )
    }
];
