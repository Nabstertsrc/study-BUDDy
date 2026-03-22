import React, { useState } from "react";
import {
    Zap,
    Brain,
    Rocket,
    ShieldCheck,
    ChevronRight,
    CheckCircle,
    Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OnboardingModal({ onComplete }) {
    const [step, setStep] = useState(1);

    const steps = [
        {
            title: "Welcome to Study Buddy AI",
            description: "Your ultimate AI companion for academic excellence. Let's show you how to get the most out of it.",
            icon: Rocket,
            color: "bg-blue-600",
            image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop"
        },
        {
            title: "Powerful AI Study Tools",
            description: "Upload your PDFs and generate instant summaries, custom quizzes, and deep-dive explanations tailored to your syllabus.",
            icon: Brain,
            color: "bg-purple-600",
            image: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=1974&auto=format&fit=crop"
        },
        {
            title: "Simple, Fair Pricing",
            description: "We use a credit-based system. Every time the AI answers a question or analyzes a file, it uses 1 credit.",
            icon: Zap,
            color: "bg-amber-500",
            customContent: (
                <div className="grid grid-cols-1 gap-3 mt-4">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">10</div>
                        <div>
                            <p className="text-sm font-bold text-slate-900">Free Credits</p>
                            <p className="text-xs text-slate-500">Every single month. Resets on database reset for web.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">$5</div>
                        <div>
                            <p className="text-sm font-bold text-slate-900">50 Credits Bundle</p>
                            <p className="text-xs text-slate-500">Perfect for single subject prep.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                        <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">$15</div>
                        <div>
                            <p className="text-sm font-bold text-slate-900">150 Credits Bundle</p>
                            <p className="text-xs text-slate-500">Full power for the whole semester.</p>
                        </div>
                    </div>
                </div>
            )
        }
    ];

    const currentStep = steps[step - 1];

    const handleNext = () => {
        if (step < steps.length) {
            setStep(step + 1);
        } else {
            localStorage.setItem('has_seen_onboarding_v2', 'true');
            onComplete();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in duration-500">
                {/* Left Side: Visual */}
                <div className="md:w-5/12 relative h-48 md:h-auto">
                    {currentStep.image ? (
                        <img
                            src={currentStep.image}
                            className="absolute inset-0 w-full h-full object-cover"
                            alt="Onboarding"
                        />
                    ) : (
                        <div className={`absolute inset-0 ${currentStep.color} flex items-center justify-center`}>
                            <currentStep.icon className="w-24 h-24 text-white/20" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/60 to-transparent flex flex-col justify-end p-8 text-white">
                        <div className={`w-12 h-12 rounded-2xl ${currentStep.color} flex items-center justify-center shadow-lg border border-white/20 mb-4`}>
                            <currentStep.icon className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-bold tracking-widest uppercase opacity-70">Step {step} of 3</p>
                    </div>
                </div>

                {/* Right Side: Content */}
                <div className="md:w-7/12 p-8 md:p-12 flex flex-col justify-between">
                    <div className="space-y-4">
                        <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                            {currentStep.title}
                        </h2>
                        <p className="text-slate-500 leading-relaxed">
                            {currentStep.description}
                        </p>

                        {currentStep.customContent}
                    </div>

                    <div className="mt-12 flex items-center justify-between">
                        <div className="flex gap-1.5">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${step === i ? "w-8 bg-blue-600" : "w-1.5 bg-slate-200"}`} />
                            ))}
                        </div>

                        <Button
                            onClick={handleNext}
                            className="rounded-2xl px-8 py-6 bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/20 text-lg font-bold group"
                        >
                            {step === steps.length ? "Get Started" : "Continue"}
                            <ChevronRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
