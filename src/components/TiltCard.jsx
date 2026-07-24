import { useRef } from 'react';

export default function TiltCard({ children, className = '', ...props }) {
    const cardRef = useRef(null);

    const handleMouseMove = (e) => {
        const card = cardRef.current;
        if (!card) return;

        const rect = card.getBoundingClientRect();
        
        // Mouse coordinate mapping (normalized -0.5 to 0.5)
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        
        // Max tilt degree limit
        const maxTilt = 15;
        const tiltX = -y * maxTilt;
        const tiltY = x * maxTilt;

        card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(12px)`;
        card.style.transition = 'transform 0.05s ease';
    };

    const handleMouseLeave = () => {
        const card = cardRef.current;
        if (!card) return;

        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)';
        card.style.transition = 'transform 0.4s ease';
    };

    return (
        <div 
            ref={cardRef} 
            className={`tilt-element ${className}`} 
            onMouseMove={handleMouseMove} 
            onMouseLeave={handleMouseLeave}
            style={{ transformStyle: 'preserve-3d' }}
            {...props}
        >
            {children}
        </div>
    );
}
