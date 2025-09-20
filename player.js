import debugLogger from './debugLogger.js';
import { PLAYER, SCREEN } from './constants.js';
import ElementSizing from './elementSizing.js';

export default class Player {
    constructor(scene, x, y) {
        console.log('🐦 Player constructor called at position:', x, y);
        this.scene = scene;
        
        // Check if texture exists
        if (!scene.textures.exists('getBirdMascot')) {
            console.error('❌ getBirdMascot texture not found!');
        } else {
            console.log('✅ getBirdMascot texture exists');
        }
        
        this.sprite = scene.physics.add.sprite(x, y, 'getBirdMascot');
        console.log('🐦 Player sprite created:', !!this.sprite);
        console.log('🐦 Player sprite position:', this.sprite.x, this.sprite.y);
        console.log('🐦 Player sprite visible:', this.sprite.visible);
        
        // Get screen dimensions for boundary and movement calculations
        const screenWidth = scene.cameras.main.width;
        const screenHeight = scene.cameras.main.height;
        
        // Initialize standardized element sizing system
        this.elementSizing = new ElementSizing(scene);
        
        // Set player to standardized size (48px by default, responsive to screen size)
        const playerScale = this.elementSizing.setSpriteToStandardSize(this.sprite, 'player');
        
        debugLogger.log(`Player initialized with standardized scale: ${playerScale.toFixed(3)}`);
        this.sprite.setCollideWorldBounds(true);
        this.sprite.setOrigin(0.5, 0.8);
        
        // Configure physics body for gravity-based movement
        if (this.sprite.body) {
            this.sprite.body.setGravityY(800);
            this.sprite.body.setBounce(0.1);
            this.sprite.body.setDrag(100);
            this.sprite.body.setMaxVelocity(400, 600);
        }
        
        // Store responsive movement boundaries
        this.updateBoundaries(screenWidth, screenHeight);
        
        // Responsive movement speed based on screen size (use elementSizing scale factor)
        const responsiveScale = this.elementSizing.getResponsiveScale();
        this.moveSpeed = Math.max(6, 8 * responsiveScale);
        
        this.isGrounded = false;
        this.jumpPower = PLAYER.MOVEMENT.JUMP_POWER;
        this.flyPower = PLAYER.MOVEMENT.FLY_POWER;
        this.isFlying = false;
        this.shieldActive = false;
        
        // Health system
        this.health = 3;
        this.maxHealth = 3;
        this.invulnerable = false;
        this.invulnerabilityTime = 0;
        
        // Simple vertical movement system
        this.isFluidMoving = false;
        this.targetX = x;
        this.targetY = y;
        this.fluidSpeed = PLAYER.MOVEMENT.FLUID_SPEED;
        this.fluidBoundaryMargin = 30;
        
        // Visual effects
        // this.sprite.setTint(0xFFFFFF); // REMOVED - no tinting
    }

    update(time, delta) {
        // Check if grounded
        this.isGrounded = this.sprite.body.touching.down;
        
        // Apply subtle floating animation with vertical position influence
        if (!this.isFlying) {
            const verticalInfluence = (this.sprite.y - this.scene.centerY) * 0.02;
            this.sprite.angle = Math.sin(time * 0.003) * 5 - verticalInfluence;
        }
        
        // Flying state management
        if (this.isFlying && this.sprite.body.velocity.y > -100) {
            this.isFlying = false;
        }
        
        // Add subtle rotation based on vertical velocity (only when not fluid moving)
        if (this.sprite.body.velocity.y !== 0 && !this.scene.isDashing && !this.isFluidMoving) {
            const velocityAngle = Math.max(-15, Math.min(15, this.sprite.body.velocity.y * 0.03));
            this.sprite.angle += (velocityAngle - this.sprite.angle) * 0.1;
        }
        
        // Update fluid movement
        this.updateFluidMovement();
        
        // Update invulnerability
        this.updateInvulnerability(time);
        
        // Enforce boundaries to prevent cutoff
        this.enforceBoundaries();
    }
    
    enforceBoundaries() {
        if (!this.sprite || !this.sprite.body) return;
        
        // Horizontal boundaries
        if (this.leftBoundary !== undefined && this.sprite.x < this.leftBoundary) {
            this.sprite.x = this.leftBoundary;
        }
        if (this.rightBoundary !== undefined && this.sprite.x > this.rightBoundary) {
            this.sprite.x = this.rightBoundary;
        }
        
        // Vertical boundaries
        if (this.topBoundary !== undefined && this.sprite.y < this.topBoundary) {
            this.sprite.y = this.topBoundary;
            // Stop upward velocity to prevent getting stuck at top
            if (this.sprite.body.velocity.y < 0) {
                this.sprite.body.setVelocityY(0);
            }
        }
        if (this.bottomBoundary !== undefined && this.sprite.y > this.bottomBoundary) {
            this.sprite.y = this.bottomBoundary;
            // Stop downward velocity to prevent getting stuck at bottom
            if (this.sprite.body.velocity.y > 0) {
                this.sprite.body.setVelocityY(0);
            }
        }
    }

