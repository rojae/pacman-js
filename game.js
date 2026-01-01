const canvas = document.getElementById("canvas");
const canvasContext = canvas.getContext("2d");
const pacmanFrames = document.getElementById("animation");
const ghostFrames = document.getElementById("ghosts");

let createRect = (x, y, width, height, color) => {
    canvasContext.fillStyle = color;
    canvasContext.fillRect(x, y, width, height);
};

// ============= SOUND SYSTEM =============
let audioContext = null;
let soundEnabled = true;
let musicEnabled = true;
let bgMusicInterval = null;

// Initialize audio context on first user interaction
let initAudio = () => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
};

// Play a simple tone
let playTone = (frequency, duration, type = 'square', volume = 0.3) => {
    if (!audioContext || !soundEnabled) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
};

// Sound effects
let playEatSound = () => {
    if (!audioContext || !soundEnabled) return;
    // Quick "waka" sound
    playTone(600, 0.05, 'sine', 0.2);
    setTimeout(() => playTone(500, 0.05, 'sine', 0.15), 50);
};

let playPowerUpSound = () => {
    if (!audioContext || !soundEnabled) return;
    // Rising tone for power-up
    playTone(400, 0.1, 'square', 0.3);
    setTimeout(() => playTone(600, 0.1, 'square', 0.3), 100);
    setTimeout(() => playTone(800, 0.15, 'square', 0.3), 200);
};

let playDeathSound = () => {
    if (!audioContext || !soundEnabled) return;
    // Descending sad tone
    playTone(500, 0.15, 'sawtooth', 0.3);
    setTimeout(() => playTone(400, 0.15, 'sawtooth', 0.25), 150);
    setTimeout(() => playTone(300, 0.15, 'sawtooth', 0.2), 300);
    setTimeout(() => playTone(200, 0.3, 'sawtooth', 0.15), 450);
};

let playGameOverSound = () => {
    if (!audioContext || !soundEnabled) return;
    // Dramatic game over
    playTone(400, 0.2, 'square', 0.4);
    setTimeout(() => playTone(350, 0.2, 'square', 0.35), 250);
    setTimeout(() => playTone(300, 0.2, 'square', 0.3), 500);
    setTimeout(() => playTone(200, 0.5, 'sawtooth', 0.25), 750);
};

let playWinSound = () => {
    if (!audioContext || !soundEnabled) return;
    // Victory fanfare
    playTone(523, 0.15, 'square', 0.3); // C
    setTimeout(() => playTone(659, 0.15, 'square', 0.3), 150); // E
    setTimeout(() => playTone(784, 0.15, 'square', 0.3), 300); // G
    setTimeout(() => playTone(1047, 0.4, 'square', 0.35), 450); // High C
};

let playHideSound = () => {
    if (!audioContext || !soundEnabled) return;
    // Whoosh sound
    playTone(800, 0.1, 'sine', 0.2);
    setTimeout(() => playTone(400, 0.15, 'sine', 0.15), 50);
};

let playStartSound = () => {
    if (!audioContext || !soundEnabled) return;
    // Game start jingle
    playTone(392, 0.1, 'square', 0.25); // G
    setTimeout(() => playTone(523, 0.1, 'square', 0.25), 100); // C
    setTimeout(() => playTone(659, 0.1, 'square', 0.25), 200); // E
    setTimeout(() => playTone(784, 0.2, 'square', 0.3), 300); // G
};

// Background music - simple loop
let bgMusicStep = 0;
let bgMusicNotes = [262, 294, 330, 349, 392, 349, 330, 294]; // C D E F G F E D

let playBgMusicNote = () => {
    if (!audioContext || !musicEnabled || !gameStarted || isGameOver) return;

    playTone(bgMusicNotes[bgMusicStep], 0.15, 'sine', 0.08);
    bgMusicStep = (bgMusicStep + 1) % bgMusicNotes.length;
};

let startBgMusic = () => {
    if (bgMusicInterval) clearInterval(bgMusicInterval);
    bgMusicStep = 0;
    bgMusicInterval = setInterval(playBgMusicNote, 400);
};

let stopBgMusic = () => {
    if (bgMusicInterval) {
        clearInterval(bgMusicInterval);
        bgMusicInterval = null;
    }
};

// Toggle sound/music
let toggleSound = () => {
    soundEnabled = !soundEnabled;
};

let toggleMusic = () => {
    musicEnabled = !musicEnabled;
    if (musicEnabled && gameStarted && !isGameOver) {
        startBgMusic();
    } else {
        stopBgMusic();
    }
};
// ============= END SOUND SYSTEM =============

const DIRECTION_RIGHT = 4;
const DIRECTION_UP = 3;
const DIRECTION_LEFT = 2;
const DIRECTION_BOTTOM = 1;
let lives = 3;
let ghostCount = 10;
let ghostImageLocations = [
    { x: 0, y: 0 },
    { x: 176, y: 0 },
    { x: 0, y: 121 },
    { x: 176, y: 121 },
];

// Game variables
let fps = 30;
let pacman;
let oneBlockSize = 20;
let score = 0;
let ghosts = [];
let wallSpaceWidth = oneBlockSize / 1.6;
let wallOffset = (oneBlockSize - wallSpaceWidth) / 2;
let wallInnerColor = "black";

// we now create the map of the walls,
// if 1 wall, if 0 not wall
// 21 columns // 23 rows
// 2 = regular food, 4 = power pellet
let map = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 4, 1],
    [1, 4, 1, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1],
    [1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1],
    [1, 2, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1],
    [1, 1, 1, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 1, 2, 1, 2, 2, 2, 2, 2, 2, 2, 1, 2, 1, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 2, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1],
    [2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2],
    [1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 2, 2, 1, 2, 1, 2, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 2, 1, 2, 2, 2, 2, 2, 2, 2, 1, 2, 1, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 2, 2, 2, 1, 1, 1, 1, 1, 2, 2, 2, 1, 1, 1, 1, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1],
    [1, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1, 2, 2, 2, 1],
    [1, 1, 2, 2, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 2, 1, 1],
    [1, 2, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1],
    [1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1],
    [1, 4, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 4, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

// ============= POWER MODE SYSTEM =============
let isPowerMode = false;
let powerModeTimer = 0;
const POWER_MODE_DURATION = 300; // 10 seconds at 30fps
let ghostCombo = 0; // For combo scoring: 200, 400, 800, 1600
let screenShake = 0;
let particles = [];

// ============= BOSS GHOST SYSTEM =============
let bossSpawnTimer = 0;
const BOSS_SPAWN_INTERVAL = 1350; // 45 seconds at 30fps
let bossWarningTimer = 0;
const BOSS_WARNING_DURATION = 90; // 3 seconds warning before spawn
let bossCount = 0;
let bossInvincibilityTimer = 0; // Pacman invincibility after boss spawn
const BOSS_INVINCIBILITY_DURATION = 60; // 2 seconds at 30fps

// Particle class for visual effects
class Particle {
    constructor(x, y, color, type = 'normal') {
        this.x = x;
        this.y = y;
        this.color = color;
        this.type = type;
        this.life = 1;
        this.decay = type === 'ghost' ? 0.015 : 0.03;
        this.vx = (Math.random() - 0.5) * (type === 'power' ? 8 : 4);
        this.vy = (Math.random() - 0.5) * (type === 'power' ? 8 : 4);
        this.size = type === 'power' ? Math.random() * 8 + 4 : Math.random() * 6 + 2;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.3;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1; // gravity
        this.life -= this.decay;
        this.rotation += this.rotationSpeed;
        this.size *= 0.97;
    }

    draw() {
        if (this.life <= 0) return;
        canvasContext.save();
        canvasContext.globalAlpha = this.life;
        canvasContext.translate(this.x, this.y);
        canvasContext.rotate(this.rotation);

        if (this.type === 'power') {
            // Star-shaped particle for power pellet
            canvasContext.beginPath();
            canvasContext.fillStyle = this.color;
            for (let i = 0; i < 5; i++) {
                let angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                let x = Math.cos(angle) * this.size;
                let y = Math.sin(angle) * this.size;
                if (i === 0) canvasContext.moveTo(x, y);
                else canvasContext.lineTo(x, y);
            }
            canvasContext.closePath();
            canvasContext.fill();
        } else if (this.type === 'ghost') {
            // Ghost death explosion - larger squares
            canvasContext.fillStyle = this.color;
            canvasContext.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        } else {
            // Normal circular particle
            canvasContext.beginPath();
            canvasContext.fillStyle = this.color;
            canvasContext.arc(0, 0, this.size, 0, Math.PI * 2);
            canvasContext.fill();
        }

        canvasContext.restore();
    }
}

// Floating score text
let floatingTexts = [];

class FloatingText {
    constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = 1;
        this.decay = 0.02;
        this.vy = -2;
    }

    update() {
        this.y += this.vy;
        this.life -= this.decay;
    }

    draw() {
        if (this.life <= 0) return;
        canvasContext.save();
        canvasContext.globalAlpha = this.life;
        canvasContext.font = 'bold 16px Arial';
        canvasContext.fillStyle = this.color;
        canvasContext.textAlign = 'center';
        canvasContext.fillText(this.text, this.x, this.y);
        canvasContext.restore();
    }
}

