// MobileOptimization - Mobile-first UI and touch control optimization
// Addresses bmad UX analysis: "Basic mobile controls without optimization"
// Implements thumb-friendly UI, haptic feedback, and performance optimization

export default class MobileOptimization {
    constructor(scene) {
        this.scene = scene;
        this.isMobile = this.detectMobileDevice();
        this.touchCapabilities = this.analyzeTouchCapabilities();
        this.performanceProfile = this.analyzePerformanceProfile();
        this.orientationLocked = false;
        this.hapticSupported = this.checkHapticSupport();
        
        this.setupMobileOptimizations();
    }

    detectMobileDevice() {
        const device = this.scene.sys.game.device;
        return {
            isMobile: device.os.android || device.os.iOS || device.os.windowsPhone,
            isTablet: device.os.iPad || (device.os.android && Math.min(screen.width, screen.height) >= 600),
            isPhone: (device.os.android || device.os.iOS) && Math.min(screen.width, screen.height) < 600,
            hasTouch: device.input.touch,
            userAgent: navigator.userAgent,
            screenSize: {
                width: screen.width,
                height: screen.height,
                ratio: screen.width / screen.height
            }
        };
    }

    analyzeTouchCapabilities() {
        return {
            maxTouchPoints: navigator.maxTouchPoints || 1,
            touchForceSupported: 'TouchEvent' in window && 'force' in TouchEvent.prototype,
            gestureSupported: 'GestureEvent' in window,
            orientationSupported: 'orientation' in window || 'screen' in window && 'orientation' in screen
        };
    }

    analyzePerformanceProfile() {
        const canvas = this.scene.sys.canvas;
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        return {
            devicePixelRatio: window.devicePixelRatio || 1,
            webGLSupported: !!gl,
            hardwareConcurrency: navigator.hardwareConcurrency || 2,
            memoryEstimate: navigator.deviceMemory || 4, // GB
            connectionType: navigator.connection?.effectiveType || 'unknown',
            batterySupported: 'getBattery' in navigator
        };
    }

    checkHapticSupport() {
        return {
            vibration: 'vibrate' in navigator,
            hapticFeedback: 'vibrate' in navigator && this.isMobile.isMobile,
            gamepadHaptic: 'getGamepads' in navigator
        };
    }

    setupMobileOptimizations() {
        if (!this.isMobile.isMobile) {
            console.log('📱 MobileOptimization: Desktop detected, mobile optimizations disabled');
            return;
        }

        console.log('📱 MobileOptimization: Mobile device detected, applying optimizations');
        console.log('📱 Device profile:', this.isMobile);
        console.log('📱 Performance profile:', this.performanceProfile);

        this.optimizePerformance();
        this.setupMobileTouchControls();
        this.optimizeMobileUI();
        this.setupOrientationHandling();
        this.setupBatteryOptimizations();
        this.preventMobileScrolling();
    }

    optimizePerformance() {
        const config = this.scene.sys.game.config;
        
        // Adjust rendering based on device capabilities
        if (this.performanceProfile.devicePixelRatio > 2) {
            // High DPI devices - reduce resolution for better performance
            config.resolution = Math.min(this.performanceProfile.devicePixelRatio, 2);
        }

        // Memory-based optimizations
        if (this.performanceProfile.memoryEstimate < 4) {
            console.log('📱 Low memory device detected, applying memory optimizations');
            this.applyLowMemoryOptimizations();
        }

        // Connection-based optimizations
        if (this.performanceProfile.connectionType === 'slow-2g' || this.performanceProfile.connectionType === '2g') {
            console.log('📱 Slow connection detected, reducing network features');
            this.applyLowBandwidthOptimizations();
        }
    }

    applyLowMemoryOptimizations() {
        // Reduce particle systems
        if (this.scene.particleManager) {
            this.scene.particleManager.setMaxParticles(50); // Reduce from default
        }

        // Reduce object pool sizes
        if (this.scene.objectPool) {
            this.scene.objectPool.setMaxPoolSize(20); // Reduce from default
        }

        // Reduce texture quality
        this.scene.textures.each((texture) => {
            if (texture.source && texture.source.length > 0) {
                texture.source[0].scaleMode = Phaser.ScaleModes.LINEAR; // Use linear instead of nearest
            }
        });
    }

