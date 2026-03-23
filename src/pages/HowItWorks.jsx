import React from 'react';
import { BookOpen, BrainCircuit, CreditCard, LayoutDashboard, Settings as SettingsIcon, ShieldCheck, Target, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function HowItWorks() {
    const features = [
        {
            title: "AI Study Lab & OCR",
            icon: <BrainCircuit className="w-8 h-8 text-blue-500" />,
            description: "Upload your PDFs or images (using OCR). Our AI extracts information, generates quizzes, and creates intelligent summaries instantly."
        },
        {
            title: "Interactive Dashboard",
            icon: <LayoutDashboard className="w-8 h-8 text-indigo-500" />,
            description: "A centralized hub to track your learning progress, upcoming assignments, and overall study metrics all at a glance."
        },
        {
            title: "Learning Paths",
            icon: <Target className="w-8 h-8 text-emerald-500" />,
            description: "Generates step-by-step personalized learning paths for you based on your uploaded curriculum or goals."
        },
        {
            title: "Credits System (Pay As You Go)",
            icon: <CreditCard className="w-8 h-8 text-amber-500" />,
            description: "Advanced AI generation costs credits. Manage your free tier or purchase additional credit bundles whenever you need them via PayPal or Yoco."
        },
        {
            title: "Prescribed Books Library",
            icon: <BookOpen className="w-8 h-8 text-violet-500" />,
            description: "Access a library of textbooks securely stored. Read, highlight, and let the AI analyze chapters for you."
        },
        {
            title: "Secure Account & Settings",
            icon: <ShieldCheck className="w-8 h-8 text-slate-700" />,
            description: "Your data is secured with Firebase Auth. Customize notifications, profile details, and app behavior in your settings panel."
        }
    ];

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-12 animate-in fade-in duration-500">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">How Study Buddy Works</h1>
                <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                    Study Buddy leverages state-of-the-art AI to transform your static study materials into interactive, adaptive learning experiences. Here's a breakdown of the core features.
                </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, idx) => (
                    <Card key={idx} className="border-slate-100 shadow-md hover:shadow-xl transition-shadow bg-white rounded-2xl">
                        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                            <div className="p-3 bg-slate-50 rounded-xl">
                                {feature.icon}
                            </div>
                            <CardTitle className="text-xl font-bold">{feature.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-600 leading-relaxed">
                                {feature.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-3xl p-8 text-center flex flex-col items-center">
                <Zap className="w-12 h-12 text-blue-500 mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Ready to Supercharge Your Learning?</h2>
                <p className="text-slate-600 max-w-lg mb-6">
                    Start utilizing these features right from your dashboard. Most features are automated to help you focus entirely on learning rather than organizing.
                </p>
            </div>
        </div>
    );
}
