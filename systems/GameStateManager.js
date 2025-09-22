// GameStateManager - Centralized game state management
// Extracted from gameScene.js for better architecture and maintainability

export default class GameStateManager {
    constructor(scene) {
        this.scene = scene;
        this.initializeGameState();
        this.setupEventListeners();
    }

    initializeGameState() {
        // Core game state (extracted from gameScene)
        this.score = 0;
        this.comboCount = 0;
        this.maxComboReached = 0;
        this.gameSpeed = 300;
        this.baseGameSpeed = 300;
        this.speedIncrease = 1;
        this.distanceTraveled = 0;
        this.gameRunning = false;
        this.pauseState = false;
        this.isDashing = false;

        // Session management
        this.sessionPhase = 'warmup';
        this.phaseStartTime = 0;
        this.sessionBonusMultiplier = 1;
        
        // Game statistics
        this.gameStats = {
            startTime: null,
            endTime: null,
            collectiblesGathered: 0,
            obstaclesAvoided: 0,
            powerUpsUsed: 0,
            maxCombo: 0,
            distanceTraveled: 0,
            playtime: 0,
            deaths: 0,
            level: 1
        };

        // Performance tracking
        this.lastUpdateTime = 0;
        this.frameCount = 0;
        this.averageFPS = 60;
        
        // Achievement tracking
        this.achievements = new Set();
        this.milestones = new Map();
    }

    setupEventListeners() {
        // Listen for game events
        this.scene.events.on('collectibleGathered', this.onCollectibleGathered, this);
        this.scene.events.on('obstacleHit', this.onObstacleHit, this);
        this.scene.events.on('powerUpUsed', this.onPowerUpUsed, this);
        this.scene.events.on('comboIncreased', this.onComboIncreased, this);
    }

    // Game lifecycle methods
    startGame() {
        console.log('🎮 GameStateManager: Starting new game');
        
        this.gameRunning = true;
        this.pauseState = false;
        this.gameStats.startTime = Date.now();
        this.lastUpdateTime = this.scene.time.now;
        
        // Reset counters
        this.score = 0;
        this.comboCount = 0;
        this.distanceTraveled = 0;
        this.gameStats.collectiblesGathered = 0;
        this.gameStats.obstaclesAvoided = 0;
        this.gameStats.powerUpsUsed = 0;
        this.gameStats.deaths = 0;
        
        // Set initial difficulty
        this.updateDifficulty();
        
        // Emit game started event
        this.scene.events.emit('gameStarted', this.getGameState());
    }

    pauseGame() {
        if (!this.gameRunning) return;
        
        this.pauseState = true;
        console.log('⏸️ Game paused');
        
        // Pause physics and animations
        this.scene.physics.pause();
        this.scene.anims.pauseAll();
        
        this.scene.events.emit('gamePaused');
    }

    resumeGame() {
        if (!this.gameRunning || !this.pauseState) return;
        
        this.pauseState = false;
        console.log('▶️ Game resumed');
        
        // Resume physics and animations
        this.scene.physics.resume();
        this.scene.anims.resumeAll();
        
        this.scene.events.emit('gameResumed');
    }

    endGame(reason = 'collision') {
        if (!this.gameRunning) return;
        
        console.log('🎮 GameStateManager: Game ended -', reason);
        
        this.gameRunning = false;
        this.gameStats.endTime = Date.now();
        this.gameStats.playtime = this.gameStats.endTime - this.gameStats.startTime;
        
        // Calculate final stats
        const finalStats = this.calculateFinalStats();
        
        // Check for achievements
        this.checkAchievements(finalStats);
        
        // Emit game ended event
        this.scene.events.emit('gameEnded', {
            reason,
            score: this.score,
            stats: finalStats
        });
        
        return finalStats;
    }

