const getImageUrl = (name) => {
    return new URL(`../assets/images/${name}`, import.meta.url).href;
};

export const SOLUTIONS_DATA = {
    'stress': {
        id: 'stress',
        title: 'Stress Management & Mental Relief',
        subtitle: 'TRANSFORM DISSATISFACTION INTO PEACE',
        description: 'Scientific studies show that Sudarshan Breath Wisdom reduces cortisol (the stress hormone) by up to 56.6% from the very first session.',
        details: 'Chronic stress triggers high levels of cortisol, which damages our immune system, cognitive function, and emotional resilience. Excel Energy offers tailored breathing techniques combined with Sri Sri Yoga sequences to trigger the parasympathetic nervous system, inducing cellular recovery and mental silence from the very first session.',
        imageName: 'sol_stress.jpg',
        programs: ['yoga_happiness', 'yoga_pranic', 'yoga_retreats'],
        gallery: [
            { id: 101, image: getImageUrl('forest_meditation.jpg'), title: 'Nature Meditation Sanctuary', category: 'nature' },
            { id: 102, image: getImageUrl('pranic_healing_left.png'), title: 'Self-Healing in Forest', category: 'pranic-healing' },
            { id: 103, image: getImageUrl('pranic_healing_right.png'), title: 'Energy Transmission in Nature', category: 'energy' }
        ]
    },
    'mental-health': {
        id: 'mental-health',
        title: 'Nurture Your Mental Well-being',
        subtitle: 'EMOTIONAL BALANCE & ANXIETY RELIEF',
        description: 'Achieve emotional balance, lower baseline anxiety, and rebuild mental clarity through daily rhythm-breathing.',
        details: 'Our mental health solution utilizes energetic cleansing and rhythmic breathwork to quiet the analytical mind and release heavy emotional states. Strengthening neural pathways associated with mindfulness helps rebuild resilient responses to emotional trauma, anxiety, and daily triggers.',
        imageName: 'sol_mental_health.jpg',
        programs: ['yoga_happiness', 'yoga_pranic', 'yoga_retreats'],
        gallery: [
            { id: 201, image: getImageUrl('forest_meditation.jpg'), title: 'Nature Meditation Sanctuary', category: 'nature' },
            { id: 202, image: getImageUrl('pranic_healing_left.png'), title: 'Self-Healing in Forest', category: 'pranic-healing' },
            { id: 203, image: getImageUrl('pranic_healing_right.png'), title: 'Energy Transmission in Nature', category: 'energy' }
        ]
    },
    'depression': {
        id: 'depression',
        title: 'Elevate Your Mood & Vitality',
        subtitle: 'EMOTIONAL HEALING & HOPE',
        description: 'Meditation and deep breathwork stimulate the release of endorphins, dopamine, and serotonin to reclaim active energy.',
        details: 'Depression often manifests as a profound block in vital energy (prana). Through cellular cleansing breathwork, we re-energize depleted chakras, clearing heavy feelings and inducing the release of natural mood stabilizers like serotonin. Discover a sense of lightness, clarity, and renewed purpose.',
        imageName: 'sol_depression.jpg',
        programs: ['yoga_happiness', 'yoga_retreats', 'yoga_pranic'],
        gallery: [
            { id: 301, image: getImageUrl('forest_meditation.jpg'), title: 'Nature Meditation Sanctuary', category: 'nature' },
            { id: 302, image: getImageUrl('pranic_healing_left.png'), title: 'Self-Healing in Forest', category: 'pranic-healing' },
            { id: 303, image: getImageUrl('pranic_healing_right.png'), title: 'Energy Transmission in Nature', category: 'energy' }
        ]
    },
    'anger': {
        id: 'anger',
        title: 'Find Calm in High-Pressure Moments',
        subtitle: 'ANGER MANAGEMENT & EMOTIONAL COOLING',
        description: 'Anger triggers the fight-or-flight nervous response. Learn to switch on the parasympathetic nervous system instantly with cooling pranayamas.',
        details: 'Anger creates immediate physical and thermal stress in the cardiovascular system. We teach cooling breathing techniques (pranayamas) and deep heart meditations that expand your capacity to observe rather than react. Transform impulsive fire into constructive focus and deep interpersonal calm.',
        imageName: 'sol_anger.jpg',
        programs: ['yoga_happiness', 'yoga_retreats', 'yoga_pranic'],
        gallery: [
            { id: 401, image: getImageUrl('forest_meditation.jpg'), title: 'Nature Meditation Sanctuary', category: 'nature' },
            { id: 402, image: getImageUrl('pranic_healing_left.png'), title: 'Self-Healing in Forest', category: 'pranic-healing' },
            { id: 403, image: getImageUrl('pranic_healing_right.png'), title: 'Energy Transmission in Nature', category: 'energy' }
        ]
    },
    'sleep': {
        id: 'sleep',
        title: 'Discover Deep, Healing Sleep',
        subtitle: 'INSOMNIA REMEDY & CELLULAR REGENERATION',
        description: 'Insomnia and restless sleep are often triggered by an overactive sympathetic nervous system. Transition into deep delta-wave states.',
        details: 'High mental velocity before bed prevents transition into delta-wave restorative sleep. Rhythmic breathing sequences reset your autonomic nervous system, clearing mental fatigue and preparing your body for optimal circadian rhythm recovery. Discover deep, uninterrupted healing sleep every night.',
        imageName: 'sol_sleep.jpg',
        programs: ['yoga_happiness', 'yoga_retreats', 'yoga_pranic'],
        gallery: [
            { id: 501, image: getImageUrl('forest_meditation.jpg'), title: 'Nature Meditation Sanctuary', category: 'nature' },
            { id: 502, image: getImageUrl('pranic_healing_left.png'), title: 'Self-Healing in Forest', category: 'pranic-healing' },
            { id: 503, image: getImageUrl('pranic_healing_right.png'), title: 'Energy Transmission in Nature', category: 'energy' }
        ]
    },
    'wellness': {
        id: 'wellness',
        title: 'Cultivate Daily Energy & Radiance',
        subtitle: 'HOLISTIC IMMUNITY & RADIANCY',
        description: 'True wellness is a balance of physical health and mental silence. Balance the flow of energy in the nadis (meridians) through breath.',
        details: 'Holistic wellness is achieved when your energy channels (nadis) flow freely and your chakras are fully charged. Utilizing prana scanning, we analyze your bio-field, clear sluggish zones, and teach you daily breath routines that strengthen your baseline cellular immunity, stamina, and natural physical radiance.',
        imageName: 'sol_wellness.jpg',
        programs: ['yoga_daily_online', 'yoga_teacher', 'yoga_corporate'],
        gallery: [
            { id: 601, image: getImageUrl('forest_meditation.jpg'), title: 'Nature Meditation Sanctuary', category: 'nature' },
            { id: 602, image: getImageUrl('pranic_healing_left.png'), title: 'Self-Healing in Forest', category: 'pranic-healing' },
            { id: 603, image: getImageUrl('pranic_healing_right.png'), title: 'Energy Transmission in Nature', category: 'energy' }
        ]
    },
    'relationships': {
        id: 'relationships',
        title: 'Nurture Harmonious Connections',
        subtitle: 'EMPATHY, CLARITY & RESOLUTION',
        description: 'When you are stress-free and centered, you communicate with empathy and clarity. Fosters emotional intelligence.',
        details: 'Conflict in relationships is often amplified by projecting stress onto others. By clearing your emotional field through meditation, you develop emotional resilience and empathy. Learn to respond rather than react, establishing deep, caring, and harmonious connections with family and colleagues.',
        imageName: 'sol_relationships.jpg',
        programs: ['yoga_happiness', 'yoga_corporate', 'yoga_retreats'],
        gallery: [
            { id: 701, image: getImageUrl('forest_meditation.jpg'), title: 'Nature Meditation Sanctuary', category: 'nature' },
            { id: 702, image: getImageUrl('pranic_healing_left.png'), title: 'Self-Healing in Forest', category: 'pranic-healing' },
            { id: 703, image: getImageUrl('pranic_healing_right.png'), title: 'Energy Transmission in Nature', category: 'energy' }
        ]
    },
    'parenting': {
        id: 'parenting',
        title: 'Lead with Compassion and Calm',
        subtitle: 'CONSCIOUS PARENTING & YOUTH GUIDANCE',
        description: 'Create a supportive, peaceful home environment. Learn tools that reduce parental fatigue and increase your daily patience.',
        details: 'Children sense and absorb parental stress. Conscious parenting requires a calm mind and an open heart. We teach simple breathing practices to relieve parental burnout, alongside special intuitive yoga programs designed to nurture focus, intuition, and mental clarity in kids and teens.',
        imageName: 'sol_parenting.jpg',
        programs: ['yoga_children_teens', 'yoga_happiness', 'yoga_retreats'],
        gallery: [
            { id: 801, image: getImageUrl('forest_meditation.jpg'), title: 'Nature Meditation Sanctuary', category: 'nature' },
            { id: 802, image: getImageUrl('pranic_healing_left.png'), title: 'Self-Healing in Forest', category: 'pranic-healing' },
            { id: 803, image: getImageUrl('pranic_healing_right.png'), title: 'Energy Transmission in Nature', category: 'energy' }
        ]
    },
    'back-pain': {
        id: 'back-pain',
        title: 'Relief from Chronic Back Pain',
        subtitle: 'RESTORE SPINE HEALTH & VITALITY',
        description: 'Relieve spinal pressure, improve posture, and alleviate back pain through target-cleansing and spinal healing.',
        details: 'Back pain is often caused by muscle tension, poor posture, or blocks in the base and sex chakras. Our back pain solutions combine gentle pranic cleansing of the spine and core, along with low-impact yoga stretches that reinforce spinal flexibility and core stability, promoting long-term spinal rejuvenation.',
        imageName: 'sol_back_pain.png',
        programs: ['yoga_happiness', 'yoga_daily_online', 'yoga_teacher'],
        gallery: [
            { id: 901, image: getImageUrl('forest_meditation.jpg'), title: 'Nature Meditation Sanctuary', category: 'nature' },
            { id: 902, image: getImageUrl('pranic_healing_left.png'), title: 'Self-Healing in Forest', category: 'pranic-healing' },
            { id: 903, image: getImageUrl('pranic_healing_right.png'), title: 'Energy Transmission in Nature', category: 'energy' }
        ]
    },
    'headache': {
        id: 'headache',
        title: 'Calm and Soothe Headaches',
        subtitle: 'REDUCE TENSION & HEADACHE RELIEF',
        description: 'Quiet an overactive nervous system, cool brain blood-flow, and clear cognitive fatigue.',
        details: 'Headaches and migraines are frequently linked to stress, vascular tension, or over-stimulated ajna and forehead chakras. We focus on relaxing cranial tension through cooling breathing techniques (pranayamas) and guided meditations that ease vascular dilation and reduce mental velocity.',
        imageName: 'sol_headache.png',
        programs: ['yoga_happiness', 'yoga_daily_online'],
        gallery: [
            { id: 1001, image: getImageUrl('forest_meditation.jpg'), title: 'Nature Meditation Sanctuary', category: 'nature' },
            { id: 1002, image: getImageUrl('pranic_healing_left.png'), title: 'Self-Healing in Forest', category: 'pranic-healing' },
            { id: 1003, image: getImageUrl('pranic_healing_right.png'), title: 'Energy Transmission in Nature', category: 'energy' }
        ]
    },
    'addiction': {
        id: 'addiction',
        title: 'Break Free from Addiction',
        subtitle: 'RECLAIM AUTONOMY & WILLPOWER',
        description: 'Strengthen inner willpower, detoxify the energy body, and build positive habits through Sudarshan Kriya.',
        details: 'Addiction roots itself in chemical imbalances and weak chakra boundaries, particularly in the solar plexus. Sudarshan Kriya and pranic cleansing clear accumulated energetic toxicity and rebuild core willpower. This establishes solid foundations for emotional self-reliance and healthy daily routines.',
        imageName: 'sol_addiction.png',
        programs: ['yoga_happiness', 'yoga_retreats'],
        gallery: [
            { id: 1101, image: getImageUrl('forest_meditation.jpg'), title: 'Nature Meditation Sanctuary', category: 'nature' },
            { id: 1102, image: getImageUrl('pranic_healing_left.png'), title: 'Self-Healing in Forest', category: 'pranic-healing' },
            { id: 1103, image: getImageUrl('pranic_healing_right.png'), title: 'Energy Transmission in Nature', category: 'energy' }
        ]
    },
    'exam-tension': {
        id: 'exam-tension',
        title: 'Overcome Exam Stress & Boost Focus',
        subtitle: 'FOCUS, MEMORY & EXAM CALM',
        description: 'Relieve student burnout, reduce pre-exam performance anxiety, and enhance cognitive memory.',
        details: 'Exam tension causes hyperactive mental loops that impair memory recall and concentration. By combining specific pranayama patterns to calm the mind and brain-wave balancing techniques, students learn to alleviate cognitive fatigue, boost concentration, and enter a state of high-focus confidence.',
        imageName: 'sol_exam_tension.png',
        programs: ['yoga_children_teens', 'yoga_happiness'],
        gallery: [
            { id: 1201, image: getImageUrl('forest_meditation.jpg'), title: 'Nature Meditation Sanctuary', category: 'nature' },
            { id: 1202, image: getImageUrl('pranic_healing_left.png'), title: 'Self-Healing in Forest', category: 'pranic-healing' },
            { id: 1203, image: getImageUrl('pranic_healing_right.png'), title: 'Energy Transmission in Nature', category: 'energy' }
        ]
    }
};
