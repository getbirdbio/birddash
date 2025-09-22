// Environment Configuration - Phase 3 Production Settings
// Centralized configuration management for all environments

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const config = {
    // Application Settings
    app: {
        name: 'BirdDash',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        port: parseInt(process.env.PORT) || 3000,
        host: process.env.HOST || '0.0.0.0'
    },
    
    // Database Configuration
    database: {
        type: process.env.DATABASE_TYPE || 'sqlite',
        useEnhanced: process.env.USE_ENHANCED_DB === 'true',
        
        // PostgreSQL settings
        postgres: {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT) || 5432,
            database: process.env.DB_NAME || 'birddash',
            username: process.env.DB_USER || 'birddash_user',
            password: process.env.DB_PASSWORD || '',
            maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
            ssl: process.env.NODE_ENV === 'production'
        },
        
        // SQLite settings
        sqlite: {
            filename: process.env.SQLITE_FILENAME || 'database/birddash.db'
        },
        
        // Migration settings
        migration: {
            fromSQLite: process.env.MIGRATE_FROM_SQLITE === 'true'
        }
    },
    
    // Security Configuration
    security: {
        jwtSecret: process.env.JWT_SECRET || 'fallback-jwt-secret-for-development',
        sessionSecret: process.env.SESSION_SECRET || 'fallback-session-secret-for-development',
        jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
        
        // Rate limiting
        rateLimit: {
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
            maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
            
            // Specific limits
            auth: {
                windowMs: 15 * 60 * 1000, // 15 minutes
                maxRequests: 5 // 5 attempts
            },
            
            score: {
                windowMs: 60 * 1000, // 1 minute
                maxRequests: 10 // 10 submissions
            }
        },
        
        // CORS settings
        cors: {
            origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:8000'],
            credentials: process.env.CORS_CREDENTIALS === 'true'
        }
    },
    
    // Analytics & Monitoring
    analytics: {
        enabled: process.env.ANALYTICS_ENABLED !== 'false',
        batchSize: parseInt(process.env.ANALYTICS_BATCH_SIZE) || 10,
        flushInterval: parseInt(process.env.ANALYTICS_FLUSH_INTERVAL) || 30000,
        maxQueueSize: parseInt(process.env.ANALYTICS_MAX_QUEUE_SIZE) || 100,
        dataRetentionDays: parseInt(process.env.ANALYTICS_RETENTION_DAYS) || 90
    },
    
    // Performance Monitoring
    performance: {
        enabled: process.env.PERFORMANCE_MONITORING !== 'false',
        monitoringInterval: parseInt(process.env.PERFORMANCE_INTERVAL) || 1000,
        alertThreshold: parseInt(process.env.PERFORMANCE_ALERT_THRESHOLD) || 80,
        
        thresholds: {
            fps: {
                excellent: 58,
                good: 45,
                poor: 30,
                critical: 15
            },
            memory: {
                excellent: 50, // MB
                good: 100,
                poor: 200,
                critical: 500
            }
        },
        
        budget: {
            targetFPS: 60,
            maxMemoryMB: parseInt(process.env.MAX_MEMORY_MB) || 150,
            maxLoadTimeMs: parseInt(process.env.MAX_LOAD_TIME_MS) || 3000
        }
    },
    
    // Feature Flags
    features: {
        socialFeatures: process.env.ENABLE_SOCIAL_FEATURES === 'true',
        achievements: process.env.ENABLE_ACHIEVEMENTS !== 'false',
        leaderboard: process.env.ENABLE_LEADERBOARD !== 'false',
        tutorial: process.env.ENABLE_TUTORIAL !== 'false',
        analytics: process.env.ENABLE_ANALYTICS !== 'false',
        performanceMonitoring: process.env.ENABLE_PERFORMANCE_MONITORING !== 'false'
    },
    
    // Game Configuration
    game: {
        maxConcurrentGames: parseInt(process.env.MAX_CONCURRENT_GAMES) || 1000,
        sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 30 * 60 * 1000, // 30 minutes
        
        // Anti-cheat settings
        antiCheat: {
            maxScorePerSecond: parseInt(process.env.MAX_SCORE_PER_SECOND) || 100,
            maxReasonableScore: parseInt(process.env.MAX_REASONABLE_SCORE) || 1000000,
            suspiciousScoreThreshold: parseInt(process.env.SUSPICIOUS_SCORE_THRESHOLD) || 50000
        }
    },
    
    // Caching
    cache: {
        ttl: parseInt(process.env.CACHE_TTL) || 300, // 5 minutes
        maxSize: parseInt(process.env.CACHE_MAX_SIZE) || 1000,
        enabled: process.env.CACHE_ENABLED !== 'false'
    },
    
    // Logging
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'simple', // simple, json
        
        // Log destinations
        console: process.env.LOG_CONSOLE !== 'false',
        file: process.env.LOG_FILE === 'true',
        database: process.env.LOG_DATABASE === 'true'
    },
    
    // External Services
    services: {
        redis: {
            url: process.env.REDIS_URL,
            enabled: !!process.env.REDIS_URL
        },
        
        elasticsearch: {
            url: process.env.ELASTICSEARCH_URL,
            enabled: !!process.env.ELASTICSEARCH_URL
        },
        
        cdn: {
            url: process.env.CDN_URL,
            enabled: !!process.env.CDN_URL
        }
    },
    
    // Health Checks
    health: {
        checkInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000,
        timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT) || 5000,
        
        endpoints: [
            '/api/health',
            '/api/health/database',
            '/api/health/performance'
        ]
    },
    
    // Development Settings
    development: {
        hotReload: process.env.HOT_RELOAD === 'true',
        debugMode: process.env.DEBUG_MODE === 'true',
        mockData: process.env.USE_MOCK_DATA === 'true',
        skipAuth: process.env.SKIP_AUTH === 'true'
    },
    
    // Production Settings
    production: {
        ssl: {
            enabled: process.env.SSL_ENABLED === 'true',
            keyPath: process.env.SSL_KEY_PATH,
            certPath: process.env.SSL_CERT_PATH
        },
        
        compression: {
            enabled: process.env.COMPRESSION_ENABLED !== 'false',
            level: parseInt(process.env.COMPRESSION_LEVEL) || 6
        },
        
        clustering: {
            enabled: process.env.CLUSTERING_ENABLED === 'true',
            workers: parseInt(process.env.CLUSTER_WORKERS) || require('os').cpus().length
        }
    }
};

