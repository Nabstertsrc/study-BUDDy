window.onerror = function (msg, url, line, col, error) {
    alert("Error: " + msg + "\nLine: " + line);
    return false;
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 600;
canvas.height = 600;
const scoreEl = document.getElementById('score-val');
const highScoreEl = document.getElementById('high-score-val');
const levelEl = document.getElementById('level-val');
const timerEl = document.getElementById('timer-val');
const targetDisplay = document.getElementById('target-color-display');
const goalHint = document.getElementById('goal-hint');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayMsg = document.getElementById('overlay-msg');
const startBtn = document.getElementById('start-btn');
const skinBtns = document.querySelectorAll('.skin-btn');
const catBtns = document.querySelectorAll('.cat-btn');
const muteBtn = document.getElementById('mute-btn');
const readyOverlay = document.getElementById('ready-overlay');
const speedSlider = document.getElementById('speed-slider');
const speedValue = document.getElementById('speed-value');

// Constants
const GRID_SIZE = 20;
const TILE_COUNT = 30; // 600 / 20
canvas.width = canvas.height = 600;

// Audio Setup
let audioCtx = null;
const AUDIO = {
    bg: null
};

try {
    AUDIO.bg = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3');
    AUDIO.bg.loop = true;
    AUDIO.bg.volume = 0.4;
    AUDIO.bg.addEventListener('error', (e) => {
        console.warn("BGM failed to load:", AUDIO.bg.src, e);
        AUDIO.bg.dataset.error = "true";
    });
} catch (e) {
    console.warn("Audio creation failed", e);
    AUDIO.bg = { play: () => Promise.resolve(), pause: () => { }, dataset: { error: "true" } };
}

let isMuted = false;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSynth(type) {
    if (isMuted) return;
    initAudio();
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    if (type === 'success') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1);
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.2);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    } else if (type === 'fail') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.linearRampToValueAtTime(55, now + 0.4);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
    }
}

// Colors
const COLORS = {
    RED: '#ef4444', BLUE: '#3b82f6', YELLOW: '#fbbf24',
    PURPLE: '#a855f7', ORANGE: '#f97316', GREEN: '#22c55e',
    PINK: '#ec4899', CYAN: '#06b6d4', LIME: '#84cc16',
    TEAL: '#14b8a6', INDIGO: '#6366f1', MAGENTA: '#d946ef',
    BROWN: '#78350f', NAVY: '#1e3a8a', MAROON: '#7f1d1d',
    GOLD: '#f59e0b', LAST: '#ffffff', TRAP: '#475569', TEXT: '#f8fafc',
    PORTAL: '#38bdf8'
};

