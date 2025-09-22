import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { db } from '../database/init.js';
import { 
    validateAndSanitize, 
    validateUsername, 
    validateEmail, 
    validatePassword,
    authRateLimit,
    preventSQLInjection
} from '../middleware/validation.js';
import { csrfProtection } from '../middleware/csrf.js';

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

// Set secure HTTP-only cookie with JWT
function setTokenCookie(res, token) {
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
        path: '/'
    };
    
    res.cookie('birddash_token', token, cookieOptions);
}

// Clear authentication cookie
function clearTokenCookie(res) {
    res.clearCookie('birddash_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
    });
}

// Create guest user
router.post('/guest', 
    authRateLimit,
    preventSQLInjection,
    validateAndSanitize([
        body('username')
            .trim()
            .isLength({ min: 1, max: 30 })
            .withMessage('Username must be 1-30 characters')
            .matches(/^[a-zA-Z0-9_-]+$/)
            .withMessage('Username can only contain letters, numbers, underscores, and hyphens')
    ]),
    async (req, res) => {
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
            setTokenCookie(res, token);

            res.status(201).json({
                message: 'Guest user created successfully',
                user: {
                    id: user.id,
                    username: user.username,
                    is_guest: true
                }
                // Note: token no longer sent in response body for security
            });
        });
    } catch (error) {
        console.error('Guest creation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Register new user (full account)
router.post('/register', 
    authRateLimit,
    preventSQLInjection,
    csrfProtection,
    validateAndSanitize([
        validateUsername,
        validateEmail,
        validatePassword
    ]),
    async (req, res) => {
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
            setTokenCookie(res, token);

            res.status(201).json({
                message: 'Account created successfully',
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    is_guest: false
                }
                // Note: token no longer sent in response body for security
            });
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login
router.post('/login', 
    authRateLimit,
    preventSQLInjection,
    csrfProtection,
    validateAndSanitize([
        body('username').trim().isLength({ min: 1 }).withMessage('Username required'),
        body('password').isLength({ min: 1 }).withMessage('Password required')
    ]),
    async (req, res) => {
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
            setTokenCookie(res, token);

            res.json({
                message: 'Login successful',
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    is_guest: false,
                    created_at: user.created_at
                }
                // Note: token no longer sent in response body for security
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
        // Get token from HTTP-only cookie instead of Authorization header
        const token = req.cookies?.birddash_token;
        
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

// Logout endpoint
router.post('/logout', (req, res) => {
    try {
        clearTokenCookie(res);
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