// Environment-specific overrides
if (config.app.environment === 'production') {
    // Production optimizations
    config.logging.level = 'warn';
    config.cache.ttl = 600; // 10 minutes
    config.performance.monitoringInterval = 5000; // 5 seconds
    config.analytics.flushInterval = 10000; // 10 seconds
    
    // Security hardening
    config.security.cors.origin = process.env.CORS_ORIGIN?.split(',') || [];
    
    // Validate required production environment variables
    const requiredProdVars = [
        'JWT_SECRET',
        'SESSION_SECRET',
        'DB_PASSWORD'
    ];
    
    for (const varName of requiredProdVars) {
        if (!process.env[varName]) {
            console.error(`❌ Required production environment variable missing: ${varName}`);
            process.exit(1);
        }
    }
} else if (config.app.environment === 'development') {
    // Development optimizations
    config.logging.level = 'debug';
    config.development.debugMode = true;
    config.cache.ttl = 60; // 1 minute
    config.performance.monitoringInterval = 2000; // 2 seconds
} else if (config.app.environment === 'test') {
    // Test environment settings
    config.database.type = 'sqlite';
    config.database.sqlite.filename = ':memory:';
    config.analytics.enabled = false;
    config.logging.level = 'error';
    config.cache.enabled = false;
}

// Validation
export function validateConfig() {
    const errors = [];
    
    // Validate port
    if (config.app.port < 1 || config.app.port > 65535) {
        errors.push('Invalid port number');
    }
    
    // Validate database configuration
    if (config.database.type === 'postgresql') {
        if (!config.database.postgres.password && config.app.environment === 'production') {
            errors.push('PostgreSQL password required for production');
        }
    }
    
    // Validate JWT secret
    if (config.security.jwtSecret.includes('fallback') && config.app.environment === 'production') {
        errors.push('Production JWT secret must be set');
    }
    
    if (errors.length > 0) {
        console.error('❌ Configuration validation failed:');
        errors.forEach(error => console.error(`  - ${error}`));
        process.exit(1);
    }
    
    console.log('✅ Configuration validation passed');
}

// Helper functions
export function isDevelopment() {
    return config.app.environment === 'development';
}

export function isProduction() {
    return config.app.environment === 'production';
}

export function isTest() {
    return config.app.environment === 'test';
}

export function getConfig(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], config);
}

export function setConfig(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((obj, key) => obj[key] = obj[key] || {}, config);
    target[lastKey] = value;
}

// Export configuration
export default config;

// Log configuration summary
console.log('⚙️ Configuration loaded:', {
    environment: config.app.environment,
    database: config.database.type,
    enhanced: config.database.useEnhanced,
    analytics: config.analytics.enabled,
    performance: config.performance.enabled,
    features: Object.entries(config.features).filter(([_, enabled]) => enabled).map(([name]) => name)
});

// Validate configuration on load
validateConfig();
