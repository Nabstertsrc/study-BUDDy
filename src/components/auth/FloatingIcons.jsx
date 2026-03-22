import React, { useEffect, useState } from 'react';
import { Book, GraduationCap, Calculator, Microscope, Edit3 } from 'lucide-react';

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

    const icons = [
        { Icon: Book, color: 'text-blue-200', size: 48, top: '10%', left: '10%', speed: 1 },
        { Icon: GraduationCap, color: 'text-violet-200', size: 60, top: '20%', right: '15%', speed: -1.5 },
        { Icon: Calculator, color: 'text-indigo-200', size: 40, bottom: '20%', left: '15%', speed: 1.2 },
        { Icon: Microscope, color: 'text-sky-200', size: 55, bottom: '10%', right: '10%', speed: -1 },
        { Icon: Edit3, color: 'text-slate-200', size: 35, top: '50%', left: '50%', speed: 2 }
    ];

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
            {icons.map((item, index) => (
                <div
                    key={index}
                    className={`absolute transition-transform duration-100 ease-out opacity-40 ${item.color}`}
                    style={{
                        top: item.top,
                        left: item.left,
                        right: item.right,
                        bottom: item.bottom,
                        transform: `translate(${mousePos.x * 20 * item.speed}px, ${mousePos.y * 20 * item.speed}px)`
                    }}
                >
                    <item.Icon size={item.size} />
                </div>
            ))}
            <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-[1px]" />
        </div>
    );
};

export default FloatingIcons;
