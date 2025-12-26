import { DIRECTIONS } from './constants.js';
import { Debug } from './debug.js';

export class EnemyAI {
    constructor(snake, grid, playerSnake, foodSystem) {
        this.snake = snake;
        this.grid = grid;
        this.playerSnake = playerSnake;
        this.foodSystem = foodSystem;
        this.targetFood = null;
        this.state = 'roam'; // 'roam', 'seek_food', 'chase_player', 'trap_player'
        this.path = [];
        
        // Detection ranges
        this.FOOD_DETECTION_RANGE = 25; // Large range to detect food (most of the map)
        this.PLAYER_ATTACK_RADIUS = 6; // Attack radius for player
        this.MIN_ENERGY_TO_ATTACK_MIN = 4; // Minimum energy threshold (random range start)
        this.MIN_ENERGY_TO_ATTACK_MAX = 8; // Maximum energy threshold (random range end)
        this.TRAP_RADIUS = 8; // Distance to start trapping behavior
        
        // Stuck detection
        this.lastDirection = null;
        this.consecutiveSameDirection = 0;
        this.maxConsecutiveMoves = 15; // Force direction change after this many moves
        this.lastPosition = null;
        this.stuckMoveCount = 0;
        this.maxStuckMoves = 10; // If not making progress, force change
    }

    update() {
        if (!this.snake.alive) return;

        const head = this.snake.getHead();
        const playerHead = this.playerSnake.getHead();
        const foods = this.foodSystem.getFoods();
        
        // Calculate distance to player
        const distToPlayer = this.manhattanDistance(head, playerHead);
        
        Debug.log(`\n[EnemyAI] ===== DECISION CYCLE =====`);
        Debug.log(`[EnemyAI] Position: (${head.x}, ${head.y}), Energy: ${this.snake.energy.toFixed(1)}`);
        Debug.log(`[EnemyAI] Player distance: ${distToPlayer}, Attack radius: ${this.PLAYER_ATTACK_RADIUS}`);
        Debug.log(`[EnemyAI] Foods available: ${foods.length}`);
        Debug.log(`[EnemyAI] Consecutive same direction: ${this.consecutiveSameDirection}/${this.maxConsecutiveMoves}`);
        
        // Simple and clear algorithm:
        // 1. If player is near (within trap radius) → TRAP PLAYER (cut off escape routes)
        // 2. If player is very near (within attack radius) → ATTACK PLAYER (with random energy threshold)
        // 3. Otherwise → ALWAYS SEEK AND EAT FOOD (steal food) within detection range
        // 4. If no food in range, still try to move towards player (even if far)
        
        let targetPos = null;
        let decision = '';
        
        // Priority 1: Trap player if within trap radius (try to cut off escape routes)
        if (distToPlayer <= this.TRAP_RADIUS && this.snake.energy > 3) {
            this.state = 'trap_player';
            const trapPos = this.calculateTrapPosition(head, playerHead);
            if (trapPos) {
                targetPos = trapPos;
                decision = `🪤 TRAP PLAYER - Moving to intercept at (${trapPos.x}, ${trapPos.y})`;
            } else {
                // Fall through to attack if trap calculation fails
                targetPos = playerHead;
                decision = `🎯 ATTACK PLAYER (Trap failed, direct attack)`;
            }
        }
        // Priority 2: Attack player if very nearby (random energy requirement between 4-8)
        else if (distToPlayer <= this.PLAYER_ATTACK_RADIUS && this.snake.energy > this.MIN_ENERGY_TO_ATTACK_MIN) {
            const randomEnergyThreshold = Math.floor(Math.random() * (this.MIN_ENERGY_TO_ATTACK_MAX - this.MIN_ENERGY_TO_ATTACK_MIN + 1)) + this.MIN_ENERGY_TO_ATTACK_MIN;
            if (this.snake.energy > randomEnergyThreshold) {
                this.state = 'chase_player';
                this.targetFood = null;
                targetPos = playerHead;
                decision = `🎯 ATTACK PLAYER (Energy: ${this.snake.energy.toFixed(1)} > ${randomEnergyThreshold}, Distance: ${distToPlayer})`;
            }
        }
        
        // Priority 3: Always seek food within detection range (steal food from player)
        if (!targetPos && foods.length > 0) {
            this.state = 'seek_food';
            this.findNearestFoodInRange(foods);
            if (this.targetFood && this.targetFood.x !== undefined && this.targetFood.y !== undefined) {
                targetPos = { x: this.targetFood.x, y: this.targetFood.y };
                const distToFood = this.manhattanDistance(head, this.targetFood);
                decision = `🍎 SEEK FOOD at (${this.targetFood.x}, ${this.targetFood.y}), Distance: ${distToFood}`;
            } else {
                decision = `❌ No valid food target found`;
            }
        }
        
        // Priority 4: No food in range, but still move towards player
        if (!targetPos) {
            this.state = 'seek_player';
            targetPos = playerHead;
            decision = `👤 SEEK PLAYER (No food available, Distance: ${distToPlayer})`;
        }
        
        Debug.log(`[EnemyAI] Decision: ${decision}`);
        Debug.log(`[EnemyAI] Next action: Moving towards ${targetPos ? `(${targetPos.x}, ${targetPos.y})` : 'NONE'}`);
        
        // Check for stuck behavior BEFORE making movement decision
        // This will force a direction change if we're stuck
        const wasStuck = this.checkStuckBehavior(head);
        
        // ALWAYS execute movement towards target (never random)
        if (targetPos) {
            this.moveTowards(targetPos);
        } else {
            Debug.log(`[EnemyAI] ⚠️ WARNING: No target position! Continuing forward`);
            // This should never happen, but if it does, continue forward
            const testPos = {
                x: this.grid.wrapX(head.x + this.snake.direction.x),
                y: this.grid.wrapY(head.y + this.snake.direction.y)
            };
            if (!this.isSafeMove(testPos)) {
                this.tryAlternativeDirectionsTowardsTarget(playerHead);
            }
        }
        
        // Update tracking variables after movement decision
        this.updateDirectionTracking();
        
        Debug.log(`[EnemyAI] ============================\n`);
    }