    applyLowBandwidthOptimizations() {
        // Reduce leaderboard update frequency
        if (this.scene.leaderboard) {
            this.scene.leaderboard.setUpdateInterval(30000); // 30 seconds instead of 10
        }

        // Disable real-time features
        this.scene.events.emit('networkOptimization', { lowBandwidth: true });
    }

    setupMobileTouchControls() {
        console.log('📱 Setting up mobile touch controls');

        // Create mobile-optimized touch zones
        this.createTouchZones();
        
        // Setup gesture recognition
        this.setupGestureRecognition();
        
        // Configure touch sensitivity
        this.configureTouchSensitivity();
        
        // Setup haptic feedback
        if (this.hapticSupported.vibration) {
            this.setupHapticFeedback();
        }
    }

    createTouchZones() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        // Primary flight control zone (covers most of screen)
        this.primaryTouchZone = this.scene.add.rectangle(
            width / 2, height / 2, width * 0.8, height * 0.8, 0x000000, 0
        ).setInteractive().setScrollFactor(0);

        // Secondary control zones for advanced players
        this.leftTouchZone = this.scene.add.rectangle(
            width * 0.25, height / 2, width * 0.4, height, 0x000000, 0
        ).setInteractive().setScrollFactor(0);

        this.rightTouchZone = this.scene.add.rectangle(
            width * 0.75, height / 2, width * 0.4, height, 0x000000, 0
        ).setInteractive().setScrollFactor(0);

        // Touch control handlers
        this.primaryTouchZone.on('pointerdown', this.onPrimaryTouch, this);
        this.leftTouchZone.on('pointerdown', this.onLeftTouch, this);
        this.rightTouchZone.on('pointerdown', this.onRightTouch, this);

