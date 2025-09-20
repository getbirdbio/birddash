/**
 * Particle Manager
 * Centralized particle system management to prevent memory leaks
 */

import debugLogger from './debugLogger.js';
import { UI } from './constants.js';

export default class ParticleManager {
    constructor(scene) {
        this.scene = scene;
        this.emitters = new Map();
        this.activeEffects = new Set();
    }

    /**
     * Create or get a reusable particle emitter
     */
    getEmitter(key, config) {
        if (!this.emitters.has(key)) {
            const emitter = this.scene.add.particles(0, 0, 'particle', config);
            emitter.stop();
            this.emitters.set(key, emitter);
        }
        return this.emitters.get(key);
    }

    /**
     * Create modern explosion effect with multiple layers
     * Based on 2024 game development best practices
     */
    createExplosion(x, y) {
        // Core explosion burst - bright center
        const coreExplosion = this.getEmitter('explosion-core', {
            x: x,
            y: y,
            speed: { min: 300, max: 600 },
            scale: { start: 1.2, end: 0.1 },
            alpha: { start: 1.0, end: 0 },
            blendMode: 'ADD',
            quantity: 80,
            lifespan: 400,
            // tint: [0xFFFFFF, 0xFFFF00, 0xFFCC00] // REMOVED - no tinting
        });

        // Secondary explosion ring - orange/red flames
        const flameRing = this.getEmitter('explosion-flames', {
            x: x,
            y: y,
            speed: { min: 400, max: 800 },
            scale: { start: 0.8, end: 0.2 },
            alpha: { start: 0.9, end: 0 },
            blendMode: 'ADD',
            quantity: 120,
            lifespan: 600,
            // tint: [0xFF8800, 0xFF4400, 0xFF0000] // REMOVED - no tinting
        });

        // Smoke/debris particles - darker, slower
        const smokeDebris = this.getEmitter('explosion-smoke', {
            x: x,
            y: y,
            speed: { min: 100, max: 400 },
            scale: { start: 0.6, end: 1.2 },
            alpha: { start: 0.7, end: 0 },
            blendMode: 'NORMAL',
            quantity: 60,
            lifespan: 1200,
            // tint: [0x666666, 0x444444, 0x222222] // REMOVED - no tinting
        });

        // Trigger all layers with slight delays for realism
        coreExplosion.setPosition(x, y);
        coreExplosion.explode(80);
        
        this.scene.time.delayedCall(50, () => {
            flameRing.setPosition(x, y);
            flameRing.explode(120);
        });
        
        this.scene.time.delayedCall(100, () => {
            smokeDebris.setPosition(x, y);
            smokeDebris.explode(60);
        });

        // Screen shake with modern easing
        this.scene.cameras.main.shake(800, 0.08, true);
        
        // Flash effect with proper falloff
        this.createExplosionFlash(x, y);
        
        // Auto cleanup all emitters
        this.scene.time.delayedCall(1500, () => {
            coreExplosion.stop();
            flameRing.stop();
            smokeDebris.stop();
        });
    }