// "Offline AI" Content Dictionaries
const DICTIONARIES = {
    COLORS: [
        { t: 'PURPLE', i: ['RED', 'BLUE'] }, { t: 'ORANGE', i: ['RED', 'YELLOW'] },
        { t: 'GREEN', i: ['BLUE', 'YELLOW'] }, { t: 'PINK', i: ['RED', 'LAST'] },
        { t: 'CYAN', i: ['BLUE', 'GREEN'] }, { t: 'LIME', i: ['GREEN', 'YELLOW'] },
        { t: 'TEAL', i: ['BLUE', 'GREEN', 'LAST'] }, { t: 'INDIGO', i: ['BLUE', 'PURPLE'] },
        { t: 'MAGENTA', i: ['RED', 'PURPLE'] }, { t: 'BROWN', i: ['RED', 'GREEN'] },
        { t: 'NAVY', i: ['BLUE', 'TRAP'] }, { t: 'GOLD', i: ['YELLOW', 'ORANGE'] },
        { t: 'PEACH', i: ['ORANGE', 'LAST'] }, { t: 'OLIVE', i: ['GREEN', 'BROWN'] }
    ],
    WORDS: [
        'SNAKE', 'COLOR', 'APPLE', 'CHASE', 'BRAIN', 'SPEED', 'GATES', 'POWER',
        'LEARN', 'REACT', 'MIXER', 'PIXEL', 'SHIFT', 'LOGIC', 'MATCH', 'WORLD',
        'SMART', 'PULSE', 'LEVEL', 'SCORE', 'BRIGHT', 'SHINE', 'GREAT', 'EXCEL'
    ],
    SCIENCE: [
        { t: 'H2O', i: ['H', 'H', 'O'] }, { t: 'CO2', i: ['C', 'O', 'O'] },
        { t: 'NaCl', i: ['Na', 'Cl'] }, { t: 'CH4', i: ['C', 'H', 'H', 'H', 'H'] },
        { t: 'O3', i: ['O', 'O', 'O'] }, { t: 'PH', i: ['P', 'H'] },
        { t: 'LiF', i: ['Li', 'F'] }, { t: 'HE', i: ['H', 'E'] }
    ],
    TRIVIA: [
        { q: "What planet is known as the Red Planet?", a: "MARS" },
        { q: "What is the largest mammal on Earth?", a: "BLUEWHALE" },
        { q: "What gas do plants breathe in?", a: "CO2" },
        { q: "Who painted the Mona Lisa?", a: "DA_VINCI" },
        { q: "What is the capital of France?", a: "PARIS" },
        { q: "How many continents are there?", a: "SEVEN" },
        { q: "What is the boiling point of water (C)?", a: "100" },
        { q: "Which element has the symbol 'Au'?", a: "GOLD" },
        { q: "What is the square root of 64?", a: "EIGHT" },
        { q: "Which ocean is the largest?", a: "PACIFIC" },
        { q: "What is the tallest mountain in the world?", a: "EVEREST" },
        { q: "What is the currency of Japan?", a: "YEN" },
        { q: "How many colors are in a rainbow?", a: "SEVEN" },
        { q: "What is the fastest land animal?", a: "CHEETAH" },
        { q: "Which gas do humans breathe out?", a: "CO2" },
        { q: "What is the name of the nearest star?", a: "SUN" },
        { q: "How many legs does a spider have?", a: "EIGHT" },
        { q: "What is the hardest natural substance?", a: "DIAMOND" },
        { q: "Which country is home to the Kangaroo?", a: "AUSTRALIA" },
        { q: "What is the main ingredient of glass?", a: "SAND" }
    ]
};

// Curriculum Generation
const LEVELS = [];
for (let i = 1; i <= 100; i++) {
    let levelObj = { id: i, timer: 30, obstacles: [], portals: [] };

    // Dynamic Density
    const obsCount = Math.floor(i / 10);
    for (let j = 0; j < obsCount; j++) {
        levelObj.obstacles.push({ x: Math.floor(Math.random() * TILE_COUNT), y: Math.floor(Math.random() * TILE_COUNT) });
    }

    if (i > 10) {
        const p1 = { x: 2 + Math.floor(Math.random() * (TILE_COUNT - 4)), y: 2 + Math.floor(Math.random() * (TILE_COUNT - 4)) };
        const p2 = { x: 2 + Math.floor(Math.random() * (TILE_COUNT - 4)), y: 2 + Math.floor(Math.random() * (TILE_COUNT - 4)) };
        levelObj.portals = [p1, p2];
    }

    LEVELS.push(levelObj);
}

const SKINS = {
    neon: { snake: '#38bdf8', head: '#818cf8', bg: '#1e293b' },
    classic: { snake: '#22c55e', head: '#16a34a', bg: '#000000' },
    pastel: { snake: '#fca5a1', head: '#f87171', bg: '#fef2f2' }
};

// Game State
let score = 0;
let level = 1;
let currentLevelData = null;
let timer = 30;
let timerInterval = null;
let targetColor = '';
let highScore = parseInt(localStorage.getItem('snake_highscore')) || 0;
let snakeColor = '#3b82f6';
let currentIngredients = [];
let snake = [];
let enemies = [];
let direction = { x: 0, y: 0 };
let nextDirection = { x: 0, y: 0 };
let food = [];
let gameRunning = false;
let isPaused = false;
let currentSkin = 'neon';
let startLevelId = 1;
let gameLoop;
let speedLevel = parseInt(localStorage.getItem('snake_speed')) || 3; // 1-5 scale
let speed = 100;
let portalRotation = 0;
let frameCount = 0;

// Initialize speed display
if (speedValue && speedSlider) {
    speedSlider.value = speedLevel;
    speedValue.textContent = speedLevel;
}

// Speed control listener
if (speedSlider) {
    speedSlider.addEventListener('input', (e) => {
        speedLevel = parseInt(e.target.value);
        speedValue.textContent = speedLevel;
        localStorage.setItem('snake_speed', speedLevel);
        // Update game speed immediately if game is running
        updateGameSpeed();
    });
}

