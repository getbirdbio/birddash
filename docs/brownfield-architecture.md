# BirdDash Brownfield Architecture Document

## Introduction

This document captures the CURRENT STATE of the BirdDash coffee-themed endless runner game, including technical patterns, architecture decisions, and real-world implementation details. It serves as a reference for AI agents working on enhancements and provides comprehensive insight into all game segments.

### Document Scope
Comprehensive documentation of entire system - Frontend game engine, Backend API, Database, and Deployment infrastructure.

### Change Log

| Date   | Version | Description                 | Author    |
| ------ | ------- | --------------------------- | --------- |
| 2025-09-22 | 1.0     | Initial brownfield analysis with bmad-method integration | BMad Architect |

## Quick Reference - Key Files and Entry Points

### Critical Files for Understanding the System

- **Main Entry**: `index.html` (game entry point)
- **Game Bootstrap**: `main.js` (Phaser initialization)
- **Core Game Logic**: `gameScene.js` (main game scene, 2497 lines)
- **Player System**: `player.js` (player physics and controls)
- **Asset Loading**: `preloaderScene.js` (asset management and loading screen)
- **Backend Entry**: `server/server.js` (Express.js server)
- **Database Setup**: `server/database/init.js` (SQLite initialization)
- **Configuration**: `package.json`, `vercel.json`, `railway.json`

### Game Systems Architecture
- **Core Game Engine**: `gameScene.js` - Contains ALL game logic in single large file
- **Player Management**: `player.js` - Physics-based movement with gravity
- **Collectible System**: `collectibleManager.js` - Coffee beans, smoothies, bagels spawning
- **Obstacle System**: `obstacleManager.js` - Dynamic obstacle generation
- **Power-up System**: Integrated into gameScene.js (shield, speed, magnet, etc.)
- **Audio System**: `soundManager.js` - Web Audio API integration
- **UI System**: Integrated into gameScene.js (score, health, leaderboard)

## High Level Architecture

### Technical Summary
BirdDash is a full-stack web-based endless runner game using Phaser.js for the frontend game engine and Express.js/SQLite for the backend API. The architecture follows a monolithic pattern with clear separation between game client and API server.

### Actual Tech Stack

| Category  | Technology | Version | Notes                      |
| --------- | ---------- | ------- | -------------------------- |
| Runtime   | Node.js    | >=18.0.0| Required for ES6 modules  |
| Frontend Engine | Phaser.js | 3.80.1 | Loaded via CDN            |
| Frontend Language | Vanilla JS | ES6+   | Native ES6 modules        |
| Backend Framework | Express.js | 4.18.2 | RESTful API               |
| Database  | SQLite     | 5.1.6   | File-based, simple setup  |
| Authentication | JWT       | 9.0.2   | Stateless auth            |
| Security  | bcrypt     | 5.1.1   | Password hashing          |
| Deployment| Railway/Vercel | -    | Multiple deployment options|

### Repository Structure Reality Check
- Type: Monorepo (game + server in single repo)
- Package Manager: npm
- Module System: ES6 modules throughout
- Notable: Game assets (PNG files) stored in root directory alongside code

## Source Tree and Module Organization

### Project Structure (Actual)

```text
birddash/
├── index.html              # Game entry point
├── main.js                 # Phaser initialization
├── gameScene.js           # CORE: All game logic (2497 lines)
├── preloaderScene.js      # Asset loading and intro screen
├── player.js              # Player physics and controls
├── collectibleManager.js  # Coffee bean/smoothie spawning
├── obstacleManager.js     # Obstacle generation
├── soundManager.js        # Audio management
├── leaderboard.js         # Frontend leaderboard UI
├── mobileControls.js      # Touch controls
├── constants.js           # Game configuration constants
├── *.png                  # Game assets (birddash.png, backgrounds, etc.)
├── server/                # Backend API
│   ├── server.js          # Express app with all middleware
│   ├── routes/            # API endpoints
│   │   ├── auth.js        # Authentication endpoints
│   │   ├── leaderboard.js # Score submission/retrieval
│   │   └── users.js       # User profile management
│   └── database/
│       └── init.js        # SQLite setup and schema
├── docs/                  # Documentation files
└── package.json           # Dependencies and scripts
```

### Key Modules and Their Purpose

- **Game Engine Core**: `gameScene.js` - Monolithic scene containing all game mechanics, UI, and state management
- **Player System**: `player.js` - Physics-based bird character with responsive scaling
- **Asset Management**: `preloaderScene.js` - SVG-based asset generation and loading screen
- **Collectible Management**: `collectibleManager.js` - Weighted spawn system for coffee items
- **Obstacle Management**: `obstacleManager.js` - Dynamic difficulty-based obstacle spawning
- **Audio System**: `soundManager.js` - Web Audio API wrapper for music and SFX
- **Backend API**: `server/server.js` - Full Express setup with security middleware
- **Database Layer**: `server/database/init.js` - SQLite schema and initialization

