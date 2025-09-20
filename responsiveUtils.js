/**
 * Responsive Design Utility
 * Centralized responsive calculations and utilities
 */

import { SCREEN, UI, RESPONSIVE } from './constants.js';

class ResponsiveUtils {
    constructor(scene) {
        this.scene = scene;
        this.updateDimensions();
    }

    updateDimensions() {
        this.screenWidth = this.scene.cameras.main.width;
        this.screenHeight = this.scene.cameras.main.height;
        this.centerX = this.screenWidth / 2;
        this.centerY = this.screenHeight / 2;
        
        // Calculate scale factors
        this.heightScale = this.screenHeight / SCREEN.BASE_HEIGHT;
        this.widthScale = this.screenWidth / SCREEN.BASE_WIDTH;
        this.minScale = Math.max(SCREEN.MIN_SCALE, Math.min(this.heightScale, this.widthScale * 1.2));
        
        // Determine screen type
        this.screenType = this.screenHeight < RESPONSIVE.BREAKPOINTS.SMALL ? 'small' : 
                         this.screenHeight < RESPONSIVE.BREAKPOINTS.MEDIUM ? 'medium' : 'large';
    }

    // Get responsive font size
    getFontSize(size = 'MEDIUM') {
        const baseSize = UI.FONT_SIZES[size] || UI.FONT_SIZES.MEDIUM;
        return Math.max(baseSize * 0.8, Math.min(baseSize * 1.2, baseSize * this.minScale));
    }

    // Get responsive margin
    getMargin(size = 'MEDIUM') {
        const baseMargin = UI.MARGINS[size] || UI.MARGINS.MEDIUM;
        return Math.max(baseMargin, baseMargin * this.minScale);
    }

    // Calculate safe position within screen bounds
    getSafePosition(x, y) {
        const safeMarginX = this.screenWidth * RESPONSIVE.SAFE_MARGINS.X;
        const safeMarginY = this.screenHeight * RESPONSIVE.SAFE_MARGINS.Y;
        
        return {
            x: Phaser.Math.Clamp(x, safeMarginX, this.screenWidth - safeMarginX),
            y: Phaser.Math.Clamp(y, safeMarginY, this.screenHeight - safeMarginY)
        };
    }

    // Get responsive scale for game objects
    getObjectScale(baseScale = 1.0, multiplier = 1.0) {
        return baseScale * this.minScale * multiplier;
    }

    // Calculate responsive spawn position
    getSpawnPosition(edge = 'right') {
        switch(edge) {
            case 'right':
                return {
                    x: this.screenWidth + Phaser.Math.Between(20, 80),
                    y: Phaser.Math.Between(this.screenHeight * 0.25, this.screenHeight * 0.75)
                };
            case 'left':
                return {
                    x: -50,
                    y: Phaser.Math.Between(this.screenHeight * 0.25, this.screenHeight * 0.75)
                };
            case 'top':
                return {
                    x: Phaser.Math.Between(this.screenWidth * 0.25, this.screenWidth * 0.75),
                    y: -50
                };
            case 'bottom':
                return {
                    x: Phaser.Math.Between(this.screenWidth * 0.25, this.screenWidth * 0.75),
                    y: this.screenHeight + 50
                };
            default:
                return { x: this.centerX, y: this.centerY };
        }
    }

    // Get level boundaries
    getLevelBoundaries() {
        return {
            groundLevel: this.screenHeight * 0.85,
            midLevel: this.screenHeight * 0.6,
            skyLevel: this.screenHeight * 0.3,
            lowSkyLevel: this.screenHeight * 0.45
        };
    }

    // Calculate word wrap width
    getWordWrapWidth(percentage = 0.3) {
        return Math.min(this.screenWidth * percentage, 200);
    }

    // Check if text fits within bounds
    doesTextFit(text, maxWidth) {
        return text.width <= maxWidth;
    }

    // Scale text to fit
    scaleTextToFit(text, maxWidth) {
        if (text.width > maxWidth) {
            const scaleFactor = maxWidth / text.width;
            text.setScale(scaleFactor);
        }
    }

    // Get responsive animation distance
    getAnimationDistance(baseDistance = 50) {
        return Math.min(baseDistance, this.screenHeight * 0.08);
    }

    // Get indicator position for power-ups
    getIndicatorPosition(index = 0) {
        const margin = Math.max(30, 30 * this.minScale); // Use updated safe margins
        const lineHeight = Math.max(18, 20 * this.minScale); // Increased line height
        const startY = Math.max(80, 80 * this.minScale); // Start below score text with more space
        const y = startY + (lineHeight * index * 1.5); // More spacing between indicators
        
        return { x: margin, y: y };
    }

    // Check screen size category
    isSmallScreen() {
        return this.screenType === 'small';
    }

    isMediumScreen() {
        return this.screenType === 'medium';
    }

    isLargeScreen() {
        return this.screenType === 'large';
    }
}

export default ResponsiveUtils;
