import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create database directory if it doesn't exist
const dbDir = path.join(__dirname, '../../database');
console.log('📁 Database directory path:', dbDir);

try {
    if (!fs.existsSync(dbDir)) {
        console.log('📁 Creating database directory...');
        fs.mkdirSync(dbDir, { recursive: true });
        console.log('✅ Database directory created successfully');
    } else {
        console.log('✅ Database directory already exists');
    }
} catch (error) {
    console.error('❌ Failed to create database directory:', error);
    console.log('📁 Attempting to use current directory for database...');
}

// Determine database path with fallbacks for Railway
let dbPath;
if (process.env.DATABASE_URL) {
    dbPath = process.env.DATABASE_URL;
} else if (fs.existsSync(dbDir)) {
    dbPath = path.join(dbDir, 'birddash.db');
} else {
    // Fallback for Railway - use current directory
    dbPath = './birddash.db';
    console.log('📁 Using fallback database path in current directory');
}

console.log('🗄️ Database path:', dbPath);

// Create database connection with better error handling
let db;
try {
    db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('❌ Error opening database:', err.message);
            throw err;
        } else {
            console.log('✅ Connected to SQLite database at:', dbPath);
        }
    });
} catch (error) {
    console.error('❌ Database connection failed:', error);
    // Try creating database in current directory as last resort
    const fallbackPath = './birddash_fallback.db';
    console.log('🔄 Attempting fallback database at:', fallbackPath);
    
    db = new sqlite3.Database(fallbackPath, (fallbackErr) => {
        if (fallbackErr) {
            console.error('❌ Fallback database creation failed:', fallbackErr.message);
            process.exit(1);
        } else {
            console.log('✅ Fallback database created successfully at:', fallbackPath);
        }
    });
}

export { db };

// Initialize database tables
export async function initializeDatabase() {
    return new Promise((resolve, reject) => {
        console.log('🗄️ Creating database tables...');
        
        db.serialize(() => {
            // Users table
            db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    email VARCHAR(100) UNIQUE,
                    password_hash VARCHAR(255),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    is_guest BOOLEAN DEFAULT 0,
                    guest_id VARCHAR(100) UNIQUE,
                    total_games_played INTEGER DEFAULT 0,
                    total_score INTEGER DEFAULT 0,
                    best_score INTEGER DEFAULT 0,
                    total_time_played INTEGER DEFAULT 0,
                    favorite_collectible VARCHAR(50),
                    achievements TEXT DEFAULT '[]'
                )
            `, (err) => {
                if (err) console.error('❌ Error creating users table:', err);
                else console.log('✅ Users table ready');
            });

            // Leaderboard entries table
            db.run(`
                CREATE TABLE IF NOT EXISTS leaderboard_entries (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    username VARCHAR(50) NOT NULL,
                    score INTEGER NOT NULL,
                    time_played INTEGER NOT NULL,
                    collectibles_collected INTEGER DEFAULT 0,
                    power_ups_collected INTEGER DEFAULT 0,
                    distance_traveled INTEGER DEFAULT 0,
                    max_combo INTEGER DEFAULT 0,
                    game_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    is_guest BOOLEAN DEFAULT 0,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
                )
            `, (err) => {
                if (err) console.error('❌ Error creating leaderboard table:', err);
                else console.log('✅ Leaderboard table ready');
            });

            // Game sessions table (for analytics)
            db.run(`
                CREATE TABLE IF NOT EXISTS game_sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    session_start DATETIME DEFAULT CURRENT_TIMESTAMP,
                    session_end DATETIME,
                    final_score INTEGER,
                    time_played INTEGER,
                    collectibles_collected INTEGER DEFAULT 0,
                    power_ups_collected INTEGER DEFAULT 0,
                    distance_traveled INTEGER DEFAULT 0,
                    max_combo INTEGER DEFAULT 0,
                    cause_of_death VARCHAR(100),
                    is_guest BOOLEAN DEFAULT 0,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
                )
            `, (err) => {
                if (err) console.error('❌ Error creating sessions table:', err);
                else console.log('✅ Sessions table ready');
            });

            // Daily challenges table (future feature)
            db.run(`
                CREATE TABLE IF NOT EXISTS daily_challenges (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    challenge_date DATE UNIQUE NOT NULL,
                    challenge_type VARCHAR(50) NOT NULL,
                    target_value INTEGER NOT NULL,
                    reward_points INTEGER DEFAULT 100,
                    description TEXT,
                    is_active BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) console.error('❌ Error creating challenges table:', err);
                else console.log('✅ Challenges table ready');
            });

            // User achievements table
            db.run(`
                CREATE TABLE IF NOT EXISTS user_achievements (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    achievement_id VARCHAR(50) NOT NULL,
                    unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    progress INTEGER DEFAULT 100,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                    UNIQUE(user_id, achievement_id)
                )
            `, (err) => {
                if (err) console.error('❌ Error creating achievements table:', err);
                else console.log('✅ Achievements table ready');
            });

            // Create indexes for better performance
            db.run(`CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard_entries (score DESC)`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_leaderboard_date ON leaderboard_entries (game_date DESC)`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_users_username ON users (username)`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_sessions_user ON game_sessions (user_id)`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_achievements_user ON user_achievements (user_id)`);

            // Insert some sample achievements
            db.run(`
                INSERT OR IGNORE INTO daily_challenges (challenge_date, challenge_type, target_value, description)
                VALUES 
                ('2025-09-20', 'score', 1000, 'Score 1000 points in a single game'),
                ('2025-09-20', 'collectibles', 50, 'Collect 50 items in a single game'),
                ('2025-09-20', 'time', 300, 'Survive for 5 minutes')
            `, (err) => {
                if (err) console.error('❌ Error inserting sample challenges:', err);
                else console.log('✅ Sample challenges ready');
            });

            console.log('✅ Database tables initialized');
            resolve();
        });
    });
}

// Graceful database shutdown
process.on('SIGINT', () => {
    console.log('🛑 Closing database connection...');
    db.close((err) => {
        if (err) {
            console.error('❌ Error closing database:', err.message);
        } else {
            console.log('✅ Database connection closed');
        }
        process.exit(0);
    });
});