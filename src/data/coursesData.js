const getImageUrl = (name) => {
    return new URL(`../assets/images/heal-course/${name}`, import.meta.url).href;
};

export const COURSES_DATA = [
    {
        id: 1,
        title: 'Basic Pranic Healing',
        category: 'group1',
        level: 'Levels 1 - 3',
        badge: '',
        image: getImageUrl('01_elementary_pranic_healing.png'),
        isCombined: true,
        images: [
            getImageUrl('01_elementary_pranic_healing.png'),
            getImageUrl('02_intermediate_pranic_healing.png'),
            getImageUrl('03_distant_pranic_healing.png')
        ],
        levels: [
            {
                title: 'Level 1: Elementry  Pranic Healing',
                desc: 'The aura, the 11 major chakras, and the bioplasmic body. Learn to sense and scan energy fields using your hands, apply basic cleansing and energising techniques for common ailments, and practise essential energetic hygiene.'
            },
            {
                title: 'Level 2: Intermediate Pranic Healing',
                desc: 'Advance your understanding of the chakra system. Refined scanning techniques, expanded protocols for a wider range of physical conditions, and greater precision in healing practice.'
            },
            {
                title: 'Level 3: Distant Pranic Healing',
                desc: 'Learn the principles and precise techniques of healing at a distance. Prana is not limited by geography — practise sending complete healing sessions to recipients anywhere in the world.'
            }
        ],
        description: 'Includes Levels 1, 2, and 3: Basic, Intermediate, and Distant Pranic Healing.',
        eligibility: 'Open to all above age 16',
        accentColor: 'var(--color-primary-medium)'
    },
    {
        id: 4,
        title: 'Advanced Pranic Healing',
        category: 'group2',
        level: 'Level 4',
        badge: 'Advanced Healing',
        image: getImageUrl('04_advanced_pranic_healing.png'),
        description: 'Master the science and application of coloured prana in precise proportions, sequences, and combinations. Treat serious conditions including cancer, heart disease, stroke, diabetes, neurological disorders, autoimmune conditions. Includes advanced scanning and deeper energetic anatomy.',
        eligibility: 'Basic Pranic Healing',
        accentColor: 'var(--color-accent)'
    },
    {
        id: 5,
        title: 'Pranic Psychotherapy',
        category: 'group3',
        level: 'Level 5',
        badge: 'Psychotherapy',
        image: getImageUrl('05_pranic_psychotherapy.png'),
        description: 'The psychological functions of each major chakra and their relationship to mental conditions. Specialised protocols for anxiety, depression, phobias, trauma, addictive behaviours, grief, and relationship difficulties. Results often come significantly faster than conventional approaches.',
        eligibility: 'Advanced Pranic Healing',
        accentColor: '#6D3D7E'
    },
    {
        id: 6,
        title: 'Pranic Crystal Healing®',
        category: 'group4',
        level: 'For Practising Healers',
        badge: 'Practitioner Level',
        image: getImageUrl('06_pranic_crystal_healing.png'),
        description: 'The science of crystals as energetic amplifiers. Learn to select, cleanse, consecrate, and programme crystals for healing, protection, prosperity, and spiritual growth — including laying crystal layouts on the energy body.',
        eligibility: 'Pranic Psychotherapy',
        accentColor: '#2E5B88'
    },
    {
        id: 7,
        title: 'Pranic Psychic Self-Defence',
        category: 'group4',
        level: 'For Practising Healers',
        badge: 'Practitioner Level',
        image: getImageUrl('08_pranic_psychic_self_defence.png'),
        description: 'Protect yourself, your loved ones, your home, and your healing space from negative energies, psychic hooks, and contamination. Advanced shielding and protective techniques as taught by GMCKS. Essential for all active healers.',
        eligibility: 'Pranic Psychotherapy',
        accentColor: '#2E5B88'
    },
    {
        id: 8,
        title: 'Achieving Oneness with the Higher Soul®',
        category: 'group6',
        level: 'Course Offered',
        badge: 'Spiritual Courses',
        image: getImageUrl('10_achieving_oneness.png'),
        description: 'Meditation and contemplative practices for experiencing the direct, living connection between the incarnated soul and the Higher Soul — the divine aspect within. A gateway to deeper spiritual awareness and the lived experience of oneness.',
        eligibility: 'open for all above age 16',
        accentColor: '#C25E29'
    },
    {
        id: 9,
        title: 'Arhatic Yoga Preparatory',
        category: 'group5',
        level: 'Preparatory Level',
        badge: 'Arhatic Yoga',
        image: getImageUrl('07_arhatic_yoga_preparatory.png'),
        description: 'The Five Pillars of Arhatic Yoga, purification practices for physical/emotional/mental bodies, Meditation on Twin Hearts, Arhatic Energy Circulation (microcosmic orbit meditation), and character building as the foundation of spiritual life.',
        eligibility: 'Achieving Oneness with the Higher Soul®',
        accentColor: '#D6A420'
    },
    {
        id: 10,
        title: 'Arhatic Yoga Practice Sessions',
        category: 'group5',
        level: 'Ongoing Practice',
        badge: 'Arhatic Yoga',
        image: getImageUrl('09_arhatic_yoga_practice_sessions.png'),
        description: 'Regular group sittings for initiated practitioners at Preparatory and higher levels. A structured, safe, and supported environment for deepening practice under the lineage of GMCKS.',
        eligibility: 'Arhatic Yoga Preparatory',
        accentColor: '#D6A420'
    },
    
    {
        id: 11,
        title: 'Meditation on Twin Hearts',
        category: 'group6',
        level: 'Training & Practice Sessions',
        badge: 'Spiritual Courses',
        image: getImageUrl('11_meditation_on_twin_hearts.png'),
        description: 'Introductory training and regular open group practice sittings. Activates the heart and crown chakras simultaneously — a meditation for personal illumination and world peace. Open to all.',
        eligibility: 'open for all',
        accentColor: '#C25E29'
    },
    {
        id: 12,
        title: 'Kriyashakti® · Pranic Feng Shui® · Spiritual Business Management',
        category: 'group6',
        level: 'Practice Sessions for Graduates',
        badge: 'Spiritual Courses',
        image: getImageUrl('12_kriyashakti.png'),
        description: 'Practice sessions for graduates of these GMCKS courses (conducted at other authorised centres). We provide a supported community environment for ongoing practice. Contact us for schedule and eligibility.',
        eligibility: 'Kriyashakti® / Pranic Feng Shui®/ Spiritual Business Management',
        accentColor: '#C25E29'
    }
];

export const CATEGORIES = [
    { id: 'all', label: 'All Courses' },
    { id: 'group1', label: 'Basic Pranic Healing' },
    { id: 'group2', label: 'Advanced' },
    { id: 'group3', label: 'Psychotherapy' },
    { id: 'group4', label: 'Practitioner Level' },
    { id: 'group5', label: 'Arhatic Yoga' },
    { id: 'group6', label: 'Spiritual Courses' }
];
