import React from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  BrainCircuit,
  LayoutDashboard,
  Settings as SettingsIcon,
  ShieldCheck,
  Target,
  Zap,
  Layers,
  GraduationCap,
  Users,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import AdBanner from '@/components/ads/AdBanner';

const features = [
  {
    title: 'AI Study Lab & OCR',
    icon: <BrainCircuit className="w-8 h-8 text-blue-500" />,
    description:
      'Upload your PDFs or images (using OCR). Our AI extracts information, generates quizzes, and creates intelligent summaries instantly.',
    details: [
      'Optical Character Recognition (OCR) reads text from scanned pages and photos',
      'AI generates multiple-choice and short-answer quizzes from any uploaded material',
      'Smart summaries distill long chapters into concise, exam-ready notes',
      'Deep-dive analysis explains complex concepts step by step',
    ],
    slug: 'how-to-use-ai-study-lab',
    color: 'blue',
  },
  {
    title: 'Interactive Dashboard',
    icon: <LayoutDashboard className="w-8 h-8 text-indigo-500" />,
    description:
      'A centralized hub to track your learning progress, upcoming assignments, and overall study metrics all at a glance.',
    details: [
      'Live stats: enrolled modules, pending tasks, quiz averages, study hours',
      'Color-coded deadline calendar so you always know what is urgent',
      'AI Study Tools carousel for instant access to your most-used features',
      'AI Insights panel delivers personalized recommendations based on your activity',
    ],
    slug: 'tracking-progress-on-your-dashboard',
    color: 'indigo',
  },
  {
    title: 'Learning Paths',
    icon: <Target className="w-8 h-8 text-emerald-500" />,
    description:
      'Generates step-by-step personalized learning paths for you based on your uploaded curriculum or goals.',
    details: [
      'Enter any learning goal and the AI maps a structured roadmap to reach it',
      'Skips topics you already know and focuses on your knowledge gaps',
      'Each step links directly to the relevant Study Buddy feature or resource',
      'Track your progress percentage as you complete each milestone',
    ],
    slug: 'building-a-personalized-learning-path',
    color: 'emerald',
  },
  {
    title: 'Ad-Supported AI Generation',
    icon: <Zap className="w-8 h-8 text-amber-500" />,
    description:
      'Advanced AI generation is completely free! Simply view a short ad before accessing premium AI features like deep-dives and detailed assessments.',
    details: [
      'Core features are always free with no subscription or credit card required',
      'Watch a 15-30 second rewarded ad to unlock advanced AI generation for a full session',
      'Ads are served by Google AdMob/AdSense — always age-appropriate and non-intrusive',
      'This model ensures every student has equal access regardless of budget',
    ],
    slug: 'how-the-ad-supported-free-model-works',
    color: 'amber',
  },
  {
    title: 'Prescribed Books Library',
    icon: <BookOpen className="w-8 h-8 text-violet-500" />,
    description:
      'Access a library of textbooks securely stored. Read, highlight, and let the AI analyze chapters for you.',
    details: [
      'Upload PDFs of your prescribed textbooks to your personal library',
      'Clean, distraction-free reader with highlighting and annotation tools',
      'AI chapter analysis: summaries, concept maps, key vocabulary extraction',
      'Split-view mode to read and ask the AI questions simultaneously',
    ],
    slug: 'using-prescribed-books-library',
    color: 'violet',
  },
  {
    title: 'AI Auto-Organizer',
    icon: <Layers className="w-8 h-8 text-purple-500" />,
    description:
      'The AI reads and categorizes your study materials automatically — saving you hours of file management every semester.',
    details: [
      'AI reads document content (not just filenames) to categorize materials accurately',
      'Automatically groups related content by subject, topic, and document type',
      'Smart search across all your study materials in one query',
      'Integrates with the Learning Path and Study Lab for a seamless workflow',
    ],
    slug: 'organizing-studies-with-auto-organizer',
    color: 'purple',
  },
  {
    title: 'Assignment Tracking',
    icon: <GraduationCap className="w-8 h-8 text-rose-500" />,
    description:
      'Full assignment lifecycle management — create, track, prioritize, and submit assignments with smart deadline warnings.',
    details: [
      'Add assignments with title, module, due date, and type in seconds',
      'Color-coded urgency system: red (24h), amber (3 days), standard view',
      'AI prioritizes your task list based on deadline proximity and task complexity',
      'Push notifications remind you 3 days, 24 hours, and on the day of each deadline',
    ],
    slug: 'creating-and-managing-assignments',
    color: 'rose',
  },
  {
    title: 'Secure Account & Settings',
    icon: <ShieldCheck className="w-8 h-8 text-slate-700" />,
    description:
      'Your data is secured with Firebase Auth. Customize notifications, profile details, and app behavior in your settings panel.',
    details: [
      'Firebase Authentication with email verification and secure password hashing',
      'Cloud sync keeps your data backed up and available across all your devices',
      'Fully customizable notification preferences for deadlines and reminders',
      'Terminology preferences: switch between "Modules" and "Subjects" naming',
    ],
    slug: 'getting-started-sign-up-and-first-steps',
    color: 'slate',
  },
];

