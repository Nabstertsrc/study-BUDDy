import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Trophy, Clock, Zap, Star, Shuffle, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const WORD_LISTS = {
  easy: [
    { word: "STUDY", hint: "What you do to learn" },
    { word: "BRAIN", hint: "Thinking organ" },
    { word: "LEARN", hint: "Gain knowledge" },
    { word: "BOOK", hint: "Read this for class" },
    { word: "NOTES", hint: "Written summaries" },
    { word: "CLASS", hint: "Where lectures happen" },
    { word: "EXAM", hint: "A test of knowledge" },
    { word: "GRADE", hint: "Score on an assignment" },
    { word: "QUIZ", hint: "A short test" },
    { word: "MATH", hint: "Numbers and equations" },
    { word: "READ", hint: "Look at text" },
    { word: "WRITE", hint: "Put words on paper" },
  ],
  medium: [
    { word: "THESIS", hint: "Main argument in an essay" },
    { word: "CAMPUS", hint: "University grounds" },
    { word: "SEMINAR", hint: "Small group class" },
    { word: "DIPLOMA", hint: "Graduation document" },
    { word: "LECTURE", hint: "Professor talking to students" },
    { word: "JOURNAL", hint: "Academic publication" },
    { word: "FACULTY", hint: "Teaching staff" },
    { word: "SCHOLAR", hint: "Learned person" },
    { word: "TUTOR", hint: "Personal teacher" },
    { word: "CONCEPT", hint: "An abstract idea" },
    { word: "FORMULA", hint: "Mathematical expression" },
    { word: "THEORY", hint: "Explanation of phenomena" },
  ],
  hard: [
    { word: "CURRICULUM", hint: "Course plan" },
    { word: "HYPOTHESIS", hint: "Scientific guess" },
    { word: "BIBLIOGRAPHY", hint: "List of references" },
    { word: "DISSERTATION", hint: "Long research paper" },
    { word: "METHODOLOGY", hint: "Research approach" },
    { word: "PHILOSOPHY", hint: "Love of wisdom" },
    { word: "ALGORITHM", hint: "Step-by-step procedure" },
    { word: "EMPIRICAL", hint: "Based on observation" },
    { word: "PARADIGM", hint: "Model or pattern" },
    { word: "SYNTHESIS", hint: "Combining ideas" },
    { word: "COGNITION", hint: "Mental processing" },
    { word: "DEDUCTION", hint: "Logical reasoning" },
  ],
};

function scramble(word) {
  const arr = word.split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  // Ensure it's actually scrambled
  const result = arr.join("");
  if (result === word && word.length > 1) return scramble(word);
  return result;
}

export default function WordScramble() {
  const [difficulty, setDifficulty] = useState("easy");
  const [words, setWords] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [scrambled, setScrambled] = useState("");
  const [userInput, setUserInput] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const inputRef = useRef(null);
  const [bestScores, setBestScores] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("wordscramble_best") || "{}");
    } catch { return {}; }
  });

  const initGame = useCallback((diff) => {
    const list = [...WORD_LISTS[diff]];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    setWords(list);
    setCurrentIdx(0);
    setScrambled(scramble(list[0].word));
    setUserInput("");
    setShowHint(false);
    setFeedback(null);
    setScore(0);
    setStreak(0);
    setAnswered(0);
    setTime(0);
    setIsRunning(false);
  }, []);

  useEffect(() => { initGame(difficulty); }, [difficulty, initGame]);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => setTime(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (words[currentIdx]) {
      setScrambled(scramble(words[currentIdx].word));
    }
  }, [currentIdx, words]);

  const currentWord = words[currentIdx];
  const totalWords = words.length;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userInput.trim() || !currentWord) return;
    if (!isRunning) setIsRunning(true);

    const isCorrect = userInput.trim().toUpperCase() === currentWord.word;
    setFeedback(isCorrect ? "correct" : "wrong");
    setAnswered(a => a + 1);

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
      setUserInput("");
      if (currentIdx < totalWords - 1) {
        setCurrentIdx(i => i + 1);
      } else {
        setIsRunning(false);
        const finalScore = score + (isCorrect ? (showHint ? 1 : 2) : 0);
        const key = difficulty;
        if (!bestScores[key] || finalScore > bestScores[key]) {
          const updated = { ...bestScores, [key]: finalScore };
          setBestScores(updated);
          localStorage.setItem("wordscramble_best", JSON.stringify(updated));
        }
      }
      inputRef.current?.focus();
    }, 1200);
  };

  const handleReshuffle = () => {
    if (currentWord) setScrambled(scramble(currentWord.word));
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const isFinished = answered >= totalWords && currentIdx >= totalWords - 1 && !feedback;

  return (
    <div className="space-y-6">
      {/* Difficulty */}
      <div className="flex flex-wrap items-center gap-3">
        {["easy", "medium", "hard"].map(d => (
          <button
            key={d}
            onClick={() => setDifficulty(d)}
            className={`px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${
              difficulty === d
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {d}
          </button>
        ))}
        <Button variant="outline" size="sm" onClick={() => initGame(difficulty)} className="ml-auto rounded-xl">
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
          <p className="text-lg font-black text-emerald-600">{answered}/{totalWords}</p>
        </div>
      </div>

      {/* Game area */}
      {!isFinished && currentWord && (
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden"
        >
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 sm:p-8">
            <p className="text-[10px] text-emerald-200 font-bold uppercase tracking-widest mb-3">
              Word {currentIdx + 1} of {totalWords}
            </p>
            <p className="text-emerald-100 text-sm mb-5">Unscramble this word:</p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {scrambled.split("").map((letter, i) => (
                <motion.div
                  key={`${i}-${letter}`}
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: i * 0.06, type: "spring" }}
                  className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-white/15 backdrop-blur border border-white/30 flex items-center justify-center text-white font-black text-xl sm:text-2xl shadow-lg"
                >
                  {letter}
                </motion.div>
              ))}
              <button
                onClick={handleReshuffle}
                className="ml-2 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                title="Reshuffle"
              >
                <Shuffle className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value.toUpperCase())}
                placeholder="Type your answer..."
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-lg font-bold uppercase tracking-wider outline-none transition-all"
                autoFocus
                disabled={!!feedback}
                maxLength={currentWord.word.length + 2}
              />
              <Button
                type="submit"
                disabled={!userInput.trim() || !!feedback}
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25 px-6 h-12 text-base font-bold"
              >
                Submit
              </Button>
            </form>

            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => setShowHint(true)}
                className="text-sm text-slate-400 hover:text-emerald-600 transition-colors"
                disabled={showHint}
              >
                {showHint ? `💡 ${currentWord.hint}` : "Need a hint?"}
              </button>
              <span className="text-xs text-slate-400">{currentWord.word.length} letters</span>
            </div>

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
                      ? `Correct! 🎉`
                      : `Not quite. The word was "${currentWord.word}".`}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Finished */}
      <AnimatePresence>
        {isFinished && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-slate-200/60 shadow-xl p-8 sm:p-10 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/30">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">All Words Done! 🔤</h2>
            <p className="text-slate-500 mb-2">
              Score: <span className="font-bold text-slate-900">{score}/{totalWords * 2}</span> •
              Time: <span className="font-bold text-slate-900">{formatTime(time)}</span>
            </p>
            <p className="text-sm text-slate-400 mb-6">Best: {bestScores[difficulty] ?? "—"} points</p>
            <Button onClick={() => initGame(difficulty)} className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25">
              Play Again
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
