// Phaser is loaded globally from CDN
import Player from './player.js';
import ObstacleManager from './obstacleManager.js';
import CollectibleManager from './collectibleManager.js';
import MobileControls from './mobileControls.js';
import SoundManager from './soundManager.js';
import Leaderboard from './leaderboard.js';
import debugLogger from './debugLogger.js';
import ResponsiveUtils from './responsiveUtils.js';
import { UI, ANIMATIONS, GAME, PLAYER, POWER_UPS, EXPLOSION } from './constants.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        console.log('🎮 GameScene.create() called!');
        console.log('🎮 Scene dimensions:', this.cameras.main.width, 'x', this.cameras.main.height);
        console.log('🎮 Physics world exists:', !!this.physics);
        console.log('🎮 Input manager exists:', !!this.input);
        
        try {
            // Initialize sound manager
            this.soundManager = new SoundManager(this);
        
        // Initialize responsive utilities
        this.responsive = new ResponsiveUtils(this);
        
        // Get screen dimensions from responsive utils
        this.screenWidth = this.responsive.screenWidth;
        this.screenHeight = this.responsive.screenHeight;
        this.centerX = this.responsive.centerX;
        this.centerY = this.responsive.centerY;
        this.minScale = this.responsive.minScale;
        this.screenType = this.responsive.screenType;
        
        // Set up background
        this.setupBackground();
        
        // Initialize game state first
        this.initializeGameState();
        
        // Create game objects in correct order
        // Position player in center-left area like the reference image
        const playerX = this.screenWidth * 0.35; // About 35% from left edge (center-left positioning)
        const playerY = this.screenHeight * 0.6;  // Slightly below center to match image
        console.log(`🎮 Creating Player at position: ${playerX}, ${playerY}`);
        try {
            this.player = new Player(this, playerX, playerY);
            console.log('🎮 Player created successfully!');
        } catch (error) {
            console.error('❌ Error creating Player:', error);
            throw error;
        }
        
        // Wait for player to be fully initialized before creating managers
        this.time.delayedCall(100, () => {
            this.responsiveUtils = new ResponsiveUtils(this);
            this.obstacleManager = new ObstacleManager(this);
            this.collectibleManager = new CollectibleManager(this);
            this.mobileControls = new MobileControls(this);
            this.leaderboard = new Leaderboard(this);
            
            // Create particle system for effects
            this.createParticleSystem();
            
            // Set up UI
            this.createUI();
            
            // Set up input
            this.setupInput();
            
            // Start game
            this.gameRunning = true;
            this.gameStartTime = this.time.now;
            
            console.log('🎮 GAME STARTED!');
            console.log('🎮 gameRunning:', this.gameRunning);
            console.log('🎮 Player exists:', !!this.player);
            console.log('🎮 Player sprite exists:', !!(this.player && this.player.sprite));
            console.log('🎮 Background images exist:', !!(this.backgroundImages && this.backgroundImages.length));
            console.log('🎮 Update method will be called automatically by Phaser');
        });
        
        } catch (error) {
            console.error('❌ Error in GameScene.create():', error);
            throw error;
        }
    }

    initializeGameState() {
        // Core game state
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
        
        // Power-up states
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
        
        // Session management
        this.sessionPhase = 'warmup';
        this.phaseStartTime = 0;
        this.sessionBonusMultiplier = 1;
    }

    setupBackground() {
        // Use custom background image
        this.createCustomBackground();
    }
    
    createCustomBackground() {
        // Create dual-image background with subtle seam line
        this.backgroundImages = [];
        
        // Calculate proper scale for the background
        const tempImage = this.add.image(0, 0, 'customBackground');
        const scaleX = this.screenWidth / tempImage.width;
        const scaleY = this.screenHeight / tempImage.height;
        const scale = Math.max(scaleX, scaleY); // Fill screen completely
        tempImage.destroy(); // Clean up temp image
        
        // Create subtle vertical lines that match the sky color from your background
        // Using a blue color that blends with the background sky
        const seamWidth = 1; // Very thin line
        this.seamLines = [];
        
        // Create two seam lines (one for each side)
        for (let i = 0; i < 2; i++) {
            const seamLine = this.add.rectangle(
                0, 0, 
                seamWidth, 
                this.screenHeight, 
                0x87CEEB  // Light sky blue color to blend with background
            );
            seamLine.setOrigin(0, 0);
            seamLine.setDepth(-99); // Just above background, below game elements
            seamLine.setAlpha(0.6); // Make it semi-transparent
            this.seamLines.push(seamLine);
        }
        
        // Create two background images
        for (let i = 0; i < 2; i++) {
            const bg = this.add.image(0, 0, 'customBackground');
            bg.setOrigin(0, 0);
            bg.setScale(scale);
            
            // Center vertically
            if (bg.displayHeight > this.screenHeight) {
                bg.y = (this.screenHeight - bg.displayHeight) / 2;
            }
            
            // Position images side by side with minimal gap for seam lines
            if (i === 0) {
                bg.x = 0;
            } else {
                bg.setFlipX(true);
                // Position with consistent minimal gap
                bg.x = bg.displayWidth + seamWidth;
            }
            
            bg.setDepth(-100);
            this.backgroundImages.push(bg);
        }
        
        // Position the initial seam lines
        if (this.seamLines.length >= 2) {
            // First seam line at the transition between images
            this.seamLines[0].x = this.backgroundImages[0].displayWidth;
            // Second seam line positioned for the next transition
            this.seamLines[1].x = this.backgroundImages[1].x + this.backgroundImages[1].displayWidth;
        }
        
        console.log(`🎨 Dual-image background with dual subtle seams created: ${this.backgroundImages[0].displayWidth}x${this.backgroundImages[0].displayHeight}`);
    }
    
    createSkyGradient() {
        // Create sky and ground background
        // Top: blue sky
        const sky = this.add.rectangle(0, 0, this.screenWidth, this.screenHeight * 0.75, 0x87CEEB)
            .setOrigin(0, 0);
        
        // Bottom: green ground
        const ground = this.add.rectangle(0, this.screenHeight * 0.75, this.screenWidth, this.screenHeight * 0.25, 0x4CAF50)
            .setOrigin(0, 0);
        
        // Add a subtle horizon line
        const horizonLine = this.add.rectangle(0, this.screenHeight * 0.75, this.screenWidth, 2, 0x2E7D32)
            .setOrigin(0, 0)
            .setAlpha(0.6);
    }
    
    createParallaxBackground() {
        // Clean slate - no background elements
        this.backgroundLayers = [];
    }
    
    createBackgroundLayer(layerName, scrollSpeed, yPosition, elements) {
        const layer = {
            name: layerName,
            scrollSpeed: scrollSpeed,
            elements: [],
            containers: []
        };
        
        // Create two containers for seamless scrolling (double buffering)
        for (let containerIndex = 0; containerIndex < 2; containerIndex++) {
            const container = this.add.container(containerIndex * this.screenWidth, 0);
            container.setDepth(layerName === 'foreground' ? 50 : 
                              layerName === 'near' ? 40 : 
                              layerName === 'mid' ? 30 : 20);
            
            // Fill container with elements
            let currentX = 0;
            const containerWidth = this.screenWidth + 200; // Extra width for smooth scrolling
            
            while (currentX < containerWidth) {
                const element = Phaser.Math.RND.pick(elements);
                const elementSprite = this.add.text(currentX, yPosition, element.emoji, {
                    fontSize: Math.max(30, 40 * this.minScale * element.scale) + 'px'
                }).setAlpha(layerName === 'far' ? 0.6 : layerName === 'mid' ? 0.7 : 0.8);
                
                container.add(elementSprite);
                currentX += element.spacing;
            }
            
            layer.containers.push(container);
        }
        
        this.backgroundLayers.push(layer);
    }
    
    createFloatingClouds() {
        // Create floating clouds that move at different speeds
        this.floatingClouds = this.add.group();
        
        for (let i = 0; i < 18; i++) {
            const cloudEmoji = Phaser.Math.RND.pick(['☁️', '⛅', '🌤️', '⛈️', '🌩️', '🌨️']);
            const cloud = this.add.text(
                Phaser.Math.Between(-200, this.screenWidth + 200),
                Phaser.Math.Between(30, this.screenHeight * 0.5),
                cloudEmoji,
                { fontSize: Math.max(15, 25 * this.minScale) + 'px' }
            ).setAlpha(Phaser.Math.Between(25, 60) / 100).setDepth(10);
            
            cloud.setData('scrollSpeed', 0.05 + (i * 0.03));
            cloud.setData('originalX', cloud.x);
            this.floatingClouds.add(cloud);
        }
    }
    
    createStaticSun() {
        // Add a static sun in the sky
        this.sun = this.add.text(
            this.screenWidth * 0.85,
            this.screenHeight * 0.15,
            '☀️',
            { fontSize: Math.max(40, 50 * this.minScale) + 'px' }
        ).setAlpha(0.9).setDepth(15);
    }
    
    
    
    updateParallaxLayers(delta) {
        if (!this.backgroundLayers) return;
        
        // Calculate base scroll speed based on game speed
        const baseScrollSpeed = (this.gameSpeed * delta) / 1000;
        
        this.backgroundLayers.forEach(layer => {
            const scrollDistance = baseScrollSpeed * layer.scrollSpeed;
            
            layer.containers.forEach(container => {
                container.x -= scrollDistance;
                
                // Reset position for seamless scrolling
                if (container.x <= -this.screenWidth) {
                    container.x = this.screenWidth;
                }
            });
        });
    }
    
    updateFloatingClouds(delta) {
        if (!this.floatingClouds) return;
        
        const baseScrollSpeed = (this.gameSpeed * delta) / 1000;
        
        this.floatingClouds.children.entries.forEach(cloud => {
            const scrollSpeed = cloud.getData('scrollSpeed');
            cloud.x -= baseScrollSpeed * scrollSpeed;
            
            // Reset cloud position when it goes off screen
            if (cloud.x < -cloud.width - 50) {
                cloud.x = this.screenWidth + Phaser.Math.Between(50, 200);
                cloud.y = Phaser.Math.Between(50, this.screenHeight * 0.4);
            }
        });
    }
    
    createParticleSystem() {
        // Create particle emitter for various effects - store in array for easy cleanup
        this.particleSystems = [];
        
        // Collection particles
        this.collectParticles = this.add.particles(0, 0, 'coffeeBean', {
            scale: { start: 0.05, end: 0 },
            speed: { min: 50, max: 150 },
            lifespan: 600,
            quantity: 1,
            frequency: -1,
            emitting: false,
            // tint: 0xFFFFFF // REMOVED - no tinting
        });
        this.particleSystems.push(this.collectParticles);
        
        // Combo particles
        this.comboParticles = this.add.particles(0, 0, 'coffeeBean', {
            scale: { start: 0.06, end: 0 },
            speed: { min: 100, max: 200 },
            lifespan: 800,
            quantity: 1,
            frequency: -1,
            emitting: false,
            // tint: 0xFFD700 // REMOVED - no tinting
        });
        this.particleSystems.push(this.comboParticles);
        
        // Steam particles
        this.steamParticles = this.add.particles(0, 0, 'coffeeBean', {
            scale: { start: 0.03, end: 0 },
            speed: { min: 20, max: 60 },
            lifespan: 800,
            quantity: 1,
            frequency: -1,
            emitting: false,
            // tint: 0xCCCCCC // REMOVED - no tinting
        });
        this.particleSystems.push(this.steamParticles);
        
        // Sparkle particles
        this.sparkleParticles = this.add.particles(0, 0, 'coffeeBean', {
            scale: { start: 0.04, end: 0 },
            speed: { min: 80, max: 120 },
            lifespan: 1000,
            quantity: 1,
            frequency: -1,
            emitting: false,
            // tint: 0xFFFF99 // REMOVED - no tinting
        });
        this.particleSystems.push(this.sparkleParticles);
        
        // Bird movement trail particles
        this.birdTrailParticles = this.add.particles(0, 0, 'coffeeBean', {
            scale: { start: 0.02, end: 0 },
            speed: { min: 10, max: 30 },
            lifespan: 400,
            quantity: 1,
            frequency: -1,
            emitting: false,
            // tint: 0x87CEEB, // REMOVED - no tinting
            alpha: { start: 0.6, end: 0 }
        });
        this.particleSystems.push(this.birdTrailParticles);
        
        // Add cleanup method to scene shutdown
        this.events.on('shutdown', this.cleanupParticleSystems, this);
    }
    
    cleanupParticleSystems() {
        // Safely destroy all particle systems
        if (this.particleSystems) {
            this.particleSystems.forEach(system => {
                if (system && system.scene) {
                    system.destroy();
                }
            });
            this.particleSystems = [];
        }
    }

    getStandardTextStyle(type = 'primary', size = 'medium') {
        // Base font size calculation - responsive but consistent
        const baseFontSize = Math.max(16, Math.min(24, this.screenWidth * 0.04));
        
        // Size multipliers
        const sizeMultipliers = {
            small: 0.75,
            medium: 1.0,
            large: 1.25,
            xlarge: 1.5
        };
        
        const fontSize = Math.floor(baseFontSize * (sizeMultipliers[size] || 1.0));
        const strokeThickness = Math.max(2, fontSize * 0.08);
        
        // Style presets
        const styles = {
            primary: {
                fontSize: `${fontSize}px`,
                fill: '#FFFFFF',
                fontWeight: 'bold',
                stroke: '#000000',
                strokeThickness: strokeThickness,
                fontFamily: 'Arial, sans-serif',
                shadow: {
                    offsetX: 1,
                    offsetY: 1,
                    color: '#000000',
                    blur: 3,
                    fill: true
                }
            },
            accent: {
                fontSize: `${fontSize}px`,
                fill: '#FFD700',
                fontWeight: 'bold',
                stroke: '#000000',
                strokeThickness: strokeThickness,
                fontFamily: 'Arial, sans-serif',
                shadow: {
                    offsetX: 1,
                    offsetY: 1,
                    color: '#000000',
                    blur: 3,
                    fill: true
                }
            },
            powerup: {
                fontSize: `${Math.floor(fontSize * 0.8)}px`,
                fill: '#32CD32',
                fontWeight: 'bold',
                stroke: '#000000',
                strokeThickness: Math.max(2, strokeThickness * 0.8),
                fontFamily: 'Arial, sans-serif',
                shadow: {
                    offsetX: 1,
                    offsetY: 1,
                    color: '#000000',
                    blur: 2,
                    fill: true
                }
            },
            feedback: {
                fontSize: `${Math.floor(fontSize * 1.1)}px`,
                fill: '#FFD700',
                fontWeight: 'bold',
                stroke: '#000000',
                strokeThickness: Math.max(3, strokeThickness * 1.2),
                fontFamily: 'Arial, sans-serif',
                align: 'center',
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: '#000000',
                    blur: 4,
                    fill: true
                }
            }
        };
        
        return styles[type] || styles.primary;
    }

    createUI() {
        // Initialize ultra-minimal mobile UI system
        this.initializeUILayoutSystem();
        
        // Create only essential UI elements for mobile gameplay
        this.createMainHUD();
        
        // Debug panel only if debug mode is explicitly enabled
        if (this.debugMode) {
            this.createDebugPanel();
        }
        
        console.log('🎨 Minimal mobile UI system initialized');
    }
    
    initializeUILayoutSystem() {
        // ULTRA-MINIMAL mobile-first UI design - only essential elements
        const margin = Math.max(12, 15 * this.minScale); // Increased margin
        const hudHeight = Math.max(45, 50 * this.minScale); // Increased for mobile
        
        this.uiZones = {
            // Simple top bar - score and health only
            topHUD: {
                x: margin,
                y: margin,
                width: this.screenWidth - (margin * 2),
                height: hudHeight
            }
        };
        
        // Create main UI container - simplified
        this.uiContainer = this.add.container(0, 0).setDepth(500);
        
        // UI state
        this.uiVisible = true;
        
        console.log('🎮 Ultra-minimal mobile UI system initialized');
    }
    
    createMainHUD() {
        const zone = this.uiZones.topHUD;
        
        // Minimal, semi-transparent background
        this.mainHUDBg = this.add.graphics();
        this.mainHUDBg.fillStyle(0x000000, 0.3); // Very subtle background
        this.mainHUDBg.fillRoundedRect(zone.x, zone.y, zone.width, zone.height, 6);
        this.mainHUDBg.setDepth(499);
        this.uiContainer.add(this.mainHUDBg);
        
        // Only essential elements in a single row
        this.createMinimalScore(zone.x + 10, zone.y, 120, zone.height);
        this.createMinimalHealth(zone.x + zone.width - 120, zone.y, 110, zone.height);
        this.createMinimalCombo(zone.x + zone.width/2 - 60, zone.y, 120, zone.height);
        
        // Add UI toggle button
        this.createUIToggle();
    }
    
    createMinimalScore(x, y, width, height) {
        const centerY = y + height / 2;
        
        // Simple score display with larger, mobile-friendly fonts
        this.scoreIcon = this.add.text(x + 8, centerY, '💎', {
            fontSize: Math.max(20, 24 * this.minScale) + 'px' // Increased from 14/16
        }).setOrigin(0, 0.5).setDepth(501);
        this.uiContainer.add(this.scoreIcon);
        
        this.scoreText = this.add.text(x + 35, centerY, '0', {
            fontSize: Math.max(20, 24 * this.minScale) + 'px', // Increased from 14/16
            fill: '#FFFFFF',
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif',
            stroke: '#000000',
            strokeThickness: 2 // Increased stroke for better visibility
        }).setOrigin(0, 0.5).setDepth(501);
        this.uiContainer.add(this.scoreText);
    }
    
    createMinimalHealth(x, y, width, height) {
        const centerY = y + height / 2;
        
        // Compact hearts display
        this.heartsContainer = this.add.container(x, centerY);
        this.heartsContainer.setDepth(501);
        this.uiContainer.add(this.heartsContainer);
        
        this.hearts = this.add.group();
        this.heartAnimations = [];
        this.updateMinimalHearts();
    }
    
    createMinimalCombo(x, y, width, height) {
        const centerY = y + height / 2;
        
        // Combo display (only shows when active) - improved mobile visibility
        this.comboText = this.add.text(x + width/2, centerY, '', {
            fontSize: Math.max(18, 22 * this.minScale) + 'px', // Increased from 12/14
            fill: '#F39C12',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 2, // Increased stroke for better visibility
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5, 0.5).setDepth(501);
        this.uiContainer.add(this.comboText);
    }
    
    createUIToggle() {
        // Music toggle button - positioned in top right corner, improved for mobile
        this.musicToggleBtn = this.add.text(this.screenWidth - 35, 35, '🎵', {
            fontSize: Math.max(24, 28 * this.minScale) + 'px', // Increased from 18/20
            interactive: true,
            fill: '#FFD700',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5, 0.5).setDepth(502).setInteractive();
        
        // Enhanced music button functionality with debugging
        this.musicToggleBtn.on('pointerdown', () => {
            console.log('🎵 Music button clicked!');
            console.log('🎵 SoundManager exists:', !!this.soundManager);
            console.log('🎵 toggleMusic method exists:', !!(this.soundManager && this.soundManager.toggleMusic));
            
            try {
                if (this.soundManager && this.soundManager.toggleMusic) {
                    console.log('🎵 Calling toggleMusic...');
                    const isPlaying = this.soundManager.toggleMusic();
                    console.log('🎵 Toggle result:', isPlaying);
                    
                    // Update button appearance
                    this.musicToggleBtn.setStyle({ 
                        fill: isPlaying ? '#FFD700' : '#666666' 
                    });
                    console.log('🎵 Music toggled:', isPlaying ? 'ON' : 'OFF');
                } else {
                    console.warn('⚠️ SoundManager or toggleMusic method not available');
                    console.log('🎵 SoundManager debug:', {
                        soundManager: !!this.soundManager,
                        toggleMusic: !!(this.soundManager && this.soundManager.toggleMusic),
                        audioContext: !!(this.soundManager && this.soundManager.audioContext)
                    });
                }
            } catch (error) {
                console.error('❌ Error toggling music:', error);
            }
        });
        
        this.uiContainer.add(this.musicToggleBtn);
    }
    
    updateMinimalHearts() {
        // Clear existing hearts and animations
        if (this.hearts) {
            this.hearts.clear(true, true);
        }
        
        if (this.heartAnimations) {
            this.heartAnimations.forEach(tween => {
                if (tween) tween.destroy();
            });
            this.heartAnimations = [];
        }
        
        // Clear hearts container
        if (this.heartsContainer) {
            this.heartsContainer.removeAll(true);
        }
        
        const heartSize = Math.max(22, 26 * this.minScale); // Increased from 16/18
        const heartSpacing = heartSize + 6; // Slightly more spacing
        const maxHearts = this.player ? this.player.maxHealth : 3;
        const currentHealth = this.player ? this.player.health : 0;
        
        // Create larger, more visible hearts for mobile
        for (let i = 0; i < maxHearts; i++) {
            const heartX = i * heartSpacing;
            const heartY = 0;
            
            const isActive = i < currentHealth;
            const heartEmoji = isActive ? '❤️' : '🖤';
            
            const heart = this.add.text(heartX, heartY, heartEmoji, {
                fontSize: `${heartSize}px`,
                alpha: isActive ? 1.0 : 0.5 // Slightly more visible when empty
            }).setOrigin(0, 0.5).setDepth(501);
            
            this.heartsContainer.add(heart);
            this.hearts.add(heart);
        }
    }
    
    // Settings functionality removed - music toggle button only
    
    addHUDDividers(zone, sectionWidth) {
        for (let i = 1; i < 4; i++) {
            const dividerX = zone.x + (sectionWidth * i);
            this.mainHUDBg.lineStyle(1, 0x4a90e2, 0.4);
            this.mainHUDBg.moveTo(dividerX, zone.y + 10);
            this.mainHUDBg.lineTo(dividerX, zone.y + zone.height - 10);
            this.mainHUDBg.strokePath();
        }
    }
    
    createStatsSection(x, y, width, height) {
        const centerY = y + height / 2;
        
        // Distance indicator - centered in the stats section
        this.distanceIcon = this.add.text(x + width/2, centerY, '🏃', {
            fontSize: Math.max(14, 16 * this.minScale) + 'px'
        }).setOrigin(0.5, 0.5).setDepth(1001);
        this.uiContainer.add(this.distanceIcon);
    }
    
    createPowerUpStatusPanel() {
        // Minimal power-up indicators positioned BELOW the main HUD to avoid overlap
        const zone = this.uiZones.topLeft;
        const hudHeight = this.uiZones.topHUD.height;
        const powerUpY = zone.y + hudHeight + 10; // Position below main HUD with 10px gap
        
        this.powerUpIndicators = {};
        this.activePowerUpDisplays = [];
        
        // Power-up definitions
        this.powerUpDefs = [
            { key: 'shield', icon: '🛡️', color: '#3498db' },
            { key: 'speed', icon: '⚡', color: '#f1c40f' },
            { key: 'multiplier', icon: '✨', color: '#e74c3c' },
            { key: 'magnet', icon: '🧲', color: '#9b59b6' },
            { key: 'timeSlow', icon: '⏰', color: '#2ecc71' },
            { key: 'companion', icon: '🐦', color: '#e67e22' }
        ];
        
        // Create container for active power-ups only - positioned below main HUD
        this.activePowerUpsContainer = this.add.container(zone.x, powerUpY);
        this.activePowerUpsContainer.setDepth(501);
        this.uiContainer.add(this.activePowerUpsContainer);
        
        console.log('⚡ Minimal power-up system created below main HUD');
    }
    
    updateActivePowerUpDisplay() {
        // Safety check - only update if container exists
        if (!this.activePowerUpsContainer) {
            return;
        }
        
        // Clear existing displays
        this.activePowerUpsContainer.removeAll(true);
        this.activePowerUpDisplays = [];
        
        // Only show active power-ups
        const activePowerUps = [];
        
        if (this.shieldActive) activePowerUps.push({ 
            key: 'shield', time: this.shieldTime, maxTime: 3000 
        });
        if (this.speedBoostActive) activePowerUps.push({ 
            key: 'speed', time: this.speedBoostTime, maxTime: 4000 
        });
        if (this.scoreMultiplierActive) activePowerUps.push({ 
            key: 'multiplier', time: this.scoreMultiplierTime, maxTime: 5000 
        });
        if (this.magnetActive) activePowerUps.push({ 
            key: 'magnet', time: this.magnetTime, maxTime: 5000 
        });
        if (this.timeSlowActive) activePowerUps.push({ 
            key: 'timeSlow', time: this.timeSlowTime, maxTime: 6000 
        });
        if (this.birdCompanionActive) activePowerUps.push({ 
            key: 'companion', time: this.birdCompanionTime, maxTime: 15000 
        });
        
        // Create minimal displays for active power-ups
        activePowerUps.forEach((powerUp, index) => {
            const def = this.powerUpDefs.find(d => d.key === powerUp.key);
            if (!def) return;
            
            const x = index * 45; // Horizontal layout
            const y = 0;
            
            // Small background circle
            const bg = this.add.circle(x + 20, y + 20, 18, 0x000000, 0.5);
            this.activePowerUpsContainer.add(bg);
            
            // Icon - responsive sizing
            const iconSize = Math.max(14, Math.floor(16 * this.minScale)) + 'px';
            const icon = this.add.text(x + 20, y + 20, def.icon, {
                fontSize: iconSize
            }).setOrigin(0.5, 0.5);
            this.activePowerUpsContainer.add(icon);
            
            // Timer text - responsive sizing
            const timeLeft = Math.ceil(powerUp.time / 1000);
            const timerSize = Math.max(10, Math.floor(12 * this.minScale)) + 'px';
            const timer = this.add.text(x + 20, y + 35, `${timeLeft}s`, {
                fontSize: timerSize,
                fill: def.color,
                fontWeight: 'bold',
                stroke: '#000000',
                strokeThickness: Math.max(1, Math.floor(1.5 * this.minScale))
            }).setOrigin(0.5, 0.5);
            this.activePowerUpsContainer.add(timer);
            
            this.activePowerUpDisplays.push({ bg, icon, timer, powerUp });
        });
    }
    
    createDebugPanel() {
        const zone = this.uiZones.topRight;
        
        // Safety check for zone
        if (!zone) {
            console.error('❌ topRight zone not found in uiZones:', Object.keys(this.uiZones));
            return;
        }
        
        // Create debug panel (initially hidden)
        this.debugPanelBg = this.add.graphics();
        
        // Background with dark theme for debug info
        this.debugPanelBg.fillGradientStyle(0x1a1a1a, 0x2d2d2d, 0x0a0a0a, 0x1a1a1a);
        this.debugPanelBg.fillRoundedRect(zone.x, zone.y, zone.width, zone.height, 8);
        
        // Border
        this.debugPanelBg.lineStyle(1, 0x666666, 0.5);
        this.debugPanelBg.strokeRoundedRect(zone.x, zone.y, zone.width, zone.height, 8);
        
        this.debugPanelBg.setDepth(999).setVisible(false);
        this.uiContainer.add(this.debugPanelBg);
        
        // Debug title
        this.debugTitle = this.add.text(zone.x + zone.width/2, zone.y + 15, 'DEBUG', {
            fontSize: Math.max(10, 12 * this.minScale) + 'px',
            fill: '#00ff00',
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif',
            letterSpacing: '1px'
        }).setOrigin(0.5, 0.5).setDepth(1001).setVisible(false);
        this.uiContainer.add(this.debugTitle);
        
        // Debug text elements
        this.debugElements = [];
        const debugLabels = ['FPS:', 'Objects:', 'Memory:', 'Physics:', 'Tweens:'];
        
        debugLabels.forEach((label, index) => {
            const y = zone.y + 35 + (index * 20);
            const debugText = this.add.text(zone.x + 5, y, label, {
                fontSize: Math.max(8, 10 * this.minScale) + 'px',
                fill: '#00ff00',
                fontFamily: 'monospace'
            }).setOrigin(0, 0.5).setDepth(1001).setVisible(false);
            this.uiContainer.add(debugText);
            this.debugElements.push(debugText);
        });
    }
    
    createFloatingElements() {
        // Initialize floating elements container for dynamic UI elements
        this.floatingElements = this.add.container(0, 0).setDepth(1500);
        
        // This will hold temporary UI elements like:
        // - Collection feedback text
        // - Floating score indicators
        // - Temporary notifications
        // - Achievement popups
        
        console.log('🎈 Floating elements container created');
    }
    
    visualizeUIZones() {
        // Debug visualization of UI zones (only shown in debug mode)
        const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff];
        const zones = Object.values(this.uiZones);
        
        zones.forEach((zone, index) => {
            const debugRect = this.add.rectangle(
                zone.x + zone.width/2, 
                zone.y + zone.height/2, 
                zone.width, 
                zone.height, 
                colors[index % colors.length], 
                0.1
            ).setStrokeStyle(2, colors[index % colors.length], 0.5).setDepth(10000);
        });
    }
    
    
    
    createScoreSection(x, y, width, height) {
        const centerY = y + height / 2;
        const iconSize = Math.max(16, 18 * this.minScale);
        
        // Score icon with animation
        this.scoreIcon = this.add.text(x + 5, centerY, '💎', {
            fontSize: iconSize + 'px'
        }).setOrigin(0, 0.5).setDepth(1001);
        this.uiContainer.add(this.scoreIcon);
        
        // Subtle pulse animation for score icon
        this.tweens.add({
            targets: this.scoreIcon,
            scale: { from: 1, to: 1.1 },
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Score label (positioned above score value)
        this.scoreLabel = this.add.text(x + iconSize + 8, centerY - 8, 'SCORE', {
            fontSize: Math.max(8, 10 * this.minScale) + 'px',
            fill: '#bdc3c7',
            fontWeight: '600',
            fontFamily: 'Arial, sans-serif',
            letterSpacing: '0.5px'
        }).setOrigin(0, 0.5).setDepth(1001);
        this.uiContainer.add(this.scoreLabel);
        
        // Score text (positioned below label)
        this.scoreText = this.add.text(x + iconSize + 8, centerY + 6, '0', {
            fontSize: Math.max(14, 16 * this.minScale) + 'px',
            fill: '#ffffff',
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif',
            stroke: '#2c3e50',
            strokeThickness: 1
        }).setOrigin(0, 0.5).setDepth(1001);
        this.uiContainer.add(this.scoreText);
    }
    
    createComboSection(x, y, width, height) {
        const centerY = y + height / 2;
        
        // Combo display (initially hidden)
        this.comboText = this.add.text(x + width/2, centerY, '', {
            fontSize: Math.max(14, 16 * this.minScale) + 'px',
            fill: '#f39c12',
            fontWeight: 'bold',
            stroke: '#2c3e50',
            strokeThickness: 1,
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5, 0.5).setDepth(1001);
        this.uiContainer.add(this.comboText);
        
        // Combo background effect (initially hidden)
        this.comboGlow = this.add.circle(x + width/2, centerY, 25, 0xf39c12, 0)
            .setDepth(1000);
        this.uiContainer.add(this.comboGlow);
    }
    
    createHealthSection(x, y, width, height) {
        const centerY = y + height / 2;
        
        // Health label
        this.healthLabel = this.add.text(x + 5, centerY - 8, 'HEALTH', {
            fontSize: Math.max(8, 10 * this.minScale) + 'px',
            fill: '#bdc3c7',
            fontWeight: '600',
            fontFamily: 'Arial, sans-serif',
            letterSpacing: '0.5px'
        }).setOrigin(0, 0.5).setDepth(1001);
        this.uiContainer.add(this.healthLabel);
        
        // Hearts container - positioned to fit within section width
        this.heartsContainer = this.add.container(x + 5, centerY + 8);
        this.heartsContainer.setDepth(1001);
        this.uiContainer.add(this.heartsContainer);
        
        // Store section width for heart sizing
        this.healthSectionWidth = width;
        
        // Initialize hearts
        this.hearts = this.add.group();
        this.heartAnimations = [];
        this.updateMinimalHearts();
    }
    
    
    updateModernHearts() {
        // Clear existing hearts and animations
        if (this.hearts) {
            this.hearts.clear(true, true);
        }
        
        if (this.heartAnimations) {
            this.heartAnimations.forEach(tween => {
                if (tween) tween.destroy();
            });
            this.heartAnimations = [];
        }
        
        // Clear hearts container
        if (this.heartsContainer) {
            this.heartsContainer.removeAll(true);
        }
        
        const maxHearts = this.player ? this.player.maxHealth : 3;
        const currentHealth = this.player ? this.player.health : 0;
        
        // Calculate heart size based on available section width
        const availableWidth = this.healthSectionWidth || 120;
        const maxHeartSize = Math.floor((availableWidth - 10) / maxHearts);
        const heartSize = Math.min(Math.max(18, 20 * this.minScale), maxHeartSize);
        const heartSpacing = heartSize + 2;
        
        // Add hearts to container with enhanced visuals
        for (let i = 0; i < maxHearts; i++) {
            const heartX = i * heartSpacing;
            const heartY = 6; // Offset for better positioning with label
            
            const isActive = i < currentHealth;
            const heartEmoji = isActive ? '💖' : '🖤';
            
            const heart = this.add.text(heartX, heartY, heartEmoji, {
                fontSize: `${heartSize}px`,
                alpha: isActive ? 1.0 : 0.3,
                stroke: isActive ? '#e74c3c' : '#34495e',
                strokeThickness: 1
            }).setOrigin(0, 0.5).setDepth(1001);
            
            this.heartsContainer.add(heart);
            this.hearts.add(heart);
            
            // Add subtle pulse animation to active hearts
            if (isActive) {
                const pulseAnimation = this.tweens.add({
                    targets: heart,
                    scale: { from: 1, to: 1.15 },
                    duration: 1500 + (i * 200), // Stagger the animations
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut',
                    delay: i * 100 // Stagger start times
                });
                this.heartAnimations.push(pulseAnimation);
            }
            
            // Add glow effect for active hearts
            if (isActive) {
                const glowEffect = this.add.circle(heartX + heartSize/2, heartY, heartSize * 0.7, 0xe74c3c, 0.1)
                    .setDepth(1000);
                this.heartsContainer.add(glowEffect);
                
                const glowAnimation = this.tweens.add({
                    targets: glowEffect,
                    alpha: { from: 0.1, to: 0.3 },
                    scale: { from: 1, to: 1.2 },
                    duration: 2000,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut',
                    delay: i * 150
                });
                this.heartAnimations.push(glowAnimation);
            }
        }
    }
    
    createUIBackgrounds() {
        // UI backgrounds are now handled by the unified collection bar
        // This method is kept for compatibility but no longer creates additional backgrounds
    }

    

    // Pause button functionality removed

    setupInput() {
        // Keyboard controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,A,S,D');
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        // Debug toggle
        this.debugKey = this.input.keyboard.addKey('D');
        this.debugKey.on('down', () => this.toggleDebug());
        
        // Add simple click/tap test to make sure game is responsive
        this.input.on('pointerdown', () => {
            if (this.gameRunning && this.player) {
                this.player.fly();
            }
        });
    }

    update(time, delta) {
        // Debug: Log first few updates
        if (!this.updateCount) this.updateCount = 0;
        this.updateCount++;
        if (this.updateCount <= 5) {
            console.log(`🎮 Update #${this.updateCount} - gameRunning: ${this.gameRunning}, delta: ${delta.toFixed(1)}`);
        }
        
        if (!this.gameRunning) {
            if (this.updateCount <= 5) {
                console.log('🎮 Update stopped - gameRunning is false');
            }
            return;
        }
        
        // Update game speed
        this.updateGameSpeed(delta);
        
        // Update background
        this.updateBackground(delta);
        
        // Update game objects
        if (this.player) this.player.update(time, delta);
        if (this.obstacleManager) this.obstacleManager.update(time, delta);
        if (this.collectibleManager) this.collectibleManager.update(time, delta);
        
        // Update power-ups
        this.updatePowerUps(delta);
        
        // Update UI
        this.updateUI();
        
        // Update distance
        this.distanceTraveled += (this.gameSpeed * delta) / 1000;
    }

    updateGameSpeed(delta) {
        // Base speed increase
        this.speedIncrease += delta * 0.00002;
        
        // Apply time slow factor
        const speedMultiplier = this.timeSlowActive ? this.timeSlowFactor : 1.0;
        
        this.gameSpeed = this.baseGameSpeed * this.speedIncrease * speedMultiplier;
    }

    updateBackground(delta) {
        // Scroll the background to create movement illusion
        if (this.backgroundImages && this.gameRunning) {
            // Calculate scroll speed based on game speed
            const scrollSpeed = (this.gameSpeed * delta) / 1000;
            const seamWidth = 1;
            
            // Move both background images to the left
            this.backgroundImages.forEach((bg, index) => {
                bg.x -= scrollSpeed;
                
                // Reset position for seamless scrolling
                // When an image scrolls completely off screen, move it to the right
                if (bg.x <= -bg.displayWidth) {
                    // Position it after the other image with consistent small gap
                    const otherImage = this.backgroundImages[1 - index];
                    bg.x = otherImage.x + otherImage.displayWidth + seamWidth;
                }
            });
            
            // Move both seam lines to stay at the edges of the images
            if (this.seamLines) {
                this.seamLines.forEach((seamLine, seamIndex) => {
                    seamLine.x -= scrollSpeed;
                    
                    // Reset seam line position when it goes off screen
                    if (seamLine.x <= -seamWidth) {
                        // Find the rightmost image and position seam line after it
                        const img1 = this.backgroundImages[0];
                        const img2 = this.backgroundImages[1];
                        const rightmostImage = img1.x > img2.x ? img1 : img2;
                        
                        // Position seam line at the right edge of the rightmost image
                        seamLine.x = rightmostImage.x + rightmostImage.displayWidth;
                    }
                });
            }
        }
    }

    updatePowerUps(delta) {
        try {
            // Update shield
            if (this.shieldActive) {
                this.shieldTime -= delta;
                if (this.shieldTime <= 0) {
                    this.deactivateShield();
                } else {
                    // Shield indicator handled by main power-up system
                }
            }
            
            // Update speed boost
            if (this.speedBoostActive) {
                this.speedBoostTime -= delta;
                if (this.speedBoostTime <= 0) {
                    this.deactivateSpeedBoost();
                }
                // Speed boost indicator handled by main power-up system
            }
            
            // Update score multiplier
            if (this.scoreMultiplierActive) {
                this.scoreMultiplierTime -= delta;
                if (this.scoreMultiplierTime <= 0) {
                    this.deactivateScoreMultiplier();
                }
                // Score multiplier indicator handled by main power-up system
            }
            
            // Update time slow
            if (this.timeSlowActive) {
                this.timeSlowTime -= delta;
                if (this.timeSlowTime <= 0) {
                    this.deactivateTimeSlow();
                } else {
                    this.updateTimeSlowIndicator();
                }
            }
            
            // Update magnet - with additional safety checks
            if (this.magnetActive) {
                this.magnetTime -= delta;
                if (this.magnetTime <= 0) {
                    this.deactivateMagnet();
                } else {
                    // Check if magnetAura still exists before applying effects
                    if (!this.magnetAura || !this.magnetAura.scene) {
                        debugLogger.warn("Magnet aura missing but magnet still active - recreating");
                        // Recreate the aura if it's missing but still active
                        if (this.player && this.player.sprite && this.player.sprite.active) {
                            this.magnetAura = this.add.circle(
                                this.player.sprite.x, 
                                this.player.sprite.y, 
                                this.magnetRange, 
                                0xFF1493, 
                                0.2
                            ).setStrokeStyle(2, 0xFF1493, 0.5)
                             .setDepth(900);
                        }
                    }
                    
                    // Only apply effect if we have a valid aura
                    if (this.magnetAura && this.magnetAura.scene) {
                        this.applyMagnetEffect();
                        this.updateMagnetIndicator();
                    } else {
                        // If we couldn't recreate the aura, deactivate the magnet
                        this.deactivateMagnet();
                    }
                }
            }
            
            // Update bird companion
            if (this.birdCompanionActive) {
                this.birdCompanionTime -= delta;
                if (this.birdCompanionTime <= 0) {
                    this.deactivateBirdCompanion();
                }
                this.updateBirdCompanion(delta);
            }
        } catch (error) {
            debugLogger.error("Error updating power-ups:", error);
        }
    }

    updateUI() {
        // Update minimal HUD elements
        this.updateMinimalHUD();
        
        // Update active power-up displays only
        this.updateActivePowerUpDisplay();
        
        // Update debug panel if visible
        if (this.debugMode) {
            this.updateDebugPanel();
        }
    }
    
    updateMinimalHUD() {
        // Update score with enhanced animations
        if (this.scoreText) {
            const formattedScore = this.score.toLocaleString();
            this.scoreText.setText(formattedScore);
            
            // Enhanced animation when score changes
            if (this.lastScore !== this.score) {
                const scoreDiff = this.score - (this.lastScore || 0);
                
                // Scale pulse animation
                this.tweens.add({
                    targets: this.scoreText,
                    scale: { from: 1.2, to: 1 },
                    duration: 300,
                    ease: 'Back.easeOut'
                });
                
                // Color flash for significant score gains
                if (scoreDiff >= 50) {
                    const originalColor = this.scoreText.style.color;
                    this.scoreText.setColor('#f1c40f');
                    
                    this.tweens.add({
                        targets: this.scoreText,
                        alpha: { from: 1, to: 0.8 },
                        duration: 150,
                        yoyo: true,
                        onComplete: () => this.scoreText.setColor(originalColor)
                    });
                }
                
                // Floating score text is now handled by collection system
                
                this.lastScore = this.score;
            }
        }
        
        // Update combo display
        if (this.comboText) {
            if (this.comboCount > 1) {
                const comboText = `x${this.comboCount} COMBO`;
                this.comboText.setText(comboText);
                
                // Enhanced combo animation
                if (!this.comboAnimation || !this.comboAnimation.isPlaying()) {
                    this.comboAnimation = this.tweens.add({
                        targets: this.comboText,
                        scale: { from: 1, to: 1.15 },
                        duration: 400,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                    });
                }
                
                // Color intensity based on combo level
                const comboLevel = Math.min(10, this.comboCount);
                const comboColor = Phaser.Display.Color.Interpolate.ColorWithColor(
                    Phaser.Display.Color.ValueToColor(0xf39c12),
                    Phaser.Display.Color.ValueToColor(0xff6b6b),
                    comboLevel,
                    10
                );
                this.comboText.setTint(Phaser.Display.Color.GetColor(comboColor.r, comboColor.g, comboColor.b));
            } else {
                this.comboText.setText('');
                this.comboText.setTint(0xffffff);
                
                if (this.comboAnimation && this.comboAnimation.isPlaying()) {
                    this.comboAnimation.stop();
                    this.comboText.setScale(1);
                }
            }
        }
        
        // Update stats section
        if (this.speedValue) {
            const speedMultiplier = (this.gameSpeed / this.baseGameSpeed).toFixed(1);
            this.speedValue.setText(`${speedMultiplier}x`);
        }
    }
    
    updatePowerUpStatusPanel() {
        // Update each power-up indicator
        const powerUpStates = {
            shield: { active: this.shieldActive, time: this.shieldTime, maxTime: 3000 },
            speed: { active: this.speedBoostActive, time: this.speedBoostTime, maxTime: 4000 },
            multiplier: { active: this.scoreMultiplierActive, time: this.scoreMultiplierTime, maxTime: 5000 },
            magnet: { active: this.magnetActive, time: this.magnetTime, maxTime: 5000 },
            timeSlow: { active: this.timeSlowActive, time: this.timeSlowTime, maxTime: 6000 },
            companion: { active: this.birdCompanionActive, time: this.birdCompanionTime, maxTime: 15000 }
        };
        
        Object.keys(powerUpStates).forEach(key => {
            const indicator = this.powerUpIndicators[key];
            const state = powerUpStates[key];
            
            if (indicator) {
                if (state.active) {
                    // Show timer
                    const timeLeft = Math.ceil(state.time / 1000);
                    indicator.timer.setText(`${timeLeft}s`);
                    
                    // Update progress bar
                    const progress = state.time / state.maxTime;
                    indicator.progressFill.setDisplaySize(15 * progress, 3);
                    
                    // Active styling
                    indicator.icon.setAlpha(1);
                    indicator.nameLabel.setTint(0xffffff);
                } else {
                    // Inactive styling
                    indicator.timer.setText('');
                    indicator.progressFill.setDisplaySize(0, 3);
                    indicator.icon.setAlpha(0.3);
                    indicator.nameLabel.setTint(0x666666);
                }
            }
        });
    }
    
    updateDebugPanel() {
        if (this.debugElements && this.debugElements.length > 0) {
            const fps = Math.round(this.game.loop.actualFps);
            const objects = this.children.list.length;
            
            this.debugElements[0].setText(`FPS: ${fps}`);
            this.debugElements[1].setText(`Objects: ${objects}`);
            this.debugElements[2].setText(`Memory: ${Math.round(performance.memory?.usedJSHeapSize / 1024 / 1024) || 'N/A'}MB`);
            this.debugElements[3].setText(`Physics: ${this.physics.world.bodies.entries.length}`);
            this.debugElements[4].setText(`Tweens: ${this.tweens.getAllTweens().length}`);
        }
    }
    
    showFloatingScoreText(points) {
        if (!this.scoreText || !this.floatingElements) return;
        
        const floatingText = this.add.text(
            this.scoreText.x + 40, 
            this.scoreText.y - 20, 
            `+${points}`, 
            {
                fontSize: Math.max(14, 16 * this.minScale) + 'px',
                fill: '#f1c40f',
                fontWeight: 'bold',
                stroke: '#2c3e50',
                strokeThickness: 2,
                shadow: {
                    offsetX: 1,
                    offsetY: 1,
                    color: '#000000',
                    blur: 2,
                    fill: true
                }
            }
        ).setOrigin(0, 0.5).setDepth(1502);
        
        this.floatingElements.add(floatingText);
        
        // Enhanced floating animation
        this.tweens.add({
            targets: floatingText,
            y: floatingText.y - 50,
            x: floatingText.x + 15,
            alpha: 0,
            scale: { from: 1, to: 1.5 },
            duration: 1500,
            ease: 'Power2.easeOut',
            onComplete: () => {
                this.floatingElements.remove(floatingText);
                floatingText.destroy();
            }
        });
    }


    addScore(points, isComboable = true) {
        let finalPoints = points;
        
        // Apply combo multiplier
        if (isComboable && this.comboCount > 1) {
            finalPoints *= Math.min(this.comboCount, 10);
        }
        
        // Apply score multiplier
        if (this.scoreMultiplierActive) {
            finalPoints *= this.scoreMultiplier;
        }
        
        // Apply session bonus
        finalPoints *= this.sessionBonusMultiplier;
        
        this.score += Math.floor(finalPoints);
        
        // Update combo
        if (isComboable) {
            this.comboCount++;
            this.maxComboReached = Math.max(this.maxComboReached, this.comboCount);
        }
    }

    resetCombo() {
        this.comboCount = 0;
    }

    takeDamage(damageSource) {
        if (this.shieldActive) {
            this.soundManager.playShieldBlock();
            return;
        }
        
        // Play explosion sound when hitting obstacles
        this.soundManager.playExplosion();
        
        this.player.takeDamage();
        this.updateMinimalHearts();
        this.resetCombo();
        
        // Create impact effect for environmental obstacles
        if (damageSource && damageSource.x && damageSource.y) {
            this.createImpactEffect(damageSource.x, damageSource.y);
        }
        
        if (this.player.health <= 0) {
            this.gameOver();
        }
    }
    
    createImpactEffect(x, y) {
        // Create simple impact effect for hitting fixed obstacles
        
        // Screen shake
        this.cameras.main.shake(300, 0.02);
        
        // Simple particle effect
        if (this.collectParticles) {
            this.collectParticles.setConfig({
                scale: { start: 0.1, end: 0.01 },
                speed: { min: 100, max: 200 },
                lifespan: 800,
                quantity: 15,
                // tint: 0xFF4500 // REMOVED - no tinting
            });
            this.collectParticles.emitParticleAt(x, y);
        }
        
        // Brief flash effect
        const flash = this.add.rectangle(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            this.cameras.main.width,
            this.cameras.main.height,
            0xFF0000
        ).setAlpha(0.3).setDepth(1000);
        
        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 200,
            onComplete: () => flash.destroy()
        });
    }

    getDifficultyMultipliers() {
        const timeElapsed = this.time.now - this.gameStartTime;
        const minutes = timeElapsed / 60000;
        
        return {
            spawnRate: Math.max(0.5, 1 - (minutes * 0.1)),
            movementComplexity: Math.min(1, minutes * 0.2),
            rewardFrequency: Math.max(0.7, 1 - (minutes * 0.05))
        };
    }

    healPlayer(amount = 1) {
        this.player.health = Math.min(this.player.health + amount, this.player.maxHealth);
        this.updateMinimalHearts();
    }

    toggleDebug() {
        this.debugMode = !this.debugMode;
        console.log(`Debug mode: ${this.debugMode ? 'ON' : 'OFF'}`);
        
        // Toggle debug panel visibility
        if (this.debugPanelBg) {
            this.debugPanelBg.setVisible(this.debugMode);
        }
        if (this.debugTitle) {
            this.debugTitle.setVisible(this.debugMode);
        }
        if (this.debugElements) {
            this.debugElements.forEach(element => {
                element.setVisible(this.debugMode);
            });
        }
        
        // Show/hide UI zone visualization
        if (this.debugMode && !this.uiZonesVisualized) {
            this.visualizeUIZones();
            this.uiZonesVisualized = true;
        }
    }

    gameOver() {
        debugLogger.score("Game over triggered with score:", this.score);
        this.gameRunning = false;
        
        // Stop physics and cancel any active tweens
        this.physics.pause();
        this.tweens.killAll();
        
        // Create simple game over screen
        const overlay = this.add.rectangle(this.centerX, this.centerY, 
            this.screenWidth, this.screenHeight, 0x000000, 0.8).setDepth(2000);
        
        const gameOverText = this.add.text(this.centerX, this.centerY - 50, 'GAME OVER', {
            fontSize: '32px',
            fill: '#FF3333',
            fontWeight: 'bold'
        }).setOrigin(0.5).setDepth(2001);
        
        const scoreText = this.add.text(this.centerX, this.centerY, `Score: ${this.score}`, {
            fontSize: '24px',
            fill: '#FFFFFF',
            fontWeight: 'bold'
        }).setOrigin(0.5).setDepth(2001);
        
        const restartText = this.add.text(this.centerX, this.centerY + 50, 'Click to Restart', {
            fontSize: '18px',
            fill: '#00FF00',
            fontWeight: 'bold'
        }).setOrigin(0.5).setInteractive().setDepth(2001);
        
        restartText.on('pointerdown', () => {
            this.scene.restart();
        });
    }

    showFloatingScore(x, y, text, color = '#FFD700') {
        // Calculate safer margins based on screen size
        const safeMarginX = this.screenWidth * 0.15; // Increased margins
        const safeMarginY = this.screenHeight * 0.15;
        
        // Ensure position is well within screen bounds with larger margins
        let clampedX = Phaser.Math.Clamp(x, safeMarginX, this.screenWidth - safeMarginX);
        let clampedY = Phaser.Math.Clamp(y, safeMarginY + 40, this.screenHeight - safeMarginY - 40);
        
        // Ensure floating text is maximum 2 lines
        const formattedText = this.formatTextToTwoLines(text);
        
        // Create floating text with standardized styling
        const style = {
            ...this.getStandardTextStyle('feedback', 'medium'),
            fill: color, // Override color while keeping other standardized properties
            // Better word wrap to prevent text overflowing
            wordWrap: { 
                width: this.screenWidth * 0.3,
                useAdvancedWrap: true 
            }
        };
        const floatingText = this.add.text(clampedX, clampedY, formattedText, style).setOrigin(0.5).setDepth(1500);
        
        // Add glow effect for better visibility
        floatingText.setBlendMode(Phaser.BlendModes.ADD);
        
        // Better scaling and position checking
        let textScale = 1.0;
        
        // Calculate scaled size to ensure text fits on screen
        if (floatingText.width * textScale > this.screenWidth * 0.5) {
            textScale = (this.screenWidth * 0.5) / floatingText.width;
        }
        
        // Final position adjustment after scaling
        const textWidth = floatingText.width * textScale;
        const halfTextWidth = textWidth / 2;
        
        if (clampedX - halfTextWidth < safeMarginX) {
            clampedX = safeMarginX + halfTextWidth;
        } else if (clampedX + halfTextWidth > this.screenWidth - safeMarginX) {
            clampedX = this.screenWidth - safeMarginX - halfTextWidth;
        }
        
        // Update position and apply scale
        floatingText.setPosition(clampedX, clampedY);
        floatingText.setScale(textScale);
        
        // Calculate safe animation distance based on screen height
        const animDistance = Math.min(50, this.screenHeight * 0.06);
        
        // Add a subtle bounce effect to make it more noticeable
        this.tweens.add({
            targets: floatingText,
            y: clampedY - 10,
            scale: floatingText.scale * 1.1,
            duration: 200,
            ease: 'Bounce.easeOut',
            onComplete: () => {
                // Longer animation with slower fade for more visibility time
                this.tweens.add({
                    targets: floatingText,
                    y: clampedY - animDistance,
                    alpha: { from: 1, to: 0 },
                    scale: { from: floatingText.scale, to: floatingText.scale * 0.9 },
                    duration: 1200, // Increased duration for longer on-screen time
                    ease: 'Sine.easeOut', 
                    onComplete: () => {
                        if (floatingText && floatingText.scene) {
                            floatingText.destroy();
                        }
                    }
                });
            }
        });
    }



    triggerHitStop(duration = 50) {
        this.time.timeScale = 0.1;
        this.time.delayedCall(duration, () => {
            this.time.timeScale = 1;
        });
    }
    
    performDash() {
        if (!this.gameRunning || this.isDashing) return;
        
        this.isDashing = true;
        
        // Visual feedback
        // this.player.sprite.setTint(0x00FFFF); // REMOVED - no tinting
        
        // Dash effect - move player forward quickly
        const dashDistance = 100;
        const dashDuration = 200;
        
        this.tweens.add({
            targets: this.player.sprite,
            x: this.player.sprite.x + dashDistance,
            duration: dashDuration,
            ease: 'Power2.easeOut',
            onComplete: () => {
                this.isDashing = false;
                // this.player.sprite.setTint(0xFFFFFF); // REMOVED - no tinting
            }
        });
        
        // Add dash particles
        if (this.collectParticles) {
            this.collectParticles.setPosition(this.player.sprite.x, this.player.sprite.y);
            this.collectParticles.start();
            this.time.delayedCall(dashDuration, () => {
                this.collectParticles.stop();
            });
        }
    }

    // Pause functionality removed

    toggleDebug() {
        this.debugMode = !this.debugMode;
        console.log(`Debug mode: ${this.debugMode ? 'ON' : 'OFF'}`);
        
        // Toggle debug panel visibility
        if (this.debugPanelBg) {
            this.debugPanelBg.setVisible(this.debugMode);
        }
        if (this.debugTitle) {
            this.debugTitle.setVisible(this.debugMode);
        }
        if (this.debugElements) {
            this.debugElements.forEach(element => {
                element.setVisible(this.debugMode);
            });
        }
        
        // Show/hide UI zone visualization
        if (this.debugMode && !this.uiZonesVisualized) {
            this.visualizeUIZones();
            this.uiZonesVisualized = true;
        }
    }

    gameOver() {
        debugLogger.score("Game over triggered with score:", this.score);
        this.gameRunning = false;
        
        // Ensure any tournament/leaderboard UI is hidden to avoid overlay conflicts
        try {
            if (this.leaderboard && typeof this.leaderboard.hideLeaderboard === 'function') {
                this.leaderboard.hideLeaderboard();
            }
        } catch (e) {
            debugLogger.warn('Error hiding leaderboard before game over:', e);
        }

        // Stop physics and cancel any active tweens
        this.physics.pause();
        this.tweens.killAll();
        
        // Create a container for all game over elements with higher depth to prevent overlays
        const gameOverContainer = this.add.container(0, 0).setDepth(2500);
        
        // Show game over screen with darker overlay - immediate darkness
        const overlay = this.add.rectangle(this.centerX, this.centerY, 
            this.screenWidth, this.screenHeight, 0x000000, 0.95).setDepth(2500);
        gameOverContainer.add(overlay);
        
        // SIMPLE, CLEAR GAME OVER TEXT - Following mobile game best practices
        const fontSize = Math.min(48, Math.max(36, Math.floor(this.screenWidth * 0.12))) + 'px';
        
        const gameOverText = this.add.text(this.centerX, this.screenHeight * 0.25, 'GAME OVER', {
            fontSize: fontSize,
            fill: '#FFFFFF',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 6,
            shadow: {
                offsetX: 4,
                offsetY: 4,
                color: '#000000',
                blur: 0,
                fill: true
            }
        }).setOrigin(0.5).setDepth(2501);
        gameOverContainer.add(gameOverText);
        
        // Add a dramatic animation to the game over text
        this.tweens.add({
            targets: gameOverText,
            scale: { from: 0.8, to: 1.05 },
            duration: 400,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.tweens.add({
                    targets: gameOverText,
                    scale: 1,
                    duration: 200,
                    ease: 'Power2.easeOut'
                });
            }
        });
        
        // Clean up any remaining game elements
        this.cleanupGameElements();
        
        // Format score with commas for better readability
        const formattedScore = this.score.toLocaleString();
        
        // LARGE, CLEAR SCORE DISPLAY
        const scoreSize = Math.min(40, Math.max(28, Math.floor(this.screenWidth * 0.08))) + 'px';
        const finalScoreText = this.add.text(this.centerX, this.screenHeight * 0.4, formattedScore, {
            fontSize: scoreSize,
            fill: '#FFD700',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 4,
            shadow: {
                offsetX: 3,
                offsetY: 3,
                color: '#000000',
                blur: 0,
                fill: true
            }
        }).setOrigin(0.5).setAlpha(0).setDepth(2501);
        gameOverContainer.add(finalScoreText);
        
        // Simple score animation
        this.tweens.add({
            targets: finalScoreText,
            alpha: 1,
            scale: { from: 0.8, to: 1 },
            duration: 300,
            delay: 200,
            ease: 'Back.easeOut'
        });
        
        // SIMPLE CONTINUE BUTTON
        const buttonSize = Math.min(32, Math.max(24, Math.floor(this.screenWidth * 0.06))) + 'px';
        const continueButton = this.add.text(this.centerX, this.screenHeight * 0.7, 'TAP TO CONTINUE', {
            fontSize: buttonSize,
            fill: '#FFFFFF',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setAlpha(0).setInteractive().setDepth(2501);
        gameOverContainer.add(continueButton);
        
        // Animate continue button
        this.tweens.add({
            targets: continueButton,
            alpha: 1,
            scale: { from: 0.8, to: 1 },
            duration: 400,
            delay: 600,
            ease: 'Back.easeOut',
            onComplete: () => {
                // Add pulsing animation
                this.tweens.add({
                    targets: continueButton,
                    scale: 1.1,
                    duration: 800,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        });
        
        // Function to handle game continuation
        const continueGame = async () => {
            // Visual feedback before transition
            this.tweens.add({
                targets: [continueButton],
                scale: 0.95,
                duration: 100,
                onComplete: () => {
                    // Prevent multiple clicks
                    overlay.disableInteractive();
                    continueButton.disableInteractive();
                    
                    // Fade out game over elements
                    this.tweens.add({
                        targets: gameOverContainer,
                        alpha: 0,
                        duration: 300,
                        onComplete: async () => {
                            // Clean up
                            gameOverContainer.destroy();
                            
                            // Show leaderboard entry form
                            try {
                                if (this.leaderboard) {
                                    await this.leaderboard.showNameEntryForm(this.score);
                                } else {
                                    debugLogger.error("Leaderboard not available");
                                    this.scene.restart();
                                }
                            } catch (error) {
                                debugLogger.error("Error showing name entry form:", error);
                                this.scene.restart();
                            }
                        }
                    });
                }
            });
        };
        
        // Continue button click handler with debounce protection
        let clickHandled = false;
        continueButton.on('pointerdown', () => {
            if (!clickHandled) {
                clickHandled = true;
                continueGame();
            }
        });
        
        // Make entire overlay clickable for easier mobile interaction
        overlay.setInteractive();
        overlay.on('pointerdown', () => {
            if (!clickHandled) {
                clickHandled = true;
                continueGame();
            }
        });
    }
    
    cleanupGameElements() {
        // Clean up any active power-ups
        this.deactivateShield();
        this.deactivateSpeedBoost();
        this.deactivateScoreMultiplier();
        this.deactivateTimeSlow();
        this.deactivateMagnet();
        this.deactivateBirdCompanion();
        
        // Ensure all tweens are killed
        this.tweens.killAll();
        
        // Stop all sounds that might be playing
        if (this.soundManager && this.soundManager.audioContext) {
            // Safely stop any ongoing sounds by creating a silent oscillator
            try {
                const silentGain = this.soundManager.audioContext.createGain();
                silentGain.gain.value = 0;
                silentGain.connect(this.soundManager.audioContext.destination);
                
                // This effectively stops all sounds by disconnecting them
                if (this.soundManager.audioContext.state === 'running') {
                    this.soundManager.audioContext.suspend();
                    setTimeout(() => {
                        if (this.soundManager.audioContext) {
                            this.soundManager.audioContext.resume();
                        }
                    }, 100);
                }
            } catch (error) {
                debugLogger.warn('Error stopping sounds:', error);
            }
        }
    }

    getDifficultyMultipliers() {
        const timeElapsed = this.time.now - this.gameStartTime;
        const minutes = timeElapsed / 60000;
        
        return {
            spawnRate: Math.max(0.5, 1 - (minutes * 0.1)),
            movementComplexity: Math.min(1, minutes * 0.2),
            rewardFrequency: Math.max(0.7, 1 - (minutes * 0.05))
        };
    }
    
    getDifficultyLevel() {
        // Calculate difficulty level (0-10) based on time and distance
        const timeElapsed = this.time.now - this.gameStartTime;
        const minutes = timeElapsed / 60000;
        const distanceLevel = Math.floor(this.distanceTraveled / 1000);
        
        // Combine time and distance factors
        const level = Math.floor(minutes) + Math.floor(distanceLevel / 5);
        
        return Math.min(level, 10); // Cap at level 10
    }
    // FIXED: Shield activation with proper duration parameter
    activateShield(duration = 3000) {
        this.shieldActive = true;
        this.shieldTime = duration;
        this.player.setShield(true);
        
        // Visual feedback
        this.triggerHitStop(60);
        
        // Shield indicator will be created by updateShieldIndicator()
    }

    deactivateShield() {
        this.shieldActive = false;
        this.shieldTime = 0;
        if (this.shieldIndicator) {
            this.shieldIndicator.setText('');
        }
        this.player.setShield(false);
    }

    // FIXED: Speed boost with proper duration parameter
    activateSpeedBoost(duration = 4000) {
        try {
            console.log('🚀 Speed boost activation started, duration:', duration);
            this.speedBoostActive = true;
            this.speedBoostTime = duration;
            
            // Visual feedback
            // this.player.sprite.setTint(0x32CD32); // REMOVED - no tinting
            this.updateSpeedBoostIndicator();
            
            // Play speed boost sound
            if (this.soundManager && this.soundManager.playPowerUp) {
                this.soundManager.playPowerUp();
            }
            
            console.log('✅ Speed boost activated successfully');
        } catch (error) {
            console.error('❌ Error in activateSpeedBoost:', error);
            // Don't let this crash the game
        }
    }

    deactivateSpeedBoost() {
        this.speedBoostActive = false;
        this.speedBoostTime = 0;
        this.player.sprite.clearTint();
        // Speed boost indicator removed - handled by main power-up system
    }
    
    // FIXED: Score multiplier with proper parameters
    activateScoreMultiplier(multiplier = 2.0, duration = 5000) {
        this.scoreMultiplierActive = true;
        this.scoreMultiplier = multiplier; // Use the provided multiplier
        this.scoreMultiplierTime = duration;
        
        // Visual feedback
        this.triggerHitStop(60);
        // Score multiplier indicator handled by main power-up system
    }
    
    deactivateScoreMultiplier() {
        this.scoreMultiplierActive = false;
        this.scoreMultiplier = 1.0; // Reset to default
        this.scoreMultiplierTime = 0;
        // Score multiplier indicator handled by main power-up system
    }
    
    // FIXED: Time slow with proper duration parameter
    activateTimeSlow(duration = 6000) {
        this.timeSlowActive = true;
        this.timeSlowTime = duration;
        this.timeSlowFactor = 0.6; // 40% slower obstacles
        
        // Time slow indicator will be created by updateTimeSlowIndicator()
        
        // Visual feedback
        const slowOverlay = this.add.rectangle(
            this.centerX, this.centerY,
            this.screenWidth, this.screenHeight,
            0x9966FF, 0.2
        ).setDepth(1400);
        
        this.tweens.add({
            targets: slowOverlay,
            alpha: 0,
            duration: duration,
            onComplete: () => slowOverlay.destroy()
        });
    }
    
    deactivateTimeSlow() {
        this.timeSlowActive = false;
        this.timeSlowTime = 0;
        this.timeSlowFactor = 1.0; // Normal speed
        if (this.timeSlowIndicator) {
            this.timeSlowIndicator.setText('');
        }
    }
    
    updateSpeedBoostIndicator() {
        // Speed boost indicator removed - handled by main power-up system with ⚡ icon
    }
    
    updateScoreMultiplierIndicator() {
        // Score multiplier indicator removed - handled by main power-up system with 👨‍💼 icon
    }
    
    updateShieldIndicator() {
        // Shield indicator removed - handled by main power-up system with 🥐 icon
    }
    
    updateTimeSlowIndicator() {
        if (!this.timeSlowIndicator && this.timeSlowActive) {
            const position = this.responsiveUtils.getIndicatorPosition(3); // Fourth indicator
            this.timeSlowIndicator = this.add.text(position.x, position.y, '', 
                this.getStandardTextStyle('powerup', 'small')).setDepth(1000);
        }
        
        if (this.timeSlowIndicator) {
            if (this.timeSlowActive) {
                const timeLeft = Math.ceil(this.timeSlowTime / 1000);
                this.timeSlowIndicator.setText(`Time Slow\n${timeLeft}s`);
            } else {
                this.timeSlowIndicator.setText('');
            }
        }
    }
    
    // FIXED: Magnet with proper duration parameter
    activateMagnet(duration = 5000) {
        try {
            this.magnetActive = true;
            this.magnetTime = duration;
            this.magnetRange = 150; // Pixel range for magnet effect
            
            // Make sure any existing aura is destroyed first
            if (this.magnetAura) {
                this.magnetAura.destroy();
                this.magnetAura = null;
            }
            
            // Check if player is available
            if (!this.player || !this.player.sprite || !this.player.sprite.active) {
                debugLogger.warn("Cannot activate magnet - player sprite not available");
                return;
            }
            
            // Visual effect on player
            this.magnetAura = this.add.circle(
                this.player.sprite.x, 
                this.player.sprite.y, 
                this.magnetRange, 
                0xFF1493, 
                0.2
            ).setStrokeStyle(2, 0xFF1493, 0.5)
             .setDepth(900);
            
            // Pulsing animation - with null check to prevent errors
            if (this.magnetAura) {
                // Store reference to the tween for cleanup
                this.magnetTween = this.tweens.add({
                    targets: this.magnetAura,
                    radius: this.magnetRange + 20,
                    alpha: 0.1,
                    duration: 1000,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
            
            this.updateMagnetIndicator();
        } catch (error) {
            debugLogger.error("Error activating magnet:", error);
        }
    }
    
    deactivateMagnet() {
        try {
            this.magnetActive = false;
            this.magnetTime = 0;
            
            // Stop the tween if it exists
            if (this.magnetTween) {
                this.tweens.remove(this.magnetTween);
                this.magnetTween = null;
            }
            
            // Safely destroy the aura
            if (this.magnetAura) {
                try {
                    this.magnetAura.destroy();
                } catch (error) {
                    debugLogger.warn("Error destroying magnetAura:", error);
                }
                this.magnetAura = null;
            }
            
            // Update the indicator
            if (this.magnetIndicator) {
                this.magnetIndicator.setText('');
            }
        } catch (error) {
            debugLogger.error("Error deactivating magnet:", error);
            // Ensure magnetAura is nullified even if there's an error
            this.magnetAura = null;
        }
    }
    
    updateMagnetIndicator() {
        if (!this.magnetIndicator) {
            const margin = Math.max(24, 28 * this.minScale);
            const indicatorY = margin + (Math.max(12, 14 * this.minScale) * 5.4);
            this.magnetIndicator = this.add.text(margin, indicatorY, '', {
                fontSize: Math.max(14, 16 * this.minScale) + 'px', // Smaller font size
                fill: '#FF1493',
                fontWeight: 'bold'
            }).setDepth(1000);
        }
        // Use shorter text format to prevent overflow
        this.magnetIndicator.setText(`Magnet
${Math.ceil(this.magnetTime / 1000)}s`);
    }
    
    applyMagnetEffect() {
        try {
            // Update magnet aura position - with additional safety checks
            if (this.magnetAura && this.player && this.player.sprite && this.player.sprite.active) {
                this.magnetAura.x = this.player.sprite.x;
                this.magnetAura.y = this.player.sprite.y;
            }
            
            // Skip if player or collectible manager is not available
            if (!this.player || !this.player.sprite || !this.collectibleManager || !this.collectibleManager.coffeeBeans) {
                return;
            }
            
            // Attract nearby beans
            this.collectibleManager.coffeeBeans.children.entries.forEach(bean => {
                if (!bean || !bean.active) return;
                
                const distance = Phaser.Math.Distance.Between(
                    this.player.sprite.x, this.player.sprite.y,
                    bean.x, bean.y
                );
                
                if (distance < this.magnetRange) {
                    // Calculate attraction force
                    const angle = Phaser.Math.Angle.Between(
                        bean.x, bean.y,
                        this.player.sprite.x, this.player.sprite.y
                    );
                    
                    const force = (this.magnetRange - distance) / this.magnetRange;
                    const speed = 300 * force;
                    
                    bean.x += Math.cos(angle) * speed * (this.game.loop.delta / 1000);
                    bean.y += Math.sin(angle) * speed * (this.game.loop.delta / 1000);
                }
            });
        } catch (error) {
            debugLogger.error("Error in applyMagnetEffect:", error);
        }
    }
    // FIXED: Bird companion activation with proper parameters
    activateBirdCompanion(type, duration) {
        debugLogger.effect('=== ACTIVATING BIRD COMPANION ===');
        debugLogger.effect('Type:', type);
        debugLogger.effect('Duration:', duration);
        
        // Safety check
        if (!this.player || !this.player.sprite) {
            debugLogger.error('Cannot activate bird companion - player not ready');
            return;
        }
        
        this.birdCompanionActive = true;
        this.birdCompanionTime = duration;
        this.birdCompanionType = type;
        
        // Create bird companion sprite
        this.createBirdCompanion(type);
        
        // Visual feedback
        this.triggerHitStop(80);
        this.updateBirdCompanionIndicator();
        
        debugLogger.effect('Bird companion activated successfully');
    }
    
    createBirdCompanion(type) {
        if (this.birdCompanion) {
            this.birdCompanion.destroy();
        }
        
        // Safety check
        if (!this.player || !this.player.sprite) {
            debugLogger.warn('Cannot create bird companion - player not ready');
            return;
        }
        
        // Determine texture based on bird type
        const textureMap = {
            'sparrow': 'sparrowCompanion',
            'robin': 'robinCompanion',
            'cardinal': 'cardinalCompanion'
        };
        const texture = textureMap[type] || 'sparrowCompanion';
        
        // Create bird companion sprite
        this.birdCompanion = this.physics.add.sprite(
            this.player.sprite.x + 50, 
            this.player.sprite.y - 30, 
            texture
        ).setDepth(950);
        
        // Disable physics interactions for the companion
        this.birdCompanion.body.setAllowGravity(false);
        this.birdCompanion.body.setImmovable(true);
        
        // FIXED: Apply bird-specific properties with consistent values
        let scale, speed, radius;
        switch (type) {
            case 'sparrow':
                scale = 0.8;
                speed = 1.0;
                radius = 80;
                break;
            case 'robin':
                scale = 1.0;
                speed = 1.3;
                radius = 100;
                break;
            case 'cardinal':
                scale = 1.2;
                speed = 1.5;
                radius = 120;
                break;
            default:
                scale = 1.0;
                speed = 1.0;
                radius = 80;
        }
        
        // Increase bird companion size by ~25%
        this.birdCompanion.setScale(0.175 * scale);
        this.birdCompanion.setData('speed', speed);
        this.birdCompanionCollectionRadius = radius;
        
        // Add gentle flying animation
        this.tweens.add({
            targets: this.birdCompanion,
            y: this.birdCompanion.y - 10,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
    
    updateBirdCompanion(delta) {
        if (!this.birdCompanion || !this.birdCompanionActive) return;
        
        // Safety check for player
        if (!this.player || !this.player.sprite) return;
        
        // Follow player with some offset and smoothing
        const targetX = this.player.sprite.x + 40;
        const targetY = this.player.sprite.y - 25;
        const speed = this.birdCompanion.getData('speed') || 1.0;
        
        this.birdCompanion.x += (targetX - this.birdCompanion.x) * 0.1 * speed;
        this.birdCompanion.y += (targetY - this.birdCompanion.y) * 0.08 * speed;
        
        // Auto-collect nearby coffee cups
        this.collectibleManager.coffeeBeans.children.entries.forEach(item => {
            if (item.active && item.visible && !item.getData('beingCollected')) {
                const distance = Phaser.Math.Distance.Between(
                    this.birdCompanion.x, this.birdCompanion.y,
                    item.x, item.y
                );
                
                if (distance < this.birdCompanionCollectionRadius) {
                    // Mark as being collected to prevent multiple attempts
                    item.setData('beingCollected', true);
                    
                    // Animate item towards bird then collect it
                    this.tweens.add({
                        targets: item,
                        x: this.birdCompanion.x,
                        y: this.birdCompanion.y,
                        duration: 200,
                        ease: 'Power2.easeOut',
                        onComplete: () => {
                            if (item.active && item.scene) {
                                try {
                                    this.collectibleManager.collectBean(this.player.sprite, item);
                                } catch (error) {
                                    debugLogger.warn('Bird collection error:', error);
                                    // Safely remove the item if collection fails
                                    if (item.scene) {
                                        this.collectibleManager.coffeeBeans.remove(item);
                                        this.collectibleManager.beanPool.release(item);
                                    }
                                }
                            }
                        }
                    });
                }
            }
        });
    }
    
    deactivateBirdCompanion() {
        this.birdCompanionActive = false;
        
        // Cancel any existing tweens on the bird companion to prevent conflicts
        if (this.birdCompanion) {
            this.tweens.killTweensOf(this.birdCompanion);
            
            // Fly away animation with guaranteed cleanup
            this.tweens.add({
                targets: this.birdCompanion,
                x: this.birdCompanion.x + 200,
                y: this.birdCompanion.y - 100,
                alpha: 0,
                duration: 800,
                ease: 'Power2.easeOut',
                onComplete: () => {
                    if (this.birdCompanion && this.birdCompanion.scene) {
                        this.birdCompanion.destroy();
                    }
                    this.birdCompanion = null;
                }
            });
            
            // Safety timeout to ensure cleanup even if tween fails
            this.time.delayedCall(1000, () => {
                if (this.birdCompanion && this.birdCompanion.scene) {
                    this.birdCompanion.destroy();
                    this.birdCompanion = null;
                }
            });
        }
        
        this.updateBirdCompanionIndicator();
    }
    
    // Add stub for achievement tracking to prevent errors
    incrementAchievement(achievementId, amount = 1) {
        // Stub implementation - will be replaced with actual achievement system later
        debugLogger.score(`Achievement progress: ${achievementId} +${amount}`);
    }
    
    updateBirdCompanionIndicator() {
        // Create or update bird companion indicator
        if (this.birdCompanionActive && !this.birdCompanionIndicator) {
            const margin = Math.max(20, 20 * this.minScale);
            this.birdCompanionIndicator = this.add.text(this.screenWidth - margin, 210, '🐦', {
                fontSize: Math.max(32, 40 * this.minScale) + 'px'
            }).setOrigin(1, 0).setDepth(1000);
        } else if (!this.birdCompanionActive && this.birdCompanionIndicator) {
            this.birdCompanionIndicator.destroy();
            this.birdCompanionIndicator = null;
        }
    }

    // Duplicate methods removed - using the ones with responsive positioning above

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