function updateGameSpeed() {
    // Speed mapping: 1=slowest (200ms), 5=fastest (50ms)
    const speedMap = { 1: 200, 2: 150, 3: 100, 4: 75, 5: 50 };
    speed = speedMap[speedLevel] || 100;
}

function init(lvl) {
    snake = [{ x: 15, y: 15 }, { x: 15, y: 16 }, { x: 15, y: 17 }];
    enemies = [];
    direction = { x: 0, y: -1 };
    nextDirection = { x: 0, y: -1 };
    score = 0;
    updateGameSpeed(); // Apply current speed setting
    startLevel(lvl || 1);
}

function generateLevelContent(lvlId) {
    let type = 'color';
    let target = '';
    let ingredients = [];
    let question = '';

    if (lvlId <= 20) {
        const pool = DICTIONARIES.COLORS;
        const data = pool[Math.floor(Math.random() * pool.length)];
        target = data.t;
        ingredients = data.i;
        type = 'color';
    } else if (lvlId <= 40) {
        type = 'math';
        const sum = 10 + Math.floor(Math.random() * lvlId);
        const a = Math.floor(Math.random() * (sum - 2)) + 1;
        target = sum.toString();
        ingredients = [a.toString(), (sum - a).toString()];
    } else if (lvlId <= 60) {
        type = 'text';
        const word = DICTIONARIES.WORDS[Math.floor(Math.random() * DICTIONARIES.WORDS.length)];
        target = word;
        ingredients = word.split('');
    } else if (lvlId <= 80) {
        type = 'science';
        const data = DICTIONARIES.SCIENCE[Math.floor(Math.random() * DICTIONARIES.SCIENCE.length)];
        target = data.t;
        ingredients = data.i;
    } else {
        type = 'trivia';
        const data = DICTIONARIES.TRIVIA[Math.floor(Math.random() * DICTIONARIES.TRIVIA.length)];
        question = data.q;
        target = data.a;
        ingredients = data.a.split('');
    }
    return { type, target, ingredients, question };
}

function startLevel(lvlId) {
    level = lvlId;
    const dynamicContent = generateLevelContent(lvlId);
    currentLevelData = { ...LEVELS[lvlId - 1], ...dynamicContent };

    currentIngredients = [];
    timer = currentLevelData.timer;
    enemies = [];
    isPaused = true;

    // Limit to exactly ONE enemy if Level > 20
    if (level > 20) {
        enemies.push({
            body: [{ x: Math.floor(Math.random() * TILE_COUNT), y: Math.floor(Math.random() * TILE_COUNT) }],
            dir: { x: 1, y: 0 }
        });
    }

    if (currentLevelData.type === 'color') {
        snakeColor = COLORS['TRAP'];
        targetColor = currentLevelData.target;
        goalHint.innerText = `GOAL: Mix ingredients to get ${targetColor}!`;
    } else if (currentLevelData.type === 'math') {
        snakeColor = COLORS.TEXT;
        targetColor = currentLevelData.target;
        goalHint.innerText = `GOAL: Correct ingredients to sum up to ${targetColor}!`;
    } else if (currentLevelData.type === 'trivia') {
        snakeColor = COLORS.TEXT;
        targetColor = currentLevelData.target;
        goalHint.innerText = `TRIVIA: ${currentLevelData.question}`;
    } else if (currentLevelData.type === 'text') {
        snakeColor = COLORS.TEXT;
        targetColor = currentLevelData.target;
        goalHint.innerText = `WORD: Spell "${targetColor}" by eating the letters in order!`;
    } else {
        snakeColor = COLORS.TEXT;
        targetColor = currentLevelData.target;
        goalHint.innerText = `GOAL: Find the components for ${targetColor} in order!`;
    }

    updateHUD();
    spawnFood();

    if (gameRunning) {
        readyOverlay.classList.remove('hidden');

        // Dynamic pause duration and message
        let pauseDuration = 2000;
        if (currentLevelData.type === 'trivia') {
            readyOverlay.innerHTML = `<div style="font-size: 0.5em; opacity: 0.7; margin-bottom: 10px;">TRIVIA</div>${currentLevelData.question}`;
            pauseDuration = 3000;
        } else {
            readyOverlay.innerText = `LEVEL ${level}`;
            pauseDuration = 2000;
        }

        if (timerInterval) clearInterval(timerInterval);

        setTimeout(() => {
            readyOverlay.classList.add('hidden');
            // Reset for next time
            setTimeout(() => { readyOverlay.innerText = ""; readyOverlay.innerHTML = ""; }, 300);
        }, pauseDuration);

        setTimeout(() => {
            isPaused = false;
            startTimer();
        }, pauseDuration);
    }
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (isPaused) return;
        timer--;
        timerEl.innerText = timer;
        if (timer <= 5) timerEl.classList.add('low');
        else timerEl.classList.remove('low');
        if (timer <= 0) gameOver("TIME'S UP!");
    }, 1000);
}