    findNearestFoodInRange(foods) {
        if (!foods || foods.length === 0) {
            this.targetFood = null;
            return;
        }
        
        const head = this.snake.getHead();
        let nearest = null;
        let minDist = Infinity;
        const foodDistances = [];

        // ALWAYS find the nearest food by distance (no range limit for selection)
        // This ensures enemy always moves towards closest food
        for (const food of foods) {
            if (!food || food.x === undefined || food.y === undefined) {
                continue;
            }
            
            // Calculate distance to food
            const dist = this.manhattanDistance(head, food);
            foodDistances.push({ food, dist });
            
            // Always select the nearest food (distance-based selection)
            if (dist < minDist) {
                minDist = dist;
                nearest = food;
            }
        }

        // Log food analysis
        if (foodDistances.length > 0) {
            foodDistances.sort((a, b) => a.dist - b.dist);
            Debug.log(`[EnemyAI] Food analysis (sorted by distance):`);
            foodDistances.slice(0, 3).forEach((fd, idx) => {
                const marker = fd.food === nearest ? '⭐' : '  ';
                Debug.log(`[EnemyAI] ${marker} Food at (${fd.food.x}, ${fd.food.y}) - Distance: ${fd.dist}`);
            });
        }

        this.targetFood = nearest;
    }

