// Enhanced Database Initialization - Phase 3 Production Database Support
// Supports both SQLite (development) and PostgreSQL (production)
// Backward compatible with existing init.js

import DatabaseManager from './DatabaseManager.js';
import { initializeDatabase as legacyInit, db as legacyDb } from './init.js';

let databaseManager = null;
let isEnhanced = false;

export async function initializeEnhancedDatabase() {
    console.log('🗄️ Enhanced Database: Initializing production-ready database system...');
    
    try {
        // Check if we should use enhanced database
        const useEnhanced = process.env.USE_ENHANCED_DB === 'true' || 
                           process.env.DATABASE_TYPE === 'postgresql' ||
                           process.env.NODE_ENV === 'production';
        
        if (useEnhanced) {
            console.log('📊 Using enhanced DatabaseManager with production features');
            databaseManager = new DatabaseManager();
            await databaseManager.initialize();
            isEnhanced = true;
            
            // Migrate data if switching from SQLite
            if (process.env.MIGRATE_FROM_SQLITE === 'true') {
                await migrateFromSQLite();
            }
            
            // Initialize default achievements
            await initializeAchievements();
            
            return databaseManager;
        } else {
            console.log('📁 Using legacy SQLite database for development');
            await legacyInit();
            isEnhanced = false;
            return createLegacyWrapper();
        }
    } catch (error) {
        console.error('❌ Enhanced database initialization failed:', error);
        console.log('🔄 Falling back to legacy SQLite database...');
        
        // Fallback to legacy system
        await legacyInit();
        isEnhanced = false;
        return createLegacyWrapper();
    }
}

// Create a wrapper to make legacy database compatible with new interface
function createLegacyWrapper() {
    return {
        query: async (sql, params = []) => {
            return new Promise((resolve, reject) => {
                if (sql.trim().toUpperCase().startsWith('SELECT')) {
                    legacyDb.all(sql, params, (err, rows) => {
                        if (err) reject(err);
                        else resolve({ rows, rowCount: rows.length });
                    });
                } else {
                    legacyDb.run(sql, params, function(err) {
                        if (err) reject(err);
                        else resolve({ 
                            rows: [], 
                            rowCount: this.changes,
                            insertId: this.lastID 
                        });
                    });
                }
            });
        },
        
        transaction: async (callback) => {
            return new Promise((resolve, reject) => {
                legacyDb.serialize(() => {
                    legacyDb.run('BEGIN TRANSACTION');
                    
                    callback((sql, params) => {
                        return new Promise((resolveQuery, rejectQuery) => {
                            if (sql.trim().toUpperCase().startsWith('SELECT')) {
                                legacyDb.all(sql, params, (err, rows) => {
                                    if (err) rejectQuery(err);
                                    else resolveQuery({ rows, rowCount: rows.length });
                                });
                            } else {
                                legacyDb.run(sql, params, function(err) {
                                    if (err) rejectQuery(err);
                                    else resolveQuery({ 
                                        rows: [], 
                                        rowCount: this.changes,
                                        insertId: this.lastID 
                                    });
                                });
                            }
                        });
                    })
                    .then(result => {
                        legacyDb.run('COMMIT', (err) => {
                            if (err) reject(err);
                            else resolve(result);
                        });
                    })
                    .catch(error => {
                        legacyDb.run('ROLLBACK');
                        reject(error);
                    });
                });
            });
        },
        
        healthCheck: async () => {
            try {
                await this.query('SELECT 1');
                return { status: 'healthy', database: 'sqlite_legacy' };
            } catch (error) {
                return { status: 'unhealthy', database: 'sqlite_legacy', error: error.message };
            }
        },
        
        isPostgreSQL: () => false,
        isSQLite: () => true,
        getStats: () => ({ dbType: 'sqlite_legacy' }),
        close: () => {
            return new Promise((resolve) => {
                legacyDb.close(resolve);
            });
        }
    };
}