function playSound(sound) {
    if (isMuted) return;
    initAudio();
    if (sound === 'success' || sound === 'fail') playSynth(sound);
}

function spawnFood() {
    food = [];
    if (!currentLevelData) return;
    const validIngredients = currentLevelData.ingredients;
    validIngredients.forEach(type => {
        food.push({ x: Math.floor(Math.random() * TILE_COUNT), y: Math.floor(Math.random() * TILE_COUNT), type: type });
    });
    const count = 10 + Math.min(20, Math.floor(level / 5));
    while (food.length < count) {
        let type;
        if (currentLevelData.type === 'color') {
            const colorKeys = Object.keys(COLORS).filter(k => !['LAST', 'TRAP', 'TEXT', 'PORTAL'].includes(k));
            type = colorKeys[Math.floor(Math.random() * colorKeys.length)];
        } else if (currentLevelData.type === 'math') {
            type = Math.floor(Math.random() * 20).toString();
        } else {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_';
            type = chars[Math.floor(Math.random() * chars.length)];
        }
        let pos = { x: Math.floor(Math.random() * TILE_COUNT), y: Math.floor(Math.random() * TILE_COUNT) };
        if (!food.some(f => f.x === pos.x && f.y === pos.y) && !currentLevelData.obstacles.some(o => o.x === pos.x && o.y === pos.y)) {
            food.push({ ...pos, type });
        }
    }
}

function updateHUD() {
    scoreEl.innerText = score;
    levelEl.innerText = level;
    timerEl.innerText = timer;
    if (currentLevelData.type === 'color') {
        targetDisplay.style.backgroundColor = COLORS[targetColor];
        targetDisplay.innerText = "";
    } else {
        targetDisplay.style.backgroundColor = "#fff";
        targetDisplay.style.color = "#000";

        // Show progress for text-based targets (Words, Science, Trivia)
        if (['text', 'science', 'trivia'].includes(currentLevelData.type)) {
            let progress = "";
            const targetArr = currentLevelData.ingredients;
            for (let i = 0; i < targetArr.length; i++) {
                if (i < currentIngredients.length) progress += targetArr[i];
                else progress += "_";
            }
            targetDisplay.innerText = progress;
        } else {
            targetDisplay.innerText = targetColor;
        }

        targetDisplay.style.display = "flex";
        targetDisplay.style.justifyContent = "center";
        targetDisplay.style.alignItems = "center";
        targetDisplay.style.fontSize = "10px";
        targetDisplay.style.fontWeight = "bold";
    }
}

function move() {
    if (!gameRunning || isPaused) return;
    direction = nextDirection;
    let head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    // Portal Teleportation
    if (currentLevelData.portals.length === 2) {
        const [p1, p2] = currentLevelData.portals;
        if (head.x === p1.x && head.y === p1.y) {
            head = { x: p2.x, y: p2.y };
        } else if (head.x === p2.x && head.y === p2.y) {
            head = { x: p1.x, y: p1.y };
        }
    }

    // Wall Wraparound
    head.x = (head.x + TILE_COUNT) % TILE_COUNT;
    head.y = (head.y + TILE_COUNT) % TILE_COUNT;

    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver("DON'T EAT YOURSELF!");
        return;
    }
    if (currentLevelData.obstacles.some(o => o.x === head.x && o.y === head.y)) {
        gameOver("YOU HIT AN OBSTACLE!");
        return;
    }
    if (enemies.some(e => e.body.some(b => b.x === head.x && b.y === head.y))) {
        gameOver("WATCH OUT FOR ENEMY SNAKES!");
        return;
    }

    snake.unshift(head);
    const foodIndex = food.findIndex(f => f.x === head.x && f.y === head.y);
    if (foodIndex !== -1) {
        handleEating(food[foodIndex].type);
        food.splice(foodIndex, 1);
        if (food.length < 5) spawnFood();
    } else {
        snake.pop();
    }
}

