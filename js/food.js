import { TILES, ENERGY_FOOD_BASE } from './constants.js';

export class FoodSystem {
    constructor(grid) {
        this.grid = grid;
        this.foods = []; // Array of {x, y, type, energy}
        this.foodTypes = [TILES.FOOD_1, TILES.FOOD_2, TILES.FOOD_3, TILES.FOOD_4];
    }

    spawnFood(count = 1, difficulty = 1) {
        const validPositions = this.grid.getValidPositions().filter(pos => {
            // Don't spawn on occupied tiles, walls, or portals
            return !this.grid.isOccupied(pos) && 
                   !this.grid.isWall(pos) && 
                   !this.grid.isPortal(pos);
        });

        if (validPositions.length === 0) return;

        for (let i = 0; i < count && validPositions.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * validPositions.length);
            const pos = validPositions.splice(randomIndex, 1)[0];
            
            const type = this.foodTypes[Math.floor(Math.random() * this.foodTypes.length)];
            
            // Different food types have different energy values
            let energy = 0;
            let speedBoost = 0; // Duration in milliseconds
            
            if (type === TILES.FOOD_1) {
                // FOOD_1: Less energy (10-15)
                energy = 10 + Math.floor(Math.random() * 6);
            } else if (type === TILES.FOOD_2) {
                // FOOD_2: More energy (30-40)
                energy = 30 + Math.floor(Math.random() * 11);
            } else if (type === TILES.FOOD_3) {
                // FOOD_3: Normal energy (20-25)
                energy = 20 + Math.floor(Math.random() * 6);
            } else if (type === TILES.FOOD_4) {
                // FOOD_4: Speed boost (1-2 seconds), no energy
                energy = 0;
                speedBoost = 1000 + Math.floor(Math.random() * 1000); // 1-2 seconds
            }
            
            this.foods.push({ x: pos.x, y: pos.y, type, energy, speedBoost });
            this.grid.setOccupied(pos, true);
        }
    }

    removeFood(pos) {
        const index = this.foods.findIndex(f => f.x === pos.x && f.y === pos.y);
        if (index !== -1) {
            const food = this.foods[index];
            this.grid.setOccupied(pos, false);
            this.foods.splice(index, 1);
            return food;
        }
        return null;
    }

    getFoodAt(pos) {
        // Wrap the position to ensure correct comparison
        const wrappedX = this.grid.wrapX(pos.x);
        const wrappedY = this.grid.wrapY(pos.y);
        return this.foods.find(f => {
            const foodX = this.grid.wrapX(f.x);
            const foodY = this.grid.wrapY(f.y);
            return foodX === wrappedX && foodY === wrappedY;
        });
    }

    clear() {
        this.foods.forEach(food => {
            this.grid.setOccupied({ x: food.x, y: food.y }, false);
        });
        this.foods = [];
    }

    getFoods() {
        return this.foods;
    }
}