// Power pellet sound
let playPowerPelletSound = () => {
    if (!audioContext || !soundEnabled) return;
    // Epic power-up sound
    playTone(200, 0.1, 'square', 0.4);
    setTimeout(() => playTone(300, 0.1, 'square', 0.4), 80);
    setTimeout(() => playTone(400, 0.1, 'square', 0.4), 160);
    setTimeout(() => playTone(600, 0.15, 'square', 0.4), 240);
    setTimeout(() => playTone(800, 0.2, 'sawtooth', 0.5), 320);
};

// Ghost eaten sound
let playGhostEatenSound = () => {
    if (!audioContext || !soundEnabled) return;
    playTone(100, 0.1, 'sawtooth', 0.5);
    setTimeout(() => playTone(150, 0.1, 'sawtooth', 0.4), 50);
    setTimeout(() => playTone(200, 0.15, 'square', 0.3), 100);
    setTimeout(() => playTone(400, 0.2, 'sine', 0.3), 150);
};

// Boss warning sound
let playBossWarningSound = () => {
    if (!audioContext || !soundEnabled) return;
    playTone(150, 0.3, 'sawtooth', 0.4);
    setTimeout(() => playTone(150, 0.3, 'sawtooth', 0.4), 400);
    setTimeout(() => playTone(150, 0.3, 'sawtooth', 0.4), 800);
};

// Boss spawn sound
let playBossSpawnSound = () => {
    if (!audioContext || !soundEnabled) return;
    playTone(100, 0.2, 'sawtooth', 0.5);
    setTimeout(() => playTone(150, 0.2, 'sawtooth', 0.5), 100);
    setTimeout(() => playTone(200, 0.2, 'sawtooth', 0.5), 200);
    setTimeout(() => playTone(300, 0.3, 'square', 0.6), 300);
    setTimeout(() => playTone(400, 0.4, 'square', 0.5), 450);
};

// Spawn a boss ghost
let spawnBossGhost = () => {
    bossCount++;
    // Spawn at pacman's current position
    let spawnX = pacman.x;
    let spawnY = pacman.y;
    let bossGhost = new Ghost(
        spawnX,
        spawnY,
        oneBlockSize,       // Use standard size for collision (drawn 1.5x visually)
        oneBlockSize,
        pacman.speed / 1.5, // Slightly slower but menacing
        ghostImageLocations[0].x,
        ghostImageLocations[0].y,
        124,
        116,
        12, // Larger detection range
        GHOST_TYPE.BOSS
    );
    ghosts.push(bossGhost);
    playBossSpawnSound();
    screenShake = 15;

    // Give pacman invincibility to escape
    bossInvincibilityTimer = BOSS_INVINCIBILITY_DURATION;

    // Create spawn particles at pacman's position (center of sprite)
    let particleX = spawnX + oneBlockSize / 2;
    let particleY = spawnY + oneBlockSize / 2;
    let colors = ['#8B00FF', '#FFD700', '#FF00FF', '#FFFFFF'];
    for (let i = 0; i < 40; i++) {
        particles.push(new Particle(particleX, particleY, colors[Math.floor(Math.random() * colors.length)], 'power'));
    }

    floatingTexts.push(new FloatingText(particleX, particleY - 20, 'BOSS #' + bossCount + '!', '#FFD700'));
};

// Create power pellet explosion particles
let createPowerPelletExplosion = (x, y) => {
    let colors = ['#FFD700', '#FFA500', '#FF6347', '#FFFF00', '#FF69B4'];
    for (let i = 0; i < 30; i++) {
        particles.push(new Particle(x, y, colors[Math.floor(Math.random() * colors.length)], 'power'));
    }
    screenShake = 10;
};

// Create ghost death explosion
let createGhostDeathExplosion = (x, y, ghostColor) => {
    let colors = [ghostColor, '#FFFFFF', '#00FFFF', '#87CEEB'];
    for (let i = 0; i < 25; i++) {
        particles.push(new Particle(x, y, colors[Math.floor(Math.random() * colors.length)], 'ghost'));
    }
    screenShake = 8;
};

// Activate power mode
let activatePowerMode = () => {
    isPowerMode = true;
    powerModeTimer = POWER_MODE_DURATION;
    ghostCombo = 0;

    // Make all ghosts scared
    for (let ghost of ghosts) {
        ghost.isScared = true;
        ghost.savedSpeed = ghost.speed;
        ghost.speed = ghost.speed * 0.6; // Ghosts slow down when scared
    }
};

// Deactivate power mode
let deactivatePowerMode = () => {
    isPowerMode = false;
    powerModeTimer = 0;
    ghostCombo = 0;

    // Restore ghosts
    for (let ghost of ghosts) {
        ghost.isScared = false;
        if (ghost.savedSpeed) {
            ghost.speed = ghost.savedSpeed;
        }
    }
};

// Eat a scared ghost
let eatGhost = (ghost, index) => {
    ghostCombo++;
    let points;

    // Boss ghost gives 500 points
    if (ghost.ghostType === GHOST_TYPE.BOSS) {
        points = 500;
    } else {
        points = 200 * Math.pow(2, ghostCombo - 1); // 200, 400, 800, 1600
        if (points > 1600) points = 1600;
    }

    score += points;

    // Visual effects
    let ghostX = ghost.x + oneBlockSize / 2;
    let ghostY = ghost.y + oneBlockSize / 2;

    let ghostColor;
    switch (ghost.ghostType) {
        case GHOST_TYPE.BLINKY: ghostColor = '#FF0000'; break;
        case GHOST_TYPE.PINKY: ghostColor = '#FFB8FF'; break;
        case GHOST_TYPE.INKY: ghostColor = '#00FFFF'; break;
        case GHOST_TYPE.CLYDE: ghostColor = '#FFB852'; break;
        case GHOST_TYPE.BOSS: ghostColor = '#8B00FF'; break;
        default: ghostColor = '#FFFFFF';
    }

    createGhostDeathExplosion(ghostX, ghostY, ghostColor);

    // Special text for boss
    if (ghost.ghostType === GHOST_TYPE.BOSS) {
        floatingTexts.push(new FloatingText(ghostX, ghostY, 'BOSS +' + points, '#FFD700'));
        screenShake = 20;
        // Remove boss ghost from array instead of respawning
        ghosts.splice(index, 1);
        return;
    } else {
        floatingTexts.push(new FloatingText(ghostX, ghostY, '+' + points, '#00FFFF'));
    }
    playGhostEatenSound();

    // Reset ghost to spawn
    ghost.x = 9 * oneBlockSize + (index % 2 == 0 ? 0 : 1) * oneBlockSize;
    ghost.y = 10 * oneBlockSize + (index % 2 == 0 ? 0 : 1) * oneBlockSize;
    ghost.isScared = false;
    if (ghost.savedSpeed) {
        ghost.speed = ghost.savedSpeed;
    }
};
// ============= END POWER MODE SYSTEM =============

