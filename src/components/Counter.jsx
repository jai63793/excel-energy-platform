import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger to prevent warnings
gsap.registerPlugin(ScrollTrigger);

export default function Counter({ target, format, plus = true }) {
    const counterRef = useRef(null);
    const [displayVal, setDisplayVal] = useState('0');

    useEffect(() => {
        const element = counterRef.current;
        if (!element) return;

        const countObj = { val: 0 };

        const trigger = ScrollTrigger.create({
            trigger: element,
            start: 'top 85%',
            onEnter: () => {
                gsap.to(countObj, {
                    val: target,
                    duration: 2.5,
                    ease: 'power2.out',
                    onUpdate: () => {
                        if (format === 'M') {
                            setDisplayVal((countObj.val / 1000000).toFixed(1) + 'M');
                        } else if (format === 'K') {
                            setDisplayVal(Math.floor(countObj.val / 1000) + 'K');
                        } else {
                            setDisplayVal(Math.floor(countObj.val).toLocaleString());
                        }
                    }
                });
            },
            once: true
        });

        return () => {
            if (trigger) trigger.kill();
        };
    }, [target, format]);

    return (
        <span ref={counterRef}>
            {displayVal}
            {plus && <span className="impact-plus">+</span>}
        </span>
    );
}
