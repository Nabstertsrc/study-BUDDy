import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Sparkles,
  Loader2,
  Lightbulb,
  BookOpen,
  Send,
  User,
  Bot,
  Brain,
  Zap,
  Target,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ProfessionalAIContent } from "@/components/ui/ProfessionalAIContent";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import AILoadingState from "@/components/ui/AILoadingState";

export default function DeepDive() {
  const [topic, setTopic] = useState("");
  const [context, setContext] = useState("");
  const [generating, setGenerating] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [conversation, setConversation] = useState([]);

  const generateExplanation = async () => {
    if (!topic) return;

    setGenerating(true);
    setConversation([]);
    const startTime = Date.now();

    const prompt = `You're an awesome teacher who makes learning FUN! 🎉 Explain "${topic}" in a way that's super easy to understand and exciting!

${context ? `Context: ${context}` : ""}

Follow these steps:
1. **🎯 Simple Explanation**: Explain like you're talking to a friend! Use fun analogies from everyday life (food, games, sports, etc.)
2. **🔑 Key Components**: Break down the main parts - keep it simple and visual!
3. **🌟 Real-World Example**: Show a relatable example that makes it click!
4. **💪 Why It Matters**: Explain the cool applications and why it's useful
5. **❌ Common Mistakes**: Clear up typical misunderstandings
6. **✅ Test Yourself**: End with 2-3 quick check questions

Keep it upbeat, use emojis occasionally, and make learning feel like an adventure! Use Markdown formatting.`;

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        systemPrompt: "You are a world-class teacher specializing in the Feynman Technique."
      });

      setExplanation(response);
      setConversation([
        { role: "user", content: `Explain: ${topic}` },
        { role: "assistant", content: response }
      ]);

      // Track learning activity
      const timeSpent = Math.round((Date.now() - startTime) / 60000);
      await base44.entities.LearningActivity.create({
        activity_type: "deep_dive",
        topic: topic,
        time_spent_minutes: timeSpent,
        completed: true,
        notes: context || ""
      });

      // Check for achievements
      if (base44?.functions?.invoke) {
        base44.functions.invoke('checkAchievements', {});
      }

      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#10B981', '#34D399', '#059669']
      });
    } catch (error) {
      console.error("Deep Dive error:", error);
      toast.error("Failed to generate Deep Dive explanation. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const askFollowUp = async () => {
    if (!followUpQuestion || !explanation) return;

    const newConversation = [...conversation, { role: "user", content: followUpQuestion }];
    setConversation(newConversation);
    setFollowUpQuestion("");
    setGenerating(true);

    const prompt = `Context: We're exploring "${topic}" together! 🚀

Previous discussion: ${explanation.slice(0, 500)}...

The student asks: "${followUpQuestion}"

Answer in a fun, engaging way! Use simple language, cool analogies, and make sure they understand. Keep it exciting and encouraging! Use Markdown formatting.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      systemPrompt: "You are a helpful and encouraging tutor."
    });

    setConversation([...newConversation, { role: "assistant", content: response }]);
    setGenerating(false);
  };

  if (generating && !explanation) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <AILoadingState
          title="Knowledge Deconstruction"
          message={`Applying the Feynman Core to "${topic}". Simplifying complexity into total clarity...`}
        />
      </motion.div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <AnimatePresence mode="wait">
        {!explanation ? (
          <motion.div
            key="input-screen"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10" />
            <div className="absolute -top-32 -right-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] animate-pulse" />

            <div className="relative bg-white/40 backdrop-blur-2xl rounded-[3rem] border-2 border-white/60 shadow-3xl p-10 lg:p-14">
              <div className="flex items-center gap-6 mb-12">
                <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-emerald-500/40 transform -rotate-6 hover:rotate-0 transition-transform duration-500">
                  <Lightbulb className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-4xl tracking-tighter bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 bg-clip-text text-transparent">
                    Neural Deep Dive
                  </h3>
                  <p className="text-slate-500 font-bold text-lg mt-1">Harnessing the Feynman Core for total mastery</p>
                </div>
              </div>

              <div className="grid lg:grid-cols-5 gap-10">
                <div className="lg:col-span-3 space-y-10">
                  <div className="space-y-4">
                    <Label className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600/70 ml-1">Concept Identification</Label>
                    <Input
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="What complex idea should we simplify?"
                      className="text-2xl py-8 rounded-[1.5rem] border-slate-200 bg-white/50 focus:ring-emerald-500 shadow-inner px-8 font-black tracking-tight"
                    />
                  </div>

                  <div className="space-y-4">
                    <Label className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600/70 ml-1">Contextual Background (Optional)</Label>
                    <Textarea
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                      placeholder="Add snippets of your understanding or specific pain points..."
                      rows={4}
                      className="rounded-[2rem] border-slate-200 bg-white/50 focus:ring-emerald-500 shadow-inner p-8 text-lg font-medium leading-relaxed resize-none"
                    />
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                  <div className="relative overflow-hidden p-8 rounded-[2.5rem] bg-slate-900 text-white shadow-2xl h-full flex flex-col justify-center">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -mr-16 -mt-16" />
                    <div className="relative">
                      <h4 className="font-black text-xl mb-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                          <Brain className="w-5 h-5" />
                        </div>
                        Feynman Logic
                      </h4>
                      <p className="text-slate-300 leading-relaxed font-medium">
                        "If you can't explain it simply, you don't understand it well enough."
                      </p>
                      <div className="mt-6 flex flex-wrap gap-2">
                        {['Analogy Core', 'Deconstruction', 'Simplification'].map(tag => (
                          <span key={tag} className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-white/10 border border-white/10 text-emerald-400">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="mt-12"
              >
                <Button
                  onClick={generateExplanation}
                  disabled={generating || !topic}
                  size="lg"
                  className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 shadow-[0_20px_50px_rgba(16,185,129,0.3)] text-white font-black rounded-[2rem] h-20 text-2xl tracking-tighter group transition-all duration-300"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-7 h-7 mr-4 animate-spin" />
                      Deconstructing Knowledge...
                    </>
                  ) : (
                    <>
                      <Zap className="w-7 h-7 mr-4 group-hover:animate-bounce" />
                      Initialize Neural Exploration
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="chat-screen"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid lg:grid-cols-4 gap-8"
          >
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-8 border-2 border-white/60 shadow-xl">
                <h4 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                  <Target className="w-4 h-4" /> Exploring
                </h4>
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                    <p className="text-emerald-900 font-black text-lg leading-tight">{topic}</p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full rounded-2xl h-12 font-bold border-2 hover:bg-slate-50"
                    onClick={() => setExplanation("")}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" /> New Subject
                  </Button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="relative bg-white/60 backdrop-blur-2xl rounded-[3rem] border-2 border-white/60 shadow-3xl shadow-emerald-900/10 overflow-hidden flex flex-col h-[800px]">
                <div className="bg-slate-900 p-8 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-black text-xl text-white tracking-tight">AI Feynman Tutor</h4>
                      <p className="text-[10px] uppercase font-black tracking-widest text-emerald-500">Active Synthesis Mode</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-10 space-y-10 pencil-scroll scroll-smooth">
                  {conversation.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 30, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.4, delay: idx * 0.1 }}
                      className={cn(
                        "flex gap-6 max-w-[90%]",
                        msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl group-hover:scale-110 transition-transform",
                        msg.role === "user"
                          ? "bg-gradient-to-br from-indigo-500 to-blue-600"
                          : "bg-gradient-to-br from-emerald-500 to-teal-600"
                      )}>
                        {msg.role === "user" ? (
                          <User className="w-6 h-6 text-white" />
                        ) : (
                          <Bot className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div className={cn(
                        "flex-1 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden",
                        msg.role === "user"
                          ? "bg-white border-2 border-slate-100"
                          : "bg-white border-2 border-emerald-100 shadow-emerald-500/5"
                      )}>
                        {msg.role === "assistant" && (
                          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16" />
                        )}
                        {msg.role === "user" ? (
                          <p className="text-slate-900 text-xl font-bold leading-relaxed">{msg.content}</p>
                        ) : (
                          <ProfessionalAIContent content={msg.content} />
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {generating && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-6 mr-auto"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center animate-bounce">
                        <Bot className="w-6 h-6 text-white" />
                      </div>
                      <div className="bg-white/50 backdrop-blur-sm border-2 border-emerald-100 rounded-[2.5rem] p-8 px-12 flex items-center gap-4 shadow-xl">
                        <div className="flex gap-1.5">
                          {[0, 1, 2].map(i => (
                            <motion.div
                              key={i}
                              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                              transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                              className="w-2.5 h-2.5 rounded-full bg-emerald-500"
                            />
                          ))}
                        </div>
                        <span className="text-emerald-700 font-black uppercase text-xs tracking-widest">Cognitive Processing</span>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="p-8 bg-white border-t-2 border-slate-50">
                  <div className="relative flex items-center gap-4 max-w-4xl mx-auto">
                    <Input
                      value={followUpQuestion}
                      onChange={(e) => setFollowUpQuestion(e.target.value)}
                      placeholder="Ask the Tutor anything..."
                      onKeyDown={(e) => e.key === "Enter" && !generating && askFollowUp()}
                      disabled={generating}
                      className="text-xl py-8 rounded-[2rem] border-2 border-slate-100 focus:border-emerald-400 bg-slate-50/50 shadow-inner px-10 h-16 font-medium pr-24"
                    />
                    <Button
                      onClick={askFollowUp}
                      disabled={generating || !followUpQuestion}
                      size="lg"
                      className="absolute right-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-xl shadow-emerald-500/40 w-12 h-12 rounded-2xl p-0"
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                  <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-4">
                    Iterative Learning Cycle Active
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
