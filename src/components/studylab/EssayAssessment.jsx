import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  FileText,
  CheckCircle,
  AlertCircle,
  Sparkles,
  TrendingUp,
  Brain,
  Target,
  Zap,
  ChevronRight,
  PenTool,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import AILoadingState from "@/components/ui/AILoadingState";
import { toast } from "sonner";
import { safeJsonParse } from "@/lib/safeJsonParser";

export default function EssayAssessment() {
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [grading, setGrading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const queryClient = useQueryClient();

  const { data: modules } = useQuery({
    queryKey: ["modules"],
    queryFn: () => base44.entities.Module.list(),
  });

  const { data: essays } = useQuery({
    queryKey: ["essays"],
    queryFn: () => base44.entities.Essay.list("-submitted_date"),
  });

  const gradeEssay = async () => {
    setGrading(true);
    try {
      const wordCount = content.trim().split(/\s+/).length;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert essay grader and writing coach. Analyze this student essay and provide comprehensive, constructive feedback.

**Essay Prompt:** ${prompt}

**Student's Essay:**
${content}

Provide detailed feedback evaluating:
1. **Content** (0-100): Relevance, depth, accuracy, and evidence
2. **Structure** (0-100): Organization, flow, paragraph coherence
3. **Clarity** (0-100): Clear expression, conciseness, readability
4. **Grammar** (0-100): Grammar, spelling, punctuation, syntax

Be encouraging but honest. Provide specific, actionable suggestions for improvement.`,
        response_json_schema: {
          type: "object",
          properties: {
            overall_score: { type: "number", description: "Overall score 0-100" },
            content_score: { type: "number" },
            structure_score: { type: "number" },
            clarity_score: { type: "number" },
            grammar_score: { type: "number" },
            feedback: { type: "string", description: "Overall constructive feedback" },
            strengths: {
              type: "array",
              items: { type: "string" },
              description: "3-4 specific strengths"
            },
            improvements: {
              type: "array",
              items: { type: "string" },
              description: "3-4 areas for improvement"
            },
            specific_suggestions: {
              type: "array",
              items: { type: "string" },
              description: "5-6 specific actionable suggestions"
            }
          }
        }
      });

      // Robust extraction using safeJsonParse
      const parsedResponse = safeJsonParse(response, {
        fallback: response,
        verbose: true
      });

      setFeedback(parsedResponse);

      const finalFeedback = typeof parsedResponse === 'object' ? parsedResponse : { feedback: parsedResponse, overall_score: 0 };

      // Save essay
      await base44.entities.Essay.create({
        title,
        module_id: moduleId,
        prompt,
        content,
        word_count: wordCount,
        ai_feedback: finalFeedback,
        status: "graded",
        submitted_date: new Date().toISOString()
      });

      // Identify skill gaps based on low scores (only if we have an object)
      const gaps = [];
      if (typeof finalFeedback === 'object' && finalFeedback.overall_score !== undefined) {
        if (finalFeedback.content_score < 70) {
          gaps.push({ category: "comprehension", skill: "Content Development", score: finalFeedback.content_score });
        }
        if (finalFeedback.structure_score < 70) {
          gaps.push({ category: "writing", skill: "Essay Structure", score: finalFeedback.structure_score });
        }
        if (finalFeedback.clarity_score < 70) {
          gaps.push({ category: "writing", skill: "Clear Expression", score: finalFeedback.clarity_score });
        }
        if (finalFeedback.grammar_score < 70) {
          gaps.push({ category: "writing", skill: "Grammar & Mechanics", score: finalFeedback.grammar_score });
        }
      }

      // Create skill gap records with micro-learning suggestions
      for (const gap of gaps) {
        const microLearningRaw = await base44.integrations.Core.InvokeLLM({
          prompt: `Create 2-3 micro-learning modules to help a student improve in: ${gap.skill}

Each module should be:
- 5-15 minutes long
- Focused on one specific aspect
- Include practical exercises`,
          response_json_schema: {
            type: "object",
            properties: {
              modules: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    estimated_time: { type: "string" },
                    resources: { type: "array", items: { type: "string" } }
                  }
                }
              }
            }
          }
        });

        const microLearning = safeJsonParse(microLearningRaw, {
          fallback: { modules: [{ title: gap.skill, description: String(microLearningRaw) }] },
          verbose: true
        });

        await base44.entities.SkillGap.create({
          skill_name: gap.skill,
          module_id: moduleId,
          category: gap.category,
          severity: gap.score < 50 ? "significant" : gap.score < 60 ? "moderate" : "minor",
          identified_from: "Essay Assessment",
          description: `Score: ${gap.score}/100. Identified from essay assessment.`,
          micro_learning_modules: microLearning.modules,
          status: "active"
        });
      }

      queryClient.invalidateQueries({ queryKey: ["essays"] });

      // Track activity
      await base44.entities.LearningActivity.create({
        activity_type: "deep_dive",
        module_id: moduleId,
        topic: title,
        performance_score: finalFeedback.overall_score || 0,
        time_spent_minutes: 15,
        completed: true,
        notes: "Essay Assessment"
      });

      // Check achievements
      if (base44?.functions?.invoke) {
        base44.functions.invoke('checkAchievements', {});
      }

      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#3B82F6', '#6366F1', '#8B5CF6']
      });

    } catch (error) {
      console.error("Error grading essay:", error);
      toast.error("Failed to evaluate essay. The AI experienced a format limitation or processing error.");
    } finally {
      setGrading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  };

  const getScoreBg = (score) => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-amber-100";
    return "bg-red-100";
  };

  if (grading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <AILoadingState
          title="Manuscript Analysis"
          message={`Conducting an elite linguistic and structural audit of "${title || 'your essay'}". Identifying mastery points and growth vectors...`}
        />
      </motion.div>
    );
  }

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-500 shadow-xl shadow-indigo-500/20 flex items-center justify-center">
              <PenTool className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-4xl font-black text-slate-900 tracking-tighter">AI Essay Grader</h3>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-12 rounded-full bg-indigo-500" />
                <div className="h-1.5 w-6 rounded-full bg-blue-400" />
                <p className="text-sm font-black uppercase tracking-widest text-slate-400 ml-2">Elite Writing Evaluator</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {!feedback ? (
          <motion.div
            key="essay-input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-violet-500/5" />
            <div className="relative bg-white/40 backdrop-blur-2xl rounded-[3rem] border-2 border-white/60 shadow-3xl p-10 lg:p-14">
              <div className="grid lg:grid-cols-5 gap-12">
                <div className="lg:col-span-3 space-y-8">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600/70 ml-1">Composition Title</Label>
                      <Input
                        placeholder="Name your masterpiece..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="h-14 rounded-2xl border-slate-200 bg-white/50 focus:ring-indigo-500 shadow-sm text-lg px-6 font-bold"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600/70 ml-1">Academic Context</Label>
                      <Select value={moduleId} onValueChange={setModuleId}>
                        <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-white/50 focus:ring-indigo-500 shadow-sm text-lg px-6 font-bold">
                          <SelectValue placeholder="Associate with module..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          {modules?.map((module) => (
                            <SelectItem key={module.id} value={module.id} className="py-3 px-4">
                              {module.code} - {module.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600/70 ml-1">The Writing Prompt</Label>
                    <Textarea
                      placeholder="Paste the core requirements or question here..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="rounded-[1.5rem] border-slate-200 bg-white/50 focus:ring-indigo-500 shadow-inner p-6 text-lg font-medium leading-relaxed resize-none h-24"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center ml-1">
                      <Label className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600/70">Manuscript Content</Label>
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                        content.trim().split(/\s+/).length < 50 ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                      )}>
                        {content.trim() ? content.trim().split(/\s+/).length : 0} / 50 Words
                      </span>
                    </div>
                    <Textarea
                      placeholder="Pour your thoughts onto the digital canvas..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="min-h-[400px] rounded-[2.5rem] border-slate-200 bg-white/50 focus:ring-indigo-500 shadow-inner p-10 text-xl font-medium leading-[1.8] resize-none scrollbar-modern"
                    />
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-8">
                  <div className="p-8 rounded-[3rem] bg-slate-900 text-white shadow-3xl h-full flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32" />

                    <div className="relative flex-1">
                      <h4 className="text-2xl font-black mb-6 tracking-tight flex items-center gap-3">
                        <Brain className="w-8 h-8 text-indigo-400" />
                        Analysis Matrix
                      </h4>
                      <div className="space-y-6">
                        {[
                          { label: 'Linguistic Analysis', sub: 'Grammar, Syntax, Vocabulary' },
                          { label: 'Structural Audit', sub: 'Coherence, Flow, Logic' },
                          { label: 'Content Depth', sub: 'Evidence, Reasoning, Bias' }
                        ].map((item, i) => (
                          <div key={i} className="flex gap-4">
                            <div className="w-2 h-12 rounded-full bg-gradient-to-b from-indigo-500 to-transparent" />
                            <div>
                              <p className="font-bold text-slate-100">{item.label}</p>
                              <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">{item.sub}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="relative pt-8 mt-8 border-t border-white/10">
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          onClick={gradeEssay}
                          disabled={!title || !prompt || !content || content.trim().split(/\s+/).length < 50 || grading}
                          className="w-full bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 hover:from-indigo-700 hover:via-blue-700 hover:to-indigo-700 shadow-2xl shadow-indigo-500/40 text-white font-black rounded-[2rem] h-20 text-xl tracking-tighter group transition-all duration-300"
                        >
                          {grading ? (
                            <>
                              <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                              Processing Neural Data...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-6 h-6 mr-3 group-hover:animate-pulse" />
                              Initialize Evaluation
                            </>
                          )}
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="essay-feedback"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="space-y-10"
          >
            {typeof feedback === 'string' && (
              <div className="relative overflow-hidden p-12 lg:p-16 rounded-[4rem] bg-white border-2 border-amber-100 shadow-3xl">
                <div className="flex items-center gap-4 mb-8">
                  <AlertCircle className="w-8 h-8 text-amber-600" />
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Narrative Feedback Matrix</h2>
                </div>
                <div className="p-10 rounded-[2.5rem] bg-amber-50/50 border-2 border-amber-100 prose prose-indigo max-w-none text-xl font-medium leading-relaxed italic">
                  {feedback}
                </div>
                <div className="mt-8 flex justify-center">
                  <Button
                    onClick={() => setFeedback(null)}
                    variant="outline"
                    className="rounded-full px-12 h-14 border-2 border-amber-200 text-amber-700 hover:bg-amber-100 font-bold"
                  >
                    Start New Assessment
                  </Button>
                </div>
              </div>
            )}

            {typeof feedback === 'object' && feedback !== null && (
              <>
                <div className="relative overflow-hidden p-12 lg:p-16 rounded-[4rem] bg-white border-2 border-slate-100 shadow-3xl">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] -mr-48 -mt-48" />

                  <div className="flex flex-col lg:flex-row gap-16 items-center">
                    <div className="relative">
                      <div className="w-56 h-56 rounded-full border-[10px] border-slate-50 flex items-center justify-center shadow-inner">
                        <div className="text-center">
                          <span className={cn("text-7xl font-black tracking-tighter", getScoreColor(feedback.overall_score))}>
                            {feedback.overall_score}
                          </span>
                          <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mt-1">Mastery Score</p>
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                        className="absolute inset-0 rounded-full border-t-4 border-indigo-500 border-dashed opacity-20"
                      />
                    </div>

                    <div className="flex-1 space-y-8">
                      <div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">{title}</h2>
                        <div className="p-8 rounded-[2.5rem] bg-slate-50 border-2 border-slate-100 italic text-slate-600 text-lg leading-relaxed font-medium">
                          "{feedback.feedback}"
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                          { label: "Critical Content", score: feedback.content_score },
                          { label: "Architecture", score: feedback.structure_score },
                          { label: "Articulation", score: feedback.clarity_score },
                          { label: "Mechanics", score: feedback.grammar_score }
                        ].map((item, idx) => (
                          <div key={idx} className="space-y-3">
                            <div className="flex justify-between items-end">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</span>
                              <span className={cn("font-black text-sm", getScoreColor(item.score))}>{item.score}%</span>
                            </div>
                            {/* @ts-ignore - Progress component accepts value prop */}
                            <Progress value={item.score} className="h-2.5 rounded-full bg-slate-100" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-10">
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-10 rounded-[3.5rem] bg-emerald-50/50 border-2 border-emerald-100 shadow-2xl relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                      <CheckCircle className="w-32 h-32 text-emerald-600" />
                    </div>
                    <h4 className="text-2xl font-black text-emerald-900 mb-8 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      Success Matrix
                    </h4>
                    <ul className="space-y-6">
                      {feedback.strengths?.map((strength, idx) => (
                        <li key={idx} className="flex gap-4 group">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2.5 group-hover:scale-150 transition-transform" />
                          <span className="text-emerald-800 text-lg font-bold leading-tight">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="p-10 rounded-[3.5rem] bg-indigo-50/50 border-2 border-indigo-100 shadow-2xl relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                      <Sparkles className="w-32 h-32 text-indigo-600" />
                    </div>
                    <h4 className="text-2xl font-black text-indigo-900 mb-8 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                        <Zap className="w-5 h-5" />
                      </div>
                      Growth Opportunities
                    </h4>
                    <ul className="space-y-6">
                      {feedback.improvements?.map((improvement, idx) => (
                        <li key={idx} className="flex gap-4 group">
                          <ChevronRight className="w-5 h-5 text-indigo-400 mt-1 flex-shrink-0" />
                          <span className="text-indigo-800 text-lg font-bold leading-tight">{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="p-12 rounded-[4rem] bg-slate-900 text-white shadow-3xl relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent" />
                  <h4 className="text-3xl font-black mb-10 flex items-center gap-4 relative">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 backdrop-blur-md flex items-center justify-center border border-indigo-500/30">
                      <Target className="w-8 h-8 text-indigo-400" />
                    </div>
                    Strategy for Perfection
                  </h4>
                  <div className="grid md:grid-cols-2 gap-x-12 gap-y-10 relative">
                    {feedback.specific_suggestions?.map((suggestion, idx) => (
                      <div key={idx} className="flex gap-6 items-start group">
                        <span className="text-4xl font-black text-indigo-500/20 group-hover:text-indigo-500 transition-colors duration-500 italic">
                          {(idx + 1).toString().padStart(2, '0')}
                        </span>
                        <p className="text-slate-200 text-lg font-medium leading-relaxed group-hover:text-white transition-colors">
                          {suggestion}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-16 pt-10 border-t border-white/10 flex justify-center">
                    <Button
                      onClick={() => {
                        setFeedback(null);
                        setTitle("");
                        setPrompt("");
                        setContent("");
                        setModuleId("");
                      }}
                      variant="ghost"
                      className="rounded-full px-12 h-16 text-indigo-400 hover:text-white hover:bg-white/10 font-black text-lg"
                    >
                      <RefreshCw className="w-5 h-5 mr-3" /> Grade New Manuscript
                    </Button>
                  </div>
                </motion.div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Activity Ledger */}
      {!feedback && essays?.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/40 backdrop-blur-xl rounded-[3rem] p-10 border-2 border-white/60 shadow-xl"
        >
          <h4 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-8 ml-2">Recent Evaluations</h4>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {essays.slice(0, 6).map((essay) => (
              <motion.div
                key={essay.id}
                whileHover={{ y: -5 }}
                className="p-6 rounded-[2rem] bg-white shadow-lg border border-slate-100 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    {essay.ai_feedback && (
                      <div className={cn("px-3 py-1 rounded-full text-[10px] font-black", getScoreBg(essay.ai_feedback.overall_score))}>
                        {essay.ai_feedback.overall_score}/100
                      </div>
                    )}
                  </div>
                  <h5 className="font-black text-slate-800 mb-2 truncate">{essay.title}</h5>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    {new Date(essay.submitted_date).toLocaleDateString()} • {essay.word_count} words
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