const colorMap = {
  blue: 'bg-blue-50 border-blue-100',
  indigo: 'bg-indigo-50 border-indigo-100',
  emerald: 'bg-emerald-50 border-emerald-100',
  amber: 'bg-amber-50 border-amber-100',
  violet: 'bg-violet-50 border-violet-100',
  purple: 'bg-purple-50 border-purple-100',
  rose: 'bg-rose-50 border-rose-100',
  slate: 'bg-slate-50 border-slate-100',
};

export default function HowItWorks() {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-14 animate-in fade-in duration-500">

      {/* Page Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">How Study Buddy Works</h1>
        <p className="text-lg text-slate-500">
          Study Buddy leverages AI to transform your static study materials into interactive, adaptive
          learning experiences. Here is a breakdown of every core feature — with detailed guides for each one.
        </p>
        <div className="flex flex-wrap gap-3 justify-center pt-2">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl" onClick={() => navigate('/Signup')}>
            Get started free
          </Button>
          <Button variant="outline" className="rounded-xl" onClick={() => navigate('/Blog')}>
            Read feature guides
          </Button>
        </div>
      </div>

      {/* Quick overview steps */}
      <section>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-6 text-center">Three steps from stuck to understanding</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              step: '1',
              icon: '📄',
              title: 'Upload or ask',
              desc: 'Paste a question, upload a PDF, or snap a photo of your homework. Study Buddy accepts it all and meets you at your exact stuck point.',
            },
            {
              step: '2',
              icon: '🧠',
              title: 'Learn the method',
              desc: 'Get clear, step-by-step guidance that explains the why — not just a final answer to copy. The AI teaches so you can solve the next one yourself.',
            },
            {
              step: '3',
              icon: '📈',
              title: 'Practice & track',
              desc: 'Quizzes, summaries, and progress tools help you lock in concepts. Your streak and insights tell you exactly how you are improving.',
            },
          ].map((s) => (
            <div key={s.step} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm text-center">
              <div className="text-4xl mb-3">{s.icon}</div>
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm mx-auto mb-3">
                {s.step}
              </div>
              <h3 className="font-bold text-slate-900 mb-2">{s.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Ad banner between sections */}
      <AdBanner slot="8704764718" format="horizontal" className="rounded-2xl overflow-hidden" />

      {/* Feature cards */}
      <section>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">All features explained</h2>
        <p className="text-slate-500 mb-8">Click "Read the full guide" on any feature for an in-depth walkthrough.</p>
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, idx) => (
            <div key={idx} className={`border rounded-2xl overflow-hidden shadow-sm ${colorMap[feature.color] || 'bg-white border-slate-100'}`}>
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm shrink-0">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{feature.title}</h3>
                </div>
                <p className="text-slate-600 leading-relaxed mb-4 text-sm">{feature.description}</p>
                <ul className="space-y-2 mb-5">
                  {feature.details.map((d, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      {d}
                    </li>
                  ))}
                </ul>
                {feature.slug && (
                  <Link
                    to={`/BlogPost/${feature.slug}`}
                    className="inline-flex items-center gap-1.5 text-blue-600 text-sm font-semibold hover:underline"
                  >
                    Read the full guide
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Who it's for */}
      <section className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-10">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Who Study Buddy is built for</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { icon: GraduationCap, title: 'Students', desc: 'After-school help, weekend catch-up, and exam season when textbooks alone are not enough. Works for all subjects and year levels.' },
            { icon: Users, title: 'Parents', desc: 'A calmer way to support homework nights — method-first help you can trust more than a random chat tab open next to Netflix.' },
            { icon: BrainCircuit, title: 'Self-learners', desc: 'Learning something outside of school? Study Buddy adapts to any material you upload — courses, certifications, personal projects.' },
          ].map((item) => (
            <div key={item.title} className="flex flex-col gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 w-fit">
                <item.icon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-bold text-slate-900">{item.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Ad banner */}
      <AdBanner slot="8704764718" format="horizontal" className="rounded-2xl overflow-hidden" />

      {/* Blog link section */}
      <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl font-extrabold mb-3">Learn more in our guides</h2>
            <p className="text-slate-400 leading-relaxed mb-5">
              Our blog has a detailed, step-by-step guide for every feature in Study Buddy — with
              visual walkthroughs showing exactly how each tool works.
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl" onClick={() => navigate('/Blog')}>
              Browse all feature guides
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {features.slice(0, 4).map((f) => (
              <Link
                key={f.slug}
                to={`/BlogPost/${f.slug}`}
                className="bg-white/10 rounded-xl p-3 hover:bg-white/20 transition-colors border border-white/10"
              >
                <div className="text-xs text-slate-300 font-bold truncate">{f.title}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="bg-blue-50 border border-blue-100 rounded-3xl p-8 text-center flex flex-col items-center">
        <Zap className="w-12 h-12 text-blue-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Ready to supercharge your learning?</h2>
        <p className="text-slate-600 max-w-lg mb-6 text-sm sm:text-base">
          Start utilizing these features right from your dashboard. Most features are automated to help
          you focus entirely on learning rather than organizing.
        </p>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-11 px-8" onClick={() => navigate('/Signup')}>
          Get started free
        </Button>
      </div>
    </div>
  );
}