async function migrateFromSQLite() {
    console.log('🔄 Migrating data from SQLite to PostgreSQL...');
    
    try {
        // Initialize legacy database to read from
        await legacyInit();
        
        // Migrate users
        const users = await new Promise((resolve, reject) => {
            legacyDb.all('SELECT * FROM users', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        for (const user of users) {
            await databaseManager.query(
                `INSERT INTO users (username, email, password_hash, is_guest, guest_id, 
                 total_games_played, best_score, created_at, updated_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    user.username, user.email, user.password_hash, user.is_guest,
                    user.guest_id, user.total_games_played || 0, user.best_score || 0,
                    user.created_at, user.updated_at
                ]
            );
        }
        
        // Migrate leaderboards
        const leaderboards = await new Promise((resolve, reject) => {
            legacyDb.all('SELECT * FROM leaderboards', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        for (const entry of leaderboards) {
            await databaseManager.query(
                `INSERT INTO leaderboards (user_id, username, score, game_date) 
                 VALUES (?, ?, ?, ?)`,
                [entry.user_id, entry.username, entry.score, entry.game_date]
            );
        }
        
        console.log('✅ Data migration completed successfully');
        console.log(`📊 Migrated ${users.length} users and ${leaderboards.length} leaderboard entries`);
        
    } catch (error) {
        console.error('❌ Data migration failed:', error);
        throw error;
    }
}

async function initializeAchievements() {
    console.log('🏆 Initializing default achievements...');
    
    const defaultAchievements = [
        {
            achievement_id: 'first_flight',
            name: 'First Flight',
            description: 'Complete your first game',
            category: 'getting_started',
            difficulty: 'easy',
            points: 10,
            icon: '🛫',
            conditions: JSON.stringify({ games_played: 1 })
        },
        {
            achievement_id: 'coffee_lover',
            name: 'Coffee Lover',
            description: 'Collect 100 coffee beans',
            category: 'collection',
            difficulty: 'easy',
            points: 15,
            icon: '☕',
            conditions: JSON.stringify({ coffee_beans_collected: 100 })
        },
        {
            achievement_id: 'speed_demon',
            name: 'Speed Demon',
            description: 'Reach level 10',
            category: 'progression',
            difficulty: 'medium',
            points: 25,
            icon: '🏎️',
            conditions: JSON.stringify({ max_level: 10 })
        },
        {
            achievement_id: 'combo_master',
            name: 'Combo Master',
            description: 'Achieve a 20x combo',
            category: 'skill',
            difficulty: 'medium',
            points: 30,
            icon: '🔥',
            conditions: JSON.stringify({ max_combo: 20 })
        },
        {
            achievement_id: 'distance_runner',
            name: 'Distance Runner',
            description: 'Travel 10,000 units in a single game',
            category: 'endurance',
            difficulty: 'medium',
            points: 35,
            icon: '🏃',
            conditions: JSON.stringify({ distance_single_game: 10000 })
        },
        {
            achievement_id: 'power_user',
            name: 'Power User',
            description: 'Use all 6 types of power-ups in one game',
            category: 'skill',
            difficulty: 'hard',
            points: 40,
            icon: '⚡',
            conditions: JSON.stringify({ powerup_types_used: 6 })
        },
        {
            achievement_id: 'perfectionist',
            name: 'Perfectionist',
            description: 'Complete a game without hitting any obstacles',
            category: 'skill',
            difficulty: 'hard',
            points: 50,
            icon: '💎',
            conditions: JSON.stringify({ obstacles_hit: 0, minimum_score: 1000 })
        },
        {
            achievement_id: 'high_scorer',
            name: 'High Scorer',
            description: 'Score 50,000 points in a single game',
            category: 'scoring',
            difficulty: 'hard',
            points: 60,
            icon: '🎯',
            conditions: JSON.stringify({ single_game_score: 50000 })
        },
        {
            achievement_id: 'marathon_runner',
            name: 'Marathon Runner',
            description: 'Survive for 10 minutes',
            category: 'endurance',
            difficulty: 'hard',
            points: 70,
            icon: '🏃‍♂️',
            conditions: JSON.stringify({ survival_time: 600000 })
        },
        {
            achievement_id: 'legend',
            name: 'Legend',
            description: 'Score 100,000 points in a single game',
            category: 'scoring',
            difficulty: 'legendary',
            points: 100,
            icon: '👑',
            conditions: JSON.stringify({ single_game_score: 100000 })
        }
    ];
    
    try {
        for (const achievement of defaultAchievements) {
            await databaseManager.query(
                `INSERT INTO achievements (achievement_id, name, description, category, 
                 difficulty, points, icon, conditions) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                 ON CONFLICT (achievement_id) DO NOTHING`,
                [
                    achievement.achievement_id, achievement.name, achievement.description,
                    achievement.category, achievement.difficulty, achievement.points,
                    achievement.icon, achievement.conditions
                ]
            );
        }
        
        console.log(`✅ Initialized ${defaultAchievements.length} default achievements`);
    } catch (error) {
        // Handle SQLite case (no ON CONFLICT support)
        console.log('📁 Using SQLite - checking existing achievements...');
        
        for (const achievement of defaultAchievements) {
            try {
                const existing = await databaseManager.query(
                    'SELECT id FROM achievements WHERE achievement_id = ?',
                    [achievement.achievement_id]
                );
                
                if (existing.rows.length === 0) {
                    await databaseManager.query(
                        `INSERT INTO achievements (achievement_id, name, description, category, 
                         difficulty, points, icon, conditions) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            achievement.achievement_id, achievement.name, achievement.description,
                            achievement.category, achievement.difficulty, achievement.points,
                            achievement.icon, achievement.conditions
                        ]
                    );
                }
            } catch (insertError) {
                console.warn(`⚠️ Could not insert achievement ${achievement.achievement_id}:`, insertError.message);
            }
        }
    }
}

// Export database instance
export function getDatabase() {
    if (!databaseManager && !legacyDb) {
        throw new Error('Database not initialized. Call initializeEnhancedDatabase() first.');
    }
    
    return databaseManager || createLegacyWrapper();
}

export function isEnhancedDatabase() {
    return isEnhanced;
}

export function getDatabaseType() {
    if (databaseManager) {
        return databaseManager.isPostgreSQL() ? 'postgresql' : 'sqlite';
    }
    return 'sqlite_legacy';
}

// Health check endpoint
export async function databaseHealthCheck() {
    try {
        const db = getDatabase();
        return await db.healthCheck();
    } catch (error) {
        return {
            status: 'unhealthy',
            error: error.message,
            database: getDatabaseType()
        };
    }
}

// Graceful shutdown
export async function closeDatabaseConnection() {
    try {
        if (databaseManager) {
            await databaseManager.close();
        } else if (legacyDb) {
            await new Promise((resolve) => {
                legacyDb.close(resolve);
            });
        }
        console.log('✅ Database connection closed gracefully');
    } catch (error) {
        console.error('❌ Error closing database connection:', error);
    }
}

// Backward compatibility exports
export { legacyDb as db } from './init.js';
export const initializeDatabase = initializeEnhancedDatabase;