        // Visual feedback for touch areas (debug mode)
        if (this.scene.sys.game.config.physics.arcade?.debug) {
            this.primaryTouchZone.setAlpha(0.1).setFillStyle(0x00FF00);
            this.leftTouchZone.setAlpha(0.1).setFillStyle(0xFF0000);
            this.rightTouchZone.setAlpha(0.1).setFillStyle(0x0000FF);
        }
    }

    setupGestureRecognition() {
        if (!this.touchCapabilities.gestureSupported) return;

        let touchStartTime = 0;
        let touchStartPos = { x: 0, y: 0 };
        let touchEndPos = { x: 0, y: 0 };

        this.scene.input.on('pointerdown', (pointer) => {
            touchStartTime = Date.now();
            touchStartPos = { x: pointer.x, y: pointer.y };
        });

        this.scene.input.on('pointerup', (pointer) => {
            touchEndPos = { x: pointer.x, y: pointer.y };
            const touchDuration = Date.now() - touchStartTime;
            const touchDistance = Phaser.Math.Distance.Between(
                touchStartPos.x, touchStartPos.y,
                touchEndPos.x, touchEndPos.y
            );

            // Gesture recognition
            if (touchDuration < 200 && touchDistance < 30) {
                // Quick tap
                this.onQuickTap(pointer);
            } else if (touchDuration > 500 && touchDistance < 30) {
                // Long press
                this.onLongPress(pointer);
            } else if (touchDistance > 50) {
                // Swipe gesture
                this.onSwipeGesture(touchStartPos, touchEndPos, touchDuration);
            }
        });
    }

    configureTouchSensitivity() {
        // Adjust touch sensitivity based on device size
        const screenSize = Math.min(this.isMobile.screenSize.width, this.isMobile.screenSize.height);
        
        if (screenSize < 400) {
            // Small phone - increase sensitivity
            this.touchSensitivity = 1.2;
        } else if (screenSize > 800) {
            // Tablet - decrease sensitivity
            this.touchSensitivity = 0.8;
        } else {
            // Standard phone
            this.touchSensitivity = 1.0;
        }

        console.log('📱 Touch sensitivity set to:', this.touchSensitivity);
    }

    setupHapticFeedback() {
        this.hapticPatterns = {
            lightTap: [10],
            mediumTap: [50],
            heavyTap: [100],
            doubleClick: [50, 50, 50],
            success: [30, 30, 30, 30, 30],
            error: [100, 100, 100],
            powerUp: [20, 20, 20, 20, 20, 20]
        };

        // Listen for game events to trigger haptic feedback
        this.scene.events.on('collectibleGathered', () => {
            this.triggerHaptic('lightTap');
        });

        this.scene.events.on('powerUpActivated', () => {
            this.triggerHaptic('powerUp');
        });

        this.scene.events.on('obstacleHit', () => {
            this.triggerHaptic('error');
        });

        this.scene.events.on('levelUp', () => {
            this.triggerHaptic('success');
        });
    }

    optimizeMobileUI() {
        console.log('📱 Optimizing UI for mobile');

        // Adjust UI scaling for mobile
        this.calculateMobileUIScale();
        
        // Optimize touch targets
        this.optimizeTouchTargets();
        
        // Setup thumb-friendly layout
        this.setupThumbFriendlyLayout();
        
        // Configure mobile-specific animations
        this.setupMobileAnimations();
    }

    calculateMobileUIScale() {
        const baseWidth = 800; // Design baseline
        const actualWidth = this.scene.cameras.main.width;
        const actualHeight = this.scene.cameras.main.height;
        
        // Calculate scale factor
        this.uiScale = Math.min(actualWidth / baseWidth, 1.2); // Cap at 120%
        
        // Adjust for very small screens
        if (Math.min(actualWidth, actualHeight) < 400) {
            this.uiScale *= 0.9; // Reduce UI size on very small screens
        }
        
        // Adjust for very large screens (tablets)
        if (Math.min(actualWidth, actualHeight) > 800) {
            this.uiScale *= 1.1; // Increase UI size on tablets
        }

        console.log('📱 Mobile UI scale factor:', this.uiScale);
    }

    optimizeTouchTargets() {
        const minTouchTarget = 44; // iOS HIG minimum
        
        // Store original touch target sizes for adjustment
        this.touchTargetAdjustments = new Map();
        
        // This would be called when UI elements are created
        this.optimizeTouchTarget = (element, minSize = minTouchTarget) => {
            if (!element.displayWidth || !element.displayHeight) return;
            
            const currentSize = Math.min(element.displayWidth, element.displayHeight);
            if (currentSize < minSize) {
                const scale = minSize / currentSize;
                element.setScale(element.scaleX * scale, element.scaleY * scale);
                
                // Add invisible padding for touch area
                if (element.setInteractive) {
                    element.setInteractive({
                        hitArea: new Phaser.Geom.Rectangle(
                            -minSize/2, -minSize/2, minSize, minSize
                        ),
                        hitAreaCallback: Phaser.Geom.Rectangle.Contains
                    });
                }
            }
        };
    }

    setupThumbFriendlyLayout() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        // Define thumb-reach zones
        this.thumbZones = {
            // Easy reach areas for one-handed use
            easyReach: {
                right: { x: width * 0.7, y: height * 0.6, radius: width * 0.25 },
                left: { x: width * 0.3, y: height * 0.6, radius: width * 0.25 }
            },
            // Hard to reach areas to avoid
            hardReach: {
                topCenter: { x: width * 0.5, y: height * 0.1, radius: width * 0.2 },
                topCorners: [
                    { x: width * 0.1, y: height * 0.1, radius: width * 0.15 },
                    { x: width * 0.9, y: height * 0.1, radius: width * 0.15 }
                ]
            }
        };

        // Provide layout recommendations
        this.layoutRecommendations = {
            primaryActions: this.thumbZones.easyReach,
            secondaryActions: { x: width * 0.5, y: height * 0.8 }, // Bottom center
            notifications: { x: width * 0.5, y: height * 0.2 }, // Top center
            score: { x: width * 0.9, y: height * 0.1 } // Top right
        };
    }

    setupMobileAnimations() {
        // Reduce animation complexity on mobile for performance
        this.animationConfig = {
            reducedMotion: this.checkReducedMotionPreference(),
            maxParticles: this.performanceProfile.memoryEstimate < 4 ? 20 : 50,
            animationDuration: this.performanceProfile.hardwareConcurrency < 4 ? 300 : 200,
            easing: 'Power2' // Simpler easing for better performance
        };

        // Apply reduced motion if user prefers it
        if (this.animationConfig.reducedMotion) {
            this.applyReducedMotionSettings();
        }
    }

    checkReducedMotionPreference() {
        return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    applyReducedMotionSettings() {
        // Disable or reduce animations for accessibility
        this.scene.tweens.globalTimeScale = 0.5; // Slow down animations
        
        // Emit event for other systems to reduce their animations
        this.scene.events.emit('reducedMotionEnabled');
    }

    setupOrientationHandling() {
        if (!this.touchCapabilities.orientationSupported) return;

        // Listen for orientation changes
        window.addEventListener('orientationchange', () => {
            this.scene.time.delayedCall(100, () => {
                this.handleOrientationChange();
            });
        });

        // Lock orientation for better gameplay (if supported)
        this.lockOrientation();
    }

    handleOrientationChange() {
        const newOrientation = this.getOrientation();
        console.log('📱 Orientation changed to:', newOrientation);

        // Recalculate UI layout
        this.calculateMobileUIScale();
        this.setupThumbFriendlyLayout();

        // Emit event for other systems to adjust
        this.scene.events.emit('orientationChanged', {
            orientation: newOrientation,
            dimensions: {
                width: this.scene.cameras.main.width,
                height: this.scene.cameras.main.height
            }
        });

        // Show orientation guidance if needed
        if (newOrientation === 'portrait' && this.isMobile.isPhone) {
            this.showOrientationHint();
        }
    }

    getOrientation() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        return width > height ? 'landscape' : 'portrait';
    }

    lockOrientation() {
        if ('screen' in window && 'orientation' in screen && 'lock' in screen.orientation) {
            // Prefer landscape for better gameplay
            screen.orientation.lock('landscape').catch(error => {
                console.log('📱 Could not lock orientation:', error);
            });
        }
    }

    showOrientationHint() {
        if (this.scene.uiManager) {
            this.scene.uiManager.showNotification(
                '📱 Rotate Device',
                'For the best experience, play in landscape mode',
                0xFF9800
            );
        }
    }

    setupBatteryOptimizations() {
        if (!this.performanceProfile.batterySupported) return;

        navigator.getBattery().then(battery => {
            this.batteryLevel = battery.level;
            this.batteryCharging = battery.charging;

            // Apply battery optimizations if needed
            if (this.batteryLevel < 0.2 && !this.batteryCharging) {
                console.log('📱 Low battery detected, applying power saving optimizations');
                this.applyPowerSavingMode();
            }

            // Listen for battery changes
            battery.addEventListener('levelchange', () => {
                this.batteryLevel = battery.level;
                if (this.batteryLevel < 0.1 && !battery.charging) {
                    this.applyEmergencyPowerSaving();
                }
            });

            battery.addEventListener('chargingchange', () => {
                this.batteryCharging = battery.charging;
                if (this.batteryCharging) {
                    this.restoreNormalPerformance();
                }
            });
        });
    }

    applyPowerSavingMode() {
        // Reduce frame rate
        this.scene.sys.game.loop.targetFps = 45;
        
        // Reduce particle effects
        if (this.scene.particleManager) {
            this.scene.particleManager.setMaxParticles(25);
        }
        
        // Reduce animation frequency
        this.scene.tweens.globalTimeScale = 0.8;
        
        this.scene.events.emit('powerSavingEnabled');
    }

    applyEmergencyPowerSaving() {
        // More aggressive power saving
        this.scene.sys.game.loop.targetFps = 30;
        
        // Disable non-essential visual effects
        this.scene.events.emit('emergencyPowerSaving');
        
        if (this.scene.uiManager) {
            this.scene.uiManager.showNotification(
                '🔋 Power Saving',
                'Low battery - reduced visual effects',
                0xF44336
            );
        }
    }

    restoreNormalPerformance() {
        this.scene.sys.game.loop.targetFps = 60;
        this.scene.tweens.globalTimeScale = 1.0;
        this.scene.events.emit('normalPerformanceRestored');
    }

    preventMobileScrolling() {
        // Prevent mobile browser scrolling and zooming
        document.addEventListener('touchmove', (e) => {
            if (e.target === this.scene.sys.canvas) {
                e.preventDefault();
            }
        }, { passive: false });

        document.addEventListener('touchstart', (e) => {
            if (e.target === this.scene.sys.canvas) {
                e.preventDefault();
            }
        }, { passive: false });

        document.addEventListener('touchend', (e) => {
            if (e.target === this.scene.sys.canvas) {
                e.preventDefault();
            }
        }, { passive: false });

        // Prevent zoom
        document.addEventListener('gesturestart', (e) => {
            e.preventDefault();
        });

        document.addEventListener('gesturechange', (e) => {
            e.preventDefault();
        });

        document.addEventListener('gestureend', (e) => {
            e.preventDefault();
        });
    }

    // Touch event handlers
    onPrimaryTouch(pointer) {
        // Main flight control
        this.scene.events.emit('mobileFlightInput', {
            type: 'primary',
            position: { x: pointer.x, y: pointer.y },
            force: this.getTouchForce(pointer)
        });

        this.triggerHaptic('lightTap');
    }

    onLeftTouch(pointer) {
        // Left side special action
        this.scene.events.emit('mobileSpecialInput', {
            type: 'left',
            position: { x: pointer.x, y: pointer.y }
        });
    }

    onRightTouch(pointer) {
        // Right side special action  
        this.scene.events.emit('mobileSpecialInput', {
            type: 'right',
            position: { x: pointer.x, y: pointer.y }
        });
    }

    onQuickTap(pointer) {
        // Quick tap gesture
        this.scene.events.emit('quickTap', pointer);
        this.triggerHaptic('mediumTap');
    }

    onLongPress(pointer) {
        // Long press gesture (pause menu?)
        this.scene.events.emit('longPress', pointer);
        this.triggerHaptic('heavyTap');
    }

    onSwipeGesture(startPos, endPos, duration) {
        const deltaX = endPos.x - startPos.x;
        const deltaY = endPos.y - startPos.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const angle = Math.atan2(deltaY, deltaX);

        const swipeData = {
            direction: this.getSwipeDirection(angle),
            distance,
            duration,
            velocity: distance / duration
        };

        this.scene.events.emit('swipeGesture', swipeData);
        this.triggerHaptic('doubleClick');
    }

    getSwipeDirection(angle) {
        const degrees = angle * (180 / Math.PI);
        if (degrees >= -45 && degrees <= 45) return 'right';
        if (degrees >= 45 && degrees <= 135) return 'down';
        if (degrees >= -135 && degrees <= -45) return 'up';
        return 'left';
    }

    getTouchForce(pointer) {
        if (this.touchCapabilities.touchForceSupported && pointer.force) {
            return pointer.force;
        }
        return 1.0; // Default force
    }

    triggerHaptic(pattern) {
        if (!this.hapticSupported.vibration) return;

        const vibrationPattern = this.hapticPatterns[pattern];
        if (vibrationPattern && navigator.vibrate) {
            navigator.vibrate(vibrationPattern);
        }
    }

    // Public API methods
    isMobileDevice() {
        return this.isMobile.isMobile;
    }

    getDeviceProfile() {
        return {
            ...this.isMobile,
            touchCapabilities: this.touchCapabilities,
            performanceProfile: this.performanceProfile,
            hapticSupported: this.hapticSupported
        };
    }

    getLayoutRecommendations() {
        return this.layoutRecommendations;
    }

    getUIScale() {
        return this.uiScale;
    }

    getTouchSensitivity() {
        return this.touchSensitivity;
    }

    // Update method
    update(time, delta) {
        // Update mobile-specific systems
        if (this.batteryLevel !== undefined && time % 30000 < delta) {
            // Check battery every 30 seconds
            this.checkBatteryOptimizations();
        }
    }

    checkBatteryOptimizations() {
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                if (battery.level !== this.batteryLevel) {
                    this.batteryLevel = battery.level;
                    
                    if (this.batteryLevel < 0.2 && !battery.charging) {
                        this.applyPowerSavingMode();
                    } else if (this.batteryLevel > 0.3 && battery.charging) {
                        this.restoreNormalPerformance();
                    }
                }
            });
        }
    }

    // Cleanup
    cleanup() {
        // Remove event listeners
        window.removeEventListener('orientationchange', this.handleOrientationChange);
        
        // Restore normal performance
        this.restoreNormalPerformance();
        
        // Clean up touch zones
        if (this.primaryTouchZone) this.primaryTouchZone.destroy();
        if (this.leftTouchZone) this.leftTouchZone.destroy();
        if (this.rightTouchZone) this.rightTouchZone.destroy();
    }
}