let randomTargetsForGhosts = [
    { x: 1 * oneBlockSize, y: 1 * oneBlockSize },
    { x: 1 * oneBlockSize, y: (map.length - 2) * oneBlockSize },
    { x: (map[0].length - 2) * oneBlockSize, y: oneBlockSize },
    {
        x: (map[0].length - 2) * oneBlockSize,
        y: (map.length - 2) * oneBlockSize,
    },
];

// for (let i = 0; i < map.length; i++) {
//     for (let j = 0; j < map[0].length; j++) {
//         map[i][j] = 2;
//     }
// }

let createNewPacman = () => {
    pacman = new Pacman(
        oneBlockSize,
        oneBlockSize,
        oneBlockSize,
        oneBlockSize,
        oneBlockSize / 5
    );
};

let gameLoop = () => {
    update();
    draw();
};

let gameInterval = null;
let isPacmanDying = false;
let deathAnimationFrame = 0;
let deathAnimationInterval = null;
let gameStarted = false;
let isHiding = false;
let hideCooldown = 0;
const HIDE_DURATION = 90; // 3 seconds at 30fps
const HIDE_COOLDOWN = 300; // 10 seconds cooldown

// Start screen animation
let startScreenFrame = 0;
let startScreenInterval = null;
let tutorialScreen = false;
let tutorialPage = 0;
const TUTORIAL_PAGES = 2;

let drawStartScreen = () => {
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    createRect(0, 0, canvas.width, canvas.height, "black");

    // Draw maze preview
    drawWalls();

    // Draw title
    canvasContext.font = "bold 36px Arial";
    canvasContext.fillStyle = "yellow";
    canvasContext.textAlign = "center";
    canvasContext.fillText("PAC-MAN", canvas.width / 2, canvas.height / 2 - 80);

    // Blinking "Press to Start" text
    if (Math.floor(startScreenFrame / 15) % 2 === 0) {
        canvasContext.font = "18px Arial";
        canvasContext.fillStyle = "white";
        canvasContext.fillText("PRESS ANY KEY OR TAP TO START", canvas.width / 2, canvas.height / 2 - 45);
    }

    // Control instructions box
    let boxX = canvas.width / 2 - 160;
    let boxY = canvas.height / 2 - 25;
    let boxWidth = 320;
    let boxHeight = 130;

    // Box background with gradient effect
    canvasContext.fillStyle = "rgba(0, 0, 50, 0.9)";
    canvasContext.fillRect(boxX, boxY, boxWidth, boxHeight);

    // Border with glow effect
    canvasContext.strokeStyle = "#FFD700";
    canvasContext.lineWidth = 2;
    canvasContext.strokeRect(boxX, boxY, boxWidth, boxHeight);
    canvasContext.strokeStyle = "rgba(255, 215, 0, 0.3)";
    canvasContext.lineWidth = 4;
    canvasContext.strokeRect(boxX - 2, boxY - 2, boxWidth + 4, boxHeight + 4);

    // Title
    canvasContext.font = "bold 16px Arial";
    canvasContext.fillStyle = "#FFD700";
    canvasContext.fillText("HOW TO PLAY", canvas.width / 2, boxY + 22);

    // Divider line
    canvasContext.strokeStyle = "rgba(255, 215, 0, 0.5)";
    canvasContext.lineWidth = 1;
    canvasContext.beginPath();
    canvasContext.moveTo(boxX + 20, boxY + 32);
    canvasContext.lineTo(boxX + boxWidth - 20, boxY + 32);
    canvasContext.stroke();

    // Two column layout
    let leftCol = canvas.width / 2 - 75;
    let rightCol = canvas.width / 2 + 75;

    // PC Column
    canvasContext.font = "bold 13px Arial";
    canvasContext.fillStyle = "#4CAF50";
    canvasContext.fillText("PC", leftCol, boxY + 52);

    canvasContext.font = "11px Arial";
    canvasContext.fillStyle = "#DDD";
    canvasContext.fillText("Move", leftCol, boxY + 70);
    canvasContext.fillStyle = "#FFF";
    canvasContext.fillText("Arrow / WASD", leftCol, boxY + 85);

    canvasContext.fillStyle = "#DDD";
    canvasContext.fillText("Hide", leftCol, boxY + 103);
    canvasContext.fillStyle = "cyan";
    canvasContext.fillText("SPACE", leftCol, boxY + 118);

    // Mobile Column
    canvasContext.font = "bold 13px Arial";
    canvasContext.fillStyle = "#FF9800";
    canvasContext.fillText("Mobile", rightCol, boxY + 52);

    canvasContext.font = "11px Arial";
    canvasContext.fillStyle = "#DDD";
    canvasContext.fillText("Move", rightCol, boxY + 70);
    canvasContext.fillStyle = "#FFF";
    canvasContext.fillText("D-Pad / Swipe", rightCol, boxY + 85);

    canvasContext.fillStyle = "#DDD";
    canvasContext.fillText("Hide", rightCol, boxY + 103);
    canvasContext.fillStyle = "cyan";
    canvasContext.fillText("Center Button", rightCol, boxY + 118);

    // Vertical divider
    canvasContext.strokeStyle = "rgba(255, 255, 255, 0.2)";
    canvasContext.beginPath();
    canvasContext.moveTo(canvas.width / 2, boxY + 42);
    canvasContext.lineTo(canvas.width / 2, boxY + boxHeight - 10);
    canvasContext.stroke();

    // Sound controls hint
    canvasContext.font = "10px Arial";
    canvasContext.fillStyle = "#666";
    canvasContext.fillText("Sound: M (music) / N (sfx)", canvas.width / 2, boxY + boxHeight + 15);

    // Draw pacman animation
    let pacmanX = (startScreenFrame * 3) % (canvas.width + 60) - 30;
    let animY = boxY + boxHeight + 45;
    canvasContext.beginPath();
    canvasContext.fillStyle = "yellow";
    let mouthAngle = Math.abs(Math.sin(startScreenFrame * 0.3)) * 0.5;
    canvasContext.arc(pacmanX, animY, 15, mouthAngle, 2 * Math.PI - mouthAngle);
    canvasContext.lineTo(pacmanX, animY);
    canvasContext.fill();

    // Draw chasing ghosts
    for (let i = 0; i < 4; i++) {
        let ghostX = pacmanX - 40 - (i * 25);
        if (ghostX > -20 && ghostX < canvas.width + 20) {
            canvasContext.drawImage(
                ghostFrames,
                ghostImageLocations[i].x,
                ghostImageLocations[i].y,
                124,
                116,
                ghostX - 10,
                animY - 15,
                20,
                20
            );
        }
    }

    // Ghost count info
    canvasContext.font = "14px Arial";
    canvasContext.fillStyle = "#888";
    canvasContext.fillText("Ghosts: " + ghostCount, canvas.width / 2, animY + 40);

    // Made by rojae
    canvasContext.font = "12px Arial";
    canvasContext.fillStyle = "#666";
    canvasContext.fillText("made by rojae", canvas.width / 2, canvas.height - 20);

    canvasContext.textAlign = "left";
    startScreenFrame++;
};

