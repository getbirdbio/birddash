// SystemsIntegration - Integration helper for modular systems
// Shows how to integrate the new modular systems with existing gameScene.js

import PowerUpSystem from './PowerUpSystem.js';
import GameStateManager from './GameStateManager.js';
import UIManager from './UIManager.js';
import TutorialSystem from './TutorialSystem.js';

export default class SystemsIntegration {
    constructor(scene) {
        this.scene = scene;
        this.systems = new Map();
        this.initialized = false;
    }

    // Initialize all systems in the correct order
    async initializeSystems() {
        console.log('🔧 SystemsIntegration: Initializing modular systems...');
        
        try {
            // 1. Initialize core game state management first
            this.systems.set('gameState', new GameStateManager(this.scene));
            
            // 2. Initialize power-up system
            this.systems.set('powerUps', new PowerUpSystem(this.scene));
            
            // 3. Initialize UI system
            this.systems.set('ui', new UIManager(this.scene));
            
            // 4. Initialize tutorial system
            this.systems.set('tutorial', new TutorialSystem(this.scene));
            
            // Add references to scene for easy access
            this.scene.gameStateManager = this.systems.get('gameState');
            this.scene.powerUpSystem = this.systems.get('powerUps');
            this.scene.uiManager = this.systems.get('ui');
            this.scene.tutorialSystem = this.systems.get('tutorial');
            
            // Create UI after all systems are ready
            this.scene.uiManager.createUI();
            
            this.initialized = true;
            console.log('✅ SystemsIntegration: All systems initialized successfully');
            
            // Check if tutorial should be shown
            if (this.scene.tutorialSystem.shouldShowTutorial()) {
                this.scene.tutorialSystem.startTutorial();
            } else {
                // Start normal game
                this.scene.gameStateManager.startGame();
            }
            
        } catch (error) {
            console.error('❌ SystemsIntegration: Failed to initialize systems:', error);
            throw error;
        }
    }

    // Update all systems (called from gameScene update loop)
    update(time, delta) {
        if (!this.initialized) return;
        
        this.systems.forEach((system, name) => {
            try {
                if (system.update && typeof system.update === 'function') {
                    system.update(time, delta);
                }
            } catch (error) {
                console.error(`❌ Error updating ${name} system:`, error);
            }
        });
    }

    // Get a specific system
    getSystem(name) {
        return this.systems.get(name);
    }

    // Check if all systems are initialized
    isInitialized() {
        return this.initialized;
    }

    // Cleanup all systems
    cleanup() {
        console.log('🧹 SystemsIntegration: Cleaning up systems...');
        
        this.systems.forEach((system, name) => {
            try {
                if (system.cleanup && typeof system.cleanup === 'function') {
                    system.cleanup();
                }
            } catch (error) {
                console.error(`❌ Error cleaning up ${name} system:`, error);
            }
        });
        
        this.systems.clear();
        this.initialized = false;
    }

    // Handle game state changes
    onGameStart() {
        if (this.scene.gameStateManager) {
            this.scene.gameStateManager.startGame();
        }
    }

    onGamePause() {
        if (this.scene.gameStateManager) {
            this.scene.gameStateManager.pauseGame();
        }
    }

    onGameResume() {
        if (this.scene.gameStateManager) {
            this.scene.gameStateManager.resumeGame();
        }
    }

    onGameEnd(reason = 'collision') {
        if (this.scene.gameStateManager) {
            return this.scene.gameStateManager.endGame(reason);
        }
        return null;
    }

    // Power-up integration helpers
    activatePowerUp(type, config) {
        if (this.scene.powerUpSystem) {
            this.scene.powerUpSystem.activatePowerUp(type, config);
        }
    }

    isPowerUpActive(type) {
        return this.scene.powerUpSystem ? this.scene.powerUpSystem.isPowerUpActive(type) : false;
    }

    // Score integration helpers
    addScore(points, source) {
        if (this.scene.gameStateManager) {
            this.scene.gameStateManager.addScore(points, source);
        }
    }

    getCurrentScore() {
        return this.scene.gameStateManager ? this.scene.gameStateManager.getScore() : 0;
    }

    // UI integration helpers
    showNotification(title, subtitle, color) {
        if (this.scene.uiManager) {
            this.scene.uiManager.showNotification(title, subtitle, color);
        }
    }

    updateUI() {
        if (this.scene.uiManager) {
            this.scene.uiManager.update();
        }
    }

    // Tutorial integration helpers
    isTutorialActive() {
        return this.scene.tutorialSystem ? this.scene.tutorialSystem.isTutorialActive() : false;
    }

    // Event system integration
    setupEventListeners() {
        // Cross-system event handling
        this.scene.events.on('collectibleGathered', (data) => {
            this.addScore(data.points, 'collectible');
        });

        this.scene.events.on('powerUpCollected', (type) => {
            this.activatePowerUp(type);
        });

        this.scene.events.on('obstacleHit', (data) => {
            if (!this.isPowerUpActive('shield')) {
                this.onGameEnd('collision');
            }
        });

        this.scene.events.on('tutorialCompleted', () => {
            this.onGameStart();
        });
    }

    // Migration helpers for existing gameScene.js integration
    migrateFromMonolithicScene() {
        console.log('🔄 SystemsIntegration: Migrating from monolithic scene...');
        
        // Helper methods to gradually move functionality from gameScene.js
        // This allows for incremental migration without breaking existing code
        
        return {
            // Wrapper methods for backward compatibility
            initializeGameState: () => {
                if (this.scene.gameStateManager) {
                    this.scene.gameStateManager.reset();
                }
            },
            
            updateScore: (points) => {
                this.addScore(points, 'legacy');
            },
            
            activatePowerUp: (type) => {
                this.activatePowerUp(type);
            },
            
            createUI: () => {
                if (this.scene.uiManager) {
                    this.scene.uiManager.createUI();
                }
            },
            
            updateUI: () => {
                this.updateUI();
            }
        };
    }
}

// Usage example for gameScene.js integration:
/*
// In gameScene.js create() method:
import SystemsIntegration from './systems/SystemsIntegration.js';

// Replace existing initialization code with:
this.systemsIntegration = new SystemsIntegration(this);
await this.systemsIntegration.initializeSystems();

// In gameScene.js update() method:
this.systemsIntegration.update(time, delta);

// Replace existing power-up code with:
// this.activatePowerUp(type) becomes:
this.systemsIntegration.activatePowerUp(type);

// Replace existing score code with:
// this.score += points becomes:
this.systemsIntegration.addScore(points, source);

// Replace existing UI updates with:
this.systemsIntegration.updateUI();
*/
