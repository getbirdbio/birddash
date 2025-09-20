import debugLogger from './debugLogger.js';

export default class MobileControls {
    constructor(scene) {
        this.scene = scene;
        this.setupControls();
    }

    setupControls() {
        // Simple tap-to-fly system (like keyboard up arrow)
        this.scene.input.on('pointerdown', (pointer, currentlyOver) => {
            if (!this.scene.gameRunning) return;
            
            // Ignore touches on UI elements
            if (currentlyOver && currentlyOver.length > 0) {
                const topObject = currentlyOver[0];
                if (topObject.name === 'leaderboardButton') {
                    return;
                }
            }
            
            // Ensure this is a valid tap
            if (!pointer || typeof pointer.x !== 'number' || typeof pointer.y !== 'number') {
                return;
            }
            
            // Make sure player exists before trying to move it
            if (!this.scene.player || !this.scene.player.sprite || !this.scene.player.sprite.active) {
                debugLogger.warn("Player not available for movement");
                return;
            }
            
            // Ensure the bird sprite is visible
            if (this.scene.player.sprite.alpha < 1) {
                this.scene.player.sprite.setAlpha(1);
            }
            
            // Make sure the player sprite is visible before starting movement
            if (this.scene.player && this.scene.player.sprite) {
                // Force sprite to be visible
                this.scene.player.sprite.setVisible(true);
                this.scene.player.sprite.setAlpha(1);
                
                // Make bird fly immediately on tap (like pressing up arrow)
                this.scene.player.fly();
                
                // Lock bird to left position horizontally
                const leftPosition = Math.max(80, this.scene.screenWidth * 0.08);
                this.scene.player.sprite.x = leftPosition;
                
                // Visual feedback DISABLED - keep original bird colors
                // this.scene.player.sprite.setTint(0x00FF00);
                // this.scene.time.delayedCall(200, () => {
                //     if (this.scene.player && this.scene.player.sprite && this.scene.player.sprite.active) {
                //         this.scene.player.sprite.setTint(0xFFFFFF);
                //     }
                // });
            }
            
            // Visual feedback for touch start
            if (this.scene.add) {
                const touchIndicator = this.scene.add.circle(pointer.x, pointer.y, 20, 0xFFFFFF, 0.4)
                    .setDepth(2000);
                
                // Add a target indicator to show the tap location
                const targetIndicator = this.scene.add.circle(pointer.x, pointer.y, 8, 0x00FF00, 0.6)
                    .setDepth(2000);
                
                this.scene.tweens.add({
                    targets: touchIndicator,
                    radius: 40,
                    alpha: 0,
                    duration: 300,
                    onComplete: () => touchIndicator.destroy()
                });
                
                // Keep target indicator visible for a bit longer
                this.scene.time.delayedCall(500, () => {
                    if (targetIndicator && targetIndicator.scene) {
                        targetIndicator.destroy();
                    }
                });
            }
        });
        
        // No pointer move or up events needed for simple tap system
        
        // Handle pointer cancel (when finger leaves screen area)
        this.scene.input.on('pointercancel', () => {
            // No action needed for simple tap system
        });

        // Keyboard controls for desktop testing
        this.setupKeyboardControls();
    }

    setupKeyboardControls() {
        this.cursors = this.scene.input.keyboard.createCursorKeys();
        // Don't create WASD keys globally - handle them in keydown event instead
        // this.wasd = this.scene.input.keyboard.addKeys('W,S,A,D,SPACE');
        
        this.scene.input.keyboard.on('keydown', (event) => {
            if (!this.scene.gameRunning) return;
            
            // Check if any input field is currently focused
            const activeElement = document.activeElement;
            const isInputFocused = activeElement && 
                (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA');
            
            // Also check if leaderboard is showing (pause removed)
            const isMenuShowing = (this.scene.leaderboard && this.scene.leaderboard.isShowingLeaderboard) ||
                                  (this.scene.leaderboard && this.scene.leaderboard.nameInput) ||
                                  !this.scene.gameRunning;
            
            if (isInputFocused || isMenuShowing) {
                debugLogger.log('controls', 'Input focused or menu showing, blocking game control for:', event.code);
                // Don't prevent default or stop propagation for input fields
                if (!isInputFocused) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                return; // Don't process game controls when typing in input fields or in menus
            }
            
            switch (event.code) {
                case 'Space':
                case 'ArrowUp':
                case 'KeyW':
                    this.scene.player.jump();
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.scene.player.moveLeft();
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.scene.player.moveRight();
                    break;
                case 'KeyF':
                    // Toggle fluid movement for desktop testing
                    if (this.scene.player.isFluidMoving) {
                        this.scene.player.stopFluidMovement();
                    } else {
                        this.scene.player.startFluidMovement();
                    }
                    break;
                case 'ArrowDown':
                case 'KeyS':
                case 'ShiftLeft':
                case 'ShiftRight':
                    this.scene.performDash();
                    break;
            }
        });
        
        // Mouse movement for desktop testing
        this.scene.input.on('pointermove', (pointer) => {
            if (!this.scene.gameRunning || !this.scene.player.isFluidMoving) return;
            
            // Only respond to mouse movement when F key is held (fluid mode active)
            this.scene.player.updateFluidPosition(pointer.x, pointer.y);
        });
    }
}


