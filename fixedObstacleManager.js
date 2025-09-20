// Fixed Obstacle Manager for Bird Dash
// Creates environmental hazards that the bird must navigate around

// Phaser is loaded globally from CDN
import ElementSizing from './elementSizing.js';
import debugLogger from './debugLogger.js';

export default class FixedObstacleManager {
    constructor(scene) {
        this.scene = scene;
        this.obstacles = scene.physics.add.staticGroup();
        this.lastSpawnTime = 0;
        this.spawnInterval = 3000; // 3 seconds between obstacle sets
        
        // Initialize element sizing
        this.elementSizing = new ElementSizing(scene);
        
        // Define obstacle types with gap patterns
        this.obstacleTypes = [
            {
                name: 'tree_gap',
                texture: 'tree',
                pattern: 'vertical_gap',
                gapSize: 180, // pixels
                description: 'Tree with gap to fly through'
            },
            {
                name: 'building_gap',
                texture: 'building', 
                pattern: 'vertical_gap',
                gapSize: 200,
                description: 'Building with gap to fly through'
            },
            {
                name: 'pipe_gap',
                texture: 'pipe',
                pattern: 'vertical_gap', 
                gapSize: 160,
                description: 'Pipe with narrow gap'
            },
            {
                name: 'mountain_gap',
                texture: 'mountain',
                pattern: 'vertical_gap',
                gapSize: 220,
                description: 'Mountain with wide gap'
            },
            {
                name: 'cloud_barrier',
                texture: 'cloud',
                pattern: 'horizontal_line',
                height: 60,
                description: 'Cloud barrier to fly under/over'
            }
        ];
        
        debugLogger.log('Fixed Obstacle Manager initialized');
    }
    
    update(time, delta) {
        // Spawn new obstacle sets
        if (time - this.lastSpawnTime > this.spawnInterval) {
            this.spawnObstacleSet();
            this.lastSpawnTime = time;
        }
        
        // Move obstacles and clean up off-screen ones
        this.moveObstacles(delta);
        this.cleanupOffscreenObstacles();
    }
    
    spawnObstacleSet() {
        const screenWidth = this.scene.screenWidth;
        const screenHeight = this.scene.screenHeight;
        
        // Spawn position off-screen to the right
        const spawnX = screenWidth + 100;
        
        // Randomly select obstacle type
        const obstacleType = Phaser.Math.RND.pick(this.obstacleTypes);
        
        if (obstacleType.pattern === 'vertical_gap') {
            this.createVerticalGapObstacle(spawnX, obstacleType);
        } else if (obstacleType.pattern === 'horizontal_line') {
            this.createHorizontalBarrier(spawnX, obstacleType);
        }
        
        debugLogger.log(`Spawned ${obstacleType.name} at x: ${spawnX}`);
    }
    
    createVerticalGapObstacle(x, obstacleType) {
        const screenHeight = this.scene.screenHeight;
        
        // Add safe margins to prevent cutoff on different devices
        const safeMarginTop = Math.max(60, screenHeight * 0.08); // 8% of screen height or 60px minimum
        const safeMarginBottom = Math.max(60, screenHeight * 0.08);
        const usableHeight = screenHeight - safeMarginTop - safeMarginBottom;
        
        // Calculate gap position (center area with some randomness, within safe bounds)
        const minGapCenter = safeMarginTop + (usableHeight * 0.3);
        const maxGapCenter = safeMarginTop + (usableHeight * 0.7);
        const gapCenter = Phaser.Math.Between(minGapCenter, maxGapCenter);
        const halfGap = obstacleType.gapSize / 2;
        
        // Create top obstacle (from safe top margin to gap start)
        const topHeight = gapCenter - halfGap - safeMarginTop;
        if (topHeight > 50) { // Only create if there's enough space
            const topObstacle = this.createObstaclePart(
                x, 
                safeMarginTop + (topHeight / 2), // Center Y position within safe area
                obstacleType.texture,
                60, // width
                topHeight // height
            );
            topObstacle.setData('obstacleType', obstacleType.name);
            topObstacle.setData('part', 'top');
        }
        
        // Create bottom obstacle (from gap end to safe bottom margin)
        const bottomStart = gapCenter + halfGap;
        const bottomHeight = screenHeight - safeMarginBottom - bottomStart;
        if (bottomHeight > 50) { // Only create if there's enough space
            const bottomObstacle = this.createObstaclePart(
                x,
                bottomStart + (bottomHeight / 2), // Center Y position within safe area
                obstacleType.texture,
                60, // width
                bottomHeight // height
            );
            bottomObstacle.setData('obstacleType', obstacleType.name);
            bottomObstacle.setData('part', 'bottom');
        }
    }
    
