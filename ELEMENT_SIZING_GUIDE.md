# Element Sizing System Guide

## Overview

The Element Sizing System ensures all game elements (player, collectibles, power-ups, obstacles) are exactly the same pixel size regardless of their source image dimensions. This makes it easy to swap out images while maintaining consistent visual balance.

## How It Works

### Standard Sizes (in pixels)
- **Player Bird**: 77px
- **Collectibles**: 88px (smoothies, bagels)
- **Coffee Cups**: 
  - Small Coffee: 80px
  - Medium Coffee: 95px
  - Large Coffee: 110px
  - Specialty Coffee: 125px
- **Power-ups**: 61px (slightly smaller than collectibles)
- **Obstacles**: 72px
- **Companions**: 57px (bird companions, smaller than player)
- **UI Icons**: 51px

### Responsive Scaling
- Base resolution: 480x854 (mobile standard)
- Automatically scales up/down based on screen size
- Scale factor range: 0.8x to 1.4x
- Uses the smaller dimension (width/height ratio) to ensure elements fit

## Usage

### For New Images

1. **Add your PNG file** to the project root (e.g., `myNewImage.png`)

2. **Load it in preloaderScene.js**:
```javascript
// In preload() method
this.load.image('myTextureName', 'myNewImage.png');
```

3. **The system automatically handles sizing** - no matter if your image is 32x32, 256x256, or 1024x512, it will display at the exact standard size for its element type.

### For Existing Elements

Elements are automatically sized when created:
- **Player**: Uses `'player'` type (48px)
- **Collectibles**: Use `'collectible'` type (42px)  
- **Power-ups**: Use `'powerup'` type (38px)
- **Companions**: Use `'companion'` type (36px)

### Manual Sizing (Advanced)

If you need to manually size an element:

```javascript
import ElementSizing from './elementSizing.js';

// In your scene
const elementSizing = new ElementSizing(this);

// Set a sprite to standard size
elementSizing.setSpriteToStandardSize(mySprite, 'collectible');

// Or calculate scale manually
const scale = elementSizing.calculateScaleForPixelSize(mySprite, 42);
mySprite.setScale(scale);
```

## Benefits

### ✅ Consistency
- All elements of the same type are exactly the same size
- Visual balance maintained across different images

### ✅ Easy Asset Swapping
- Replace any image without worrying about size
- No need to manually adjust scales

### ✅ Responsive Design
- Automatically adapts to different screen sizes
- Maintains proportions on mobile and desktop

### ✅ Performance
- Efficient scaling calculations
- Cached responsive factors

## File Structure

- `elementSizing.js` - Main sizing system
- `ELEMENT_SIZING_GUIDE.md` - This documentation
- Modified files:
  - `player.js` - Uses standardized player sizing
  - `collectibleManager.js` - Uses standardized collectible/power-up sizing

## Examples

### Replacing the Smoothie Image
```javascript
// 1. Add new smoothie PNG to project root
// 2. In preloaderScene.js:
this.load.image('smoothie', 'myNewSmoothie.png');

// 3. That's it! The system automatically makes it 42px (collectible size)
```

### Adding a New Collectible Type
```javascript
// 1. Load your image
this.load.image('newCollectible', 'newItem.png');

// 2. In collectibleManager.js, the existing code will automatically
//    size it correctly using: elementSizing.setSpriteToStandardSize(item, 'collectible')
```

## Customization

To change the standard sizes, edit `ELEMENT_SIZES` in `elementSizing.js`:

```javascript
export const ELEMENT_SIZES = {
    PLAYER: 48,           // Change player size
    COLLECTIBLE: 42,      // Change collectible size
    POWER_UP: 38,         // Change power-up size
    // etc...
};
```

## Debug Information

The system logs scaling information to the console:
- `🎮 ElementSizing initialized` - Shows screen size and scale factor
- `📏 Scale calc` - Shows texture dimensions and calculated scale
- Individual element scaling logs in collectible and player creation

This makes it easy to verify that elements are being sized correctly.