    moveTowards(target) {
        if (!target || target.x === undefined || target.y === undefined) {
            Debug.log(`[EnemyAI] ❌ Invalid target in moveTowards:`, target);
            // Fallback: try any safe direction
            this.tryAnySafeDirection();
            return;
        }

        const head = this.snake.getHead();
        const currentDir = this.snake.direction;
        
        // Wrap coordinates for proper distance calculation
        const wrappedHead = {
            x: this.grid.wrapX(head.x),
            y: this.grid.wrapY(head.y)
        };
        const wrappedTarget = {
            x: this.grid.wrapX(target.x),
            y: this.grid.wrapY(target.y)
        };
        
        const dx = wrappedTarget.x - wrappedHead.x;
        const dy = wrappedTarget.y - wrappedHead.y;
        
        // Handle wrapping for distance calculation
        let wrappedDx = dx;
        let wrappedDy = dy;
        if (Math.abs(dx) > this.grid.width / 2) {
            wrappedDx = dx > 0 ? dx - this.grid.width : dx + this.grid.width;
        }
        if (Math.abs(dy) > this.grid.height / 2) {
            wrappedDy = dy > 0 ? dy - this.grid.height : dy + this.grid.height;
        }
        
        // Check if we're already at target (for food)
        if (wrappedDx === 0 && wrappedDy === 0) {
            Debug.log(`[EnemyAI] ✅ Already at target position (${wrappedTarget.x}, ${wrappedTarget.y})`);
            return;
        }
        
        Debug.log(`[EnemyAI] 🚶 Moving: Head(${wrappedHead.x}, ${wrappedHead.y}) → Target(${wrappedTarget.x}, ${wrappedTarget.y}), Delta: (${wrappedDx}, ${wrappedDy})`);

        // Choose direction - prioritize the axis with larger distance
        let newDir = currentDir;
        
        if (Math.abs(wrappedDx) > Math.abs(wrappedDy)) {
            newDir = wrappedDx > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
        } else if (wrappedDy !== 0) {
            newDir = wrappedDy > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP;
        }
        
        // If we're stuck (same direction for too long), avoid choosing the same direction
        if (this.consecutiveSameDirection >= this.maxConsecutiveMoves - 3) {
            if (newDir.x === currentDir.x && newDir.y === currentDir.y) {
                // Force a different direction - prefer perpendicular
                Debug.log(`[EnemyAI] 🔄 Avoiding same direction, choosing perpendicular`);
                if (currentDir.x !== 0) {
                    // Currently horizontal, try vertical
                    newDir = wrappedDy !== 0 ? (wrappedDy > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP) : DIRECTIONS.UP;
                } else {
                    // Currently vertical, try horizontal
                    newDir = wrappedDx !== 0 ? (wrappedDx > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT) : DIRECTIONS.LEFT;
                }
            }
        }

        // Check if this direction is safe (no collision with player body, walls, or self)
        const testPos = {
            x: this.grid.wrapX(head.x + newDir.x),
            y: this.grid.wrapY(head.y + newDir.y)
        };

        if (this.isSafeMove(testPos)) {
            this.snake.setDirection(newDir);
            return;
        }

        // Try alternative directions - prioritize directions towards target
        const directions = this.getPrioritizedDirections(wrappedDx, wrappedDy);
        for (const dir of directions) {
            // Skip if this is the same direction we're stuck in
            if (this.consecutiveSameDirection >= this.maxConsecutiveMoves - 3) {
                if (dir.x === currentDir.x && dir.y === currentDir.y) {
                    continue;
                }
            }
            
            const testPos = {
                x: this.grid.wrapX(head.x + dir.x),
                y: this.grid.wrapY(head.y + dir.y)
            };
            if (this.isSafeMove(testPos)) {
                this.snake.setDirection(dir);
                return;
            }
        }
        
        // If no safe direction found towards target, try alternative directions
        // but still prioritize moving closer to target
        this.tryAlternativeDirectionsTowardsTarget(target);
    }