## Data Models and APIs

### Data Models
Database models are defined inline in SQLite schema:

- **Users Table**: See `server/database/init.js` - username, email, password_hash, created_at
- **Leaderboard Table**: user_id, score, username, submitted_at, game_stats (JSON)
- **No formal ORM**: Direct SQLite queries throughout codebase

### API Specifications

#### Authentication Endpoints
- `POST /api/auth/guest` - Create guest user (no password)
- `POST /api/auth/register` - Register new account with email/password
- `POST /api/auth/login` - JWT-based login
- `GET /api/auth/verify` - Token validation

#### Leaderboard Endpoints
- `GET /api/leaderboard` - Paginated leaderboard (limit/offset)
- `POST /api/leaderboard/submit` - Submit new score with game stats
- `GET /api/leaderboard/user/:username` - User's score history
- `GET /api/leaderboard/stats` - Leaderboard statistics

#### User Management
- `GET /api/users/:username` - User profile data
- `POST /api/users/:username/game-complete` - Update user game statistics
- `GET /api/users/:username/achievements` - User achievements (future feature)

## Game Architecture Deep Dive

### Core Game Loop (gameScene.js)
The main game scene follows Phaser's lifecycle with these key methods:
- `create()` - Scene initialization, UI setup, manager instantiation
- `update(time, delta)` - Main game loop (60 FPS)
- `initializeGameState()` - Reset all game variables
- Power-up management integrated directly in scene

### Game Systems Integration

#### Player Movement System
- **Physics**: Gravity-based with configurable drag and bounce
- **Controls**: Spacebar/click for desktop, tap for mobile
- **Boundaries**: Collision detection with world bounds
- **Responsive**: Element sizing system for different screen sizes

#### Collectible Spawn System
- **Weighted Spawning**: Different probabilities for each item type
- **Spawn Timing**: Dynamic intervals based on difficulty
- **Types**: Coffee cups (4 variants), smoothies (3 types), bagels (3 types), bird companions
- **Effects**: Points, health restoration, speed boosts, score multipliers

#### Power-up System
- **Duration-based**: All power-ups have time limits
- **Visual Feedback**: Screen effects and UI indicators
- **Stacking**: Some power-ups can stack, others override
- **Types**: Shield, speed boost, magnet, time slow, score multiplier

#### Obstacle Management
- **Dynamic Difficulty**: Spawn rate increases with score/time
- **Movement Patterns**: Static, floating, chasing behaviors
- **Collision**: Physics-based collision detection
- **Visual Variety**: Different obstacle types with unique behaviors

## Technical Debt and Known Issues

### Critical Technical Debt

1. **Monolithic Game Scene**: `gameScene.js` is 2497 lines - should be modularized
2. **Mixed Asset Loading**: Some assets loaded via CDN (Phaser), others locally
3. **Inline Configuration**: Game constants mixed with logic throughout files
4. **No Formal State Management**: Game state scattered across multiple objects
5. **Limited Error Handling**: Minimal error boundaries in game logic

### Workarounds and Gotchas

- **Asset Loading**: SVG assets generated programmatically instead of using image files
- **Mobile Controls**: Touch events handled separately from keyboard input
- **Database**: SQLite file-based - not suitable for high-traffic production
- **Authentication**: JWT stored in localStorage (XSS vulnerability)
- **CORS Configuration**: Hardcoded allowed origins for development

### Performance Considerations

- **Object Pooling**: Implemented in `objectPool.js` for collectibles/obstacles
- **Update Optimization**: `updateOptimizer.js` manages frame rate optimization
- **Memory Management**: Manual cleanup of Phaser objects
- **Audio**: Web Audio API used instead of HTML5 audio for better performance

## Integration Points and External Dependencies

### External Services
| Service  | Purpose  | Integration Type | Key Files                      |
| -------- | -------- | ---------------- | ------------------------------ |
| Phaser.js | Game Engine | CDN Script | `index.html`, all game files |
| Railway  | Deployment | Git-based CD | `railway.json`, `railway-start.js` |
| Vercel   | Alternative Deploy | Config-based | `vercel.json` |

### Internal Integration Points

- **Frontend-Backend**: RESTful API communication via fetch()
- **Database**: Direct SQLite queries, no ORM abstraction
- **Asset Loading**: Mix of local files and programmatic SVG generation
- **Authentication**: JWT tokens passed in Authorization headers

## Development and Deployment

### Local Development Setup

