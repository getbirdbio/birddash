// Phaser is loaded globally from CDN
import ObjectPool from './objectPool.js';
import debugLogger from './debugLogger.js';
import { COLLECTIBLES, GAME, POWER_UPS } from './constants.js';
import ElementSizing from './elementSizing.js';

export default class CollectibleManager {
    constructor(scene) {
        this.scene = scene;
        this.coffeeBeans = scene.physics.add.group();
        this.powerUps = scene.physics.add.group();
        this.lastBeanSpawnTime = 0;
        this.lastPowerUpSpawnTime = 0;
        this.beanSpawnInterval = 800;
        this.powerUpSpawnInterval = 8000;
        
        // Initialize standardized element sizing system
        this.elementSizing = new ElementSizing(scene);
        
        // Fixed collectible types with consistent reward calculations
        this.collectibleTypes = [
            // Take-away coffee cups (main points) - Reduced frequency, doubled points
            { type: 'small_coffee', points: 20, weight: 20, category: 'coffee', name: 'Small Coffee' },
            { type: 'medium_coffee', points: 40, weight: 15, category: 'coffee', name: 'Medium Coffee' },
            { type: 'large_coffee', points: 70, weight: 10, category: 'coffee', name: 'Large Coffee' },
            { type: 'specialty_coffee', points: 150, weight: 5, category: 'coffee', name: 'Specialty Coffee' },
            
            // Smoothies (health/energy effects) - No color tinting
            { type: 'berry_smoothie', points: 15, weight: 15, category: 'smoothie', name: 'Berry Smoothie', effect: 'health', effectValue: 1 },
            { type: 'green_smoothie', points: 15, weight: 10, category: 'smoothie', name: 'Green Smoothie', effect: 'speed', effectValue: 5000 }, // 5 seconds
            { type: 'tropical_smoothie', points: 25, weight: 5, category: 'smoothie', name: 'Tropical Smoothie', effect: 'health_speed', effectValue: 7000 }, // 7 seconds
            
            // Bagels (score multipliers) - No color tinting
            { type: 'plain_bagel', points: 30, weight: 8, category: 'bagel', name: 'Plain Bagel', effect: 'multiplier_short', effectValue: { multiplier: 2.0, duration: 8000 } },
            { type: 'everything_bagel', points: 50, weight: 5, category: 'bagel', name: 'Everything Bagel', effect: 'multiplier_medium', effectValue: { multiplier: 2.5, duration: 12000 } },
            { type: 'blueberry_bagel', points: 75, weight: 2, category: 'bagel', name: 'Blueberry Bagel', effect: 'multiplier_long', effectValue: { multiplier: 3.0, duration: 15000 } },
            
            // Birds (companions) - DISABLED to remove bird companions from spawning
            // { type: 'sparrow_friend', points: 40, weight: 1, category: 'bird', tint: 0x8B4513, name: 'Sparrow Friend', effect: 'companion_basic', effectValue: { radius: 80, duration: 15000, speed: 1.0 } },
            // { type: 'robin_friend', points: 60, weight: 0.5, category: 'bird', tint: 0xFF4500, name: 'Robin Friend', effect: 'companion_fast', effectValue: { radius: 100, duration: 20000, speed: 1.3 } },
            // { type: 'cardinal_friend', points: 100, weight: 0.2, category: 'bird', tint: 0xDC143C, name: 'Cardinal Friend', effect: 'companion_super', effectValue: { radius: 120, duration: 25000, speed: 1.5 } }
        ];
        
        // Create object pools
        this.beanPool = new ObjectPool(
            scene,
            () => scene.physics.add.sprite(0, 0, 'coffeeBean'),
            (bean) => {
                bean.clearTint();
                bean.setScale(1);
                bean.setAlpha(1);
                bean.removeAllListeners();
                bean.body.reset(0, 0);
            },
            30
        );
        
        this.powerUpPool = new ObjectPool(
            scene,
            () => scene.physics.add.sprite(0, 0, 'coffeeBean'),
            (powerUp) => {
                powerUp.clearTint();
                powerUp.setScale(1);
                powerUp.setAlpha(1);
                powerUp.removeAllListeners();
                powerUp.body.reset(0, 0);
            },
            10
        );
        
        // Setup collisions - with safety check for player
        if (scene.player && scene.player.sprite) {
            scene.physics.add.overlap(scene.player.sprite, this.coffeeBeans, this.collectBean, null, this);
            scene.physics.add.overlap(scene.player.sprite, this.powerUps, this.collectPowerUp, null, this);
        } else {
            // If player isn't ready yet, set up collisions later
            scene.time.delayedCall(200, () => {
                if (scene.player && scene.player.sprite) {
                    scene.physics.add.overlap(scene.player.sprite, this.coffeeBeans, this.collectBean, null, this);
                    scene.physics.add.overlap(scene.player.sprite, this.powerUps, this.collectPowerUp, null, this);
                }
            });
        }
    }

