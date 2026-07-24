const getImageUrl = (name) => {
    return new URL(`../assets/images/${name}`, import.meta.url).href;
};

export const PROGRAMS_DATA = [
    {
        id: 'yoga_daily_online',
        category: 'yoga',
        title: 'Daily Yoga',
        fullTitle: 'Daily Yoga Sessions',
        icon: (
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="6" r="2" />
                <path d="M12 8c-2.2 0-4 1.8-4 4v5h2v-4h4v4h2v-5c0-2.2-1.8-4-4-4z" />
                <path d="M5 12h14" />
            </svg>
        ),
        color: '#083226',
        bgColor: '#e6edea',
        summary: 'Maintain consistency with guided daily sessions.',
        details: 'Experience the power of daily guided yoga sessions from the comfort of your home. These sessions include gentle stretches, deep pranayamas, and relaxing meditations led by certified Sri Sri Yoga experts to energize your body and calm your mind.',
        duration: 'Daily | 1 Hour Sessions',
        audience: 'Anyone looking to maintain a consistent daily yoga and breathing practice.',
        desc: 'Experience the power of daily guided yoga sessions from the comfort of your home.',
        image: getImageUrl('forest_meditation.jpg')
    },
    {
        id: 'yoga_happiness',
        category: 'yoga',
        title: 'Happiness Program (Beginner)',
        fullTitle: 'Art of Living Happiness Program (Beginner)',
        icon: (
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
        ),
        color: '#2E5B88',
        bgColor: '#e9f0f6',
        summary: 'Discover physical vitality and mental peace.',
        details: 'Learn the cornerstone breathing technique: Sudarshan Kriya™. Experience deep cellular rest, reduce stress levels, improve sleep quality, and boost mental clarity through a structured 3-day guided workshop.',
        duration: '3 Days | 2.5 Hours Daily',
        audience: 'Beginners looking for a highly effective daily meditation and breathing practice.',
        desc: 'Learn the cornerstone breathing technique: Sudarshan Kriya™.',
        image: getImageUrl('happiness_program.png')
    },
    {
        id: 'yoga_children_teens',
        category: 'yoga',
        title: 'Children and Teens',
        fullTitle: 'Art of Living Intuition & Yoga Process for Kids',
        icon: (
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        ),
        color: '#E0702B',
        bgColor: '#faf0e8',
        summary: 'Unlock focus, memory, and intuition in kids.',
        details: 'A program designed for children and young adults to develop focus, memory, and intuition. Through simple exercises and guided meditations, kids learn to tap into their inner wisdom and build confidence.',
        duration: '2 Days | 2 Hours Daily',
        audience: 'Children and teenagers aged 8-18 seeking better concentration and creativity.',
        desc: 'A program designed for children and young adults to develop focus, memory, and intuition.',
        image: getImageUrl('children_teens.png')
    },
    {
        id: 'yoga_teacher',
        category: 'yoga',
        title: 'Yoga Teacher Training',
        fullTitle: 'Sri Sri School of Yoga Teacher Training',
        icon: (
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <circle cx="12" cy="10" r="3" />
            </svg>
        ),
        color: '#083226',
        bgColor: '#e6edea',
        summary: 'Become a certified, globally recognized Yoga Teacher.',
        details: 'Become a certified, globally recognized Yoga Teacher. A rigorous certification program covering anatomy, physiology, yoga philosophy, teaching methodology, and advanced practice.',
        duration: '200-Hour / 300-Hour Certification',
        audience: 'Passionate practitioners wanting to deepen their practice or teach professionally.',
        desc: 'Become a certified, globally recognized Yoga Teacher.',
        image: getImageUrl('story_community.png')
    },
    {
        id: 'yoga_corporate',
        category: 'yoga',
        title: 'Corporate Programs',
        fullTitle: 'Corporate Yoga & Wellness Programs',
        icon: (
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
        ),
        color: '#6D3D7E',
        bgColor: '#f3eaf5',
        summary: 'Workplace wellness, posture, and productivity.',
        details: 'Tailored corporate wellness sessions designed to reduce workplace stress, boost employee energy, improve posture, and enhance productivity through desk-friendly yoga postures, breathing exercises, and meditation.',
        duration: 'Customizable Sessions',
        audience: 'Organizations and corporate teams aiming to improve employee health and focus.',
        desc: 'Tailored corporate wellness sessions designed to reduce workplace stress.',
        image: getImageUrl('corporate_programs.png')
    },
    {
        id: 'yoga_retreats',
        category: 'yoga',
        title: 'Yoga Retreats',
        fullTitle: 'Sri Sri Yoga & Meditation Retreats',
        icon: (
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 22h20L12 2z" />
                <path d="M12 10l-4 8h8l-4-8z" />
            </svg>
        ),
        color: '#D6A420',
        bgColor: '#fdf7e7',
        summary: 'Rejuvenate with deep relaxation and meditation.',
        details: 'Immerse yourself in a rejuvenating environment away from the hustle of daily life. Enjoy daily yoga, meditation, organic meals, and nature walks designed to detoxify and restore your body and mind.',
        duration: '3-5 Days Residential',
        audience: 'Individuals and groups looking for a deep relaxation and mindfulness experience.',
        desc: 'Immerse yourself in a rejuvenating environment away from the hustle of daily life.',
        image: getImageUrl('man_meditation.png')
    },
    {
        id: 'yoga_pranic',
        category: 'yoga',
        title: 'Pranic Yoga',
        fullTitle: 'Pranic Yoga & Energy Revitalization',
        icon: (
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                <path d="M2 12h20" />
            </svg>
        ),
        color: '#E0702B',
        bgColor: '#faf0e8',
        summary: 'Harness life-force energy for deep physical and mental revitalization.',
        details: 'Pranic Yoga is a specialized practice that integrates pranic breathing techniques with physical postures to clear blockages in the energy channels (nadis). By consciously drawing in vital life-force energy (prana), this practice charges your chakras, accelerates physical healing, reduces chronic fatigue, and elevates mental clarity.',
        duration: 'Weekly | 1.5 Hour Sessions',
        audience: 'Anyone looking to boost their vital energy, strengthen their aura, and release physical and emotional blocks.',
        desc: 'Harness life-force energy for deep physical and mental revitalization.',
        image: getImageUrl('pranic_healing_right.png')
    }
];
