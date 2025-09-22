import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/auth.js';
import leaderboardRoutes from './routes/leaderboard.js';
import userRoutes from './routes/users.js';

// Import database initialization
import { initializeEnhancedDatabase, getDatabase, databaseHealthCheck } from './database/enhanced-init.js';
import config from './config/environment.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
console.log('🔍 Railway Debug Info:');
console.log('  - NODE_ENV:', process.env.NODE_ENV);
console.log('  - PORT (from env):', process.env.PORT);
console.log('  - PORT (final):', PORT);
console.log('  - RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT);
console.log('  - All env vars:', Object.keys(process.env).filter(k => k.includes('RAILWAY')));

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            mediaSrc: ["'self'", "blob:"],
        },
    },
}));

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:8000',  // Added port 8000 for the game client
    'http://localhost:8001',
    'http://localhost:3000'
];

app.use(cors({
    origin: allowedOrigins,
    credentials: true, // Required for HTTP-only cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Set-Cookie'] // Allow frontend to see cookie headers
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.'
    }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Cookie parsing middleware
import cookieParser from 'cookie-parser';
app.use(cookieParser());

// Session middleware for CSRF protection
import session from 'express-session';
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Serve static files (game assets)
app.use(express.static(path.join(__dirname, '../')));

// CSRF token endpoint
import { getCSRFToken } from './middleware/csrf.js';
app.get('/api/csrf-token', getCSRFToken);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/users', userRoutes);

// Enhanced health check endpoint with detailed info
app.get('/api/health', async (req, res) => {
    console.log('🏥 Health check requested from:', req.ip);
    
    try {
        // Check database health
        const dbHealth = await databaseHealthCheck();
        
        // Check system health
        const systemHealth = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: config.app.version,
            environment: config.app.environment,
            port: config.app.port,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            database: dbHealth,
            features: {
                enhancedDB: config.database.useEnhanced,
                analytics: config.analytics.enabled,
                socialFeatures: config.features.socialFeatures,
                performanceMonitoring: config.performance.enabled
            }
        };
        
        // Determine overall health status
        const overallStatus = dbHealth.status === 'healthy' ? 'healthy' : 'degraded';
        systemHealth.status = overallStatus;
        
        res.status(overallStatus === 'healthy' ? 200 : 503).json(systemHealth);
    } catch (error) {
        console.error('❌ Health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Root health check (in case Railway checks this)
app.get('/health', (req, res) => {
    console.log('🏥 Root health check requested from:', req.ip);
    res.json({ status: 'OK', message: 'BirdDash server is running' });
});

// Simple ping endpoint
app.get('/ping', (req, res) => {
    console.log('🏓 Ping requested from:', req.ip);
    res.send('pong');
});

// This will be defined later with server state check

// Alternative health endpoints for Railway
app.get('/healthz', (req, res) => {
    console.log('🏥 Healthz check from:', req.ip);
    res.status(200).json({ status: 'healthy' });
});

// Immediate health check (doesn't wait for database)
app.get('/alive', (req, res) => {
    console.log('💓 Alive check from:', req.ip);
    res.status(200).send('alive');
});

// Serve the game on root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    if (err.name === 'ValidationError') {
        return res.status(400).json({ 
            error: 'Validation error', 
            details: err.message 
        });
    }
    
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
            error: 'Invalid token' 
        });
    }
    
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// Global server ready state
let isServerReady = false;

// Update readiness endpoint to check actual server state
app.get('/ready', (req, res) => {
    console.log('✅ Readiness check from:', req.ip, '- Server ready:', isServerReady);
    if (isServerReady) {
        res.status(200).send('ready');
    } else {
        res.status(503).send('not ready');
    }
});

// Initialize database and start server
async function startServer() {
    console.log('🚀 Starting BirdDash server...');
    console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
    console.log('📡 Port:', PORT);
    console.log('📁 Working directory:', process.cwd());
    console.log('🔍 All environment variables:');
    Object.keys(process.env).sort().forEach(key => {
        if (key.includes('RAILWAY') || key.includes('PORT') || key.includes('NODE') || key.includes('DATABASE')) {
            console.log(`  ${key}=${process.env[key]}`);
        }
    });
    
    try {
        console.log('🗄️ Initializing enhanced database system...');
        const database = await initializeEnhancedDatabase();
        console.log('✅ Enhanced database system initialized successfully');
        
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 BirdDash server running on port ${PORT}`);
            console.log(`🎮 Game available at: http://0.0.0.0:${PORT}`);
            console.log(`📊 API available at: http://0.0.0.0:${PORT}/api`);
            console.log(`🏥 Health check: http://0.0.0.0:${PORT}/ready`);
            console.log('✅ Server startup completed successfully');
            
            // Mark server as ready after a brief delay
            setTimeout(() => {
                isServerReady = true;
                console.log('🔍 Server is now ready for health checks');
                console.log('🔍 Server listening on:', server.address());
            }, 2000);
        });

        server.on('error', (error) => {
            console.error('❌ Server error:', error);
            if (error.code === 'EADDRINUSE') {
                console.error(`❌ Port ${PORT} is already in use`);
                process.exit(1);
            }
        });

        // Handle graceful shutdown
        process.on('SIGTERM', () => {
            console.log('🛑 Received SIGTERM, shutting down gracefully...');
            server.close(() => {
                console.log('✅ Server closed');
                process.exit(0);
            });
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Global error handlers
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    console.error('Stack:', reason?.stack);
    process.exit(1);
});

console.log('🎯 Starting BirdDash application...');
console.log('🎯 Node.js version:', process.version);
console.log('🎯 Platform:', process.platform);
console.log('🎯 Architecture:', process.arch);

startServer().catch(error => {
    console.error('❌ Failed to start server:', error);
    console.error('❌ Error stack:', error.stack);
    process.exit(1);
});
