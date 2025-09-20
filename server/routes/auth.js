import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { db } from '../database/init.js';

const router = express.Router();

// Generate JWT token
function generateToken(user) {
    return jwt.sign(
        { 
            id: user.id, 
            username: user.username, 
            is_guest: user.is_guest 
        },
        process.env.JWT_SECRET || 'fallback-secret-key',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
}

// Create guest user
router.post('/guest', [
    body('username').trim().isLength({ min: 1, max: 50 }).withMessage('Username must be 1-50 characters'),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username } = req.body;
        const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const query = `
            INSERT INTO users (username, is_guest, guest_id, created_at)
            VALUES (?, 1, ?, CURRENT_TIMESTAMP)
        `;

        db.run(query, [username, guestId], function(err) {
            if (err) {
                if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                    return res.status(409).json({ error: 'Username already taken' });
                }
                console.error('Guest creation error:', err);
                return res.status(500).json({ error: 'Failed to create guest user' });
            }

            const user = {
                id: this.lastID,
                username,
                is_guest: true,
                guest_id: guestId
            };

            const token = generateToken(user);

            res.status(201).json({
                message: 'Guest user created successfully',
                user: {
                    id: user.id,
                    username: user.username,
                    is_guest: true
                },
                token
            });
        });
    } catch (error) {
        console.error('Guest creation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Register new user (full account)
router.post('/register', [
    body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, password } = req.body;

        // Hash password
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const query = `
            INSERT INTO users (username, email, password_hash, is_guest, created_at)
            VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP)
        `;

        db.run(query, [username, email, passwordHash], function(err) {
            if (err) {
                if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                    return res.status(409).json({ error: 'Username or email already exists' });
                }
                console.error('Registration error:', err);
                return res.status(500).json({ error: 'Failed to create account' });
            }

            const user = {
                id: this.lastID,
                username,
                email,
                is_guest: false
            };

            const token = generateToken(user);

            res.status(201).json({
                message: 'Account created successfully',
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    is_guest: false
                },
                token
            });
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login
router.post('/login', [
    body('username').trim().isLength({ min: 1 }).withMessage('Username required'),
    body('password').isLength({ min: 1 }).withMessage('Password required'),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password } = req.body;

        const query = `
            SELECT id, username, email, password_hash, is_guest, created_at
            FROM users 
            WHERE username = ? AND is_guest = 0
        `;

        db.get(query, [username], async (err, user) => {
            if (err) {
                console.error('Login query error:', err);
                return res.status(500).json({ error: 'Login failed' });
            }

            if (!user) {
                return res.status(401).json({ error: 'Invalid username or password' });
            }

            // Check password
            const passwordMatch = await bcrypt.compare(password, user.password_hash);
            if (!passwordMatch) {
                return res.status(401).json({ error: 'Invalid username or password' });
            }

            // Update last login
            db.run('UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

            const token = generateToken(user);

            res.json({
                message: 'Login successful',
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    is_guest: false,
                    created_at: user.created_at
                },
                token
            });
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Verify token
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
        
        // Get fresh user data
        const query = `
            SELECT id, username, email, is_guest, created_at, total_games_played, best_score
            FROM users 
            WHERE id = ?
        `;

        db.get(query, [decoded.id], (err, user) => {
            if (err || !user) {
                return res.status(401).json({ error: 'Invalid token' });
            }

            res.json({
                valid: true,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    is_guest: user.is_guest,
                    created_at: user.created_at,
                    total_games_played: user.total_games_played,
                    best_score: user.best_score
                }
            });
        });
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        
        console.error('Token verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
