import { DIRECTIONS, TILES, INITIAL_ENERGY, ENERGY_DRAIN_MOVE, ENERGY_DRAIN_TURN } from './constants.js';
import { Grid } from './grid.js';

export class Snake {
    constructor(grid, startPos, startDir, isEnemy = false) {
        this.grid = grid;
        this.isEnemy = isEnemy;
        this.body = [startPos];
        this.direction = startDir;
        this.nextDirection = startDir;
        this.energy = INITIAL_ENERGY;
        this.maxEnergy = INITIAL_ENERGY;
        this.growthPending = 0;
        this.alive = true;
        this.justTeleported = false; // Track if snake just teleported through portal

        // Initialize body - create segments going backwards from head
        // Each segment should be exactly 1 tile away from the previous
        for (let i = 1; i < 3; i++) {
            const prev = this.body[i - 1];
            const newPos = {
                x: this.grid.wrapX(prev.x - startDir.x),
                y: this.grid.wrapY(prev.y - startDir.y)
            };
            // Verify adjacency
            const dx = Math.abs(newPos.x - prev.x);
            const dy = Math.abs(newPos.y - prev.y);
            const wrappedDx = Math.min(dx, this.grid.width - dx);
            const wrappedDy = Math.min(dy, this.grid.height - dy);

            // Ensure segments are adjacent (exactly 1 tile apart)
            if (wrappedDx + wrappedDy !== 1) {
                console.warn(`Snake segment ${i} not adjacent to ${i - 1}`);
            }

            this.body.push(newPos);
        }

        this.updateOccupied();
    }

    updateOccupied() {
        // Clear old positions
        this.body.forEach(pos => {
            this.grid.setOccupied(pos, false);
        });

        // Set new positions
        this.body.forEach(pos => {
            this.grid.setOccupied(pos, true);
        });
    }

    setDirection(newDir) {
        // Prevent reversing into self
        if (newDir.x === -this.direction.x && newDir.y === -this.direction.y) {
            return;
        }
        this.nextDirection = newDir;
    }

    move(energyDrainMultiplier = 1.0) {
        if (!this.alive) return;

        // Update direction
        const wasTurning = this.direction !== this.nextDirection;
        this.direction = this.nextDirection;

        // Calculate new head position
        const head = this.body[0];
        let newHead = {
            x: this.grid.wrapX(head.x + this.direction.x),
            y: this.grid.wrapY(head.y + this.direction.y)
        };

        // Check portal
        const portalDest = this.grid.getPortalDestination(newHead);
        if (portalDest) {
            newHead = portalDest;
            this.justTeleported = true; // Mark that we just teleported
        } else {
            this.justTeleported = false; // Reset if not teleporting
        }

        // Check collisions
        if (this.grid.isWall(newHead)) {
            this.alive = false;
            return;
        }

        // Check self collision
        if (this.body.some((segment, idx) => idx > 0 && segment.x === newHead.x && segment.y === newHead.y)) {
            this.alive = false;
            return;
        }

        // Add new head
        this.body.unshift(newHead);

        // Handle growth
        if (this.growthPending > 0) {
            this.growthPending--;
        } else {
            // Remove tail
            const tail = this.body.pop();
            this.grid.setOccupied(tail, false);
        }

        // Update occupied tiles
        this.grid.setOccupied(newHead, true);

        // Drain energy (scaled by difficulty multiplier)
        let energyDrain = ENERGY_DRAIN_MOVE * energyDrainMultiplier;
        if (wasTurning) {
            energyDrain += ENERGY_DRAIN_TURN * energyDrainMultiplier;
        }
        this.energy = Math.max(0, this.energy - energyDrain);

        if (this.energy <= 0) {
            this.alive = false;
        }
    }

    eat(foodEnergy) {
        this.energy = Math.min(this.maxEnergy, this.energy + foodEnergy);
        this.growthPending++;
    }

    getHead() {
        return this.body[0];
    }

