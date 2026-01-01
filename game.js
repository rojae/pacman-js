const canvas = document.getElementById("canvas");
const canvasContext = canvas.getContext("2d");
const pacmanFrames = document.getElementById("animation");
const ghostFrames = document.getElementById("ghosts");

let createRect = (x, y, width, height, color) => {
    canvasContext.fillStyle = color;
    canvasContext.fillRect(x, y, width, height);
};

const DIRECTION_RIGHT = 4;
const DIRECTION_UP = 3;
const DIRECTION_LEFT = 2;
const DIRECTION_BOTTOM = 1;
let lives = 3;
let ghostCount = 100;
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
let map = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
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
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

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

    // Draw pacman animation
    let pacmanX = (startScreenFrame * 3) % (canvas.width + 60) - 30;
    let animY = boxY + boxHeight + 35;
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

let startGame = () => {
    if (gameStarted) return;
    gameStarted = true;

    if (startScreenInterval) {
        clearInterval(startScreenInterval);
        startScreenInterval = null;
    }

    gameInterval = setInterval(gameLoop, 1000 / fps);
};

// Show start screen
startScreenInterval = setInterval(drawStartScreen, 1000 / fps);

let restartPacmanAndGhosts = () => {
    createNewPacman();
    createGhosts();
};

let onGhostCollision = () => {
    if (isPacmanDying) return;

    isPacmanDying = true;
    clearInterval(gameInterval);

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

let gameOver = () => {
    clearInterval(gameInterval);
    isGameOver = true;
    drawGameOverScreen();
};

let drawGameOverScreen = () => {
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    createRect(0, 0, canvas.width, canvas.height, "black");
    drawWalls();

    // Game Over text
    canvasContext.font = "40px Arial";
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

    canvasContext.font = "20px Arial";
    canvasContext.fillStyle = "white";
    canvasContext.fillText("RETRY", canvas.width / 2, btnY + 28);

    canvasContext.textAlign = "left";
};

let restartGame = () => {
    // Reset all game state
    isGameOver = false;
    gameStarted = true;
    lives = 3;
    score = 0;
    isHiding = false;
    hideCooldown = 0;
    isPacmanDying = false;

    // Reset map (restore all food)
    map = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
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
        [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];

    createNewPacman();
    createGhosts();
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
            if (map[i][j] == 2) {
                return false;
            }
        }
    }
    return true;
};

let gameWin = () => {
    clearInterval(gameInterval);
    canvasContext.font = "40px Emulogic";
    canvasContext.fillStyle = "lime";
    canvasContext.fillText("YOU WIN!", canvas.width / 2 - 100, canvas.height / 2);
};

let toggleHide = () => {
    if (hideCooldown > 0 || isHiding) return;
    isHiding = true;
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

    pacman.moveProcess();
    pacman.eat();
    updateGhosts();

    // Only check ghost collision if not hiding
    if (!isHiding && pacman.checkGhostCollision(ghosts)) {
        onGhostCollision();
    }
    if (checkWin()) {
        gameWin();
    }
};

let drawFoods = () => {
    for (let i = 0; i < map.length; i++) {
        for (let j = 0; j < map[0].length; j++) {
            if (map[i][j] == 2) {
                createRect(
                    j * oneBlockSize + oneBlockSize / 3,
                    i * oneBlockSize + oneBlockSize / 3,
                    oneBlockSize / 3,
                    oneBlockSize / 3,
                    "#FEB897"
                );
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

let draw = () => {
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    createRect(0, 0, canvas.width, canvas.height, "black");
    drawWalls();
    drawFoods();
    drawGhosts();

    // Draw pacman with transparency if hiding
    if (isHiding) {
        canvasContext.globalAlpha = 0.3 + Math.sin(Date.now() / 100) * 0.2;
    }
    pacman.draw();
    canvasContext.globalAlpha = 1;

    drawScore();
    drawRemainingLives();
    drawHideStatus();
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

let createGhosts = () => {
    ghosts = [];
    for (let i = 0; i < ghostCount; i++) {
        let newGhost = new Ghost(
            9 * oneBlockSize + (i % 2 == 0 ? 0 : 1) * oneBlockSize,
            10 * oneBlockSize + (i % 2 == 0 ? 0 : 1) * oneBlockSize,
            oneBlockSize,
            oneBlockSize,
            pacman.speed / 2,
            ghostImageLocations[i % 4].x,
            ghostImageLocations[i % 4].y,
            124,
            116,
            6 + i
        );
        ghosts.push(newGhost);
    }
};

createNewPacman();
createGhosts();

window.addEventListener("keydown", (event) => {
    let k = event.keyCode;

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

    // Button press handlers
    btnUp.addEventListener("touchstart", (e) => {
        e.preventDefault();
        pacman.nextDirection = DIRECTION_UP;
        btnUp.style.background = "rgba(255,255,0,1)";
    }, { passive: false });

    btnDown.addEventListener("touchstart", (e) => {
        e.preventDefault();
        pacman.nextDirection = DIRECTION_BOTTOM;
        btnDown.style.background = "rgba(255,255,0,1)";
    }, { passive: false });

    btnLeft.addEventListener("touchstart", (e) => {
        e.preventDefault();
        pacman.nextDirection = DIRECTION_LEFT;
        btnLeft.style.background = "rgba(255,255,0,1)";
    }, { passive: false });

    btnRight.addEventListener("touchstart", (e) => {
        e.preventDefault();
        pacman.nextDirection = DIRECTION_RIGHT;
        btnRight.style.background = "rgba(255,255,0,1)";
    }, { passive: false });

    // Hide button
    btnHide.addEventListener("touchstart", (e) => {
        e.preventDefault();
        toggleHide();
        btnHide.style.background = "rgba(0,255,255,1)";
    }, { passive: false });

    btnHide.addEventListener("touchend", (e) => {
        e.preventDefault();
        btnHide.style.background = "rgba(0,255,255,0.7)";
    }, { passive: false });

    btnHide.addEventListener("click", () => toggleHide());

    // Reset button styles on touch end
    [btnUp, btnDown, btnLeft, btnRight].forEach(btn => {
        btn.addEventListener("touchend", (e) => {
            e.preventDefault();
            btn.style.background = "rgba(255,255,0,0.7)";
        }, { passive: false });
    });

    // Also support mouse clicks for testing
    btnUp.addEventListener("click", () => pacman.nextDirection = DIRECTION_UP);
    btnDown.addEventListener("click", () => pacman.nextDirection = DIRECTION_BOTTOM);
    btnLeft.addEventListener("click", () => pacman.nextDirection = DIRECTION_LEFT);
    btnRight.addEventListener("click", () => pacman.nextDirection = DIRECTION_RIGHT);
}
