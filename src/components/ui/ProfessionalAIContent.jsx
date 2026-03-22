import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
    CheckCircle2,
    Lightbulb,
    BookOpen,
    Target,
    AlertTriangle,
    Zap,
    HelpCircle,
    Info,
    Layout,
    Copy,
    Sparkles,
    ChevronRight,
    Search,
    Brain,
    RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { safeJsonParse } from '@/lib/safeJsonParser';

/**
 * A professional renderer for AI-generated content.
 * It detects if the content is JSON and renders it with a premium UI,
 * otherwise it renders as Markdown.
 */
export const ProfessionalAIContent = ({ content, type = 'auto', title = null }) => {
    const [copied, setCopied] = useState(false);

    if (!content) return null;

    const handleCopy = () => {
        const textToCopy = typeof content === 'object' ? JSON.stringify(content, null, 2) : content;
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    let data = null;
    let isJSON = false;

    // Try to parse if it looks like JSON or if type says so
    let rawStr = typeof content === 'string' ? content.trim() : '';

    // Strip markdown formatting if present
    if (rawStr.startsWith('```json')) {
        rawStr = rawStr.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
    } else if (rawStr.startsWith('```')) {
        rawStr = rawStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    if (rawStr.startsWith('{') || rawStr.startsWith('[')) {
        data = safeJsonParse(rawStr, { fallback: null });
        if (data !== null) {
            // Unwrap "response" if it's the only top-level key
            if (typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length === 1 && data.response) {
                data = data.response;
            }
            isJSON = true;
        }
    } else if (typeof content === 'object') {
        data = content;
        isJSON = true;
    }

    // Render with copy button wrapper
    const ContentWithHeader = ({ children }) => (
        <div className="relative animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-blue-100/50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 tracking-tight">{title || "AI Insight Overview"}</h3>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="rounded-xl text-blue-600 hover:bg-blue-50 active:scale-95 transition-all"
                >
                    {copied ? (
                        <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Copied!
                        </>
                    ) : (
                        <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                        </>
                    )}
                </Button>
            </div>
            {children}
        </div>
    );

    if (!isJSON) {
        return (
            <ContentWithHeader>
                <MarkdownRenderer content={content} />
            </ContentWithHeader>
        );
    }

    // Determine specific JSON renderer

    // 1. Cornell Notes (Standard Format)
    if (data.sections && data.sections[0]?.notes?.[0]?.cue_column) {
        return (
            <ContentWithHeader>
                <CornellNotesRenderer data={data} />
            </ContentWithHeader>
        );
    }

    // 2. Structured Notes (Standard Format)
    if (data.sections) {
        return (
            <ContentWithHeader>
                <StructuredNotesRenderer data={data} />
            </ContentWithHeader>
        );
    }

    // 3. Flashcards
    const flashcardData = Array.isArray(data) ? data : (data.flashcards || data.cards || []);
    if (Array.isArray(flashcardData) && flashcardData.length > 0) {
        const first = flashcardData[0];
        const isFlashcard = (first.question && (first.answer || first.details)) ||
            (first.term && (first.definition || first.details)) ||
            (first.front && first.back);

        if (isFlashcard) {
            return (
                <ContentWithHeader>
                    <FlashcardsRenderer data={flashcardData} />
                </ContentWithHeader>
            );
        }
    }

    // 4. Study Cards / Cue-Notes (The format in the user image)
    if (Array.isArray(data) && data.length > 0 && (data[0].cue || data[0].question)) {
        return (
            <ContentWithHeader>
                <StudyCardsRenderer data={data} />
            </ContentWithHeader>
        );
    }

    // 5. Outline Format
    if (data.outline || (Array.isArray(data) && data[0].level !== undefined)) {
        return (
            <ContentWithHeader>
                <OutlineRenderer data={data.outline || data} />
            </ContentWithHeader>
        );
    }

    // Default JSON viewer
    return (
        <ContentWithHeader>
            <GenericJSONRenderer data={data} />
        </ContentWithHeader>
    );
};

const MarkdownRenderer = ({ content }) => (
    <div className="prose prose-slate max-w-none animate-in fade-in duration-700 pencil-scroll max-h-[80vh] pr-4">
        <ReactMarkdown
            components={{
                h1: ({ children }) => <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-8 mb-5 pb-2 border-b-2 border-blue-100">{children}</h1>,
                h2: ({ children }) => <h2 className="text-2xl font-bold text-slate-800 mt-6 mb-4 flex items-center gap-2">
                    <div className="w-2 h-8 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    {children}
                </h2>,
                h3: ({ children }) => <h3 className="text-xl font-semibold text-slate-900 mt-5 mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-indigo-400 rounded-full" />
                    {children}
                </h3>,
                p: ({ children }) => <p className="text-slate-700 mb-4 leading-relaxed text-base font-medium">{children}</p>,
                ul: ({ children }) => <ul className="pl-6 mb-5 space-y-3">{children}</ul>,
                li: ({ children }) => (
                    <li className="text-slate-700 pl-2 relative before:content-[''] before:absolute before:left-[-20px] before:top-[10px] before:w-2 before:h-2 before:bg-blue-500 before:rounded-full shadow-blue-500/20">
                        {children}
                    </li>
                ),
                strong: ({ children }) => <strong className="font-bold text-slate-900 bg-blue-50 px-1 rounded">{children}</strong>,
                blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-blue-500 bg-gradient-to-r from-blue-50 to-transparent p-6 rounded-r-3xl my-6 italic text-slate-700 shadow-sm">
                        <div className="flex gap-2">
                            <Info className="w-5 h-5 text-blue-400 shrink-0" />
                            <div>{children}</div>
                        </div>
                    </blockquote>
                ),
            }}
        >
            {content}
        </ReactMarkdown>
    </div>
);

const CornellNotesRenderer = ({ data }) => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {data.course_relevance && (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 bg-amber-50/50 border-2 border-amber-100 rounded-3xl flex gap-4 text-amber-900 shadow-sm"
            >
                <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
                    <Search className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                    <span className="font-black text-xs uppercase tracking-widest text-amber-600">Relevance Analytics</span>
                    <p className="text-sm mt-1 font-medium leading-relaxed">{data.course_relevance}</p>
                </div>
            </motion.div>
        )}

        <div className="relative p-8 rounded-[2rem] bg-slate-900 text-white overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="relative">
                <h2 className="text-3xl font-black tracking-tight mb-1">Cornell Study Sheet</h2>
                <p className="text-slate-400 font-medium">Professional Recall Optimization</p>
            </div>
        </div>

        {data.sections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-6">
                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3 ml-2">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <Layout className="w-5 h-5" />
                    </div>
                    {section.heading}
                </h3>

                <div className="border-2 border-slate-100 rounded-[2.5rem] overflow-hidden shadow-xl bg-white">
                    <div className="grid grid-cols-12 gap-0">
                        <div className="col-span-4 bg-slate-50/50 p-5 border-b border-r border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">Cues / Recall</div>
                        <div className="col-span-8 bg-white p-5 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">Deep Notes</div>

                        {section.notes.map((note, nIdx) => (
                            <React.Fragment key={nIdx}>
                                <div className="col-span-4 p-6 bg-indigo-50/20 border-r border-b border-slate-50 group hover:bg-indigo-50 transition-colors">
                                    <p className="font-bold text-indigo-900 leading-tight text-lg mb-2">{note.cue_column || note.topic}</p>
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-indigo-100 text-[9px] font-black text-indigo-500 uppercase tracking-tighter">
                                        <Brain className="w-3 h-3" />
                                        Self-Test Topic
                                    </div>
                                </div>
                                <div className="col-span-8 p-6 bg-white border-b border-slate-50 group-hover:bg-slate-50/30 transition-colors">
                                    <p className="text-xl font-bold text-slate-900 mb-3 tracking-tight">{note.topic}</p>
                                    <div className="text-slate-600 leading-relaxed font-medium space-y-3">
                                        <ReactMarkdown>{note.details}</ReactMarkdown>
                                    </div>
                                    {note.summary && (
                                        <div className="mt-5 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 text-sm text-emerald-800 flex gap-3 shadow-inner">
                                            <Zap className="w-5 h-5 text-emerald-500 shrink-0" />
                                            <p><strong className="font-black uppercase text-[10px] tracking-widest block mb-0.5 opacity-60">Synthesis</strong>{note.summary}</p>
                                        </div>
                                    )}
                                </div>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>
        ))}

        <div className="p-10 bg-gradient-to-br from-indigo-700 via-blue-700 to-indigo-800 rounded-[3rem] text-white shadow-3xl shadow-indigo-600/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
            <h4 className="flex items-center gap-3 font-black text-2xl mb-6 relative">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <Target className="w-6 h-6" />
                </div>
                Mastery Summary
            </h4>
            <div className="prose prose-invert max-w-none text-blue-50 font-medium leading-loose relative">
                <ReactMarkdown>{data.final_summary || data.summary || "Synthesize these concepts to achieve mastery."}</ReactMarkdown>
            </div>
        </div>
    </div>
);

const StudyCardsRenderer = ({ data }) => (
    <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-5 duration-700">
        {data.map((item, idx) => (
            <motion.div
                key={idx}
                whileHover={{ y: -5 }}
                className="group p-8 rounded-[2.5rem] bg-white border-2 border-slate-100 shadow-lg hover:shadow-2xl transition-all relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors" />
                <div className="mb-6 flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase">Study Card {idx + 1}</Badge>
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-4 leading-tight tracking-tight">
                    {item.cue || item.question || item.title || "Concept"}
                </h3>
                <div className="text-slate-600 font-medium leading-relaxed border-l-4 border-blue-100 pl-4 py-1">
                    <ReactMarkdown>{item.notes || item.answer || item.details || item.explanation}</ReactMarkdown>
                </div>
            </motion.div>
        ))}
    </div>
);

const OutlineRenderer = ({ data }) => (
    <div className="p-10 bg-white rounded-[3rem] border-2 border-slate-100 shadow-2xl space-y-6">
        {data.map((item, idx) => (
            <div
                key={idx}
                className={cn(
                    "transition-all duration-300 rounded-3xl p-4",
                    item.level === 0 ? "mb-6" : "ml-8 my-2 border-l border-slate-100 pl-6"
                )}
            >
                <div className="flex items-start gap-3">
                    {item.level === 0 ? (
                        <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/20">
                            <span className="font-bold text-xs">{idx + 1}</span>
                        </div>
                    ) : (
                        <ChevronRight className="w-4 h-4 text-slate-300 mt-1 shrink-0" />
                    )}
                    <div>
                        <p className={cn(
                            "font-bold text-slate-900 leading-tight",
                            item.level === 0 ? "text-xl font-black tracking-tight" : "text-base"
                        )}>
                            {item.title || item.topic || item.content}
                        </p>
                        {item.details && (
                            <p className="mt-2 text-sm text-slate-500 font-medium leading-relaxed italic">
                                {item.details}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        ))}
    </div>
);

const StructuredNotesRenderer = ({ data }) => {
    // Robust content extractor
    const renderContent = (section) => {
        // Try to find the items array using common AI naming conventions
        const items = section.notes ||
            section.key_concepts ||
            section.keyConcepts ||
            section.items ||
            section.content ||
            (Array.isArray(section) ? section : []);

        // If we found zero items but the section itself has a 'details' or 'text' property, use that
        if (!Array.isArray(items) || items.length === 0) {
            const rawText = section.details || section.description || section.text || section.content;
            if (rawText && typeof rawText === 'string') {
                return (
                    <div className="text-sm text-slate-600 font-medium leading-relaxed border-l-2 border-slate-100 pl-4 py-1">
                        <ReactMarkdown>{rawText}</ReactMarkdown>
                    </div>
                );
            }
            return <p className="text-slate-400 italic text-xs">Analysis in progress...</p>;
        }

        return items.map((item, nIdx) => {
            // Very aggressive property extraction
            if (typeof item === 'string') {
                return (
                    <div key={nIdx} className="group/item py-1">
                        <p className="text-slate-700 text-sm font-medium leading-relaxed">{item}</p>
                    </div>
                );
            }

            const title = item.name || item.topic || item.title || item.heading || item.concept || item.label;
            const description = item.description || item.details || item.content || item.notes || item.explanation || item.text;
            const memoryTrick = item.memory_trick || item.memoryTrick || item.mnemonic;

            return (
                <div key={nIdx} className="group/item space-y-3 pb-2 border-b border-slate-50 last:border-0 last:pb-0">
                    {title && (
                        <p className="font-black text-slate-800 text-base mb-1 group-hover/item:text-indigo-600 transition-colors tracking-tight leading-tight">
                            {typeof title === 'string' ? title : JSON.stringify(title)}
                        </p>
                    )}
                    {description && (
                        <div className="text-sm text-slate-600 font-medium leading-relaxed border-l-2 border-slate-100 pl-4 py-1">
                            {typeof description === 'string' ? (
                                <ReactMarkdown>{description}</ReactMarkdown>
                            ) : (
                                <pre className="text-[10px] bg-slate-50 p-2 rounded">{JSON.stringify(description)}</pre>
                            )}
                        </div>
                    )}
                    {memoryTrick && (
                        <div className="flex items-start gap-2 p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Expert Mnemonic</p>
                                <p className="text-xs text-amber-900 font-medium italic leading-relaxed">{memoryTrick}</p>
                            </div>
                        </div>
                    )}
                </div>
            );
        });
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Global Intro */}
            {data.introduction && (
                <div className="p-8 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-[2.5rem] border-2 border-blue-100/50 shadow-inner">
                    <p className="text-slate-700 font-medium leading-relaxed text-lg">{data.introduction}</p>
                </div>
            )}

            {/* Main Title Section */}
            <div className="flex flex-col md:flex-row md:items-center gap-6 mb-12 ml-4">
                <div className="w-20 h-20 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-2xl shadow-blue-500/30">
                    <BookOpen className="w-10 h-10" />
                </div>
                <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-3">
                        {data.title || data.heading || "Subject Masterclass"}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3">
                        <Badge className="bg-blue-600 text-white border-none rounded-full px-5 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">
                            Cognitive Engine v2
                        </Badge>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                        <span className="text-slate-400 text-[10px] font-black font-mono tracking-widest">LAYER_GEN: OMNI_SYNTH</span>
                        {data.sections && (
                            <>
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                <span className="text-indigo-500 text-[10px] font-black uppercase">{data.sections.length} Modules Loaded</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
                {Array.isArray(data.sections) && data.sections.map((section, idx) => {
                    const sectionTitle = section.title || section.heading || section.name || section.topic || `Module ${idx + 1}`;

                    return (
                        <Card key={idx} className="p-8 rounded-[3rem] border-slate-100 shadow-xl hover:shadow-2xl transition-all relative group overflow-hidden border-t-8 border-t-indigo-600 flex flex-col h-full bg-white">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="mb-6">
                                <h3 className="font-black text-2xl text-slate-900 flex items-center gap-3 leading-tight tracking-tight">
                                    <div className="w-4 h-4 rounded-full bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.4)] group-hover:scale-125 transition-transform" />
                                    {sectionTitle}
                                </h3>
                                {section.subtitle && <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">{section.subtitle}</p>}
                            </div>

                            <div className="space-y-6 flex-1">
                                {renderContent(section)}
                            </div>

                            <div className="mt-8 pt-4 border-t border-slate-50 flex justify-between items-center opacity-40 group-hover:opacity-100 transition-opacity">
                                <span className="text-[10px] font-black text-slate-400 uppercase">Analysis Unit {idx + 1}</span>
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Global Conclusion */}
            {data.conclusion && (
                <div className="p-10 bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[3rem] border-2 border-indigo-500/20 mt-10 relative overflow-hidden text-white shadow-3xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
                    <div className="relative flex items-start gap-6">
                        <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-lg">
                            <Zap className="w-8 h-8 text-emerald-400" />
                        </div>
                        <div>
                            <h4 className="font-black text-2xl text-white mb-3 tracking-tight">Synthesis Complete</h4>
                            <p className="text-slate-300 font-medium leading-loose text-lg">{data.conclusion}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const FlashcardsRenderer = ({ data }) => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in duration-700">
        {data.map((card, idx) => {
            const question = card.question || card.term || card.front || "Concept";
            const answer = card.answer || card.definition || card.back || card.details || "Details not provided";

            return (
                <div key={idx} className="group h-64 [perspective:2000px]">
                    <div className="relative h-full w-full rounded-[3rem] shadow-2xl transition-all duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] cursor-pointer">
                        <div className="absolute inset-0 flex flex-col p-10 bg-white border-2 border-slate-100 rounded-[3rem] [backface-visibility:hidden] items-center justify-center text-center">
                            <h4 className="absolute top-8 text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Neural Link #{idx + 1}</h4>
                            <p className="text-xl font-black text-slate-900 leading-snug line-clamp-4">{question}</p>
                            <div className="absolute bottom-8 flex items-center gap-2 text-[10px] text-slate-300 font-black uppercase tracking-widest animate-pulse">
                                <RotateCcw className="w-3 h-3" />
                                Flip to decode
                            </div>
                        </div>
                        <div className="absolute inset-0 h-full w-full rounded-[3rem] bg-slate-900 p-10 text-white [transform:rotateY(180deg)] [backface-visibility:hidden] flex flex-col items-center justify-center text-center">
                            <h4 className="absolute top-8 text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Validated Concept</h4>
                            <div className="overflow-auto pencil-scroll max-h-40 scrollbar-hide py-2">
                                <p className="text-lg leading-relaxed text-slate-100 font-medium">{answer}</p>
                            </div>
                            <div className="mt-6 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                                <span className="text-[10px] font-black text-emerald-500/70 uppercase">Insight Loaded</span>
                            </div>
                        </div>
                    </div>
                </div>
            );
        })}
    </div>
);

const renderGenericValue = (value) => {
    if (Array.isArray(value)) {
        return (
            <ul className="list-disc pl-5 space-y-2 marker:text-blue-500">
                {value.map((v, i) => (
                    <li key={i} className="text-slate-700">
                        {typeof v === 'object' && v !== null ? renderGenericValue(v) : (
                            <div className="prose prose-slate prose-sm max-w-none">
                                <ReactMarkdown>{String(v)}</ReactMarkdown>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        );
    } else if (typeof value === 'object' && value !== null) {
        return (
            <div className="space-y-4 pl-4 border-l-2 border-slate-100 py-1">
                {Object.entries(value).map(([k, v]) => (
                    <div key={k}>
                        <h5 className="font-bold text-slate-700 capitalize mb-1 text-sm tracking-tight">{k.replace(/_/g, ' ')}</h5>
                        {renderGenericValue(v)}
                    </div>
                ))}
            </div>
        );
    }
    return (
        <div className="prose prose-slate prose-sm max-w-none">
            <ReactMarkdown>{String(value)}</ReactMarkdown>
        </div>
    );
};

const GenericJSONRenderer = ({ data }) => (
    <div className="p-10 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200">
        <div className="flex items-center gap-4 mb-8 text-slate-400">
            <Layout className="w-10 h-10" />
            <div>
                <h3 className="font-black text-xl text-slate-600 tracking-tight">Structured Analysis Layer</h3>
                <p className="text-sm font-medium">Decoding complex JSON architecture...</p>
            </div>
        </div>
        <div className="grid gap-6">
            {Object.entries(data).map(([key, value]) => (
                <div key={key} className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                    <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-4">{key.replace(/_/g, ' ')}</h4>
                    <div className="text-slate-800 font-medium">
                        {renderGenericValue(value)}
                    </div>
                </div>
            ))}
        </div>
    </div>
);
