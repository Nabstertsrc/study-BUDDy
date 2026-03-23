import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';

const FloatingIcons = () => {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [lotties, setLotties] = useState({});

    // Fetch robust Lottie files for Education symbols
    useEffect(() => {
        const fetchLotties = async () => {
            const urls = {
                books: 'https://assets5.lottiefiles.com/packages/lf20_1a8xwmb3.json',        // Books/Grad cap
                microscope: 'https://assets1.lottiefiles.com/private_files/lf30_p3pqps.json',  // Education/tools
                physics: 'https://assets6.lottiefiles.com/packages/lf20_t2baxk5x.json',        // Atom/Science
                pencil: 'https://assets3.lottiefiles.com/packages/lf20_4kji20y9.json',        // Pencil
                chemistry: 'https://assets2.lottiefiles.com/private_files/lf30_ghysqui3.json' // Flask
            };

            const data = {};
            for (const [key, url] of Object.entries(urls)) {
                try {
                    const res = await fetch(url);
                    data[key] = await res.json();
                } catch (e) {
                    // Ignore fetching errors
                }
            }
            setLotties(data);
        };
        fetchLotties();

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
        { key: 'books', size: 180, top: '5%', left: '8%', speed: 1.2 },
        { key: 'physics', size: 240, top: '15%', right: '8%', speed: -1.5 },
        { key: 'pencil', size: 150, bottom: '25%', left: '10%', speed: 0.8 },
        { key: 'microscope', size: 160, bottom: '15%', right: '12%', speed: -1.1 },
        { key: 'chemistry', size: 190, top: '45%', left: '48%', speed: 1.4 }
    ];

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-blue-50/50">
            {items.map((item, index) => (
                <div
                    key={index}
                    className="absolute transition-transform duration-300 ease-out opacity-40 mix-blend-multiply"
                    style={{
                        top: item.top,
                        left: item.left,
                        right: item.right,
                        bottom: item.bottom,
                        width: item.size,
                        height: item.size,
                        transform: `translate(${mousePos.x * 30 * item.speed}px, ${mousePos.y * 30 * item.speed}px)`
                    }}
                >
                    {lotties[item.key] && (
                        <Lottie animationData={lotties[item.key]} loop={true} style={{ width: '100%', height: '100%' }} />
                    )}
                </div>
            ))}
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />
        </div>
    );
};

export default FloatingIcons;
