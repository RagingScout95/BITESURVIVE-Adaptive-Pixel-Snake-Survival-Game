import { TILE_SIZE, ATLAS_TILE_SIZE, ATLAS_COLS, TILES } from './constants.js';

export class SpriteRenderer {
    constructor(canvas, atlasImage) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.atlas = atlasImage;
        this.ctx.imageSmoothingEnabled = false;
    }


    // Get tile position in atlas from tile index
    getTilePosition(tileIndex) {
        const row = Math.floor(tileIndex / ATLAS_COLS);
        const col = tileIndex % ATLAS_COLS;
        return { x: col * ATLAS_TILE_SIZE, y: row * ATLAS_TILE_SIZE };
    }

    // Draw a tile with optional rotation
    drawTile(tileIndex, screenX, screenY, rotation = 0, isEnemy = false) {
        let pos = this.getTilePosition(tileIndex);

        // Adjust tile index for enemy snakes
        // Player Snake Tiles: rows 0-2
        // Enemy Snake Tiles: rows 3-5 (same structure, offset by 3 rows)
        // Only apply offset to snake tiles (not food, walls, portals)
        if (isEnemy && tileIndex < TILES.FOOD_1) {
            const row = Math.floor(tileIndex / ATLAS_COLS);
            const col = tileIndex % ATLAS_COLS;
            // Enemy tiles are 3 rows down from player tiles
            const newRow = row + 3;
            pos = {
                x: col * ATLAS_TILE_SIZE,
                y: newRow * ATLAS_TILE_SIZE
            };
        }

        this.ctx.save();

        // Translate to tile center for rotation
        const centerX = screenX + TILE_SIZE / 2;
        const centerY = screenY + TILE_SIZE / 2;

        this.ctx.translate(centerX, centerY);
        this.ctx.rotate((rotation * Math.PI) / 180);
        this.ctx.translate(-centerX, -centerY);

        // Draw the tile
        this.ctx.drawImage(
            this.atlas,
            pos.x, pos.y, ATLAS_TILE_SIZE, ATLAS_TILE_SIZE,
            screenX, screenY, TILE_SIZE, TILE_SIZE
        );

        this.ctx.restore();
    }

    // Clear the canvas
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

