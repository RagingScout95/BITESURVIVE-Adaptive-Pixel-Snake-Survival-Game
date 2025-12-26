import { DIRECTIONS } from './constants.js';

export class EnemyAI {
    constructor(snake, grid, playerSnake, foodSystem) {
        this.snake = snake;
        this.grid = grid;
        this.playerSnake = playerSnake;
        this.foodSystem = foodSystem;
        this.targetFood = null;
        this.state = 'roam'; // 'roam', 'seek_food', 'chase_player'
        this.path = [];
    }

    update() {
        if (!this.snake.alive) return;

        const head = this.snake.getHead();
        const playerHead = this.playerSnake.getHead();
        const foods = this.foodSystem.getFoods();

        // Calculate distance to player
        const distToPlayer = this.manhattanDistance(head, playerHead);

        // State machine
        if (distToPlayer < 5 && this.snake.energy > 30) {
            this.state = 'chase_player';
            this.targetFood = null;
        } else if (this.snake.energy < 50 && foods.length > 0) {
            this.state = 'seek_food';
            this.findNearestFood(foods);
        } else {
            this.state = 'roam';
            this.targetFood = null;
        }

        // Choose direction based on state
        let targetPos = null;
        if (this.state === 'chase_player') {
            targetPos = playerHead;
        } else if (this.state === 'seek_food' && this.targetFood) {
            targetPos = this.targetFood;
        }

        if (targetPos) {
            this.moveTowards(targetPos);
        } else {
            this.roam();
        }
    }

    findNearestFood(foods) {
        if (!foods || foods.length === 0) return;
        
        const head = this.snake.getHead();
        let nearest = null;
        let minDist = Infinity;

        for (const food of foods) {
            const dist = this.manhattanDistance(head, food);
            if (dist < minDist) {
                minDist = dist;
                nearest = food;
            }
        }

        this.targetFood = nearest;
    }

    moveTowards(target) {
        const head = this.snake.getHead();
        const dx = target.x - head.x;
        const dy = target.y - head.y;

        // Handle wrapping
        let wrappedDx = dx;
        let wrappedDy = dy;
        
        if (Math.abs(dx) > this.grid.width / 2) {
            wrappedDx = dx > 0 ? dx - this.grid.width : dx + this.grid.width;
        }
        if (Math.abs(dy) > this.grid.height / 2) {
            wrappedDy = dy > 0 ? dy - this.grid.height : dy + this.grid.height;
        }

        // Choose direction
        let newDir = this.snake.direction;
        
        if (Math.abs(wrappedDx) > Math.abs(wrappedDy)) {
            newDir = wrappedDx > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
        } else if (wrappedDy !== 0) {
            newDir = wrappedDy > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP;
        }

        // Avoid walls and self
        const testPos = {
            x: this.grid.wrapX(head.x + newDir.x),
            y: this.grid.wrapY(head.y + newDir.y)
        };

        if (this.grid.isValid(testPos) && !this.wouldCollideWithSelf(testPos)) {
            this.snake.setDirection(newDir);
        } else {
            // Try alternative directions
            this.tryAlternativeDirections();
        }
    }

    wouldCollideWithSelf(testPos) {
        // Check if moving to testPos would cause self-collision
        for (let i = 1; i < this.snake.body.length; i++) {
            if (this.snake.body[i].x === testPos.x && this.snake.body[i].y === testPos.y) {
                return true;
            }
        }
        return false;
    }

    tryAlternativeDirections() {
        const head = this.snake.getHead();
        const directions = [DIRECTIONS.UP, DIRECTIONS.DOWN, DIRECTIONS.LEFT, DIRECTIONS.RIGHT];
        
        // Shuffle for randomness
        for (let i = directions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [directions[i], directions[j]] = [directions[j], directions[i]];
        }

        for (const dir of directions) {
            const testPos = {
                x: this.grid.wrapX(head.x + dir.x),
                y: this.grid.wrapY(head.y + dir.y)
            };

            if (this.grid.isValid(testPos) && !this.wouldCollideWithSelf(testPos)) {
                this.snake.setDirection(dir);
                return;
            }
        }
    }

    roam() {
        // Random movement with slight bias towards current direction
        if (Math.random() < 0.7) {
            // Continue in current direction if valid
            const head = this.snake.getHead();
            const testPos = {
                x: this.grid.wrapX(head.x + this.snake.direction.x),
                y: this.grid.wrapY(head.y + this.snake.direction.y)
            };

            if (this.grid.isValid(testPos) && !this.wouldCollideWithSelf(testPos)) {
                return; // Keep current direction
            }
        }

        // Try random direction
        this.tryAlternativeDirections();
    }

    manhattanDistance(pos1, pos2) {
        let dx = Math.abs(pos2.x - pos1.x);
        let dy = Math.abs(pos2.y - pos1.y);
        
        // Account for wrapping
        dx = Math.min(dx, this.grid.width - dx);
        dy = Math.min(dy, this.grid.height - dy);
        
        return dx + dy;
    }
}

