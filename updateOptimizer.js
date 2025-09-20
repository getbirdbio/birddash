/**
 * Update Optimizer
 * Optimizes update loops for better performance
 */

export default class UpdateOptimizer {
    constructor() {
        this.updateQueue = new Map();
        this.frameSkips = new Map();
        this.lastUpdateTimes = new Map();
    }

    /**
     * Register an update function with optimization settings
     */
    register(key, updateFn, options = {}) {
        const settings = {
            frequency: options.frequency || 1, // Update every N frames
            minInterval: options.minInterval || 0, // Minimum ms between updates
            condition: options.condition || (() => true), // Conditional update
            priority: options.priority || 0 // Higher priority updates first
        };
        
        this.updateQueue.set(key, {
            fn: updateFn,
            settings,
            frameCount: 0
        });
        
        this.frameSkips.set(key, 0);
        this.lastUpdateTimes.set(key, 0);
    }

    /**
     * Unregister an update function
     */
    unregister(key) {
        this.updateQueue.delete(key);
        this.frameSkips.delete(key);
        this.lastUpdateTimes.delete(key);
    }

    /**
     * Process all registered updates
     */
    update(time, delta) {
        // Sort by priority
        const sortedUpdates = Array.from(this.updateQueue.entries())
            .sort((a, b) => b[1].settings.priority - a[1].settings.priority);
        
        for (const [key, update] of sortedUpdates) {
            const { fn, settings } = update;
            
            // Check condition
            if (!settings.condition()) {
                continue;
            }
            
            // Check frame frequency
            update.frameCount++;
            if (update.frameCount < settings.frequency) {
                continue;
            }
            update.frameCount = 0;
            
            // Check minimum interval
            const lastUpdate = this.lastUpdateTimes.get(key) || 0;
            if (time - lastUpdate < settings.minInterval) {
                continue;
            }
            
            // Execute update
            try {
                fn(time, delta);
                this.lastUpdateTimes.set(key, time);
            } catch (error) {
                console.error(`Update error for ${key}:`, error);
            }
        }
    }

    /**
     * Clear all registered updates
     */
    clear() {
        this.updateQueue.clear();
        this.frameSkips.clear();
        this.lastUpdateTimes.clear();
    }
}

/**
 * Power-up Update Manager
 * Optimizes power-up update checks
 */
export class PowerUpUpdateManager {
    constructor(scene) {
        this.scene = scene;
        this.activePowerUps = new Set();
    }

    /**
     * Register a power-up as active
     */
    activate(powerUpType, duration) {
        this.activePowerUps.add(powerUpType);
        
        // Auto-deactivate after duration
        if (duration > 0) {
            this.scene.time.delayedCall(duration, () => {
                this.deactivate(powerUpType);
            });
        }
    }

    /**
     * Deactivate a power-up
     */
    deactivate(powerUpType) {
        this.activePowerUps.delete(powerUpType);
    }

    /**
     * Check if a power-up is active
     */
    isActive(powerUpType) {
        return this.activePowerUps.has(powerUpType);
    }

    /**
     * Update only active power-ups
     */
    update(delta) {
        // Only process active power-ups
        for (const powerUp of this.activePowerUps) {
            this.updatePowerUp(powerUp, delta);
        }
    }

    /**
     * Update specific power-up
     */
    updatePowerUp(powerUpType, delta) {
        switch(powerUpType) {
            case 'shield':
                if (this.scene.shieldActive) {
                    this.scene.shieldTime -= delta;
                    if (this.scene.shieldTime <= 0) {
                        this.scene.deactivateShield();
                        this.deactivate('shield');
                    } else {
                        this.scene.updateShieldIndicator();
                    }
                }
                break;
                
            case 'speedBoost':
                if (this.scene.speedBoostActive) {
                    this.scene.speedBoostTime -= delta;
                    if (this.scene.speedBoostTime <= 0) {
                        this.scene.deactivateSpeedBoost();
                        this.deactivate('speedBoost');
                    } else {
                        this.scene.updateSpeedBoostIndicator();
                    }
                }
                break;
                
            case 'scoreMultiplier':
                if (this.scene.scoreMultiplierActive) {
                    this.scene.scoreMultiplierTime -= delta;
                    if (this.scene.scoreMultiplierTime <= 0) {
                        this.scene.deactivateScoreMultiplier();
                        this.deactivate('scoreMultiplier');
                    } else {
                        this.scene.updateScoreMultiplierIndicator();
                    }
                }
                break;
                
            case 'timeSlow':
                if (this.scene.timeSlowActive) {
                    this.scene.timeSlowTime -= delta;
                    if (this.scene.timeSlowTime <= 0) {
                        this.scene.deactivateTimeSlow();
                        this.deactivate('timeSlow');
                    } else {
                        this.scene.updateTimeSlowIndicator();
                    }
                }
                break;
                
            case 'magnet':
                if (this.scene.magnetActive) {
                    this.scene.magnetTime -= delta;
                    if (this.scene.magnetTime <= 0) {
                        this.scene.deactivateMagnet();
                        this.deactivate('magnet');
                    } else {
                        this.scene.updateMagnetIndicator();
                        this.scene.applyMagnetEffect();
                    }
                }
                break;
        }
    }

    /**
     * Clear all active power-ups
     */
    clear() {
        this.activePowerUps.clear();
    }
}
