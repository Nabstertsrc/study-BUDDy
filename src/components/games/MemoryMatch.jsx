import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Trophy, Clock, Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const EMOJI_SETS = {
  easy: ["📚", "🧠", "✏️", "🎓", "💡", "🔬", "📐", "🎯"],
  medium: ["📚", "🧠", "✏️", "🎓", "💡", "🔬", "📐", "🎯", "🗺️", "⚗️", "📏", "🔭"],
  hard: ["📚", "🧠", "✏️", "🎓", "💡", "🔬", "📐", "🎯", "🗺️", "⚗️", "📏", "🔭", "🧬", "💻", "📖", "🎨"],
};

const GRID_CONFIG = {
  easy: { cols: 4, pairs: 8 },
  medium: { cols: 4, pairs: 12 },
  hard: { cols: 4, pairs: 16 },
};

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MemoryMatch() {
  const [difficulty, setDifficulty] = useState("easy");
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState(new Set());
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [bestScores, setBestScores] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("memory_best") || "{}");
    } catch { return {}; }
  });

  const initGame = useCallback((diff) => {
    const emojis = EMOJI_SETS[diff].slice(0, GRID_CONFIG[diff].pairs);
    const deck = shuffleArray([...emojis, ...emojis]).map((emoji, i) => ({
      id: i,
      emoji,
    }));
    setCards(deck);
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    setTime(0);
    setIsRunning(false);
    setGameOver(false);
  }, []);

  useEffect(() => { initGame(difficulty); }, [difficulty, initGame]);

  useEffect(() => {
    let interval;
    if (isRunning && !gameOver) {
      interval = setInterval(() => setTime(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, gameOver]);

  useEffect(() => {
    if (cards.length > 0 && matched.size === cards.length) {
      setGameOver(true);
      setIsRunning(false);
      const key = difficulty;
      const score = moves;
      if (!bestScores[key] || score < bestScores[key]) {
        const updated = { ...bestScores, [key]: score };
        setBestScores(updated);
        localStorage.setItem("memory_best", JSON.stringify(updated));
      }
    }
  }, [matched, cards.length, difficulty, moves, bestScores]);

  const handleFlip = (idx) => {
    if (flipped.length === 2 || flipped.includes(idx) || matched.has(idx)) return;
    if (!isRunning) setIsRunning(true);

    const newFlipped = [...flipped, idx];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [a, b] = newFlipped;
      if (cards[a].emoji === cards[b].emoji) {
        setTimeout(() => {
          setMatched(prev => new Set([...prev, a, b]));
          setFlipped([]);
        }, 400);
      } else {
        setTimeout(() => setFlipped([]), 800);
      }
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const getStars = () => {
    const { pairs } = GRID_CONFIG[difficulty];
    if (moves <= pairs) return 3;
    if (moves <= pairs * 1.5) return 2;
    return 1;
  };

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
                ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/25"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {d}
          </button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => initGame(difficulty)}
          className="ml-auto rounded-xl"
        >
          <RotateCcw className="w-4 h-4 mr-2" /> Reset
        </Button>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-50">
            <Zap className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Moves</p>
            <p className="text-lg font-black text-slate-900">{moves}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-50">
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Time</p>
            <p className="text-lg font-black text-slate-900">{formatTime(time)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-50">
            <Trophy className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Best</p>
            <p className="text-lg font-black text-slate-900">{bestScores[difficulty] ?? "—"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mr-1">Matched</p>
          <p className="text-lg font-black text-emerald-600">{matched.size / 2}/{cards.length / 2}</p>
        </div>
      </div>

      {/* Game board */}
      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: `repeat(${GRID_CONFIG[difficulty].cols}, minmax(0, 1fr))`,
        }}
      >
        {cards.map((card, idx) => {
          const isFlipped = flipped.includes(idx) || matched.has(idx);
          const isMatched = matched.has(idx);
          return (
            <motion.button
              key={card.id}
              onClick={() => handleFlip(idx)}
              whileHover={!isFlipped ? { scale: 1.05 } : {}}
              whileTap={!isFlipped ? { scale: 0.95 } : {}}
              className={`aspect-square rounded-2xl text-3xl sm:text-4xl flex items-center justify-center cursor-pointer transition-all duration-300 select-none ${
                isMatched
                  ? "bg-gradient-to-br from-emerald-100 to-teal-100 border-2 border-emerald-300 shadow-lg shadow-emerald-500/10"
                  : isFlipped
                  ? "bg-white border-2 border-violet-300 shadow-lg shadow-violet-500/10"
                  : "bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700 hover:from-violet-700 hover:to-purple-800 hover:border-violet-500 shadow-md"
              }`}
            >
              <AnimatePresence mode="wait">
                {isFlipped ? (
                  <motion.span
                    key="front"
                    initial={{ rotateY: 90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={{ rotateY: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {card.emoji}
                  </motion.span>
                ) : (
                  <motion.span
                    key="back"
                    initial={{ rotateY: -90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={{ rotateY: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-xl text-slate-500"
                  >
                    ?
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* Win overlay */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 30 }}
              animate={{ y: 0 }}
              className="bg-white rounded-3xl p-8 sm:p-10 text-center shadow-2xl max-w-md mx-4"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-amber-500/30">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Well Done! 🎉</h2>
              <p className="text-slate-500 mb-4">
                Completed in <span className="font-bold text-slate-900">{moves} moves</span> and{" "}
                <span className="font-bold text-slate-900">{formatTime(time)}</span>
              </p>
              <div className="flex justify-center gap-1 mb-6">
                {[1, 2, 3].map(s => (
                  <Star
                    key={s}
                    className={`w-8 h-8 ${s <= getStars() ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
                  />
                ))}
              </div>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => initGame(difficulty)} className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/25">
                  Play Again
                </Button>
                <Button variant="outline" onClick={() => setGameOver(false)} className="rounded-xl">
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
