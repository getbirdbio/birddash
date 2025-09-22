// PowerUpSystem - Extracted from gameScene.js for better architecture
// Handles all power-up logic, timers, and effects

export default class PowerUpSystem {
    constructor(scene) {
        this.scene = scene;
        this.initializePowerUpState();
    }

    initializePowerUpState() {
        // Power-up states (extracted from gameScene initializeGameState)
        this.shieldActive = false;
        this.shieldTime = 0;
        this.speedBoostActive = false;
        this.speedBoostTime = 0;
        this.scoreMultiplierActive = false;
        this.scoreMultiplier = 1.0;
        this.scoreMultiplierTime = 0;
        this.timeSlowActive = false;
        this.timeSlowTime = 0;
        this.timeSlowFactor = 1.0;
        this.magnetActive = false;
        this.magnetTime = 0;
        this.magnetRange = 0;
        this.magnetAura = null;
        this.birdCompanionActive = false;
        this.birdCompanionTime = 0;
        this.birdCompanionType = null;
        this.birdCompanion = null;
        this.birdCompanionCollectionRadius = 80;

        // Power-up configurations
        this.powerUpConfigs = {
            shield: { duration: 3000, color: 0x4CAF50 },
            speedBoost: { duration: 4000, multiplier: 1.5, color: 0xFF9800 },
            scoreMultiplier: { duration: 5000, multiplier: 2.0, color: 0xFFD700 },
            timeSlow: { duration: 6000, factor: 0.6, color: 0x9C27B0 },
            magnet: { duration: 5000, range: 150, color: 0xF44336 },
            birdCompanion: { duration: 15000, radius: 80 }
        };
    }

    // Activate a power-up
    activatePowerUp(type, config = {}) {
        const powerUpConfig = { ...this.powerUpConfigs[type], ...config };

        switch (type) {
            case 'shield':
                this.activateShield(powerUpConfig);
                break;
            case 'speedBoost':
                this.activateSpeedBoost(powerUpConfig);
                break;
            case 'scoreMultiplier':
                this.activateScoreMultiplier(powerUpConfig);
                break;
            case 'timeSlow':
                this.activateTimeSlow(powerUpConfig);
                break;
            case 'magnet':
                this.activateMagnet(powerUpConfig);
                break;
            case 'birdCompanion':
                this.activateBirdCompanion(powerUpConfig);
                break;
            default:
                console.warn(`Unknown power-up type: ${type}`);
        }

        // Visual feedback
        this.createPowerUpEffect(type, powerUpConfig);
        
        // Audio feedback
        if (this.scene.soundManager) {
            this.scene.soundManager.playPowerUpSound(type);
        }
    }

    activateShield(config) {
        this.shieldActive = true;
        this.shieldTime = config.duration;
        
        // Visual shield effect on player
        if (this.scene.player && this.scene.player.sprite) {
            this.createShieldVisual(config.color);
        }
    }

    activateSpeedBoost(config) {
        this.speedBoostActive = true;
        this.speedBoostTime = config.duration;
        
        // Apply speed multiplier to player
        if (this.scene.player) {
            this.scene.player.applySpeedMultiplier(config.multiplier);
        }
        
        // Visual speed lines effect
        this.createSpeedLinesEffect();
    }

    activateScoreMultiplier(config) {
        this.scoreMultiplierActive = true;
        this.scoreMultiplier = config.multiplier;
        this.scoreMultiplierTime = config.duration;
        
        // UI feedback
        this.scene.events.emit('scoreMultiplierActivated', config.multiplier);
    }

    activateTimeSlow(config) {
        this.timeSlowActive = true;
        this.timeSlowFactor = config.factor;
        this.timeSlowTime = config.duration;
        
        // Apply time slow to game systems
        this.scene.events.emit('timeSlowActivated', config.factor);
    }

    activateMagnet(config) {
        this.magnetActive = true;
        this.magnetRange = config.range;
        this.magnetTime = config.duration;
        
        // Create magnet aura visual
        this.createMagnetAura(config);
    }

