// Phaser is loaded globally from CDN
import SVGAssets from './svgAssets.js';
import debugLogger from './debugLogger.js';
import { UI, ANIMATIONS, SCREEN } from './constants.js';

export default class PreloaderScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloaderScene' });
        this.svgAssets = new SVGAssets();
    }

    preload() {
        // Load custom background image
        this.load.image('customBackground', './birddashbackground.png');
        
        // Create loading bar
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Background
        this.add.rectangle(width/2, height/2, width, height, 0x2D1B00);
        
        // Title
        const titleText = this.add.text(width/2, height/2 - 100, 'Bird Dash', {
            fontSize: '48px',
            fill: '#FFD700',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        // Loading text
        const loadingText = this.add.text(width/2, height/2 + 50, 'Loading...', {
            fontSize: '24px',
            fill: '#FFFFFF'
        }).setOrigin(0.5);
        
        // Progress bar background
        const progressBarBg = this.add.rectangle(width/2, height/2, 320, 30, 0x666666);
        progressBarBg.setStrokeStyle(2, 0xFFFFFF);
        
        // Progress bar fill
        const progressBar = this.add.rectangle(width/2 - 160, height/2, 0, 26, 0xFFD700);
        progressBar.setOrigin(0, 0.5);
        
        // Loading percentage
        const percentText = this.add.text(width/2, height/2, '0%', {
            fontSize: '18px',
            fill: '#000000',
            fontWeight: 'bold'
        }).setOrigin(0.5);
        
        // Update progress bar
        this.load.on('progress', (value) => {
            progressBar.width = 316 * value;
            percentText.setText(Math.floor(value * 100) + '%');
        });
        
        // Load complete
        this.load.on('complete', () => {
            // Immediately show the single landing screen with How to Play + Start
            // Hide loading artifacts
            loadingText.setVisible(false);
            this.showGameIntro();
        });
        
        // Load the custom PNG images
        this.load.image('getBirdMascot', 'birddash.png');
        this.load.image('smoothie', 'birddashsmoothie.png');
        this.load.image('coffeeBean', 'caravan.png');
        this.load.image('baristaNPC', 'barista.png');
        
        // Create essential emoji textures synchronously
        this.createEssentialTextures();
        
        // Add some fun loading tips
        const tips = [
            'Tip: Collect beans in a row to build combos!',
            'Tip: Swipe down or press Shift to dash!',
            'Tip: You have 3 hearts - stay safe!',
            'Tip: Look out for rare power-ups!',
            'Tip: Higher combos = higher scores!',
            'Tip: Time your dashes to avoid obstacles!'
        ];
        
        const tipText = this.add.text(width/2, height - 50, Phaser.Math.RND.pick(tips), {
            fontSize: '16px',
            fill: '#FFD700',
            wordWrap: { width: width - 40 }
        }).setOrigin(0.5);
    }

    async createEmojiTextures() {
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        
        // Create textures using SVG assets when available
        const texturePromises = [
            // Core assets - getBirdMascot and smoothie are now loaded as PNG, skip emoji creation
            this.createEmojiTexture('coffeeBean', '☕', { size: 256 }),
            this.createEmojiTexture('bagel', '🥯', { size: 256 }),
            this.createEmojiTexture('spilledCoffeeCup', '🥤', { size: 256 }),
            
            // Power-ups
            this.createEmojiTexture('croissantShieldPowerUp', '🥐', { size: 256 }),
            this.createEmojiTexture('espressoShot', '⚡', { size: 256 }),
            this.createEmojiTexture('websterPowerUp', '👨‍💼', { size: 256 }),
            this.createEmojiTexture('thaboPowerUp', '👨‍🍳', { size: 256 }),
            this.createEmojiTexture('magnetPowerUp', '🧲', { size: 256 }),
            this.createEmojiTexture('timeFreezePowerUp', '⏱️', { size: 256 }),
            this.createEmojiTexture('healthPowerUp', '❤️', { size: 256 }),
            
            // Bird companions
            this.createEmojiTexture('sparrowCompanion', '🐦', { size: 256 }),
            this.createEmojiTexture('robinCompanion', '🦅', { size: 256 }),
            this.createEmojiTexture('cardinalCompanion', '🦜', { size: 256 }),
            
            // Fixed Environmental Obstacles
            this.createEmojiTexture('tree', '🌳', { size: 256 }),
            this.createEmojiTexture('building', '🏢', { size: 256 }),
            this.createEmojiTexture('pipe', '🟢', { size: 256 }),
            this.createEmojiTexture('mountain', '🏔️', { size: 256 }),
            this.createEmojiTexture('cloud', '☁️', { size: 256 }),
            
            // Old obstacles (keeping for compatibility)
            this.createEmojiTexture('brokenCoffeeMachine', '🚧', { size: 256 }),
            this.createEmojiTexture('angryCustomer', '😠', { size: 256 }),
            this.createEmojiTexture('wiFiDeadZone', '📵', { size: 256 }),
            
            // Other
            this.createEmojiTexture('baristaNPC', '☕', { size: 256 })
        ];
        
        // Wait for all textures to load
        await Promise.all(texturePromises);
        
        // DEBUG: List all available textures
        console.log('🔍 Available textures after loading:');
        const textureKeys = this.textures.getTextureKeys();
        textureKeys.forEach((key) => {
            if (key.includes('bomb')) {
                console.log(`✅ Bomb texture found: ${key}`);
            }
        });
        
        // Background texture (wide, to allow wrapping)
        this.createCityBackgroundTexture('coffeeCityBackground', Math.max(1920, screenWidth * 3), Math.max(720, Math.ceil(screenHeight * 1.1)));
    }

    createEssentialTextures() {
        // Create only the most essential textures synchronously to avoid async loading issues
        // These are the textures that the game immediately needs to function
        
        const essentialTextures = [
            // Core collectibles (coffeeBean now loaded as PNG)
            { key: 'bagel', emoji: '🥯' },
            
            // Obstacles
            { key: 'brokenCoffeeMachine', emoji: '🚧' },
            { key: 'spilledCoffeeCup', emoji: '🥤' },
            { key: 'angryCustomer', emoji: '😠' },
            { key: 'wiFiDeadZone', emoji: '📵' },
            
            // Power-ups
            { key: 'croissantShieldPowerUp', emoji: '🥐' },
            { key: 'espressoShot', emoji: '⚡' },
            { key: 'websterPowerUp', emoji: '👨‍💼' },
            { key: 'thaboPowerUp', emoji: '👨‍🍳' },
            { key: 'magnetPowerUp', emoji: '🧲' },
            { key: 'timeFreezePowerUp', emoji: '⏱️' },
            { key: 'healthPowerUp', emoji: '❤️' },
            
            // Bird companions - DISABLED (no longer spawning)
            // { key: 'sparrowCompanion', emoji: '🐦' },
            // { key: 'robinCompanion', emoji: '🦅' },
            // { key: 'cardinalCompanion', emoji: '🦜' }
        ];
        
        essentialTextures.forEach(({ key, emoji }) => {
            this.createSimpleEmojiTexture(key, emoji, 256);
        });
        
        console.log('🎨 Essential textures created synchronously');
    }
    
    createSimpleEmojiTexture(key, emoji, size) {
        // Simple synchronous emoji texture creation
        const rt = this.add.renderTexture(0, 0, size, size);
        
        // Create text with emoji
        const text = this.add.text(size / 2, size / 2, emoji, {
            fontSize: Math.floor(size * 0.8) + 'px',
            align: 'center'
        }).setOrigin(0.5);
        
        // Draw to render texture
        rt.draw(text);
        
        // Create texture from render texture
        rt.saveTexture(key);
        
        // Clean up
        text.destroy();
        rt.destroy();
    }
    
    async createEmojiTexture(textureKey, emoji, options = {}) {
        const size = options.size || 128;
        const width = options.width || size;
        const height = options.height || size;
        
        // For bomb, force direct emoji rendering to avoid SVG caching issues
        if (textureKey === 'bombObstacleNew' || textureKey === 'bombObstacle') {
            // Skip SVG completely and go straight to emoji rendering
            console.log(`⚠️ Forcing direct emoji rendering for: ${textureKey}`);
            // Fall through to emoji rendering below
        } else if (this.svgAssets.assets[textureKey]) {
            try {
                const svgString = this.svgAssets.assets[textureKey]();
                await this.svgAssets.createSVGTexture(this, textureKey, svgString, width, height);
                return;
            } catch (error) {
                debugLogger.warn(`Failed to create SVG texture for ${textureKey}, falling back to emoji:`, error);
            }
        }
        
        // Fallback to emoji
        const rt = this.add.renderTexture(0, 0, width, height);
        
        // Transparent background by default with stroke/shadow for clarity
        const fontPx = Math.floor(Math.min(width, height) * 0.84);
        const strokePx = Math.max(2, Math.floor(fontPx * 0.08));
        const emojiText = this.add.text(0, 0, emoji, {
            fontSize: `${fontPx}px`,
            align: 'center',
            stroke: '#000000',
            strokeThickness: strokePx
        }).setOrigin(0.5);
        emojiText.setShadow(0, 2, '#000000', Math.max(2, Math.floor(strokePx * 0.8)), true, true);
        
        emojiText.setPosition(width / 2, height / 2);
        rt.draw(emojiText);
        rt.saveTexture(textureKey);
        
        emojiText.destroy();
        rt.destroy();
    }
    
    createCityBackgroundTexture(textureKey, width, height) {
        const rt = this.add.renderTexture(0, 0, width, height);
        const g = this.add.graphics();
        
        // Sky gradient
        const skyTop = 0x9fd3ff; // light blue
        const skyBottom = 0x6fb8f0;
        g.fillGradientStyle(skyTop, skyTop, skyBottom, skyBottom, 1);
        g.fillRect(0, 0, width, height);
        rt.draw(g);
        g.clear();
        
        // Sun
        g.fillStyle(0xFFF59D, 1);
        g.fillCircle(Math.floor(width * 0.15), Math.floor(height * 0.2), Math.floor(height * 0.08));
        rt.draw(g);
        g.clear();
        
        // Clouds
        g.fillStyle(0xFFFFFF, 0.9);
        for (let i = 0; i < 12; i++) {
            const cx = Phaser.Math.Between(0, width);
            const cy = Phaser.Math.Between(Math.floor(height * 0.05), Math.floor(height * 0.4));
            const r = Phaser.Math.Between(Math.floor(height * 0.02), Math.floor(height * 0.05));
            g.fillCircle(cx, cy, r);
            g.fillCircle(cx + r, cy + Math.floor(r * 0.2), Math.floor(r * 0.9));
            g.fillCircle(cx - r, cy + Math.floor(r * 0.2), Math.floor(r * 0.8));
        }
        rt.draw(g);
        g.clear();
        
        // Horizon and ground
        const horizonY = Math.floor(height * 0.82);
        g.fillStyle(0x3f2a1d, 1);
        g.fillRect(0, horizonY, width, height - horizonY);
        rt.draw(g);
        g.clear();
        
        // Buildings row with subtle perspective
        const buildings = ['🏢', '🏬', '🏫', '🏦', '🏨'];
        let x = 0;
        while (x < width) {
            const emoji = Phaser.Utils.Array.GetRandom(buildings);
            const size = Phaser.Math.Between(Math.floor(height * 0.16), Math.floor(height * 0.22));
            const building = this.add.text(0, 0, emoji, { fontSize: `${size}px` }).setOrigin(0.5, 1);
            const y = horizonY;
            building.setPosition(x + building.width / 2 + Phaser.Math.Between(8, 24), y);
            rt.draw(building);
            x += building.width + Phaser.Math.Between(8, 24);
            building.destroy();
        }
        
        // Foreground accents
        const accents = ['🌳', '🌴', '🌲', '☕', '🥐'];
        for (let i = 0; i < 20; i++) {
            const em = this.add.text(0, 0, Phaser.Utils.Array.GetRandom(accents), {
                fontSize: `${Phaser.Math.Between(Math.floor(height * 0.04), Math.floor(height * 0.06))}px`
            }).setOrigin(0.5, 1);
            em.setPosition(Phaser.Math.Between(0, width), horizonY);
            em.setAlpha(0.7);
            rt.draw(em);
            em.destroy();
        }
        
        rt.saveTexture(textureKey);
        rt.destroy();
    }
    
    create() {
        // Assets are loaded/generated, but we wait for user click in the complete handler
    }
    
    showGameIntro() {
        // Create a group for intro elements
        const introGroup = this.add.group();
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Use custom background image
        const bgImage = this.add.image(width/2, height/2, 'customBackground')
            .setDisplaySize(width, height)
            .setDepth(100);
        introGroup.add(bgImage);
        
        // Add semi-transparent overlay for better text readability
        const overlay = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.4).setDepth(101);
        introGroup.add(overlay);
        
        // Add subtle animated coffee-themed background elements
        const bgElements = ['☕', '🐦', '🥤'];
        for (let i = 0; i < 6; i++) {
            const element = this.add.text(
                Phaser.Math.Between(width * 0.1, width * 0.9),
                Phaser.Math.Between(height * 0.1, height * 0.9),
                Phaser.Utils.Array.GetRandom(bgElements),
                { fontSize: Phaser.Math.Between(16, 28) + 'px' }
            ).setAlpha(0.05).setDepth(102);
            
            // Add gentle floating animation to background elements
            this.tweens.add({
                targets: element,
                y: element.y + Phaser.Math.Between(-15, 15),
                x: element.x + Phaser.Math.Between(-10, 10),
                duration: Phaser.Math.Between(4000, 8000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            
            introGroup.add(element);
        }
        
        // HEADER SECTION - Optimized for 16:9 aspect ratio
        const titleFontSize = Math.max(24, Math.min(32, width * 0.065)) + 'px';
        const title = this.add.text(width/2, height * 0.12, 'BirdDash', {
            fontSize: titleFontSize,
            fill: '#FFD700',
            fontWeight: 'bold',
            stroke: '#8B4513',
            strokeThickness: 4,
            shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 6, fill: true }
        }).setOrigin(0.5).setDepth(103);
        introGroup.add(title);
        
        // Add golden glow animation to title
        this.tweens.add({
            targets: title,
            alpha: 0.8,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        const subtitleFontSize = Math.max(12, Math.min(16, width * 0.035)) + 'px';
        const subtitle = this.add.text(width/2, height * 0.18, 'Coffee Shop Runner', {
            fontSize: subtitleFontSize,
            fill: '#DEB887',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(103);
        introGroup.add(subtitle);
        
        // Bird mascot - smaller and better positioned for 16:9
        const mascotScale = Math.max(0.12, Math.min(0.2, width * 0.0003));
        const mascot = this.add.image(width * 0.82, height * 0.15, 'getBirdMascot')
            .setScale(mascotScale)
            .setDepth(104);
        introGroup.add(mascot);
        
        // Enhanced floating animation for mascot
        this.tweens.add({
            targets: mascot,
            y: mascot.y - 15,
            rotation: 0.08,
            duration: 1800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // MAIN CONTENT - Optimized for 16:9 aspect ratio
        const contentStartY = height * 0.28;
        const sectionSpacing = height * 0.04;
        const itemSpacing = height * 0.025;
        
        // Smaller, more compact font sizes for 16:9
        const sectionTitleSize = Math.max(14, Math.min(18, width * 0.038)) + 'px';
        const contentTextSize = Math.max(10, Math.min(13, width * 0.028)) + 'px';
        const iconSize = Math.max(12, Math.min(18, width * 0.035)) + 'px';
        
        // HOW TO PLAY SECTION - Enhanced with better visual hierarchy
        const howToPlayTitle = this.add.text(width/2, contentStartY, 'HOW TO PLAY', {
            fontSize: sectionTitleSize,
            fill: '#FFD700',
            fontWeight: 'bold',
            stroke: '#8B4513',
            strokeThickness: 3,
            shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true }
        }).setOrigin(0.5).setDepth(103);
        introGroup.add(howToPlayTitle);
        
        // Controls with better formatting
        const controls = [
            '• Tap to make bird fly up',
            '• Release to let bird fall down', 
            '• Collect coffee and power-ups',
            '• Avoid obstacles to survive'
        ];
        
        let currentY = contentStartY + sectionSpacing;
        
        controls.forEach((control, index) => {
            const controlText = this.add.text(width * 0.1, currentY, control, {
                fontSize: contentTextSize,
                fill: '#F5DEB3',
                stroke: '#000000',
                strokeThickness: 1,
                wordWrap: { width: width * 0.8 }
            }).setOrigin(0, 0.5).setDepth(103);
            introGroup.add(controlText);
            currentY += itemSpacing;
        });
        
        // COLLECTIBLES SECTION - Enhanced with actual game items
        currentY += sectionSpacing * 0.8;
        
        const collectiblesTitle = this.add.text(width/2, currentY, 'COLLECTIBLES', {
            fontSize: sectionTitleSize,
            fill: '#FFD700',
            fontWeight: 'bold',
            stroke: '#8B4513',
            strokeThickness: 3,
            shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true }
        }).setOrigin(0.5).setDepth(102);
        introGroup.add(collectiblesTitle);
        
        currentY += sectionSpacing;
        
        // Simplified collectibles for better fit
        const collectibles = [
            { icon: '☕', text: 'Coffee: Score points' },
            { icon: '🥤', text: 'Smoothies: Health & speed' }
        ];
        
        collectibles.forEach((item) => {
            const itemIcon = this.add.text(width * 0.15, currentY, item.icon, {
                fontSize: iconSize,
                stroke: '#000000',
                strokeThickness: 1
            }).setOrigin(0.5).setDepth(102);
            
            const itemText = this.add.text(width * 0.25, currentY, item.text, {
                fontSize: contentTextSize,
                fill: '#F5DEB3',
                stroke: '#000000',
                strokeThickness: 1,
                wordWrap: { width: width * 0.65 }
            }).setOrigin(0, 0.5).setDepth(102);
            
            introGroup.add(itemIcon);
            introGroup.add(itemText);
            currentY += itemSpacing;
        });
        
        // POWER-UPS SECTION - Updated with actual power-ups
        currentY += sectionSpacing * 0.8;
        
        const powerUpsTitle = this.add.text(width/2, currentY, 'POWER-UPS', {
            fontSize: sectionTitleSize,
            fill: '#FFD700',
            fontWeight: 'bold',
            stroke: '#8B4513',
            strokeThickness: 3,
            shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true }
        }).setOrigin(0.5).setDepth(102);
        introGroup.add(powerUpsTitle);
        
        currentY += sectionSpacing;
        
        // Simplified power-ups for better fit
        const powerUps = [
            { icon: '🥐', text: 'Shield: Invulnerability' },
            { icon: '⚡', text: 'Speed Boost: Move faster' }
        ];
        
        powerUps.forEach((item) => {
            const itemIcon = this.add.text(width * 0.15, currentY, item.icon, {
                fontSize: iconSize,
                stroke: '#000000',
                strokeThickness: 1
            }).setOrigin(0.5).setDepth(102);
            
            const itemText = this.add.text(width * 0.25, currentY, item.text, {
                fontSize: contentTextSize,
                fill: '#F5DEB3',
                stroke: '#000000',
                strokeThickness: 1,
                wordWrap: { width: width * 0.65 }
            }).setOrigin(0, 0.5).setDepth(102);
            
            introGroup.add(itemIcon);
            introGroup.add(itemText);
            currentY += itemSpacing;
        });
        
        // START BUTTON - Optimized for 16:9 aspect ratio
        const buttonY = Math.min(currentY + height * 0.04, height * 0.85);
        
        // Smaller button for better 16:9 fit
        const buttonWidth = Math.min(width * 0.5, 240);
        const buttonHeight = Math.max(height * 0.06, 40);
        
        // Create button with coffee brown gradient effect
        const buttonBg = this.add.rectangle(width/2, buttonY, buttonWidth, buttonHeight, 0x8B4513)
            .setStrokeStyle(4, 0xFFD700)
            .setDepth(102);
        introGroup.add(buttonBg);
        
        // Add inner glow effect
        const buttonGlow = this.add.rectangle(width/2, buttonY, buttonWidth - 8, buttonHeight - 8, 0xD2691E, 0.3)
            .setDepth(102);
        introGroup.add(buttonGlow);
        
        const buttonFontSize = Math.max(14, Math.min(18, width * 0.04)) + 'px';
        
        const startButton = this.add.text(width/2, buttonY, 'START GAME', {
            fontSize: buttonFontSize,
            fill: '#FFD700',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 3,
            shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true }
        }).setOrigin(0.5).setDepth(103).setInteractive();
        introGroup.add(startButton);
        
        // Make button interactive
        buttonBg.setInteractive();
        buttonGlow.setInteractive();
        
        // Enhanced pulsing animation
        this.tweens.add({
            targets: [buttonBg, buttonGlow, startButton],
            scaleX: 1.08,
            scaleY: 1.08,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Subtle glow animation
        this.tweens.add({
            targets: buttonGlow,
            alpha: 0.6,
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Enhanced start game function with better feedback
        const startGame = () => {
            console.log('🎮 START GAME button clicked!');
            try {
                // Enhanced visual feedback
                this.tweens.add({
                    targets: [buttonBg, buttonGlow, startButton],
                    scaleX: 0.92,
                    scaleY: 0.92,
                    duration: 120,
                    yoyo: true,
                    onComplete: () => {
                        console.log('🎮 Button animation complete, starting GameScene...');
                        this.time.delayedCall(80, () => {
                            try {
                                introGroup.destroy();
                                console.log('🎮 Attempting to start GameScene...');
                                this.scene.start('GameScene');
                            } catch (error) {
                                console.error('❌ Error starting GameScene:', error);
                            }
                        });
                    }
                });
            } catch (error) {
                console.error('❌ Error in startGame function:', error);
            }
        };
        
        // Enhanced touch event listeners
        startButton.on('pointerdown', startGame);
        buttonBg.on('pointerdown', startGame);
        buttonGlow.on('pointerdown', startGame);
        
        // Larger touch area for better mobile experience
        const touchArea = this.add.rectangle(
            width/2, 
            buttonY, 
            buttonWidth + 30, 
            buttonHeight + 30
        ).setAlpha(0).setInteractive().setDepth(101);
        introGroup.add(touchArea);
        touchArea.on('pointerdown', startGame);
    }

}
