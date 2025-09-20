// Element Sizing System for Bird Dash
// Ensures all game elements are exactly the same pixel size regardless of source image dimensions

export const ELEMENT_SIZES = {
    // Standard sizes in pixels (collectibles increased by 30%)
    PLAYER: 77,           // Player bird size (unchanged)
    COLLECTIBLE: 114,     // Smoothies, bagels, etc. (was 88, now 88 * 1.3 = 114px)
    
    // Different coffee cup sizes (all increased by 30%)
    COFFEE_SMALL: 104,    // Small coffee cup (was 80, now 80 * 1.3 = 104px)
    COFFEE_MEDIUM: 124,   // Medium coffee cup (was 95, now 95 * 1.3 = 124px)
    COFFEE_LARGE: 143,    // Large coffee cup (was 110, now 110 * 1.3 = 143px)
    COFFEE_SPECIALTY: 163, // Specialty coffee (was 125, now 125 * 1.3 = 163px)
    
    POWER_UP: 61,         // Power-ups (was 38 → 46 → 55 → 61px, +61% total)
    OBSTACLE: 72,         // Obstacles (was 45 → 54 → 65 → 72px, +60% total)
    COMPANION: 57,        // Bird companions (was 36 → 43 → 52 → 57px, +58% total)
    
    // UI elements
    UI_ICON: 51,          // UI icons and buttons (was 32 → 38 → 46 → 51px, +59% total)
    
    // Responsive scaling factors (will multiply the base sizes above)
    MIN_SCALE_FACTOR: 0.8,  // Minimum scale on very small screens
    MAX_SCALE_FACTOR: 1.4,  // Maximum scale on very large screens
};

export default class ElementSizing {
    constructor(scene) {
        this.scene = scene;
        this.screenWidth = scene.cameras.main.width;
        this.screenHeight = scene.cameras.main.height;
        
        // Calculate responsive scale factor based on screen size
        // Base resolution: 480x854 (mobile standard)
        const baseWidth = 480;
        const baseHeight = 854;
        
        const widthRatio = this.screenWidth / baseWidth;
        const heightRatio = this.screenHeight / baseHeight;
        
        // Use the smaller ratio to ensure elements fit on screen
        this.responsiveScaleFactor = Math.min(widthRatio, heightRatio);
        
        // Clamp between min and max scale factors
        this.responsiveScaleFactor = Math.max(
            ELEMENT_SIZES.MIN_SCALE_FACTOR,
            Math.min(ELEMENT_SIZES.MAX_SCALE_FACTOR, this.responsiveScaleFactor)
        );
        
        console.log(`🎮 ElementSizing initialized: Screen ${this.screenWidth}x${this.screenHeight}, Scale Factor: ${this.responsiveScaleFactor.toFixed(3)}`);
    }
    
    /**
     * Calculate the Phaser scale needed to make any sprite exactly the target pixel size
     * @param {Phaser.GameObjects.Sprite} sprite - The sprite to calculate scale for
     * @param {number} targetPixelSize - Desired size in pixels
     * @returns {number} The scale value to apply to the sprite
     */
    calculateScaleForPixelSize(sprite, targetPixelSize) {
        if (!sprite || !sprite.texture) {
            console.warn('⚠️ ElementSizing: Invalid sprite provided');
            return 1;
        }
        
        // Get the original texture dimensions
        const textureWidth = sprite.texture.source[0].width;
        const textureHeight = sprite.texture.source[0].height;
        
        // Use the larger dimension to ensure the sprite fits within the target size
        const largerDimension = Math.max(textureWidth, textureHeight);
        
        // Calculate base scale to achieve target pixel size
        const baseScale = targetPixelSize / largerDimension;
        
        // Apply responsive scaling
        const finalScale = baseScale * this.responsiveScaleFactor;
        
        console.log(`📏 Scale calc: ${textureWidth}x${textureHeight} -> ${targetPixelSize}px = ${finalScale.toFixed(3)}`);
        
        return finalScale;
    }
    
    /**
     * Set a sprite to exact pixel size for its element type
     * @param {Phaser.GameObjects.Sprite} sprite - The sprite to resize
     * @param {string} elementType - Type: 'player', 'collectible', 'powerup', 'obstacle', 'companion'
     */
    setSpriteToStandardSize(sprite, elementType) {
        const targetSize = this.getStandardSize(elementType);
        const scale = this.calculateScaleForPixelSize(sprite, targetSize);
        sprite.setScale(scale);
        return scale;
    }
    
    /**
     * Get the standard pixel size for an element type
     * @param {string} elementType - Type: 'player', 'collectible', 'powerup', 'obstacle', 'companion'
     * @returns {number} Target pixel size
     */
    getStandardSize(elementType) {
        switch (elementType.toLowerCase()) {
            case 'player':
                return ELEMENT_SIZES.PLAYER;
            case 'collectible':
            case 'smoothie':
            case 'bagel':
                return ELEMENT_SIZES.COLLECTIBLE;
            case 'coffee_small':
            case 'small_coffee':
                return ELEMENT_SIZES.COFFEE_SMALL;
            case 'coffee_medium':
            case 'medium_coffee':
                return ELEMENT_SIZES.COFFEE_MEDIUM;
            case 'coffee_large':
            case 'large_coffee':
                return ELEMENT_SIZES.COFFEE_LARGE;
            case 'coffee_specialty':
            case 'specialty_coffee':
                return ELEMENT_SIZES.COFFEE_SPECIALTY;
            case 'powerup':
            case 'power-up':
            case 'power_up':
                return ELEMENT_SIZES.POWER_UP;
            case 'obstacle':
                return ELEMENT_SIZES.OBSTACLE;
            case 'companion':
            case 'bird':
                return ELEMENT_SIZES.COMPANION;
            case 'ui':
            case 'ui_icon':
                return ELEMENT_SIZES.UI_ICON;
            default:
                console.warn(`⚠️ Unknown element type: ${elementType}, using collectible size`);
                return ELEMENT_SIZES.COLLECTIBLE;
        }
    }
    
    /**
     * Get responsive scale factor for manual calculations
     * @returns {number} Current responsive scale factor
     */
    getResponsiveScale() {
        return this.responsiveScaleFactor;
    }
    
    /**
     * Get the final pixel size that will be displayed for an element type
     * @param {string} elementType - Element type
     * @returns {number} Final display size in pixels
     */
    getFinalDisplaySize(elementType) {
        return this.getStandardSize(elementType) * this.responsiveScaleFactor;
    }
}
