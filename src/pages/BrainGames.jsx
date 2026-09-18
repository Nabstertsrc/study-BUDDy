import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gamepad2,
  Brain,
  Hash,
  Type,
  Grid3X3,
  ArrowLeft,
  Sparkles,
  Trophy,
  Zap,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import MemoryMatch from "@/components/games/MemoryMatch";
import NumberSequence from "@/components/games/NumberSequence";
import WordScramble from "@/components/games/WordScramble";
import LogicGrid from "@/components/games/LogicGrid";

const GAMES = [
  {
    id: "memory",
    name: "Memory Match",
    description: "Flip cards to find matching pairs. Train your working memory and visual recall.",
    icon: Brain,
    color: "from-violet-500 to-purple-600",
    shadowColor: "shadow-violet-500/20",
    borderColor: "border-violet-200",
    bgLight: "bg-violet-50",
    textColor: "text-violet-600",
    skills: ["Working Memory", "Visual Recall", "Focus"],
    component: MemoryMatch,
  },
  {
    id: "numbers",
    name: "Number Sequence",
    description: "Identify the pattern and predict the next number. Sharpen analytical thinking.",
    icon: Hash,
    color: "from-blue-500 to-cyan-600",
    shadowColor: "shadow-blue-500/20",
    borderColor: "border-blue-200",
    bgLight: "bg-blue-50",
    textColor: "text-blue-600",
    skills: ["Pattern Recognition", "Logical Thinking", "Math Skills"],
    component: NumberSequence,
  },
  {
    id: "words",
    name: "Word Scramble",
    description: "Unscramble academic words to build vocabulary and strengthen language processing.",
    icon: Type,
    color: "from-emerald-500 to-teal-600",
    shadowColor: "shadow-emerald-500/20",
    borderColor: "border-emerald-200",
    bgLight: "bg-emerald-50",
    textColor: "text-emerald-600",
    skills: ["Vocabulary", "Language Skills", "Cognitive Speed"],
    component: WordScramble,
  },
  {
    id: "sudoku",
    name: "Logic Grid",
    description: "Fill the grid so every row, column, and box contains each number exactly once.",
    icon: Grid3X3,
    color: "from-amber-500 to-orange-600",
    shadowColor: "shadow-amber-500/20",
    borderColor: "border-amber-200",
    bgLight: "bg-amber-50",
    textColor: "text-amber-600",
    skills: ["Deductive Reasoning", "Systematic Thinking", "Patience"],
    component: LogicGrid,
  },
];

function GameCard({ game, onClick, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
    >
      <button
        onClick={onClick}
        className={`w-full text-left bg-white rounded-3xl border ${game.borderColor} shadow-sm hover:shadow-xl ${game.shadowColor} transition-all duration-300 overflow-hidden group`}
      >
        {/* Card Header Gradient */}
        <div className={`bg-gradient-to-br ${game.color} p-6 sm:p-8 relative overflow-hidden`}>
          <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-white/5 blur-xl" />
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <game.icon className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-black text-white mb-1">{game.name}</h3>
            <p className="text-sm text-white/80 leading-relaxed">{game.description}</p>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap gap-2">
            {game.skills.map(skill => (
              <span
                key={skill}
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${game.bgLight} ${game.textColor}`}
              >
                {skill}
              </span>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm font-bold text-slate-400 group-hover:text-slate-900 transition-colors">
            <Gamepad2 className="w-4 h-4" />
            <span>Play Now</span>
            <span className="ml-auto text-lg group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </div>
      </button>
    </motion.div>
  );
}

export default function BrainGames() {
  const [activeGame, setActiveGame] = useState(null);

  const selectedGame = GAMES.find(g => g.id === activeGame);

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-amber-600 mb-1.5 sm:mb-2">
          <Sparkles className="w-4 h-4" />
          <span className="text-xs sm:text-sm font-semibold tracking-wide uppercase">Brain Training</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {activeGame ? selectedGame?.name : "Brain Games"}
            </h1>
            <p className="text-slate-500 mt-1 text-sm sm:text-base max-w-2xl">
              {activeGame
                ? selectedGame?.description
                : "Boost cognitive skills with fun, study-themed puzzles. Train memory, pattern recognition, vocabulary, and logical reasoning."
              }
            </p>
          </div>
          {activeGame && (
            <Button
              variant="outline"
              onClick={() => setActiveGame(null)}
              className="rounded-xl shrink-0"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> All Games
            </Button>
          )}
        </div>
      </div>

      {/* Benefits banner (only on game selection screen) */}
      {!activeGame && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-5 sm:p-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
                <Brain className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Cognitive Training</p>
                <p className="text-slate-400 text-xs">Strengthen neural pathways</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Study Breaks</p>
                <p className="text-slate-400 text-xs">Productive micro-breaks</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Target className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Track Progress</p>
                <p className="text-slate-400 text-xs">Best scores saved locally</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Game selection grid */}
      <AnimatePresence mode="wait">
        {!activeGame ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6"
          >
            {GAMES.map((game, i) => (
              <GameCard
                key={game.id}
                game={game}
                index={i}
                onClick={() => setActiveGame(game.id)}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key={activeGame}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          >
            {selectedGame && <selectedGame.component />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
