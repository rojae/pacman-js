// Ghost AI Types (like original Pac-Man)
const GHOST_TYPE = {
    BLINKY: 'blinky',  // Red - Direct chase, aggressive
    PINKY: 'pinky',    // Pink - Ambush, targets ahead of pacman
    INKY: 'inky',      // Cyan - Unpredictable, random movement
    CLYDE: 'clyde',    // Orange - Shy, runs away when close
    BOSS: 'boss'       // King Ghost - 1.5x size, crown, 500 points
};

class Ghost {
    constructor(
        x,
        y,
        width,
        height,
        speed,
        imageX,
        imageY,
        imageWidth,
        imageHeight,
        range,
        ghostType = GHOST_TYPE.BLINKY
    ) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed;
        this.direction = DIRECTION_RIGHT;
        this.imageX = imageX;
        this.imageY = imageY;
        this.imageHeight = imageHeight;
        this.imageWidth = imageWidth;
        this.range = range;
        this.ghostType = ghostType;
        this.randomTargetIndex = parseInt(Math.random() * 4);
        this.target = randomTargetsForGhosts[this.randomTargetIndex];

        // Inky changes direction more frequently
        let directionChangeInterval = this.ghostType === GHOST_TYPE.INKY ? 3000 : 10000;
        setInterval(() => {
            this.changeRandomDirection();
        }, directionChangeInterval);
    }

    isInRange() {
        // Blinky and Boss always chase pacman (no range limit)
        if (this.ghostType === GHOST_TYPE.BLINKY || this.ghostType === GHOST_TYPE.BOSS) {
            return true;
        }

        // Pinky has extended range for ambush
        if (this.ghostType === GHOST_TYPE.PINKY) {
            return true; // Always tries to ambush
        }

        // Other ghosts use range check but with larger range
        let xDistance = Math.abs(pacman.getMapX() - this.getMapX());
        let yDistance = Math.abs(pacman.getMapY() - this.getMapY());
        let distance = Math.sqrt(xDistance * xDistance + yDistance * yDistance);

        // Increase effective range for more aggressive behavior
        return distance <= this.range * 1.5;
    }

    changeRandomDirection() {
        let addition = 1;
        this.randomTargetIndex += addition;
        this.randomTargetIndex = this.randomTargetIndex % 4;
    }

    moveProcess() {
        if (this.isInRange()) {
            this.target = this.getTargetByType();
        } else {
            this.target = randomTargetsForGhosts[this.randomTargetIndex];
        }
        this.changeDirectionIfPossible();
        this.moveForwards();
        if (this.checkCollisions()) {
            this.moveBackwards();
            return;
        }
    }

    // Get target position based on ghost personality
    getTargetByType() {
        switch (this.ghostType) {
            case GHOST_TYPE.BLINKY:
                // Blinky: Direct chase - targets pacman's current position
                return pacman;

            case GHOST_TYPE.PINKY:
                // Pinky: Ambush - targets 4 tiles ahead of pacman
                return this.getPinkyTarget();

            case GHOST_TYPE.INKY:
                // Inky: Unpredictable - random target or pacman
                return this.getInkyTarget();

            case GHOST_TYPE.CLYDE:
                // Clyde: Shy - chases when far, runs when close
                return this.getClydeTarget();

            case GHOST_TYPE.BOSS:
                // Boss: Relentless pursuer - always targets pacman directly
                return pacman;

            default:
                return pacman;
        }
    }

    // Pinky targets 4 tiles ahead of pacman's direction
    getPinkyTarget() {
        let targetX = pacman.x;
        let targetY = pacman.y;
        let lookAhead = 4 * oneBlockSize;

        switch (pacman.direction) {
            case DIRECTION_RIGHT:
                targetX += lookAhead;
                break;
            case DIRECTION_LEFT:
                targetX -= lookAhead;
                break;
            case DIRECTION_UP:
                targetY -= lookAhead;
                break;
            case DIRECTION_BOTTOM:
                targetY += lookAhead;
                break;
        }

        // Clamp to map bounds
        targetX = Math.max(0, Math.min(targetX, (map[0].length - 1) * oneBlockSize));
        targetY = Math.max(0, Math.min(targetY, (map.length - 1) * oneBlockSize));

        return { x: targetX, y: targetY };
    }

    // Inky has unpredictable behavior
    getInkyTarget() {
        // 30% chance to target random corner, 70% chance to chase
        if (Math.random() < 0.3) {
            return randomTargetsForGhosts[parseInt(Math.random() * 4)];
        }
        return pacman;
    }

    // Clyde runs away when too close to pacman
    getClydeTarget() {
        let distance = Math.sqrt(
            Math.pow(pacman.x - this.x, 2) + Math.pow(pacman.y - this.y, 2)
        );

        // If closer than 8 tiles, run to corner
        if (distance < 8 * oneBlockSize) {
            // Run to the corner farthest from pacman
            let farthestCorner = randomTargetsForGhosts[0];
            let maxDist = 0;

            for (let corner of randomTargetsForGhosts) {
                let cornerDist = Math.sqrt(
                    Math.pow(pacman.x - corner.x, 2) + Math.pow(pacman.y - corner.y, 2)
                );
                if (cornerDist > maxDist) {
                    maxDist = cornerDist;
                    farthestCorner = corner;
                }
            }
            return farthestCorner;
        }

        // Otherwise chase pacman
        return pacman;
    }

    moveBackwards() {
        switch (this.direction) {
            case 4: // Right
                this.x -= this.speed;
                break;
            case 3: // Up
                this.y += this.speed;
                break;
            case 2: // Left
                this.x += this.speed;
                break;
            case 1: // Bottom
                this.y -= this.speed;
                break;
        }
    }

    moveForwards() {
        switch (this.direction) {
            case 4: // Right
                this.x += this.speed;
                break;
            case 3: // Up
                this.y -= this.speed;
                break;
            case 2: // Left
                this.x -= this.speed;
                break;
            case 1: // Bottom
                this.y += this.speed;
                break;
        }
    }

    checkCollisions() {
        let isCollided = false;

        // Check map boundaries
        if (this.x < 0 || this.y < 0 ||
            this.x + this.width > map[0].length * oneBlockSize ||
            this.y + this.height > map.length * oneBlockSize) {
            return true;
        }

        let mapX = parseInt(this.x / oneBlockSize);
        let mapY = parseInt(this.y / oneBlockSize);
        let mapXEnd = parseInt((this.x + this.width - 1) / oneBlockSize);
        let mapYEnd = parseInt((this.y + this.height - 1) / oneBlockSize);

        // Check if indices are within bounds
        if (mapY < 0 || mapY >= map.length || mapX < 0 || mapX >= map[0].length ||
            mapYEnd < 0 || mapYEnd >= map.length || mapXEnd < 0 || mapXEnd >= map[0].length) {
            return true;
        }

        if (
            map[mapY][mapX] == 1 ||
            map[mapYEnd][mapX] == 1 ||
            map[mapY][mapXEnd] == 1 ||
            map[mapYEnd][mapXEnd] == 1
        ) {
            isCollided = true;
        }
        return isCollided;
    }

    changeDirectionIfPossible() {
        let tempDirection = this.direction;
        this.direction = this.calculateNewDirection(
            map,
            parseInt(this.target.x / oneBlockSize),
            parseInt(this.target.y / oneBlockSize)
        );
        if (typeof this.direction == "undefined") {
            this.direction = tempDirection;
            return;
        }
        if (
            this.getMapY() != this.getMapYRightSide() &&
            (this.direction == DIRECTION_LEFT ||
                this.direction == DIRECTION_RIGHT)
        ) {
            this.direction = DIRECTION_UP;
        }
        if (
            this.getMapX() != this.getMapXRightSide() &&
            this.direction == DIRECTION_UP
        ) {
            this.direction = DIRECTION_LEFT;
        }
        this.moveForwards();
        if (this.checkCollisions()) {
            this.moveBackwards();
            this.direction = tempDirection;
        } else {
            this.moveBackwards();
        }
    }

    calculateNewDirection(map, destX, destY) {
        let mp = [];
        for (let i = 0; i < map.length; i++) {
            mp[i] = map[i].slice();
        }

        let queue = [
            {
                x: this.getMapX(),
                y: this.getMapY(),
                rightX: this.getMapXRightSide(),
                rightY: this.getMapYRightSide(),
                moves: [],
            },
        ];
        while (queue.length > 0) {
            let poped = queue.shift();
            if (poped.x == destX && poped.y == destY) {
                return poped.moves[0];
            } else {
                mp[poped.y][poped.x] = 1;
                let neighborList = this.addNeighbors(poped, mp);
                for (let i = 0; i < neighborList.length; i++) {
                    queue.push(neighborList[i]);
                }
            }
        }

        return 1; // direction
    }

    addNeighbors(poped, mp) {
        let queue = [];
        let numOfRows = mp.length;
        let numOfColumns = mp[0].length;

        if (
            poped.x - 1 >= 0 &&
            poped.x - 1 < numOfColumns &&
            mp[poped.y][poped.x - 1] != 1
        ) {
            let tempMoves = poped.moves.slice();
            tempMoves.push(DIRECTION_LEFT);
            queue.push({ x: poped.x - 1, y: poped.y, moves: tempMoves });
        }
        if (
            poped.x + 1 >= 0 &&
            poped.x + 1 < numOfColumns &&
            mp[poped.y][poped.x + 1] != 1
        ) {
            let tempMoves = poped.moves.slice();
            tempMoves.push(DIRECTION_RIGHT);
            queue.push({ x: poped.x + 1, y: poped.y, moves: tempMoves });
        }
        if (
            poped.y - 1 >= 0 &&
            poped.y - 1 < numOfRows &&
            mp[poped.y - 1][poped.x] != 1
        ) {
            let tempMoves = poped.moves.slice();
            tempMoves.push(DIRECTION_UP);
            queue.push({ x: poped.x, y: poped.y - 1, moves: tempMoves });
        }
        if (
            poped.y + 1 >= 0 &&
            poped.y + 1 < numOfRows &&
            mp[poped.y + 1][poped.x] != 1
        ) {
            let tempMoves = poped.moves.slice();
            tempMoves.push(DIRECTION_BOTTOM);
            queue.push({ x: poped.x, y: poped.y + 1, moves: tempMoves });
        }
        return queue;
    }

    getMapX() {
        let mapX = parseInt(this.x / oneBlockSize);
        return mapX;
    }

    getMapY() {
        let mapY = parseInt(this.y / oneBlockSize);
        return mapY;
    }

    getMapXRightSide() {
        let mapX = parseInt((this.x + this.width - 1) / oneBlockSize);
        return mapX;
    }

    getMapYRightSide() {
        let mapY = parseInt((this.y + this.height - 1) / oneBlockSize);
        return mapY;
    }

    changeAnimation() {
        this.currentFrame =
            this.currentFrame == this.frameCount ? 1 : this.currentFrame + 1;
    }

    draw() {
        canvasContext.save();

        if (this.isScared) {
            // Draw scared ghost (blue, wobbly)
            let wobble = Math.sin(Date.now() / 50 + this.x) * 2;

            // Blue ghost body
            canvasContext.fillStyle = isPowerMode && powerModeTimer < 90
                ? (Math.sin(Date.now() / 100) > 0 ? '#0000FF' : '#FFFFFF') // Flash when power ending
                : '#0000FF';

            // Ghost body shape
            canvasContext.beginPath();
            let centerX = this.x + oneBlockSize / 2;
            let centerY = this.y + oneBlockSize / 2;

            // Draw rounded top
            canvasContext.arc(centerX + wobble, centerY - 2, oneBlockSize / 2 - 2, Math.PI, 0);

            // Draw wavy bottom
            let bottomY = this.y + this.height - 2;
            canvasContext.lineTo(this.x + this.width - 2, bottomY);
            for (let i = 3; i >= 0; i--) {
                let waveX = this.x + 2 + (i * (this.width - 4) / 3);
                let waveY = bottomY + (i % 2 === 0 ? 4 : -2);
                canvasContext.lineTo(waveX + wobble, waveY);
            }
            canvasContext.closePath();
            canvasContext.fill();

            // Scared eyes (X X pattern)
            canvasContext.strokeStyle = '#FFFFFF';
            canvasContext.lineWidth = 2;
            let eyeY = centerY - 2;

            // Left eye X
            canvasContext.beginPath();
            canvasContext.moveTo(centerX - 6 + wobble, eyeY - 3);
            canvasContext.lineTo(centerX - 2 + wobble, eyeY + 3);
            canvasContext.moveTo(centerX - 2 + wobble, eyeY - 3);
            canvasContext.lineTo(centerX - 6 + wobble, eyeY + 3);
            canvasContext.stroke();

            // Right eye X
            canvasContext.beginPath();
            canvasContext.moveTo(centerX + 2 + wobble, eyeY - 3);
            canvasContext.lineTo(centerX + 6 + wobble, eyeY + 3);
            canvasContext.moveTo(centerX + 6 + wobble, eyeY - 3);
            canvasContext.lineTo(centerX + 2 + wobble, eyeY + 3);
            canvasContext.stroke();

            // Wavy scared mouth
            canvasContext.beginPath();
            canvasContext.strokeStyle = '#FFFFFF';
            canvasContext.lineWidth = 1.5;
            let mouthY = centerY + 5;
            canvasContext.moveTo(centerX - 5 + wobble, mouthY);
            canvasContext.lineTo(centerX - 3 + wobble, mouthY - 2);
            canvasContext.lineTo(centerX + wobble, mouthY);
            canvasContext.lineTo(centerX + 3 + wobble, mouthY - 2);
            canvasContext.lineTo(centerX + 5 + wobble, mouthY);
            canvasContext.stroke();

        } else if (this.ghostType === GHOST_TYPE.BOSS) {
            // Boss ghost - 1.5x size with crown
            let scale = 1.5;
            let centerX = this.x + oneBlockSize / 2;
            let centerY = this.y + oneBlockSize / 2;
            let wobble = Math.sin(Date.now() / 100) * 2;

            // Glow effect
            canvasContext.shadowColor = '#FFD700';
            canvasContext.shadowBlur = 15;

            // Purple ghost body (larger)
            canvasContext.fillStyle = '#8B00FF';
            canvasContext.beginPath();

            // Draw rounded top (bigger)
            let radius = (oneBlockSize / 2) * scale;
            canvasContext.arc(centerX, centerY - 5, radius, Math.PI, 0);

            // Draw wavy bottom
            let bottomY = centerY + radius - 5;
            canvasContext.lineTo(centerX + radius, bottomY);
            for (let i = 4; i >= 0; i--) {
                let waveX = centerX - radius + (i * (radius * 2) / 4);
                let waveY = bottomY + (i % 2 === 0 ? 6 : -3);
                canvasContext.lineTo(waveX, waveY);
            }
            canvasContext.closePath();
            canvasContext.fill();

            canvasContext.shadowBlur = 0;

            // Boss eyes (bigger, menacing)
            canvasContext.fillStyle = '#FFFFFF';
            canvasContext.beginPath();
            canvasContext.ellipse(centerX - 8, centerY - 8, 6, 8, 0, 0, Math.PI * 2);
            canvasContext.fill();
            canvasContext.beginPath();
            canvasContext.ellipse(centerX + 8, centerY - 8, 6, 8, 0, 0, Math.PI * 2);
            canvasContext.fill();

            // Pupils (looking at pacman)
            canvasContext.fillStyle = '#FF0000';
            let pupilOffsetX = pacman ? Math.sign(pacman.x - this.x) * 2 : 0;
            let pupilOffsetY = pacman ? Math.sign(pacman.y - this.y) * 2 : 0;
            canvasContext.beginPath();
            canvasContext.arc(centerX - 8 + pupilOffsetX, centerY - 8 + pupilOffsetY, 3, 0, Math.PI * 2);
            canvasContext.fill();
            canvasContext.beginPath();
            canvasContext.arc(centerX + 8 + pupilOffsetX, centerY - 8 + pupilOffsetY, 3, 0, Math.PI * 2);
            canvasContext.fill();

            // Draw crown on top
            let crownY = centerY - radius - 8;
            let crownSize = 16;

            canvasContext.fillStyle = '#FFD700';
            canvasContext.beginPath();
            canvasContext.moveTo(centerX - crownSize / 2, crownY + 5);
            canvasContext.lineTo(centerX - crownSize / 2, crownY);
            canvasContext.lineTo(centerX - crownSize / 4, crownY - crownSize * 0.4);
            canvasContext.lineTo(centerX - crownSize / 4, crownY + 2);
            canvasContext.lineTo(centerX, crownY - crownSize * 0.6);
            canvasContext.lineTo(centerX + crownSize / 4, crownY + 2);
            canvasContext.lineTo(centerX + crownSize / 4, crownY - crownSize * 0.4);
            canvasContext.lineTo(centerX + crownSize / 2, crownY);
            canvasContext.lineTo(centerX + crownSize / 2, crownY + 5);
            canvasContext.closePath();
            canvasContext.fill();

            // Crown gems
            canvasContext.fillStyle = '#FF0000';
            canvasContext.beginPath();
            canvasContext.arc(centerX, crownY - crownSize * 0.3, 3, 0, Math.PI * 2);
            canvasContext.fill();

            canvasContext.fillStyle = '#00FF00';
            canvasContext.beginPath();
            canvasContext.arc(centerX - crownSize / 3, crownY, 2, 0, Math.PI * 2);
            canvasContext.fill();
            canvasContext.beginPath();
            canvasContext.arc(centerX + crownSize / 3, crownY, 2, 0, Math.PI * 2);
            canvasContext.fill();

        } else {
            // Normal ghost drawing
            canvasContext.drawImage(
                ghostFrames,
                this.imageX,
                this.imageY,
                this.imageWidth,
                this.imageHeight,
                this.x,
                this.y,
                this.width,
                this.height
            );

            // Draw type indicator (small colored dot)
            let indicatorColor;
            switch (this.ghostType) {
                case GHOST_TYPE.BLINKY:
                    indicatorColor = '#FF0000'; // Red
                    break;
                case GHOST_TYPE.PINKY:
                    indicatorColor = '#FFB8FF'; // Pink
                    break;
                case GHOST_TYPE.INKY:
                    indicatorColor = '#00FFFF'; // Cyan
                    break;
                case GHOST_TYPE.CLYDE:
                    indicatorColor = '#FFB852'; // Orange
                    break;
                default:
                    indicatorColor = '#FFFFFF';
            }

            // Small indicator dot on top of ghost
            canvasContext.beginPath();
            canvasContext.fillStyle = indicatorColor;
            canvasContext.arc(
                this.x + oneBlockSize / 2,
                this.y + 2,
                3,
                0,
                2 * Math.PI
            );
            canvasContext.fill();
        }

        canvasContext.restore();
    }
}

let updateGhosts = () => {
    for (let i = 0; i < ghosts.length; i++) {
        ghosts[i].moveProcess();
    }
};

let drawGhosts = () => {
    for (let i = 0; i < ghosts.length; i++) {
        ghosts[i].draw();
    }
};
