// Game Constants
export const TILE_SIZE = 16;
export const WORLD_WIDTH = 32;
export const WORLD_HEIGHT = 32;
export const CANVAS_WIDTH = TILE_SIZE * WORLD_WIDTH;
export const CANVAS_HEIGHT = TILE_SIZE * WORLD_HEIGHT;

// ============================================================================
// SPRITE ATLAS TILE INDICES
// ============================================================================
// Atlas Layout: 8 columns × 8 rows = 64 tiles total
// Formula: index = (row × 8) + col
// Example: Row 0, Col 4 = (0 × 8) + 4 = 4
// ============================================================================

export const TILES = {
    // ------------------------------------------------------------------------
    // PLAYER SNAKE TILES (Rows 0-2)
    // ------------------------------------------------------------------------
    
    // Tail Tiles
    SNAKE_TAIL_RIGHT: 0,  // Row 0, Col 0 - Tail pointing right →
    SNAKE_TAIL_LEFT: 1,   // Row 0, Col 1 - Tail pointing left ←
    SNAKE_TAIL_UP: 8,     // Row 1, Col 0 - Tail pointing up ↑
    SNAKE_TAIL_DOWN: 9,   // Row 1, Col 1 - Tail pointing down ↓

    // Body Tiles (Straight segments)
    SNAKE_BODY_VERTICAL: 16,   // Row 2, Col 0 - Vertical body |
    SNAKE_BODY_HORIZONTAL: 17, // Row 2, Col 1 - Horizontal body ─

    // Turn Tiles (Corner pieces)
    // Each turn is defined by: snake direction (from) + turn direction (to)
    // Based on the turn direction mapping table
    SNAKE_TURN_UP_LEFT: 3,      // Row 0, Col 3 - Coming from UP, turning LEFT
    SNAKE_TURN_UP_RIGHT: 2,     // Row 0, Col 2 - Coming from UP, turning RIGHT
    SNAKE_TURN_DOWN_LEFT: 11,   // Row 1, Col 3 - Coming from DOWN, turning LEFT
    SNAKE_TURN_DOWN_RIGHT: 10,  // Row 1, Col 2 - Coming from DOWN, turning RIGHT
    SNAKE_TURN_LEFT_UP: 10,     // Row 1, Col 2 - Coming from LEFT, turning UP
    SNAKE_TURN_LEFT_DOWN: 2,    // Row 0, Col 2 - Coming from LEFT, turning DOWN
    SNAKE_TURN_RIGHT_UP: 11,    // Row 1, Col 3 - Coming from RIGHT, turning UP
    SNAKE_TURN_RIGHT_DOWN: 3,   // Row 0, Col 3 - Coming from RIGHT, turning DOWN

    // Head Tiles
    SNAKE_HEAD_RIGHT: 4,  // Row 0, Col 4 - Head facing right →
    SNAKE_HEAD_LEFT: 5,   // Row 0, Col 5 - Head facing left ←
    SNAKE_HEAD_UP: 12,    // Row 1, Col 4 - Head facing up ↑
    SNAKE_HEAD_DOWN: 13,  // Row 1, Col 5 - Head facing down ↓

    // ------------------------------------------------------------------------
    // ENEMY SNAKE TILES (Rows 3-5)
    // ------------------------------------------------------------------------
    // Enemy uses same layout as player, but offset by 3 rows (24 tiles)
    // Enemy tiles are automatically calculated in spriteRenderer.js
    ENEMY_OFFSET: 24, // 3 rows × 8 cols = 24 tiles

    // ------------------------------------------------------------------------
    // WALL TILES (Rows 6-7)
    // ------------------------------------------------------------------------
    
    // Straight Walls
    WALL_RIGHT: 48,  // Row 6, Col 0 - Wall facing right →
    WALL_LEFT: 49,   // Row 6, Col 1 - Wall facing left ←
    WALL_UP: 56,     // Row 7, Col 0 - Wall facing up ↑
    WALL_DOWN: 57,   // Row 7, Col 1 - Wall facing down ↓

    // Corner Walls
    WALL_CORNER_BR: 50,  // Row 6, Col 2 - Bottom-Right corner
    WALL_CORNER_BL: 51,  // Row 6, Col 3 - Bottom-Left corner
    WALL_CORNER_TR: 58,  // Row 7, Col 2 - Top-Right corner
    WALL_CORNER_TL: 59,  // Row 7, Col 3 - Top-Left corner

    // ------------------------------------------------------------------------
    // FOOD TILES (Row 6, Cols 4-7)
    // ------------------------------------------------------------------------
    FOOD_1: 52, // Row 6, Col 4
    FOOD_2: 53, // Row 6, Col 5
    FOOD_3: 54, // Row 6, Col 6
    FOOD_4: 55, // Row 6, Col 7

    // ------------------------------------------------------------------------
    // PORTAL TILES (Row 7, Col 4+)
    // ------------------------------------------------------------------------
    PORTAL: 60, // Row 7, Col 4
};

// Directions
export const DIRECTIONS = {
    UP: { x: 0, y: -1, angle: 270 },
    DOWN: { x: 0, y: 1, angle: 90 },
    LEFT: { x: -1, y: 0, angle: 180 },
    RIGHT: { x: 1, y: 0, angle: 0 }
};

// Game Settings
export const INITIAL_ENERGY = 100;
export const ENERGY_DRAIN_MOVE = 0.4; // Increased - faster energy drain
export const ENERGY_DRAIN_TURN = 0.6; // Increased - faster energy drain on turns
export const ENERGY_FOOD_BASE = 20;
export const INITIAL_SNAKE_LENGTH = 3;
export const GAME_TICK_MS = 120;

// Atlas Configuration
export const ATLAS_TILE_SIZE = 16;
export const ATLAS_COLS = 8; // Atlas is 8 columns wide (8×8 = 64 tiles)

