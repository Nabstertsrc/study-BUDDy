import React from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Tag, ChevronRight, Lightbulb, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPostBySlug, getRelatedPosts, categoryColors, blogPosts } from '@/lib/blogPosts';
import logo from '@/assets/logo.png';
import AdBanner from '@/components/ads/AdBanner';

/* ── Content block renderers ─────────────────────────────── */
function ContentBlock({ block, isFirst }) {
  switch (block.type) {
    case 'intro':
      return (
        <p className="text-lg text-slate-700 leading-relaxed font-medium border-l-4 border-blue-500 pl-4 mb-6">
          {block.text}
        </p>
      );
    case 'h2':
      return (
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-8 mb-3 tracking-tight">
          {block.text}
        </h2>
      );
    case 'h3':
      return (
        <h3 className="text-lg font-bold text-slate-900 mt-6 mb-2">{block.text}</h3>
      );
    case 'p':
      return <p className="text-slate-600 leading-relaxed mb-4">{block.text}</p>;
    case 'tip':
      return (
        <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 my-5">
          <Lightbulb className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-amber-800 text-sm leading-relaxed">{block.text}</p>
        </div>
      );
    case 'list':
      return (
        <ul className="space-y-2 my-4">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-slate-600 text-sm leading-relaxed">
              <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case 'conclusion':
      return (
        <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 my-6">
          <p className="leading-relaxed text-sm">{block.text}</p>
        </div>
      );
    default:
      return null;
  }
}

/* ── Feature demo section ────────────────────────────────── */
function FeatureDemo({ section }) {
  if (!section) return null;
  const { label, description, steps } = section;
  return (
    <div className="my-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 sm:p-8 text-white overflow-hidden relative">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-400 via-transparent to-transparent pointer-events-none" />
      <div className="relative">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold px-3 py-1 mb-3">
          {label} — Feature in Action
        </div>
        <p className="text-slate-300 text-sm mb-6">{description}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {steps.map((step, i) => (
            <div
              key={i}
              className="bg-white/10 rounded-2xl p-3 flex flex-col items-center text-center gap-2 border border-white/10"
            >
              <div className="text-2xl">{step.icon}</div>
              <div className="text-xs text-slate-300 font-medium leading-tight">{step.label}</div>
              <div className="w-4 h-0.5 rounded-full bg-blue-400 opacity-60" />
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Step {i + 1}</div>
            </div>
          ))}
        </div>
        {/* Simulated UI bar */}
        <div className="mt-6 bg-white/5 rounded-xl p-3 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <div className="ml-2 h-1.5 flex-1 rounded-full bg-white/10" />
          </div>
          <div className="space-y-1.5">
            <div className="h-2.5 rounded-full bg-white/10 w-3/4" />
            <div className="h-2 rounded-full bg-white/5 w-full" />
            <div className="h-2 rounded-full bg-blue-500/30 w-1/2" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Related post card ───────────────────────────────────── */
function RelatedCard({ post }) {
  const colors = categoryColors[post.categoryColor] || categoryColors.blue;
  return (
    <Link
      to={`/BlogPost/${post.slug}`}
      className="flex gap-3 items-start bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow group"
    >
      <div className={`p-2 rounded-xl ${colors.bg} shrink-0 mt-0.5`}>
        <Tag className={`w-3.5 h-3.5 ${colors.text}`} />
      </div>
      <div className="min-w-0">
        <div className="font-semibold text-slate-900 text-sm leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
          {post.title}
        </div>
        <div className="text-slate-400 text-xs mt-1 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {post.readTime}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mt-1 group-hover:text-blue-500 transition-colors" />
    </Link>
  );
}

/* ── Breadcrumb ──────────────────────────────────────────── */
function Breadcrumb({ title }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-400 mb-6 flex-wrap">
      <Link to="/" className="hover:text-blue-600">Home</Link>
      <ChevronRight className="w-3 h-3" />
      <Link to="/Blog" className="hover:text-blue-600">Blog</Link>
      <ChevronRight className="w-3 h-3" />
      <span className="text-slate-600 truncate max-w-[200px]">{title}</span>
    </nav>
  );
}

/* ── Main component ──────────────────────────────────────── */
export default function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const post = getPostBySlug(slug);
  const year = new Date().getFullYear();

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="text-5xl">📚</div>
        <h1 className="text-2xl font-black text-slate-900">Post not found</h1>
        <p className="text-slate-500 text-sm">This article does not exist or has been moved.</p>
        <Button className="bg-blue-600 text-white rounded-xl" onClick={() => navigate('/Blog')}>
          Browse all posts
        </Button>
      </div>
    );
  }

  const related = getRelatedPosts(post.relatedSlugs || []);
  const colors = categoryColors[post.categoryColor] || categoryColors.blue;
  const publishDate = new Date(post.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Split content at the mid-point to inject an ad
  const midIdx = Math.floor((post.content || []).length / 2);
  const contentBefore = (post.content || []).slice(0, midIdx);
  const contentAfter = (post.content || []).slice(midIdx);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* JSON-LD Article Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: post.title,
            description: post.excerpt,
            datePublished: post.date,
            dateModified: post.date,
            author: { '@type': 'Person', name: 'Nabster Tsr' },
            publisher: {
              '@type': 'Organization',
              name: 'Study Buddy',
              url: 'https://profilegenius.fun',
              logo: { '@type': 'ImageObject', url: 'https://profilegenius.fun/icon.png' },
            },
            mainEntityOfPage: { '@type': 'WebPage', '@id': `https://profilegenius.fun/#/BlogPost/${post.slug}` },
          }),
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <img src={logo} alt="Study Buddy" className="h-8 w-auto object-contain" />
            <span className="font-extrabold text-lg text-blue-600 hidden sm:block truncate">Study Buddy</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-slate-600" onClick={() => navigate('/Blog')}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              All posts
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg" onClick={() => navigate('/Signup')}>
              Get started free
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-10 items-start">
          {/* ── Main article ── */}
          <article>
            <Breadcrumb title={post.title} />

            {/* Post header */}
            <div className="mb-6">
              <div className={`inline-flex items-center gap-1.5 rounded-full ${colors.bg} ${colors.text} text-xs font-bold px-3 py-1 mb-4`}>
                <Tag className="w-3 h-3" />
                {post.category}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 leading-tight mb-4">
                {post.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-slate-400 text-xs">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {post.readTime}
                </span>
                <time dateTime={post.date}>{publishDate}</time>
                <span>By Nabster Tsr</span>
              </div>
            </div>

            {/* Top ad */}
            <AdBanner slot="8704764718" format="horizontal" className="rounded-2xl overflow-hidden mb-6" />

            {/* Content — first half */}
            <div className="prose-article">
              {contentBefore.map((block, i) => (
                <ContentBlock key={i} block={block} isFirst={i === 0} />
              ))}
            </div>

            {/* Feature Demo visual section */}
            <FeatureDemo section={post.featureSection} />

            {/* Mid-article ad */}
            <AdBanner slot="8704764718" format="horizontal" className="rounded-2xl overflow-hidden my-6" />

            {/* Content — second half */}
            <div className="prose-article">
              {contentAfter.map((block, i) => (
                <ContentBlock key={i} block={block} />
              ))}
            </div>

            {/* Bottom ad */}
            <AdBanner slot="8704764718" format="horizontal" className="rounded-2xl overflow-hidden mt-8" />

            {/* Post CTA */}
            <div className="mt-10 rounded-3xl border border-blue-100 bg-blue-50 p-6 sm:p-8 text-center">
              <h2 className="text-xl font-extrabold text-slate-900 mb-2">Try it yourself</h2>
              <p className="text-slate-600 text-sm mb-5">
                Study Buddy is free to start — no credit card, no subscription.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl" onClick={() => navigate('/Signup')}>
                  Create free account
                </Button>
                <Button variant="outline" className="h-11 px-6 rounded-xl" onClick={() => navigate('/Blog')}>
                  Read more guides
                </Button>
              </div>
            </div>
          </article>

          {/* ── Sidebar ── */}
          <aside className="hidden lg:block sticky top-24 space-y-6">
            {/* About card */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <img src={logo} alt="Study Buddy" className="h-9 w-auto object-contain" />
                <div>
                  <div className="font-bold text-sm text-slate-900">Study Buddy</div>
                  <div className="text-xs text-slate-400">by Nabster Tsr</div>
                </div>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed mb-4">
                AI-powered homework help that teaches the method, not just the answer.
              </p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-9 text-sm" onClick={() => navigate('/Signup')}>
                Get started free
              </Button>
            </div>

            {/* Sidebar ad */}
            <AdBanner slot="8704764718" format="rectangle" className="rounded-2xl overflow-hidden" />

            {/* Related posts */}
            {related.length > 0 && (
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-3 px-1">Related guides</h3>
                <div className="space-y-2">
                  {related.map((rp) => (
                    <RelatedCard key={rp.slug} post={rp} />
                  ))}
                </div>
              </div>
            )}

            {/* All posts */}
            <div>
              <h3 className="font-bold text-slate-900 text-sm mb-3 px-1">All feature guides</h3>
              <div className="space-y-1">
                {blogPosts.map((p) => (
                  <Link
                    key={p.slug}
                    to={`/BlogPost/${p.slug}`}
                    className={`block text-xs px-3 py-2 rounded-lg transition-colors ${
                      p.slug === slug
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {p.title}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-10">
        <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between text-sm text-slate-500">
          <div>
            <div className="font-bold text-slate-800">Study Buddy</div>
            <div>© {year} Nabster Tsr Study Buddy</div>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link to="/" className="hover:text-blue-600">Home</Link>
            <Link to="/Blog" className="hover:text-blue-600">Blog</Link>
            <Link to="/About" className="hover:text-blue-600">About</Link>
            <Link to="/Privacy" className="hover:text-blue-600">Privacy Policy</Link>
            <Link to="/EULA" className="hover:text-blue-600">EULA</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
