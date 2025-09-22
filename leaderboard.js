// Phaser is loaded globally from CDN
import debugLogger from './debugLogger.js';
import InputSanitizer from './inputSanitizer.js';
import ApiService from './apiService.js';
import { UI, ANIMATIONS } from './constants.js';

export default class Leaderboard {
    constructor(scene) {
        this.scene = scene;
        this.storageKey = 'birdDashLeaderboard';
        this.userKey = 'birdDashUser';
        this.maxEntries = 20; // Increased for online leaderboard
        
        this.leaderboardGroup = null;
        this.nameInput = null;
        this.phoneInput = null;
        this.isShowingLeaderboard = false;
        
        // Initialize API service
        this.apiService = new ApiService();
        this.isOnlineMode = false;
        
        // Check if we can connect to the backend
        this.initializeConnection();
    }

    async initializeConnection() {
        try {
            const health = await this.apiService.checkHealth();
            if (health.status === 'OK') {
                this.isOnlineMode = true;
                console.log('🌐 Leaderboard: Online mode enabled');
                
                // Try to verify existing token
                await this.apiService.verifyToken();
            } else {
                console.log('📱 Leaderboard: Offline mode - using local storage');
            }
        } catch (error) {
            console.log('📱 Leaderboard: Offline mode - API unavailable');
        }
    }