// Draw tutorial screen
let drawTutorialScreen = () => {
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    createRect(0, 0, canvas.width, canvas.height, "black");

    // Background glow
    let gradient = canvasContext.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, 300);
    gradient.addColorStop(0, 'rgba(50, 0, 100, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    canvasContext.fillStyle = gradient;
    canvasContext.fillRect(0, 0, canvas.width, canvas.height);

    canvasContext.textAlign = "center";

    if (tutorialPage === 0) {
        // Page 1: Items
        canvasContext.font = "bold 28px Arial";
        canvasContext.fillStyle = "#FFD700";
        canvasContext.fillText("ITEMS", canvas.width / 2, 50);

        // Regular food
        let y = 100;
        canvasContext.fillStyle = "#FEB897";
        canvasContext.beginPath();
        canvasContext.arc(80, y, 8, 0, Math.PI * 2);
        canvasContext.fill();

        canvasContext.font = "bold 16px Arial";
        canvasContext.fillStyle = "#FEB897";
        canvasContext.textAlign = "left";
        canvasContext.fillText("Food", 110, y - 5);
        canvasContext.font = "12px Arial";
        canvasContext.fillStyle = "#AAA";
        canvasContext.fillText("Eat all to win! +1 point each", 110, y + 12);

        // Power Pellet
        y = 170;
        let pulse = Math.sin(startScreenFrame * 0.15) * 3;
        canvasContext.beginPath();
        let pelletGradient = canvasContext.createRadialGradient(80, y, 0, 80, y, 15 + pulse);
        pelletGradient.addColorStop(0, '#FFFFFF');
        pelletGradient.addColorStop(0.3, '#FFD700');
        pelletGradient.addColorStop(1, 'rgba(255, 165, 0, 0)');
        canvasContext.fillStyle = pelletGradient;
        canvasContext.arc(80, y, 15 + pulse, 0, Math.PI * 2);
        canvasContext.fill();

        canvasContext.font = "bold 16px Arial";
        canvasContext.fillStyle = "#FFD700";
        canvasContext.fillText("Power Pellet", 110, y - 5);
        canvasContext.font = "12px Arial";
        canvasContext.fillStyle = "#AAA";
        canvasContext.fillText("Become SUPER! Eat ghosts for 10 sec", 110, y + 12);
        canvasContext.fillStyle = "#00FFFF";
        canvasContext.fillText("+50 points, Crown & 1.5x size!", 110, y + 28);

        // Regular Ghost
        y = 260;
        canvasContext.drawImage(ghostFrames, 0, 0, 124, 116, 55, y - 20, 40, 40);
        canvasContext.beginPath();
        canvasContext.fillStyle = '#FF0000';
        canvasContext.arc(75, y - 18, 4, 0, Math.PI * 2);
        canvasContext.fill();

        canvasContext.font = "bold 16px Arial";
        canvasContext.fillStyle = "#FF6666";
        canvasContext.fillText("Ghosts", 110, y - 5);
        canvasContext.font = "12px Arial";
        canvasContext.fillStyle = "#AAA";
        canvasContext.fillText("4 types: Blinky, Pinky, Inky, Clyde", 110, y + 12);
        canvasContext.fillStyle = "#FF6666";
        canvasContext.fillText("Avoid them! Or eat when powered up", 110, y + 28);

        // Scared Ghost
        y = 350;
        // Draw scared ghost manually
        canvasContext.fillStyle = '#0000FF';
        canvasContext.beginPath();
        canvasContext.arc(75, y - 5, 18, Math.PI, 0);
        canvasContext.lineTo(93, y + 13);
        for (let i = 3; i >= 0; i--) {
            canvasContext.lineTo(57 + i * 12, y + 13 + (i % 2 === 0 ? 5 : -3));
        }
        canvasContext.closePath();
        canvasContext.fill();
        // X eyes
        canvasContext.strokeStyle = '#FFFFFF';
        canvasContext.lineWidth = 2;
        canvasContext.beginPath();
        canvasContext.moveTo(67, y - 10); canvasContext.lineTo(73, y - 4);
        canvasContext.moveTo(73, y - 10); canvasContext.lineTo(67, y - 4);
        canvasContext.moveTo(77, y - 10); canvasContext.lineTo(83, y - 4);
        canvasContext.moveTo(83, y - 10); canvasContext.lineTo(77, y - 4);
        canvasContext.stroke();

        canvasContext.font = "bold 16px Arial";
        canvasContext.fillStyle = "#6666FF";
        canvasContext.fillText("Scared Ghost", 110, y - 5);
        canvasContext.font = "12px Arial";
        canvasContext.fillStyle = "#AAA";
        canvasContext.fillText("When you have power, ghosts turn blue!", 110, y + 12);
        canvasContext.fillStyle = "#00FF00";
        canvasContext.fillText("Eat them for 200-1600 combo points!", 110, y + 28);

    } else if (tutorialPage === 1) {
        // Page 2: Boss Ghost
        canvasContext.font = "bold 28px Arial";
        canvasContext.fillStyle = "#8B00FF";
        canvasContext.textAlign = "center";
        canvasContext.fillText("BOSS GHOST", canvas.width / 2, 50);

        // Draw big boss ghost in center
        let bossX = canvas.width / 2;
        let bossY = 150;
        let bossScale = 2;
        let wobble = Math.sin(startScreenFrame * 0.1) * 3;

        canvasContext.shadowColor = '#FFD700';
        canvasContext.shadowBlur = 20;

        // Purple body
        canvasContext.fillStyle = '#8B00FF';
        canvasContext.beginPath();
        let radius = 25 * bossScale;
        canvasContext.arc(bossX + wobble, bossY, radius, Math.PI, 0);
        let bottomY = bossY + radius;
        canvasContext.lineTo(bossX + radius + wobble, bottomY);
        for (let i = 5; i >= 0; i--) {
            canvasContext.lineTo(bossX - radius + (i * radius * 2 / 5) + wobble, bottomY + (i % 2 === 0 ? 10 : -5));
        }
        canvasContext.closePath();
        canvasContext.fill();

        canvasContext.shadowBlur = 0;

        // Eyes
        canvasContext.fillStyle = '#FFFFFF';
        canvasContext.beginPath();
        canvasContext.ellipse(bossX - 15 + wobble, bossY - 10, 10, 14, 0, 0, Math.PI * 2);
        canvasContext.fill();
        canvasContext.beginPath();
        canvasContext.ellipse(bossX + 15 + wobble, bossY - 10, 10, 14, 0, 0, Math.PI * 2);
        canvasContext.fill();

        // Red pupils
        canvasContext.fillStyle = '#FF0000';
        canvasContext.beginPath();
        canvasContext.arc(bossX - 15 + wobble, bossY - 10, 5, 0, Math.PI * 2);
        canvasContext.fill();
        canvasContext.beginPath();
        canvasContext.arc(bossX + 15 + wobble, bossY - 10, 5, 0, Math.PI * 2);
        canvasContext.fill();

        // Crown
        let crownY = bossY - radius - 15;
        let crownSize = 30;
        canvasContext.fillStyle = '#FFD700';
        canvasContext.beginPath();
        canvasContext.moveTo(bossX - crownSize/2 + wobble, crownY + 10);
        canvasContext.lineTo(bossX - crownSize/2 + wobble, crownY);
        canvasContext.lineTo(bossX - crownSize/4 + wobble, crownY - 15);
        canvasContext.lineTo(bossX - crownSize/4 + wobble, crownY + 5);
        canvasContext.lineTo(bossX + wobble, crownY - 20);
        canvasContext.lineTo(bossX + crownSize/4 + wobble, crownY + 5);
        canvasContext.lineTo(bossX + crownSize/4 + wobble, crownY - 15);
        canvasContext.lineTo(bossX + crownSize/2 + wobble, crownY);
        canvasContext.lineTo(bossX + crownSize/2 + wobble, crownY + 10);
        canvasContext.closePath();
        canvasContext.fill();

        // Crown gems
        canvasContext.fillStyle = '#FF0000';
        canvasContext.beginPath();
        canvasContext.arc(bossX + wobble, crownY - 10, 5, 0, Math.PI * 2);
        canvasContext.fill();

        // Info text
        canvasContext.textAlign = "center";
        canvasContext.font = "bold 18px Arial";
        canvasContext.fillStyle = "#FFD700";
        canvasContext.fillText("King Ghost", canvas.width / 2, 280);

        canvasContext.font = "14px Arial";
        canvasContext.fillStyle = "#FFF";
        canvasContext.fillText("Spawns every 45 seconds!", canvas.width / 2, 310);

        canvasContext.fillStyle = "#FF6666";
        canvasContext.fillText("1.5x bigger and wears a crown", canvas.width / 2, 335);

        canvasContext.fillStyle = "#00FF00";
        canvasContext.fillText("+500 points when eaten!", canvas.width / 2, 360);

        canvasContext.fillStyle = "#FF0000";
        canvasContext.font = "bold 14px Arial";
        canvasContext.fillText("WARNING: 3 seconds before spawn!", canvas.width / 2, 395);
    }

    // Navigation
    canvasContext.textAlign = "center";

    // Page indicator
    canvasContext.font = "14px Arial";
    canvasContext.fillStyle = "#888";
    canvasContext.fillText(`Page ${tutorialPage + 1} / ${TUTORIAL_PAGES}`, canvas.width / 2, 440);

    // Next/Start button
    let btnText = tutorialPage < TUTORIAL_PAGES - 1 ? "NEXT >" : "START GAME!";
    let btnColor = tutorialPage < TUTORIAL_PAGES - 1 ? "#4CAF50" : "#FFD700";

    if (Math.floor(startScreenFrame / 20) % 2 === 0) {
        canvasContext.font = "bold 20px Arial";
        canvasContext.fillStyle = btnColor;
        canvasContext.fillText(btnText, canvas.width / 2, 475);
    }

    canvasContext.font = "12px Arial";
    canvasContext.fillStyle = "#666";
    canvasContext.fillText("Tap or press any key", canvas.width / 2, 495);

    canvasContext.textAlign = "left";
    startScreenFrame++;
};

