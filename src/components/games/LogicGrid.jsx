import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Trophy, Clock, Zap, Star, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

// Generate a valid Sudoku-style puzzle
function generatePuzzle(size) {
  // Create a solved grid using backtracking
  const grid = Array.from({ length: size }, () => Array(size).fill(0));
  
  function isValid(grid, row, col, num) {
    // Check row
    if (grid[row].includes(num)) return false;
    // Check column
    if (grid.some(r => r[col] === num)) return false;
    // Check box
    const boxSize = size === 4 ? 2 : 3;
    const boxRow = Math.floor(row / boxSize) * boxSize;
    const boxCol = Math.floor(col / boxSize) * boxSize;
    for (let r = boxRow; r < boxRow + boxSize; r++) {
      for (let c = boxCol; c < boxCol + boxSize; c++) {
        if (grid[r][c] === num) return false;
      }
    }
    return true;
  }

  function solve(grid) {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === 0) {
          const nums = Array.from({ length: size }, (_, i) => i + 1);
          // Shuffle for randomness
          for (let i = nums.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [nums[i], nums[j]] = [nums[j], nums[i]];
          }
          for (const num of nums) {
            if (isValid(grid, r, c, num)) {
              grid[r][c] = num;
              if (solve(grid)) return true;
              grid[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  solve(grid);
  return grid;
}

function createPuzzle(size, removeCount) {
  const solution = generatePuzzle(size);
  const puzzle = solution.map(r => [...r]);
  
  let removed = 0;
  const positions = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      positions.push([r, c]);
    }
  }
  // Shuffle positions
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  for (const [r, c] of positions) {
    if (removed >= removeCount) break;
    puzzle[r][c] = 0;
    removed++;
  }

  return { puzzle, solution };
}

const CONFIGS = {
  easy: { size: 4, remove: 6, label: "4×4 Grid" },
  medium: { size: 4, remove: 10, label: "4×4 Grid" },
  hard: { size: 9, remove: 40, label: "9×9 Grid" },
};

export default function LogicGrid() {
  const [difficulty, setDifficulty] = useState("easy");
  const [puzzle, setPuzzle] = useState([]);
  const [solution, setSolution] = useState([]);
  const [userGrid, setUserGrid] = useState([]);
  const [isGiven, setIsGiven] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [errors, setErrors] = useState(new Set());
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [moveCount, setMoveCount] = useState(0);
  const [bestTimes, setBestTimes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("logicgrid_best") || "{}");
    } catch { return {}; }
  });

  const initGame = useCallback((diff) => {
    const cfg = CONFIGS[diff];
    const { puzzle: p, solution: s } = createPuzzle(cfg.size, cfg.remove);
    setPuzzle(p);
    setSolution(s);
    setUserGrid(p.map(r => [...r]));
    setIsGiven(p.map(r => r.map(c => c !== 0)));
    setSelectedCell(null);
    setErrors(new Set());
    setTime(0);
    setIsRunning(false);
    setGameOver(false);
    setMoveCount(0);
  }, []);

  useEffect(() => { initGame(difficulty); }, [difficulty, initGame]);

  useEffect(() => {
    let interval;
    if (isRunning && !gameOver) {
      interval = setInterval(() => setTime(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, gameOver]);

  // Check for win
  useEffect(() => {
    if (userGrid.length === 0 || gameOver) return;
    const size = userGrid.length;
    let allFilled = true;
    let allCorrect = true;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (userGrid[r][c] === 0) { allFilled = false; break; }
        if (userGrid[r][c] !== solution[r][c]) allCorrect = false;
      }
      if (!allFilled) break;
    }
    if (allFilled && allCorrect) {
      setGameOver(true);
      setIsRunning(false);
      const key = difficulty;
      if (!bestTimes[key] || time < bestTimes[key]) {
        const updated = { ...bestTimes, [key]: time };
        setBestTimes(updated);
        localStorage.setItem("logicgrid_best", JSON.stringify(updated));
      }
    }
  }, [userGrid, solution, gameOver, difficulty, time, bestTimes]);

  const handleCellClick = (r, c) => {
    if (isGiven[r]?.[c] || gameOver) return;
    setSelectedCell([r, c]);
  };

  const handleNumberInput = (num) => {
    if (!selectedCell || gameOver) return;
    if (!isRunning) setIsRunning(true);
    const [r, c] = selectedCell;
    const newGrid = userGrid.map(row => [...row]);
    newGrid[r][c] = num;
    setUserGrid(newGrid);
    setMoveCount(m => m + 1);

    // Check if correct
    const errKey = `${r}-${c}`;
    if (num !== 0 && num !== solution[r][c]) {
      setErrors(prev => new Set([...prev, errKey]));
    } else {
      setErrors(prev => {
        const next = new Set(prev);
        next.delete(errKey);
        return next;
      });
    }
  };

  const handleKeyDown = (e) => {
    if (!selectedCell || gameOver) return;
    const size = CONFIGS[difficulty].size;
    const num = parseInt(e.key, 10);
    if (num >= 1 && num <= size) {
      handleNumberInput(num);
    } else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
      handleNumberInput(0);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const size = CONFIGS[difficulty].size;
  const boxSize = size === 4 ? 2 : 3;

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
                ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-500/25"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {d} <span className="text-[10px] opacity-70 ml-1">{CONFIGS[d].label}</span>
          </button>
        ))}
        <Button variant="outline" size="sm" onClick={() => initGame(difficulty)} className="ml-auto rounded-xl">
          <RotateCcw className="w-4 h-4 mr-2" /> New Puzzle
        </Button>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap items-center gap-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-50"><Clock className="w-4 h-4 text-blue-600" /></div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Time</p>
            <p className="text-lg font-black text-slate-900">{formatTime(time)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-violet-50"><Zap className="w-4 h-4 text-violet-600" /></div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Moves</p>
            <p className="text-lg font-black text-slate-900">{moveCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-red-50"><AlertTriangle className="w-4 h-4 text-red-600" /></div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Errors</p>
            <p className="text-lg font-black text-red-600">{errors.size}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <div className="p-2 rounded-lg bg-amber-50"><Trophy className="w-4 h-4 text-amber-600" /></div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Best</p>
            <p className="text-lg font-black text-slate-900">{bestTimes[difficulty] ? formatTime(bestTimes[difficulty]) : "—"}</p>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex justify-center">
        <div
          className="grid bg-slate-800 rounded-2xl p-1 shadow-xl gap-[1px]"
          style={{
            gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
            maxWidth: size === 4 ? "280px" : "420px",
            width: "100%",
          }}
        >
          {userGrid.map((row, r) =>
            row.map((cell, c) => {
              const given = isGiven[r]?.[c];
              const selected = selectedCell && selectedCell[0] === r && selectedCell[1] === c;
              const hasError = errors.has(`${r}-${c}`);
              const isCorrect = cell !== 0 && cell === solution[r]?.[c] && !given;

              // Box borders
              const borderRight = (c + 1) % boxSize === 0 && c < size - 1;
              const borderBottom = (r + 1) % boxSize === 0 && r < size - 1;

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  className={`aspect-square flex items-center justify-center font-black transition-all text-base sm:text-lg ${
                    size === 9 ? "text-sm sm:text-base" : "text-lg sm:text-xl"
                  } ${
                    selected
                      ? "bg-amber-100 ring-2 ring-amber-400 z-10"
                      : given
                      ? "bg-slate-100"
                      : hasError
                      ? "bg-red-50"
                      : isCorrect
                      ? "bg-emerald-50"
                      : "bg-white hover:bg-slate-50"
                  } ${borderRight ? "mr-[2px]" : ""} ${borderBottom ? "mb-[2px]" : ""} ${
                    given ? "text-slate-900 cursor-default" : hasError ? "text-red-500 cursor-pointer" : isCorrect ? "text-emerald-600 cursor-pointer" : "text-blue-600 cursor-pointer"
                  }`}
                  style={{
                    borderRadius: 
                      (r === 0 && c === 0) ? "0.75rem 0 0 0" :
                      (r === 0 && c === size - 1) ? "0 0.75rem 0 0" :
                      (r === size - 1 && c === 0) ? "0 0 0 0.75rem" :
                      (r === size - 1 && c === size - 1) ? "0 0 0.75rem 0" : "0"
                  }}
                >
                  {cell !== 0 ? cell : ""}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Number input buttons */}
      <div className="flex justify-center">
        <div className="flex flex-wrap gap-2 justify-center">
          {Array.from({ length: size }, (_, i) => i + 1).map(num => (
            <motion.button
              key={num}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleNumberInput(num)}
              disabled={!selectedCell || gameOver}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white border border-slate-200 text-slate-900 font-black text-lg hover:bg-amber-50 hover:border-amber-300 transition-all shadow-sm disabled:opacity-40"
            >
              {num}
            </motion.button>
          ))}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleNumberInput(0)}
            disabled={!selectedCell || gameOver}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 font-bold text-sm hover:bg-red-50 hover:border-red-300 transition-all shadow-sm disabled:opacity-40"
          >
            ✕
          </motion.button>
        </div>
      </div>

      <p className="text-center text-xs text-slate-400">
        {size === 4 ? "Fill each row, column, and 2×2 box with 1–4" : "Fill each row, column, and 3×3 box with 1–9"}
        {" "}• Click a cell then tap a number or use your keyboard
      </p>

      {/* Win */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 30 }}
              animate={{ y: 0 }}
              className="bg-white rounded-3xl p-8 sm:p-10 text-center shadow-2xl max-w-md mx-4"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-amber-500/30">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Puzzle Solved! 🧩</h2>
              <p className="text-slate-500 mb-2">
                Completed in <span className="font-bold text-slate-900">{formatTime(time)}</span> with{" "}
                <span className="font-bold text-slate-900">{moveCount} moves</span>
              </p>
              <p className="text-sm text-slate-400 mb-6">
                {errors.size === 0 ? "Perfect — zero errors! ⭐" : `${errors.size} errors along the way`}
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => initGame(difficulty)} className="rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-lg shadow-amber-500/25">
                  New Puzzle
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