    jump() {
        // Always allow a flap to give immediate upward velocity
        this.sprite.setVelocityY(this.jumpPower);
        this.isFlying = true;
        this.sprite.angle = -15;
    }

    fly() {
        console.log('🐦 fly() method called!');
        console.log('🐦 sprite exists:', !!this.sprite);
        console.log('🐦 sprite.body exists:', !!(this.sprite && this.sprite.body));
        
        // Much more responsive flying - apply a significantly stronger upward impulse for better tap response
        const impulse = Math.min(-400, this.flyPower); // Increased from -250 to -400
        this.sprite.setVelocityY(impulse);
        this.isFlying = true;
        this.sprite.angle = -25; // Slightly more angle to show stronger movement
        
        console.log('🐦 Velocity set to:', impulse);
        console.log('🐦 Current velocity Y:', this.sprite.body ? this.sprite.body.velocity.y : 'no body');
        
        // Visual feedback for flying
        // this.sprite.setTint(0xE6F3FF); // REMOVED - no tinting
        this.scene.time.delayedCall(200, () => {
            if (this.sprite && this.sprite.active) {
                // this.sprite.setTint(0xFFFFFF); // REMOVED - no tinting
            }
        });
    }

    moveLeft() {
        if (this.sprite.x > this.leftBoundary) {
            this.sprite.x -= this.moveSpeed;
        }
    }
    moveRight() {
        if (this.sprite.x < this.rightBoundary) {
            this.sprite.x += this.moveSpeed;
        }
    }
    
    updateBoundaries(screenWidth, screenHeight) {
        // Calculate responsive boundaries with better safe margins
        const marginPercent = 0.12; // 12% margin from edges (increased for better safety)
        const minMargin = 50; // Minimum 50px margin
        
        this.leftBoundary = Math.max(minMargin, screenWidth * marginPercent);
        this.rightBoundary = Math.min(screenWidth - minMargin, screenWidth * (1 - marginPercent));
        
        // Vertical boundaries to prevent player from going off-screen
        const verticalMargin = Math.max(40, screenHeight * 0.08);
        this.topBoundary = verticalMargin;
        this.bottomBoundary = screenHeight - verticalMargin;
        
        // Store screen dimensions for reference
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;
        
        // Update world bounds for physics with safe margins
        if (this.sprite && this.sprite.body) {
            this.scene.physics.world.setBounds(
                this.leftBoundary, 
                this.topBoundary, 
                this.rightBoundary - this.leftBoundary, 
                this.bottomBoundary - this.topBoundary
            );
        }
    }

    setShield(active) {
        this.shieldActive = active;
        if (active) {
            // this.sprite.setTint(0xFFD700); // REMOVED - no tinting
            this.sprite.setAlpha(0.8);
        } else {
            // this.sprite.setTint(0xFFFFFF); // REMOVED - no tinting
            this.sprite.setAlpha(1);
        }
    }

    getHit() {
        if (this.shieldActive) {
            return false; // No damage with shield
        }
        return true; // Take damage
    }
    
    takeDamage() {
        if (this.shieldActive || this.invulnerable) {
            return false; // No damage with shield or invulnerability
        }
        
        this.health = Math.max(0, this.health - 1);
        
        // Visual feedback
        // this.sprite.setTint(0xFF0000); // REMOVED - no tinting
        this.scene.time.delayedCall(200, () => {
            // this.sprite.setTint(0xFFFFFF); // REMOVED - no tinting
        });
        
        // Invulnerability period
        this.invulnerable = true;
        this.invulnerabilityTime = this.scene.time.now + 1000; // 1 second
        
        return true; // Damage taken
    }
    
