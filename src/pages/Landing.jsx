import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  Moon,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react';
import logo from '@/assets/logo.png';

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Ask or upload',
    body: 'Paste a question, snap homework, or drop a PDF. Study Buddy meets you where the stuck point is.',
  },
  {
    step: '2',
    title: 'Learn the method',
    body: 'Get clear, step-by-step guidance that explains the why — not just a final answer to copy.',
  },
  {
    step: '3',
    title: 'Practice & track',
    body: 'Quizzes, summaries, and progress tools help you lock in concepts for exams and late-night cram sessions.',
  },
];

const WHO_ITS_FOR = [
  {
    icon: GraduationCap,
    title: 'Students',
    body: 'After-school help, weekend catch-up, and exam season when textbooks alone aren’t enough.',
  },
  {
    icon: Users,
    title: 'Parents',
    body: 'A calmer way to support homework nights — method-first help you can trust more than a random chat tab.',
  },
  {
    icon: Moon,
    title: 'Night owls & crunch time',
    body: 'Built for the hours when tutors aren’t awake and deadlines are real.',
  },
];

const WHY_NOT_CHATBOT = [
  'Focused on homework and study workflows — not open-ended chat distractions.',
  'Step-by-step teaching so you understand the method, not only the answer.',
  'Tools for quizzes, summaries, and organizing materials in one place.',
  'Clear product ownership: Nabster Tsr Study Buddy — not a generic chatbot wrapper.',
];

const FAQ = [
  {
    q: 'Is Study Buddy free to start?',
    a: 'Yes. You can get started free. Some advanced AI features may show a short ad — no fake prices here, just try it.',
  },
  {
    q: 'Will it just give me the answer?',
    a: 'Study Buddy is built to teach the method with clear steps so you can solve similar problems yourself.',
  },
  {
    q: 'Is this the same as Profile Genius?',
    a: 'No. This product is Study Buddy — AI homework help by Nabster Tsr. profilegenius.fun is simply the current web host domain.',
  },
  {
    q: 'Where can I read the EULA?',
    a: 'Use the EULA link in the footer anytime. You’ll also be asked to accept it before using the core app for the first time.',
  },
];

function FaqItem({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between gap-3 text-left px-4 py-4 sm:px-5"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="font-semibold text-slate-900 text-sm sm:text-base">{item.q}</span>
        <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 sm:px-5 pb-4 text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-3">
          {item.a}
        </div>
      )}
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();

  const goGetStarted = () => navigate('/Signup');
  const scrollHow = () => {
    const el = document.getElementById('how-it-works');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Top nav */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <img src={logo} alt="Study Buddy" className="h-8 w-auto object-contain" />
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-blue-600 truncate">
              Study Buddy
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              className="hidden sm:inline-flex text-slate-600"
              onClick={() => navigate('/Login')}
            >
              Log in
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg h-9 px-3 sm:px-4"
              onClick={goGetStarted}
            >
              Get started free
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 via-slate-50 to-slate-50 pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-4 pt-10 pb-14 sm:pt-16 sm:pb-20">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100/80 text-blue-700 text-xs font-semibold px-3 py-1 mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            AI homework help · method first
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 leading-[1.15] max-w-3xl">
            Study Buddy — AI homework help that teaches the method, not just the answer.
          </h1>
          <p className="mt-4 sm:mt-5 text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
            Built for students (and parents) who need clear step-by-step help after school, late nights, and exam season.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button
              className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base rounded-xl shadow-sm"
              onClick={goGetStarted}
            >
              Get started free
            </Button>
            <Button
              variant="outline"
              className="h-12 px-6 border-slate-300 bg-white text-slate-800 font-semibold text-base rounded-xl"
              onClick={scrollHow}
            >
              See how it works
            </Button>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            By Nabster Tsr · No account needed to read this page
          </p>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-4 py-12 sm:py-16 scroll-mt-20">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">How it works</h2>
        <p className="text-slate-500 mb-8 max-w-2xl">Three simple steps from stuck to understanding.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {HOW_IT_WORKS.map((item) => (
            <div
              key={item.step}
              className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center mb-3">
                {item.step}
              </div>
              <h3 className="font-bold text-lg mb-2">{item.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Who it's for */}
      <section className="bg-white border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">Who it’s for</h2>
          <p className="text-slate-500 mb-8 max-w-2xl">Real study pressure, not generic AI demos.</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {WHO_ITS_FOR.map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <div className="p-2.5 rounded-xl bg-white border border-slate-100 w-fit mb-3">
                  <item.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why not a random chatbot */}
      <section className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
        <div className="rounded-3xl bg-slate-900 text-slate-100 p-6 sm:p-10">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-blue-400" />
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Why not a random chatbot?</h2>
          </div>
          <p className="text-slate-400 mb-6 max-w-2xl text-sm sm:text-base">
            Chatbots can answer anything. Study Buddy is shaped for learning — clearer steps, study tools, and a product you can come back to.
          </p>
          <ul className="space-y-3">
            {WHY_NOT_CHATBOT.map((line) => (
              <li key={line} className="flex gap-3 text-sm sm:text-base text-slate-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Benefits strip */}
      <section className="max-w-5xl mx-auto px-4 pb-4">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: Brain, title: 'Method-first AI', body: 'Explanations that build understanding.' },
            { icon: BookOpen, title: 'Study workflows', body: 'Quizzes, summaries, and materials in one hub.' },
            { icon: Sparkles, title: 'Start free', body: 'Jump in without a sales pitch wall.' },
          ].map((b) => (
            <div key={b.title} className="flex gap-3 items-start bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
              <b.icon className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <div className="font-bold text-sm">{b.title}</div>
                <div className="text-slate-500 text-sm">{b.body}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-6">FAQ</h2>
        <div className="space-y-3">
          {FAQ.map((item) => (
            <FaqItem key={item.q} item={item} />
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-5xl mx-auto px-4 pb-14">
        <div className="rounded-3xl border border-blue-100 bg-blue-50 p-6 sm:p-10 text-center">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Ready when the homework hits?</h2>
          <p className="text-slate-600 mb-6 max-w-lg mx-auto text-sm sm:text-base">
            Open Study Buddy, accept the license when prompted, and start with free step-by-step help.
          </p>
          <Button
            className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base rounded-xl"
            onClick={goGetStarted}
          >
            Get started free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between text-sm text-slate-500">
          <div>
            <div className="font-bold text-slate-800">Study Buddy</div>
            <div>© {new Date().getFullYear()} Nabster Tsr Study Buddy</div>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link to="/HowItWorks" className="hover:text-blue-600">How it works</Link>
            <Link to="/Login" className="hover:text-blue-600">Log in</Link>
            <Link to="/Signup" className="hover:text-blue-600">Sign up</Link>
            <Link to="/EULA" className="hover:text-blue-600">EULA</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
