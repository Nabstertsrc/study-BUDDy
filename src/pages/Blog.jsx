import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock, Search, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { blogPosts, categoryColors } from '@/lib/blogPosts';
import logo from '@/assets/logo.png';
import AdBanner from '@/components/ads/AdBanner';

const CATEGORIES = ['All', ...Array.from(new Set(blogPosts.map((p) => p.category)))];

function PostCard({ post }) {
  const colors = categoryColors[post.categoryColor] || categoryColors.blue;
  const steps = post.featureSection?.steps || [];

  return (
    <Link
      to={`/BlogPost/${post.slug}`}
      className="group bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col"
    >
      {/* Visual header */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-400 via-transparent to-transparent pointer-events-none" />
        <div className={`inline-flex items-center gap-1.5 rounded-full ${colors.bg} ${colors.text} text-[11px] font-bold px-2.5 py-1 mb-3`}>
          <Tag className="w-2.5 h-2.5" />
          {post.category}
        </div>
        <div className="text-slate-100 font-black text-lg leading-tight group-hover:text-blue-300 transition-colors line-clamp-2">
          {post.title}
        </div>
        {steps.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {steps.slice(0, 2).map((s) => (
              <span key={s.label} className="inline-flex items-center gap-1 rounded-lg bg-white/10 text-slate-300 text-[10px] font-semibold px-2 py-1">
                <span>{s.icon}</span>
                <span className="truncate max-w-[100px]">{s.label}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 flex-1">{post.excerpt}</p>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-slate-400 text-xs">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {post.readTime}
            </span>
            <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <span className="text-blue-600 text-xs font-bold group-hover:underline">Read →</span>
        </div>
      </div>
    </Link>
  );
}

export default function Blog() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const year = new Date().getFullYear();

  const filtered = blogPosts.filter((p) => {
    const matchCat = activeCategory === 'All' || p.category === activeCategory;
    const q = search.toLowerCase();
    const matchSearch = !q || p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  // Split filtered posts into rows of 3 to inject ads between rows
  const rows = [];
  for (let i = 0; i < filtered.length; i += 3) {
    rows.push(filtered.slice(i, i + 3));
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <img src={logo} alt="Study Buddy" className="h-8 w-auto object-contain" />
            <span className="font-extrabold text-lg text-blue-600 truncate">Study Buddy</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-slate-600" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Home
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg" onClick={() => navigate('/Signup')}>
              Get started free
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10 sm:py-14">
        {/* Page Title */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100/80 text-blue-700 text-xs font-semibold px-3 py-1 mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            Learn &amp; Explore
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 mb-3">
            Study Buddy Blog
          </h1>
          <p className="text-slate-500 max-w-xl leading-relaxed">
            In-depth guides to every feature in Study Buddy — so you know exactly how to use each tool to
            study smarter and perform better.
          </p>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search posts…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeCategory === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Top AdBanner */}
        <div className="mb-8">
          <AdBanner slot="8704764718" format="horizontal" className="rounded-2xl overflow-hidden" />
        </div>

        {/* Posts grid with ad injected between rows */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-bold">No posts match your search</p>
          </div>
        ) : (
          <div className="space-y-8">
            {rows.map((row, rowIdx) => (
              <React.Fragment key={rowIdx}>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {row.map((post) => (
                    <PostCard key={post.slug} post={post} />
                  ))}
                </div>
                {/* Ad between rows (after row 0, i.e. after the first 3 posts) */}
                {rowIdx === 0 && rows.length > 1 && (
                  <AdBanner slot="8704764718" format="horizontal" className="rounded-2xl overflow-hidden" />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-14 rounded-3xl border border-blue-100 bg-blue-50 p-8 text-center">
          <h2 className="text-xl font-extrabold text-slate-900 mb-2">Ready to start studying smarter?</h2>
          <p className="text-slate-600 text-sm mb-5">
            Create your free Study Buddy account and put these features to work today.
          </p>
          <Button className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl" onClick={() => navigate('/Signup')}>
            Get started free
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-10">
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between text-sm text-slate-500">
          <div>
            <div className="font-bold text-slate-800">Study Buddy</div>
            <div>© {year} Nabster Tsr Study Buddy</div>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link to="/" className="hover:text-blue-600">Home</Link>
            <Link to="/About" className="hover:text-blue-600">About</Link>
            <Link to="/Privacy" className="hover:text-blue-600">Privacy Policy</Link>
            <Link to="/EULA" className="hover:text-blue-600">EULA</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
