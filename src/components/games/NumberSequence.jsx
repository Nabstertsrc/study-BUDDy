import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Trophy, Clock, Zap, Star, ArrowRight, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const SEQUENCES = {
  easy: [
    { sequence: [2, 4, 6, 8], answer: 10, hint: "Add 2 each time" },
    { sequence: [5, 10, 15, 20], answer: 25, hint: "Add 5 each time" },
    { sequence: [3, 6, 9, 12], answer: 15, hint: "Multiples of 3" },
    { sequence: [1, 3, 5, 7], answer: 9, hint: "Odd numbers" },
    { sequence: [10, 20, 30, 40], answer: 50, hint: "Add 10 each time" },
    { sequence: [100, 90, 80, 70], answer: 60, hint: "Subtract 10 each time" },
    { sequence: [4, 8, 12, 16], answer: 20, hint: "Add 4 each time" },
    { sequence: [1, 4, 7, 10], answer: 13, hint: "Add 3 each time" },
    { sequence: [50, 45, 40, 35], answer: 30, hint: "Subtract 5 each time" },
    { sequence: [7, 14, 21, 28], answer: 35, hint: "Multiples of 7" },
  ],
  medium: [
    { sequence: [1, 1, 2, 3, 5], answer: 8, hint: "Fibonacci sequence" },
    { sequence: [2, 4, 8, 16], answer: 32, hint: "Double each time" },
    { sequence: [1, 4, 9, 16], answer: 25, hint: "Perfect squares" },
    { sequence: [3, 9, 27, 81], answer: 243, hint: "Powers of 3" },
    { sequence: [1, 3, 6, 10], answer: 15, hint: "Triangular numbers" },
    { sequence: [2, 6, 12, 20], answer: 30, hint: "n × (n+1)" },
    { sequence: [1, 8, 27, 64], answer: 125, hint: "Perfect cubes" },
    { sequence: [5, 8, 13, 21], answer: 34, hint: "Add previous two" },
    { sequence: [256, 128, 64, 32], answer: 16, hint: "Halve each time" },
    { sequence: [1, 2, 4, 7, 11], answer: 16, hint: "Differences increase by 1" },
  ],
  hard: [
    { sequence: [1, 1, 2, 3, 5, 8], answer: 13, hint: "Fibonacci" },
    { sequence: [2, 3, 5, 7, 11], answer: 13, hint: "Prime numbers" },
    { sequence: [1, 4, 27, 256], answer: 3125, hint: "n^n pattern" },
    { sequence: [0, 1, 1, 2, 4, 7], answer: 13, hint: "Tribonacci" },
    { sequence: [2, 5, 10, 17, 26], answer: 37, hint: "n² + 1" },
    { sequence: [1, 3, 7, 15, 31], answer: 63, hint: "2^n − 1" },
    { sequence: [3, 5, 9, 17, 33], answer: 65, hint: "2n − 1" },
    { sequence: [1, 2, 6, 24, 120], answer: 720, hint: "Factorials" },
    { sequence: [4, 6, 9, 13, 18], answer: 24, hint: "Differences increase" },
    { sequence: [2, 6, 18, 54, 162], answer: 486, hint: "Multiply by 3" },
  ],
};