    /**
     * Create explosion flash effect
     */
    createExplosionFlash(x, y) {
        // Create expanding shockwave ring
        const shockwave = this.scene.add.circle(x, y, 10, 0xFFFFFF, 0.8);
        shockwave.setDepth(999);
        shockwave.setStrokeStyle(4, 0xFFFF00, 1.0);
        
        this.scene.tweens.add({
            targets: shockwave,
            radius: 150,
            alpha: 0,
            strokeAlpha: 0,
            duration: 300,
            ease: 'Power2.easeOut',
            onComplete: () => shockwave.destroy()
        });

        // Brief screen flash
        const flash = this.scene.add.rectangle(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY,
            this.scene.cameras.main.width,
            this.scene.cameras.main.height,
            0xFFFFFF
        ).setAlpha(0.6).setDepth(1000);
        
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 150,
            ease: 'Power3.easeOut',
            onComplete: () => flash.destroy()
        });
    }

    /**
     * Create debris effect
     */
    createDebris(x, y) {
        const debrisEmitter = this.getEmitter('debris', {
            x: x,
            y: y,
            speed: { min: 300, max: 900 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.5, end: 0 },
            gravityY: 800,
            lifespan: 2000,
            quantity: 60,
            // tint: [0x333333, 0x666666, 0x999999] // REMOVED - no tinting
        });

        debrisEmitter.setPosition(x, y);
        debrisEmitter.explode(60);
        
        // Auto cleanup
        this.scene.time.delayedCall(2500, () => {
            debrisEmitter.stop();
        });
    }

    /**
     * Create smoke effect
     */
    createSmoke(x, y) {
        const smokeEmitter = this.getEmitter('smoke', {
            x: x,
            y: y,
            speed: { min: 50, max: 150 },
            angle: { min: -110, max: -70 },
            scale: { start: 0.4, end: 0.8 },
            alpha: { start: 0.9, end: 0 },
            lifespan: 5000,
            quantity: 30,
            frequency: 100,
            // tint: [0x222222, 0x444444] // REMOVED - no tinting
        });

        smokeEmitter.setPosition(x, y);
        smokeEmitter.start();
        
        // Stop after duration
        this.scene.time.delayedCall(1000, () => {
            smokeEmitter.stop();
        });
    }

    /**
     * Create collection sparkle effect
     */
    createSparkle(x, y, color = 0xFFD700) {
        const sparkleEmitter = this.getEmitter('sparkle', {
            x: x,
            y: y,
            speed: { min: 100, max: 200 },
            scale: { start: 0.6, end: 0 },
            blendMode: 'ADD',
            quantity: 10,
            lifespan: 400,
            // tint: color // REMOVED - no tinting
        });

        sparkleEmitter.setPosition(x, y);
        sparkleEmitter.explode(10);
    }

    /**
     * Create trail effect for power-ups
     */
    createTrail(target, color = 0xFFD700) {
        const key = `trail_${target.x}_${target.y}`;
        
        const trailEmitter = this.getEmitter(key, {
            follow: target,
            speed: { min: 50, max: 100 },
            scale: { start: 0.4, end: 0 },
            blendMode: 'ADD',
            quantity: 1,
            frequency: 50,
            lifespan: 300,
            // tint: color // REMOVED - no tinting
        });

        trailEmitter.startFollow(target);
        this.activeEffects.add(key);

        return {
            stop: () => {
                trailEmitter.stopFollow();
                trailEmitter.stop();
                this.activeEffects.delete(key);
            }
        };
    }

    /**
     * Clean up all particle systems
     */
    cleanup() {
        // Stop all active effects
        this.activeEffects.forEach(key => {
            const emitter = this.emitters.get(key);
            if (emitter) {
                emitter.stop();
            }
        });
        this.activeEffects.clear();

        // Destroy all emitters
        this.emitters.forEach(emitter => {
            if (emitter && emitter.scene) {
                emitter.destroy();
            }
        });
        this.emitters.clear();

        debugLogger.log('effects', 'Particle systems cleaned up');
    }

    /**
     * Clean up specific emitter
     */
    cleanupEmitter(key) {
        const emitter = this.emitters.get(key);
        if (emitter) {
            emitter.stop();
            emitter.destroy();
            this.emitters.delete(key);
            this.activeEffects.delete(key);
        }
    }

    /**
     * Update particle systems
     */
    update(delta) {
        // Check for inactive emitters and clean them up
        this.emitters.forEach((emitter, key) => {
            if (!emitter.active && !this.activeEffects.has(key)) {
                // Schedule for cleanup if not used recently
                if (!emitter._cleanupScheduled) {
                    emitter._cleanupScheduled = true;
                    this.scene.time.delayedCall(5000, () => {
                        if (!emitter.active) {
                            this.cleanupEmitter(key);
                        } else {
                            emitter._cleanupScheduled = false;
                        }
                    });
                }
            }
        });
    }
}
