/**
 * Error Handler Utility
 * Centralized error handling and recovery
 */

import debugLogger from './debugLogger.js';

class ErrorHandler {
    constructor() {
        this.errorCount = 0;
        this.errorThreshold = 10;
        this.recoveryStrategies = new Map();
    }

    /**
     * Register a recovery strategy for specific error types
     */
    registerRecovery(errorType, strategy) {
        this.recoveryStrategies.set(errorType, strategy);
    }

    /**
     * Safe try-catch wrapper with automatic recovery
     */
    safeTry(fn, context = null, fallback = null, errorType = 'generic') {
        try {
            return fn.call(context);
        } catch (error) {
            this.handleError(error, errorType, fallback);
            return fallback;
        }
    }

    /**
     * Async safe try-catch wrapper
     */
    async safeTryAsync(fn, context = null, fallback = null, errorType = 'generic') {
        try {
            return await fn.call(context);
        } catch (error) {
            this.handleError(error, errorType, fallback);
            return fallback;
        }
    }

    /**
     * Handle errors with recovery strategies
     */
    handleError(error, errorType = 'generic', fallback = null) {
        this.errorCount++;
        
        // Log the error
        debugLogger.error(`[${errorType}] ${error.message}`, error);
        
        // Check if we've exceeded error threshold
        if (this.errorCount > this.errorThreshold) {
            debugLogger.error('Error threshold exceeded, attempting recovery');
            this.attemptRecovery(errorType);
        }
        
        // Try recovery strategy if available
        const strategy = this.recoveryStrategies.get(errorType);
        if (strategy) {
            try {
                return strategy(error, fallback);
            } catch (recoveryError) {
                debugLogger.error('Recovery strategy failed:', recoveryError);
            }
        }
        
        return fallback;
    }

    /**
     * Attempt to recover from errors
     */
    attemptRecovery(errorType) {
        // Reset error count
        this.errorCount = 0;
        
        // Specific recovery actions based on error type
        switch(errorType) {
            case 'particle':
                // Clear particle systems
                if (window.game && window.game.scene) {
                    const activeScene = window.game.scene.getScene('GameScene');
                    if (activeScene && activeScene.particleManager) {
                        activeScene.particleManager.cleanup();
                    }
                }
                break;
                
            case 'audio':
                // Reset audio context
                if (window.game && window.game.scene) {
                    const activeScene = window.game.scene.getScene('GameScene');
                    if (activeScene && activeScene.soundManager) {
                        activeScene.soundManager.stopAllSounds();
                    }
                }
                break;
                
            case 'storage':
                // Clear corrupted storage
                try {
                    localStorage.clear();
                } catch (e) {
                    debugLogger.error('Failed to clear storage:', e);
                }
                break;
                
            default:
                // Generic recovery - reload scene
                if (window.game && window.game.scene) {
                    try {
                        window.game.scene.restart('GameScene');
                    } catch (e) {
                        debugLogger.error('Failed to restart scene:', e);
                    }
                }
                break;
        }
    }

    /**
     * Wrap a function with error handling
     */
    wrap(fn, errorType = 'generic', fallback = null) {
        return (...args) => {
            return this.safeTry(() => fn(...args), null, fallback, errorType);
        };
    }

    /**
     * Wrap an async function with error handling
     */
    wrapAsync(fn, errorType = 'generic', fallback = null) {
        return async (...args) => {
            return await this.safeTryAsync(() => fn(...args), null, fallback, errorType);
        };
    }

    /**
     * Reset error counter
     */
    reset() {
        this.errorCount = 0;
    }

    /**
     * Get error statistics
     */
    getStats() {
        return {
            errorCount: this.errorCount,
            threshold: this.errorThreshold,
            recoveryStrategies: Array.from(this.recoveryStrategies.keys())
        };
    }
}

// Singleton instance
const errorHandler = new ErrorHandler();

// Register default recovery strategies
errorHandler.registerRecovery('particle', (error, fallback) => {
    debugLogger.warn('Particle system error, using fallback');
    return fallback || {};
});

errorHandler.registerRecovery('audio', (error, fallback) => {
    debugLogger.warn('Audio error, muting sound');
    return fallback || { play: () => {}, stop: () => {} };
});

errorHandler.registerRecovery('storage', (error, fallback) => {
    debugLogger.warn('Storage error, using memory storage');
    return fallback || [];
});

export default errorHandler;