let showTutorial = () => {
    tutorialScreen = true;
    tutorialPage = 0;
    if (startScreenInterval) {
        clearInterval(startScreenInterval);
    }
    startScreenInterval = setInterval(drawTutorialScreen, 1000 / fps);
};

let nextTutorialPage = () => {
    tutorialPage++;
    if (tutorialPage >= TUTORIAL_PAGES) {
        startActualGame();
    }
};

let startActualGame = () => {
    if (gameStarted) return;
    gameStarted = true;
    tutorialScreen = false;

    // Initialize audio on first interaction
    initAudio();
    playStartSound();
    startBgMusic();

    if (startScreenInterval) {
        clearInterval(startScreenInterval);
        startScreenInterval = null;
    }

    gameInterval = setInterval(gameLoop, 1000 / fps);
};

let startGame = () => {
    if (gameStarted) return;

    // Initialize audio
    initAudio();

    // Show tutorial instead of starting game directly
    showTutorial();
};

// Show start screen
startScreenInterval = setInterval(drawStartScreen, 1000 / fps);

let restartPacmanAndGhosts = () => {
    createNewPacman();

    // Save boss ghosts before recreating regular ghosts
    let bossGhosts = ghosts.filter(g => g.ghostType === GHOST_TYPE.BOSS);

    createGhosts();

    // Restore boss ghosts (reset their position to spawn point)
    for (let boss of bossGhosts) {
        boss.x = 10 * oneBlockSize;
        boss.y = 4 * oneBlockSize;
        boss.isScared = false;
        if (boss.savedSpeed) {
            boss.speed = boss.savedSpeed;
        }
        ghosts.push(boss);
    }
};

let onGhostCollision = () => {
    if (isPacmanDying) return;

    // Save death position for Game Over screen
    deathPosition.x = pacman.x;
    deathPosition.y = pacman.y;

    // Deactivate power mode on death
    if (isPowerMode) {
        deactivatePowerMode();
    }

    isPacmanDying = true;
    clearInterval(gameInterval);
    stopBgMusic();
    playDeathSound();

    // Death animation
    deathAnimationFrame = 0;
    deathAnimationInterval = setInterval(() => {
        deathAnimationFrame++;
        drawDeathAnimation();

        if (deathAnimationFrame >= 12) {
            clearInterval(deathAnimationInterval);
            lives--;
            isPacmanDying = false;

            if (lives == 0) {
                gameOver();
            } else {
                restartPacmanAndGhosts();
                startBgMusic();
                gameInterval = setInterval(gameLoop, 1000 / fps);
            }
        }
    }, 100);
};

let drawDeathAnimation = () => {
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    createRect(0, 0, canvas.width, canvas.height, "black");
    drawWalls();
    drawFoods();
    drawScore();
    drawRemainingLives();

    // Draw dying pacman (shrinking circle)
    canvasContext.save();
    canvasContext.beginPath();
    canvasContext.fillStyle = "yellow";
    let startAngle = (deathAnimationFrame * 0.25) * Math.PI;
    let endAngle = 2 * Math.PI - startAngle;
    if (startAngle < Math.PI) {
        canvasContext.arc(
            pacman.x + oneBlockSize / 2,
            pacman.y + oneBlockSize / 2,
            oneBlockSize / 2,
            startAngle,
            endAngle
        );
        canvasContext.lineTo(pacman.x + oneBlockSize / 2, pacman.y + oneBlockSize / 2);
        canvasContext.fill();
    }
    canvasContext.restore();
};

let isGameOver = false;
let gameOverInterval = null;

let gameOver = () => {
    clearInterval(gameInterval);
    isGameOver = true;
    stopBgMusic();
    playGameOverSound();

    // Keep animating the game over screen
    if (gameOverInterval) clearInterval(gameOverInterval);
    gameOverInterval = setInterval(drawGameOverScreen, 1000 / fps);
};

// Store death position for Game Over screen
let deathPosition = { x: 0, y: 0 };

let drawGameOverScreen = () => {
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    createRect(0, 0, canvas.width, canvas.height, "black");

    // Draw the full game state so player can see where they died
    drawWalls();
    drawFoods();
    drawGhosts();

    // Draw death marker (X at death location)
    canvasContext.save();
    canvasContext.strokeStyle = "#FF0000";
    canvasContext.lineWidth = 3;
    let deathX = deathPosition.x + oneBlockSize / 2;
    let deathY = deathPosition.y + oneBlockSize / 2;

    // Pulsating death marker
    let pulseScale = 1 + Math.sin(Date.now() / 200) * 0.2;
    let markerSize = 12 * pulseScale;

    canvasContext.beginPath();
    canvasContext.moveTo(deathX - markerSize, deathY - markerSize);
    canvasContext.lineTo(deathX + markerSize, deathY + markerSize);
    canvasContext.moveTo(deathX + markerSize, deathY - markerSize);
    canvasContext.lineTo(deathX - markerSize, deathY + markerSize);
    canvasContext.stroke();

    // Death circle
    canvasContext.beginPath();
    canvasContext.strokeStyle = "rgba(255, 0, 0, 0.5)";
    canvasContext.arc(deathX, deathY, 20 * pulseScale, 0, Math.PI * 2);
    canvasContext.stroke();
    canvasContext.restore();

    // Semi-transparent overlay for text visibility
    canvasContext.fillStyle = "rgba(0, 0, 0, 0.6)";
    canvasContext.fillRect(canvas.width / 2 - 120, canvas.height / 2 - 80, 240, 160);
    canvasContext.strokeStyle = "#FF0000";
    canvasContext.lineWidth = 2;
    canvasContext.strokeRect(canvas.width / 2 - 120, canvas.height / 2 - 80, 240, 160);

    // Game Over text
    canvasContext.font = "bold 36px Arial";
    canvasContext.fillStyle = "red";
    canvasContext.textAlign = "center";
    canvasContext.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 40);

    // Final score
    canvasContext.font = "20px Arial";
    canvasContext.fillStyle = "white";
    canvasContext.fillText("Score: " + score, canvas.width / 2, canvas.height / 2);

    // Retry button
    let btnX = canvas.width / 2 - 60;
    let btnY = canvas.height / 2 + 20;
    let btnWidth = 120;
    let btnHeight = 40;

    canvasContext.fillStyle = "#4CAF50";
    canvasContext.fillRect(btnX, btnY, btnWidth, btnHeight);
    canvasContext.strokeStyle = "white";
    canvasContext.lineWidth = 2;
    canvasContext.strokeRect(btnX, btnY, btnWidth, btnHeight);

    canvasContext.font = "bold 20px Arial";
    canvasContext.fillStyle = "white";
    canvasContext.fillText("RETRY", canvas.width / 2, btnY + 28);

    canvasContext.textAlign = "left";
};

