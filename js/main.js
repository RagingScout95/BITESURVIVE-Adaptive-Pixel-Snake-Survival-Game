import { Grid } from './grid.js';
import { SpriteRenderer } from './spriteRenderer.js';
import { Snake } from './snake.js';
import { EnemyAI } from './enemyAI.js';
import { FoodSystem } from './food.js';
import { WallSystem } from './wallSystem.js';
import { LevelGenerator } from './levelGenerator.js';
import { DifficultySystem } from './difficulty.js';
import { GameAPI } from './api.js';
import { Debug } from './debug.js';
import {
    TILE_SIZE,
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    WORLD_WIDTH,
    WORLD_HEIGHT,
    DIRECTIONS,
    TILES,
    GAME_TICK_MS
} from './constants.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;

        this.grid = new Grid();
        this.spriteRenderer = null;
        this.playerSnake = null;
        this.enemySnakes = [];
        this.enemyAIs = [];
        this.enemyRespawnQueue = []; // Array of {enemy, ai, respawnTime}
        this.foodSystem = new FoodSystem(this.grid);
        this.wallSystem = new WallSystem(this.grid);
        this.levelGenerator = new LevelGenerator(this.grid);
        this.difficultySystem = new DifficultySystem();

        this.gameState = 'start'; // 'start', 'playing', 'paused', 'gameover', 'leaderboard'
        this.lastTick = 0;
        this.timeSurvived = 0;
        this.score = 0;
        this.keys = {};
        this.ENEMY_RESPAWN_DELAY = 5000; // 5 seconds respawn delay

        this.loadAssets();
        this.setupEventListeners();
        // Load leaderboard (async, will load in background)
        this.loadLeaderboard();
    }

    async loadAssets() {
        try {
            // Load sprite atlas
            const atlasImage = new Image();
            atlasImage.src = 'assets/all_stuff.png';

            // Load canvas background
            const canvasBg = new Image();
            canvasBg.src = 'assets/canvas.png';

            await Promise.all([
                new Promise((resolve, reject) => {
                    atlasImage.onload = resolve;
                    atlasImage.onerror = reject;
                }),
                new Promise((resolve, reject) => {
                    canvasBg.onload = resolve;
                    canvasBg.onerror = reject;
                })
            ]);

            this.spriteRenderer = new SpriteRenderer(this.canvas, atlasImage);
            this.canvasBackground = canvasBg;
            Debug.log('Assets loaded successfully');
        } catch (error) {
            Debug.error('Failed to load assets:', error);
            alert('Failed to load game assets. Please ensure assets/all_stuff.png and assets/canvas.png exist.');
        }
    }

    setupEventListeners() {
        // Keyboard input
        document.addEventListener('keydown', (e) => {
            if (e.key) {
                this.keys[e.key.toLowerCase()] = true;
                this.handleInput(e.key.toLowerCase());
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.key) {
                this.keys[e.key.toLowerCase()] = false;
            }
        });

        // UI buttons
        document.getElementById('start-button').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('submit-score').addEventListener('click', () => {
            this.submitScore();
        });

        document.getElementById('skip-submit').addEventListener('click', () => {
            this.skipSubmitAndRestart();
        });

        document.getElementById('play-again').addEventListener('click', () => {
            this.resetGame();
        });

        document.getElementById('play-again-from-gameover').addEventListener('click', () => {
            // Reset game state
            this.grid.walls.clear();
            this.grid.portals.clear();
            this.grid.clearOccupied();
            this.foodSystem.clear();
            this.enemySnakes = [];
            this.enemyAIs = [];
            this.enemyRespawnQueue = [];
            this.playerSnake = null;
            
            // Hide all screens
            document.getElementById('game-over-screen').classList.add('hidden');
            document.getElementById('leaderboard-screen').classList.add('hidden');
            document.getElementById('pause-screen').classList.add('hidden');
            document.getElementById('start-screen').classList.add('hidden');
            
            // Reload leaderboard and start game directly
            this.loadLeaderboard();
            this.startGame();
        });
    }

    handleInput(key) {
        // Pause key works in both playing and paused states
        if (key === 'p') {
            this.togglePause();
            return;
        }

        // Other controls only work when playing
        if (this.gameState !== 'playing') return;

        switch (key) {
            case 'w':
            case 'arrowup':
                this.playerSnake.setDirection(DIRECTIONS.UP);
                break;
            case 's':
            case 'arrowdown':
                this.playerSnake.setDirection(DIRECTIONS.DOWN);
                break;
            case 'a':
            case 'arrowleft':
                this.playerSnake.setDirection(DIRECTIONS.LEFT);
                break;
            case 'd':
            case 'arrowright':
                this.playerSnake.setDirection(DIRECTIONS.RIGHT);
                break;
        }
    }

    startGame() {
        this.gameState = 'playing';
        this.timeSurvived = 0;
        this.score = 0;
        this.difficultySystem.reset();

        // Generate level
        const difficulty = this.difficultySystem.getDifficulty();
        this.levelGenerator.generate(difficulty);

        // Find spawn position - ensure it's valid and has space for snake body
        let spawnPos = this.levelGenerator.findStartPosition();
        if (!spawnPos || this.grid.isWall(spawnPos) || this.grid.isOccupied(spawnPos)) {
            // Fallback: find any valid position
            const validPositions = this.grid.getValidPositions().filter(pos => {
                return !this.grid.isOccupied(pos) && !this.grid.isWall(pos);
            });
            if (validPositions.length > 0) {
                spawnPos = validPositions[Math.floor(Math.random() * validPositions.length)];
            } else {
                spawnPos = { x: Math.floor(WORLD_WIDTH / 2), y: Math.floor(WORLD_HEIGHT / 2) };
            }
        }

        // Ensure spawn position and adjacent tiles are clear for snake body
        const dir = DIRECTIONS.RIGHT;
        const bodyPos1 = { x: this.grid.wrapX(spawnPos.x - dir.x), y: this.grid.wrapY(spawnPos.y - dir.y) };
        const bodyPos2 = { x: this.grid.wrapX(spawnPos.x - dir.x * 2), y: this.grid.wrapY(spawnPos.y - dir.y * 2) };

        if (this.grid.isWall(bodyPos1) || this.grid.isWall(bodyPos2) ||
            this.grid.isOccupied(bodyPos1) || this.grid.isOccupied(bodyPos2)) {
            // Try different spawn position
            const validPositions = this.grid.getValidPositions().filter(pos => {
                const bp1 = { x: this.grid.wrapX(pos.x - dir.x), y: this.grid.wrapY(pos.y - dir.y) };
                const bp2 = { x: this.grid.wrapX(pos.x - dir.x * 2), y: this.grid.wrapY(pos.y - dir.y * 2) };
                return !this.grid.isOccupied(pos) && !this.grid.isWall(pos) &&
                    !this.grid.isWall(bp1) && !this.grid.isWall(bp2) &&
                    !this.grid.isOccupied(bp1) && !this.grid.isOccupied(bp2);
            });
            if (validPositions.length > 0) {
                spawnPos = validPositions[Math.floor(Math.random() * validPositions.length)];
            }
        }

        // Create player snake
        this.playerSnake = new Snake(this.grid, spawnPos, DIRECTIONS.RIGHT, false);

        // Create enemy snakes
        this.enemySnakes = [];
        this.enemyAIs = [];
        const predatorCount = this.difficultySystem.getPredatorCount();
        for (let i = 0; i < predatorCount; i++) {
            const enemySpawn = this.findEnemySpawn();
            if (enemySpawn) {
                const enemySnake = new Snake(this.grid, enemySpawn, DIRECTIONS.LEFT, true);
                this.enemySnakes.push(enemySnake);
                this.enemyAIs.push(new EnemyAI(enemySnake, this.grid, this.playerSnake, this.foodSystem));
            }
        }

        // Spawn initial food
        this.foodSystem.spawnFood(this.difficultySystem.getFoodSpawnRate(), difficulty);

        // Update UI
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('leaderboard-screen').classList.add('hidden');

        this.lastTick = performance.now();
        this.gameLoop();
    }

    findEnemySpawn() {
        const validPositions = this.grid.getValidPositions().filter(pos => {
            return !this.grid.isOccupied(pos) &&
                !this.grid.isWall(pos) &&
                !this.grid.isPortal(pos);
        });

        if (validPositions.length === 0) return null;
        return validPositions[Math.floor(Math.random() * validPositions.length)];
    }

    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            document.getElementById('pause-screen').classList.remove('hidden');
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            document.getElementById('pause-screen').classList.add('hidden');
            this.lastTick = performance.now();
            this.gameLoop();
        }
    }

    gameLoop() {
        if (this.gameState !== 'playing') return;

        const now = performance.now();
        // Calculate dynamic tick time based on difficulty (faster = lower tick time)
        const currentDifficulty = this.difficultySystem ? this.difficultySystem.getDifficulty() : 1;
        const speedMultiplier = 1 + (currentDifficulty - 1) * 0.1; // 10% faster per difficulty level (reduced from 15%)
        
        // Apply speed boost if player has it active
        let finalSpeedMultiplier = speedMultiplier;
        if (this.playerSnake && this.playerSnake.hasSpeedBoost()) {
            finalSpeedMultiplier *= 1.2; // 20% speed boost (reduced from 50%)
        }
        
        const dynamicTickMs = Math.max(40, GAME_TICK_MS / finalSpeedMultiplier); // Minimum 40ms tick time
        
        if (now - this.lastTick >= dynamicTickMs) {
            const actualElapsed = now - this.lastTick;
            this.update(actualElapsed);
            this.lastTick = now;
        }

        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }

    update(actualElapsedMs = GAME_TICK_MS) {
        // Update difficulty first to get current values
        const difficulty = this.difficultySystem.update(this.playerSnake, this.timeSurvived);
        
        // Update time using actual elapsed time
        this.timeSurvived += actualElapsedMs / 1000;
        this.updateUI();

        // Get energy drain multiplier for progressive hunger
        const energyDrainMultiplier = this.difficultySystem.getEnergyDrainMultiplier();

        // Move player snake with energy drain multiplier
        this.playerSnake.move(energyDrainMultiplier);

        // Check food collision (player)
        const playerHead = this.playerSnake.getHead();
        const food = this.foodSystem.getFoodAt(playerHead);
        if (food) {
            this.playerSnake.eat(food.energy, food.speedBoost || 0);
            this.foodSystem.removeFood(playerHead);
            this.score += Math.max(10, food.energy); // Score based on food energy
        }

        // Handle enemy respawns
        const now = performance.now();
        for (let i = this.enemyRespawnQueue.length - 1; i >= 0; i--) {
            const respawn = this.enemyRespawnQueue[i];
            if (now >= respawn.respawnTime) {
                // Respawn enemy
                const enemySpawn = this.findEnemySpawn();
                if (enemySpawn) {
                    const newEnemy = new Snake(this.grid, enemySpawn, DIRECTIONS.LEFT, true);
                    const newAI = new EnemyAI(newEnemy, this.grid, this.playerSnake, this.foodSystem);
                    this.enemySnakes.push(newEnemy);
                    this.enemyAIs.push(newAI);
                    Debug.log(`[Main] Enemy respawned at (${enemySpawn.x}, ${enemySpawn.y})`);
                }
                this.enemyRespawnQueue.splice(i, 1);
            }
        }

        // Move enemy snakes with energy drain multiplier
        for (let i = this.enemySnakes.length - 1; i >= 0; i--) {
            const enemy = this.enemySnakes[i];
            if (!enemy.alive) {
                // Schedule respawn instead of immediately removing
                const respawnTime = now + this.ENEMY_RESPAWN_DELAY;
                this.enemyRespawnQueue.push({
                    enemy: enemy,
                    ai: this.enemyAIs[i],
                    respawnTime: respawnTime
                });
                Debug.log(`[Main] Enemy died, will respawn in ${this.ENEMY_RESPAWN_DELAY/1000} seconds`);
                this.enemySnakes.splice(i, 1);
                this.enemyAIs.splice(i, 1);
                continue;
            }

            // Update AI
            this.enemyAIs[i].update();
            enemy.move(energyDrainMultiplier);

            // Check food collision (enemy)
            const enemyHead = enemy.getHead();
            // Wrap the head position to ensure correct collision detection
            const wrappedEnemyHead = {
                x: this.grid.wrapX(enemyHead.x),
                y: this.grid.wrapY(enemyHead.y)
            };
            
            const enemyFood = this.foodSystem.getFoodAt(wrappedEnemyHead);
            if (enemyFood) {
                Debug.log(`[Main] Enemy ate food at (${wrappedEnemyHead.x}, ${wrappedEnemyHead.y}), Energy: ${enemyFood.energy}, Enemy will grow!`);
                enemy.eat(enemyFood.energy, enemyFood.speedBoost || 0);
                this.foodSystem.removeFood(wrappedEnemyHead);
            }

            // Check collision: Enemy head hits player head - player dies
            if (enemyHead.x === playerHead.x && enemyHead.y === playerHead.y) {
                this.playerSnake.alive = false;
            }

            // Check collision: Enemy head hits player body - enemy dies (player survives)
            for (let j = 1; j < this.playerSnake.body.length; j++) {
                if (enemyHead.x === this.playerSnake.body[j].x && enemyHead.y === this.playerSnake.body[j].y) {
                    enemy.alive = false;
                    break;
                }
            }

            // Check collision: Player head hits enemy body - player dies
            for (let j = 1; j < enemy.body.length; j++) {
                if (enemy.body[j].x === playerHead.x && enemy.body[j].y === playerHead.y) {
                    this.playerSnake.alive = false;
                }
            }
        }

        // Check game over
        if (!this.playerSnake.alive) {
            this.gameOver();
            return;
        }

        // Spawn food periodically
        if (this.foodSystem.getFoods().length < this.difficultySystem.getFoodSpawnRate()) {
            this.foodSystem.spawnFood(1, difficulty);
        }

        // Spawn new predators if difficulty increased
        const currentPredatorCount = this.enemySnakes.length;
        const targetPredatorCount = this.difficultySystem.getPredatorCount();
        if (currentPredatorCount < targetPredatorCount) {
            const enemySpawn = this.findEnemySpawn();
            if (enemySpawn) {
                const enemySnake = new Snake(this.grid, enemySpawn, DIRECTIONS.LEFT, true);
                this.enemySnakes.push(enemySnake);
                this.enemyAIs.push(new EnemyAI(enemySnake, this.grid, this.playerSnake, this.foodSystem));
            }
        }
    }

    render() {
        if (!this.spriteRenderer) return;

        this.spriteRenderer.clear();

        // Draw canvas background
        if (this.canvasBackground) {
            const ctx = this.canvas.getContext('2d');
            ctx.drawImage(
                this.canvasBackground,
                0, 0,
                this.canvas.width,
                this.canvas.height
            );
        }

        // Draw walls (draw after background so they're visible)
        const ctx = this.canvas.getContext('2d');
        for (let y = 0; y < this.grid.height; y++) {
            for (let x = 0; x < this.grid.width; x++) {
                const pos = { x, y };
                if (this.grid.isWall(pos)) {
                    const tile = this.wallSystem.getWallTile(pos);
                    const rotation = this.wallSystem.getWallRotation(pos);
                    // Draw wall tile
                    this.spriteRenderer.drawTile(
                        tile,
                        x * TILE_SIZE,
                        y * TILE_SIZE,
                        rotation
                    );
                    // Fallback: draw a visible rectangle if tile is not visible
                    // This ensures walls are always visible
                    ctx.fillStyle = 'rgba(139, 69, 19, 0.5)'; // Brown with transparency
                    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                }
            }
        }

        // Draw portals
        for (const [key, dest] of this.grid.portals.entries()) {
            const [x, y] = key.split(',').map(Number);
            this.spriteRenderer.drawTile(
                TILES.PORTAL,
                x * TILE_SIZE,
                y * TILE_SIZE,
                0
            );
        }

        // Draw food
        for (const food of this.foodSystem.getFoods()) {
            this.spriteRenderer.drawTile(
                food.type,
                food.x * TILE_SIZE,
                food.y * TILE_SIZE,
                0
            );
        }

        // Draw enemy snakes (render all segments, including head as body)
        for (const enemy of this.enemySnakes) {
            if (!enemy.alive) continue;
            for (let i = 0; i < enemy.body.length; i++) {
                const segment = enemy.body[i];
                const tile = enemy.getSegmentTile(i);
                // No rotation needed - direction is encoded in tile
                this.spriteRenderer.drawTile(
                    tile,
                    segment.x * TILE_SIZE,
                    segment.y * TILE_SIZE,
                    0, // No rotation
                    true // isEnemy
                );
            }
        }

        // Draw player snake (render all segments - head position uses body tile)
        if (this.playerSnake && this.playerSnake.alive) {
            for (let i = 0; i < this.playerSnake.body.length; i++) {
                const segment = this.playerSnake.body[i];
                // Ensure segment position is valid
                const x = this.grid.wrapX(segment.x);
                const y = this.grid.wrapY(segment.y);

                const tile = this.playerSnake.getSegmentTile(i);
                // No rotation needed - direction is encoded in tile
                this.spriteRenderer.drawTile(
                    tile,
                    x * TILE_SIZE,
                    y * TILE_SIZE,
                    0, // No rotation
                    false
                );
            }
        }
    }

    updateUI() {
        if (!this.playerSnake) return;

        // Update energy bar
        const energyPercent = (this.playerSnake.energy / this.playerSnake.maxEnergy) * 100;
        document.getElementById('energy-fill').style.width = `${energyPercent}%`;
        document.getElementById('energy-value').textContent = `${Math.floor(energyPercent)}%`;

        // Update stats
        document.getElementById('length-value').textContent = this.playerSnake.getLength();

        const minutes = Math.floor(this.timeSurvived / 60);
        const seconds = Math.floor(this.timeSurvived % 60);
        document.getElementById('time-value').textContent =
            `${minutes}:${seconds.toString().padStart(2, '0')}`;

        document.getElementById('difficulty-value').textContent =
            this.difficultySystem.getDifficulty();
    }

    gameOver() {
        this.gameState = 'gameover';
        const message = this.playerSnake.energy <= 0 ?
            'You starved!' :
            'You collided!';
        document.getElementById('game-over-message').textContent = message;
        
        // Store game stats (but don't display yet)
        const minutes = Math.floor(this.timeSurvived / 60);
        const seconds = Math.floor(this.timeSurvived % 60);
        document.getElementById('final-time').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-length').textContent = this.playerSnake.getLength();
        document.getElementById('final-difficulty').textContent = this.difficultySystem.getDifficulty();
        document.getElementById('final-rank').textContent = '-';
        document.getElementById('final-percentage').textContent = '-';
        
        // Reset UI state - show only input, hide stats
        const submitButton = document.getElementById('submit-score');
        const nameInput = document.getElementById('player-name');
        const submittingMessage = document.getElementById('submitting-message');
        const scoreInputContainer = document.getElementById('score-input-container');
        const playAgainContainer = document.getElementById('play-again-container');
        const gameStats = document.getElementById('game-stats');
        
        submitButton.disabled = false;
        nameInput.disabled = false;
        submitButton.textContent = 'Submit Score';
        submittingMessage.classList.add('hidden');
        scoreInputContainer.classList.remove('hidden');
        playAgainContainer.classList.add('hidden');
        gameStats.classList.add('hidden'); // Hide stats initially
        
        // Clear name input
        nameInput.value = '';
        
        document.getElementById('game-over-screen').classList.remove('hidden');
    }

    async submitScore() {
        const submitButton = document.getElementById('submit-score');
        const nameInput = document.getElementById('player-name');
        const submittingMessage = document.getElementById('submitting-message');
        const scoreInputContainer = document.getElementById('score-input-container');
        const playAgainContainer = document.getElementById('play-again-container');

        // Disable button and show loading
        submitButton.disabled = true;
        nameInput.disabled = true;
        submittingMessage.classList.remove('hidden');
        submitButton.textContent = 'Submitting...';

        const playerName = nameInput.value.trim() || 'Anonymous';

        const scoreData = {
            playerName,
            score: this.score,
            timeSurvived: Math.floor(this.timeSurvived),
            maxSnakeLength: this.playerSnake.getLength(),
            difficultyReached: this.difficultySystem.getDifficulty()
        };

        try {
            await GameAPI.submitScore(scoreData);
            const leaderboard = await GameAPI.getLeaderboard();
            this.calculateAndShowStats(leaderboard, scoreData);
            this.updateLeaderboardPanel(leaderboard); // Update right panel leaderboard
            
            // Hide input container, show stats and Play Again button
            scoreInputContainer.classList.add('hidden');
            document.getElementById('game-stats').classList.remove('hidden');
            playAgainContainer.classList.remove('hidden');
        } catch (error) {
            Debug.error('Failed to submit score:', error);
            // Try to get leaderboard even if submission fails
            try {
                const leaderboard = await GameAPI.getLeaderboard();
                this.calculateAndShowStats(leaderboard, scoreData);
                this.updateLeaderboardPanel(leaderboard); // Update right panel leaderboard
                
                // Hide input container, show stats and Play Again button
                scoreInputContainer.classList.add('hidden');
                document.getElementById('game-stats').classList.remove('hidden');
                playAgainContainer.classList.remove('hidden');
            } catch (e) {
                // Re-enable button on error
                submitButton.disabled = false;
                nameInput.disabled = false;
                submittingMessage.classList.add('hidden');
                submitButton.textContent = 'Submit Score';
                alert('Failed to connect to server. Please ensure the backend is running.');
            }
        }
    }

    skipSubmitAndRestart() {
        // Reset game state
        this.grid.walls.clear();
        this.grid.portals.clear();
        this.grid.clearOccupied();
        this.foodSystem.clear();
        this.enemySnakes = [];
        this.enemyAIs = [];
        this.enemyRespawnQueue = [];
        this.playerSnake = null;
        
        // Hide all screens
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('leaderboard-screen').classList.add('hidden');
        document.getElementById('pause-screen').classList.add('hidden');
        document.getElementById('start-screen').classList.add('hidden');
        
        // Reload leaderboard and start game directly
        this.loadLeaderboard();
        this.startGame();
    }

    calculateAndShowStats(leaderboard, scoreData) {
        if (!leaderboard || leaderboard.length === 0) {
            document.getElementById('final-rank').textContent = '#1';
            document.getElementById('final-percentage').textContent = '100%';
            return;
        }

        // Find player's rank (sorted by score descending)
        const sortedLeaderboard = [...leaderboard].sort((a, b) => b.score - a.score);
        const playerRank = sortedLeaderboard.findIndex(entry => 
            entry.playerName === scoreData.playerName &&
            entry.score === scoreData.score &&
            entry.timeSurvived === scoreData.timeSurvived
        ) + 1;

        // If not found, calculate rank based on score
        let rank = sortedLeaderboard.length + 1;
        if (playerRank > 0) {
            rank = playerRank;
        } else {
            // Calculate where this score would rank
            rank = sortedLeaderboard.filter(entry => entry.score > scoreData.score).length + 1;
        }

        // Calculate top percentage
        const totalPlayers = sortedLeaderboard.length;
        const playersAbove = rank - 1;
        const percentage = totalPlayers > 0 
            ? Math.round(((totalPlayers - playersAbove) / totalPlayers) * 100)
            : 100;

        // Update display
        document.getElementById('final-rank').textContent = `#${rank}`;
        document.getElementById('final-percentage').textContent = `Top ${percentage}%`;
    }

    showLeaderboard(leaderboard) {
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('leaderboard-screen').classList.remove('hidden');

        const list = document.getElementById('leaderboard-list');
        list.innerHTML = '';

        if (!leaderboard || leaderboard.length === 0) {
            list.innerHTML = '<p>No scores yet. Be the first!</p>';
            return;
        }

        leaderboard.forEach((entry, index) => {
            const div = document.createElement('div');
            div.className = 'leaderboard-entry';
            div.innerHTML = `
                <strong>#${index + 1} ${entry.playerName}</strong><br>
                Score: ${entry.score} | Time: ${entry.timeSurvived}s | Length: ${entry.maxSnakeLength} | Difficulty: ${entry.difficultyReached}
            `;
            list.appendChild(div);
        });
    }

    async loadLeaderboard() {
        try {
            const leaderboard = await GameAPI.getLeaderboard();
            this.updateLeaderboardPanel(leaderboard);
        } catch (error) {
            Debug.error('Failed to load leaderboard:', error);
            const leaderboardContent = document.getElementById('leaderboard-content');
            if (leaderboardContent) {
                leaderboardContent.innerHTML = '<p class="message-item">Unable to load leaderboard.</p>';
            }
        }
    }

    updateLeaderboardPanel(leaderboard) {
        const leaderboardContent = document.getElementById('leaderboard-content');
        if (!leaderboardContent) return;

        leaderboardContent.innerHTML = '';

        if (!leaderboard || leaderboard.length === 0) {
            leaderboardContent.innerHTML = '<p class="message-item">No scores yet. Be the first!</p>';
            return;
        }

        // Show top 10
        const top10 = leaderboard.slice(0, 10);
        top10.forEach((entry, index) => {
            const div = document.createElement('div');
            div.className = 'leaderboard-entry-mini';
            div.innerHTML = `
                <span class="rank">#${index + 1}</span>
                <span class="name">${entry.playerName}</span>
                <span class="score">Score: ${entry.score} | Time: ${entry.timeSurvived}s</span>
            `;
            leaderboardContent.appendChild(div);
        });
    }

    resetGame() {
        this.grid.walls.clear();
        this.grid.portals.clear();
        this.grid.clearOccupied();
        this.foodSystem.clear();
        this.enemySnakes = [];
        this.enemyAIs = [];
        this.enemyRespawnQueue = [];
        this.playerSnake = null;

        // Hide all game screens
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('leaderboard-screen').classList.add('hidden');
        document.getElementById('pause-screen').classList.add('hidden');
        
        // Show start screen
        document.getElementById('start-screen').classList.remove('hidden');
        
        this.gameState = 'start';
        this.loadLeaderboard(); // Reload leaderboard when resetting
    }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});

