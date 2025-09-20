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
import { initializeDatabase } from './database/init.js';

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
    'http://localhost:8001',
    'http://localhost:3000'
];

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
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

// Serve static files (game assets)
app.use(express.static(path.join(__dirname, '../')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint with detailed info
app.get('/api/health', (req, res) => {
    console.log('🏥 Health check requested from:', req.ip);
    
    const healthData = { 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        railway: !!process.env.RAILWAY_ENVIRONMENT
    };
    
    console.log('🏥 Health check response:', healthData);
    res.json(healthData);
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

// Initialize database and start server
async function startServer() {
    console.log('🚀 Starting BirdDash server...');
    console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
    console.log('📡 Port:', PORT);
    console.log('📁 Working directory:', process.cwd());
    
    try {
        console.log('🗄️ Initializing database...');
        await initializeDatabase();
        console.log('✅ Database initialized successfully');
        
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 BirdDash server running on port ${PORT}`);
            console.log(`🎮 Game available at: http://localhost:${PORT}`);
            console.log(`📊 API available at: http://localhost:${PORT}/api`);
            console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
            console.log('✅ Server startup completed successfully');
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

startServer();
