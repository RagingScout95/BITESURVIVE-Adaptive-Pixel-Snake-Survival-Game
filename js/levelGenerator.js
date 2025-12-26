import { WORLD_WIDTH, WORLD_HEIGHT } from './constants.js';

export class LevelGenerator {
    constructor(grid) {
        this.grid = grid;
    }

    generate(difficulty = 1) {
        // Clear existing walls
        this.grid.walls.clear();
        this.grid.portals.clear();

        // Generate walls based on difficulty (much lower at start)
        const wallDensity = Math.min(0.03 + (difficulty - 1) * 0.015, 0.25);
        this.generateWallPatterns(wallDensity);

        // Verify solvability
        if (!this.isSolvable()) {
            // Regenerate if not solvable
            return this.generate(difficulty);
        }

        // Generate portals
        this.generatePortals(difficulty);
    }

    generateWallPatterns(density) {
        const patterns = ['zigzag', 'corridor', 'spiral', 'maze'];
        // Reduce pattern count significantly - density is already low
        const patternCount = Math.max(1, Math.floor(density * 50));

        for (let i = 0; i < patternCount; i++) {
            const pattern = patterns[Math.floor(Math.random() * patterns.length)];
            this.applyPattern(pattern);
        }
    }

    applyPattern(pattern) {
        const startX = Math.floor(Math.random() * WORLD_WIDTH);
        const startY = Math.floor(Math.random() * WORLD_HEIGHT);
        // Shorter patterns at start
        const length = 3 + Math.floor(Math.random() * 5);

        switch (pattern) {
            case 'zigzag':
                this.createZigZag(startX, startY, length);
                break;
            case 'corridor':
                this.createCorridor(startX, startY, length);
                break;
            case 'spiral':
                this.createSpiral(startX, startY, length);
                break;
            case 'maze':
                this.createMazeSection(startX, startY, length);
                break;
        }
    }

    createZigZag(startX, startY, length) {
        let x = startX;
        let y = startY;
        let dir = Math.random() < 0.5 ? 0 : 1; // 0 = horizontal, 1 = vertical

        for (let i = 0; i < length; i++) {
            if (this.isValidWallPosition({ x, y })) {
                this.grid.addWall({ x, y });
            }

            if (dir === 0) {
                x = (x + 1) % WORLD_WIDTH;
                if (i % 2 === 0) {
                    y = (y + 1) % WORLD_HEIGHT;
                } else {
                    y = (y - 1 + WORLD_HEIGHT) % WORLD_HEIGHT;
                }
            } else {
                y = (y + 1) % WORLD_HEIGHT;
                if (i % 2 === 0) {
                    x = (x + 1) % WORLD_WIDTH;
                } else {
                    x = (x - 1 + WORLD_WIDTH) % WORLD_WIDTH;
                }
            }
        }
    }

    createCorridor(startX, startY, length) {
        const dir = Math.floor(Math.random() * 4);
        let x = startX;
        let y = startY;

        for (let i = 0; i < length; i++) {
            if (this.isValidWallPosition({ x, y })) {
                this.grid.addWall({ x, y });
            }

            switch (dir) {
                case 0: y = (y - 1 + WORLD_HEIGHT) % WORLD_HEIGHT; break; // Up
                case 1: y = (y + 1) % WORLD_HEIGHT; break; // Down
                case 2: x = (x - 1 + WORLD_WIDTH) % WORLD_WIDTH; break; // Left
                case 3: x = (x + 1) % WORLD_WIDTH; break; // Right
            }
        }
    }

    createSpiral(startX, startY, length) {
        let x = startX;
        let y = startY;
        let steps = 1;
        let dir = 0; // 0=right, 1=down, 2=left, 3=up

        for (let i = 0; i < length; i++) {
            if (this.isValidWallPosition({ x, y })) {
                this.grid.addWall({ x, y });
            }

            switch (dir) {
                case 0: x = (x + 1) % WORLD_WIDTH; break;
                case 1: y = (y + 1) % WORLD_HEIGHT; break;
                case 2: x = (x - 1 + WORLD_WIDTH) % WORLD_WIDTH; break;
                case 3: y = (y - 1 + WORLD_HEIGHT) % WORLD_HEIGHT; break;
            }

            if (i % steps === 0 && i > 0) {
                dir = (dir + 1) % 4;
                if (dir % 2 === 0) steps++;
            }
        }
    }