    getPrioritizedDirections(dx, dy) {
        // Return directions prioritized by how well they move towards target
        const directions = [];
        
        // Add primary directions based on target
        if (Math.abs(dx) > Math.abs(dy)) {
            directions.push(dx > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT);
            if (dy !== 0) {
                directions.push(dy > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP);
            }
        } else {
            if (dy !== 0) {
                directions.push(dy > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP);
            }
            if (dx !== 0) {
                directions.push(dx > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT);
            }
        }
        
        // Add perpendicular directions
        if (dx !== 0) {
            directions.push(DIRECTIONS.UP, DIRECTIONS.DOWN);
        }
        if (dy !== 0) {
            directions.push(DIRECTIONS.LEFT, DIRECTIONS.RIGHT);
        }
        
        // Remove duplicates
        const unique = [];
        for (const dir of directions) {
            if (!unique.some(d => d.x === dir.x && d.y === dir.y)) {
                unique.push(dir);
            }
        }
        
        return unique;
    }

    isSafeMove(testPos) {
        // Check if moving to testPos is safe (no collision with player, walls, or self)
        // BUT allow moving onto food tiles
        
        // First check: Is it a valid tile (not a wall)?
        if (!this.grid.isValid(testPos)) {
            return false;
        }
        
        // Second check: Check if this position has food - if so, it's ALWAYS safe to move there (enemy can eat food)
        const wrappedPos = {
            x: this.grid.wrapX(testPos.x),
            y: this.grid.wrapY(testPos.y)
        };
        const foodAtPos = this.foodSystem.getFoodAt(wrappedPos);
        if (foodAtPos) {
            // Food is here - it's safe to move onto food (enemy will eat it)
            // But still check for self-collision
            if (!this.wouldCollideWithSelf(testPos)) {
                return true;
            }
        }
        
        // Third check: Self-collision
        if (this.wouldCollideWithSelf(testPos)) {
            return false;
        }
        
        // Fourth check: Player collision (body only, head is allowed for attack)
        if (this.wouldCollideWithPlayer(testPos)) {
            return false;
        }
        
        // Fifth check: Check if position is occupied by something other than food
        if (this.grid.isOccupied(testPos)) {
            // Position is occupied by something (wall, other snake, etc.) - not safe
            return false;
        }
        
        return true;
    }