    // Score management
    addScore(points, source = 'unknown') {
        if (!this.gameRunning) return;
        
        // Apply multipliers
        let finalPoints = points;
        
        // Power-up multiplier
        if (this.scene.powerUpSystem) {
            finalPoints *= this.scene.powerUpSystem.getCurrentScoreMultiplier();
        }
        
        // Session bonus multiplier
        finalPoints *= this.sessionBonusMultiplier;
        
        // Combo multiplier
        if (this.comboCount > 1) {
            finalPoints *= (1 + (this.comboCount * 0.1)); // 10% bonus per combo
        }
        
        // Round to nearest integer
        finalPoints = Math.floor(finalPoints);
        
        this.score += finalPoints;
        
        // Update level based on score
        const newLevel = Math.floor(this.score / 1000) + 1;
        if (newLevel > this.gameStats.level) {
            this.onLevelUp(newLevel);
        }
        
        // Emit score update
        this.scene.events.emit('scoreUpdated', {
            points: finalPoints,
            totalScore: this.score,
            source,
            multiplier: finalPoints / points
        });
        
        // Check score milestones
        this.checkScoreMilestones();
    }

    // Combo system
    increaseCombo() {
        this.comboCount++;
        this.maxComboReached = Math.max(this.maxComboReached, this.comboCount);
        this.gameStats.maxCombo = this.maxComboReached;
        
        this.scene.events.emit('comboIncreased', this.comboCount);
    }

    resetCombo() {
        if (this.comboCount > 0) {
            this.scene.events.emit('comboReset', this.comboCount);
            this.comboCount = 0;
        }
    }

    // Distance tracking
    updateDistance(delta) {
        if (!this.gameRunning || this.pauseState) return;
        
        const distanceThisFrame = (this.gameSpeed * delta) / 1000;
        this.distanceTraveled += distanceThisFrame;
        this.gameStats.distanceTraveled = this.distanceTraveled;
        
        // Check distance milestones
        this.checkDistanceMilestones();
    }

    // Difficulty management
    updateDifficulty() {
        const scoreMultiplier = Math.floor(this.score / 1000) * 0.1;
        const timeMultiplier = Math.floor(this.distanceTraveled / 1000) * 0.05;
        const difficultyMultiplier = 1 + scoreMultiplier + timeMultiplier;
        
        this.gameSpeed = this.baseGameSpeed * difficultyMultiplier;
        this.gameSpeed = Math.min(this.gameSpeed, this.baseGameSpeed * 2.5); // Cap at 2.5x
        
        // Emit difficulty update
        this.scene.events.emit('difficultyUpdated', {
            multiplier: difficultyMultiplier,
            gameSpeed: this.gameSpeed
        });
    }

    // Event handlers
    onCollectibleGathered(collectibleData) {
        this.gameStats.collectiblesGathered++;
        this.addScore(collectibleData.points, 'collectible');
        this.increaseCombo();
    }

    onObstacleHit(obstacleData) {
        this.gameStats.deaths++;
        this.resetCombo();
        
        // Check if player is invulnerable
        if (this.scene.powerUpSystem && this.scene.powerUpSystem.isPlayerInvulnerable()) {
            console.log('🛡️ Hit blocked by shield');
            return false; // Hit blocked
        }
        
        return true; // Hit registered
    }

    onPowerUpUsed(powerUpType) {
        this.gameStats.powerUpsUsed++;
    }

    onComboIncreased(comboCount) {
        // Handle combo-specific logic
        if (comboCount % 5 === 0) {
            // Bonus for every 5 combo
            this.addScore(comboCount * 10, 'combo_bonus');
        }
    }

    onLevelUp(newLevel) {
        const oldLevel = this.gameStats.level;
        this.gameStats.level = newLevel;
        
        console.log(`🎉 Level up! ${oldLevel} → ${newLevel}`);
        
        // Level up bonus
        this.addScore(newLevel * 100, 'level_bonus');
        
        // Update difficulty
        this.updateDifficulty();
        
        this.scene.events.emit('levelUp', {
            oldLevel,
            newLevel,
            bonus: newLevel * 100
        });
    }