    getLength() {
        return this.body.length;
    }

    // Get rotation for snake segment
    getSegmentRotation(index) {
        if (index === 0) {
            // Head - rotate to face direction
            // Base orientation is DOWN (90 degrees)
            // We need to rotate from 90 to target angle
            // Rotation = Target - Base
            return (this.direction.angle - 90 + 360) % 360;
        }

        if (index === this.body.length - 1) {
            // Tail - rotate to point AWAY from the body
            // Base orientation is RIGHT (0 degrees)
            if (this.body.length < 2) return 0;
            const tail = this.body[index];
            const prev = this.body[index - 1]; // Body segment before tail

            // We want direction FROM Tail TO Body (to point the tail "base" towards body)
            // Or if the sprite points RIGHT, and we want it to point away...
            // Let's assume the sprite points RIGHT >.
            // If tail is to the Left of body [Tail] [Body], it should point RIGHT >.
            // Direction Tail->Body is (1, 0) -> 0 degrees.
            // If tail is Right of body [Body] [Tail], it should point LEFT <.
            // Direction Tail->Body is (-1, 0) -> 180 degrees.

            let dir = {
                x: prev.x - tail.x, // FROM tail TO prev
                y: prev.y - tail.y
            };

            // Handle world wrapping
            if (Math.abs(dir.x) > this.grid.width / 2) {
                dir.x = dir.x > 0 ? dir.x - this.grid.width : dir.x + this.grid.width;
            }
            if (Math.abs(dir.y) > this.grid.height / 2) {
                dir.y = dir.y > 0 ? dir.y - this.grid.height : dir.y + this.grid.height;
            }

            // Normalize
            if (dir.x !== 0) dir.x = dir.x > 0 ? 1 : -1;
            if (dir.y !== 0) dir.y = dir.y > 0 ? 1 : -1;

            // Angle
            return dir.x === 1 ? 0 : dir.x === -1 ? 180 : dir.y === 1 ? 90 : 270;
        }

        // Body segment - calculate direction from previous to current to next
        const prev = this.body[index - 1];
        const curr = this.body[index];
        const next = this.body[index + 1];

        // Calculate direction accounting for world wrapping
        // Direction FROM prev TO curr
        let dirIn = {
            x: curr.x - prev.x,
            y: curr.y - prev.y
        };
        // Direction FROM curr TO next  
        let dirOut = {
            x: next.x - curr.x,
            y: next.y - curr.y
        };

        // Handle world wrapping
        if (Math.abs(dirIn.x) > this.grid.width / 2) {
            dirIn.x = dirIn.x > 0 ? dirIn.x - this.grid.width : dirIn.x + this.grid.width;
        }
        if (Math.abs(dirIn.y) > this.grid.height / 2) {
            dirIn.y = dirIn.y > 0 ? dirIn.y - this.grid.height : dirIn.y + this.grid.height;
        }
        if (Math.abs(dirOut.x) > this.grid.width / 2) {
            dirOut.x = dirOut.x > 0 ? dirOut.x - this.grid.width : dirOut.x + this.grid.width;
        }
        if (Math.abs(dirOut.y) > this.grid.height / 2) {
            dirOut.y = dirOut.y > 0 ? dirOut.y - this.grid.height : dirOut.y + this.grid.height;
        }

        // Normalize
        if (dirIn.x !== 0) dirIn.x = dirIn.x > 0 ? 1 : -1;
        if (dirIn.y !== 0) dirIn.y = dirIn.y > 0 ? 1 : -1;
        if (dirOut.x !== 0) dirOut.x = dirOut.x > 0 ? 1 : -1;
        if (dirOut.y !== 0) dirOut.y = dirOut.y > 0 ? 1 : -1;

        // Straight segment
        if (dirIn.x === dirOut.x && dirIn.y === dirOut.y) {
            // Straight segment
            // Rotated by 90 degrees per user request.
            // Was: dirIn.x !== 0 ? 90 : 0
            // New: dirIn.x !== 0 ? 0 : 90
            return dirIn.x !== 0 ? 0 : 90;
        }


        // Turn segment
        // Base: RIGHT -> DOWN (Enters Left, Exits Bottom) -> 0°

        // Map (dxIn, dyIn) -> (dxOut, dyOut)
        // Right->Down: (1, 0) -> (0, 1)   => 0
        // Up->Left:    (0, -1) -> (-1, 0) => 0

        // Down->Right: (0, 1) -> (1, 0)   => 180
        // Left->Up:    (-1, 0) -> (0, -1) => 180

        // Right->Up:   (1, 0) -> (0, -1)  => 90
        // Down->Left:  (0, 1) -> (-1, 0)  => 90

        // Left->Down:  (-1, 0) -> (0, 1)  => 270
        // Up->Right:   (0, -1) -> (1, 0)  => 270

        if (dirIn.x === 1 && dirOut.y === 1) return 0;    // Right -> Down
        if (dirIn.y === -1 && dirOut.x === -1) return 0;  // Up -> Left

        if (dirIn.y === 1 && dirOut.x === 1) return 180;  // Down -> Right
        if (dirIn.x === -1 && dirOut.y === -1) return 180;// Left -> Up

        if (dirIn.x === 1 && dirOut.y === -1) return 90;  // Right -> Up
        if (dirIn.y === 1 && dirOut.x === -1) return 90;  // Down -> Left

        if (dirIn.x === -1 && dirOut.y === 1) return 270; // Left -> Down
        if (dirIn.y === -1 && dirOut.x === 1) return 270; // Up -> Right

        return 0;
    }

