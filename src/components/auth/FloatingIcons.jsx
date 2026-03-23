import React, { useEffect, useState } from 'react';
import { BookOpen, Microscope, Calculator, Pencil, Beaker } from 'lucide-react';
import { motion } from 'framer-motion';

const FloatingIcons = () => {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePos({
                x: (e.clientX / window.innerWidth) * 2 - 1,
                y: (e.clientY / window.innerHeight) * 2 - 1
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const items = [
        { Icon: BookOpen, color: 'text-blue-400', size: 100, top: '5%', left: '8%', speed: 1.2, delay: 0 },
        { Icon: Microscope, color: 'text-indigo-400', size: 120, top: '15%', right: '8%', speed: -1.5, delay: 0.2 },
        { Icon: Pencil, color: 'text-amber-400', size: 80, bottom: '25%', left: '10%', speed: 0.8, delay: 0.4 },
        { Icon: Calculator, color: 'text-emerald-400', size: 90, bottom: '15%', right: '12%', speed: -1.1, delay: 0.1 },
        { Icon: Beaker, color: 'text-rose-400', size: 110, top: '45%', left: '48%', speed: 1.4, delay: 0.3 }
    ];

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-blue-50/30">
            {items.map((item, index) => (
                <motion.div
                    key={index}
                    initial={{ y: 0, opacity: 0 }}
                    animate={{
                        y: [0, -20, 0],
                        opacity: 0.15,
                        rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: item.delay
                    }}
                    className={`absolute transition-transform duration-300 ease-out ${item.color}`}
                    style={{
                        top: item.top,
                        left: item.left,
                        right: item.right,
                        bottom: item.bottom,
                        transform: `translate(${mousePos.x * 30 * item.speed}px, ${mousePos.y * 30 * item.speed}px)`
                    }}
                >
                    <item.Icon size={item.size} strokeWidth={1.5} />
                </motion.div>
            ))}
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />
        </div>
    );
};

export default FloatingIcons;
