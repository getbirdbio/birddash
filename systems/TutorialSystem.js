// TutorialSystem - Interactive user onboarding system
// Addresses bmad UX analysis: "No user onboarding" critical issue
// Provides guided first-time user experience with coffee-themed storytelling

export default class TutorialSystem {
    constructor(scene) {
        this.scene = scene;
        this.isActive = false;
        this.currentStep = 0;
        this.tutorialSteps = [];
        this.tutorialElements = new Map();
        this.playerProgress = {
            hasPlayedBefore: false,
            tutorialCompleted: false,
            skipRequested: false
        };
        
        this.loadPlayerProgress();
        this.initializeTutorialSteps();
    }

    loadPlayerProgress() {
        // Check localStorage for previous play sessions
        try {
            const progress = localStorage.getItem('birddash_tutorial_progress');
            if (progress) {
                this.playerProgress = { ...this.playerProgress, ...JSON.parse(progress) };
            }
        } catch (error) {
            console.warn('Could not load tutorial progress:', error);
        }
    }

    savePlayerProgress() {
        try {
            localStorage.setItem('birddash_tutorial_progress', JSON.stringify(this.playerProgress));
        } catch (error) {
            console.warn('Could not save tutorial progress:', error);
        }
    }

    initializeTutorialSteps() {
        this.tutorialSteps = [
            {
                id: 'welcome',
                title: 'Welcome to BirdDash!',
                content: 'Help our coffee-loving bird collect beans and avoid obstacles in this caffeinated adventure!',
                icon: '☕',
                action: 'showWelcomeScreen',
                duration: 3000,
                skippable: true
            },
            {
                id: 'controls_intro',
                title: 'Basic Controls',
                content: this.scene.sys.game.device.input.touch 
                    ? 'Tap anywhere on the screen to make your bird fly upward!'
                    : 'Press SPACEBAR or click to make your bird fly upward!',
                icon: this.scene.sys.game.device.input.touch ? '📱' : '⌨️',
                action: 'demonstrateControls',
                duration: 0, // Wait for user input
                skippable: false
            },
            {
                id: 'gravity_explanation',
                title: 'Master the Flight',
                content: 'Your bird is affected by gravity. Time your taps to navigate through obstacles!',
                icon: '🐦',
                action: 'demonstrateGravity',
                duration: 4000,
                skippable: true
            },
            {
                id: 'collectibles_intro',
                title: 'Collect Coffee Items',
                content: 'Gather coffee beans, smoothies, and bagels for points. Each item has different values!',
                icon: '☕',
                action: 'showCollectibleTypes',
                duration: 5000,
                skippable: true
            },
            {
                id: 'obstacles_warning',
                title: 'Avoid Obstacles',
                content: 'Watch out for spilled cups and other coffee shop hazards. They will end your flight!',
                icon: '⚠️',
                action: 'demonstrateObstacles',
                duration: 4000,
                skippable: true
            },
            {
                id: 'powerups_intro',
                title: 'Power-Up Magic',
                content: 'Special power-ups give you shields, speed boosts, magnets, and more amazing abilities!',
                icon: '⚡',
                action: 'showPowerUpTypes',
                duration: 5000,
                skippable: true
            },
            {
                id: 'scoring_system',
                title: 'Score & Combos',
                content: 'Collect items consecutively to build combos for bonus points. Higher combos = bigger rewards!',
                icon: '🎯',
                action: 'demonstrateScoring',
                duration: 4000,
                skippable: true
            },
            {
                id: 'practice_flight',
                title: 'Practice Flight',
                content: 'Now try a short practice flight! Collect 5 coffee items to continue.',
                icon: '🎓',
                action: 'startPracticeFlight',
                duration: 0, // Wait for completion
                skippable: false
            },
            {
                id: 'tutorial_complete',
                title: 'Ready to Fly!',
                content: 'Excellent! You\'re now ready for the full BirdDash experience. Good luck, coffee pilot!',
                icon: '🎉',
                action: 'completeTutorial',
                duration: 3000,
                skippable: true
            }
        ];
    }

    shouldShowTutorial() {
        return !this.playerProgress.tutorialCompleted && !this.playerProgress.skipRequested;
    }

    startTutorial() {
        if (!this.shouldShowTutorial()) {
            return false;
        }

        console.log('🎓 Starting BirdDash tutorial');
        this.isActive = true;
        this.currentStep = 0;
        
        // Pause normal game systems
        this.pauseGameSystems();
        
        // Create tutorial UI
        this.createTutorialUI();
        
        // Start first step
        this.executeStep(0);
        
        return true;
    }

