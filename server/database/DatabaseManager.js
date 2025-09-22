// DatabaseManager - Production-ready database abstraction layer
// Supports both SQLite (development) and PostgreSQL (production)
// Implements connection pooling, transactions, and performance monitoring

import sqlite3 from 'sqlite3';
import pkg from 'pg';
const { Pool } = pkg;
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default class DatabaseManager {
    constructor() {
        this.dbType = process.env.DATABASE_TYPE || 'sqlite';
        this.db = null;
        this.pool = null;
        this.connectionStats = {
            totalQueries: 0,
            successfulQueries: 0,
            failedQueries: 0,
            averageQueryTime: 0,
            connectionCount: 0,
            lastError: null
        };
        
        this.queryCache = new Map();
        this.cacheMaxAge = 5 * 60 * 1000; // 5 minutes
        this.performanceThresholds = {
            slowQueryMs: 1000,
            maxConnections: 20,
            maxCacheSize: 1000
        };
    }

    async initialize() {
        console.log(`🗄️ DatabaseManager: Initializing ${this.dbType} database...`);
        
        try {
            if (this.dbType === 'postgresql') {
                await this.initializePostgreSQL();
            } else {
                await this.initializeSQLite();
            }
            
            await this.createTables();
            await this.setupIndexes();
            await this.setupPerformanceMonitoring();
            
            console.log('✅ DatabaseManager: Database initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ DatabaseManager: Failed to initialize database:', error);
            throw error;
        }
    }

    async initializePostgreSQL() {
        const config = {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: process.env.DB_NAME || 'birddash',
            user: process.env.DB_USER || 'birddash_user',
            password: process.env.DB_PASSWORD || 'birddash_password',
            max: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        };

        this.pool = new Pool(config);
        
        // Test connection
        const client = await this.pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        
        console.log('✅ PostgreSQL connection pool established');
        
        // Setup connection monitoring
        this.pool.on('connect', () => {
            this.connectionStats.connectionCount++;
            console.log('🔗 New PostgreSQL connection established');
        });

        this.pool.on('error', (err) => {
            this.connectionStats.lastError = err;
            console.error('❌ PostgreSQL pool error:', err);
        });
    }

    async initializeSQLite() {
        const dbPath = join(__dirname, '../..', 'database', 'birddash.db');
        
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('❌ SQLite connection failed:', err);
                throw err;
            }
            console.log('✅ SQLite connection established');
        });

        // Enable foreign key constraints
        await this.runSQLite('PRAGMA foreign_keys = ON');
        
        // Performance optimizations
        await this.runSQLite('PRAGMA journal_mode = WAL');
        await this.runSQLite('PRAGMA synchronous = NORMAL');
        await this.runSQLite('PRAGMA cache_size = 10000');
        await this.runSQLite('PRAGMA temp_store = memory');
    }

    async createTables() {
        const tables = this.getTableDefinitions();
        
        for (const [tableName, definition] of Object.entries(tables)) {
            try {
                await this.query(definition);
                console.log(`✅ Table '${tableName}' created/verified`);
            } catch (error) {
                if (!error.message.includes('already exists')) {
                    console.error(`❌ Failed to create table '${tableName}':`, error);
                    throw error;
                }
            }
        }
    }

    getTableDefinitions() {
        const isPostgres = this.dbType === 'postgresql';
        const autoIncrement = isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
        const timestamp = isPostgres ? 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' : 'DATETIME DEFAULT CURRENT_TIMESTAMP';
        const textType = isPostgres ? 'TEXT' : 'TEXT';
        const jsonType = isPostgres ? 'JSONB' : 'TEXT'; // SQLite doesn't have native JSON

        return {
            users: `
                CREATE TABLE IF NOT EXISTS users (
                    id ${autoIncrement},
                    username VARCHAR(50) NOT NULL UNIQUE,
                    email VARCHAR(255) UNIQUE,
                    password_hash VARCHAR(255),
                    is_guest BOOLEAN DEFAULT FALSE,
                    guest_id VARCHAR(100) UNIQUE,
                    total_games_played INTEGER DEFAULT 0,
                    best_score INTEGER DEFAULT 0,
                    total_playtime INTEGER DEFAULT 0,
                    achievements ${jsonType} DEFAULT '{}',
                    preferences ${jsonType} DEFAULT '{}',
                    created_at ${timestamp},
                    updated_at ${timestamp}
                )
            `,
            
            game_sessions: `
                CREATE TABLE IF NOT EXISTS game_sessions (
                    id ${autoIncrement},
                    user_id INTEGER NOT NULL,
                    score INTEGER NOT NULL,
                    distance_traveled REAL DEFAULT 0,
                    collectibles_gathered INTEGER DEFAULT 0,
                    obstacles_hit INTEGER DEFAULT 0,
                    power_ups_used INTEGER DEFAULT 0,
                    max_combo INTEGER DEFAULT 0,
                    playtime INTEGER NOT NULL,
                    game_stats ${jsonType} DEFAULT '{}',
                    device_info ${jsonType} DEFAULT '{}',
                    session_date ${timestamp},
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                )
            `,
            
            leaderboards: `
                CREATE TABLE IF NOT EXISTS leaderboards (
                    id ${autoIncrement},
                    user_id INTEGER NOT NULL,
                    username VARCHAR(50) NOT NULL,
                    score INTEGER NOT NULL,
                    distance_traveled REAL DEFAULT 0,
                    achievements_count INTEGER DEFAULT 0,
                    game_date ${timestamp},
                    is_verified BOOLEAN DEFAULT TRUE,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                )
            `,
            
            achievements: `
                CREATE TABLE IF NOT EXISTS achievements (
                    id ${autoIncrement},
                    achievement_id VARCHAR(100) NOT NULL,
                    name VARCHAR(200) NOT NULL,
                    description ${textType},
                    category VARCHAR(50) NOT NULL,
                    difficulty VARCHAR(20) DEFAULT 'medium',
                    points INTEGER DEFAULT 10,
                    icon VARCHAR(10),
                    conditions ${jsonType} NOT NULL,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at ${timestamp}
                )
            `,
            
            user_achievements: `
                CREATE TABLE IF NOT EXISTS user_achievements (
                    id ${autoIncrement},
                    user_id INTEGER NOT NULL,
                    achievement_id INTEGER NOT NULL,
                    unlocked_at ${timestamp},
                    progress ${jsonType} DEFAULT '{}',
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                    FOREIGN KEY (achievement_id) REFERENCES achievements (id) ON DELETE CASCADE,
                    UNIQUE(user_id, achievement_id)
                )
            `,
            
            analytics_events: `
                CREATE TABLE IF NOT EXISTS analytics_events (
                    id ${autoIncrement},
                    user_id INTEGER,
                    session_id VARCHAR(100),
                    event_type VARCHAR(100) NOT NULL,
                    event_data ${jsonType} DEFAULT '{}',
                    timestamp ${timestamp},
                    user_agent ${textType},
                    ip_address VARCHAR(45),
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
                )
            `,
            
            performance_metrics: `
                CREATE TABLE IF NOT EXISTS performance_metrics (
                    id ${autoIncrement},
                    metric_type VARCHAR(100) NOT NULL,
                    metric_value REAL NOT NULL,
                    metadata ${jsonType} DEFAULT '{}',
                    timestamp ${timestamp}
                )
            `
        };
    }

    async setupIndexes() {
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)',
            'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
            'CREATE INDEX IF NOT EXISTS idx_users_guest_id ON users(guest_id)',
            'CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_game_sessions_score ON game_sessions(score DESC)',
            'CREATE INDEX IF NOT EXISTS idx_game_sessions_date ON game_sessions(session_date DESC)',
            'CREATE INDEX IF NOT EXISTS idx_leaderboards_score ON leaderboards(score DESC)',
            'CREATE INDEX IF NOT EXISTS idx_leaderboards_date ON leaderboards(game_date DESC)',
            'CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type)',
            'CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp DESC)',
            'CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON performance_metrics(metric_type)',
            'CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp DESC)'
        ];

        for (const indexQuery of indexes) {
            try {
                await this.query(indexQuery);
            } catch (error) {
                if (!error.message.includes('already exists')) {
                    console.warn('⚠️ Index creation warning:', error.message);
                }
            }
        }
        
        console.log('✅ Database indexes created/verified');
    }

    async setupPerformanceMonitoring() {
        // Start performance monitoring interval
        setInterval(() => {
            this.logPerformanceMetrics();
        }, 60000); // Every minute

        // Clean up old cache entries
        setInterval(() => {
            this.cleanupCache();
        }, 300000); // Every 5 minutes
    }

    async query(sql, params = []) {
        const startTime = Date.now();
        const cacheKey = this.generateCacheKey(sql, params);
        
        // Check cache for SELECT queries
        if (sql.trim().toUpperCase().startsWith('SELECT') && this.queryCache.has(cacheKey)) {
            const cached = this.queryCache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheMaxAge) {
                return cached.result;
            } else {
                this.queryCache.delete(cacheKey);
            }
        }

        try {
            let result;
            
            if (this.dbType === 'postgresql') {
                result = await this.queryPostgreSQL(sql, params);
            } else {
                result = await this.querySQLite(sql, params);
            }

            // Cache SELECT results
            if (sql.trim().toUpperCase().startsWith('SELECT')) {
                if (this.queryCache.size >= this.performanceThresholds.maxCacheSize) {
                    this.cleanupCache();
                }
                this.queryCache.set(cacheKey, {
                    result,
                    timestamp: Date.now()
                });
            }

            // Update stats
            const queryTime = Date.now() - startTime;
            this.updateQueryStats(true, queryTime);
            
            // Log slow queries
            if (queryTime > this.performanceThresholds.slowQueryMs) {
                console.warn(`🐌 Slow query (${queryTime}ms):`, sql.substring(0, 100));
            }

            return result;
        } catch (error) {
            this.updateQueryStats(false, Date.now() - startTime);
            this.connectionStats.lastError = error;
            throw error;
        }
    }

    async queryPostgreSQL(sql, params = []) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(sql, params);
            return {
                rows: result.rows,
                rowCount: result.rowCount,
                insertId: result.rows[0]?.id || null
            };
        } finally {
            client.release();
        }
    }

    async querySQLite(sql, params = []) {
        return new Promise((resolve, reject) => {
            if (sql.trim().toUpperCase().startsWith('SELECT')) {
                this.db.all(sql, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve({ rows, rowCount: rows.length });
                });
            } else {
                this.db.run(sql, params, function(err) {
                    if (err) reject(err);
                    else resolve({ 
                        rows: [], 
                        rowCount: this.changes,
                        insertId: this.lastID 
                    });
                });
            }
        });
    }

    async runSQLite(sql) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    // Transaction support
    async transaction(callback) {
        if (this.dbType === 'postgresql') {
            const client = await this.pool.connect();
            try {
                await client.query('BEGIN');
                const result = await callback((sql, params) => client.query(sql, params));
                await client.query('COMMIT');
                return result;
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
        } else {
            return new Promise((resolve, reject) => {
                this.db.serialize(() => {
                    this.db.run('BEGIN TRANSACTION');
                    
                    callback((sql, params) => this.querySQLite(sql, params))
                        .then(result => {
                            this.db.run('COMMIT', (err) => {
                                if (err) reject(err);
                                else resolve(result);
                            });
                        })
                        .catch(error => {
                            this.db.run('ROLLBACK');
                            reject(error);
                        });
                });
            });
        }
    }

    // Performance monitoring methods
    updateQueryStats(success, queryTime) {
        this.connectionStats.totalQueries++;
        
        if (success) {
            this.connectionStats.successfulQueries++;
        } else {
            this.connectionStats.failedQueries++;
        }
        
        // Update average query time (rolling average)
        const totalTime = this.connectionStats.averageQueryTime * (this.connectionStats.totalQueries - 1);
        this.connectionStats.averageQueryTime = (totalTime + queryTime) / this.connectionStats.totalQueries;
    }

    generateCacheKey(sql, params) {
        return `${sql}:${JSON.stringify(params)}`;
    }

    cleanupCache() {
        const now = Date.now();
        let cleaned = 0;
        
        for (const [key, value] of this.queryCache.entries()) {
            if (now - value.timestamp > this.cacheMaxAge) {
                this.queryCache.delete(key);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
        }
    }

    async logPerformanceMetrics() {
        const metrics = {
            total_queries: this.connectionStats.totalQueries,
            successful_queries: this.connectionStats.successfulQueries,
            failed_queries: this.connectionStats.failedQueries,
            average_query_time: this.connectionStats.averageQueryTime,
            cache_size: this.queryCache.size,
            connection_count: this.connectionStats.connectionCount
        };

        try {
            await this.query(
                'INSERT INTO performance_metrics (metric_type, metric_value, metadata) VALUES (?, ?, ?)',
                ['database_performance', this.connectionStats.averageQueryTime, JSON.stringify(metrics)]
            );
        } catch (error) {
            console.warn('⚠️ Failed to log performance metrics:', error.message);
        }
    }

    // Health check
    async healthCheck() {
        try {
            const result = await this.query('SELECT 1 as health_check');
            return {
                status: 'healthy',
                database: this.dbType,
                responseTime: Date.now(),
                stats: this.connectionStats,
                cacheSize: this.queryCache.size
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                database: this.dbType,
                error: error.message,
                stats: this.connectionStats
            };
        }
    }

    // Migration utilities
    async migrate(migrationFunction) {
        console.log('🔄 Running database migration...');
        
        try {
            await this.transaction(async (query) => {
                await migrationFunction(query);
            });
            console.log('✅ Migration completed successfully');
        } catch (error) {
            console.error('❌ Migration failed:', error);
            throw error;
        }
    }

    // Backup utilities (for SQLite)
    async backup(backupPath) {
        if (this.dbType !== 'sqlite') {
            throw new Error('Backup only supported for SQLite');
        }
        
        return new Promise((resolve, reject) => {
            const backup = this.db.backup(backupPath);
            backup.step(-1, (err) => {
                if (err) reject(err);
                else {
                    backup.finish();
                    resolve();
                }
            });
        });
    }

    // Cleanup and shutdown
    async close() {
        console.log('🔌 Closing database connections...');
        
        try {
            if (this.pool) {
                await this.pool.end();
                console.log('✅ PostgreSQL pool closed');
            }
            
            if (this.db) {
                await new Promise((resolve) => {
                    this.db.close(resolve);
                });
                console.log('✅ SQLite connection closed');
            }
            
            this.queryCache.clear();
        } catch (error) {
            console.error('❌ Error closing database:', error);
        }
    }

    // Public getters
    getStats() {
        return {
            ...this.connectionStats,
            cacheSize: this.queryCache.size,
            dbType: this.dbType
        };
    }

    isPostgreSQL() {
        return this.dbType === 'postgresql';
    }

    isSQLite() {
        return this.dbType === 'sqlite';
    }
}
