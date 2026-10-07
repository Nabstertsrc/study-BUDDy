import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate } from "react-router-dom";
import { Sparkles, Copy, Check, Loader2, Wand2, BookOpen, Plus, Trash2, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { label: "Study Tips", color: "blue" },
  { label: "Feature Guide", color: "indigo" },
  { label: "Exam Strategies", color: "amber" },
  { label: "AI & Learning", color: "violet" },
  { label: "Study Science", color: "teal" },
  { label: "Getting Started", color: "emerald" },
  { label: "About", color: "slate" },
  { label: "Parent Guide", color: "rose" },
  { label: "University", color: "purple" },
];

const TOPIC_SUGGESTIONS = [
  "How to write a university essay introduction",
  "Study techniques for visual learners",
  "How to use flashcards effectively",
  "Managing screen time while studying",
  "UNISA assignment tips",
  "How to prepare for oral exams",
  "Digital note-taking vs handwriting",
  "Spaced repetition for language learning",
  "How to read a research paper",
  "Study nutrition: foods that boost brain performance",
  "Sleep and academic performance",
  "Online vs in-person learning comparison",
  "How to stay motivated during long study sessions",
  "Managing multiple deadlines at once",
  "Effective revision techniques for matric exams",
  "How to use past papers strategically",
  "Study habits of top university students",
  "How to take notes from YouTube lectures",
  "Managing stress during exam season",
  "AI tools every student should know about",
];

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

async function generatePostWithAI(topic, category, categoryColor) {
  const { base44 } = await import("@/api/base44Client");

  const systemPrompt = `You are an expert educational content writer for Study Buddy, an AI-powered study app for South African students (UNISA, high school, university). 
You write long-form, original, SEO-friendly blog posts that are:
- Educational and genuinely helpful
- 600-900 words of content (not counting JSON wrapper)
- Naturally mention Study Buddy features where relevant (Study Lab, Assignments, Quiz, Learning Path, AI)
- Written in clear, engaging English (not American slang — international English)
- Free of filler phrases like "In conclusion" or "In today's world"
- Structured with an intro, multiple h2 sections, at least one tip block, and a conclusion

You MUST return ONLY a valid JSON object (no markdown, no code fences, no extra text) matching this exact structure:
{
  "slug": "url-friendly-slug-here",
  "title": "Full Post Title Here",
  "date": "${todayStr()}",
  "readTime": "X min read",
  "category": "${category}",
  "categoryColor": "${categoryColor}",
  "excerpt": "2-3 sentence excerpt for the blog listing page.",
  "featureSection": {
    "label": "Short Label",
    "description": "One line describing the feature/process",
    "steps": [
      { "icon": "📚", "label": "Step description" },
      { "icon": "🤖", "label": "Step description" },
      { "icon": "✅", "label": "Step description" },
      { "icon": "🎯", "label": "Step description" }
    ]
  },
  "content": [
    { "type": "intro", "text": "Opening paragraph..." },
    { "type": "h2", "text": "Section heading" },
    { "type": "p", "text": "Paragraph text..." },
    { "type": "tip", "text": "Pro tip text..." },
    { "type": "h2", "text": "Another heading" },
    { "type": "p", "text": "More content..." },
    { "type": "list", "items": ["item 1", "item 2", "item 3"] },
    { "type": "conclusion", "text": "Closing paragraph..." }
  ],
  "relatedSlugs": ["existing-slug-1", "existing-slug-2"]
}`;

  const prompt = `Write a comprehensive blog post about: "${topic}"
Category: ${category}
Target audience: South African students (high school, UNISA, university)
Make it informative, practical, and mention Study Buddy features naturally where relevant.
Return ONLY the JSON object with no markdown formatting or code blocks.`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    systemPrompt,
    skipAdGate: true,
    isBackground: false,
  });

  // Parse JSON from AI response
  let parsed;
  try {
    // Try direct parse
    parsed = JSON.parse(result);
  } catch {
    // Try extracting JSON from response
    const match = result.match(/\{[\s\S]*\}/);
    if (match) {
      parsed = JSON.parse(match[0]);
    } else {
      throw new Error("AI returned invalid JSON. Please try again.");
    }
  }

  return parsed;
}