    wouldCollideWithPlayer(testPos) {
        // Check if moving to testPos would collide with player body (not head)
        // Enemy can attack player head, but should avoid player body
        if (!this.playerSnake || !this.playerSnake.alive) {
            return false;
        }
        
        // Allow moving to player head (enemy can attack)
        const playerHead = this.playerSnake.getHead();
        if (testPos.x === playerHead.x && testPos.y === playerHead.y) {
            return false; // Allow this - enemy can attack player head
        }
        
        // Prevent collision with player body (enemy dies if it hits body)
        for (let i = 1; i < this.playerSnake.body.length; i++) {
            const segment = this.playerSnake.body[i];
            if (testPos.x === segment.x && testPos.y === segment.y) {
                return true; // Block this - enemy would die
            }
        }
        
        return false;
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

    tryAlternativeDirectionsTowardsTarget(target) {
        if (!target || target.x === undefined || target.y === undefined) {
            // Fallback: try any safe direction
            this.tryAnySafeDirection();
            return;
        }

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

        // Get all directions sorted by how well they move towards target
        const allDirections = [
            { dir: DIRECTIONS.UP, score: -wrappedDy },
            { dir: DIRECTIONS.DOWN, score: wrappedDy },
            { dir: DIRECTIONS.LEFT, score: -wrappedDx },
            { dir: DIRECTIONS.RIGHT, score: wrappedDx }
        ];

        // Sort by score (higher is better - moves closer to target)
        allDirections.sort((a, b) => b.score - a.score);

        // Try directions in order of preference (towards target)
        for (const { dir } of allDirections) {
            const testPos = {
                x: this.grid.wrapX(head.x + dir.x),
                y: this.grid.wrapY(head.y + dir.y)
            };

            if (this.isSafeMove(testPos)) {
                this.snake.setDirection(dir);
                return;
            }
        }

        // If still no safe direction, try any safe direction
        this.tryAnySafeDirection();
    }

    tryAnySafeDirection() {
        const head = this.snake.getHead();
        const directions = [DIRECTIONS.UP, DIRECTIONS.DOWN, DIRECTIONS.LEFT, DIRECTIONS.RIGHT];
        
        // Try current direction first (prefer continuing forward)
        if (this.isSafeMove({
            x: this.grid.wrapX(head.x + this.snake.direction.x),
            y: this.grid.wrapY(head.y + this.snake.direction.y)
        })) {
            return; // Keep current direction
        }
        
        // Try other directions
        for (const dir of directions) {
            const testPos = {
                x: this.grid.wrapX(head.x + dir.x),
                y: this.grid.wrapY(head.y + dir.y)
            };

            if (this.isSafeMove(testPos)) {
                this.snake.setDirection(dir);
                return;
            }
        }
    }


    manhattanDistance(pos1, pos2) {
        let dx = Math.abs(pos2.x - pos1.x);
        let dy = Math.abs(pos2.y - pos1.y);
        
        // Account for wrapping
        dx = Math.min(dx, this.grid.width - dx);
        dy = Math.min(dy, this.grid.height - dy);
        
        return dx + dy;
    }

    checkStuckBehavior(head) {
        const currentDir = this.snake.direction;
        let wasStuck = false;
        
        // Check if we've been moving in the same direction for too long
        if (this.lastDirection && 
            this.lastDirection.x === currentDir.x && 
            this.lastDirection.y === currentDir.y) {
            this.consecutiveSameDirection++;
        } else {
            this.consecutiveSameDirection = 0;
        }
        
        // Check if we're making progress (position changed)
        if (this.lastPosition) {
            const wrappedLast = {
                x: this.grid.wrapX(this.lastPosition.x),
                y: this.grid.wrapY(this.lastPosition.y)
            };
            const wrappedCurrent = {
                x: this.grid.wrapX(head.x),
                y: this.grid.wrapY(head.y)
            };
            
            if (wrappedLast.x === wrappedCurrent.x && wrappedLast.y === wrappedCurrent.y) {
                this.stuckMoveCount++;
            } else {
                this.stuckMoveCount = 0;
            }
        }
        
        // Force direction change if stuck
        if (this.consecutiveSameDirection >= this.maxConsecutiveMoves || 
            this.stuckMoveCount >= this.maxStuckMoves) {
            Debug.log(`[EnemyAI] ⚠️ STUCK DETECTED! Forcing direction change (Same dir: ${this.consecutiveSameDirection}, Stuck moves: ${this.stuckMoveCount})`);
            this.forceDirectionChange(head);
            this.consecutiveSameDirection = 0;
            this.stuckMoveCount = 0;
            wasStuck = true;
        }
        
        this.lastPosition = { x: head.x, y: head.y };
        return wasStuck;
    }

    updateDirectionTracking() {
        this.lastDirection = { 
            x: this.snake.direction.x, 
            y: this.snake.direction.y 
        };
    }

    forceDirectionChange(head) {
        // Try to change to a perpendicular direction
        const currentDir = this.snake.direction;
        const perpendicularDirs = [];
        
        // Get perpendicular directions
        if (currentDir.x !== 0) {
            // Moving horizontally, try vertical
            perpendicularDirs.push(DIRECTIONS.UP, DIRECTIONS.DOWN);
        } else {
            // Moving vertically, try horizontal
            perpendicularDirs.push(DIRECTIONS.LEFT, DIRECTIONS.RIGHT);
        }
        
        // Try perpendicular directions first
        for (const dir of perpendicularDirs) {
            const testPos = {
                x: this.grid.wrapX(head.x + dir.x),
                y: this.grid.wrapY(head.y + dir.y)
            };
            if (this.isSafeMove(testPos)) {
                this.snake.setDirection(dir);
                Debug.log(`[EnemyAI] ✅ Forced direction change to (${dir.x}, ${dir.y})`);
                return;
            }
        }
        
        // If perpendicular doesn't work, try any safe direction
        const allDirs = [DIRECTIONS.UP, DIRECTIONS.DOWN, DIRECTIONS.LEFT, DIRECTIONS.RIGHT];
        for (const dir of allDirs) {
            if (dir.x === currentDir.x && dir.y === currentDir.y) continue; // Skip current direction
            
            const testPos = {
                x: this.grid.wrapX(head.x + dir.x),
                y: this.grid.wrapY(head.y + dir.y)
            };
            if (this.isSafeMove(testPos)) {
                this.snake.setDirection(dir);
                Debug.log(`[EnemyAI] ✅ Forced direction change to (${dir.x}, ${dir.y})`);
                return;
            }
        }
        
        Debug.log(`[EnemyAI] ⚠️ Could not force direction change - no safe directions available`);
    }

    calculateTrapPosition(enemyHead, playerHead) {
        // Try to predict where player will be and cut off escape routes
        // Strategy: Move to a position that blocks player's most likely escape path
        
        const playerDir = this.playerSnake.direction;
        const distToPlayer = this.manhattanDistance(enemyHead, playerHead);
        
        // If we're close enough, try to intercept player's path
        if (distToPlayer <= 4) {
            // Try to move to a position that's in front of the player (in their direction)
            const interceptPos = {
                x: this.grid.wrapX(playerHead.x + playerDir.x * 2),
                y: this.grid.wrapY(playerHead.y + playerDir.y * 2)
            };
            
            if (this.isSafeMove(interceptPos)) {
                return interceptPos;
            }
        }
        
        // Alternative: Try to cut off player's perpendicular escape routes
        // Get directions perpendicular to player's movement
        const perpendicularDirs = [];
        if (playerDir.x !== 0) {
            perpendicularDirs.push(DIRECTIONS.UP, DIRECTIONS.DOWN);
        } else {
            perpendicularDirs.push(DIRECTIONS.LEFT, DIRECTIONS.RIGHT);
        }
        
        // Try to position ourselves to block one of the perpendicular escape routes
        for (const perpDir of perpendicularDirs) {
            const blockPos = {
                x: this.grid.wrapX(playerHead.x + perpDir.x),
                y: this.grid.wrapY(playerHead.y + perpDir.y)
            };
            
            // Check if this position is closer to us than to player (we can reach it first)
            const distToBlock = this.manhattanDistance(enemyHead, blockPos);
            const distPlayerToBlock = this.manhattanDistance(playerHead, blockPos);
            
            if (distToBlock < distPlayerToBlock && this.isSafeMove(blockPos)) {
                return blockPos;
            }
        }
        
        // Fallback: Try to get closer to player from a strategic angle
        // Move to a position that's adjacent to player but not directly in front
        const adjacentPositions = [
            { x: this.grid.wrapX(playerHead.x + 1), y: playerHead.y },
            { x: this.grid.wrapX(playerHead.x - 1), y: playerHead.y },
            { x: playerHead.x, y: this.grid.wrapY(playerHead.y + 1) },
            { x: playerHead.x, y: this.grid.wrapY(playerHead.y - 1) }
        ];
        
        // Prefer positions that are not in player's forward direction
        for (const pos of adjacentPositions) {
            const dx = pos.x - playerHead.x;
            const dy = pos.y - playerHead.y;
            
            // Skip if this is directly in front of player (they'll move into us)
            if (dx === playerDir.x && dy === playerDir.y) continue;
            
            if (this.isSafeMove(pos)) {
                return pos;
            }
        }
        
        // Last resort: just move towards player
        return null;
    }
}