export default function NumberSequence() {
  const [difficulty, setDifficulty] = useState("easy");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState(null); // "correct" | "wrong" | null
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [shuffledSequences, setShuffledSequences] = useState([]);
  const [bestScores, setBestScores] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("numseq_best") || "{}");
    } catch { return {}; }
  });

  const shuffleSequences = useCallback((diff) => {
    const seqs = [...SEQUENCES[diff]];
    for (let i = seqs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [seqs[i], seqs[j]] = [seqs[j], seqs[i]];
    }
    return seqs;
  }, []);

  const resetGame = useCallback((diff) => {
    setShuffledSequences(shuffleSequences(diff));
    setCurrentIdx(0);
    setUserAnswer("");
    setShowHint(false);
    setFeedback(null);
    setScore(0);
    setStreak(0);
    setQuestionsAnswered(0);
    setTime(0);
    setIsRunning(false);
  }, [shuffleSequences]);

  useEffect(() => { resetGame(difficulty); }, [difficulty, resetGame]);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => setTime(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const currentSeq = shuffledSequences[currentIdx];
  const totalQuestions = shuffledSequences.length;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userAnswer.trim() || !currentSeq) return;
    if (!isRunning) setIsRunning(true);

    const parsed = parseInt(userAnswer, 10);
    const isCorrect = parsed === currentSeq.answer;

    setFeedback(isCorrect ? "correct" : "wrong");
    setQuestionsAnswered(q => q + 1);

    if (isCorrect) {
      const bonus = showHint ? 1 : 2;
      setScore(s => s + bonus);
      setStreak(s => s + 1);
    } else {
      setStreak(0);
    }

    setTimeout(() => {
      setFeedback(null);
      setShowHint(false);
      setUserAnswer("");
      if (currentIdx < totalQuestions - 1) {
        setCurrentIdx(i => i + 1);
      } else {
        setIsRunning(false);
        const finalScore = score + (isCorrect ? (showHint ? 1 : 2) : 0);
        const key = difficulty;
        if (!bestScores[key] || finalScore > bestScores[key]) {
          const updated = { ...bestScores, [key]: finalScore };
          setBestScores(updated);
          localStorage.setItem("numseq_best", JSON.stringify(updated));
        }
      }
    }, 1200);
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const isFinished = questionsAnswered >= totalQuestions && currentIdx >= totalQuestions - 1 && !feedback;

  return (
    <div className="space-y-6">
      {/* Difficulty selector */}
      <div className="flex flex-wrap items-center gap-3">
        {["easy", "medium", "hard"].map(d => (
          <button
            key={d}
            onClick={() => setDifficulty(d)}
            className={`px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${
              difficulty === d
                ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/25"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {d}
          </button>
        ))}
        <Button variant="outline" size="sm" onClick={() => resetGame(difficulty)} className="ml-auto rounded-xl">
          <RotateCcw className="w-4 h-4 mr-2" /> Reset
        </Button>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap items-center gap-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-50"><Star className="w-4 h-4 text-emerald-600" /></div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Score</p>
            <p className="text-lg font-black text-slate-900">{score}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-orange-50"><Zap className="w-4 h-4 text-orange-600" /></div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Streak</p>
            <p className="text-lg font-black text-slate-900">{streak}🔥</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-50"><Clock className="w-4 h-4 text-blue-600" /></div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Time</p>
            <p className="text-lg font-black text-slate-900">{formatTime(time)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mr-1">Progress</p>
          <p className="text-lg font-black text-blue-600">{questionsAnswered}/{totalQuestions}</p>
        </div>
      </div>

      {/* Game area */}
      {!isFinished && currentSeq && (
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden"
        >
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 sm:p-8">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">
              Question {currentIdx + 1} of {totalQuestions}
            </p>
            <p className="text-slate-300 text-sm mb-4">Find the next number in the sequence:</p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {currentSeq.sequence.map((n, i) => (
                <React.Fragment key={i}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-white font-black text-lg sm:text-xl"
                  >
                    {n}
                  </motion.div>
                  {i < currentSeq.sequence.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                </React.Fragment>
              ))}
              <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-2 border-dashed border-blue-400/60 flex items-center justify-center text-blue-400 font-bold text-xl animate-pulse">
                ?
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="number"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Your answer..."
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-lg font-bold outline-none transition-all"
                autoFocus
                disabled={!!feedback}
              />
              <Button
                type="submit"
                disabled={!userAnswer.trim() || !!feedback}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-500/25 px-6 h-12 text-base font-bold"
              >
                Check
              </Button>
            </form>

            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => setShowHint(true)}
                className="text-sm text-slate-400 hover:text-blue-600 transition-colors"
                disabled={showHint}
              >
                {showHint ? `💡 ${currentSeq.hint}` : "Need a hint?"}
              </button>
            </div>

            {/* Feedback overlay */}
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`mt-4 p-4 rounded-xl flex items-center gap-3 ${
                    feedback === "correct"
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                      : "bg-red-50 border border-red-200 text-red-700"
                  }`}
                >
                  {feedback === "correct" ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="font-bold">
                    {feedback === "correct"
                      ? `Correct! The answer is ${currentSeq.answer}.`
                      : `Not quite. The answer was ${currentSeq.answer}. ${currentSeq.hint}.`}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Finished overlay */}
      <AnimatePresence>
        {isFinished && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-slate-200/60 shadow-xl p-8 sm:p-10 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/30">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Round Complete! 🧠</h2>
            <p className="text-slate-500 mb-2">
              Score: <span className="font-bold text-slate-900">{score}/{totalQuestions * 2}</span> •
              Time: <span className="font-bold text-slate-900">{formatTime(time)}</span>
            </p>
            <p className="text-sm text-slate-400 mb-6">
              Best: {bestScores[difficulty] ?? "—"} points
            </p>
            <Button onClick={() => resetGame(difficulty)} className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-500/25">
              Play Again
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
