# Bird Dash - Game Elements Reference

## Visual Assets (All Using Emojis)

### Player
- **Bird Mascot**: 🐦 (getBirdMascot texture)
- Scale: 0.06-0.08 (responsive)
- Has physics body with gravity

### Collectibles (Coffee Beans Group)

#### Coffee Items (coffeeBean texture ☕)
| Item | Size | Points | Spawn Weight |
|------|------|--------|--------------|
| Small Coffee | 80px | 20 | 40% |
| Medium Coffee | 95px | 40 | 30% |
| Large Coffee | 110px | 70 | 20% |
| Specialty Coffee | 125px | 150 | 10% |

#### Smoothies (smoothie texture)
| Item | Size | Points | Effect |
|------|------|--------|--------|
| Berry Smoothie | 88px | 15 | +1 Health |
| Green Smoothie | 88px | 15 | Speed x1.5 for 5s |
| Tropical Smoothie | 88px | 25 | Health + Speed |

#### Bagels (bagel texture)
| Item | Size | Points | Effect |
|------|------|--------|--------|
| Plain Bagel | 88px | 30 | 2x Score for 8s |
| Everything Bagel | 88px | 50 | 2.5x Score for 12s |
| Blueberry Bagel | 88px | 75 | 3x Score for 15s |

#### Bird Companions (companion textures)
| Item | Size | Points | Effect |
|------|------|--------|--------|
| Sparrow Friend | 57px | 40 | Auto-collect 80px radius for 15s |
| Robin Friend | 57px | 60 | Auto-collect 100px radius for 20s |
| Cardinal Friend | 57px | 100 | Auto-collect 120px radius for 25s |

### Power-ups

| Power-up | Texture | Scale | Duration | Effect |
|----------|---------|-------|----------|--------|
| Shield | croissantShieldPowerUp (🥐) | 0.06x | 3s | Invulnerability |
| Speed Boost | espressoShot (⚡) | 0.06x | 4s | 1.5x movement speed |
| Score Multiplier | websterPowerUp (👨‍💼) | 0.06x | 5s | 2x score |
| Time Slow | thaboPowerUp (👨‍🍳) | 0.06x | 6s | 0.6x obstacle speed |
| Magnet | magnetPowerUp (🧲) | 0.06x | 5s | Attracts beans in 150px |
| Time Freeze | timeFreezePowerUp (⏱️) | 0.06x | 3s | Stops obstacles |
| Health | healthPowerUp (❤️) | 0.06x | Instant | +1 heart |

### Obstacles

| Obstacle | Texture | Tint | Scale | Speed | Pattern |
|----------|---------|------|-------|-------|---------|
| Spilled Cup | spilledCoffeeCup (🥤) | White | 0.18-0.24x | 1.0x | Static/Float |
| Floating Cup | spilledCoffeeCup (🥤) | Light Red (#FFAAAA) | 0.16-0.20x | 0.8x | Sine wave |
| Heavy Cup | spilledCoffeeCup (🥤) | Brown (#8B4513) | 0.22-0.28x | 1.2x | Static |
| Fast Bean | coffeeBean (☕) | Dark (#654321) | 0.22-0.28x | 1.5x | Erratic + pulse |
| Sleepy Dog | coffeeBean (☕) | Brown (#8B4513) | 0.22-0.30x | 0.5→1.5x | Wakes up |
| Alert Dog | coffeeBean (☕) | Dark (#654321) | 0.24-0.32x | 1.8→2.5x | Chases |

### UI Elements

#### Health Display
- Full Heart: ❤️
- Empty Heart: 🖤
- Scale: 30px (responsive)

#### Background
- Generated procedurally with buildings: 🏢🏬🏫🏦🏨
- Foreground accents: 🌳🌴🌲☕🥐

## Particle Effects

All particles use existing textures with different configurations:
- Bean collection: coffeeBean particles
- Hit effects: getBirdMascot particles
- Damage types: spilledCoffeeCup with different tints
- Celebrations: Various textures with gold/silver/bronze tints

## Physics Properties

- World gravity: 800
- Player jump power: -400
- Player fly power: -300
- Bird companion: No gravity, immovable
- Obstacles: No physics, manual movement
- Collectibles: No physics, manual movement with floating animation

## Spawn Positions

```javascript
// All items spawn off-screen right
spawnX = screenWidth + [20-80]px

// Vertical zones
Sky: screenHeight * 0.25
Mid: screenHeight * 0.5  
Ground: screenHeight * 0.75

// Power-ups spawn in middle area only
PowerUp Y: screenHeight * [0.35-0.65]
```

## To Change Visual Elements

1. **Textures**: Edit `preloaderScene.js` createEmojiTextures()
2. **Colors**: Change tint values in spawn methods
3. **Sizes**: Adjust scale multipliers
4. **Spawn rates**: Modify weights in collectibleTypes array
5. **Effects**: Edit effect properties in applyCollectibleEffect()