let restartGame = () => {
    // Clear game over animation
    if (gameOverInterval) {
        clearInterval(gameOverInterval);
        gameOverInterval = null;
    }

    // Reset all game state
    isGameOver = false;
    gameStarted = true;
    lives = 3;
    score = 0;
    isHiding = false;
    hideCooldown = 0;
    isPacmanDying = false;

    // Reset power mode state
    isPowerMode = false;
    powerModeTimer = 0;
    ghostCombo = 0;
    particles = [];
    floatingTexts = [];
    screenShake = 0;

    // Reset boss state
    bossSpawnTimer = 0;
    bossWarningTimer = 0;
    bossCount = 0;

    // Reset map (restore all food including power pellets)
    // Must match the initial map exactly!
    map = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 4, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 4, 1],
        [1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1],
        [1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1],
        [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
        [1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1],
        [1, 2, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1],
        [1, 1, 1, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 1, 1, 1],
        [0, 0, 0, 0, 1, 2, 1, 2, 2, 2, 2, 2, 2, 2, 1, 2, 1, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 2, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1],
        [2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2],
        [1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 2, 2, 1, 2, 1, 2, 1, 1, 1, 1, 1],
        [0, 0, 0, 0, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 2, 1, 2, 2, 2, 2, 2, 2, 2, 1, 2, 1, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 2, 2, 2, 1, 1, 1, 1, 1, 2, 2, 2, 1, 1, 1, 1, 1],
        [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
        [1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1],
        [1, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1, 2, 2, 2, 1],
        [1, 1, 2, 2, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 2, 1, 1],
        [1, 2, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1],
        [1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1],
        [1, 4, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 4, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];

    createNewPacman();
    createGhosts();
    playStartSound();
    startBgMusic();
    gameInterval = setInterval(gameLoop, 1000 / fps);
};

// Handle retry button click
canvas.addEventListener("click", (event) => {
    if (!isGameOver) return;

    let rect = canvas.getBoundingClientRect();
    let scaleX = canvas.width / rect.width;
    let scaleY = canvas.height / rect.height;
    let x = (event.clientX - rect.left) * scaleX;
    let y = (event.clientY - rect.top) * scaleY;

    let btnX = canvas.width / 2 - 60;
    let btnY = canvas.height / 2 + 20;
    let btnWidth = 120;
    let btnHeight = 40;

    if (x >= btnX && x <= btnX + btnWidth && y >= btnY && y <= btnY + btnHeight) {
        restartGame();
    }
});

// Handle retry button touch
canvas.addEventListener("touchstart", (event) => {
    if (!isGameOver) return;

    event.preventDefault();
    let rect = canvas.getBoundingClientRect();
    let scaleX = canvas.width / rect.width;
    let scaleY = canvas.height / rect.height;
    let touch = event.touches[0];
    let x = (touch.clientX - rect.left) * scaleX;
    let y = (touch.clientY - rect.top) * scaleY;

    let btnX = canvas.width / 2 - 60;
    let btnY = canvas.height / 2 + 20;
    let btnWidth = 120;
    let btnHeight = 40;

    if (x >= btnX && x <= btnX + btnWidth && y >= btnY && y <= btnY + btnHeight) {
        restartGame();
    }
}, { passive: false });

let checkWin = () => {
    for (let i = 0; i < map.length; i++) {
        for (let j = 0; j < map[0].length; j++) {
            if (map[i][j] == 2 || map[i][j] == 4) {
                return false;
            }
        }
    }
    return true;
};

let gameWin = () => {
    clearInterval(gameInterval);
    stopBgMusic();
    playWinSound();
    canvasContext.font = "40px Emulogic";
    canvasContext.fillStyle = "lime";
    canvasContext.fillText("YOU WIN!", canvas.width / 2 - 100, canvas.height / 2);
};

let toggleHide = () => {
    if (hideCooldown > 0 || isHiding) return;
    isHiding = true;
    playHideSound();
    hideCooldown = HIDE_COOLDOWN;

    setTimeout(() => {
        isHiding = false;
    }, (HIDE_DURATION / fps) * 1000);
};

let update = () => {
    // Update hide cooldown
    if (hideCooldown > 0) {
        hideCooldown--;
    }

    // Update power mode timer
    if (isPowerMode) {
        powerModeTimer--;
        if (powerModeTimer <= 0) {
            deactivatePowerMode();
        }
    }

    // Update particles
    particles = particles.filter(p => p.life > 0);
    for (let p of particles) {
        p.update();
    }

    // Update floating texts
    floatingTexts = floatingTexts.filter(t => t.life > 0);
    for (let t of floatingTexts) {
        t.update();
    }

    // Update screen shake
    if (screenShake > 0) {
        screenShake -= 0.5;
    }

    // Boss spawn timer
    bossSpawnTimer++;
    if (bossSpawnTimer >= BOSS_SPAWN_INTERVAL - BOSS_WARNING_DURATION && bossWarningTimer === 0) {
        // Start warning
        bossWarningTimer = BOSS_WARNING_DURATION;
        playBossWarningSound();
    }
    if (bossSpawnTimer >= BOSS_SPAWN_INTERVAL) {
        spawnBossGhost();
        bossSpawnTimer = 0;
        bossWarningTimer = 0;
    }
    if (bossWarningTimer > 0) {
        bossWarningTimer--;
    }

    pacman.moveProcess();
    pacman.eat();
    updateGhosts();

    // Update boss invincibility timer
    if (bossInvincibilityTimer > 0) {
        bossInvincibilityTimer--;
    }

    // Ghost collision logic
    if (!isHiding && bossInvincibilityTimer <= 0) {
        for (let i = 0; i < ghosts.length; i++) {
            let ghost = ghosts[i];
            if (ghost.getMapX() == pacman.getMapX() && ghost.getMapY() == pacman.getMapY()) {
                if (isPowerMode && ghost.isScared) {
                    // Eat the ghost!
                    eatGhost(ghost, i);
                } else if (!ghost.isScared) {
                    // Ghost kills pacman
                    onGhostCollision();
                    break;
                }
            }
        }
    }

    if (checkWin()) {
        gameWin();
    }
};

let powerPelletPulse = 0;

let drawFoods = () => {
    powerPelletPulse += 0.15;

    for (let i = 0; i < map.length; i++) {
        for (let j = 0; j < map[0].length; j++) {
            if (map[i][j] == 2) {
                // Regular food
                createRect(
                    j * oneBlockSize + oneBlockSize / 3,
                    i * oneBlockSize + oneBlockSize / 3,
                    oneBlockSize / 3,
                    oneBlockSize / 3,
                    "#FEB897"
                );
            } else if (map[i][j] == 4) {
                // Power Pellet with pulsating glow effect
                let centerX = j * oneBlockSize + oneBlockSize / 2;
                let centerY = i * oneBlockSize + oneBlockSize / 2;
                let baseSize = oneBlockSize / 2.5;
                let pulseSize = baseSize + Math.sin(powerPelletPulse) * 3;

                // Outer glow
                canvasContext.save();
                canvasContext.beginPath();
                let gradient = canvasContext.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseSize + 8);
                gradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
                gradient.addColorStop(0.5, 'rgba(255, 165, 0, 0.4)');
                gradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
                canvasContext.fillStyle = gradient;
                canvasContext.arc(centerX, centerY, pulseSize + 8, 0, Math.PI * 2);
                canvasContext.fill();

                // Inner pellet
                canvasContext.beginPath();
                canvasContext.fillStyle = '#FFD700';
                canvasContext.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
                canvasContext.fill();

                // Bright center
                canvasContext.beginPath();
                canvasContext.fillStyle = '#FFFFFF';
                canvasContext.arc(centerX, centerY, pulseSize * 0.4, 0, Math.PI * 2);
                canvasContext.fill();

                canvasContext.restore();
            }
        }
    }
};

