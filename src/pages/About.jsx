import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, GraduationCap, Heart, Globe, BookOpen, Brain, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';
import AdBanner from '@/components/ads/AdBanner';

const FEATURES = [
  { icon: Brain, title: 'AI Study Lab', desc: 'OCR text extraction, quiz generation, and smart summaries from any study material.' },
  { icon: BookOpen, title: 'Prescribed Books', desc: 'A dedicated library for your course textbooks with AI-powered chapter analysis.' },
  { icon: GraduationCap, title: 'Learning Paths', desc: 'Personalized step-by-step roadmaps built from your goals and current knowledge.' },
  { icon: Sparkles, title: 'Auto-Organizer', desc: 'AI that reads and categorizes your materials automatically — zero file management.' },
];

export default function About() {
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <img src={logo} alt="Study Buddy" className="h-8 w-auto object-contain" />
            <span className="font-extrabold text-lg text-blue-600 truncate">Study Buddy</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="text-slate-600" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-9 px-4" onClick={() => navigate('/Signup')}>
              Get started free
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-slate-50">
          <div className="max-w-5xl mx-auto px-4 pt-14 pb-16 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100/80 text-blue-700 text-xs font-semibold px-3 py-1 mb-5">
              <Heart className="w-3.5 h-3.5" />
              Made for students, by a student
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 mb-5 leading-tight">
              About Study Buddy
            </h1>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Study Buddy is an AI-powered educational application built to give every student —
              regardless of budget, location, or school resources — access to intelligent, step-by-step
              learning help whenever they need it.
            </p>
          </div>
        </section>

        {/* AdSense Banner */}
        <div className="max-w-5xl mx-auto px-4 py-4">
          <AdBanner slot="8704764718" format="horizontal" className="rounded-xl overflow-hidden" />
        </div>

        {/* Mission */}
        <section className="max-w-5xl mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4">Our Mission</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Too many students are left behind after school hours because they cannot afford a private tutor,
                because their parents cannot help with the subject, or because they are studying late at night when
                there is no one to ask. Study Buddy exists to close this gap.
              </p>
              <p className="text-slate-600 leading-relaxed mb-4">
                We believe the most important thing an AI study tool can do is <strong>teach the method</strong>,
                not just hand over the answer. A student who understands why the answer is correct can solve the
                next problem on their own. That is real learning, and it is what Study Buddy is built around.
              </p>
              <p className="text-slate-600 leading-relaxed">
                The app is completely free for its core features and supported by brief, non-intrusive advertisements
                so that no student is ever priced out of good study help.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {FEATURES.map((f) => (
                <div key={f.title} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                  <div className="p-2.5 rounded-xl bg-blue-50 w-fit mb-3">
                    <f.icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="font-bold text-sm text-slate-900 mb-1">{f.title}</div>
                  <div className="text-slate-500 text-xs leading-relaxed">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Who Built This */}
        <section className="bg-white border-y border-slate-100">
          <div className="max-w-5xl mx-auto px-4 py-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-8 text-center">Meet the Creator</h2>
            <div className="max-w-2xl mx-auto text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-200">
                <span className="text-3xl font-black text-white">N</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Nabster Tsr</h3>
              <p className="text-slate-500 text-sm mb-5">Developer &amp; Designer · Study Buddy</p>
              <p className="text-slate-600 leading-relaxed mb-4">
                Study Buddy was built by Nabster Tsr — an independent developer who wanted to create a
                genuinely useful AI study tool that treats students with respect. No dark patterns,
                no fake paywalls, no subscriptions designed to confuse you. Just a free app that helps
                you learn better.
              </p>
              <p className="text-slate-600 leading-relaxed mb-6">
                The application is actively maintained and improved based on student feedback. It runs
                on the web at <strong>profilegenius.fun</strong> and is available as an Android APK for
                offline and mobile use.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <a
                  href="https://buymeacoffee.com/nabstertsr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-semibold text-sm hover:bg-amber-100 transition-colors"
                >
                  <Coffee className="w-4 h-4" />
                  Support on Buy Me a Coffee
                </a>
                <Link
                  to="/Blog"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-semibold text-sm hover:bg-blue-100 transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  Read the Blog
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Platform */}
        <section className="max-w-5xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-extrabold tracking-tight mb-6 text-center">Available On</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { icon: Globe, title: 'Web App', desc: 'Access Study Buddy instantly at profilegenius.fun — no installation needed.', badge: 'Free' },
              { icon: GraduationCap, title: 'Android App', desc: 'Download the APK for offline access and mobile-first studying anywhere.', badge: 'Free APK' },
              { icon: Brain, title: 'Windows Desktop', desc: 'The Electron-based desktop app for a distraction-free study experience on PC.', badge: 'Free' },
            ].map((p) => (
              <div key={p.title} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm text-center">
                <div className="p-3 rounded-2xl bg-slate-50 w-fit mx-auto mb-4">
                  <p.icon className="w-7 h-7 text-blue-600" />
                </div>
                <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full mb-2">{p.badge}</span>
                <h3 className="font-bold text-slate-900 mb-2">{p.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-5xl mx-auto px-4 pb-14">
          <div className="rounded-3xl border border-blue-100 bg-blue-50 p-8 text-center">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Ready to study smarter?</h2>
            <p className="text-slate-600 mb-6 max-w-lg mx-auto text-sm sm:text-base">
              Create your free account and start your first AI-powered study session today.
            </p>
            <Button className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl" onClick={() => navigate('/Signup')}>
              Get started free
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between text-sm text-slate-500">
          <div>
            <div className="font-bold text-slate-800">Study Buddy</div>
            <div>© {year} Nabster Tsr Study Buddy</div>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link to="/" className="hover:text-blue-600">Home</Link>
            <Link to="/Blog" className="hover:text-blue-600">Blog</Link>
            <Link to="/Privacy" className="hover:text-blue-600">Privacy Policy</Link>
            <Link to="/EULA" className="hover:text-blue-600">EULA</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
