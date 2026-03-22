import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Brain,
  Sparkles,
  Loader2,
  CheckCircle,
  XCircle,
  ChevronRight,
  RotateCcw,
  Trophy,
  AlertCircle
} from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import AILoadingState from "@/components/ui/AILoadingState";
import { safeJsonParse } from "@/lib/safeJsonParser";

export default function QuizGenerator({ modules, materials }) {
  const [source, setSource] = useState("text");
  const [text, setText] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [questionCount, setQuestionCount] = useState("5");
  const [generating, setGenerating] = useState(false);

  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.Quiz.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["quizzes"] }),
  });

  const generateQuiz = async () => {
    setGenerating(true);
    const startTime = Date.now();

    try {
      let content = text;
      if (source === "material" && materialId) {
        const material = materials?.find(m => m.id === materialId);
        content = material?.content || material?.summary || "";

        if (!content) {
          toast.error("Selected material has no content");
          setGenerating(false);
          return;
        }
      }

      if (!content || content.trim().length < 10) {
        toast.error("Please provide more content to generate a quiz");
        setGenerating(false);
        return;
      }

      console.log("Starting quiz generation with content length:", content.length);

      const prompt = `You are a quiz generator. Create exactly ${questionCount} multiple-choice questions at ${difficulty} difficulty level.

IMPORTANT: Base ALL questions ONLY on the following content. Do NOT use external knowledge.

Content:
${content}

Requirements:
- Generate EXACTLY ${questionCount} questions
- Each question must have EXACTLY 4 options
- Questions must test understanding of the provided content
- The correct_answer must be a number (0, 1, 2, or 3) indicating the index of the correct option
- Include a brief explanation for each answer`;

      console.log("Calling InvokeLLM...");

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  options: {
                    type: "array",
                    items: { type: "string" },
                    minItems: 4,
                    maxItems: 4
                  },
                  correct_answer: {
                    type: "number",
                    minimum: 0,
                    maximum: 3
                  },
                  explanation: { type: "string" }
                },
                required: ["question", "options", "correct_answer", "explanation"]
              },
              minItems: parseInt(questionCount)
            }
          },
          required: ["questions"]
        }
      });

      console.log("Quiz response received:", JSON.stringify(response, null, 2));

      // Robust extraction: Handle if response is string, {questions: [...]} or just [...]
      let rawQuestions = [];
      const parsedResponse = safeJsonParse(response, {
        fallback: response,
        verbose: true
      });

      if (Array.isArray(parsedResponse)) {
        rawQuestions = parsedResponse;
      } else if (parsedResponse?.questions && Array.isArray(parsedResponse.questions)) {
        rawQuestions = parsedResponse.questions;
      } else {
        throw new Error("Invalid AI response format. The AI might be having trouble formatting the quiz structure. Please try again with less content or a different difficulty.");
      }

      if (rawQuestions.length === 0) {
        toast.error("The AI couldn't generate any valid questions from the provided content.");
        setGenerating(false);
        return;
      }

      // Validate questions format
      const validQuestions = rawQuestions.filter(q =>
        q.question &&
        q.options &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        typeof q.correct_answer === 'number' &&
        q.correct_answer >= 0 &&
        q.correct_answer <= 3
      );

      if (validQuestions.length === 0) {
        toast.error("Invalid quiz format. Please try again.");
        setGenerating(false);
        return;
      }

      setQuiz(validQuestions);
      toast.success(`Generated ${validQuestions.length} questions!`);
      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setScore(0);
      setQuizCompleted(false);

      // Store start time for activity tracking
      // @ts-ignore
      window.quizStartTime = startTime;
    } catch (error) {
      console.error("Quiz generation error:", error);
      toast.error(error?.message || "Failed to generate quiz. Check console for details.");
    } finally {
      setGenerating(false);
    }
  };

  const handleAnswer = () => {
    if (selectedAnswer === null) return;

    const isCorrect = selectedAnswer === quiz[currentQuestion].correct_answer;
    if (isCorrect) setScore(prev => prev + 1);
    setShowResult(true);
  };

  const nextQuestion = async () => {
    if (currentQuestion < quiz.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setQuizCompleted(true);
      const finalScore = Math.round((score / quiz.length) * 100);

      if (finalScore >= 70) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#8B5CF6', '#EC4899', '#3B82F6']
        });
      }

      // @ts-ignore
      const timeSpent = window.quizStartTime ? Math.round((Date.now() - window.quizStartTime) / 60000) : 5;

      // @ts-ignore
      saveMutation.mutate({
        title: `Quiz - ${new Date().toLocaleDateString()}`,
        questions: quiz,
        difficulty,
        best_score: finalScore,
        attempts: 1,
        last_attempted: new Date().toISOString(),
      });

      // Track learning activity
      try {
        const material = source === "material" && materialId ? materials?.find(m => m.id === materialId) : null;
        await base44.entities.LearningActivity.create({
          activity_type: "quiz",
          material_id: material?.id,
          module_id: material?.module_id,
          topic: material?.title || "Custom quiz",
          performance_score: finalScore,
          time_spent_minutes: timeSpent,
          difficulty_level: difficulty,
          completed: true
        });
      } catch (e) {
        console.warn("Failed to log learning activity:", e);
      }

      // Check for achievements
      try {
        base44.functions.invoke('checkAchievements', {});
      } catch (e) { }
    }
  };

  const resetQuiz = () => {
    setQuiz(null);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setQuizCompleted(false);
  };

  if (generating) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <AILoadingState
          title="Neural Architecting"
          message={`Constructing ${questionCount} tailored questions from your ${source === 'text' ? 'custom notes' : 'study materials'}. Precision evaluation in progress...`}
        />
      </motion.div>
    );
  }

  if (quizCompleted) {
    const percentage = Math.round((score / quiz.length) * 100);
    const isExcellent = percentage >= 90;
    const isGood = percentage >= 70;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-pink-500/10" />
        <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl border-2 border-violet-200/60 p-10 text-center shadow-2xl shadow-violet-500/20">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center shadow-xl",
                isExcellent ? "bg-gradient-to-br from-emerald-400 to-teal-500" :
                  isGood ? "bg-gradient-to-br from-blue-400 to-indigo-500" :
                    "bg-gradient-to-br from-amber-400 to-orange-500"
              )}
            >
              <Trophy className="w-12 h-12 text-white" />
            </motion.div>
          </div>

          <div className="mt-8 mb-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-3">
              {isExcellent ? "Outstanding! 🎉" : isGood ? "Great Job! 💪" : "Keep Learning! 📚"}
            </h2>
            <p className="text-slate-600 text-lg">
              You scored <span className="font-bold text-slate-900">{score}</span> out of <span className="font-bold text-slate-900">{quiz.length}</span> questions
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="relative mb-8"
          >
            <div className="text-7xl font-black mb-2">
              <span className={cn(
                "bg-gradient-to-br bg-clip-text text-transparent",
                isExcellent ? "from-emerald-500 to-teal-600" :
                  isGood ? "from-blue-500 to-indigo-600" :
                    "from-amber-500 to-orange-600"
              )}>
                {percentage}%
              </span>
            </div>
            <div className="flex justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 + (i * 0.1) }}
                  className={cn(
                    "w-3 h-3 rounded-full transition-all",
                    i < Math.floor(percentage / 20)
                      ? isExcellent ? "bg-emerald-500 scale-125 shadow-lg shadow-emerald-500/50" :
                        isGood ? "bg-blue-500 scale-110" : "bg-amber-500"
                      : "bg-slate-200"
                  )}
                />
              ))}
            </div>
          </motion.div>

          <div className="flex justify-center gap-3">
            <Button
              onClick={resetQuiz}
              size="lg"
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/30 font-bold px-8 py-6 rounded-2xl transition-all hover:scale-105 active:scale-95"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              New Quiz
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (quiz) {
    const q = quiz[currentQuestion];
    return (
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-blue-500/5" />
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative bg-white/90 backdrop-blur-sm rounded-3xl border-2 border-violet-200/60 shadow-xl shadow-violet-500/10"
          >
            <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-6 rounded-t-[1.4rem]">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-lg font-bold">{currentQuestion + 1}</span>
                  </div>
                  <div>
                    <p className="text-xs text-violet-200 uppercase tracking-wider font-bold">Progress</p>
                    <p className="font-semibold text-sm">{currentQuestion + 1} of {quiz.length}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-violet-200 uppercase tracking-wider font-bold">Current Score</p>
                  <p className="text-xl font-bold">{score} <span className="opacity-50">/ {currentQuestion + (showResult ? 1 : 0)}</span></p>
                </div>
              </div>
              <div className="relative h-2 mt-4 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentQuestion + 1) / quiz.length) * 100}%` }}
                  className="absolute inset-x-0 top-0 h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                />
              </div>
            </div>

            <div className="p-8">
              <div className="text-xl font-bold text-slate-900 mb-8 leading-relaxed">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-2">{children}</p>,
                    strong: ({ children }) => <strong className="font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">{children}</strong>,
                    code: ({ children }) =>
                      <code className="bg-violet-100 text-violet-700 px-2 py-1 rounded-lg text-sm font-mono">{children}</code>,
                  }}
                >
                  {q.question}
                </ReactMarkdown>
              </div>

              <div className="space-y-4">
                {q.options.map((option, idx) => {
                  const isCorrect = idx === q.correct_answer;
                  const isSelected = selectedAnswer === idx;

                  return (
                    <motion.div
                      key={`${currentQuestion}-${idx}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      onClick={() => !showResult && setSelectedAnswer(idx)}
                      className={cn(
                        "group relative flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 overflow-hidden",
                        showResult && isCorrect && "border-emerald-400 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-lg shadow-emerald-500/20",
                        showResult && isSelected && !isCorrect && "border-red-400 bg-gradient-to-r from-red-50 to-rose-50 shadow-lg shadow-red-500/20",
                        !showResult && isSelected && "border-violet-400 bg-gradient-to-r from-violet-50 to-purple-50 shadow-lg shadow-violet-500/20 scale-[1.02]",
                        !showResult && !isSelected && "border-slate-200 hover:border-violet-300 hover:bg-violet-50/30 hover:shadow-md"
                      )}
                    >
                      <div className={cn(
                        "relative w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all font-bold text-xs shrink-0",
                        isSelected ? "border-violet-600 bg-violet-600 text-white" : "border-slate-200 bg-slate-50 text-slate-400 group-hover:border-violet-300 group-hover:text-violet-500"
                      )}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <div className="flex-1 relative">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <span className="text-slate-800 font-semibold">{children}</span>,
                          }}
                        >
                          {option}
                        </ReactMarkdown>
                      </div>
                      {showResult && isCorrect && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 animate-in zoom-in duration-500" />
                        </div>
                      )}
                      {showResult && isSelected && !isCorrect && (
                        <div className="flex items-center gap-2">
                          <XCircle className="w-6 h-6 text-red-600 shrink-0 animate-in zoom-in duration-500" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              <AnimatePresence>
                {showResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200/60 shadow-inner"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <p className="font-bold text-blue-900">Why this answer?</p>
                    </div>
                    <div className="text-slate-700 leading-relaxed text-sm">
                      <ReactMarkdown>{q.explanation}</ReactMarkdown>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-end mt-8 pt-6 border-t-2 border-slate-100">
                {!showResult ? (
                  <Button
                    onClick={handleAnswer}
                    disabled={selectedAnswer === null}
                    size="lg"
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-xl shadow-violet-500/30 px-10 py-7 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Check Answer
                  </Button>
                ) : (
                  <Button
                    onClick={nextQuestion}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl shadow-blue-500/30 px-10 py-7 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95"
                  >
                    {currentQuestion < quiz.length - 1 ? "Next Question" : "See Results"}
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-pink-500/5" />
      <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl border-2 border-violet-200/60 shadow-xl shadow-violet-500/10 p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-xl shadow-violet-500/30">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-2xl bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                Quiz Generator
              </h3>
              <p className="text-slate-500">Master your subjects with active recall</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-violet-50 border border-violet-100 px-4 py-2 rounded-xl">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-bold text-violet-700 uppercase tracking-wider">AI Powered</span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-slate-700 font-bold ml-1">Source Content</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">✨ Custom Text</SelectItem>
                  <SelectItem value="material">📚 From My Materials</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {source === "text" ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <Label className="text-slate-700 font-bold ml-1">Study Content</Label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your study notes, lecture content, or any text you want to be quizzed on..."
                rows={8}
                className="rounded-2xl border-slate-200 bg-white focus:ring-violet-500 transition-all text-base leading-relaxed"
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <Label className="text-slate-700 font-bold ml-1">Select Study Material</Label>
              <Select value={materialId} onValueChange={setMaterialId}>
                <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white">
                  <SelectValue placeholder="Choose a material from your library" />
                </SelectTrigger>
                <SelectContent>
                  {materials?.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <div className="flex items-center gap-2">
                        {m.title}
                      </div>
                    </SelectItem>
                  ))}
                  {(!materials || materials.length === 0) && (
                    <div className="p-4 text-center text-sm text-slate-500">
                      No materials yet. Upload some first!
                    </div>
                  )}
                </SelectContent>
              </Select>
            </motion.div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-700 font-bold ml-1">Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">🟢 Easy</SelectItem>
                  <SelectItem value="medium">🟡 Medium</SelectItem>
                  <SelectItem value="hard">🔴 Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700 font-bold ml-1">Questions</Label>
              <Select value={questionCount} onValueChange={setQuestionCount}>
                <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">05 Questions</SelectItem>
                  <SelectItem value="10">10 Questions</SelectItem>
                  <SelectItem value="15">15 Questions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed">
              <strong>Tip:</strong> The more content you provide, the better the quality of the questions generated. Try to include key definitions and concepts!
            </p>
          </div>

          <Button
            onClick={generateQuiz}
            disabled={generating || (source === "text" ? !text : !materialId)}
            size="lg"
            className="w-full h-16 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 hover:from-violet-700 hover:via-purple-700 hover:to-pink-700 shadow-2xl shadow-violet-500/40 text-white font-bold text-lg rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            {generating ? (
              <div className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Crafting Your Personalized Quiz...</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6" />
                <span>Generate Quiz</span>
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