    update(time, delta) {
        // Get difficulty multipliers for responsive spawn rates
        const difficulty = this.scene.getDifficultyMultipliers();
        
        // Calculate responsive spawn intervals
        const responsiveBeanInterval = this.beanSpawnInterval * difficulty.spawnRate;
        const responsivePowerUpInterval = this.powerUpSpawnInterval * Math.max(0.7, difficulty.spawnRate);
        
        // Spawn coffee beans
        if (time - this.lastBeanSpawnTime > responsiveBeanInterval) {
            this.spawnCoffeeBean();
            this.lastBeanSpawnTime = time;
        }
        // Spawn power-ups
        if (time - this.lastPowerUpSpawnTime > responsivePowerUpInterval) {
            this.spawnPowerUp();
            this.lastPowerUpSpawnTime = time;
        }

        // Move and clean up collectibles
        this.moveAndCleanup(this.coffeeBeans, delta);
        this.moveAndCleanup(this.powerUps, delta);
    }

    moveAndCleanup(group, delta) {
        // Get responsive speed multiplier based on screen size
        const screenSpeedMultiplier = Math.max(0.8, this.scene.minScale);
        
        group.children.entries.forEach(item => {
            if (!item || !item.active) return;
            
            // Smooth movement with reasonable speed
            const baseSpeed = item.getData('baseSpeed') || 1.0;
            const normalizedDelta = delta / 16.67; // Normalize to 60fps baseline
            const moveSpeed = (this.scene.gameSpeed * 0.02) * baseSpeed * screenSpeedMultiplier * normalizedDelta;
            
            // Apply smooth movement
            item.x -= moveSpeed;
            
            // Responsive cleanup threshold
            const cleanupThreshold = -item.displayWidth;
            if (item.x < cleanupThreshold) {
                if (group === this.coffeeBeans) {
                    this.beanPool.release(item);
                } else if (group === this.powerUps) {
                    this.powerUpPool.release(item);
                }
                group.remove(item);
            }
        });
    }