    createHorizontalBarrier(x, obstacleType) {
        const screenHeight = this.scene.screenHeight;
        
        // Add safe margins to prevent cutoff
        const safeMarginTop = Math.max(60, screenHeight * 0.08);
        const safeMarginBottom = Math.max(60, screenHeight * 0.08);
        
        // Create horizontal barrier at random height within safe bounds
        const barrierY = Phaser.Math.Between(
            safeMarginTop + obstacleType.height / 2, 
            screenHeight - safeMarginBottom - obstacleType.height / 2
        );
        
        const barrier = this.createObstaclePart(
            x,
            barrierY,
            obstacleType.texture,
            120, // width
            obstacleType.height // height
        );
        barrier.setData('obstacleType', obstacleType.name);
        barrier.setData('part', 'barrier');
    }
    
    createObstaclePart(x, y, texture, width, height) {
        // Create a rectangle obstacle (we'll replace with textures later)
        const obstacle = this.scene.add.rectangle(x, y, width, height, this.getObstacleColor(texture));
        obstacle.setStrokeStyle(3, 0x000000);
        
        // Add to physics group
        this.obstacles.add(obstacle);
        
        // Enable physics body
        this.scene.physics.add.existing(obstacle, true); // true = static body
        
        // Store movement data
        obstacle.setData('baseSpeed', 120); // pixels per second
        obstacle.setData('spawnTime', this.scene.time.now);
        
        return obstacle;
    }
    
    getObstacleColor(texture) {
        // Color coding for different obstacle types (until we have actual textures)
        const colorMap = {
            'tree': 0x228B22,      // Forest Green
            'building': 0x696969,   // Dim Gray
            'pipe': 0x32CD32,      // Lime Green
            'mountain': 0x8B4513,   // Saddle Brown
            'cloud': 0xF0F8FF      // Alice Blue
        };
        return colorMap[texture] || 0x808080; // Default gray
    }
    
    moveObstacles(delta) {
        const speed = 120; // pixels per second
        const movement = (speed * delta) / 1000;
        
        this.obstacles.children.entries.forEach(obstacle => {
            obstacle.x -= movement;
        });
    }
    
    cleanupOffscreenObstacles() {
        this.obstacles.children.entries.forEach(obstacle => {
            if (obstacle.x < -100) { // Off-screen to the left
                obstacle.destroy();
            }
        });
    }
    
    // Set up collision detection with player
    setupCollisions(player) {
        this.scene.physics.add.overlap(
            player.sprite,
            this.obstacles,
            this.handleCollision.bind(this),
            null,
            this.scene
        );
        
        debugLogger.log('Fixed obstacle collisions set up');
    }
    
    handleCollision(playerSprite, obstacle) {
        const obstacleType = obstacle.getData('obstacleType');
        
        debugLogger.warn(`Player hit fixed obstacle: ${obstacleType}`);
        
        // Create impact effect
        this.createImpactEffect(obstacle.x, obstacle.y);
        
        // Player takes damage
        this.scene.takeDamage(obstacle);
        
        // Don't destroy the obstacle - it's fixed!
        // Just create visual feedback
    }
    
    createImpactEffect(x, y) {
        // Create particle effect at impact point
        if (this.scene.collectParticles) {
            this.scene.collectParticles.setConfig({
                scale: { start: 0.1, end: 0.01 },
                speed: { min: 100, max: 200 },
                lifespan: 800,
                quantity: 15,
                // tint: 0xFF4500 // REMOVED - no tinting
            });
            this.scene.collectParticles.emitParticleAt(x, y);
        }
        
        // Screen shake effect
        this.scene.cameras.main.shake(200, 0.01);
    }
    
    // Adjust difficulty by changing spawn rate and gap sizes
    updateDifficulty(difficultyLevel) {
        // Reduce spawn interval as difficulty increases
        this.spawnInterval = Math.max(2000, 4000 - (difficultyLevel * 200));
        
        // Reduce gap sizes as difficulty increases
        this.obstacleTypes.forEach(type => {
            if (type.gapSize) {
                const reduction = difficultyLevel * 10;
                type.gapSize = Math.max(120, type.gapSize - reduction);
            }
        });
        
        debugLogger.log(`Fixed obstacles difficulty updated: Level ${difficultyLevel}, Interval: ${this.spawnInterval}ms`);
    }
    
    // Get obstacle group for external collision detection
    getObstacleGroup() {
        return this.obstacles;
    }
    
    // Clear all obstacles (for game reset)
    clearAll() {
        this.obstacles.clear(true, true);
        debugLogger.log('All fixed obstacles cleared');
    }
}
