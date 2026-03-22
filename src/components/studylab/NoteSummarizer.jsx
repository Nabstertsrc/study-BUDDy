import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, FileText, Sparkles, Copy, CheckCircle, Brain, Target, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ProfessionalAIContent } from "@/components/ui/ProfessionalAIContent";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import AILoadingState from "@/components/ui/AILoadingState";
import { safeJsonParse } from "@/lib/safeJsonParser";

export default function NoteSummarizer({ materials, onGenerate }) {
  const [source, setSource] = useState("text");
  const [text, setText] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [style, setStyle] = useState("structured");
  const [generating, setGenerating] = useState(false);
  const [summary, setSummary] = useState("");
  const [copied, setCopied] = useState(false);

  const generateSummary = async () => {
    setGenerating(true);
    const startTime = Date.now();

    let content = text;
    if (source === "material" && materialId) {
      const material = materials?.find(m => m.id === materialId);
      content = material?.content || "Summarize general study concepts";
    }

    const schemas = {
      structured: {
        type: "object",
        properties: {
          title: { type: "string" },
          sections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                heading: { type: "string" },
                notes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      topic: { type: "string" },
                      details: { type: "string" }
                    }
                  }
                }
              }
            }
          }
        }
      },
      cornell: {
        type: "object",
        properties: {
          course_relevance: { type: "string" },
          summary: { type: "string" },
          sections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                heading: { type: "string" },
                notes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      topic: { type: "string" },
                      details: { type: "string" },
                      cue_column: { type: "string" },
                      summary: { type: "string" }
                    }
                  }
                }
              }
            }
          }
        }
      },
      flashcard: {
        type: "array",
        items: {
          type: "object",
          properties: {
            question: { type: "string" },
            answer: { type: "string" }
          },
          required: ["question", "answer"]
        }
      },
      outline: {
        type: "array",
        items: {
          type: "object",
          properties: {
            level: { type: "number" },
            title: { type: "string" },
            details: { type: "string" }
          },
          required: ["level", "title"]
        }
      }
    };

    const prompt = `Hey! You're a helpful study buddy! Create awesome ${style} notes from this content:

${content}

${style === 'cornell' ? 'IMPORTANT: Follow the Cornell note-taking method strictly. Provide cues/questions for the left column and detailed notes for the right.' : ''}

Make the notes:
✨ Fun and engaging to read
📝 Well-organized and easy to scan
🎯 Focused on key concepts
💡 Include memory tricks where helpful
Return only the structured data as valid JSON. Do not include any other text or markdown blocks.`;

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        systemPrompt: "You are a helpful study assistant specializing in note summarization. Always return valid JSON matching the requested schema.",
        response_json_schema: schemas[style] || null
      });

      // Robust extraction: Use safeJsonParse for consistent handling
      const parsedResponse = safeJsonParse(response, {
        fallback: response, // If parsing fails, use raw response
        verbose: true
      });

      setSummary(parsedResponse);
      onGenerate?.(parsedResponse);

      // Track learning activity
      const timeSpent = Math.round((Date.now() - startTime) / 60000);
      const material = source === "material" && materialId ? materials?.find(m => m.id === materialId) : null;
      await base44.entities.LearningActivity.create({
        activity_type: "summary",
        material_id: material?.id,
        module_id: material?.module_id,
        topic: material?.title || "Custom notes",
        time_spent_minutes: timeSpent,
        completed: true,
        notes: `Style: ${style}`
      });

      // Check for achievements
      if (base44?.functions?.invoke) {
        base44.functions.invoke('checkAchievements', {});
      }

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3B82F6', '#2DD4BF', '#10B981']
      });
    } catch (error) {
      console.error("Error generating summary:", error);
      toast.error("Failed to generate summary. The AI might be having trouble formatting the response. Please try again or use a different style.");
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    const textToCopy = typeof summary === 'object' ? JSON.stringify(summary, null, 2) : summary;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (generating) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <AILoadingState
          title="Cognitive Synthesis"
          message={`Deconstructing ${source === 'text' ? 'custom notes' : 'study materials'} and rebuilding as a ${style} framework. Almost there...`}
        />
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-teal-500/10" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl animate-pulse" />

        <div className="relative bg-white/40 backdrop-blur-xl rounded-[2.5rem] border-2 border-white/60 shadow-2xl shadow-blue-500/10 p-10">
          <div className="flex items-center gap-5 mb-10">
            <div className="w-16 h-16 rounded-[2rem] bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-2xl shadow-blue-500/40 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-black text-3xl tracking-tight bg-gradient-to-r from-blue-700 via-cyan-700 to-teal-700 bg-clip-text text-transparent">
                Neuro-Summarizer
              </h3>
              <p className="text-slate-500 font-medium text-lg">AI-powered cognitive synthesis engine</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-bold uppercase tracking-widest text-slate-400 ml-1">Input Source</Label>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-white/50 focus:ring-blue-500 shadow-sm text-lg px-6 font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="text" className="py-3 px-4">Direct Text Entry</SelectItem>
                    <SelectItem value="material" className="py-3 px-4">Existing Library Material</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-bold uppercase tracking-widest text-slate-400 ml-1">Learning Architecture</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-white/50 focus:ring-blue-500 shadow-sm text-lg px-6 font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="structured" className="py-3 px-4">Structured Framework</SelectItem>
                    <SelectItem value="cornell" className="py-3 px-4">Cornell Recall Method</SelectItem>
                    <SelectItem value="outline" className="py-3 px-4">Hierarchical Outline</SelectItem>
                    <SelectItem value="flashcard" className="py-3 px-4">Recall Cards</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <AnimatePresence mode="wait">
                {source === "material" && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-3"
                  >
                    <Label className="text-sm font-bold uppercase tracking-widest text-slate-400 ml-1">Select Document</Label>
                    <Select value={materialId} onValueChange={setMaterialId}>
                      <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-white/50 focus:ring-blue-500 shadow-sm text-lg px-6 font-medium">
                        <SelectValue placeholder="Select from library..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        {materials?.map((m) => (
                          <SelectItem key={m.id} value={m.id} className="py-3 px-4">{m.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-6">
              <AnimatePresence mode="wait">
                {source === "text" ? (
                  <motion.div
                    key="text-input"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="space-y-3 h-full flex flex-col"
                  >
                    <Label className="text-sm font-bold uppercase tracking-widest text-slate-400 ml-1">Knowledge Content</Label>
                    <Textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Paste your raw knowledge here... documents, notes, or web extracts."
                      className="flex-1 min-h-[16rem] rounded-[2rem] border-slate-200 bg-white/50 focus:ring-blue-500 shadow-inner p-8 text-lg font-medium resize-none leading-relaxed"
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="material-preview"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="h-full flex items-center justify-center p-10 border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/50"
                  >
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-3xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-10 h-10 text-blue-600" />
                      </div>
                      <p className="text-slate-500 font-bold max-w-[200px]">Material analysis mode active</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="mt-10"
          >
            <Button
              onClick={generateSummary}
              disabled={generating || (source === "text" ? !text : !materialId)}
              size="lg"
              className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:via-indigo-700 hover:to-violet-700 shadow-[0_20px_50px_rgba(37,99,235,0.3)] text-white font-black rounded-[2rem] h-20 text-xl tracking-tight group"
            >
              {generating ? (
                <>
                  <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                  Synthesizing Cognitive Model...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6 mr-3 group-hover:animate-spin" />
                  Initialize Neural Synthesis
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </motion.div>

      <AnimatePresence>
        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 20 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-teal-500/10 blur-3xl opacity-50" />
            <div className="relative bg-white/60 backdrop-blur-2xl rounded-[3rem] border-2 border-white/60 shadow-3xl shadow-blue-900/10 overflow-hidden">
              <div className="bg-slate-900 p-8 flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <Target className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h4 className="font-black text-2xl text-white tracking-tight uppercase">Mastery Synthesis Output</h4>
                    <div className="flex gap-2 mt-1">
                      <div className="h-1.5 w-12 rounded-full bg-blue-500/50" />
                      <div className="h-1.5 w-6 rounded-full bg-indigo-500/50" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={copyToClipboard}
                    className="text-white hover:bg-white/10 rounded-2xl px-6 border border-white/10"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2 text-emerald-400" />
                        Copied to Brain
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5 mr-2" />
                        Copy Result
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <div className="p-10 lg:p-14">
                {typeof summary === 'string' && (
                  <div className="mb-8 p-6 bg-amber-50 border-2 border-amber-200 rounded-2xl flex items-start gap-4">
                    <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
                    <div>
                      <h5 className="font-bold text-amber-900 text-lg">Format Limitation Insight</h5>
                      <p className="text-amber-700 font-medium">
                        The AI provided a high-quality summary but couldn't fit it into the {style} template.
                        We're showing you the raw analysis below so you don't miss out!
                      </p>
                    </div>
                  </div>
                )}
                <ProfessionalAIContent content={summary} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