function handleEating(type) {
    const validIngredients = currentLevelData.ingredients;
    const totalNeeded = validIngredients.filter(x => x === type).length;
    const totalEaten = currentIngredients.filter(x => x === type).length;

    if (totalEaten < totalNeeded) {
        score += 10;
        currentIngredients.push(type);
        if (currentLevelData.type === 'color' && COLORS[type]) snakeColor = COLORS[type];

        if (currentIngredients.length === validIngredients.length) {
            score += 100;
            playSynth('success');
            if (currentLevelData.type === 'color' && COLORS[currentLevelData.target]) snakeColor = COLORS[currentLevelData.target];
            setTimeout(() => {
                if (level < 100) startLevel(level + 1);
                else gameOver("ULTIMATE CHAMPION!", true);
            }, 500);
        }
    } else {
        playSynth('fail');
        const correctStr = validIngredients.join(', ');
        gameOver(currentLevelData.type === 'math' ? `WRONG! Target ${targetColor} needed: ${correctStr}` : `WRONG! Needed: ${correctStr}`);
    }
    updateHUD();
}

function gameOver(reason) {
    gameRunning = false;
    clearInterval(gameLoop);
    if (timerInterval) clearInterval(timerInterval);
    AUDIO.bg.pause();

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snake_highscore', highScore);
        highScoreEl.innerText = highScore;
    }

    overlayTitle.innerText = "GAME OVER";
    overlayMsg.innerText = reason || `Final Score: ${score}`;
    overlay.classList.remove('hidden');
}

function drawPortals() {
    if (!currentLevelData || !currentLevelData.portals) return;
    portalRotation += 0.1;
    currentLevelData.portals.forEach(p => {
        const cx = p.x * GRID_SIZE + GRID_SIZE / 2;
        const cy = p.y * GRID_SIZE + GRID_SIZE / 2;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(portalRotation);
        ctx.shadowBlur = 15;
        ctx.shadowColor = COLORS.PORTAL;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.rotate(Math.PI / 1.5);
            ctx.ellipse(0, 0, GRID_SIZE / 2, GRID_SIZE / 4, 0, 0, Math.PI * 2);
            const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, GRID_SIZE / 2);
            grad.addColorStop(0, COLORS.PORTAL);
            grad.addColorStop(1, 'transparent');
            ctx.strokeStyle = COLORS.PORTAL;
            ctx.stroke();
        }
        ctx.restore();
    });
}