    loadLeaderboard() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            debugLogger.warn('Error loading leaderboard data:', error);
            // Return empty leaderboard on error
            return [];
        }
    }

    saveLeaderboard(leaderboard) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(leaderboard));
        } catch (error) {
            debugLogger.warn('Error saving leaderboard data:', error);
            // Try to save with limited entries if storage is limited
            if (leaderboard.length > 5) {
                try {
                    // Save only top 5 entries
                    localStorage.setItem(this.storageKey, JSON.stringify(leaderboard.slice(0, 5)));
                } catch (e) {
                    debugLogger.error('Failed to save even limited leaderboard data');
                }
            }
        }
    }

    loadUser() {
        try {
            const stored = localStorage.getItem(this.userKey);
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            debugLogger.warn('Error loading user data:', error);
            // Clear potentially corrupted data
            localStorage.removeItem(this.userKey);
            return null;
        }
    }

    saveUser(userData) {
        try {
            localStorage.setItem(this.userKey, JSON.stringify(userData));
        } catch (error) {
            debugLogger.warn('Error saving user data:', error);
            // Try to save with minimal data if storage is limited
            try {
                const minimalData = {
                    name: userData.name,
                    phone: userData.phone
                };
                localStorage.setItem(this.userKey, JSON.stringify(minimalData));
            } catch (e) {
                debugLogger.error('Failed to save even minimal user data');
            }
        }
    }

    isHighScore(score) {
        const leaderboard = this.loadLeaderboard();
        return leaderboard.length < this.maxEntries || score > leaderboard[leaderboard.length - 1].score;
    }

    async addScore(playerData, gameData = {}) {
        // Sanitize input data
        const sanitizedData = InputSanitizer.sanitizeLeaderboardEntry(playerData);
        
        try {
            // Try online submission first
            if (this.isOnlineMode) {
                const scoreData = {
                    username: sanitizedData.name,
                    score: sanitizedData.score,
                    time_played: gameData.timePlayed || 0,
                    collectibles_collected: gameData.collectiblesCollected || 0,
                    power_ups_collected: gameData.powerUpsCollected || 0,
                    distance_traveled: gameData.distanceTraveled || 0,
                    max_combo: gameData.maxCombo || 0,
                    is_guest: !this.apiService.isAuthenticated()
                };

                const response = await this.apiService.submitScore(scoreData);
                
                if (response.entry_id) {
                    debugLogger.log(`✅ Score submitted online: ${sanitizedData.name} - ${sanitizedData.score} points (Rank: ${response.rank})`);
                    
                    // Also update user stats if authenticated
                    if (this.apiService.isAuthenticated()) {
                        await this.apiService.updateGameStats(sanitizedData.name, scoreData);
                    }
                    
                    // Return online leaderboard data
                    const onlineLeaderboard = await this.apiService.getLeaderboard(this.maxEntries);
                    return {
                        leaderboard: onlineLeaderboard.leaderboard || [],
                        rank: response.rank,
                        online: true
                    };
                }
            }
        } catch (error) {
            debugLogger.error('Online score submission failed:', error);
        }
        
        // Fallback to local storage
        const leaderboard = this.loadLeaderboard();
        
        // Add new score
        leaderboard.push({
            name: sanitizedData.name,
            phone: sanitizedData.phone,
            score: sanitizedData.score,
            date: new Date().toLocaleDateString(),
            timestamp: Date.now(),
            ...gameData
        });

        // Sort by score (highest first)
        leaderboard.sort((a, b) => b.score - a.score);
        
        // Find rank before trimming
        const rank = leaderboard.findIndex(entry => entry.timestamp === leaderboard[leaderboard.length - 1].timestamp) + 1;

        // Keep only top entries
        leaderboard.splice(this.maxEntries);

        this.saveLeaderboard(leaderboard);
        
        debugLogger.log(`📱 Score saved locally: ${sanitizedData.name} - ${sanitizedData.score} points (Rank: ${rank})`);
        
        return {
            leaderboard: leaderboard,
            rank: rank,
            online: false
        };
    }

    async showLeaderboard() {
        if (this.isShowingLeaderboard) return;
        this.isShowingLeaderboard = true;
        
        let leaderboard = [];
        let isOnline = false;
        
        try {
            if (this.isOnlineMode) {
                const response = await this.apiService.getLeaderboard(this.maxEntries);
                if (response.leaderboard) {
                    leaderboard = response.leaderboard;
                    isOnline = true;
                    debugLogger.log('📊 Loaded online leaderboard with', leaderboard.length, 'entries');
                } else {
                    throw new Error('No leaderboard data received');
                }
            } else {
                throw new Error('Offline mode');
            }
        } catch (error) {
            debugLogger.log('📱 Falling back to local leaderboard:', error.message);
            leaderboard = this.loadLeaderboard();
        }
        this.leaderboardGroup = this.scene.add.group();
        // Background overlay with immediate darkness and fade-in animation
        const overlay = this.scene.add.rectangle(
            this.scene.cameras.main.centerX, 
            this.scene.cameras.main.centerY, 
            this.scene.cameras.main.width, 
            this.scene.cameras.main.height, 
            0x000000, 0.92  // Start with higher opacity for immediate visibility
        ).setDepth(3000);
        this.leaderboardGroup.add(overlay);
        
        this.scene.tweens.add({
            targets: overlay,
            alpha: 0.95,  // Almost completely dark overlay
            duration: 300,
            ease: 'Power2.easeOut'
        });
        // Title with slide-in animation - responsive positioning
        const centerX = this.scene.cameras.main.centerX;
        const centerY = this.scene.cameras.main.centerY;
        const screenHeight = this.scene.cameras.main.height;
        const minScale = Math.min(this.scene.cameras.main.width / 480, screenHeight / 854);
        
        const title = this.scene.add.text(centerX, screenHeight * 0.07, 'LEADERBOARD', {
            fontSize: '32px',
            fill: '#FFD700',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(3001);
        this.leaderboardGroup.add(title);
        
        this.scene.tweens.add({
            targets: title,
            y: screenHeight * 0.14,
            alpha: { from: 0, to: 1 },
            duration: 400,
            ease: 'Back.easeOut'
        });

        // Leaderboard entries with staggered animations
        if (leaderboard.length === 0) {
            const noScores = this.scene.add.text(centerX, centerY, 'No scores yet!\nBe the first to play!', {
                fontSize: '20px',
                fill: '#FFFFFF',
                align: 'center'
            }).setOrigin(0.5).setDepth(5001).setAlpha(0);
            this.leaderboardGroup.add(noScores);
            
            this.scene.tweens.add({
                targets: noScores,
                alpha: 1,
                duration: 500,
                delay: 600,
                ease: 'Power2.easeOut'
            });
        } else {
            leaderboard.forEach((entry, index) => {
                const yPos = screenHeight * 0.2 + (index * screenHeight * 0.06);
                
                // Create entry container for better mobile layout
                const entryContainer = this.scene.add.container(centerX, yPos).setDepth(5001);
                this.leaderboardGroup.add(entryContainer);
                
                // Background for each entry using graphics for stroke support - responsive width
                const entryWidth = Math.min(420, this.scene.cameras.main.width * 0.85);
                const entryHeight = Math.max(45, screenHeight * 0.05);
                const entryBg = this.scene.add.graphics();
                entryBg.fillStyle(index < 3 ? 0x333333 : 0x222222, 0.6);
                entryBg.lineStyle(2, index < 3 ? 0xFFD700 : 0x444444, 1);
                entryBg.fillRoundedRect(-entryWidth/2, -entryHeight/2, entryWidth, entryHeight, 8);
                entryBg.strokeRoundedRect(-entryWidth/2, -entryHeight/2, entryWidth, entryHeight, 8);
                entryContainer.add(entryBg);
                
                // Rank with medal icons for top 3 - improved mobile visibility
                const rankText = index < 3 ? 
                    ['🥇', '🥈', '🥉'][index] : 
                    `${index + 1}.`;
                const rank = this.scene.add.text(-entryWidth/2 + 30, 0, rankText, {
                    fontSize: index < 3 ? 
                        Math.max(28, screenHeight * 0.033) + 'px' : 
                        Math.max(20, screenHeight * 0.024) + 'px', // Responsive font sizes
                    fill: index < 3 ? '#FFD700' : '#FFFFFF',
                    fontWeight: 'bold',
                    fontFamily: 'Arial, sans-serif'
                }).setOrigin(0, 0.5).setDepth(5001);
                entryContainer.add(rank);
                // Name - improved mobile visibility and debugging
                const displayName = entry.name || entry.username || 'Unknown Player';
                debugLogger.log('leaderboard', `Displaying name for entry ${index}: "${displayName}"`);
                
                const name = this.scene.add.text(-entryWidth/2 + 80, 0, displayName, {
                    fontSize: Math.max(18, screenHeight * 0.022) + 'px', // Larger, responsive font
                    fill: '#FFFFFF',
                    fontWeight: 'bold',
                    fontFamily: 'Arial, sans-serif'
                }).setOrigin(0, 0.5).setDepth(5001);
                entryContainer.add(name);
                // Score with number formatting - improved mobile visibility
                const formattedScore = entry.score.toLocaleString();
                const score = this.scene.add.text(entryWidth/2 - 30, 0, formattedScore, {
                    fontSize: Math.max(18, screenHeight * 0.022) + 'px', // Larger, responsive font
                    fill: index < 3 ? '#FFD700' : '#FFFFFF',
                    fontWeight: 'bold',
                    fontFamily: 'Arial, sans-serif'
                }).setOrigin(1, 0.5).setDepth(5001);
                entryContainer.add(score);
                
                // Date (smaller, below name) - improved mobile visibility
                const dateText = entry.date || new Date().toLocaleDateString();
                const date = this.scene.add.text(-entryWidth/2 + 80, entryHeight * 0.3, dateText, {
                    fontSize: Math.max(12, screenHeight * 0.014) + 'px', // Responsive font
                    fill: '#AAAAAA',
                    fontFamily: 'Arial, sans-serif'
                }).setOrigin(0, 0.5);
                entryContainer.add(date);
                
                // Staggered slide-in animation
                entryContainer.y = yPos + screenHeight * 0.3; // Start below screen
                entryContainer.setAlpha(0);
                
                this.scene.tweens.add({
                    targets: entryContainer,
                    y: yPos,
                    alpha: 1,
                    duration: 400,
                    delay: 500 + (index * 100),
                    ease: 'Back.easeOut'
                });
                
                // Hover effect for top 3
                if (index < 3) {
                    entryBg.setInteractive(new Phaser.Geom.Rectangle(-entryWidth/2, -entryHeight/2, entryWidth, entryHeight), Phaser.Geom.Rectangle.Contains);
                    entryBg.on('pointerover', () => {
                        this.scene.tweens.add({
                            targets: entryContainer,
                            scaleX: 1.05,
                            scaleY: 1.05,
                            duration: 200,
                            ease: 'Power2.easeOut'
                        });
                    });
                    entryBg.on('pointerout', () => {
                        this.scene.tweens.add({
                            targets: entryContainer,
                            scaleX: 1,
                            scaleY: 1,
                            duration: 200,
                            ease: 'Power2.easeOut'
                        });
                    });
                }
            });
        }

        // Close button with animation - responsive positioning
        const closeButton = this.scene.add.text(centerX, screenHeight * 0.93, 'TAP TO CLOSE', {
            fontSize: '20px',
            fill: '#FFD700',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(2000).setAlpha(0);
        this.leaderboardGroup.add(closeButton);
        
        // Animate close button
        this.scene.tweens.add({
            targets: closeButton,
            y: screenHeight * 0.88,
            alpha: 1,
            duration: 500,
            delay: 800 + (leaderboard.length * 100),
            ease: 'Power2.easeOut'
        });
        
        // Pulsing animation for close button
        this.scene.tweens.add({
            targets: closeButton,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            delay: 1300 + (leaderboard.length * 100)
        });
        // Make close button directly interactive
        closeButton.setInteractive();
        closeButton.on('pointerdown', () => {
            // Add visual feedback animation
            this.scene.tweens.add({
                targets: closeButton,
                scaleX: 0.9,
                scaleY: 0.9,
                duration: 100,
                ease: 'Power2.easeOut',
                yoyo: true,
                onComplete: () => {
                    this.hideLeaderboard();
                    // If game is over, restart it
                    if (!this.scene.gameRunning) {
                        this.scene.scene.restart();
                    }
                }
            });
            
            // Brief color flash
            // closeButton.setTint(0xFFA500); // REMOVED - no tinting
            // setTimeout(() => {
            //     closeButton.clearTint(); // REMOVED - no tinting
            // }, 150);
        });
        // Also make overlay clickable to close (as backup)
        overlay.setInteractive();
        overlay.on('pointerdown', () => {
            this.hideLeaderboard();
            // If game is over, restart it
            if (!this.scene.gameRunning) {
                this.scene.scene.restart();
            }
        });
    }

    hideLeaderboard() {
        if (this.leaderboardGroup) {
            this.leaderboardGroup.destroy();
            this.leaderboardGroup = null;
        }
        this.isShowingLeaderboard = false;
    }

    async showNameEntryForm(score) {
        debugLogger.score("Showing name entry form for score:", score);
        
        try {
            const existingUser = this.loadUser();
            
            if (existingUser && existingUser.name && existingUser.phone) {
                debugLogger.log('scores', "Found existing user:", existingUser.name);
                // User exists with valid data, just update their score
                try {
                    const updatedLeaderboard = await this.addScore({
                        name: existingUser.name,
                        phone: existingUser.phone,
                        score: score
                    });
                    
                    debugLogger.score("Score added to leaderboard, showing submission screen");
                    await this.showScoreSubmitted(updatedLeaderboard, score);
                    return;
                } catch (scoreError) {
                    debugLogger.error("Error adding score for existing user:", scoreError);
                    // Fall through to create new form
                }
            } else {
                debugLogger.log('scores', "No valid existing user found, showing entry form");
            }
        } catch (error) {
            debugLogger.warn('Error processing existing user:', error);
            // Continue to create new form
        }

        // New user or invalid existing user - show entry form
        try {
            this.createNameEntryForm(score);
        } catch (formError) {
            debugLogger.error("Error creating name entry form:", formError);
            // Last resort fallback - restart the game
            this.scene.scene.restart();
        }
    }

    createNameEntryForm(score) {
        const formGroup = this.scene.add.group();

        // Background - full screen very dark overlay
        const overlay = this.scene.add.rectangle(
            this.scene.cameras.main.centerX, 
            this.scene.cameras.main.centerY, 
            this.scene.cameras.main.width, 
            this.scene.cameras.main.height, 
            0x000000, 0.95
        ).setDepth(2500);
        formGroup.add(overlay);

        // Get responsive center positions
        const centerX = this.scene.centerX || this.scene.cameras.main.centerX;
        const centerY = this.scene.centerY || this.scene.cameras.main.centerY;
        const screenHeight = this.scene.screenHeight || this.scene.cameras.main.height;
        
        // Title - better positioned and styled
        const title = this.scene.add.text(centerX, centerY - (screenHeight * 0.25), 'NEW HIGH SCORE!', {
            fontSize: Math.max(28, 32 * (this.scene.minScale || 1)) + 'px',
            fill: '#FFD700',
            fontWeight: 'bold',
            stroke: '#8B4513',
            strokeThickness: 4,
            shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 8, fill: true }
        }).setOrigin(0.5).setDepth(2600);
        formGroup.add(title);

        // Score display - improved positioning and styling
        const scoreText = this.scene.add.text(centerX, centerY - (screenHeight * 0.15), `Final Score: ${score.toLocaleString()}`, {
            fontSize: Math.max(24, 28 * (this.scene.minScale || 1)) + 'px',
            fill: '#FFFFFF',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 3,
            shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 6, fill: true }
        }).setOrigin(0.5).setDepth(2600);
        formGroup.add(scoreText);

        // Instructions - better positioned and more prominent
        const instructions = this.scene.add.text(centerX, centerY - (screenHeight * 0.08), 'Enter your details to save your score:', {
            fontSize: Math.max(18, 20 * (this.scene.minScale || 1)) + 'px',
            fill: '#F5DEB3',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 2,
            align: 'center',
            wordWrap: { width: screenWidth * 0.8, useAdvancedWrap: true }
        }).setOrigin(0.5).setDepth(2600);
        formGroup.add(instructions);

        // Create HTML input elements
        this.createInputElements(score, formGroup);
    }

    createInputElements(score, formGroup) {
        // Create responsive input container with improved positioning
        const inputContainer = document.createElement('div');
        inputContainer.style.cssText = `
            position: absolute;
            top: 55%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 3000;
            text-align: center;
            width: 85%;
            max-width: 380px;
            padding: 25px;
            box-sizing: border-box;
        `;
        // Create form wrapper with enhanced styling
        const formWrapper = document.createElement('div');
        formWrapper.style.cssText = `
            background: linear-gradient(145deg, rgba(0, 0, 0, 0.9), rgba(20, 20, 20, 0.85));
            border: 3px solid #FFD700;
            border-radius: 20px;
            padding: 35px 25px;
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.7), inset 0 2px 10px rgba(255, 215, 0, 0.1);
            backdrop-filter: blur(8px);
            position: relative;
        `;
        // Name input with enhanced mobile styling
        this.nameInput = document.createElement('input');
        this.nameInput.type = 'text';
        this.nameInput.placeholder = 'Enter your name';
        this.nameInput.maxLength = 20;
        this.nameInput.autocomplete = 'name';
        this.nameInput.autocapitalize = 'words';
        this.nameInput.spellcheck = false;
        this.nameInput.style.cssText = `
            width: 100%;
            height: 65px;
            margin: 20px 0;
            font-size: 20px;
            font-weight: 600;
            text-align: center;
            border: 4px solid #FFD700;
            border-radius: 35px;
            background: linear-gradient(145deg, #FFFFFF, #F8F8F8);
            color: #2C3E50;
            box-sizing: border-box;
            transition: all 0.3s ease;
            outline: none;
            box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.1);
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
            min-height: 44px;
            touch-action: manipulation;
        `;
        
        // Add input event handlers with proper character support
        this.nameInput.addEventListener('input', (e) => {
            // Allow all standard characters - basic validation only
            const value = e.target.value;
            // Remove any potentially problematic characters but allow most text
            const cleanValue = value.replace(/[<>]/g, ''); // Remove only HTML brackets for safety
            if (cleanValue !== value) {
                e.target.value = cleanValue;
            }
        });
        
        this.nameInput.addEventListener('keydown', async (e) => {
            // Handle Enter key for form submission
            if (e.key === 'Enter') {
                e.preventDefault();
                await this.submitScore(score);
                return;
            }
        });
        
        this.nameInput.addEventListener('paste', (e) => {
            // Allow paste operations
            setTimeout(() => {
                // Clean pasted content
                const value = e.target.value;
                const cleanValue = value.replace(/[<>]/g, '');
                if (cleanValue !== value) {
                    e.target.value = cleanValue;
                }
            }, 10);
        });
        // Phone input with enhanced styling
        this.phoneInput = document.createElement('input');
        this.phoneInput.type = 'tel';
        this.phoneInput.placeholder = 'Mobile number';
        this.phoneInput.maxLength = 15;
        this.phoneInput.autocomplete = 'tel';
        this.phoneInput.inputMode = 'tel';
        this.phoneInput.style.cssText = `
            width: 100%;
            height: 65px;
            margin: 20px 0;
            font-size: 20px;
            font-weight: 600;
            text-align: center;
            border: 4px solid #FFD700;
            border-radius: 35px;
            background: linear-gradient(145deg, #FFFFFF, #F8F8F8);
            color: #2C3E50;
            box-sizing: border-box;
            transition: all 0.3s ease;
            outline: none;
            box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.1);
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
            min-height: 44px;
            touch-action: manipulation;
        `;
        
        // Add input validation for phone numbers
        this.phoneInput.addEventListener('input', (e) => {
            debugLogger.log('scores', 'Phone input changed:', e.target.value);
            // Allow numbers, spaces, hyphens, parentheses, and plus sign
            const phoneRegex = /^[0-9\s\-\(\)\+]*$/;
            if (!phoneRegex.test(e.target.value)) {
                debugLogger.warn('Invalid phone character detected, filtering...');
                e.target.value = e.target.value.replace(/[^0-9\s\-\(\)\+]/g, '');
            }
        });
        
        this.phoneInput.addEventListener('keydown', async (e) => {
            debugLogger.log('scores', 'Phone key pressed:', e.key, 'Code:', e.code);
            if (e.key === 'Enter') {
                e.preventDefault();
                await this.submitScore(score);
            }
        });
        // Submit button with enhanced mobile styling and more prominent appearance
        const submitButton = document.createElement('button');
        submitButton.textContent = 'SUBMIT SCORE';
        submitButton.style.cssText = `
            width: 100%;
            height: 70px;
            margin: 35px 0 25px 0;
            font-size: 24px;
            font-weight: bold;
            color: #2C3E50;
            background: linear-gradient(135deg, #FFD700, #FFA500, #FF8C00);
            border: 4px solid #B8860B;
            border-radius: 40px;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 8px 25px rgba(255, 215, 0, 0.5), inset 0 2px 10px rgba(255, 255, 255, 0.3);
            outline: none;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
            letter-spacing: 1px;
            -webkit-tap-highlight-color: transparent;
            min-height: 44px;
            touch-action: manipulation;
        `;
        // Add hover and focus effects
        const addInputEffects = (input) => {
            input.addEventListener('focus', () => {
                input.style.borderColor = '#FFA500';
                input.style.boxShadow = '0 0 10px rgba(255, 165, 0, 0.5)';
                input.style.transform = 'scale(1.02)';
            });
            input.addEventListener('blur', () => {
                input.style.borderColor = '#FFD700';
                input.style.boxShadow = 'none';
                input.style.transform = 'scale(1)';
            });
        };
        addInputEffects(this.nameInput);
        addInputEffects(this.phoneInput);
        // Enhanced button effects for better mobile responsiveness
        submitButton.addEventListener('mouseenter', () => {
            submitButton.style.transform = 'translateY(-2px)';
            submitButton.style.boxShadow = '0 8px 20px rgba(255, 215, 0, 0.5)';
        });
        submitButton.addEventListener('mouseleave', () => {
            submitButton.style.transform = 'translateY(0)';
            submitButton.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.4)';
        });
        // Add touch-specific effects for mobile
        submitButton.addEventListener('touchstart', () => {
            submitButton.style.transform = 'scale(0.98)';
            submitButton.style.boxShadow = '0 3px 10px rgba(255, 215, 0, 0.3)';
        });
        submitButton.addEventListener('touchend', () => {
            submitButton.style.transform = 'scale(1)';
            submitButton.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.4)';
        });

        submitButton.onclick = async () => {
            debugLogger.log('scores', "Submit button clicked");
            try {
                await this.submitScore(score);
            } catch (error) {
                debugLogger.error("Error in submit button handler:", error);
                alert("There was an error submitting your score. Please try again.");
            }
        };
        // Add elements to form wrapper
        formWrapper.appendChild(this.nameInput);
        formWrapper.appendChild(this.phoneInput);
        formWrapper.appendChild(submitButton);
        
        // Add form wrapper to container
        inputContainer.appendChild(formWrapper);
        document.body.appendChild(inputContainer);
        
        // Immediate visibility with subtle animation for better user experience
        inputContainer.style.opacity = '0.8';
        inputContainer.style.transform = 'translate(-50%, -48%)';
        
        setTimeout(() => {
            inputContainer.style.transition = 'all 0.3s ease-out';
            inputContainer.style.opacity = '1';
            inputContainer.style.transform = 'translate(-50%, -50%)';
        }, 50);

        // Store reference to clean up later
        this.inputContainer = inputContainer;
        this.formGroup = formGroup;

        // Focus on name input
        setTimeout(() => {
            this.nameInput.focus();
        }, 100);
    }

    async submitScore(score) {
        try {
            const name = this.nameInput.value.trim();
            const phone = this.phoneInput.value.trim();

            if (!name || name.length < 2) {
                alert('Please enter a valid name (at least 2 characters)');
                return;
            }

            if (!phone || phone.length < 8) {
                alert('Please enter a valid mobile number');
                return;
            }

            debugLogger.score("Submitting score:", score, "for player:", name);

            // Save user data
            const userData = { name, phone };
            this.saveUser(userData);
            
            // Add to leaderboard - await the result since addScore is async
            const updatedLeaderboard = await this.addScore({
                name,
                phone,
                score
            });
            
            // Clean up form
            this.cleanupForm();
            
            // Show success with current score
            await this.showScoreSubmitted(updatedLeaderboard, score);
            
            debugLogger.score("Score submitted successfully, showing results");
        } catch (error) {
            debugLogger.error("Error submitting score:", error);
            alert("There was an error submitting your score. Please try again.");
            
            // Fallback - restart game
            this.scene.scene.restart();
        }
    }

    async showScoreSubmitted(leaderboard, currentScore) {
        debugLogger.score("Showing score submission results");
        
        try {
            const successGroup = this.scene.add.group();
            
            // Find user's position based on current score, not highest score
            let position = 1; // Default to 1 if not found
            let leaderboardData = [];
            
            try {
                // Handle both promise and direct return from addScore
                if (leaderboard && typeof leaderboard.then === 'function') {
                    const result = await leaderboard;
                    leaderboardData = result.leaderboard || [];
                } else if (leaderboard && leaderboard.leaderboard) {
                    leaderboardData = leaderboard.leaderboard;
                } else if (Array.isArray(leaderboard)) {
                    leaderboardData = leaderboard;
                } else {
                    debugLogger.warn("Unexpected leaderboard format:", leaderboard);
                    leaderboardData = [];
                }
                
                if (leaderboardData.length > 0) {
                    position = leaderboardData.findIndex(entry => entry.score === currentScore) + 1;
                    if (position <= 0) {
                        debugLogger.warn("Position not found in leaderboard, defaulting to 1");
                        position = 1;
                    }
                }
            } catch (err) {
                debugLogger.error("Error processing leaderboard data:", err);
            }
            
            const isTop3 = position <= 3;
            
            // Get responsive center positions - with fallbacks
            const centerX = this.scene.centerX || this.scene.cameras.main.centerX;
            const centerY = this.scene.centerY || this.scene.cameras.main.centerY;
            const screenWidth = this.scene.screenWidth || this.scene.cameras.main.width;
            const screenHeight = this.scene.screenHeight || this.scene.cameras.main.height;
        
        // Background with animated fade-in - full screen coverage with immediate darkness
        const overlay = this.scene.add.rectangle(
            this.scene.cameras.main.centerX, 
            this.scene.cameras.main.centerY, 
            this.scene.cameras.main.width, 
            this.scene.cameras.main.height, 
            0x000000, 0.85  // Start with higher opacity
        ).setDepth(1500);
        successGroup.add(overlay);
        
        this.scene.tweens.add({
            targets: overlay,
            alpha: 0.95,  // Almost completely dark
            duration: 300,
            ease: 'Power2.easeOut'
        });
        // Determine celebration type and colors
        const celebrationConfig = this.getCelebrationConfig(position, isTop3);
        
        // Only celebrate for top 3 positions
        if (position <= 3) {
            // Trigger immediate particle celebration
            this.triggerCelebrationParticles(position);
            
            // Play ranking-specific sound effect
            this.scene.soundManager.playRankingSound(position);
        }
        // Success message with position-specific styling
        const successText = this.scene.add.text(centerX, centerY - (screenHeight * 0.35), celebrationConfig.title, {
            fontSize: celebrationConfig.titleSize,
            fill: celebrationConfig.titleColor,
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(2600).setAlpha(0);
        successGroup.add(successText);
        // Animate title with bounce effect - faster animation
        this.scene.tweens.add({
            targets: successText,
            alpha: 1,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 400,
            delay: 100,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.scene.tweens.add({
                    targets: successText,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 300,
                    ease: 'Elastic.easeOut'
                });
            }
        });
        // Position announcement with special effects for top 3 - responsive positioning
        const positionText = this.scene.add.text(centerX, centerY - (screenHeight * 0.2), celebrationConfig.positionText, {
            fontSize: Math.max(18, 22 * this.scene.minScale) + 'px',
            fill: celebrationConfig.positionColor,
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 2,
            align: 'center',
            lineSpacing: Math.max(6, 8 * this.scene.minScale),
            wordWrap: { 
                width: screenWidth * 0.8,
                useAdvancedWrap: true
            },
            padding: {
                left: Math.max(8, 10 * this.scene.minScale),
                right: Math.max(8, 10 * this.scene.minScale),
                top: Math.max(4, 6 * this.scene.minScale),
                bottom: Math.max(4, 6 * this.scene.minScale)
            }
        }).setOrigin(0.5).setDepth(2600).setAlpha(0);
        successGroup.add(positionText);
        // Staggered position text animation - faster appearance
        this.scene.tweens.add({
            targets: positionText,
            alpha: 1,
            y: centerY - (screenHeight * 0.18),
            duration: 400,
            delay: 400,
            ease: 'Power2.easeOut'
        });
        // Add special visual effects for top 3
        if (isTop3) {
            this.addTop3SpecialEffects(successGroup, position, celebrationConfig);
        }
        // Score display with formatting using current score - larger and more prominent
        const scoreDisplay = this.scene.add.text(centerX, centerY, `Final Score: ${currentScore.toLocaleString()}` , {
            fontSize: Math.max(22, 28 * this.scene.minScale) + 'px',
            fill: '#FFFFFF',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(2600).setAlpha(0);
        successGroup.add(scoreDisplay);
        this.scene.tweens.add({
            targets: scoreDisplay,
            alpha: 1,
            duration: 400,
            delay: 700,
            ease: 'Power2.easeOut'
        });
        // Continue button with pulsing animation - appears sooner
        const continueText = this.scene.add.text(centerX, centerY + (screenHeight * 0.15), 'TAP TO CONTINUE', {
            fontSize: Math.max(16, 20 * this.scene.minScale) + 'px',
            fill: '#FFD700',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(2600).setAlpha(0);
        successGroup.add(continueText);
        this.scene.tweens.add({
            targets: continueText,
            alpha: 1,
            duration: 400,
            delay: 900,
            ease: 'Power2.easeOut',
            onComplete: () => {
                // Add pulsing effect - faster and more noticeable
                this.scene.tweens.add({
                    targets: continueText,
                    scaleX: 1.15,
                    scaleY: 1.15,
                    duration: 600,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        });
        // Add restart button - appears sooner
        const restartButton = this.scene.add.text(centerX, centerY + (screenHeight * 0.25), 'PLAY AGAIN', {
            fontSize: Math.max(20, 26 * this.scene.minScale) + 'px',
            fill: '#00FF00',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(2600).setAlpha(0);
        successGroup.add(restartButton);
        
        this.scene.tweens.add({
            targets: restartButton,
            alpha: 1,
            duration: 400,
            delay: 1100,
            ease: 'Power2.easeOut'
        });
        
        restartButton.setInteractive();
        restartButton.on('pointerdown', () => {
            try {
                debugLogger.log('scores', "Restarting game from score submission");
                if (successGroup && successGroup.scene) {
                    successGroup.destroy();
                }
                this.scene.scene.restart();
            } catch (error) {
                debugLogger.error("Error restarting game:", error);
                // Force restart if there's an error
                this.scene.scene.restart();
            }
        });
        // Make continue text show leaderboard
        overlay.setInteractive();
        overlay.on('pointerdown', () => {
            try {
                debugLogger.log('scores', "Showing leaderboard from score submission");
                if (successGroup && successGroup.scene) {
                    successGroup.destroy();
                }
                this.showLeaderboard();
            } catch (error) {
                debugLogger.error("Error showing leaderboard:", error);
                // Fallback to restart the game if there's an error
                this.scene.scene.restart();
            }
        });
        // Store reference for cleanup
        this.successGroup = successGroup;
        } catch (error) {
            debugLogger.error("Error showing score submission results:", error);
            // Fallback to restart the game if there's an error
            this.scene.scene.restart();
        }
    }
    getCelebrationConfig(position, isTop3) {
        if (position === 1) {
            return {
                title: '🏆 CHAMPION! 🏆',
                titleSize: Math.max(28, 32 * this.scene.minScale) + 'px',
                titleColor: '#FFD700',
                positionText: 'GREAT JOB!\nYou are the #1 player!',
                positionColor: '#FFD700'
            };
        } else if (position === 2) {
            return {
                title: '🥈 SILVER MEDAL! 🥈',
                titleSize: Math.max(24, 28 * this.scene.minScale) + 'px',
                titleColor: '#C0C0C0',
                positionText: 'AMAZING!\nYou are #2 on the leaderboard!',
                positionColor: '#C0C0C0'
            };
        } else if (position === 3) {
            return {
                title: '🥉 BRONZE MEDAL! 🥉',
                titleSize: Math.max(22, 26 * this.scene.minScale) + 'px',
                titleColor: '#CD7F32',
                positionText: 'EXCELLENT!\nYou are #3 on the leaderboard!',
                positionColor: '#CD7F32'
            };
        } else if (position <= 5) {
            return {
                title: 'TOP 5 PLAYER!',
                titleSize: Math.max(20, 24 * this.scene.minScale) + 'px',
                titleColor: '#4ECDC4',
                positionText: `GREAT JOB!\nYou are #${position} on the leaderboard!`,
                positionColor: '#4ECDC4'
            };
        } else if (position <= 10) {
            return {
                title: 'TOP 10 PLAYER!',
                titleSize: Math.max(18, 22 * this.scene.minScale) + 'px',
                titleColor: '#95E1D3',
                positionText: `WELL DONE!\nYou are #${position} on the leaderboard!`,
                positionColor: '#95E1D3'
            };
        } else {
            const encouragement = this.getEncouragementMessage(position);
            return {
                title: 'SCORE SAVED!',
                titleSize: Math.max(16, 20 * this.scene.minScale) + 'px',
                titleColor: '#FFFFFF',
                positionText: `You are #${position}\n${encouragement}`,
                positionColor: '#AAAAAA'
            };
        }
    }
    
    getEncouragementMessage(position) {
        const messages = [
            'Keep playing to climb higher!',
            'You\'re getting better each time!',
            'Practice makes perfect!',
            'Every great player started somewhere!',
            'Your next attempt could be the one!',
            'The leaderboard is within reach!',
            'Keep up the great effort!',
            'You\'re improving with each game!'
        ];
        
        // Use position to select message for consistency
        return messages[position % messages.length];
    }
    triggerCelebrationParticles(position) {
        try {
            debugLogger.effect("Creating celebration effects for position:", position);
            // Get center positions with fallbacks
            const centerX = this.scene.centerX || this.scene.cameras.main.centerX;
            const centerY = this.scene.centerY || this.scene.cameras.main.centerY;
            
            // Set different colors based on position
            let color = 0xFFD700; // Default gold
            if (position === 2) color = 0xC0C0C0; // Silver
            else if (position === 3) color = 0xCD7F32; // Bronze
            else if (position > 3) color = 0x4ECDC4; // Teal
            
            // Create simple visual effects instead of particles
            if (position === 1) {
                // Gold celebration - screen flash effect
                const goldFlash = this.scene.add.rectangle(
                    centerX, centerY,
                    this.scene.cameras.main.width, 
                    this.scene.cameras.main.height, 
                    color, 0.3
                ).setDepth(1999);
                
                this.scene.tweens.add({
                    targets: goldFlash,
                    alpha: 0,
                    duration: 800,
                    onComplete: () => {
                        if (goldFlash && goldFlash.scene) {
                            goldFlash.destroy();
                        }
                    }
                });
                
                // Add some emoji stars at different positions
                for (let i = 0; i < 5; i++) {
                    const offsetX = (Math.random() - 0.5) * 200;
                    const offsetY = (Math.random() - 0.5) * 200 - 100;
                    const star = this.scene.add.text(
                        centerX + offsetX, 
                        centerY + offsetY, 
                        '✨', 
                        { fontSize: Math.max(24, 28 * this.scene.minScale) + 'px' }
                    ).setOrigin(0.5).setDepth(2500).setAlpha(0);
                    
                    this.scene.tweens.add({
                        targets: star,
                        alpha: 1,
                        y: star.y - 50,
                        duration: 700 + Math.random() * 500,
                        ease: 'Power2.easeOut',
                        onComplete: () => {
                            this.scene.tweens.add({
                                targets: star,
                                alpha: 0,
                                duration: 300,
                                delay: 500,
                                onComplete: () => star.destroy()
                            });
                        }
                    });
                }
            } else if (position === 2 || position === 3) {
                // Silver/Bronze celebration - simpler effects
                const flash = this.scene.add.rectangle(
                    centerX, centerY,
                    this.scene.cameras.main.width, 
                    this.scene.cameras.main.height, 
                    color, 0.2
                ).setDepth(1999);
                
                this.scene.tweens.add({
                    targets: flash,
                    alpha: 0,
                    duration: 600,
                    onComplete: () => flash.destroy()
                });
                
                // Add a few emoji stars
                for (let i = 0; i < 3; i++) {
                    const offsetX = (Math.random() - 0.5) * 150;
                    const offsetY = (Math.random() - 0.5) * 150 - 80;
                    const star = this.scene.add.text(
                        centerX + offsetX, 
                        centerY + offsetY, 
                        '✨', 
                        { fontSize: Math.max(20, 24 * this.scene.minScale) + 'px' }
                    ).setOrigin(0.5).setDepth(2500).setAlpha(0);
                    
                    this.scene.tweens.add({
                        targets: star,
                        alpha: 1,
                        y: star.y - 40,
                        duration: 600 + Math.random() * 400,
                        ease: 'Power2.easeOut',
                        onComplete: () => {
                            this.scene.tweens.add({
                                targets: star,
                                alpha: 0,
                                duration: 300,
                                delay: 400,
                                onComplete: () => star.destroy()
                            });
                        }
                    });
                }
            } else {
                // Simple effect for other positions
                const flash = this.scene.add.rectangle(
                    centerX, centerY,
                    this.scene.cameras.main.width, 
                    this.scene.cameras.main.height, 
                    color, 0.1
                ).setDepth(1999);
                
                this.scene.tweens.add({
                    targets: flash,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => flash.destroy()
                });
                
                // Just one star
                const star = this.scene.add.text(
                    centerX, 
                    centerY - 80, 
                    '✨', 
                    { fontSize: Math.max(18, 22 * this.scene.minScale) + 'px' }
                ).setOrigin(0.5).setDepth(2500).setAlpha(0);
                
                this.scene.tweens.add({
                    targets: star,
                    alpha: 1,
                    y: star.y - 30,
                    duration: 500,
                    ease: 'Power2.easeOut',
                    onComplete: () => {
                        this.scene.tweens.add({
                            targets: star,
                            alpha: 0,
                            duration: 300,
                            delay: 300,
                            onComplete: () => star.destroy()
                        });
                    }
                });
            }
            
            debugLogger.effect("Celebration effects created successfully");
        } catch (error) {
            debugLogger.error("Error creating celebration effects:", error);
            // Don't let errors break the game flow
        }
    }
    addTop3SpecialEffects(successGroup, position, config) {
        // Get responsive center positions
        const centerX = this.scene.centerX || this.scene.cameras.main.centerX;
        const centerY = this.scene.centerY || this.scene.cameras.main.centerY;
        const screenWidth = this.scene.screenWidth || this.scene.cameras.main.width;
        const screenHeight = this.scene.screenHeight || this.scene.cameras.main.height;
        
        // Add rotating stars for top 3 - positioned relative to screen dimensions
        const starPositions = [
            { x: centerX - (screenWidth * 0.15), y: centerY - (screenHeight * 0.3) },
            { x: centerX + (screenWidth * 0.15), y: centerY - (screenHeight * 0.3) },
            { x: centerX, y: centerY - (screenHeight * 0.38) }
        ];
        
        starPositions.forEach((pos, index) => {
            const star = this.scene.add.text(pos.x, pos.y, '⭐', {
                fontSize: Math.max(20, 24 * this.scene.minScale) + 'px'
            }).setOrigin(0.5).setDepth(2550).setAlpha(0);
            successGroup.add(star);
            this.scene.tweens.add({
                targets: star,
                alpha: 1,
                angle: 360,
                duration: 1500,
                delay: 300 + (index * 150),
                repeat: -1,
                ease: 'Linear'
            });
        });
        
        // Add crown for #1
        if (position === 1) {
            const crown = this.scene.add.text(centerX, centerY - (screenHeight * 0.45), '👑', {
                fontSize: Math.max(28, 32 * this.scene.minScale) + 'px'
            }).setOrigin(0.5).setDepth(2550).setAlpha(0);
            successGroup.add(crown);
            this.scene.tweens.add({
                targets: crown,
                alpha: 1,
                y: centerY - (screenHeight * 0.42),
                duration: 600,
                delay: 200,
                ease: 'Bounce.easeOut'
            });
            // Crown floating animation - faster and more subtle
            this.scene.tweens.add({
                targets: crown,
                y: '+=' + (screenHeight * 0.01),
                duration: 1200,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
                delay: 800
            });
        }
    }

    cleanupForm() {
        if (this.inputContainer) {
            document.body.removeChild(this.inputContainer);
            this.inputContainer = null;
        }
        if (this.formGroup) {
            this.formGroup.destroy();
            this.formGroup = null;
        }
        this.nameInput = null;
        this.phoneInput = null;
    }

    getReturningUserInfo() {
        const user = this.loadUser();
        return user ? `Welcome back, ${user.name}!` : null;
    }
}