function PostPreview({ post, onDelete, index }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const jsCode = JSON.stringify(post, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsCode);
    setCopied(true);
    toast.success("Post code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
      <div className="p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-sm font-black flex-shrink-0">
            {index + 1}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 text-sm truncate">{post.title}</p>
            <p className="text-xs text-slate-400 mt-0.5">{post.category} · {post.date} · {post.readTime}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1.5 text-xs">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy code"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setExpanded(!expanded)} className="text-slate-500">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(index)} className="text-red-400 hover:text-red-600 hover:bg-red-50">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-slate-100">
          <div className="bg-slate-900 p-4 overflow-x-auto max-h-96">
            <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap">{jsCode}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BlogPostGenerator() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0].label);
  const [count, setCount] = useState(3);
  const [generating, setGenerating] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [allCopied, setAllCopied] = useState(false);

  const selectedCategoryColor = CATEGORIES.find(c => c.label === category)?.color || "blue";

  // Admin guard
  if (!isAdmin) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">Admin Only</h1>
        <p className="text-slate-500 mb-6">The Blog Post Generator is restricted to administrators.</p>
        <Button onClick={() => navigate("/Blog")} className="bg-blue-600 hover:bg-blue-700 text-white">
          Go to Blog
        </Button>
      </div>
    );
  }

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic or select a suggestion.");
      return;
    }
    setGenerating(true);
    setProgress({ current: 0, total: count });

    const newPosts = [];
    for (let i = 0; i < count; i++) {
      // For multiple posts, vary the topic slightly
      const currentTopic = i === 0
        ? topic
        : `${topic} (Part ${i + 1}: different angle, subtopics, or audience)`;

      try {
        setProgress({ current: i + 1, total: count });
        toast.info(`Generating post ${i + 1} of ${count}...`, { duration: 3000 });
        const post = await generatePostWithAI(currentTopic, category, selectedCategoryColor);
        // Ensure date is today
        post.date = todayStr();
        // Ensure slug is unique
        post.slug = post.slug || slugify(post.title);
        newPosts.push(post);
      } catch (err) {
        toast.error(`Post ${i + 1} failed: ${err.message}`);
      }
    }

    setGeneratedPosts(prev => [...newPosts, ...prev]);
    setGenerating(false);
    setProgress({ current: 0, total: 0 });

    if (newPosts.length > 0) {
      toast.success(`✅ Generated ${newPosts.length} post${newPosts.length > 1 ? "s" : ""}! Copy the code and add to blogPosts.js`);
    }
  };

  const handleDelete = (index) => {
    setGeneratedPosts(prev => prev.filter((_, i) => i !== index));
  };

  const handleCopyAll = () => {
    const allCode = generatedPosts
      .map(post => JSON.stringify(post, null, 2))
      .join(",\n\n");
    navigator.clipboard.writeText(allCode);
    setAllCopied(true);
    toast.success("All post code copied! Paste into blogPosts.js array.");
    setTimeout(() => setAllCopied(false), 3000);
  };

  const handleClearAll = () => {
    setGeneratedPosts([]);
    toast.info("Cleared all generated posts.");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 px-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">Blog Post Generator</h1>
            <span className="text-[10px] font-black text-white bg-violet-600 rounded-full px-2 py-0.5 uppercase tracking-wider ml-1">Admin</span>
          </div>
          <p className="text-slate-500 text-sm">Generate 3–5 SEO-ready blog posts per day with AI. Copy the output and paste into <code className="text-violet-600 font-mono text-xs bg-violet-50 px-1 rounded">blogPosts.js</code>.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/Blog")} className="text-slate-600 gap-1.5">
          <BookOpen className="w-4 h-4" />
          View Blog
        </Button>
      </div>

      {/* Generator Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">
        <h2 className="font-bold text-slate-900 flex items-center gap-2">
          <Plus className="w-4 h-4 text-violet-600" />
          Generate New Posts
        </h2>

        {/* Topic input */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Topic / Title Idea</Label>
          <Input
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="e.g. How to study for UNISA exams..."
            className="rounded-xl border-2 focus-visible:ring-violet-500"
            disabled={generating}
          />
        </div>

        {/* Topic suggestions */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Quick suggestions</p>
          <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">
            {TOPIC_SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => setTopic(s)}
                className={cn(
                  "text-xs px-2.5 py-1 rounded-lg border transition-colors",
                  topic === s
                    ? "bg-violet-600 text-white border-violet-600"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-violet-50 hover:border-violet-200"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Category + Count */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Category</Label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full border-2 border-slate-100 rounded-xl p-2.5 text-sm font-bold text-slate-700 outline-none focus:border-violet-500 transition-all bg-white"
              disabled={generating}
            >
              {CATEGORIES.map(c => (
                <option key={c.label} value={c.label}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Number of posts to generate</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  disabled={generating}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-sm font-black border-2 transition-all",
                    count === n
                      ? "bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-200"
                      : "bg-white text-slate-500 border-slate-200 hover:border-violet-300"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Generate button */}
        <Button
          className="w-full h-12 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white font-bold text-base rounded-xl gap-2 shadow-lg shadow-violet-200 transition-all"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating post {progress.current} of {progress.total}…
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate {count} Post{count > 1 ? "s" : ""}
            </>
          )}
        </Button>

        {generating && (
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-violet-500 to-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Generated posts */}
      {generatedPosts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              Generated Posts ({generatedPosts.length})
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="text-red-500 border-red-200 hover:bg-red-50 gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear all
              </Button>
              <Button
                size="sm"
                onClick={handleCopyAll}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              >
                {allCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {allCopied ? "Copied all!" : "Copy all code"}
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
            <p className="font-bold mb-1">📋 How to publish:</p>
            <ol className="list-decimal list-inside space-y-1 text-amber-600">
              <li>Click <strong>"Copy code"</strong> on any post (or <strong>"Copy all code"</strong> for all)</li>
              <li>Open <code className="bg-amber-100 px-1 rounded font-mono">src/lib/blogPosts.js</code></li>
              <li>Paste the code inside the <code className="bg-amber-100 px-1 rounded font-mono">blogPosts = [...]</code> array before the closing <code className="bg-amber-100 px-1 rounded font-mono">]</code></li>
              <li>Add a comma after the previous entry if needed</li>
              <li>Save, commit, and push to GitHub</li>
            </ol>
          </div>

          <div className="space-y-3">
            {generatedPosts.map((post, idx) => (
              <PostPreview key={idx} post={post} index={idx} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}

      {generatedPosts.length === 0 && !generating && (
        <div className="text-center py-16 text-slate-400">
          <Wand2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-bold">No posts generated yet</p>
          <p className="text-sm mt-1">Enter a topic above and click Generate</p>
        </div>
      )}
    </div>
  );
}