    pauseGameSystems() {
        // Prevent normal game start
        if (this.scene.gameStateManager) {
            this.scene.gameStateManager.pauseGame();
        }
        
        // Disable normal input
        if (this.scene.input) {
            this.scene.input.enabled = false;
        }
        
        // Pause obstacle and collectible spawning
        if (this.scene.obstacleManager) {
            this.scene.obstacleManager.pauseSpawning();
        }
        if (this.scene.collectibleManager) {
            this.scene.collectibleManager.pauseSpawning();
        }
    }

    resumeGameSystems() {
        // Resume normal game systems
        if (this.scene.gameStateManager) {
            this.scene.gameStateManager.resumeGame();
        }
        
        // Re-enable input
        if (this.scene.input) {
            this.scene.input.enabled = true;
        }
        
        // Resume spawning
        if (this.scene.obstacleManager) {
            this.scene.obstacleManager.resumeSpawning();
        }
        if (this.scene.collectibleManager) {
            this.scene.collectibleManager.resumeSpawning();
        }
    }

    createTutorialUI() {
        const centerX = this.scene.cameras.main.centerX;
        const centerY = this.scene.cameras.main.centerY;
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        // Main tutorial container
        const tutorialContainer = this.scene.add.container(0, 0);
        tutorialContainer.setScrollFactor(0);
        tutorialContainer.setDepth(1000);

        // Semi-transparent overlay
        const overlay = this.scene.add.rectangle(centerX, centerY, width, height, 0x2D1B00, 0.85);
        
        // Tutorial panel
        const panelWidth = Math.min(400, width - 40);
        const panelHeight = 300;
        const panel = this.scene.add.rectangle(centerX, centerY + 50, panelWidth, panelHeight, 0x1A0F00, 0.95);
        panel.setStrokeStyle(3, 0xFFD700);
        
        // Title text
        const titleText = this.scene.add.text(centerX, centerY - 50, '', {
            fontSize: '28px',
            fill: '#FFD700',
            fontWeight: 'bold',
            align: 'center',
            wordWrap: { width: panelWidth - 40 }
        }).setOrigin(0.5);
        
        // Content text
        const contentText = this.scene.add.text(centerX, centerY + 20, '', {
            fontSize: '18px',
            fill: '#FFFFFF',
            align: 'center',
            wordWrap: { width: panelWidth - 40 }
        }).setOrigin(0.5);
        
        // Progress indicator
        const progressText = this.scene.add.text(centerX, centerY + 120, '', {
            fontSize: '14px',
            fill: '#CCCCCC',
            align: 'center'
        }).setOrigin(0.5);
        
        // Skip button
        const skipButton = this.createTutorialButton(width - 80, 50, 'Skip Tutorial', () => {
            this.skipTutorial();
        }, 0xFF5722);
        
        // Next button
        const nextButton = this.createTutorialButton(centerX + 100, centerY + 120, 'Next', () => {
            this.nextStep();
        }, 0x4CAF50);
        
        // Previous button (initially hidden)
        const prevButton = this.createTutorialButton(centerX - 100, centerY + 120, 'Back', () => {
            this.previousStep();
        }, 0x2196F3);
        prevButton.setVisible(false);

        tutorialContainer.add([overlay, panel, titleText, contentText, progressText, skipButton, nextButton, prevButton]);
        
        // Store references
        this.tutorialElements.set('container', tutorialContainer);
        this.tutorialElements.set('titleText', titleText);
        this.tutorialElements.set('contentText', contentText);
        this.tutorialElements.set('progressText', progressText);
        this.tutorialElements.set('nextButton', nextButton);
        this.tutorialElements.set('prevButton', prevButton);
        this.tutorialElements.set('skipButton', skipButton);
    }

