// Phaser is loaded globally from CDN

export default class ObstacleManager {
    constructor(scene) {
        this.scene = scene;
        this.obstacles = scene.physics.add.group();
        this.lastSpawnTime = 0;
        this.spawnInterval = 2000; // 2 seconds initially
        
        // Setup collision - with safety check for player
        if (scene.player && scene.player.sprite) {
            scene.physics.add.overlap(scene.player.sprite, this.obstacles, this.hitObstacle, null, scene);
        } else {
            // If player isn't ready yet, set up collisions later
            scene.time.delayedCall(200, () => {
                if (scene.player && scene.player.sprite) {
                    scene.physics.add.overlap(scene.player.sprite, this.obstacles, this.hitObstacle, null, scene);
                }
            });
        }
    }
    update(time, delta) {
        // Get current difficulty multipliers
        const difficulty = this.scene.getDifficultyMultipliers();
        
        // Calculate dynamic spawn interval based on difficulty
        const baseDynamicInterval = 2000 * difficulty.spawnRate;
        const currentInterval = Math.max(800, baseDynamicInterval);
        
        // Spawn obstacles (but not during time freeze)
        if (!this.scene.timeFreezeActive && time - this.lastSpawnTime > currentInterval) {
            this.spawnObstacle();
            this.lastSpawnTime = time;
        }

        // Move and clean up obstacles
        this.obstacles.children.entries.forEach(obstacle => {
            // Get obstacle-specific speed multiplier
            const speedMultiplier = obstacle.getData('speedMultiplier') || 1.0;
            
            // Smooth horizontal movement with reasonable speed
            const normalizedDelta = delta / 16.67; // Normalize to 60fps baseline
            obstacle.x -= (this.scene.gameSpeed * 0.02) * speedMultiplier * normalizedDelta;
            
            // Update glow effect position for bomb obstacles
            if (obstacle.getData('type') === 'bombObstacle') {
                const glowEffect = obstacle.getData('glowEffect');
                if (glowEffect && glowEffect.scene) {
                    glowEffect.x = obstacle.x;
                    glowEffect.y = obstacle.y;
                }
            }
            
            // Add varied movement patterns with difficulty scaling
            const movePattern = obstacle.getData('movePattern');
            const startY = obstacle.getData('startY');
            const startX = obstacle.getData('startX') || obstacle.x;
            const obstacleType = obstacle.getData('type');
            const difficulty = this.scene.getDifficultyMultipliers();
            let time = obstacle.getData('time') + delta;
            obstacle.setData('time', time);
            
            // Scale movement intensity based on difficulty
            const complexityMultiplier = 1 + difficulty.movementComplexity;
            
            switch(movePattern) {
                case 0: // Static vertical position
                    break;
                    
                case 1: // Gentle floating up and down
                    obstacle.y = startY + Math.sin(time * 0.001) * 20;
                    break;
                    
                case 2: // Larger wave movement
                    obstacle.y = startY + Math.sin(time * 0.0008) * 35;
                    break;
                    
                default:
                    // For patterns 3+, use simple floating to prevent issues
                    obstacle.y = startY + Math.sin(time * 0.0012) * 25;
                    break;
            }
            
            // Responsive cleanup - remove when off-screen left (fail-safe remove)
            const cleanupThreshold = -Math.max(50, obstacle.displayWidth || 100);
            if (obstacle.x < cleanupThreshold || !obstacle.active || !obstacle.scene) {
                // Clean up any associated effects
                if (obstacle.getData('type') === 'bombObstacle') {
                    const glowEffect = obstacle.getData('glowEffect');
                    if (glowEffect && glowEffect.scene) {
                        glowEffect.destroy();
                    }
                }
                try { obstacle.destroy(); } catch (_) {}
            }
        });
    }
    spawnObstacle() {
        const difficulty = this.scene.getDifficultyMultipliers();
        
        // Get responsive screen dimensions
        const screenWidth = this.scene.screenWidth;
        const screenHeight = this.scene.screenHeight;
        const minScale = this.scene.minScale;
        
        // Calculate responsive spawn heights based on screen dimensions
        // Allow obstacles to spawn across the full vertical range with safe margins
        const safeMarginTop = Math.max(60, screenHeight * 0.08);
        const safeMarginBottom = Math.max(60, screenHeight * 0.08);
        const fullRangeTop = safeMarginTop;
        const fullRangeBottom = screenHeight - safeMarginBottom;
        
        // Keep original levels for reference, but expand ranges
        const groundLevel = screenHeight * 0.85;
        const midLevel = screenHeight * 0.6;
        const skyLevel = screenHeight * 0.3;
        const lowSkyLevel = screenHeight * 0.45;
        
        // Define obstacle types with mobile-responsive scaling
        // Obstacles should be 12-18% of screen height for good visibility
        const obstacleTypes = [
            {
                name: 'spilledCup',
                texture: 'brokenCoffeeMachine', // Road furniture - can travel full vertical range
                scale: { min: 0.15 * minScale, max: 0.225 * minScale },
                spawnHeight: { min: fullRangeTop, max: fullRangeBottom },
                movePattern: { min: 0, max: 2 },
                // tint: 0xFFFFFF, // REMOVED - no tinting
                speed: 1.0,
                weight: 0.4 // Common obstacle
            },
            {
                name: 'floatingCup',
                texture: 'spilledCoffeeCup',
                scale: { min: 0.1375 * minScale, max: 0.2125 * minScale },
                spawnHeight: { min: fullRangeTop, max: fullRangeBottom },
                movePattern: { min: 1, max: 2 },
                // tint: 0xFFAAAA, // REMOVED - no tinting
                speed: 0.8,
                weight: 0.3 // Medium difficulty
            },
            {
                name: 'heavyCup',
                texture: 'spilledCoffeeCup',
                scale: { min: 0.1625 * minScale, max: 0.2375 * minScale },
                spawnHeight: { min: fullRangeTop, max: fullRangeBottom },
                movePattern: 0,
                // tint: 0x8B4513, // REMOVED - no tinting
                speed: 1.2,
                weight: 0.2 // Harder obstacle
            },
            {
                name: 'fastBean',
                texture: 'coffeeBean',
                scale: { min: 0.1625 * minScale, max: 0.2375 * minScale },
                spawnHeight: { min: fullRangeTop, max: fullRangeBottom },
                movePattern: { min: 1, max: 2 },
                // tint: 0x654321, // REMOVED - no tinting
                speed: 1.5,
                weight: 0.1 // Rarest, hardest obstacle
            },
            {
                name: 'brokenMachine',
                texture: 'brokenCoffeeMachine', // Road furniture - can travel full vertical range
                scale: { min: 0.175 * minScale, max: 0.25 * minScale },
                spawnHeight: { min: fullRangeTop, max: fullRangeBottom },
                movePattern: 0, // Static
                // tint: 0xFFFFFF, // REMOVED - no tinting
                speed: 0.8,
                weight: 0.12 // Medium rarity
            },
            {
                name: 'angryCustomer',
                texture: 'angryCustomer', // Road furniture - can travel full vertical range
                scale: { min: 0.13 * minScale, max: 0.19 * minScale },
                spawnHeight: { min: fullRangeTop, max: fullRangeBottom },
                movePattern: 1, // Slight floating
                // tint: 0xFFFFFF, // REMOVED - no tinting
                speed: 0.9,
                weight: 0.10 // Uncommon
            },
            {
                name: 'wifiDeadZone',
                texture: 'wiFiDeadZone', // Road furniture - can travel full vertical range
                scale: { min: 0.225 * minScale, max: 0.3125 * minScale },
                spawnHeight: { min: fullRangeTop, max: fullRangeBottom },
                movePattern: 2, // Floating patterns
                // tint: 0xFFCCCC, // REMOVED - no tinting
                speed: 0.7,
                weight: 0.08 // Rare challenging obstacle
            },
            {
                name: 'bombObstacle',
                texture: 'bombObstacleNew', // Road furniture - can travel full vertical range
                scale: { min: 0.30 * minScale, max: 0.38 * minScale }, // Even bigger bomb for maximum visual impact
                spawnHeight: { min: fullRangeTop, max: fullRangeBottom }, // Can spawn anywhere vertically
                movePattern: 0, // Static - no jitter/hop movement
                // tint: 0xFFFFFF, // REMOVED - no tinting // No tint needed
                speed: 0.80, // Slower so it's more noticeable
                weight: 0.30 // Much more common - significantly increased from 0.09 to 0.30
            }
        ];
        
        // Adjust weights based on difficulty
        const adjustedTypes = obstacleTypes.map(type => ({
            ...type,
            adjustedWeight: type.weight * (
                type.name === 'spilledCup' ? (1 - difficulty.rareObstacleChance * 0.5) :
                type.name === 'floatingCup' ? (1 - difficulty.rareObstacleChance * 0.2) :
                type.name === 'heavyCup' ? (1 + difficulty.rareObstacleChance * 0.3) :
                (1 + difficulty.rareObstacleChance * 0.8) // fastBean becomes much more common
            )
        }));
        
        // Select obstacle type based on weighted random selection
        const totalWeight = adjustedTypes.reduce((sum, type) => sum + type.adjustedWeight, 0);
        let random = Math.random() * totalWeight;
        let type = adjustedTypes[0];
        
        for (const obstacleType of adjustedTypes) {
            random -= obstacleType.adjustedWeight;
            if (random <= 0) {
                type = obstacleType;
                break;
            }
        }
        
        // Calculate responsive spawn position
        const spawnX = screenWidth + Phaser.Math.Between(50, 100); // Just off-screen right
        const spawnY = Phaser.Math.Between(type.spawnHeight.min, type.spawnHeight.max);
        
        // DEBUG: Log texture creation
        console.log(`🎮 Creating obstacle: ${type.name} with texture: ${type.texture}`);
        console.log(`🎮 Texture exists in cache:`, this.scene.textures.exists(type.texture));
        
        // FAILSAFE: If bomb texture doesn't exist, create it immediately
        if (type.name === 'bombObstacle' && !this.scene.textures.exists(type.texture)) {
            console.log('🚨 BOMB TEXTURE MISSING! Creating emergency texture...');
            this.createEmergencyBombTexture(type.texture);
        }
        
        const obstacle = this.scene.physics.add.sprite(spawnX, spawnY, type.texture);
        const scale = Phaser.Math.FloatBetween(type.scale.min, type.scale.max);
        obstacle.setScale(scale);
        // obstacle.setTint(type.tint); // REMOVED - no tinting
        obstacle.setOrigin(0.5, type.texture === 'coffeeBean' ? 0.5 : 1);
        // Increase body size to better match larger emoji visuals
        obstacle.body.setSize(obstacle.width * 0.85, obstacle.height * 0.85);
        
        // Set obstacle properties with difficulty and screen-size scaling
        obstacle.setData('type', type.name);
        const baseSpeedMultiplier = type.speed * difficulty.obstacleSpeed;
        const screenSpeedMultiplier = Math.max(0.8, minScale); // Scale speed with screen size
        obstacle.setData('speedMultiplier', baseSpeedMultiplier * screenSpeedMultiplier);
        
        // Determine movement pattern based on difficulty
        let movePattern;
        if (typeof type.movePattern === 'object') {
            // Expand pattern range based on difficulty level
            const difficultyLevel = this.scene.getDifficultyLevel();
            const maxPattern = Math.min(type.movePattern.max + Math.floor(difficultyLevel / 2), 7);
            movePattern = Phaser.Math.Between(type.movePattern.min, maxPattern);
        } else {
            movePattern = type.movePattern;
            // Add chance for more complex patterns at higher difficulties
            if (difficulty.movementComplexity > 0.5 && Math.random() < difficulty.movementComplexity * 0.3) {
                movePattern = Math.min(movePattern + Phaser.Math.Between(1, 3), 7);
            }
        }
            
        obstacle.setData('movePattern', movePattern);
        obstacle.setData('startY', spawnY);
        obstacle.setData('startX', spawnX);
        obstacle.setData('time', 0);
        obstacle.setData('originalSpeed', baseSpeedMultiplier * screenSpeedMultiplier);
        
        // Set special properties for advanced patterns
        if (movePattern === 6) { // Double helix
            obstacle.setData('helixPhase', Math.random() * Math.PI * 2);
        } else if (movePattern === 7) { // Diving attack
            obstacle.setData('diveTime', 0);
        }
        
        // Add special behaviors for certain types
        if (type.name === 'floatingCup') {
            // Add gentle rotation
            this.scene.tweens.add({
                targets: obstacle,
                angle: 360,
                duration: 3000,
                repeat: -1,
                ease: 'Linear'
            });
        } else if (type.name === 'fastBean') {
            // Add pulsing scale effect
            this.scene.tweens.add({
                targets: obstacle,
                scaleX: scale * 1.2,
                scaleY: scale * 1.2,
                duration: 600,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        } else if (type.name === 'bombObstacle') {
            // DEBUG: Log bomb creation
            console.log('🎯 Creating bomb obstacle with texture:', type.texture);
            console.log('🎯 Bomb obstacle created at:', obstacle.x, obstacle.y);
            
            // Add dramatic pulsing glow and shake for bomb
            
            // Add warning glow animation
            const glowEffect = this.scene.add.circle(
                obstacle.x, 
                obstacle.y, 
                obstacle.displayWidth * 0.6, 
                0xFF4500, 
                0.2
            ).setDepth(obstacle.depth - 1);
            
            // Make glow follow bomb
            obstacle.setData('glowEffect', glowEffect);
            
            // Pulse animation for glow
            this.scene.tweens.add({
                targets: glowEffect,
                alpha: 0.5,
                scale: 1.3,
                duration: 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            
            // Subtle shake animation for bomb
            this.scene.tweens.add({
                targets: obstacle,
                angle: { from: -3, to: 3 },
                duration: 300,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
        
        this.obstacles.add(obstacle);
    }

    hitObstacle(playerSprite, obstacle) {
        const obstacleType = obstacle.getData('type');
        
        // Define type-specific properties
        const typeEffects = {
            spilledCup: { damage: true, shieldScore: 25, particles: 8, particleColor: 0x8B4513 },
            floatingCup: { damage: true, shieldScore: 30, particles: 12, particleColor: 0xFFAAAA },
            heavyCup: { damage: true, shieldScore: 40, particles: 16, particleColor: 0x654321 },
            fastBean: { damage: true, shieldScore: 50, particles: 20, particleColor: 0x4A4A4A },
            brokenMachine: { damage: true, shieldScore: 35, particles: 10, particleColor: 0x696969 },
            angryCustomer: { damage: true, shieldScore: 45, particles: 14, particleColor: 0xFFB6C1 },
            wifiDeadZone: { damage: true, shieldScore: 40, particles: 12, particleColor: 0xFF0000 },
            bombObstacle: { damage: true, shieldScore: 60, particles: 30, particleColor: 0xFF4500 }
        };
        
        const effects = typeEffects[obstacleType] || typeEffects.spilledCup;
        
        // Check if player got hit (this refers to the scene)
        if (effects.damage && !this.shieldActive) {
            // Player takes damage - pass the obstacle as damage source for special effects
            this.takeDamage(obstacle);
            
            // Remove obstacle (but not immediately for bombs to allow explosion effect)
            if (obstacleType === 'bombObstacle') {
                // Clean up the glow effect first
                const glowEffect = obstacle.getData('glowEffect');
                if (glowEffect && glowEffect.scene) {
                    glowEffect.destroy();
                }
                
                // For bombs, destroy after a small delay
                this.time.delayedCall(100, () => {
                    if (obstacle && obstacle.scene) {
                        obstacle.destroy();
                    }
                });
            } else {
                obstacle.destroy();
            }
            
            // Create hit effect (smaller for regular obstacles, bomb has its own effect)
            if (this.collectParticles && obstacleType !== 'bombObstacle') {
                this.collectParticles.setConfig({
                    scale: { start: 0.05, end: 0.01 },
                    speed: { min: 50, max: 150 },
                    lifespan: 500,
                    quantity: effects.particles,
                    // tint: effects.particleColor // REMOVED - no tinting
                });
                this.collectParticles.emitParticleAt(obstacle.x, obstacle.y);
            }
        } else if (this.shieldActive) {
            // Shield absorbed hit - NO POINTS for obstacles
            // Just show that the shield blocked the obstacle
            this.showFloatingScore(obstacle.x, obstacle.y - 30, 'BLOCKED!', '#FFD700');
            
            // Remove obstacle
            obstacle.destroy();
            
            // Shield effect
            if (this.collectParticles) {
                this.collectParticles.setConfig({
                    scale: { start: 0.08, end: 0.02 },
                    speed: { min: 100, max: 200 },
                    lifespan: 300,
                    quantity: effects.particles,
                    // tint: 0xFFD700 // REMOVED - no tinting
                });
                this.collectParticles.emitParticleAt(obstacle.x, obstacle.y);
            }
            
            // Play shield block sound
            this.soundManager.playShieldBlock();
        }
    }
    
    createChainReaction(x, y) {
        // Small chain reaction effect for fast beans
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const offsetX = x + Phaser.Math.Between(-30, 30);
                const offsetY = y + Phaser.Math.Between(-30, 30);
                this.scene.beanParticles.emitParticleAt(offsetX, offsetY, 4);
            }, i * 100);
        }
    }
    
    showScoreFeedback(x, y, text, color) {
        const scoreText = this.scene.add.text(x, y, text, {
            fontSize: '16px',
            fill: `#${color.toString(16).padStart(6, '0')}`,
            fontWeight: 'bold'
        }).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: scoreText,
            y: scoreText.y - 40,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => scoreText.destroy()
        });
    }

    // Emergency bomb texture creation if main creation failed
    createEmergencyBombTexture(textureKey) {
        console.log('🚨 Creating emergency bomb texture:', textureKey);
        
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, 128, 128);
        
        // Set font for emoji
        ctx.font = '100px Arial, Apple Color Emoji, Segoe UI Emoji';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw the bomb emoji
        ctx.fillText('💣', 64, 64);
        
        // Add to Phaser textures
        this.scene.textures.addCanvas(textureKey, canvas);
        console.log('✅ Emergency bomb texture created:', textureKey);
    }

}