let drawRemainingLives = () => {
    canvasContext.font = "20px Emulogic";
    canvasContext.fillStyle = "white";
    canvasContext.fillText("Lives: ", 220, oneBlockSize * (map.length + 1));

    for (let i = 0; i < lives; i++) {
        canvasContext.drawImage(
            pacmanFrames,
            2 * oneBlockSize,
            0,
            oneBlockSize,
            oneBlockSize,
            350 + i * oneBlockSize,
            oneBlockSize * map.length + 2,
            oneBlockSize,
            oneBlockSize
        );
    }
};

let drawScore = () => {
    canvasContext.font = "20px Emulogic";
    canvasContext.fillStyle = "white";
    canvasContext.fillText(
        "Score: " + score,
        0,
        oneBlockSize * (map.length + 1)
    );
};

let drawHideStatus = () => {
    // Draw hide status indicator
    let statusX = 0;
    let statusY = oneBlockSize * (map.length + 2);

    if (isHiding) {
        canvasContext.font = "14px Arial";
        canvasContext.fillStyle = "cyan";
        canvasContext.fillText("HIDING!", statusX, statusY);
    } else if (hideCooldown > 0) {
        canvasContext.font = "14px Arial";
        canvasContext.fillStyle = "#666";
        let cooldownSec = Math.ceil(hideCooldown / fps);
        canvasContext.fillText("Hide: " + cooldownSec + "s", statusX, statusY);
    } else {
        canvasContext.font = "14px Arial";
        canvasContext.fillStyle = "lime";
        canvasContext.fillText("Hide: READY", statusX, statusY);
    }
};

let drawPowerModeStatus = () => {
    if (!isPowerMode) return;

    let statusX = 150;
    let statusY = oneBlockSize * (map.length + 2);

    // Flashing "POWER MODE" text
    let flash = Math.sin(Date.now() / 100) > 0;
    canvasContext.font = "bold 14px Arial";

    // Warning when about to expire
    if (powerModeTimer < 90) { // Last 3 seconds
        canvasContext.fillStyle = flash ? "#FF0000" : "#FF6600";
    } else {
        canvasContext.fillStyle = flash ? "#FFD700" : "#FFA500";
    }

    let timeLeft = Math.ceil(powerModeTimer / fps);
    canvasContext.fillText("POWER: " + timeLeft + "s", statusX, statusY);

    // Draw combo indicator if any ghosts eaten
    if (ghostCombo > 0) {
        canvasContext.fillStyle = "#00FFFF";
        canvasContext.fillText(" x" + ghostCombo, statusX + 90, statusY);
    }
};

let draw = () => {
    canvasContext.save();

    // Apply screen shake
    if (screenShake > 0) {
        let shakeX = (Math.random() - 0.5) * screenShake;
        let shakeY = (Math.random() - 0.5) * screenShake;
        canvasContext.translate(shakeX, shakeY);
    }

    canvasContext.clearRect(-10, -10, canvas.width + 20, canvas.height + 20);
    createRect(-10, -10, canvas.width + 20, canvas.height + 20, "black");

    // Power mode background effect
    if (isPowerMode) {
        let flashIntensity = 0.1 + Math.sin(Date.now() / 100) * 0.05;
        canvasContext.fillStyle = `rgba(0, 100, 255, ${flashIntensity})`;
        canvasContext.fillRect(0, 0, canvas.width, canvas.height);
    }

    drawWalls();
    drawFoods();
    drawGhosts();

    // Draw pacman with transparency if hiding, bigger if power mode
    canvasContext.save();
    if (isHiding) {
        canvasContext.globalAlpha = 0.3 + Math.sin(Date.now() / 100) * 0.2;
    } else if (bossInvincibilityTimer > 0) {
        // Flashing effect during boss spawn invincibility
        canvasContext.globalAlpha = 0.4 + Math.sin(Date.now() / 50) * 0.6;
    }

    let pacmanScale = 1;
    if (isPowerMode) {
        // Draw pacman 1.5x bigger during power mode with pulsing
        pacmanScale = 1.5 + Math.sin(Date.now() / 150) * 0.1;
        let centerX = pacman.x + oneBlockSize / 2;
        let centerY = pacman.y + oneBlockSize / 2;
        canvasContext.translate(centerX, centerY);
        canvasContext.scale(pacmanScale, pacmanScale);
        canvasContext.translate(-centerX, -centerY);

        // Add glow effect to pacman
        canvasContext.shadowColor = '#FFD700';
        canvasContext.shadowBlur = 20;
    }
    pacman.draw();

    // Draw crown on pacman during power mode
    if (isPowerMode) {
        canvasContext.shadowBlur = 0; // Remove shadow for crown
        let crownX = pacman.x + oneBlockSize / 2;
        let crownY = pacman.y - 5 / pacmanScale; // Adjust for scale
        let crownSize = 12;

        // Crown base
        canvasContext.fillStyle = '#FFD700';
        canvasContext.beginPath();
        canvasContext.moveTo(crownX - crownSize / 2, crownY);
        canvasContext.lineTo(crownX - crownSize / 2, crownY - crownSize * 0.4);
        canvasContext.lineTo(crownX - crownSize / 4, crownY - crownSize * 0.6);
        canvasContext.lineTo(crownX - crownSize / 4, crownY - crownSize * 0.3);
        canvasContext.lineTo(crownX, crownY - crownSize * 0.8);
        canvasContext.lineTo(crownX + crownSize / 4, crownY - crownSize * 0.3);
        canvasContext.lineTo(crownX + crownSize / 4, crownY - crownSize * 0.6);
        canvasContext.lineTo(crownX + crownSize / 2, crownY - crownSize * 0.4);
        canvasContext.lineTo(crownX + crownSize / 2, crownY);
        canvasContext.closePath();
        canvasContext.fill();

        // Crown gems
        canvasContext.fillStyle = '#FF0000';
        canvasContext.beginPath();
        canvasContext.arc(crownX, crownY - crownSize * 0.5, 2, 0, Math.PI * 2);
        canvasContext.fill();

        canvasContext.fillStyle = '#00FF00';
        canvasContext.beginPath();
        canvasContext.arc(crownX - crownSize / 3, crownY - crownSize * 0.25, 1.5, 0, Math.PI * 2);
        canvasContext.fill();

        canvasContext.beginPath();
        canvasContext.arc(crownX + crownSize / 3, crownY - crownSize * 0.25, 1.5, 0, Math.PI * 2);
        canvasContext.fill();
    }
    canvasContext.restore();

    // Draw particles
    for (let p of particles) {
        p.draw();
    }

    // Draw floating texts
    for (let t of floatingTexts) {
        t.draw();
    }

    canvasContext.restore();

    drawScore();
    drawRemainingLives();
    drawHideStatus();
    drawPowerModeStatus();
    drawBossWarning();
};

