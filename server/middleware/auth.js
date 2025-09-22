import jwt from 'jsonwebtoken';
import { db } from '../database/init.js';

// Middleware to verify JWT from HTTP-only cookie
export const verifyToken = (req, res, next) => {
    try {
        const token = req.cookies?.birddash_token;
        
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        
        console.error('Token verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = (req, res, next) => {
    try {
        const token = req.cookies?.birddash_token;
        
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
            req.user = decoded;
        }
        
        next();
    } catch (error) {
        // Continue without authentication if token is invalid
        console.warn('Optional auth failed:', error.message);
        next();
    }
};

// Get user data from database based on token
export const getUserFromToken = async (req, res, next) => {
    if (!req.user) {
        return next();
    }
    
    try {
        const query = `
            SELECT id, username, email, is_guest, created_at, total_games_played, best_score
            FROM users 
            WHERE id = ?
        `;
        
        db.get(query, [req.user.id], (err, user) => {
            if (err) {
                console.error('Database error in getUserFromToken:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            
            if (!user) {
                return res.status(401).json({ error: 'User not found' });
            }
            
            req.userData = user;
            next();
        });
    } catch (error) {
        console.error('Error in getUserFromToken:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
