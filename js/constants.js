// Game Constants
export const TILE_SIZE = 16;
export const WORLD_WIDTH = 32;
export const WORLD_HEIGHT = 32;
export const CANVAS_WIDTH = TILE_SIZE * WORLD_WIDTH;
export const CANVAS_HEIGHT = TILE_SIZE * WORLD_HEIGHT;

// Sprite Atlas Tile Indices
export const TILES = {
    // Player Snake
    // Tail (Rows 0-1)
    SNAKE_TAIL_RIGHT: 0,  // 00
    SNAKE_TAIL_LEFT: 1,   // 01
    SNAKE_TAIL_UP: 16,    // 10
    SNAKE_TAIL_DOWN: 17,  // 11

    // Body (Row 2)
    SNAKE_BODY_VERTICAL: 32,   // 20
    SNAKE_BODY_HORIZONTAL: 33, // 21

    // Turns (Rows 0-1)
    // 02: Bottom-Right (Connects Bottom & Right)
    SNAKE_TURN_BR: 2,
    // 03: Bottom-Left (Connects Bottom & Left)
    SNAKE_TURN_BL: 3,
    // 12: Top-Right (Connects Top & Right)
    SNAKE_TURN_TR: 18,
    // 13: Top-Left (Connects Top & Left)
    SNAKE_TURN_TL: 19,

    // Head (Rows 2-3)
    SNAKE_HEAD_RIGHT: 34, // Row 2, Col 2 - facing right
    SNAKE_HEAD_LEFT: 35,  // Row 2, Col 3 - facing left
    SNAKE_HEAD_UP: 51,    // Row 3, Col 3 - facing up (swapped)
    SNAKE_HEAD_DOWN: 50,  // Row 3, Col 2 - facing down (swapped)

    // Food (Row 6, Cols 4-7)
    FOOD_1: 100, // Row 6, Col 4
    FOOD_2: 101, // Row 6, Col 5
    FOOD_3: 102, // Row 6, Col 6
    FOOD_4: 103, // Row 6, Col 7

    // Walls (Row 6-7)
    // Straight
    WALL_RIGHT: 96,  // 60
    WALL_LEFT: 97,   // 61
    WALL_UP: 112,    // 70
    WALL_DOWN: 113,  // 71

    // Corners
    WALL_CORNER_BR: 98,  // 62
    WALL_CORNER_BL: 99,  // 63
    WALL_CORNER_TR: 114, // 72
    WALL_CORNER_TL: 115, // 73

    // Portal
    PORTAL: 116, // 74 (Assuming 74 based on "Row 7, Col 4")

    // Enemy Snake (row offsets)
    // Reference says "Rows 3, 4, 5" for Enemy.
    // Player uses Rows 0, 1, 2, 3.
    // If exact layout is copied, we can use an offset.
    // Let's assume an offset of 3 rows (48 tiles) if they map directly.
    // But Player Head Down is Row 3.
    // Let's wait on Enemy implementation or infer 48 offset for now.
    ENEMY_OFFSET: 48 // 3 rows * 16 cols
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
export const ENERGY_DRAIN_MOVE = 0.1;
export const ENERGY_DRAIN_TURN = 0.2;
export const ENERGY_FOOD_BASE = 20;
export const INITIAL_SNAKE_LENGTH = 3;
export const GAME_TICK_MS = 150;

// Atlas Configuration
export const ATLAS_TILE_SIZE = 16;
export const ATLAS_COLS = 16; // Assuming 16 columns in the atlas

