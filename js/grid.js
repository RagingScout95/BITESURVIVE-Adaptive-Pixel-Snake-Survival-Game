import { WORLD_WIDTH, WORLD_HEIGHT } from './constants.js';

export class Grid {
    constructor() {
        this.width = WORLD_WIDTH;
        this.height = WORLD_HEIGHT;
        this.walls = new Set();
        this.portals = new Map(); // portal position -> paired portal position
        this.occupied = new Set(); // Tracks occupied tiles (snakes, food)
    }

    // World wrapping
    wrapX(x) {
        return ((x % this.width) + this.width) % this.width;
    }

    wrapY(y) {
        return ((y % this.height) + this.height) % this.height;
    }

    wrap(pos) {
        return {
            x: this.wrapX(pos.x),
            y: this.wrapY(pos.y)
        };
    }

    // Check if position is valid (not a wall)
    isValid(pos) {
        const key = `${pos.x},${pos.y}`;
        return !this.walls.has(key);
    }

    // Check if position is occupied
    isOccupied(pos) {
        const key = `${pos.x},${pos.y}`;
        return this.occupied.has(key);
    }

    // Set occupied
    setOccupied(pos, value = true) {
        const key = `${pos.x},${pos.y}`;
        if (value) {
            this.occupied.add(key);
        } else {
            this.occupied.delete(key);
        }
    }

    // Add wall
    addWall(pos) {
        const key = `${pos.x},${pos.y}`;
        this.walls.add(key);
    }

    // Check if wall exists
    isWall(pos) {
        const key = `${pos.x},${pos.y}`;
        return this.walls.has(key);
    }

    // Add portal pair
    addPortalPair(pos1, pos2) {
        const key1 = `${pos1.x},${pos1.y}`;
        const key2 = `${pos2.x},${pos2.y}`;
        this.portals.set(key1, pos2);
        this.portals.set(key2, pos1);
    }

    // Get portal destination
    getPortalDestination(pos) {
        const key = `${pos.x},${pos.y}`;
        return this.portals.get(key);
    }

    // Check if position is a portal
    isPortal(pos) {
        const key = `${pos.x},${pos.y}`;
        return this.portals.has(key);
    }

    // Get all valid (non-wall) positions
    getValidPositions() {
        const positions = [];
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const pos = { x, y };
                if (this.isValid(pos)) {
                    positions.push(pos);
                }
            }
        }
        return positions;
    }

    // Clear occupied tiles
    clearOccupied() {
        this.occupied.clear();
    }
}

