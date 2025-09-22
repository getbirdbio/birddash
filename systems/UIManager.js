// UIManager - Centralized UI management system
// Extracted from gameScene.js to separate UI concerns from game logic

export default class UIManager {
    constructor(scene) {
        this.scene = scene;
        this.uiElements = new Map();
        this.animations = new Map();
        this.isInitialized = false;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for game state changes
        this.scene.events.on('gameStarted', this.onGameStarted, this);
        this.scene.events.on('gameEnded', this.onGameEnded, this);
        this.scene.events.on('gamePaused', this.onGamePaused, this);
        this.scene.events.on('gameResumed', this.onGameResumed, this);
        this.scene.events.on('scoreUpdated', this.onScoreUpdated, this);
        this.scene.events.on('levelUp', this.onLevelUp, this);
        this.scene.events.on('comboIncreased', this.onComboIncreased, this);
        this.scene.events.on('comboReset', this.onComboReset, this);
        this.scene.events.on('achievementUnlocked', this.onAchievementUnlocked, this);
        this.scene.events.on('milestoneReached', this.onMilestoneReached, this);
    }

    // Initialize UI elements
    createUI() {
        console.log('🎨 UIManager: Creating game UI');
        
        this.createGameplayUI();
        this.createPowerUpIndicators();
        this.createNotificationSystem();
        this.createPauseMenu();
        this.createGameOverScreen();
        
        this.isInitialized = true;
        
        // Start with gameplay UI visible
        this.showGameplayUI();
    }

