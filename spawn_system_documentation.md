# Bird Dash - Spawn System Documentation

## How the Spawn System Works

### 1. Collectible Spawning (collectibleManager.js)

**Spawn Intervals:**
- Coffee Beans: Every 800ms (base rate)
- Power-ups: Every 8000ms (base rate)
- These rates are modified by difficulty and special events

**Spawn Process:**
```javascript
// In update() method:
if (time - this.lastBeanSpawnTime > responsiveBeanInterval) {
    this.spawnCoffeeBean();
    this.lastBeanSpawnTime = time;
}
```

### 2. Collectible Types and Weights

| Item Type | Points | Weight | Effect | Visual |
|-----------|--------|--------|--------|---------|
| **Coffee Cups** |
| Small Coffee | 10 | 40% | Points only | ☕ Brown |
| Medium Coffee | 20 | 30% | Points only | ☕ Dark Brown |
| Large Coffee | 35 | 20% | Points only | ☕ Black |
| Specialty Coffee | 75 | 10% | Points only | ☕ Gold |
| **Smoothies** |
| Berry Smoothie | 15 | 15% | +1 Health | 🥤 Pink |
| Green Smoothie | 15 | 10% | Speed Boost 5s | 🥤 Green |
| Tropical Smoothie | 25 | 5% | Health + Speed | 🥤 Orange |
| **Bagels** |
| Plain Bagel | 30 | 8% | 2x Score 8s | 🥐 Beige |
| Everything Bagel | 50 | 5% | 2.5x Score 12s | 🥐 Brown |
| Blueberry Bagel | 75 | 2% | 3x Score 15s | 🥐 Purple |
| **Bird Companions** |
| Sparrow Friend | 40 | 6% | Auto-collect 15s | ☕ Brown (temp) |
| Robin Friend | 60 | 4% | Fast collect 20s | ☕ Orange (temp) |
| Cardinal Friend | 100 | 2% | Super collect 25s | ☕ Red (temp) |

### 3. Obstacle Spawning (obstacleManager.js)

**Base Spawn Interval:** 2000ms (2 seconds)
**Dynamic Interval:** Adjusts based on difficulty level

**Obstacle Types:**
| Type | Speed | Movement Pattern | Visual |
|------|-------|-----------------|---------|
| Spilled Cup | 1.0x | Static or gentle float | 🥤 White |
| Floating Cup | 0.8x | Sine wave | 🥤 Light Red |
| Heavy Cup | 1.2x | Static | 🥤 Brown |
| Fast Bean | 1.5x | Erratic | ☕ Dark |
| Sleepy Dog | 0.5x→1.5x | Wakes when near | ☕ Brown |
| Alert Dog | 1.8x→2.5x | Chases player | ☕ Dark Brown |

### 4. Power-up Types

| Power-up | Duration | Effect | Visual |
|----------|----------|--------|---------|
| Shield (Croissant) | 3s | Invulnerability | 🥐 |
| Speed Boost (Espresso) | 4s | 1.5x speed | ⚡ |
| Score Multiplier (Webster) | 5s | 2x score | 👨‍💼 |
| Time Slow (Thabo) | 6s | 0.6x obstacle speed | 👨‍🍳 |
| Magnet | 5s | Attracts beans | 🧲 |
| Time Freeze | 3s | Stops obstacles | ⏱️ |
| Health | Instant | +1 heart | ❤️ |

### 5. Spawn Position Calculation

```javascript
// Horizontal position (X)
const spawnX = screenWidth + Phaser.Math.Between(20, 80);

// Vertical position (Y) - varies by type
const spawnYMin = screenHeight * 0.25; // Sky level
const spawnYMax = screenHeight * 0.75; // Ground level
const spawnY = Phaser.Math.Between(spawnYMin, spawnYMax);
```

### 6. Difficulty Scaling

**Difficulty increases every 15 seconds:**
- Level 1-10 (max)
- Spawn rate multiplier: 0.3 to 1.0
- Obstacle speed: 1.0x to 1.5x
- Rare obstacle chance: 0% to 60%
- Movement complexity: 0 to 1.0

### 7. Special Events (30s cooldown)

| Event | Effect | Visual Tint |
|-------|--------|-------------|
| Rush Hour | 2x coffee spawn rate | Yellow |
| Golden Hour | 1.5x all points | Gold |
| Storm Mode | 1.3x speed, more obstacles | Light Blue |
| Speed Frenzy | 1.5x speed, 0.7x spawn interval | Red |
| Barista Bonus | Special rewards | Tan |

## Debug Controls

**Press 'D' to toggle debug HUD showing:**
- HP, Score, Speed
- Game state (running/paused)
- Physics timescale
- Hit stop status

**Debug HUD also includes RESET button to:**
- Normalize time scales
- Clear frozen states
- Resume physics

## File Structure

- `collectibleManager.js`: Handles all collectible spawning and collection
- `obstacleManager.js`: Handles obstacle spawning and collision
- `gameScene.js`: Main game loop and state management
- `player.js`: Player movement and abilities
- `objectPool.js`: Performance optimization for spawned objects
