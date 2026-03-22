import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Brain, Zap, Search } from 'lucide-react';

const AILoadingState = ({ title = "AI is thinking...", message = "Processing your request with neural precision" }) => {
    return (
        <div className="flex flex-col items-center justify-center p-12 min-h-[400px] text-center space-y-8 bg-white/40 backdrop-blur-xl rounded-[3rem] border-2 border-white/60 shadow-3xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5" />

            {/* Animated Orbs */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3],
                    x: [0, 20, 0],
                    y: [0, -20, 0]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-10 left-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"
            />
            <motion.div
                animate={{
                    scale: [1.2, 1, 1.2],
                    opacity: [0.3, 0.6, 0.3],
                    x: [0, -20, 0],
                    y: [0, 20, 0]
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-10 right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"
            />

            <div className="relative">
                <div className="w-24 h-24 rounded-3xl bg-slate-900 flex items-center justify-center shadow-2xl relative z-10">
                    <motion.div
                        animate={{
                            rotate: 360,
                            scale: [1, 1.1, 1]
                        }}
                        transition={{
                            rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                        }}
                    >
                        <Brain className="w-12 h-12 text-indigo-400" />
                    </motion.div>

                    {/* Pulsing rings */}
                    <motion.div
                        animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 rounded-3xl border-2 border-indigo-500/50"
                    />
                    <motion.div
                        animate={{ scale: [1, 1.8], opacity: [0.3, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                        className="absolute inset-0 rounded-3xl border-2 border-purple-500/30"
                    />
                </div>

                <motion.div
                    animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5], rotate: [0, 90, 180] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute -top-4 -right-4 p-2 rounded-xl bg-white shadow-lg text-amber-500"
                >
                    <Sparkles className="w-4 h-4" />
                </motion.div>
            </div>

            <div className="relative z-10 space-y-4 max-w-sm">
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
                    {title}
                </h3>
                <p className="text-slate-500 font-bold leading-relaxed">
                    {message}
                </p>
            </div>

            <div className="relative z-10 flex gap-4 pt-4">
                {[Zap, Search, Brain].map((Icon, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            y: [0, -10, 0],
                            opacity: [0.4, 1, 0.4]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.4
                        }}
                        className="p-3 rounded-2xl bg-white/50 border border-white shadow-sm"
                    >
                        <Icon className="w-5 h-5 text-indigo-600" />
                    </motion.div>
                ))}
            </div>

            {/* Progress Line */}
            <div className="absolute bottom-0 left-0 w-full h-1.5 bg-slate-100 overflow-hidden">
                <motion.div
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="w-1/2 h-full bg-gradient-to-r from-transparent via-indigo-600 to-transparent shadow-[0_0_15px_rgba(79,70,229,0.5)]"
                />
            </div>
        </div>
    );
};

export default AILoadingState;
