/**
 * Game Constants and Configuration
 * Centralized location for all magic numbers and configuration values
 */

export const DEBUG = {
    ENABLED: true, // Set to true for development
    LOG_SPAWNS: true,
    LOG_COLLISIONS: true,
    LOG_EFFECTS: true,
    LOG_SCORES: true,
    LOG_ERRORS: true
};

export const SCREEN = {
    BASE_WIDTH: 360,
    BASE_HEIGHT: 640,
    MIN_SCALE: 0.8,
    MAX_SCALE: 1.2
};

export const UI = {
    MARGINS: {
        SMALL: 24,
        MEDIUM: 28,
        LARGE: 32
    },
    FONT_SIZES: {
        TINY: 12,
        SMALL: 14,
        MEDIUM: 16,
        LARGE: 18,
        XLARGE: 24,
        HUGE: 32,
        GIANT: 48
    },
    DEPTHS: {
        BACKGROUND: 0,
        GAME_OBJECTS: 100,
        PARTICLES: 500,
        AURA: 900,
        UI: 1000,
        POPUPS: 1500,
        OVERLAY: 2000,
        MODAL: 2500,
        EXPLOSION: 3000,
        TOP: 3500
    },
    COLORS: {
        WHITE: '#FFFFFF',
        BLACK: '#000000',
        RED: '#FF0000',
        GREEN: '#00FF00',
        BLUE: '#0000FF',
        GOLD: '#FFD700',
        PINK: '#FF69B4',
        PURPLE: '#9966FF',
        ORANGE: '#FF6347',
        BROWN: '#8B4513'
    }
};

export const ANIMATIONS = {
    DURATIONS: {
        INSTANT: 100,
        FAST: 200,
        NORMAL: 400,
        SLOW: 600,
        SLOWER: 800,
        VERY_SLOW: 1000,
        EXTRA_SLOW: 1200,
        SUPER_SLOW: 1500,
        ULTRA_SLOW: 2000
    },
    EASING: {
        LINEAR: 'Linear',
        SINE_IN_OUT: 'Sine.easeInOut',
        POWER2_OUT: 'Power2.easeOut',
        BACK_OUT: 'Back.easeOut',
        BOUNCE_OUT: 'Bounce.easeOut'
    }
};

export const GAME = {
    SPEEDS: {
        BASE: 300,
        SPEED_INCREASE_RATE: 0.00002,
        TIME_SLOW_FACTOR: 0.6
    },
    SPAWN_INTERVALS: {
        BEANS: 800,
        POWER_UPS: 8000,
        OBSTACLES: 2000
    },
    PHYSICS: {
        GRAVITY: 800,
        BOUNCE: 0.1,
        DRAG: 100,
        MAX_VELOCITY_X: 400,
        MAX_VELOCITY_Y: 600
    }
};

export const PLAYER = {
    HEALTH: {
        MAX: 3,
        INVULNERABILITY_TIME: 1000
    },
    MOVEMENT: {
        JUMP_POWER: -600,
        FLY_POWER: -450,
        QUICK_BOOST: -350,
        FLUID_SPEED: 0.45,
        MOVE_SPEED_MULTIPLIER: 8
    }
};

export const POWER_UPS = {
    DURATIONS: {
        SHIELD: 3000,
        SPEED_BOOST: 4000,
        SCORE_MULTIPLIER: 5000,
        TIME_SLOW: 6000,
        MAGNET: 5000,
        BIRD_COMPANION: 15000
    },
    EFFECTS: {
        SCORE_MULTIPLIER: 2.0,
        MAGNET_RANGE: 150,
        BIRD_COLLECTION_RADIUS: 80
    }
};

export const COLLECTIBLES = {
    POINTS: {
        SMALL_COFFEE: 10,
        MEDIUM_COFFEE: 20,
        LARGE_COFFEE: 35,
        SPECIALTY_COFFEE: 75,
        BERRY_SMOOTHIE: 15,
        GREEN_SMOOTHIE: 15,
        TROPICAL_SMOOTHIE: 25,
        PLAIN_BAGEL: 30,
        EVERYTHING_BAGEL: 50,
        BLUEBERRY_BAGEL: 75,
        SPARROW_FRIEND: 40,
        ROBIN_FRIEND: 60,
        CARDINAL_FRIEND: 100
    }
};

export const OBSTACLES = {
    WEIGHTS: {
        SPILLED_CUP: 0.4,
        FLOATING_CUP: 0.3,
        HEAVY_CUP: 0.2,
        FAST_BEAN: 0.1,
        BROKEN_MACHINE: 0.12,
        ANGRY_CUSTOMER: 0.10,
        WIFI_DEAD_ZONE: 0.08,
        BOMB: 0.30
    },
    SPEEDS: {
        SLOW: 0.7,
        NORMAL: 1.0,
        FAST: 1.5
    }
};

export const EXPLOSION = {
    PARTICLES: 200,
    SCREEN_SHAKE: {
        DURATION: 1500,
        INTENSITY: 0.12
    },
    PAUSE_DURATION: 1200,
    HIT_STOP: 400,
    SHOCKWAVES: 6
};

export const RESPONSIVE = {
    BREAKPOINTS: {
        SMALL: 600,
        MEDIUM: 800,
        LARGE: 1024
    },
    FONT_SCALE: {
        MIN: 0.8,
        MAX: 1.2
    },
    SAFE_MARGINS: {
        X: 0.12, // 12% of screen width (increased for better safety)
        Y: 0.1 // 10% of screen height (increased for better safety)
    }
};