    createTutorialButton(x, y, text, callback, color = 0x4CAF50) {
        const container = this.scene.add.container(x, y);
        
        const bg = this.scene.add.rectangle(0, 0, 120, 35, color, 0.8);
        bg.setStrokeStyle(2, 0xFFFFFF);
        bg.setInteractive();
        
        const buttonText = this.scene.add.text(0, 0, text, {
            fontSize: '14px',
            fill: '#FFFFFF',
            fontWeight: 'bold'
        }).setOrigin(0.5);
        
        container.add([bg, buttonText]);
        
        // Button interactions
        bg.on('pointerover', () => {
            bg.setAlpha(1);
            container.setScale(1.05);
        });
        
        bg.on('pointerout', () => {
            bg.setAlpha(0.8);
            container.setScale(1);
        });
        
        bg.on('pointerdown', () => {
            container.setScale(0.95);
        });
        
        bg.on('pointerup', () => {
            container.setScale(1);
            if (callback) callback();
        });
        
        return container;
    }

    executeStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= this.tutorialSteps.length) {
            return;
        }

        const step = this.tutorialSteps[stepIndex];
        console.log(`🎓 Tutorial step: ${step.id}`);
        
        this.currentStep = stepIndex;
        this.updateTutorialDisplay(step);
        
        // Execute step-specific action
        if (step.action && this[step.action]) {
            this[step.action](step);
        }
        
        // Auto-advance after duration (if specified)
        if (step.duration > 0) {
            this.scene.time.delayedCall(step.duration, () => {
                if (this.isActive && this.currentStep === stepIndex) {
                    this.nextStep();
                }
            });
        }
    }

    updateTutorialDisplay(step) {
        const titleText = this.tutorialElements.get('titleText');
        const contentText = this.tutorialElements.get('contentText');
        const progressText = this.tutorialElements.get('progressText');
        const nextButton = this.tutorialElements.get('nextButton');
        const prevButton = this.tutorialElements.get('prevButton');
        
        if (titleText) {
            titleText.setText(`${step.icon} ${step.title}`);
        }
        
        if (contentText) {
            contentText.setText(step.content);
        }
        
        if (progressText) {
            progressText.setText(`Step ${this.currentStep + 1} of ${this.tutorialSteps.length}`);
        }
        
        // Show/hide navigation buttons
        if (nextButton) {
            nextButton.setVisible(step.skippable || step.duration > 0);
        }
        
        if (prevButton) {
            prevButton.setVisible(this.currentStep > 0);
        }
    }

    nextStep() {
        if (this.currentStep < this.tutorialSteps.length - 1) {
            this.executeStep(this.currentStep + 1);
        } else {
            this.completeTutorial();
        }
    }

    previousStep() {
        if (this.currentStep > 0) {
            this.executeStep(this.currentStep - 1);
        }
    }

    skipTutorial() {
        console.log('🎓 Tutorial skipped by user');
        this.playerProgress.skipRequested = true;
        this.savePlayerProgress();
        this.endTutorial();
    }

    completeTutorial() {
        console.log('🎓 Tutorial completed!');
        this.playerProgress.tutorialCompleted = true;
        this.savePlayerProgress();
        this.endTutorial();
        
        // Show completion celebration
        this.showTutorialCompletionReward();
    }

    endTutorial() {
        this.isActive = false;
        this.currentStep = 0;
        
        // Clean up tutorial UI
        this.cleanupTutorialUI();
        
        // Resume normal game systems
        this.resumeGameSystems();
        
        // Start the actual game
        if (this.scene.gameStateManager) {
            this.scene.gameStateManager.startGame();
        }
        
        this.scene.events.emit('tutorialCompleted');
    }

    cleanupTutorialUI() {
        const container = this.tutorialElements.get('container');
        if (container) {
            container.destroy();
        }
        this.tutorialElements.clear();
    }

    // Step-specific actions
    showWelcomeScreen(step) {
        // Create animated coffee bean particles
        this.createWelcomeParticles();
    }

    demonstrateControls(step) {
        // Show visual control demonstration
        this.createControlDemonstration();
        
        // Wait for user input
        const inputHandler = () => {
            this.scene.input.off('pointerdown', inputHandler);
            this.scene.input.keyboard.off('keydown-SPACE', inputHandler);
            this.nextStep();
        };
        
        this.scene.input.on('pointerdown', inputHandler);
        if (this.scene.input.keyboard) {
            this.scene.input.keyboard.on('keydown-SPACE', inputHandler);
        }
    }

    demonstrateGravity(step) {
        // Show animated bird falling and flying
        this.createGravityDemo();
    }

    showCollectibleTypes(step) {
        // Display different collectible types with point values
        this.createCollectibleShowcase();
    }

    demonstrateObstacles(step) {
        // Show obstacle types and danger indicators
        this.createObstacleShowcase();
    }

    showPowerUpTypes(step) {
        // Display power-up types and their effects
        this.createPowerUpShowcase();
    }

    demonstrateScoring(step) {
        // Show scoring animation and combo system
        this.createScoringDemo();
    }

    startPracticeFlight(step) {
        // Enable limited gameplay for practice
        this.enablePracticeMode();
    }

    // Visual demonstrations
    createWelcomeParticles() {
        // Create floating coffee bean particles
        const centerX = this.scene.cameras.main.centerX;
        const centerY = this.scene.cameras.main.centerY;
        
        for (let i = 0; i < 8; i++) {
            const bean = this.scene.add.text(
                centerX + (Math.random() - 0.5) * 300,
                centerY + (Math.random() - 0.5) * 200,
                '☕',
                { fontSize: '24px' }
            ).setScrollFactor(0).setDepth(999);
            
            this.scene.tweens.add({
                targets: bean,
                y: bean.y - 100,
                rotation: Math.PI * 2,
                alpha: 0,
                duration: 3000,
                ease: 'Power2',
                onComplete: () => bean.destroy()
            });
        }
    }

    createControlDemonstration() {
        const centerX = this.scene.cameras.main.centerX;
        const centerY = this.scene.cameras.main.centerY;
        
        // Create demo bird
        const demoBird = this.scene.add.text(centerX - 100, centerY, '🐦', {
            fontSize: '32px'
        }).setScrollFactor(0).setDepth(999);
        
        // Create pulsing input indicator
        const inputIcon = this.scene.add.text(centerX + 100, centerY, 
            this.scene.sys.game.device.input.touch ? '👆' : '⌨️', {
            fontSize: '48px'
        }).setScrollFactor(0).setDepth(999);
        
        // Animate input indicator
        this.scene.tweens.add({
            targets: inputIcon,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
        
        // Store for cleanup
        this.tutorialElements.set('demoBird', demoBird);
        this.tutorialElements.set('inputIcon', inputIcon);
    }

    createGravityDemo() {
        const demoBird = this.tutorialElements.get('demoBird');
        if (demoBird) {
            // Animate bird falling and flying
            this.scene.tweens.add({
                targets: demoBird,
                y: demoBird.y + 50,
                duration: 1000,
                yoyo: true,
                repeat: 2,
                ease: 'Power2'
            });
        }
    }

    createCollectibleShowcase() {
        const centerX = this.scene.cameras.main.centerX;
        const centerY = this.scene.cameras.main.centerY;
        
        const collectibles = [
            { icon: '☕', name: 'Coffee Bean', points: '10-25 pts' },
            { icon: '🥤', name: 'Smoothie', points: '30-60 pts' },
            { icon: '🥯', name: 'Bagel', points: '40-80 pts' }
        ];
        
        collectibles.forEach((item, index) => {
            const container = this.scene.add.container(
                centerX - 100 + (index * 100),
                centerY - 100
            );
            
            const icon = this.scene.add.text(0, -20, item.icon, {
                fontSize: '32px'
            }).setOrigin(0.5);
            
            const name = this.scene.add.text(0, 10, item.name, {
                fontSize: '12px',
                fill: '#FFFFFF'
            }).setOrigin(0.5);
            
            const points = this.scene.add.text(0, 25, item.points, {
                fontSize: '10px',
                fill: '#FFD700'
            }).setOrigin(0.5);
            
            container.add([icon, name, points]);
            container.setScrollFactor(0).setDepth(999);
            
            // Gentle floating animation
            this.scene.tweens.add({
                targets: container,
                y: container.y - 10,
                duration: 2000 + (index * 200),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });
    }

    createObstacleShowcase() {
        const centerX = this.scene.cameras.main.centerX;
        const centerY = this.scene.cameras.main.centerY;
        
        // Show warning obstacles
        const obstacles = ['🥤', '☕', '🧱'];
        
        obstacles.forEach((obstacle, index) => {
            const warning = this.scene.add.container(
                centerX - 50 + (index * 50),
                centerY - 100
            );
            
            const icon = this.scene.add.text(0, 0, obstacle, {
                fontSize: '24px'
            }).setOrigin(0.5);
            
            const warningIcon = this.scene.add.text(0, -30, '⚠️', {
                fontSize: '16px'
            }).setOrigin(0.5);
            
            warning.add([icon, warningIcon]);
            warning.setScrollFactor(0).setDepth(999);
            
            // Pulsing warning animation
            this.scene.tweens.add({
                targets: warningIcon,
                alpha: 0.3,
                duration: 500,
                yoyo: true,
                repeat: -1
            });
        });
    }

    createPowerUpShowcase() {
        const centerX = this.scene.cameras.main.centerX;
        
        const powerUps = [
            { icon: '🛡️', name: 'Shield' },
            { icon: '⚡', name: 'Speed' },
            { icon: '🧲', name: 'Magnet' }
        ];
        
        powerUps.forEach((powerUp, index) => {
            const container = this.scene.add.container(
                centerX - 75 + (index * 75),
                this.scene.cameras.main.centerY - 80
            );
            
            const icon = this.scene.add.text(0, 0, powerUp.icon, {
                fontSize: '28px'
            }).setOrigin(0.5);
            
            const name = this.scene.add.text(0, 25, powerUp.name, {
                fontSize: '12px',
                fill: '#FFFFFF'
            }).setOrigin(0.5);
            
            container.add([icon, name]);
            container.setScrollFactor(0).setDepth(999);
            
            // Glowing effect
            this.scene.tweens.add({
                targets: icon,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 800 + (index * 100),
                yoyo: true,
                repeat: -1
            });
        });
    }

    createScoringDemo() {
        const centerX = this.scene.cameras.main.centerX;
        const centerY = this.scene.cameras.main.centerY;
        
        // Show scoring animation
        const scores = ['+10', '+20', '+40', 'COMBO x3!'];
        
        scores.forEach((score, index) => {
            this.scene.time.delayedCall(index * 800, () => {
                const scoreText = this.scene.add.text(
                    centerX + (Math.random() - 0.5) * 200,
                    centerY - 50,
                    score,
                    {
                        fontSize: '20px',
                        fill: index === 3 ? '#FF9800' : '#FFD700',
                        fontWeight: 'bold'
                    }
                ).setOrigin(0.5).setScrollFactor(0).setDepth(999);
                
                this.scene.tweens.add({
                    targets: scoreText,
                    y: scoreText.y - 50,
                    alpha: 0,
                    duration: 1500,
                    onComplete: () => scoreText.destroy()
                });
            });
        });
    }

    enablePracticeMode() {
        // Enable limited gameplay for tutorial practice
        this.practiceMode = {
            active: true,
            itemsCollected: 0,
            targetItems: 5
        };
        
        // Resume some game systems for practice
        if (this.scene.collectibleManager) {
            this.scene.collectibleManager.resumeSpawning();
        }
        
        // Listen for collectible collection
        this.scene.events.on('collectibleGathered', this.onPracticeItemCollected, this);
        
        // Update tutorial display
        const contentText = this.tutorialElements.get('contentText');
        if (contentText) {
            contentText.setText(`Collect coffee items! Progress: ${this.practiceMode.itemsCollected}/${this.practiceMode.targetItems}`);
        }
    }

    onPracticeItemCollected() {
        if (!this.practiceMode || !this.practiceMode.active) return;
        
        this.practiceMode.itemsCollected++;
        
        // Update progress
        const contentText = this.tutorialElements.get('contentText');
        if (contentText) {
            contentText.setText(`Great! Progress: ${this.practiceMode.itemsCollected}/${this.practiceMode.targetItems}`);
        }
        
        // Check completion
        if (this.practiceMode.itemsCollected >= this.practiceMode.targetItems) {
            this.practiceMode.active = false;
            this.scene.events.off('collectibleGathered', this.onPracticeItemCollected, this);
            
            // Pause spawning again
            if (this.scene.collectibleManager) {
                this.scene.collectibleManager.pauseSpawning();
            }
            
            // Continue to next step
            this.scene.time.delayedCall(1000, () => {
                this.nextStep();
            });
        }
    }

    showTutorialCompletionReward() {
        // Give player a small bonus for completing tutorial
        const bonus = 100;
        
        this.scene.events.emit('tutorialReward', {
            type: 'score',
            amount: bonus,
            message: 'Tutorial Completion Bonus!'
        });
    }

    // Public methods for external access
    isTutorialActive() {
        return this.isActive;
    }

    getCurrentStep() {
        return this.currentStep;
    }

    getTutorialProgress() {
        return this.playerProgress;
    }

    // Cleanup
    cleanup() {
        this.cleanupTutorialUI();
        this.scene.events.off('collectibleGathered', this.onPracticeItemCollected, this);
        this.isActive = false;
    }
}