    // Update method called from game loop
    update(time, delta) {
        if (!this.gameRunning || this.pauseState) return;
        
        // Update distance
        this.updateDistance(delta);
        
        // Update difficulty periodically
        if (time - this.lastUpdateTime > 5000) { // Every 5 seconds
            this.updateDifficulty();
            this.lastUpdateTime = time;
        }
        
        // Track performance
        this.frameCount++;
        if (this.frameCount % 60 === 0) { // Every 60 frames
            this.averageFPS = 1000 / (delta || 16.67);
        }
    }

    // Milestone checking
    checkScoreMilestones() {
        const milestones = [1000, 5000, 10000, 25000, 50000, 100000];
        
        milestones.forEach(milestone => {
            if (this.score >= milestone && !this.milestones.has(`score_${milestone}`)) {
                this.milestones.set(`score_${milestone}`, true);
                this.scene.events.emit('milestoneReached', {
                    type: 'score',
                    value: milestone,
                    reward: milestone / 10
                });
            }
        });
    }

    checkDistanceMilestones() {
        const milestones = [1000, 2500, 5000, 10000, 25000];
        
        milestones.forEach(milestone => {
            if (this.distanceTraveled >= milestone && !this.milestones.has(`distance_${milestone}`)) {
                this.milestones.set(`distance_${milestone}`, true);
                this.scene.events.emit('milestoneReached', {
                    type: 'distance',
                    value: milestone,
                    reward: milestone / 20
                });
            }
        });
    }

    // Achievement system
    checkAchievements(stats) {
        const achievements = [
            {
                id: 'first_flight',
                name: 'First Flight',
                condition: () => stats.playtime > 30000, // 30 seconds
                description: 'Survive for 30 seconds'
            },
            {
                id: 'combo_master',
                name: 'Combo Master',
                condition: () => stats.maxCombo >= 10,
                description: 'Achieve a 10x combo'
            },
            {
                id: 'collector',
                name: 'Collector',
                condition: () => stats.collectiblesGathered >= 50,
                description: 'Collect 50 items in one game'
            },
            {
                id: 'power_user',
                name: 'Power User',
                condition: () => stats.powerUpsUsed >= 5,
                description: 'Use 5 power-ups in one game'
            },
            {
                id: 'distance_runner',
                name: 'Distance Runner',
                condition: () => stats.distanceTraveled >= 5000,
                description: 'Travel 5000 units'
            }
        ];

        achievements.forEach(achievement => {
            if (!this.achievements.has(achievement.id) && achievement.condition()) {
                this.achievements.add(achievement.id);
                this.scene.events.emit('achievementUnlocked', achievement);
            }
        });
    }

    // Statistics calculation
    calculateFinalStats() {
        return {
            ...this.gameStats,
            finalScore: this.score,
            maxCombo: this.maxComboReached,
            averageFPS: this.averageFPS,
            efficiency: this.gameStats.collectiblesGathered / Math.max(1, this.gameStats.deaths),
            survivalTime: this.gameStats.playtime,
            distancePerSecond: this.gameStats.distanceTraveled / (this.gameStats.playtime / 1000),
            achievements: Array.from(this.achievements)
        };
    }

    // Getters for current game state
    getGameState() {
        return {
            score: this.score,
            level: this.gameStats.level,
            combo: this.comboCount,
            distance: this.distanceTraveled,
            gameSpeed: this.gameSpeed,
            isRunning: this.gameRunning,
            isPaused: this.pauseState,
            sessionPhase: this.sessionPhase,
            stats: this.gameStats
        };
    }

    getScore() {
        return this.score;
    }

    getLevel() {
        return this.gameStats.level;
    }

    getCombo() {
        return this.comboCount;
    }

    getDistance() {
        return this.distanceTraveled;
    }

    isGameRunning() {
        return this.gameRunning;
    }

    isGamePaused() {
        return this.pauseState;
    }

    // Cleanup
    cleanup() {
        this.scene.events.off('collectibleGathered', this.onCollectibleGathered, this);
        this.scene.events.off('obstacleHit', this.onObstacleHit, this);
        this.scene.events.off('powerUpUsed', this.onPowerUpUsed, this);
        this.scene.events.off('comboIncreased', this.onComboIncreased, this);
    }

    // Reset for new game
    reset() {
        this.initializeGameState();
    }
}