// Draw boss warning
let drawBossWarning = () => {
    if (bossWarningTimer <= 0) return;

    // Flashing warning
    let flash = Math.sin(Date.now() / 80) > 0;
    if (!flash) return;

    canvasContext.save();

    // Red tint on screen
    canvasContext.fillStyle = 'rgba(255, 0, 0, 0.15)';
    canvasContext.fillRect(0, 0, canvas.width, map.length * oneBlockSize);

    // Warning text
    canvasContext.font = 'bold 24px Arial';
    canvasContext.fillStyle = '#FF0000';
    canvasContext.textAlign = 'center';
    canvasContext.strokeStyle = '#000000';
    canvasContext.lineWidth = 3;

    let warningText = 'BOSS INCOMING!';
    let textX = canvas.width / 2;
    let textY = canvas.height / 2 - 50;

    canvasContext.strokeText(warningText, textX, textY);
    canvasContext.fillText(warningText, textX, textY);

    // Countdown
    let countdown = Math.ceil(bossWarningTimer / fps);
    canvasContext.font = 'bold 36px Arial';
    canvasContext.fillStyle = '#FFD700';
    canvasContext.strokeText(countdown, textX, textY + 40);
    canvasContext.fillText(countdown, textX, textY + 40);

    canvasContext.textAlign = 'left';
    canvasContext.restore();
};

let drawWalls = () => {
    for (let i = 0; i < map.length; i++) {
        for (let j = 0; j < map[0].length; j++) {
            if (map[i][j] == 1) {
                createRect(
                    j * oneBlockSize,
                    i * oneBlockSize,
                    oneBlockSize,
                    oneBlockSize,
                    "#342DCA"
                );
                if (j > 0 && map[i][j - 1] == 1) {
                    createRect(
                        j * oneBlockSize,
                        i * oneBlockSize + wallOffset,
                        wallSpaceWidth + wallOffset,
                        wallSpaceWidth,
                        wallInnerColor
                    );
                }

                if (j < map[0].length - 1 && map[i][j + 1] == 1) {
                    createRect(
                        j * oneBlockSize + wallOffset,
                        i * oneBlockSize + wallOffset,
                        wallSpaceWidth + wallOffset,
                        wallSpaceWidth,
                        wallInnerColor
                    );
                }

                if (i < map.length - 1 && map[i + 1][j] == 1) {
                    createRect(
                        j * oneBlockSize + wallOffset,
                        i * oneBlockSize + wallOffset,
                        wallSpaceWidth,
                        wallSpaceWidth + wallOffset,
                        wallInnerColor
                    );
                }

                if (i > 0 && map[i - 1][j] == 1) {
                    createRect(
                        j * oneBlockSize + wallOffset,
                        i * oneBlockSize,
                        wallSpaceWidth,
                        wallSpaceWidth + wallOffset,
                        wallInnerColor
                    );
                }
            }
        }
    }
};

// Ghost types array for cycling
const ghostTypes = [GHOST_TYPE.BLINKY, GHOST_TYPE.PINKY, GHOST_TYPE.INKY, GHOST_TYPE.CLYDE];

let createGhosts = () => {
    ghosts = [];
    for (let i = 0; i < ghostCount; i++) {
        // Assign ghost type based on index (cycles through 4 types)
        let ghostType = ghostTypes[i % 4];

        // Adjust speed based on ghost type
        let ghostSpeed = pacman.speed / 2;
        if (ghostType === GHOST_TYPE.BLINKY) {
            ghostSpeed = pacman.speed / 1.8; // Blinky is slightly faster
        } else if (ghostType === GHOST_TYPE.CLYDE) {
            ghostSpeed = pacman.speed / 2.2; // Clyde is slightly slower
        }

        let newGhost = new Ghost(
            9 * oneBlockSize + (i % 2 == 0 ? 0 : 1) * oneBlockSize,
            10 * oneBlockSize + (i % 2 == 0 ? 0 : 1) * oneBlockSize,
            oneBlockSize,
            oneBlockSize,
            ghostSpeed,
            ghostImageLocations[i % 4].x,
            ghostImageLocations[i % 4].y,
            124,
            116,
            6 + i,
            ghostType
        );
        ghosts.push(newGhost);
    }
};

createNewPacman();
createGhosts();

window.addEventListener("keydown", (event) => {
    let k = event.keyCode;

    // Handle tutorial navigation
    if (tutorialScreen) {
        nextTutorialPage();
        return;
    }

    // Start game on any key press
    if (!gameStarted) {
        startGame();
        return;
    }

    setTimeout(() => {
        if (k == 37 || k == 65) {
            // left arrow or a
            pacman.nextDirection = DIRECTION_LEFT;
        } else if (k == 38 || k == 87) {
            // up arrow or w
            pacman.nextDirection = DIRECTION_UP;
        } else if (k == 39 || k == 68) {
            // right arrow or d
            pacman.nextDirection = DIRECTION_RIGHT;
        } else if (k == 40 || k == 83) {
            // bottom arrow or s
            pacman.nextDirection = DIRECTION_BOTTOM;
        } else if (k == 32) {
            // spacebar - hide
            toggleHide();
        } else if (k == 77) {
            // M key - toggle music
            toggleMusic();
        } else if (k == 78) {
            // N key - toggle sound effects
            toggleSound();
        }
    }, 1);
});

// Mobile touch controls
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
const minSwipeDistance = 30;

canvas.addEventListener("touchstart", (event) => {
    event.preventDefault();

    // Handle tutorial navigation
    if (tutorialScreen) {
        nextTutorialPage();
        return;
    }

    // Start game on tap
    if (!gameStarted) {
        startGame();
        return;
    }

    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
}, { passive: false });

canvas.addEventListener("touchend", (event) => {
    event.preventDefault();
    touchEndX = event.changedTouches[0].clientX;
    touchEndY = event.changedTouches[0].clientY;
    handleSwipe();
}, { passive: false });

let handleSwipe = () => {
    let deltaX = touchEndX - touchStartX;
    let deltaY = touchEndY - touchStartY;

    // Check if swipe distance is enough
    if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
        return;
    }

    // Determine swipe direction
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0) {
            pacman.nextDirection = DIRECTION_RIGHT;
        } else {
            pacman.nextDirection = DIRECTION_LEFT;
        }
    } else {
        // Vertical swipe
        if (deltaY > 0) {
            pacman.nextDirection = DIRECTION_BOTTOM;
        } else {
            pacman.nextDirection = DIRECTION_UP;
        }
    }
};

// Mobile detection and joystick setup
let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

if (isMobile) {
    let joystickContainer = document.getElementById("joystick-container");
    joystickContainer.style.display = "block";

    let btnUp = document.getElementById("btn-up");
    let btnDown = document.getElementById("btn-down");
    let btnLeft = document.getElementById("btn-left");
    let btnRight = document.getElementById("btn-right");
    let btnHide = document.getElementById("btn-hide");

    // Button press handlers (CSS handles visual feedback via :active)
    btnUp.addEventListener("touchstart", (e) => {
        e.preventDefault();
        pacman.nextDirection = DIRECTION_UP;
    }, { passive: false });

    btnDown.addEventListener("touchstart", (e) => {
        e.preventDefault();
        pacman.nextDirection = DIRECTION_BOTTOM;
    }, { passive: false });

    btnLeft.addEventListener("touchstart", (e) => {
        e.preventDefault();
        pacman.nextDirection = DIRECTION_LEFT;
    }, { passive: false });

    btnRight.addEventListener("touchstart", (e) => {
        e.preventDefault();
        pacman.nextDirection = DIRECTION_RIGHT;
    }, { passive: false });

    // Hide button
    btnHide.addEventListener("touchstart", (e) => {
        e.preventDefault();
        toggleHide();
    }, { passive: false });

    btnHide.addEventListener("click", () => toggleHide());

    // Also support mouse clicks for testing
    btnUp.addEventListener("click", () => pacman.nextDirection = DIRECTION_UP);
    btnDown.addEventListener("click", () => pacman.nextDirection = DIRECTION_BOTTOM);
    btnLeft.addEventListener("click", () => pacman.nextDirection = DIRECTION_LEFT);
    btnRight.addEventListener("click", () => pacman.nextDirection = DIRECTION_RIGHT);
}
