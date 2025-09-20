/**
 * Debug Logger Utility
 * Centralized logging system with debug mode support
 */

import { DEBUG } from './constants.js';

class DebugLogger {
    constructor() {
        this.enabled = DEBUG.ENABLED;
    }

    log(category, message, ...args) {
        if (!this.enabled) return;
        
        const categoryEnabled = DEBUG[`LOG_${category.toUpperCase()}`];
        if (categoryEnabled) {
            console.log(`[${category}]`, message, ...args);
        }
    }

    warn(message, ...args) {
        if (this.enabled || DEBUG.LOG_ERRORS) {
            console.warn('[WARNING]', message, ...args);
        }
    }

    error(message, ...args) {
        if (DEBUG.LOG_ERRORS) {
            console.error('[ERROR]', message, ...args);
        }
    }

    spawn(message, ...args) {
        this.log('spawns', message, ...args);
    }

    collision(message, ...args) {
        this.log('collisions', message, ...args);
    }

    effect(message, ...args) {
        this.log('effects', message, ...args);
    }

    score(message, ...args) {
        this.log('scores', message, ...args);
    }

    // Performance monitoring
    startTimer(label) {
        if (this.enabled) {
            console.time(label);
        }
    }

    endTimer(label) {
        if (this.enabled) {
            console.timeEnd(label);
        }
    }

    // Group logging for better organization
    group(label) {
        if (this.enabled) {
            console.group(label);
        }
    }

    groupEnd() {
        if (this.enabled) {
            console.groupEnd();
        }
    }
}

// Singleton instance
const debugLogger = new DebugLogger();
export default debugLogger;