    // Get tile type for segment - returns specific directional tile (no rotation needed)
    getSegmentTile(index) {
        // Head - select tile based on current movement direction
        if (index === 0) {
            if (this.direction.x === 1) return TILES.SNAKE_HEAD_RIGHT;
            if (this.direction.x === -1) return TILES.SNAKE_HEAD_LEFT;
            if (this.direction.y === -1) return TILES.SNAKE_HEAD_UP;
            if (this.direction.y === 1) return TILES.SNAKE_HEAD_DOWN;
            return TILES.SNAKE_HEAD_RIGHT; // fallback
        }

        // Tail - select tile based on direction pointing AWAY from body
        if (index === this.body.length - 1) {
            if (this.body.length < 2) return TILES.SNAKE_TAIL_RIGHT;
            const tail = this.body[index];
            const prev = this.body[index - 1]; // Body segment before tail

            // Direction FROM tail TO body (tail points away from body)
            let dir = {
                x: prev.x - tail.x,
                y: prev.y - tail.y
            };

            // Handle world wrapping
            if (Math.abs(dir.x) > this.grid.width / 2) {
                dir.x = dir.x > 0 ? dir.x - this.grid.width : dir.x + this.grid.width;
            }
            if (Math.abs(dir.y) > this.grid.height / 2) {
                dir.y = dir.y > 0 ? dir.y - this.grid.height : dir.y + this.grid.height;
            }

            // Normalize
            if (dir.x !== 0) dir.x = dir.x > 0 ? 1 : -1;
            if (dir.y !== 0) dir.y = dir.y > 0 ? 1 : -1;

            // Tail points TOWARDS body (reversed from before)
            // If body is to the right, tail should point right (towards body)
            if (dir.x === 1) return TILES.SNAKE_TAIL_RIGHT;  // Body is right, tail points right
            if (dir.x === -1) return TILES.SNAKE_TAIL_LEFT;  // Body is left, tail points left
            if (dir.y === 1) return TILES.SNAKE_TAIL_DOWN;   // Body is down, tail points down
            if (dir.y === -1) return TILES.SNAKE_TAIL_UP;    // Body is up, tail points up
            return TILES.SNAKE_TAIL_RIGHT; // fallback
        }

        // Body segment - determine if straight or turn, and select appropriate tile
        const prev = this.body[index - 1];
        const curr = this.body[index];
        const next = this.body[index + 1];

        // Special case: if we just teleported and this is the segment right after the head (index 1)
        // Use the snake's current direction instead of calculating from positions
        let dirIn, dirOut;
        if (this.justTeleported && index === 1) {
            // After teleport, the segment at index 1 should continue in the same direction
            // Use the snake's direction as dirIn (coming from the teleported head)
            dirIn = { x: this.direction.x, y: this.direction.y };
            // Calculate dirOut normally (from current to next segment)
            dirOut = {
                x: next.x - curr.x,
                y: next.y - curr.y
            };
        } else {
            // Normal case: calculate both directions from positions
            dirIn = {
                x: curr.x - prev.x,
                y: curr.y - prev.y
            };
            dirOut = {
                x: next.x - curr.x,
                y: next.y - curr.y
            };
        }

        // Handle world wrapping
        if (Math.abs(dirIn.x) > this.grid.width / 2) {
            dirIn.x = dirIn.x > 0 ? dirIn.x - this.grid.width : dirIn.x + this.grid.width;
        }
        if (Math.abs(dirIn.y) > this.grid.height / 2) {
            dirIn.y = dirIn.y > 0 ? dirIn.y - this.grid.height : dirIn.y + this.grid.height;
        }
        if (Math.abs(dirOut.x) > this.grid.width / 2) {
            dirOut.x = dirOut.x > 0 ? dirOut.x - this.grid.width : dirOut.x + this.grid.width;
        }
        if (Math.abs(dirOut.y) > this.grid.height / 2) {
            dirOut.y = dirOut.y > 0 ? dirOut.y - this.grid.height : dirOut.y + this.grid.height;
        }

        // Normalize to -1, 0, or 1
        if (dirIn.x !== 0) dirIn.x = dirIn.x > 0 ? 1 : -1;
        if (dirIn.y !== 0) dirIn.y = dirIn.y > 0 ? 1 : -1;
        if (dirOut.x !== 0) dirOut.x = dirOut.x > 0 ? 1 : -1;
        if (dirOut.y !== 0) dirOut.y = dirOut.y > 0 ? 1 : -1;

        // Straight segment
        if (dirIn.x === dirOut.x && dirIn.y === dirOut.y) {
            // Horizontal or vertical
            if (dirIn.x !== 0) return TILES.SNAKE_BODY_HORIZONTAL;
            return TILES.SNAKE_BODY_VERTICAL;
        }

        // Turn segment - select correct turn tile based on direction mapping table
        // Table mapping: snake direction (from) + turn direction (to) → tile index
        // Convert direction vectors to direction names
        const snakeDir = this.getDirectionName(dirIn);
        const turnDir = this.getDirectionName(dirOut);
        
        // Use switch-case with descriptive variable names
        const turnKey = `${snakeDir}_${turnDir}`;
        switch (turnKey) {
            case 'up_left':     return TILES.SNAKE_TURN_UP_LEFT;
            case 'up_right':    return TILES.SNAKE_TURN_UP_RIGHT;
            case 'down_left':   return TILES.SNAKE_TURN_DOWN_LEFT;
            case 'down_right':  return TILES.SNAKE_TURN_DOWN_RIGHT;
            case 'left_up':     return TILES.SNAKE_TURN_LEFT_UP;
            case 'left_down':   return TILES.SNAKE_TURN_LEFT_DOWN;
            case 'right_up':    return TILES.SNAKE_TURN_RIGHT_UP;
            case 'right_down':  return TILES.SNAKE_TURN_RIGHT_DOWN;
            default:
                return TILES.SNAKE_BODY_HORIZONTAL; // Fallback
        }
    }

    // Helper method to convert direction vector to direction name
    getDirectionName(dir) {
        if (dir.y === -1) return 'up';
        if (dir.y === 1) return 'down';
        if (dir.x === -1) return 'left';
        if (dir.x === 1) return 'right';
        return 'unknown';
    }
}

