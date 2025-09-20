# Bird Dash - Debugging Guide

## How to Enable Debug Mode

1. **In-Game**: Press 'D' key or tap the 🐞 bug icon (bottom right)
2. **Console**: Open browser developer tools (F12)

## Debug Displays

### 1. Main Debug HUD (Bottom Left)
Shows:
- HP: Current/Max health
- Score and Combo multiplier
- Game speed and Difficulty level
- Running/Paused state
- Special effect states (HitStop, TimeFreeze)
- Physics and Tween timescales
- Current special event

### 2. Spawn Timers (Top Left - Green)
Shows:
- Next Bean spawn countdown
- Next PowerUp spawn countdown
- Next Obstacle spawn countdown
- Active bird companion type

### 3. Item Counter (Top Right - Yellow)
Shows:
- Number of beans on screen
- Number of power-ups on screen
- Number of obstacles on screen
- Object pool usage stats

### 4. Console Debugging
When collecting items, console shows:
```
=== COLLECTING BEAN ===
Bean type: {type object}
Category: coffee/smoothie/bagel/bird
Effect: health/speed/multiplier/companion_basic
Name: Small Coffee/Berry Smoothie/etc
Applying effect: {effect name}
Effect applied successfully
```

When spawning items:
```
SPAWNING: {item name} at (x, y)
```

When activating bird companions:
```
=== ACTIVATING BIRD COMPANION ===
Type: sparrow/robin/cardinal
Duration: 15000/20000/25000
Creating bird companion sprite...
Bird companion activated successfully
```

## Error Handling

- **Red error banner**: Shows in-game when JavaScript errors occur
- **Console errors**: Full stack traces in browser console
- **Auto-recovery**: Game attempts to recover from frozen states after 1.5s

## Common Issues to Check

1. **Game Freezes on Bird Collection**
   - Check console for "showFloatingText" errors
   - Look for null reference errors in bird companion code

2. **Items Not Spawning**
   - Check spawn timers in debug HUD
   - Verify difficulty settings aren't blocking spawns
   - Check if special events are affecting spawn rates

3. **Physics Issues**
   - Check PScale and TScale values (should be 1.0)
   - Use RESET button to normalize timescales

## Performance Monitoring

- **Object Pool Stats**: Shows active/available ratio
- **FPS**: Can add `this.game.config.fps.forceSetTimeOut = true` for consistent timing
- **Item Counts**: High counts (>50) may indicate cleanup issues

## Modifying Game Elements

See `game_elements_reference.md` for:
- All item properties and spawn weights
- Visual elements (textures, colors, scales)
- Effect durations and multipliers
- Spawn position calculations

## Testing Specific Scenarios

1. **Force spawn specific item**: 
   - Edit `getRandomCollectibleType()` to return specific type
   
2. **Test power-ups**:
   - Increase `powerUpSpawnInterval` weight for testing
   
3. **Test difficulty**:
   - Modify `difficultyUpdateInterval` (default 15000ms)

4. **Test bird companions**:
   - Set bird weights to 100 in collectibleTypes array

## Reset Functions

- **RESET Button**: Clears stuck states, normalizes timescales
- **Restart**: Tap pause button (⏸) → RESTART
- **Full Reload**: Refresh browser (Ctrl+R / Cmd+R)