    createMazeSection(startX, startY, length) {
        // Simple maze-like pattern
        for (let i = 0; i < length; i++) {
            const x = (startX + i) % WORLD_WIDTH;
            const y = (startY + Math.floor(i / 2)) % WORLD_HEIGHT;
            
            if (this.isValidWallPosition({ x, y })) {
                this.grid.addWall({ x, y });
            }
        }
    }

    isValidWallPosition(pos) {
        // Don't place walls too close to spawn or in critical paths
        const key = `${pos.x},${pos.y}`;
        return !this.grid.walls.has(key);
    }

    generatePortals(difficulty) {
        const portalCount = Math.min(2 + Math.floor(difficulty / 2), 4);
        const validPositions = this.grid.getValidPositions().filter(pos => {
            return !this.grid.isOccupied(pos);
        });

        for (let i = 0; i < portalCount; i += 2) {
            if (validPositions.length < 2) break;

            const idx1 = Math.floor(Math.random() * validPositions.length);
            const pos1 = validPositions.splice(idx1, 1)[0];

            const idx2 = Math.floor(Math.random() * validPositions.length);
            const pos2 = validPositions.splice(idx2, 1)[0];

            this.grid.addPortalPair(pos1, pos2);
        }
    }

    isSolvable() {
        // BFS to check connectivity
        const visited = new Set();
        const queue = [];
        const startPos = this.findStartPosition();
        
        if (!startPos) return false;

        queue.push(startPos);
        visited.add(`${startPos.x},${startPos.y}`);

        while (queue.length > 0) {
            const current = queue.shift();
            const neighbors = this.getNeighbors(current);

            for (const neighbor of neighbors) {
                const key = `${neighbor.x},${neighbor.y}`;
                if (!visited.has(key) && this.grid.isValid(neighbor)) {
                    visited.add(key);
                    queue.push(neighbor);
                }
            }
        }

        // Check if all valid tiles are reachable
        const validTiles = this.grid.getValidPositions();
        return visited.size >= validTiles.length * 0.8; // At least 80% reachable
    }

    findStartPosition() {
        // Find a valid starting position with clear space around it
        const centerX = Math.floor(WORLD_WIDTH / 2);
        const centerY = Math.floor(WORLD_HEIGHT / 2);

        for (let radius = 0; radius < Math.max(WORLD_WIDTH, WORLD_HEIGHT); radius++) {
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dy = -radius; dy <= radius; dy++) {
                    if (Math.abs(dx) === radius || Math.abs(dy) === radius) {
                        const x = this.grid.wrapX(centerX + dx);
                        const y = this.grid.wrapY(centerY + dy);
                        const pos = { x, y };
                        // Check if position and surrounding area is clear (no walls nearby)
                        if (this.grid.isValid(pos) && this.hasClearSpace(pos, 3)) {
                            return pos;
                        }
                    }
                }
            }
        }
        // Fallback: any valid position
        for (let y = 0; y < WORLD_HEIGHT; y++) {
            for (let x = 0; x < WORLD_WIDTH; x++) {
                const pos = { x, y };
                if (this.grid.isValid(pos) && this.hasClearSpace(pos, 2)) {
                    return pos;
                }
            }
        }
        return null;
    }
    
    hasClearSpace(pos, radius) {
        // Check if there are no walls within radius tiles
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const checkPos = {
                    x: this.grid.wrapX(pos.x + dx),
                    y: this.grid.wrapY(pos.y + dy)
                };
                if (this.grid.isWall(checkPos)) {
                    return false;
                }
            }
        }
        return true;
    }

    getNeighbors(pos) {
        return [
            { x: this.grid.wrapX(pos.x), y: this.grid.wrapY(pos.y - 1) },
            { x: this.grid.wrapX(pos.x), y: this.grid.wrapY(pos.y + 1) },
            { x: this.grid.wrapX(pos.x - 1), y: this.grid.wrapY(pos.y) },
            { x: this.grid.wrapX(pos.x + 1), y: this.grid.wrapY(pos.y) }
        ];
    }
}