    heal(amount = 1) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }
    
    updateInvulnerability(time) {
        if (this.invulnerable && time > this.invulnerabilityTime) {
            this.invulnerable = false;
        }
    }
    
    startFluidMovement() {
        try {
            // Make sure sprite exists and is active
            if (!this.sprite || !this.sprite.active) {
                debugLogger.warn("Cannot start fluid movement - sprite not available");
                return;
            }
            
            this.isFluidMoving = true;
            
            // Force sprite to be visible
            this.sprite.setVisible(true);
            this.sprite.setAlpha(1);
            
            // Lock bird to center of screen horizontally
            this.sprite.x = this.scene.centerX;
            this.targetX = this.scene.centerX;
            
            // Ensure the sprite has a valid position
            if (isNaN(this.sprite.y)) {
                this.sprite.y = this.scene.centerY;
            }
            
            // Glow effect DISABLED - keep original bird color
            // this.sprite.setTint(0xE6F3FF);
            
            // Start trail particles
            if (this.scene.birdTrailParticles) {
                this.scene.birdTrailParticles.setPosition(this.sprite.x, this.sprite.y);
                this.scene.birdTrailParticles.start();
            }
            
            // Make sure physics body is enabled
            if (this.sprite.body) {
                this.sprite.body.enable = true;
            }
            
            // Force a frame update to ensure rendering
            this.scene.game.renderer.pipeline.forceZero = false;
        } catch (error) {
            debugLogger.error("Error in startFluidMovement:", error);
        }
    }
    
    // Set the sprite position so that its visual center aligns with world coordinates
    setPositionTo(worldX, worldY) {
        try {
            if (!this.sprite || !this.sprite.active) return;
            
            // Lock horizontal position to center-left area like reference image
            const leftX = this.scene.screenWidth * 0.35; // About 35% from left edge (center-left positioning)
            const displayHeight = this.sprite.displayHeight || this.sprite.height;
            const centerOffsetY = (this.sprite.originY - 0.5) * displayHeight;
            
            // Only adjust vertical position
            const adjustedY = worldY - centerOffsetY;
            
            this.sprite.x = leftX;
            this.sprite.y = adjustedY;
            
            if (this.sprite.body && this.sprite.body.enable) {
                this.sprite.body.x = leftX;
                this.sprite.body.y = adjustedY;
                this.sprite.body.setVelocity(0, 0);
            }
            
            // Update targets for fluid follow next frames
            this.targetX = leftX;
            this.targetY = adjustedY;
        } catch (e) {
            debugLogger.warn('Error in setPositionTo:', e);
        }
    }
    
    stopFluidMovement() {
        try {
            // Check if sprite exists before trying to modify it
            if (!this.sprite || !this.sprite.active) {
                debugLogger.warn("Cannot stop fluid movement - sprite not available");
                return;
            }
            
            this.isFluidMoving = false;
            
            // Return to normal appearance
            // this.sprite.setTint(0xFFFFFF); // REMOVED - no tinting
            
            // Stop trail particles
            if (this.scene.birdTrailParticles) {
                this.scene.birdTrailParticles.stop();
            }
        } catch (error) {
            debugLogger.error("Error in stopFluidMovement:", error);
        }
    }
    
    updateFluidPosition(targetX, targetY) {
        try {
            // Make sure sprite exists and is active
            if (!this.sprite || !this.sprite.active) {
                debugLogger.warn("Cannot update fluid position - sprite not available");
                return;
            }

            // Ensure sprite is visible
            if (!this.sprite.visible || this.sprite.alpha < 1) {
                this.sprite.setVisible(true);
                this.sprite.setAlpha(1);
            }

            // Only update vertical target - horizontal stays locked to center
            this.targetY = targetY;
            this.targetX = this.scene.centerX; // Always lock to center

            // If we're not fluid moving yet, start it immediately
            if (!this.isFluidMoving) {
                this.startFluidMovement();
            }
        } catch (error) {
            debugLogger.error("Error in updateFluidPosition:", error);
        }
    }
    
    quickBoost() {
        // Much stronger upward boost for quick taps
        this.sprite.setVelocityY(-350); // Increased from -200 to -350
        this.isFlying = true;
        this.sprite.angle = -20; // Increased angle for stronger movement
        
        // Visual feedback
        // this.sprite.setTint(0x00FF00); // REMOVED - no tinting
        this.scene.time.delayedCall(300, () => {
            // this.sprite.setTint(0xFFFFFF); // REMOVED - no tinting
        });
    }
    
    updateFluidMovement() {
        try {
            if (!this.isFluidMoving) return;
            
            // Make sure sprite exists and is active
            if (!this.sprite || !this.sprite.active) {
                debugLogger.warn("Cannot update fluid movement - sprite not available");
                return;
            }
            
            // Ensure sprite is visible
            if (!this.sprite.visible || this.sprite.alpha < 1) {
                this.sprite.setVisible(true);
                this.sprite.setAlpha(1);
            }
            
            // Keep bird locked to center horizontally
            this.sprite.x = this.scene.centerX;
            
            // Only move vertically towards target
            const currentY = this.sprite.y;
            const distanceToTarget = Math.abs(currentY - this.targetY);
            
            if (distanceToTarget > 5) {
                // Smooth vertical movement
                const direction = this.targetY > currentY ? 1 : -1;
                const moveDistance = this.fluidSpeed * 16.67; // Frame-rate independent
                
                if (Math.abs(this.targetY - currentY) <= moveDistance) {
                    this.sprite.y = this.targetY;
                } else {
                    this.sprite.y += direction * moveDistance;
                }
            }
            
            // Update physics body position to prevent conflicts
            if (this.sprite.body && this.sprite.body.enable) {
                this.sprite.body.x = this.sprite.x;
                this.sprite.body.y = this.sprite.y;
                // Reset velocity to prevent physics conflicts
                this.sprite.body.setVelocity(0, 0);
            }
            
            // Add subtle rotation based on vertical movement direction
            const deltaY = this.targetY - currentY;
            const movementAngle = deltaY > 0 ? 90 : -90; // Up or down
            
            // Smooth rotation towards movement direction
            const currentAngle = this.sprite.angle;
            const angleDiff = Phaser.Math.Angle.Wrap(movementAngle - currentAngle);
            
            this.sprite.angle += angleDiff * 0.1;
            
            // Update trail particles position
            if (this.scene.birdTrailParticles && this.isFluidMoving) {
                this.scene.birdTrailParticles.setPosition(this.sprite.x, this.sprite.y);
            }
        } catch (error) {
            debugLogger.error("Error in updateFluidMovement:", error);
        }
    }
}


