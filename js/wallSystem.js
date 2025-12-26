import { TILES } from './constants.js';

export class WallSystem {
    constructor(grid) {
        this.grid = grid;
    }

    // Get wall rotation based on neighbors
    getWallRotation(pos) {
        return 0; // Walls are pre-rotated in atlas
    }

    getNeighbors(pos) {
        return [
            { x: pos.x, y: pos.y - 1 }, // Up
            { x: pos.x, y: pos.y + 1 }, // Down
            { x: pos.x - 1, y: pos.y }, // Left
            { x: pos.x + 1, y: pos.y }  // Right
        ];
    }

    // Get wall tile type
    getWallTile(pos) {
        const neighbors = this.getNeighbors(pos);

        // Determine neighbors
        const up = this.grid.isWall({ x: pos.x, y: pos.y - 1 });
        const down = this.grid.isWall({ x: pos.x, y: pos.y + 1 });
        const left = this.grid.isWall({ x: pos.x - 1, y: pos.y });
        const right = this.grid.isWall({ x: pos.x + 1, y: pos.y });

        const wallCount = neighbors.filter(n => this.grid.isWall(n)).length;

        // Isolated or single neighbor - default to vertical or horizontal based on existence?
        // Let's implement full logic from constants

        // Corners
        if (right && down && !up && !left) return TILES.WALL_CORNER_BR; // Or specific mapping?
        // BR (Bottom-Right) connects Bottom and Right.
        // Wait, "Bottom-right corner" usually means it IS the bottom-right corner of a room (walls Top and Left?).
        // Or "Connects Bottom and Right"?
        // If it looks like an 'L', it connects Top and Right -> BL corner visually?
        // Let's assume the names match the CONNECTIONS.
        // WALL_CORNER_BR (Connects Bottom and Right). -> (Right and Down neighbors)
        if (right && down) return TILES.WALL_CORNER_BR;
        if (left && down) return TILES.WALL_CORNER_BL; // Connects Left and Down
        if (right && up) return TILES.WALL_CORNER_TR;  // Connects Right and Up
        if (left && up) return TILES.WALL_CORNER_TL;   // Connects Left and Up

        // Straight
        if (left || right) return TILES.WALL_UP; // Horizontal wall? (Up/Down facing?)
        // Reference: "Straight Walls... Right, Left, Up, Down".
        // Let's use WALL_UP for Horizontal (Top-facing?) and WALL_RIGHT for Vertical (Right-facing?).
        // A standard horizontal wall segment usually connects Left and Right.
        if (left || right) return TILES.WALL_UP;
        if (up || down) return TILES.WALL_RIGHT;

        return TILES.WALL_RIGHT; // Default
    }
}