    activateBirdCompanion(config) {
        this.birdCompanionActive = true;
        this.birdCompanionTime = config.duration;
        this.birdCompanionCollectionRadius = config.radius;
        
        // Create companion bird
        this.createBirdCompanion();
    }

    // Update power-up timers and effects
    update(time, delta) {
        this.updateShield(delta);
        this.updateSpeedBoost(delta);
        this.updateScoreMultiplier(delta);
        this.updateTimeSlow(delta);
        this.updateMagnet(delta);
        this.updateBirdCompanion(delta);
    }

    updateShield(delta) {
        if (this.shieldActive) {
            this.shieldTime -= delta;
            if (this.shieldTime <= 0) {
                this.deactivateShield();
            }
        }
    }

    updateSpeedBoost(delta) {
        if (this.speedBoostActive) {
            this.speedBoostTime -= delta;
            if (this.speedBoostTime <= 0) {
                this.deactivateSpeedBoost();
            }
        }
    }

    updateScoreMultiplier(delta) {
        if (this.scoreMultiplierActive) {
            this.scoreMultiplierTime -= delta;
            if (this.scoreMultiplierTime <= 0) {
                this.deactivateScoreMultiplier();
            }
        }
    }

    updateTimeSlow(delta) {
        if (this.timeSlowActive) {
            this.timeSlowTime -= delta;
            if (this.timeSlowTime <= 0) {
                this.deactivateTimeSlow();
            }
        }
    }

    updateMagnet(delta) {
        if (this.magnetActive) {
            this.magnetTime -= delta;
            if (this.magnetTime <= 0) {
                this.deactivateMagnet();
            } else {
                // Apply magnet effect to nearby collectibles
                this.applyMagnetEffect();
            }
        }
    }

    updateBirdCompanion(delta) {
        if (this.birdCompanionActive) {
            this.birdCompanionTime -= delta;
            if (this.birdCompanionTime <= 0) {
                this.deactivateBirdCompanion();
            } else {
                this.updateBirdCompanionBehavior();
            }
        }
    }

    // Deactivation methods
    deactivateShield() {
        this.shieldActive = false;
        this.shieldTime = 0;
        this.removeShieldVisual();
    }

    deactivateSpeedBoost() {
        this.speedBoostActive = false;
        this.speedBoostTime = 0;
        
        if (this.scene.player) {
            this.scene.player.resetSpeedMultiplier();
        }
        this.removeSpeedLinesEffect();
    }

    deactivateScoreMultiplier() {
        this.scoreMultiplierActive = false;
        this.scoreMultiplier = 1.0;
        this.scoreMultiplierTime = 0;
        
        this.scene.events.emit('scoreMultiplierDeactivated');
    }

    deactivateTimeSlow() {
        this.timeSlowActive = false;
        this.timeSlowFactor = 1.0;
        this.timeSlowTime = 0;
        
        this.scene.events.emit('timeSlowDeactivated');
    }

    deactivateMagnet() {
        this.magnetActive = false;
        this.magnetRange = 0;
        this.magnetTime = 0;
        this.removeMagnetAura();
    }

    deactivateBirdCompanion() {
        this.birdCompanionActive = false;
        this.birdCompanionTime = 0;
        this.removeBirdCompanion();
    }