    spawnCoffeeBean() {
        // Get responsive screen dimensions
        const screenWidth = this.scene.screenWidth;
        const screenHeight = this.scene.screenHeight;
        const minScale = this.scene.minScale;
        
        // Calculate responsive spawn position
        const spawnX = screenWidth + Phaser.Math.Between(20, 80);
        const spawnYMin = screenHeight * 0.25; // Sky level
        const spawnYMax = screenHeight * 0.75; // Ground level
        const spawnY = Phaser.Math.Between(spawnYMin, spawnYMax);
        
        // Select a random collectible type based on weighted probability
        const collectibleType = this.getRandomCollectibleType();
        
        // Debug log
        debugLogger.spawn(`SPAWNING: ${collectibleType.name} at (${spawnX.toFixed(0)}, ${spawnY.toFixed(0)})`);
        
        const item = this.beanPool.get();
        item.setPosition(spawnX, spawnY);
        
        // Set appropriate texture based on category
        if (collectibleType.category === 'smoothie') {
            item.setTexture('smoothie');
        } else if (collectibleType.category === 'bagel') {
            item.setTexture('bagel');
        } else if (collectibleType.category === 'bird') {
            // Birds use specific companion textures
            if (collectibleType.type === 'sparrow_friend') {
                item.setTexture('sparrowCompanion');
            } else if (collectibleType.type === 'robin_friend') {
                item.setTexture('robinCompanion');
            } else if (collectibleType.type === 'cardinal_friend') {
                item.setTexture('cardinalCompanion');
            }
            item.clearTint(); // Birds don't need tinting
        } else {
            // Coffee items use the coffee bean texture
            item.setTexture('coffeeBean');
        }
        
        // Apply collectible properties - TINTING DISABLED
        // Keep original colors, no tinting applied
        // if (collectibleType.category !== 'bird') {
        //     item.setTint(collectibleType.tint);
        // }
        item.setData('collectibleType', collectibleType);
        item.setData('category', collectibleType.category);
        item.setData('points', collectibleType.points);
        item.setData('effect', collectibleType.effect);
        item.setData('effectValue', collectibleType.effectValue);
        item.setData('name', collectibleType.name);
        
        // Use standardized element sizing system
        let elementType = 'collectible'; // Default to collectible size
        
        // Determine element type for sizing
        if (collectibleType.category === 'bird') {
            elementType = 'companion'; // Bird companions are smaller
        } else if (collectibleType.category === 'coffee') {
            // Different sizes for different coffee types
            elementType = collectibleType.type; // Use the specific coffee type (small_coffee, medium_coffee, etc.)
        } else {
            elementType = 'collectible'; // Smoothies, bagels standard size
        }
        
        // Set to standardized size
        const appliedScale = this.elementSizing.setSpriteToStandardSize(item, elementType);
        
        debugLogger.log(`Collectible ${collectibleType.name} scaled to: ${appliedScale.toFixed(3)}`);
        // Disable physics body to prevent conflicts with manual movement
        if (item.body) {
            item.body.setEnable(false);
        }
        
        // Store movement data for responsive speed
        item.setData('baseSpeed', 1.0);
        item.setData('spawnY', spawnY); // Store original spawn Y for floating reference
        
        // Gentle floating animation - reduced amplitude for smoother movement
        this.scene.tweens.add({
            targets: item,
            y: spawnY - 5, // Much smaller vertical movement
            duration: 4000, // Slower movement
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        this.coffeeBeans.add(item);
    }
    
    getRandomCollectibleType() {
        // Calculate total weight
        const totalWeight = this.collectibleTypes.reduce((sum, type) => sum + type.weight, 0);
        let random = Math.random() * totalWeight;
        
        // Find the selected type
        for (const type of this.collectibleTypes) {
            random -= type.weight;
            if (random <= 0) {
                return type;
            }
        }
        
        // Fallback to first type
        return this.collectibleTypes[0];
    }

    spawnPowerUp() {
        // Get responsive screen dimensions
        const screenWidth = this.scene.screenWidth;
        const screenHeight = this.scene.screenHeight;
        const minScale = this.scene.minScale;
        
        // Calculate responsive spawn position - power-ups in middle area
        const spawnX = screenWidth + Phaser.Math.Between(30, 100);
        const spawnYMin = screenHeight * 0.35; // Upper middle
        const spawnYMax = screenHeight * 0.65; // Lower middle
        const spawnY = Phaser.Math.Between(spawnYMin, spawnYMax);
        
        // Fixed power-up types with correct weights
        const powerUpTypes = [
            { type: 'croissantShieldPowerUp', weight: 22, points: 50 },
            { type: 'espressoShot', weight: 22, points: 50 }, 
            { type: 'websterPowerUp', weight: 16, points: 75 }, 
            { type: 'thaboPowerUp', weight: 16, points: 75 },
            { type: 'magnetPowerUp', weight: 12, points: 100 },
            { type: 'healthPowerUp', weight: 12, points: 100 },
            { type: 'baristaNPC', weight: 5, points: 150 } // Rarest
        ];
        
        // Weighted selection
        const totalWeight = powerUpTypes.reduce((sum, type) => sum + type.weight, 0);
        let random = Math.random() * totalWeight;
        let selectedType = powerUpTypes[0];
        
        for (const type of powerUpTypes) {
            random -= type.weight;
            if (random <= 0) {
                selectedType = type;
                break;
            }
        }
        
        const powerUp = this.powerUpPool.get();
        
        // Special handling for barista to ensure correct texture
        if (selectedType.type === 'baristaNPC') {
            console.log('🧑‍🍳 Spawning barista NPC with texture:', selectedType.type);
            console.log('🧑‍🍳 Texture exists in cache:', this.scene.textures.exists('baristaNPC'));
        }
        
        powerUp.setTexture(selectedType.type);
        powerUp.setPosition(spawnX, spawnY);
        powerUp.setData('type', selectedType.type);
        powerUp.setData('points', selectedType.points);
        
        // Use standardized element sizing system for power-ups
        const appliedScale = this.elementSizing.setSpriteToStandardSize(powerUp, 'powerup');
        
        debugLogger.log(`Power-up ${selectedType.type} scaled to: ${appliedScale.toFixed(3)}`);
        
        // Disable physics body to prevent conflicts with manual movement
        if (powerUp.body) {
            powerUp.body.setEnable(false);
        }
        
        // Store movement data for responsive speed
        powerUp.setData('baseSpeed', 0.9); // Slightly slower than beans
        
        // Gentle floating movement - reduced amplitude for power-ups
        this.scene.tweens.add({
            targets: powerUp,
            y: spawnY - 8, // Small vertical movement
            duration: 3500, // Slower movement
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Glowing effect DISABLED - keep consistent appearance
        // this.scene.tweens.add({
        //     targets: powerUp,
        //     alpha: 0.7,
        //     duration: 600,
        //     yoyo: true,
        //     repeat: -1,
        //     ease: 'Sine.easeInOut'
        // });
        
        this.powerUps.add(powerUp);
    }

    collectBean(playerSprite, bean) {
        try {
            // Debug logging
            debugLogger.collision('=== COLLECTING BEAN ===');
            debugLogger.collision('Bean type:', bean.getData('collectibleType'));
            debugLogger.collision('Category:', bean.getData('category'));
            debugLogger.collision('Effect:', bean.getData('effect'));
            debugLogger.collision('Name:', bean.getData('name'));
            
            // Cache position early in case the sprite is recycled
            const bx = bean.x;
            const by = bean.y;
            
            // Get collectible data
            const collectibleType = bean.getData('collectibleType');
            const category = bean.getData('category');
            const points = bean.getData('points');
            const effect = bean.getData('effect');
            const effectValue = bean.getData('effectValue');
            const name = bean.getData('name');
            
            // Emit particles
            if (this.scene.beanParticles) {
                this.scene.beanParticles.emitParticleAt(bx, by, 8);
            }
            
            // Clear any collection flags
            bean.setData('beingCollected', false);
            
            // Add score based on item type - FIXED: Use correct combo system
            if (this.scene.addScore) {
                this.scene.addScore(points, true); // true = comboable
            }
            
            // Apply special effects based on category with proper error handling
            try {
                if (effect || category !== 'coffee') {
                    // Only log when debugging is enabled
                    if (this.scene.debugMode) {
                        debugLogger.effect('Applying effect:', effect, 'with value:', effectValue);
                    }
                    this.applyCollectibleEffect(category, effect, effectValue, points, name);
                } else {
                    // For coffee items without effects, no need for special handling
                    // Points will be shown by showCollectionFeedback below
                }
            } catch (e) {
                debugLogger.warn('Effect application error:', e.message);
            }
            
            // Play appropriate sound
            this.playCollectionSound(category);
            
            // Show feedback text - no color tinting
            this.showCollectionFeedback(bx, by, name, points, 0xFFFFFF);
            
            // Release back to pool last
            this.coffeeBeans.remove(bean);
            this.beanPool.release(bean);
            
            // Update achievements based on item category
            switch (category) {
                case 'coffee':
                    this.scene.incrementAchievement('collect_coffee', 1);
                    break;
                case 'smoothie':
                    this.scene.incrementAchievement('collect_smoothie', 1);
                    break;
                case 'bird':
                    this.scene.incrementAchievement('bird_companions', 1);
                    break;
            }
        } catch (err) {
            debugLogger.error('Collect bean error:', err);
            // Defensive: ensure bean is removed to avoid repeated collisions
            try {
                this.coffeeBeans.remove(bean);
                this.beanPool.release(bean);
            } catch (_) {}
        }
    }
    
    // FIXED: Consistent effect application with proper values
    applyCollectibleEffect(category, effect, effectValue, points, name) {
        const player = this.scene.player;
        const playerSprite = player ? player.sprite : null;
        
        if (!playerSprite) {
            debugLogger.warn('Player not available for effect application');
            return;
        }
        
        // Coffee items don't have effects, so just return without warning
        if (!effect) {
            return;
        }
        
        switch (effect) {
            case 'health':
                const healthAmount = effectValue || 1;
                this.scene.healPlayer(healthAmount);
                // Removed duplicate floating score
                break;
                
            case 'speed':
                const speedDuration = effectValue || 5000;
                this.scene.activateSpeedBoost(speedDuration);
                // Removed duplicate floating score
                break;
                
            case 'health_speed':
                const comboHealthAmount = 1;
                const comboDuration = effectValue || 7000;
                this.scene.healPlayer(comboHealthAmount);
                this.scene.activateSpeedBoost(comboDuration);
                // Removed duplicate floating score
                break;
                
            case 'multiplier_short':
            case 'multiplier_medium':
            case 'multiplier_long':
                if (effectValue && typeof effectValue === 'object') {
                    const multiplier = effectValue.multiplier || 2.0;
                    const duration = effectValue.duration || 8000;
                    this.scene.activateScoreMultiplier(multiplier, duration);
                    // Removed duplicate floating score
                } else {
                    debugLogger.warn('Invalid multiplier effect value:', effectValue);
                }
                break;
                
            case 'companion_basic':
            case 'companion_fast':
            case 'companion_super':
                if (effectValue && typeof effectValue === 'object') {
                    const companionType = effect.split('_')[1]; // basic/fast/super
                    const birdType = companionType === 'basic' ? 'sparrow' : 
                                   companionType === 'fast' ? 'robin' : 'cardinal';
                    const duration = effectValue.duration || 15000;
                    
                    this.scene.activateBirdCompanion(birdType, duration);
                    // Removed duplicate floating score
                } else {
                    debugLogger.warn('Invalid companion effect value:', effectValue);
                }
                break;
                
            default:
                debugLogger.warn('Unknown effect:', effect);
                break;
        }
    }
    
    playCollectionSound(category) {
        switch (category) {
            case 'coffee':
                this.scene.soundManager.playBeanCollect();
                break;
            case 'smoothie':
            case 'bagel':
            case 'bird':
                this.scene.soundManager.playPowerUp(); // Use power-up sound for special items
                break;
            default:
                this.scene.soundManager.playBeanCollect();
        }
    }
    
    showCollectionFeedback(x, y, name, points, tint) {
        // Trigger collection particle effect with proper tinting
        if (this.scene.collectParticles) {
            // Create a temporary particle emitter with the correct tint
            const tempParticles = this.scene.add.particles(x, y, 'coffeeBean', {
                scale: { start: 0.05, end: 0 },
                speed: { min: 50, max: 150 },
                lifespan: 600,
                quantity: 3,
                frequency: -1,
                emitting: false,
                // tint: tint // DISABLED - no particle color tinting
            });
            
            // Emit particles and then destroy the emitter
            tempParticles.emitParticleAt(x, y);
            this.scene.time.delayedCall(100, () => {
                tempParticles.destroy();
            });
        }
        
        // Add steam effect for coffee items
        if (name.toLowerCase().includes('coffee') && this.scene.steamParticles) {
            this.scene.steamParticles.setPosition(x, y - 10);
            this.scene.steamParticles.start();
            this.scene.time.delayedCall(800, () => {
                this.scene.steamParticles.stop();
            });
        }
        
        // Add sparkle effect for rare items (specialty coffee, rare bagels, birds)
        if ((points >= 75 || name.includes('Specialty') || name.includes('Friend')) && this.scene.sparkleParticles) {
            this.scene.sparkleParticles.setPosition(x, y);
            this.scene.sparkleParticles.start();
            this.scene.time.delayedCall(1200, () => {
                this.scene.sparkleParticles.stop();
            });
        }
        
        // Calculate safer margins based on screen size
        const screenWidth = this.scene.screenWidth;
        const screenHeight = this.scene.screenHeight;
        const safeMarginX = screenWidth * 0.15; // Increased margin
        const safeMarginY = screenHeight * 0.15; // Increased margin
        
        // Ensure position stays within screen bounds with larger buffer
        const clampedX = Phaser.Math.Clamp(x, safeMarginX, screenWidth - safeMarginX);
        const clampedY = Phaser.Math.Clamp(y, safeMarginY + 80, screenHeight - safeMarginY - 80);
        
        // We'll show points adjacent to item name, not as separate text

        
        // Show clean floating text for all items (30% larger)
        const pointsText = this.scene.add.text(clampedX, clampedY - 40, `+${points}`, {
            fontSize: Math.max(21, Math.floor(23 * (this.scene.minScale || 1))) + 'px',
            fill: '#FFD700',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 2,
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#000000',
                blur: 2,
                fill: true
            }
        }).setOrigin(0.5).setDepth(1500);
        
        // Clean upward animation
        this.scene.tweens.add({
            targets: pointsText,
            y: pointsText.y - 50,
            alpha: 0,
            scale: { from: 1, to: 1.2 },
            duration: 1000,
            ease: 'Power2.easeOut',
            onComplete: () => pointsText.destroy()
        });
        
        // For high-value items, also show name
        if (points >= 50) {
            // Ensure text is maximum 2 lines
            const formattedText = this.formatTextToTwoLines(name.toUpperCase());
            
            const feedbackText = this.scene.add.text(clampedX, clampedY - 70, formattedText, {
                fontSize: Math.max(13, Math.floor(16 * (this.scene.minScale || 1))) + 'px',
                fill: '#ffffff',
                fontWeight: 'bold',
                stroke: '#000000',
                strokeThickness: 1,
                alpha: 0.8,
                align: 'center'
            }).setOrigin(0.5).setDepth(800);
            
            // Adjust position if text is multi-line
            if (formattedText.includes('\n')) {
                feedbackText.y -= 10;
            }
            
            // Add glow effect to make text stand out more
            try {
                const glowFx = feedbackText.preFX.addGlow(0xFFFFFF, 3, 0, false, 0.1, 12);
            } catch (e) {
                // Glow effect failed, continue without it
                console.warn('Glow effect not available:', e.message);
            }
            
            // Calculate the scale
            let baseScale = 0.8;
            
            // Ensure text doesn't exceed safe screen width
            if (feedbackText.width > screenWidth * 0.5) {
                const scaleFactor = (screenWidth * 0.5) / feedbackText.width;
                baseScale = Math.min(scaleFactor * 0.8, 0.8);
            }
            
            // Final position check after scaling
            const textHalfWidth = (feedbackText.width * baseScale) / 2;
            if (feedbackText.x - textHalfWidth < safeMarginX) {
                feedbackText.x = safeMarginX + textHalfWidth;
            } else if (feedbackText.x + textHalfWidth > screenWidth - safeMarginX) {
                feedbackText.x = screenWidth - safeMarginX - textHalfWidth;
            }
            
            // Apply the reduced scale
            feedbackText.setScale(baseScale);
            
            // Simple animation for name text
            this.scene.tweens.add({
                targets: feedbackText,
                y: feedbackText.y - 20,
                alpha: { from: 0.8, to: 0 },
                duration: 800,
                ease: 'Power2.easeOut',
                onComplete: () => {
                    if (feedbackText && feedbackText.scene) {
                        feedbackText.destroy();
                    }
                }
            });
        }
    }

    collectPowerUp(playerSprite, powerUp) {
        const type = powerUp.getData('type');
        const points = powerUp.getData('points') || 50; // Default points for power-ups
        let feedbackText = '';
        let feedbackColor = '#FFFFFF';
        
        // FIXED: Consistent power-up effects with proper durations and values
        switch (type) {
            case 'croissantShieldPowerUp':
                this.scene.activateShield(3000); // 3 seconds
                feedbackText = 'SHIELD\n3s!';
                feedbackColor = '#FFD700';
                break;
            case 'espressoShot':
                try {
                    console.log('⚡ Activating speed boost for 4 seconds');
                    this.scene.activateSpeedBoost(4000); // 4 seconds
                    feedbackText = 'SPEED\n4s!';
                    feedbackColor = '#FF6347';
                    console.log('⚡ Speed boost activated successfully');
                } catch (error) {
                    console.error('❌ Error activating speed boost:', error);
                    feedbackText = 'ERROR!';
                    feedbackColor = '#FF0000';
                }
                break;
            case 'websterPowerUp':
                this.scene.activateScoreMultiplier(2.0, 5000); // 2x for 5 seconds
                feedbackText = '2X SCORE\n5s!';
                feedbackColor = '#00FF00';
                break;
            case 'thaboPowerUp':
                this.scene.activateTimeSlow(6000); // 6 seconds
                feedbackText = 'TIME SLOW\n6s!';
                feedbackColor = '#9966FF';
                break;
            case 'magnetPowerUp':
                this.scene.activateMagnet(5000); // 5 seconds
                feedbackText = ''; // No text feedback for magnet
                feedbackColor = '#FF1493';
                break;
            case 'healthPowerUp':
                this.scene.healPlayer(1);
                feedbackText = '+1 HP';
                feedbackColor = '#FF69B4';
                break;
            case 'baristaNPC':
                // Special barista bonus - multiple effects
                this.scene.healPlayer(1);
                this.scene.activateScoreMultiplier(3.0, 10000); // 3x for 10 seconds
                feedbackText = 'BARISTA\nBONUS!';
                feedbackColor = '#8B4513';
                break;
        }
        
        // Release back to pool
        this.powerUps.remove(powerUp);
        this.powerUpPool.release(powerUp);
        
        // Add points with combo system
        this.scene.addScore(points, true); // Power-ups are comboable
        
        // Play power-up collection sound
        this.scene.soundManager.playPowerUpCollect();
        
        // Add small hit stop for impact
        this.scene.triggerHitStop(40);
        
        // Visual feedback with improved responsive positioning and scaling
        const screenWidth = this.scene.screenWidth;
        const screenHeight = this.scene.screenHeight;
        const minScale = this.scene.minScale;
        
        // Calculate safer margins based on screen size
        const safeMarginX = screenWidth * 0.2; // Even larger margins for power-ups
        const safeMarginY = screenHeight * 0.2;
        
        // Calculate responsive positioning - ensure text stays well within screen bounds
        let feedbackX = Phaser.Math.Clamp(
            powerUp.x,
            safeMarginX,
            screenWidth - safeMarginX
        );
        let feedbackY = Phaser.Math.Clamp(
            powerUp.y,
            safeMarginY + 60,
            screenHeight - safeMarginY - 60
        );
        
        // Ensure power-up text is also formatted to max 2 lines
        const formattedPowerText = this.formatTextToTwoLines(feedbackText);
        
        // Create power-up text with standardized styling
        const powerStyle = {
            ...this.scene.getStandardTextStyle('feedback', 'medium'),
            fill: feedbackColor // Override color for power-up specific color
        };
        const powerText = this.scene.add.text(feedbackX, feedbackY, formattedPowerText, powerStyle).setOrigin(0.5).setDepth(1600);
        
        // Add pulsing glow effect for power-ups
        const glowColor = parseInt(feedbackColor.replace('#', '0x'), 16) || 0xFFFFFF;
        const glowFx = powerText.preFX.addGlow(glowColor, 6, 0, false, 0.2, 16);
        
        // Add animation for the glow to pulse
        this.scene.tweens.add({
            targets: glowFx,
            outerStrength: 4,
            yoyo: true,
            repeat: -1,
            duration: 600
        });
        
        // Better scaling with position checking
        let powerScale = 0.9; // Start smaller for better control
        
        // Check if text would overflow and adjust scale accordingly
        if (powerText.width * powerScale > screenWidth * 0.6) {
            powerScale = (screenWidth * 0.6) / powerText.width;
        }
        
        // Final position adjustment after scaling
        const textWidth = powerText.width * powerScale;
        const textHeight = powerText.height * powerScale;
        const halfTextWidth = textWidth / 2;
        const halfTextHeight = textHeight / 2;
        
        // Adjust position if text would go outside screen bounds
        if (feedbackX - halfTextWidth < safeMarginX) {
            feedbackX = safeMarginX + halfTextWidth;
        } else if (feedbackX + halfTextWidth > screenWidth - safeMarginX) {
            feedbackX = screenWidth - safeMarginX - halfTextWidth;
        }
        
        if (feedbackY - halfTextHeight < safeMarginY) {
            feedbackY = safeMarginY + halfTextHeight;
        } else if (feedbackY + halfTextHeight > screenHeight - safeMarginY) {
            feedbackY = screenHeight - safeMarginY - halfTextHeight;
        }
        
        // Update text position and scale
        powerText.setPosition(feedbackX, feedbackY);
        powerText.setScale(powerScale);
        
        // Calculate animation distance proportional to screen height
        const animationDistance = Math.min(70, screenHeight * 0.09);
        
        // Initial attention-grabbing bounce
        this.scene.tweens.add({
            targets: powerText,
            scale: powerText.scale * 1.2,
            duration: 250,
            yoyo: true,
            repeat: 1,
            ease: 'Back.easeOut',
            onComplete: () => {
                // Much longer duration for power-ups
                const duration = Math.min(2000, screenHeight * 2);
                
                // Main animation with much slower fade for better visibility
                this.scene.tweens.add({
                    targets: powerText,
                    y: feedbackY - animationDistance,
                    alpha: { from: 1, to: 0, duration: duration * 0.7, delay: duration * 0.3 }, // Delay the fade
                    scale: { from: powerText.scale, to: powerText.scale * 0.9 },
                    duration: duration,
                    ease: 'Sine.easeOut',
                    onComplete: () => powerText.destroy()
                });
            }
        });
    }

    // Utility function to format text to maximum 2 lines
    formatTextToTwoLines(text) {
        const words = text.split(' ');
        
        // If single word, return as-is
        if (words.length === 1) {
            return text;
        }
        
        // If exactly 2 words, check if they're short enough to stay on one line
        if (words.length === 2) {
            // If combined length is reasonable, keep on one line, otherwise split
            const combinedLength = words.join(' ').length;
            return combinedLength <= 12 ? text : words.join('\n');
        }
        
        // For 3+ words, always split to prevent overflow
        if (words.length === 3) {
            // For 3 words, put first word on line 1, rest on line 2
            return `${words[0]}\n${words.slice(1).join(' ')}`;
        }
        
        // For 4+ words, split in half but ensure no line is too long
        const midPoint = Math.ceil(words.length / 2);
        let line1 = words.slice(0, midPoint).join(' ');
        let line2 = words.slice(midPoint).join(' ');
        
        // If either line is too long, try different split
        if (line1.length > 12 || line2.length > 12) {
            // Try splitting after first word
            line1 = words[0];
            line2 = words.slice(1).join(' ');
            
            // If second line is still too long, truncate
            if (line2.length > 12) {
                line2 = line2.substring(0, 12) + '...';
            }
        }
        
        return `${line1}\n${line2}`;
    }
}