function draw() {
    ctx.fillStyle = SKINS[currentSkin].bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Luminescent wave grid effect
    const waveSpeed = frameCount * 0.05;
    for (let i = 0; i < TILE_COUNT; i++) {
        for (let j = 0; j < TILE_COUNT; j++) {
            const wave = Math.sin(waveSpeed + i * 0.3 + j * 0.3) * 0.5 + 0.5;
            const alpha = wave * 0.08; // Subtle glow
            const hue = (frameCount + i * 10 + j * 10) % 360;
            ctx.fillStyle = `hsla(${hue}, 70%, 60%, ${alpha})`;
            ctx.fillRect(i * GRID_SIZE, j * GRID_SIZE, GRID_SIZE, GRID_SIZE);
        }
    }

    // Grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.02)";
    for (let i = 0; i < TILE_COUNT; i++) {
        ctx.beginPath(); ctx.moveTo(i * GRID_SIZE, 0); ctx.lineTo(i * GRID_SIZE, canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i * GRID_SIZE); ctx.lineTo(canvas.width, i * GRID_SIZE); ctx.stroke();
    }
    if (currentLevelData) {
        ctx.fillStyle = "#475569";
        currentLevelData.obstacles.forEach(o => {
            ctx.fillRect(o.x * GRID_SIZE, o.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
            ctx.strokeStyle = "rgba(255,255,255,0.2)";
            ctx.strokeRect(o.x * GRID_SIZE, o.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
        });
        drawPortals();
    }
    food.forEach(f => {
        const color = COLORS[f.type] || COLORS.TEXT;
        ctx.fillStyle = color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.beginPath();
        ctx.roundRect(f.x * GRID_SIZE + 2, f.y * GRID_SIZE + 2, GRID_SIZE - 4, GRID_SIZE - 4, 4);
        ctx.fill();
        if (currentLevelData && currentLevelData.type !== 'color') {
            ctx.fillStyle = "#000"; ctx.font = "bold 10px Outfit"; ctx.textAlign = "center";
            ctx.fillText(f.type, f.x * GRID_SIZE + GRID_SIZE / 2, f.y * GRID_SIZE + GRID_SIZE / 2 + 4);
        }
        ctx.shadowBlur = 0;
    });
    snake.forEach((segment, i) => {
        ctx.fillStyle = snakeColor; // Removed shading for consistency
        ctx.shadowBlur = i === 0 ? 15 : 0;
        ctx.shadowColor = snakeColor;
        ctx.beginPath();
        ctx.roundRect(segment.x * GRID_SIZE + 1, segment.y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2, 4);
        ctx.fill();
        ctx.shadowBlur = 0;
    });
    ctx.fillStyle = "#f87171";
    enemies.forEach(e => {
        e.body.forEach(b => {
            ctx.beginPath();
            ctx.rect(b.x * GRID_SIZE, b.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
            ctx.fill();
        });
    });
}

function adjustColor(hex, percent) {
    if (!hex || !hex.startsWith('#') || hex.length < 4) return hex;
    const num = parseInt(hex.replace('#', ''), 16),
        amt = Math.round(2.55 * percent),
        R = (num >> 16) + amt, G = (num >> 8 & 0x00FF) + amt, B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

function moveEnemies() {
    if (isPaused) return;
    // Dynamic Enemy Speed: skip frames early on, move every frame later
    const enemyMoveFreq = Math.max(1, Math.floor(4 - (level / 33)));
    if (frameCount % enemyMoveFreq !== 0) return;

    enemies.forEach(e => {
        const head = { x: e.body[0].x + e.dir.x, y: e.body[0].y + e.dir.y };
        if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
            e.dir.x *= -1; e.dir.y *= -1;
        } else {
            e.body.unshift(head); e.body.pop();
        }
        if (Math.random() < 0.1) {
            const dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
            e.dir = dirs[Math.floor(Math.random() * dirs.length)];
        }
    });
}

function game() {
    frameCount++;
    move();
    moveEnemies();
    draw();
}

window.addEventListener('keydown', e => {
    switch (e.key) {
        case 'ArrowUp': if (direction.y === 0) nextDirection = { x: 0, y: -1 }; break;
        case 'ArrowDown': if (direction.y === 0) nextDirection = { x: 0, y: 1 }; break;
        case 'ArrowLeft': if (direction.x === 0) nextDirection = { x: -1, y: 0 }; break;
        case 'ArrowRight': if (direction.x === 0) nextDirection = { x: 1, y: 0 }; break;
    }
});

startBtn.addEventListener('click', () => {
    overlay.classList.add('hidden');
    gameRunning = true;
    init(startLevelId);
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(game, speed);
    initAudio();
    if (!isMuted && AUDIO.bg.dataset.error !== "true") {
        try {
            AUDIO.bg.currentTime = 0;
            AUDIO.bg.play().catch(e => console.warn("BGM play failed", e));
        } catch (e) { console.warn("BGM play error", e); }
    }
});

muteBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    muteBtn.innerText = isMuted ? '🔇' : '🔊';
    if (isMuted) AUDIO.bg.pause();
    else if (gameRunning && AUDIO.bg.dataset.error !== "true") {
        initAudio(); AUDIO.bg.play().catch(e => console.warn("BGM resume failed", e));
    }
});

skinBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        skinBtns.forEach(b => b.classList.remove('active')); btn.classList.add('active');
        currentSkin = btn.dataset.skin; if (!gameRunning) draw();
    });
});

catBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        catBtns.forEach(b => b.classList.remove('active')); btn.classList.add('active');
        startLevelId = parseInt(btn.dataset.start);
    });
});

// Pause/Play controls
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        if (!gameRunning) return; // Only pause if game is running

        isPaused = !isPaused;

        if (isPaused) {
            // Show pause overlay
            readyOverlay.classList.remove('hidden');
            readyOverlay.innerHTML = '<div style="font-size: 2em; font-weight: 700;">PAUSED</div><div style="font-size: 0.8em; opacity: 0.7; margin-top: 10px;">Press SPACE or P to resume</div>';
        } else {
            // Hide pause overlay
            readyOverlay.classList.add('hidden');
            setTimeout(() => { readyOverlay.innerHTML = ''; }, 300);
        }
    }
});

window.addEventListener('DOMContentLoaded', () => {
    init(1);
    draw();
    overlay.classList.remove('hidden');
    overlayTitle.innerText = "COLOR MIX";
    overlayMsg.innerText = "Teleport through the Tornado Gates!";
});
