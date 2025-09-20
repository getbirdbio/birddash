import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { db } from '../database/init.js';

const router = express.Router();

// Get leaderboard with pagination and filtering
router.get('/', [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative'),
    query('timeframe').optional().isIn(['all', 'today', 'week', 'month']).withMessage('Invalid timeframe'),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        const timeframe = req.query.timeframe || 'all';

        let whereClause = '';
        const params = [];

        // Add time filtering
        switch (timeframe) {
            case 'today':
                whereClause = 'WHERE DATE(game_date) = DATE("now")';
                break;
            case 'week':
                whereClause = 'WHERE game_date >= datetime("now", "-7 days")';
                break;
            case 'month':
                whereClause = 'WHERE game_date >= datetime("now", "-30 days")';
                break;
            default:
                whereClause = '';
        }

        const query = `
            SELECT 
                id,
                username,
                score,
                time_played,
                collectibles_collected,
                power_ups_collected,
                distance_traveled,
                max_combo,
                game_date,
                is_guest,
                ROW_NUMBER() OVER (ORDER BY score DESC) as rank
            FROM leaderboard_entries 
            ${whereClause}
            ORDER BY score DESC 
            LIMIT ? OFFSET ?
        `;

        params.push(limit, offset);

        db.all(query, params, (err, rows) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to fetch leaderboard' });
            }

            // Get total count for pagination
            const countQuery = `SELECT COUNT(*) as total FROM leaderboard_entries ${whereClause}`;
            db.get(countQuery, [], (err, countResult) => {
                if (err) {
                    console.error('Count query error:', err);
                    return res.status(500).json({ error: 'Failed to get total count' });
                }

                res.json({
                    leaderboard: rows,
                    pagination: {
                        total: countResult.total,
                        limit,
                        offset,
                        hasMore: (offset + limit) < countResult.total
                    },
                    timeframe
                });
            });
        });
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Submit a new score
router.post('/submit', [
    body('username').trim().isLength({ min: 1, max: 50 }).withMessage('Username must be 1-50 characters'),
    body('score').isInt({ min: 0 }).withMessage('Score must be a non-negative integer'),
    body('time_played').isInt({ min: 0 }).withMessage('Time played must be a non-negative integer'),
    body('collectibles_collected').optional().isInt({ min: 0 }).withMessage('Collectibles must be non-negative'),
    body('power_ups_collected').optional().isInt({ min: 0 }).withMessage('Power-ups must be non-negative'),
    body('distance_traveled').optional().isInt({ min: 0 }).withMessage('Distance must be non-negative'),
    body('max_combo').optional().isInt({ min: 0 }).withMessage('Max combo must be non-negative'),
    body('is_guest').optional().isBoolean().withMessage('is_guest must be boolean'),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            username,
            score,
            time_played,
            collectibles_collected = 0,
            power_ups_collected = 0,
            distance_traveled = 0,
            max_combo = 0,
            is_guest = true,
            user_id = null
        } = req.body;

        const query = `
            INSERT INTO leaderboard_entries (
                user_id, username, score, time_played, 
                collectibles_collected, power_ups_collected, 
                distance_traveled, max_combo, is_guest
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            user_id, username, score, time_played,
            collectibles_collected, power_ups_collected,
            distance_traveled, max_combo, is_guest
        ];

        db.run(query, params, function(err) {
            if (err) {
                console.error('Insert error:', err);
                return res.status(500).json({ error: 'Failed to submit score' });
            }

            // Get the user's rank
            const rankQuery = `
                SELECT COUNT(*) + 1 as rank 
                FROM leaderboard_entries 
                WHERE score > ?
            `;

            db.get(rankQuery, [score], (err, rankResult) => {
                if (err) {
                    console.error('Rank query error:', err);
                    return res.status(500).json({ error: 'Score submitted but failed to get rank' });
                }

                res.status(201).json({
                    message: 'Score submitted successfully',
                    entry_id: this.lastID,
                    rank: rankResult.rank,
                    score,
                    username
                });
            });
        });
    } catch (error) {
        console.error('Submit score error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user's best scores
router.get('/user/:username', [
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const username = req.params.username;
        const limit = parseInt(req.query.limit) || 10;

        const query = `
            SELECT 
                score,
                time_played,
                collectibles_collected,
                power_ups_collected,
                distance_traveled,
                max_combo,
                game_date,
                (SELECT COUNT(*) + 1 FROM leaderboard_entries WHERE score > l.score) as rank
            FROM leaderboard_entries l
            WHERE username = ?
            ORDER BY score DESC
            LIMIT ?
        `;

        db.all(query, [username, limit], (err, rows) => {
            if (err) {
                console.error('User scores error:', err);
                return res.status(500).json({ error: 'Failed to fetch user scores' });
            }

            res.json({
                username,
                scores: rows,
                total_games: rows.length
            });
        });
    } catch (error) {
        console.error('User leaderboard error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get leaderboard statistics
router.get('/stats', async (req, res) => {
    try {
        const queries = {
            totalGames: 'SELECT COUNT(*) as count FROM leaderboard_entries',
            totalPlayers: 'SELECT COUNT(DISTINCT username) as count FROM leaderboard_entries',
            highestScore: 'SELECT MAX(score) as score FROM leaderboard_entries',
            averageScore: 'SELECT AVG(score) as average FROM leaderboard_entries',
            totalTimePlayed: 'SELECT SUM(time_played) as total FROM leaderboard_entries',
            todayGames: 'SELECT COUNT(*) as count FROM leaderboard_entries WHERE DATE(game_date) = DATE("now")'
        };

        const results = {};
        let completed = 0;
        const total = Object.keys(queries).length;

        Object.entries(queries).forEach(([key, query]) => {
            db.get(query, [], (err, row) => {
                if (err) {
                    console.error(`Stats query error for ${key}:`, err);
                    results[key] = null;
                } else {
                    results[key] = row.count !== undefined ? row.count : 
                                   row.score !== undefined ? row.score :
                                   row.average !== undefined ? Math.round(row.average) :
                                   row.total !== undefined ? row.total : null;
                }
                
                completed++;
                if (completed === total) {
                    res.json({
                        statistics: results,
                        generated_at: new Date().toISOString()
                    });
                }
            });
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