    // Visual effects methods
    createPowerUpEffect(type, config) {
        // Screen flash effect
        const flash = this.scene.add.rectangle(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY,
            this.scene.cameras.main.width,
            this.scene.cameras.main.height,
            config.color,
            0.3
        );
        flash.setScrollFactor(0);
        
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 200,
            onComplete: () => flash.destroy()
        });
    }

    createShieldVisual(color) {
        if (this.scene.player && this.scene.player.sprite) {
            const shield = this.scene.add.circle(0, 0, 30, color, 0.3);
            shield.setStrokeStyle(2, color);
            
            // Attach to player
            this.scene.player.sprite.shieldVisual = shield;
            
            // Pulsing animation
            this.scene.tweens.add({
                targets: shield,
                scaleX: 1.2,
                scaleY: 1.2,
                alpha: 0.1,
                duration: 500,
                yoyo: true,
                repeat: -1
            });
        }
    }

    removeShieldVisual() {
        if (this.scene.player && this.scene.player.sprite && this.scene.player.sprite.shieldVisual) {
            this.scene.player.sprite.shieldVisual.destroy();
            this.scene.player.sprite.shieldVisual = null;
        }
    }

    createSpeedLinesEffect() {
        // Create speed lines particle effect
        // Implementation would depend on your particle system
        console.log('🏃 Speed boost activated - creating speed lines effect');
    }

    removeSpeedLinesEffect() {
        console.log('🏃 Speed boost deactivated - removing speed lines effect');
    }

    createMagnetAura(config) {
        if (this.scene.player && this.scene.player.sprite) {
            this.magnetAura = this.scene.add.circle(0, 0, config.range, config.color, 0.1);
            this.magnetAura.setStrokeStyle(2, config.color, 0.5);
            
            // Pulsing animation
            this.scene.tweens.add({
                targets: this.magnetAura,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 1000,
                yoyo: true,
                repeat: -1
            });
        }
    }

    removeMagnetAura() {
        if (this.magnetAura) {
            this.magnetAura.destroy();
            this.magnetAura = null;
        }
    }

    applyMagnetEffect() {
        if (!this.scene.collectibleManager || !this.scene.player) return;
        
        const playerPos = this.scene.player.sprite;
        const collectibles = this.scene.collectibleManager.getActiveCollectibles();
        
        collectibles.forEach(collectible => {
            const distance = Phaser.Math.Distance.Between(
                playerPos.x, playerPos.y,
                collectible.x, collectible.y
            );
            
            if (distance < this.magnetRange) {
                // Pull collectible towards player
                const angle = Phaser.Math.Angle.Between(
                    collectible.x, collectible.y,
                    playerPos.x, playerPos.y
                );
                
                const pullForce = 200;
                collectible.setVelocity(
                    Math.cos(angle) * pullForce,
                    Math.sin(angle) * pullForce
                );
            }
        });
    }

    createBirdCompanion() {
        // Create companion bird sprite
        console.log('🐦 Bird companion activated');
        // Implementation would create and manage companion bird
    }

    removeBirdCompanion() {
        console.log('🐦 Bird companion deactivated');
        // Clean up companion bird
    }

    updateBirdCompanionBehavior() {
        // Update companion bird AI and collection behavior
    }

    // Utility methods
    isPowerUpActive(type) {
        switch (type) {
            case 'shield': return this.shieldActive;
            case 'speedBoost': return this.speedBoostActive;
            case 'scoreMultiplier': return this.scoreMultiplierActive;
            case 'timeSlow': return this.timeSlowActive;
            case 'magnet': return this.magnetActive;
            case 'birdCompanion': return this.birdCompanionActive;
            default: return false;
        }
    }

    getPowerUpTimeRemaining(type) {
        switch (type) {
            case 'shield': return this.shieldTime;
            case 'speedBoost': return this.speedBoostTime;
            case 'scoreMultiplier': return this.scoreMultiplierTime;
            case 'timeSlow': return this.timeSlowTime;
            case 'magnet': return this.magnetTime;
            case 'birdCompanion': return this.birdCompanionTime;
            default: return 0;
        }
    }

    getCurrentScoreMultiplier() {
        return this.scoreMultiplier;
    }

    getCurrentTimeSlowFactor() {
        return this.timeSlowFactor;
    }

    // Check if player is invulnerable (shield active)
    isPlayerInvulnerable() {
        return this.shieldActive;
    }

    // Clean up all power-ups
    cleanup() {
        this.deactivateShield();
        this.deactivateSpeedBoost();
        this.deactivateScoreMultiplier();
        this.deactivateTimeSlow();
        this.deactivateMagnet();
        this.deactivateBirdCompanion();
    }

    // Reset all power-ups to initial state
    reset() {
        this.cleanup();
        this.initializePowerUpState();
    }
}
