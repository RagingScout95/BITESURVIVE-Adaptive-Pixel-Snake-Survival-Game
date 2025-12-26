export class DifficultySystem {
    constructor() {
        this.baseDifficulty = 1;
        this.currentDifficulty = 1;
        this.startTime = Date.now();
        this.difficultyUpdateInterval = 10000; // Update every 10 seconds
        this.lastUpdate = Date.now();
    }

    update(playerSnake, timeSurvived) {
        const now = Date.now();
        if (now - this.lastUpdate < this.difficultyUpdateInterval) {
            return this.currentDifficulty;
        }

        this.lastUpdate = now;

        // Calculate difficulty based on multiple factors
        const timeFactor = Math.floor(timeSurvived / 30); // +1 every 30 seconds
        const lengthFactor = Math.floor((playerSnake.getLength() - 3) / 5); // +1 every 5 segments
        const energyFactor = playerSnake.energy < 30 ? 1 : 0; // Bonus if low energy

        this.currentDifficulty = Math.max(1, 
            this.baseDifficulty + 
            timeFactor + 
            lengthFactor + 
            energyFactor
        );

        return this.currentDifficulty;
    }

    getWallDensity() {
        return Math.min(0.15 + (this.currentDifficulty - 1) * 0.02, 0.3);
    }

    getPredatorCount() {
        return Math.min(1 + Math.floor(this.currentDifficulty / 2), 5);
    }

    getFoodSpawnRate() {
        return Math.max(3 - Math.floor(this.currentDifficulty / 3), 1);
    }

    getEnergyDrainMultiplier() {
        return 1 + (this.currentDifficulty - 1) * 0.25; // 25% more hunger drain per difficulty level
    }

    reset() {
        this.currentDifficulty = 1;
        this.startTime = Date.now();
        this.lastUpdate = Date.now();
    }

    getDifficulty() {
        return this.currentDifficulty;
    }
}