1. **Prerequisites**: Node.js >=18.0.0, npm
2. **Installation**: `npm install`
3. **Environment**: Copy `env.example` to `.env`
4. **Development**: `npm run dev` (uses nodemon)
5. **Testing**: `npm run test-server` (basic server test)

### Build and Deployment Process

- **Build Command**: `npm run build` (currently just echoes - no build step)
- **Start Command**: `npm start` (production server)
- **Railway Deployment**: Automatic via `railway-start.js`
- **Vercel Deployment**: Serverless functions via `vercel.json`
- **Traditional VPS**: PM2 process management

### Environment Configuration

- **Development**: Local SQLite database, CORS enabled
- **Production**: Environment-specific CORS origins
- **Railway**: Automatic environment detection
- **Health Checks**: Multiple endpoints (/health, /ready, /alive, /healthz)

## Testing Reality

### Current Test Coverage
- **Unit Tests**: None implemented
- **Integration Tests**: Basic server startup test (`test-server.js`)
- **E2E Tests**: None
- **Manual Testing**: Primary QA method
- **Game Testing**: In-browser manual testing

### Quality Assurance Tools
- **Linting**: None configured
- **Type Checking**: None (vanilla JavaScript)
- **Security**: Helmet.js for basic security headers
- **Rate Limiting**: Express rate limiter on API routes

## Security Architecture

### Authentication Flow
1. User registration/login via `/api/auth/`
2. JWT token issued with user payload
3. Token stored in localStorage (client-side)
4. Token sent in Authorization header for protected routes
5. Server validates JWT on protected endpoints

### Security Measures
- **Password Hashing**: bcrypt with salt
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Configured allowed origins
- **Helmet**: Security headers middleware
- **Input Validation**: express-validator on API routes

### Security Vulnerabilities
- **XSS Risk**: JWT in localStorage vulnerable to XSS attacks
- **No CSRF Protection**: Stateless JWT approach
- **Database**: SQLite not suitable for production scale
- **No Input Sanitization**: Limited validation on game data

## Performance Characteristics

### Frontend Performance
- **Rendering**: HTML5 Canvas via Phaser.js
- **Frame Rate**: Target 60 FPS with optimization
- **Memory**: Object pooling for game entities
- **Network**: Minimal API calls during gameplay
- **Assets**: Small PNG files, programmatic SVG generation

### Backend Performance
- **Database**: SQLite - single file, limited concurrency
- **API**: Express.js with minimal middleware overhead
- **Memory**: Low memory footprint
- **Scaling**: Single instance, not horizontally scalable

## Monitoring and Debugging

### Logging System
- **Debug Logger**: Custom `debugLogger.js` for game events
- **Server Logging**: Console.log throughout server code
- **Error Handling**: Basic try-catch with console output
- **Health Monitoring**: Multiple health check endpoints

### Development Tools
- **Browser DevTools**: Primary debugging method
- **Console Logging**: Extensive console output for debugging
- **Network Tab**: API call monitoring
- **Performance Tab**: Frame rate analysis

## Appendix - Useful Commands and Scripts

### Frequently Used Commands

```bash
npm run dev         # Start development server with nodemon
npm start          # Production server
npm run test-server # Basic server connectivity test
npm run railway    # Railway-specific startup
```

### Game Development Workflow

1. **Asset Creation**: Add PNG files to root directory
2. **Game Logic**: Modify `gameScene.js` for core mechanics
3. **API Changes**: Update `server/routes/` files
4. **Database**: Modify `server/database/init.js` for schema changes
5. **Testing**: Manual browser testing on localhost:3000

### Debugging and Troubleshooting

- **Game Issues**: Check browser console for Phaser errors
- **API Issues**: Check server console for Express errors
- **Database Issues**: Check SQLite file permissions
- **Deployment Issues**: Check Railway/Vercel logs
- **Performance Issues**: Use browser Performance tab

## BMad Method Integration Analysis

### Current Architecture Assessment
The BirdDash codebase represents a functional but monolithic game architecture with clear separation of concerns between frontend game logic and backend API. The system demonstrates several patterns that could benefit from bmad-method services:

1. **Modularization Opportunities**: The 2497-line `gameScene.js` file could be broken into focused modules
2. **State Management**: Game state could benefit from formal state management patterns
3. **Testing Strategy**: Comprehensive testing framework needed
4. **Performance Optimization**: Object pooling and update optimization already implemented
5. **Security Hardening**: Authentication and data validation could be enhanced

### Recommended BMad Services Application
- **Architect Service**: System modularization and performance optimization
- **QA Service**: Testing strategy and security review
- **PM Service**: Feature prioritization and technical debt management
- **UX Expert**: Mobile experience and accessibility improvements
- **Developer Service**: Code refactoring and best practices implementation