    createGameplayUI() {
        const centerX = this.scene.cameras.main.centerX;
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        // Score display
        const scoreContainer = this.scene.add.container(width - 20, 20);
        scoreContainer.setScrollFactor(0);
        
        const scoreBg = this.scene.add.rectangle(0, 0, 200, 50, 0x000000, 0.5);
        scoreBg.setStrokeStyle(2, 0xFFD700);
        
        const scoreIcon = this.scene.add.text(-80, 0, '☕', {
            fontSize: '24px',
            fill: '#FFD700'
        }).setOrigin(0.5);
        
        const scoreText = this.scene.add.text(0, 0, '0', {
            fontSize: '24px',
            fill: '#FFFFFF',
            fontWeight: 'bold',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        scoreContainer.add([scoreBg, scoreIcon, scoreText]);
        this.uiElements.set('scoreContainer', scoreContainer);
        this.uiElements.set('scoreText', scoreText);

        // Level indicator
        const levelContainer = this.scene.add.container(20, 20);
        levelContainer.setScrollFactor(0);
        
        const levelBg = this.scene.add.rectangle(0, 0, 120, 40, 0x000000, 0.5);
        levelBg.setStrokeStyle(2, 0x4CAF50);
        
        const levelText = this.scene.add.text(0, 0, 'Level 1', {
            fontSize: '18px',
            fill: '#4CAF50',
            fontWeight: 'bold'
        }).setOrigin(0.5);

        levelContainer.add([levelBg, levelText]);
        this.uiElements.set('levelContainer', levelContainer);
        this.uiElements.set('levelText', levelText);

        // Combo indicator (initially hidden)
        const comboContainer = this.scene.add.container(centerX, 100);
        comboContainer.setScrollFactor(0);
        comboContainer.setVisible(false);
        
        const comboBg = this.scene.add.rectangle(0, 0, 150, 40, 0x000000, 0.7);
        comboBg.setStrokeStyle(2, 0xFF9800);
        
        const comboText = this.scene.add.text(0, 0, 'COMBO x1', {
            fontSize: '20px',
            fill: '#FF9800',
            fontWeight: 'bold'
        }).setOrigin(0.5);

        comboContainer.add([comboBg, comboText]);
        this.uiElements.set('comboContainer', comboContainer);
        this.uiElements.set('comboText', comboText);

        // Distance indicator
        const distanceContainer = this.scene.add.container(20, height - 60);
        distanceContainer.setScrollFactor(0);
        
        const distanceBg = this.scene.add.rectangle(0, 0, 160, 35, 0x000000, 0.5);
        distanceBg.setStrokeStyle(2, 0x2196F3);
        
        const distanceText = this.scene.add.text(0, 0, '0m', {
            fontSize: '16px',
            fill: '#2196F3',
            fontWeight: 'bold'
        }).setOrigin(0.5);

        distanceContainer.add([distanceBg, distanceText]);
        this.uiElements.set('distanceContainer', distanceContainer);
        this.uiElements.set('distanceText', distanceText);

        // Mobile controls hint (for mobile devices)
        if (this.scene.sys.game.device.input.touch) {
            const controlsHint = this.scene.add.text(centerX, height - 100, '📱 Tap to Fly!', {
                fontSize: '18px',
                fill: '#FFFFFF',
                backgroundColor: '#000000',
                padding: { x: 10, y: 5 }
            }).setOrigin(0.5).setScrollFactor(0);
            
            this.uiElements.set('controlsHint', controlsHint);
            
            // Hide after 3 seconds
            this.scene.time.delayedCall(3000, () => {
                if (controlsHint) {
                    this.scene.tweens.add({
                        targets: controlsHint,
                        alpha: 0,
                        duration: 1000,
                        onComplete: () => controlsHint.destroy()
                    });
                }
            });
        }
    }

    createPowerUpIndicators() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        // Power-up status container
        const powerUpContainer = this.scene.add.container(width - 20, height - 120);
        powerUpContainer.setScrollFactor(0);
        
        this.uiElements.set('powerUpContainer', powerUpContainer);
        this.powerUpIndicators = new Map();
    }

    createNotificationSystem() {
        // Container for floating notifications
        const notificationContainer = this.scene.add.container(0, 0);
        notificationContainer.setScrollFactor(0);
        notificationContainer.setDepth(1000);
        
        this.uiElements.set('notificationContainer', notificationContainer);
        this.notifications = [];
    }

    createPauseMenu() {
        const centerX = this.scene.cameras.main.centerX;
        const centerY = this.scene.cameras.main.centerY;
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        // Pause menu container (initially hidden)
        const pauseContainer = this.scene.add.container(centerX, centerY);
        pauseContainer.setScrollFactor(0);
        pauseContainer.setVisible(false);
        pauseContainer.setDepth(100);

        // Semi-transparent overlay
        const overlay = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.7);
        
        // Menu background
        const menuBg = this.scene.add.rectangle(0, 0, 300, 400, 0x2D1B00, 0.9);
        menuBg.setStrokeStyle(3, 0xFFD700);
        
        // Title
        const title = this.scene.add.text(0, -120, '⏸️ PAUSED', {
            fontSize: '32px',
            fill: '#FFD700',
            fontWeight: 'bold'
        }).setOrigin(0.5);
        
        // Resume button
        const resumeBtn = this.createButton(0, -40, 'Resume Game', () => {
            if (this.scene.gameStateManager) {
                this.scene.gameStateManager.resumeGame();
            }
        });
        
        // Restart button
        const restartBtn = this.createButton(0, 20, 'Restart Game', () => {
            this.hidePauseMenu();
            this.scene.scene.restart();
        });
        
        // Main menu button
        const mainMenuBtn = this.createButton(0, 80, 'Main Menu', () => {
            this.hidePauseMenu();
            // Navigate to main menu (would need main menu scene)
            console.log('Navigate to main menu');
        });

        pauseContainer.add([overlay, menuBg, title, resumeBtn, restartBtn, mainMenuBtn]);
        this.uiElements.set('pauseContainer', pauseContainer);
    }

    createGameOverScreen() {
        const centerX = this.scene.cameras.main.centerX;
        const centerY = this.scene.cameras.main.centerY;
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        // Game over container (initially hidden)
        const gameOverContainer = this.scene.add.container(centerX, centerY);
        gameOverContainer.setScrollFactor(0);
        gameOverContainer.setVisible(false);
        gameOverContainer.setDepth(100);

        // Semi-transparent overlay
        const overlay = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.8);
        
        // Menu background
        const menuBg = this.scene.add.rectangle(0, 0, 400, 500, 0x2D1B00, 0.9);
        menuBg.setStrokeStyle(3, 0xFFD700);
        
        // Game Over title
        const title = this.scene.add.text(0, -180, '☕ Game Over!', {
            fontSize: '36px',
            fill: '#FFD700',
            fontWeight: 'bold'
        }).setOrigin(0.5);
        
        // Score display
        const finalScoreText = this.scene.add.text(0, -120, 'Final Score: 0', {
            fontSize: '24px',
            fill: '#FFFFFF',
            fontWeight: 'bold'
        }).setOrigin(0.5);
        
        // Stats display
        const statsText = this.scene.add.text(0, -60, '', {
            fontSize: '16px',
            fill: '#CCCCCC',
            align: 'center'
        }).setOrigin(0.5);
        
