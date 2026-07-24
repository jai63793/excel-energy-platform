import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './SharedComponents.css';

// Ensure ScrollTrigger is registered
gsap.registerPlugin(ScrollTrigger);

export default function SharedAbout({
    title,
    tagline = "ABOUT US",
    desc,
    points = [],
    quote = "",
    imageSrc,
    isLightBg = false,
    imageLeft = false
}) {
    const sectionRef = useRef(null);
    const textColRef = useRef(null);
    const imgColRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Text elements reveal stagger
            if (textColRef.current) {
                gsap.fromTo(textColRef.current.children, 
                    { opacity: 0, y: 30 },
                    {
                        scrollTrigger: {
                            trigger: sectionRef.current,
                            start: 'top 75%',
                            toggleActions: 'play none none none'
                        },
                        opacity: 1,
                        y: 0,
                        duration: 0.8,
                        stagger: 0.12,
                        ease: 'power3.out'
                    }
                );
            }

            // Image container spring reveal
            if (imgColRef.current) {
                gsap.fromTo(imgColRef.current, 
                    { opacity: 0, scale: 0.92, y: 40 },
                    {
                        scrollTrigger: {
                            trigger: sectionRef.current,
                            start: 'top 75%',
                            toggleActions: 'play none none none'
                        },
                        opacity: 1,
                        scale: 1,
                        y: 0,
                        duration: 1,
                        ease: 'back.out(1.15)'
                    }
                );
            }
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} className={`shared-about-section ${isLightBg ? 'light-bg' : ''}`}>
            <div className={`shared-about-container ${imageLeft ? 'image-left' : 'image-right'}`}>
                {/* Visual Column on left if imageLeft is true */}
                {imageLeft && (
                    <div ref={imgColRef} className="shared-about-img-col">
                        <div className="shared-about-img-wrapper">
                            <img src={imageSrc} alt={title} className="shared-about-img" />
                        </div>
                    </div>
                )}

                {/* Text Column */}
                <div ref={textColRef} className="shared-about-text-col">
                    <span className="section-tagline">{tagline}</span>
                    <h2 className="section-title">{title}</h2>
                    <p className="shared-about-desc">{desc}</p>
                    
                    {quote && (
                        <blockquote className="shared-about-quote">
                            "{quote}"
                        </blockquote>
                    )}

                    {points && points.length > 0 && (
                        <ul className="shared-about-points">
                            {points.map((pt, idx) => (
                                <li key={idx} className="shared-about-point-item">
                                    <span className="shared-about-check-icon">✓</span>
                                    <span>{pt}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Visual Column on right if imageLeft is false */}
                {!imageLeft && (
                    <div ref={imgColRef} className="shared-about-img-col">
                        <div className="shared-about-img-wrapper">
                            <img src={imageSrc} alt={title} className="shared-about-img" />
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