        // Play again button
        const playAgainBtn = this.createButton(0, 20, 'Play Again', () => {
            this.hideGameOverScreen();
            this.scene.scene.restart();
        });
        
        // Share score button
        const shareBtn = this.createButton(0, 80, 'Share Score', () => {
            this.shareScore();
        });
        
        // Main menu button
        const mainMenuBtn = this.createButton(0, 140, 'Main Menu', () => {
            this.hideGameOverScreen();
            console.log('Navigate to main menu');
        });

        gameOverContainer.add([overlay, menuBg, title, finalScoreText, statsText, playAgainBtn, shareBtn, mainMenuBtn]);
        this.uiElements.set('gameOverContainer', gameOverContainer);
        this.uiElements.set('finalScoreText', finalScoreText);
        this.uiElements.set('gameOverStatsText', statsText);
    }

    createButton(x, y, text, callback) {
        const container = this.scene.add.container(x, y);
        
        const bg = this.scene.add.rectangle(0, 0, 200, 40, 0x4CAF50, 0.8);
        bg.setStrokeStyle(2, 0xFFFFFF);
        bg.setInteractive();
        
        const buttonText = this.scene.add.text(0, 0, text, {
            fontSize: '18px',
            fill: '#FFFFFF',
            fontWeight: 'bold'
        }).setOrigin(0.5);
        
        container.add([bg, buttonText]);
        
        // Button interactions
        bg.on('pointerover', () => {
            bg.setFillStyle(0x66BB6A);
            container.setScale(1.05);
        });
        
        bg.on('pointerout', () => {
            bg.setFillStyle(0x4CAF50);
            container.setScale(1);
        });
        
        bg.on('pointerdown', () => {
            container.setScale(0.95);
        });
        
        bg.on('pointerup', () => {
            container.setScale(1.05);
            if (callback) callback();
        });
        
        return container;
    }

    // Event handlers
    onGameStarted(gameState) {
        this.showGameplayUI();
        this.updateScore(0);
        this.updateLevel(1);
        this.updateDistance(0);
    }

    onGameEnded(data) {
        this.showGameOverScreen(data);
    }

    onGamePaused() {
        this.showPauseMenu();
    }

    onGameResumed() {
        this.hidePauseMenu();
    }

    onScoreUpdated(data) {
        this.updateScore(data.totalScore);
        
        // Show score popup for significant gains
        if (data.points > 50) {
            this.showScorePopup(data.points, data.source);
        }
    }

    onLevelUp(data) {
        this.updateLevel(data.newLevel);
        this.showLevelUpNotification(data);
    }

    onComboIncreased(comboCount) {
        this.updateCombo(comboCount);
    }

    onComboReset() {
        this.hideCombo();
    }

    onAchievementUnlocked(achievement) {
        this.showAchievementNotification(achievement);
    }

    onMilestoneReached(milestone) {
        this.showMilestoneNotification(milestone);
    }

    // UI update methods
    updateScore(score) {
        const scoreText = this.uiElements.get('scoreText');
        if (scoreText) {
            scoreText.setText(score.toLocaleString());
            
            // Animate score update
            this.scene.tweens.add({
                targets: scoreText,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 100,
                yoyo: true
            });
        }
    }

    updateLevel(level) {
        const levelText = this.uiElements.get('levelText');
        if (levelText) {
            levelText.setText(`Level ${level}`);
        }
    }

    updateDistance(distance) {
        const distanceText = this.uiElements.get('distanceText');
        if (distanceText) {
            distanceText.setText(`${Math.floor(distance)}m`);
        }
    }

    updateCombo(comboCount) {
        const comboContainer = this.uiElements.get('comboContainer');
        const comboText = this.uiElements.get('comboText');
        
        if (comboContainer && comboText) {
            if (comboCount > 1) {
                comboContainer.setVisible(true);
                comboText.setText(`COMBO x${comboCount}`);
                
                // Animate combo
                this.scene.tweens.add({
                    targets: comboContainer,
                    scaleX: 1.1,
                    scaleY: 1.1,
                    duration: 150,
                    yoyo: true
                });
            }
        }
    }

    hideCombo() {
        const comboContainer = this.uiElements.get('comboContainer');
        if (comboContainer) {
            this.scene.tweens.add({
                targets: comboContainer,
                alpha: 0,
                duration: 300,
                onComplete: () => {
                    comboContainer.setVisible(false);
                    comboContainer.setAlpha(1);
                }
            });
        }
    }

    // Power-up indicator methods
    showPowerUpIndicator(type, duration) {
        const container = this.uiElements.get('powerUpContainer');
        if (!container) return;

        const indicator = this.scene.add.container(0, -this.powerUpIndicators.size * 45);
        
        const bg = this.scene.add.rectangle(0, 0, 120, 35, 0x000000, 0.7);
        bg.setStrokeStyle(2, this.getPowerUpColor(type));
        
        const icon = this.scene.add.text(-40, 0, this.getPowerUpIcon(type), {
            fontSize: '20px'
        }).setOrigin(0.5);
        
        const timer = this.scene.add.text(20, 0, Math.ceil(duration / 1000) + 's', {
            fontSize: '14px',
            fill: '#FFFFFF'
        }).setOrigin(0.5);
        
        indicator.add([bg, icon, timer]);
        container.add(indicator);
        
        this.powerUpIndicators.set(type, { indicator, timer, timeLeft: duration });
    }

    updatePowerUpIndicator(type, timeLeft) {
        const powerUpData = this.powerUpIndicators.get(type);
        if (powerUpData) {
            powerUpData.timer.setText(Math.ceil(timeLeft / 1000) + 's');
            powerUpData.timeLeft = timeLeft;
        }
    }

    hidePowerUpIndicator(type) {
        const powerUpData = this.powerUpIndicators.get(type);
        if (powerUpData) {
            powerUpData.indicator.destroy();
            this.powerUpIndicators.delete(type);
            
            // Reposition remaining indicators
            let index = 0;
            this.powerUpIndicators.forEach((data) => {
                data.indicator.setPosition(0, -index * 45);
                index++;
            });
        }
    }

    getPowerUpColor(type) {
        const colors = {
            shield: 0x4CAF50,
            speedBoost: 0xFF9800,
            scoreMultiplier: 0xFFD700,
            timeSlow: 0x9C27B0,
            magnet: 0xF44336,
            birdCompanion: 0x2196F3
        };
        return colors[type] || 0xFFFFFF;
    }

    getPowerUpIcon(type) {
        const icons = {
            shield: '🛡️',
            speedBoost: '⚡',
            scoreMultiplier: '🔥',
            timeSlow: '⏱️',
            magnet: '🧲',
            birdCompanion: '🐦'
        };
        return icons[type] || '⭐';
    }

    // Notification system
    showScorePopup(points, source) {
        const centerX = this.scene.cameras.main.centerX;
        const centerY = this.scene.cameras.main.centerY;
        
        const popup = this.scene.add.text(centerX + (Math.random() - 0.5) * 200, centerY, `+${points}`, {
            fontSize: '24px',
            fill: '#FFD700',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setScrollFactor(0);
        
        // Animate popup
        this.scene.tweens.add({
            targets: popup,
            y: popup.y - 100,
            alpha: 0,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => popup.destroy()
        });
    }

    showLevelUpNotification(data) {
        this.showNotification(`🎉 Level ${data.newLevel}!`, `+${data.bonus} Bonus`, 0xFFD700);
    }

    showAchievementNotification(achievement) {
        this.showNotification(`🏆 ${achievement.name}`, achievement.description, 0x4CAF50);
    }

    showMilestoneNotification(milestone) {
        this.showNotification(`🎯 ${milestone.type} Milestone`, `${milestone.value.toLocaleString()}`, 0x2196F3);
    }

    showNotification(title, subtitle, color = 0xFFFFFF) {
        const container = this.uiElements.get('notificationContainer');
        if (!container) return;
        
        const centerX = this.scene.cameras.main.centerX;
        const notification = this.scene.add.container(centerX, 150 + this.notifications.length * 80);
        
        const bg = this.scene.add.rectangle(0, 0, 300, 60, 0x000000, 0.8);
        bg.setStrokeStyle(2, color);
        
        const titleText = this.scene.add.text(0, -10, title, {
            fontSize: '18px',
            fill: color,
            fontWeight: 'bold'
        }).setOrigin(0.5);
        
        const subtitleText = this.scene.add.text(0, 10, subtitle, {
            fontSize: '14px',
            fill: '#CCCCCC'
        }).setOrigin(0.5);
        
        notification.add([bg, titleText, subtitleText]);
        container.add(notification);
        this.notifications.push(notification);
        
        // Auto-remove after 3 seconds
        this.scene.time.delayedCall(3000, () => {
            const index = this.notifications.indexOf(notification);
            if (index > -1) {
                this.notifications.splice(index, 1);
                notification.destroy();
            }
        });
    }

    // Screen management
    showGameplayUI() {
        const elements = ['scoreContainer', 'levelContainer', 'distanceContainer', 'powerUpContainer'];
        elements.forEach(key => {
            const element = this.uiElements.get(key);
            if (element) element.setVisible(true);
        });
    }

    hideGameplayUI() {
        const elements = ['scoreContainer', 'levelContainer', 'comboContainer', 'distanceContainer', 'powerUpContainer'];
        elements.forEach(key => {
            const element = this.uiElements.get(key);
            if (element) element.setVisible(false);
        });
    }

    showPauseMenu() {
        const pauseContainer = this.uiElements.get('pauseContainer');
        if (pauseContainer) {
            pauseContainer.setVisible(true);
        }
    }

    hidePauseMenu() {
        const pauseContainer = this.uiElements.get('pauseContainer');
        if (pauseContainer) {
            pauseContainer.setVisible(false);
        }
    }

    showGameOverScreen(data) {
        this.hideGameplayUI();
        
        const gameOverContainer = this.uiElements.get('gameOverContainer');
        const finalScoreText = this.uiElements.get('finalScoreText');
        const statsText = this.uiElements.get('gameOverStatsText');
        
        if (gameOverContainer) {
            gameOverContainer.setVisible(true);
        }
        
        if (finalScoreText) {
            finalScoreText.setText(`Final Score: ${data.score.toLocaleString()}`);
        }
        
        if (statsText && data.stats) {
            const stats = [
                `Distance: ${Math.floor(data.stats.distanceTraveled)}m`,
                `Collectibles: ${data.stats.collectiblesGathered}`,
                `Max Combo: ${data.stats.maxCombo}`,
                `Time: ${Math.floor(data.stats.playtime / 1000)}s`
            ].join('\n');
            statsText.setText(stats);
        }
    }

    hideGameOverScreen() {
        const gameOverContainer = this.uiElements.get('gameOverContainer');
        if (gameOverContainer) {
            gameOverContainer.setVisible(false);
        }
    }

    // Utility methods
    shareScore() {
        const gameState = this.scene.gameStateManager?.getGameState();
        if (gameState) {
            const shareText = `I just scored ${gameState.score.toLocaleString()} points in BirdDash! ☕🐦`;
            
            if (navigator.share) {
                navigator.share({
                    title: 'BirdDash High Score',
                    text: shareText,
                    url: window.location.href
                });
            } else {
                // Fallback: copy to clipboard
                navigator.clipboard?.writeText(shareText);
                this.showNotification('📋 Copied!', 'Score copied to clipboard', 0x4CAF50);
            }
        }
    }

    // Update method called from game loop
    update(time, delta) {
        if (!this.isInitialized) return;
        
        // Update distance display
        if (this.scene.gameStateManager) {
            this.updateDistance(this.scene.gameStateManager.getDistance());
        }
        
        // Update power-up indicators
        this.powerUpIndicators.forEach((data, type) => {
            if (this.scene.powerUpSystem) {
                const timeLeft = this.scene.powerUpSystem.getPowerUpTimeRemaining(type);
                if (timeLeft > 0) {
                    this.updatePowerUpIndicator(type, timeLeft);
                } else {
                    this.hidePowerUpIndicator(type);
                }
            }
        });
    }

    // Cleanup
    cleanup() {
        // Remove event listeners
        this.scene.events.off('gameStarted', this.onGameStarted, this);
        this.scene.events.off('gameEnded', this.onGameEnded, this);
        this.scene.events.off('gamePaused', this.onGamePaused, this);
        this.scene.events.off('gameResumed', this.onGameResumed, this);
        this.scene.events.off('scoreUpdated', this.onScoreUpdated, this);
        this.scene.events.off('levelUp', this.onLevelUp, this);
        this.scene.events.off('comboIncreased', this.onComboIncreased, this);
        this.scene.events.off('comboReset', this.onComboReset, this);
        this.scene.events.off('achievementUnlocked', this.onAchievementUnlocked, this);
        this.scene.events.off('milestoneReached', this.onMilestoneReached, this);
        
        // Destroy UI elements
        this.uiElements.forEach(element => {
            if (element && element.destroy) {
                element.destroy();
            }
        });
        
        this.uiElements.clear();
        this.powerUpIndicators.clear();
        this.notifications.length = 0;
    }
}
