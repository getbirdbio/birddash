import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { db } from '../database/init.js';

const router = express.Router();

// Get user profile
router.get('/:username', [
    param('username').trim().isLength({ min: 1, max: 50 }).withMessage('Valid username required'),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username } = req.params;

        const userQuery = `
            SELECT 
                id, username, created_at, is_guest,
                total_games_played, total_score, best_score,
                total_time_played, favorite_collectible
            FROM users 
            WHERE username = ?
        `;

        db.get(userQuery, [username], (err, user) => {
            if (err) {
                console.error('User query error:', err);
                return res.status(500).json({ error: 'Failed to fetch user data' });
            }

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Get user's recent games
            const recentGamesQuery = `
                SELECT 
                    score, time_played, collectibles_collected,
                    power_ups_collected, distance_traveled, max_combo,
                    game_date,
                    (SELECT COUNT(*) + 1 FROM leaderboard_entries WHERE score > l.score) as rank
                FROM leaderboard_entries l
                WHERE username = ?
                ORDER BY game_date DESC
                LIMIT 10
            `;

            db.all(recentGamesQuery, [username], (err, recentGames) => {
                if (err) {
                    console.error('Recent games query error:', err);
                    return res.status(500).json({ error: 'Failed to fetch recent games' });
                }

                // Get user's achievements
                const achievementsQuery = `
                    SELECT achievement_id, unlocked_at, progress
                    FROM user_achievements
                    WHERE user_id = ?
                    ORDER BY unlocked_at DESC
                `;

                db.all(achievementsQuery, [user.id], (err, achievements) => {
                    if (err) {
                        console.error('Achievements query error:', err);
                        achievements = [];
                    }

                    res.json({
                        user: {
                            username: user.username,
                            created_at: user.created_at,
                            is_guest: user.is_guest,
                            stats: {
                                total_games_played: user.total_games_played || 0,
                                total_score: user.total_score || 0,
                                best_score: user.best_score || 0,
                                total_time_played: user.total_time_played || 0,
                                favorite_collectible: user.favorite_collectible,
                                average_score: user.total_games_played > 0 ? 
                                    Math.round(user.total_score / user.total_games_played) : 0
                            }
                        },
                        recent_games: recentGames,
                        achievements: achievements
                    });
                });
            });
        });
    } catch (error) {
        console.error('User profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user stats after a game
router.post('/:username/game-complete', [
    param('username').trim().isLength({ min: 1, max: 50 }).withMessage('Valid username required'),
    body('score').isInt({ min: 0 }).withMessage('Score must be non-negative'),
    body('time_played').isInt({ min: 0 }).withMessage('Time played must be non-negative'),
    body('collectibles_collected').optional().isInt({ min: 0 }).withMessage('Collectibles must be non-negative'),
    body('distance_traveled').optional().isInt({ min: 0 }).withMessage('Distance must be non-negative'),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username } = req.params;
        const { 
            score, 
            time_played, 
            collectibles_collected = 0,
            distance_traveled = 0 
        } = req.body;

        // Get current user stats
        const getUserQuery = `
            SELECT id, total_games_played, total_score, best_score, total_time_played
            FROM users 
            WHERE username = ?
        `;

        db.get(getUserQuery, [username], (err, user) => {
            if (err || !user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Calculate new stats
            const newTotalGames = (user.total_games_played || 0) + 1;
            const newTotalScore = (user.total_score || 0) + score;
            const newBestScore = Math.max(user.best_score || 0, score);
            const newTotalTime = (user.total_time_played || 0) + time_played;

            // Update user stats
            const updateUserQuery = `
                UPDATE users 
                SET 
                    total_games_played = ?,
                    total_score = ?,
                    best_score = ?,
                    total_time_played = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;

            db.run(updateUserQuery, [
                newTotalGames, newTotalScore, newBestScore, 
                newTotalTime, user.id
            ], function(err) {
                if (err) {
                    console.error('Update user stats error:', err);
                    return res.status(500).json({ error: 'Failed to update user stats' });
                }

                // Check for new achievements
                checkAchievements(user.id, {
                    score,
                    total_games: newTotalGames,
                    best_score: newBestScore,
                    collectibles_collected,
                    distance_traveled
                });

                res.json({
                    message: 'User stats updated successfully',
                    stats: {
                        total_games_played: newTotalGames,
                        total_score: newTotalScore,
                        best_score: newBestScore,
                        total_time_played: newTotalTime,
                        average_score: Math.round(newTotalScore / newTotalGames)
                    }
                });
            });
        });
    } catch (error) {
        console.error('Game complete error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Achievement checking function
function checkAchievements(userId, gameData) {
    const achievements = [
        { id: 'first_game', condition: () => gameData.total_games === 1, name: 'First Flight' },
        { id: 'score_1000', condition: () => gameData.score >= 1000, name: 'Coffee Connoisseur' },
        { id: 'score_5000', condition: () => gameData.score >= 5000, name: 'Barista Master' },
        { id: 'games_10', condition: () => gameData.total_games >= 10, name: 'Regular Customer' },
        { id: 'games_50', condition: () => gameData.total_games >= 50, name: 'Coffee Addict' },
        { id: 'collector_100', condition: () => gameData.collectibles_collected >= 100, name: 'Collector' },
        { id: 'distance_10000', condition: () => gameData.distance_traveled >= 10000, name: 'Long Distance Flyer' }
    ];

    achievements.forEach(achievement => {
        if (achievement.condition()) {
            const insertAchievementQuery = `
                INSERT OR IGNORE INTO user_achievements (user_id, achievement_id, unlocked_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
            `;
            
            db.run(insertAchievementQuery, [userId, achievement.id], function(err) {
                if (err) {
                    console.error('Achievement insert error:', err);
                } else if (this.changes > 0) {
                    console.log(`🏆 User ${userId} unlocked achievement: ${achievement.name}`);
                }
            });
        }
    });
}

// Get user achievements
router.get('/:username/achievements', [
    param('username').trim().isLength({ min: 1, max: 50 }).withMessage('Valid username required'),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username } = req.params;

        // Get user ID
        const userQuery = 'SELECT id FROM users WHERE username = ?';
        
        db.get(userQuery, [username], (err, user) => {
            if (err || !user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Get achievements
            const achievementsQuery = `
                SELECT achievement_id, unlocked_at, progress
                FROM user_achievements
                WHERE user_id = ?
                ORDER BY unlocked_at DESC
            `;

            db.all(achievementsQuery, [user.id], (err, achievements) => {
                if (err) {
                    console.error('Achievements query error:', err);
                    return res.status(500).json({ error: 'Failed to fetch achievements' });
                }

                // Define achievement metadata
                const achievementMeta = {
                    'first_game': { name: 'First Flight', description: 'Play your first game', icon: '🐦' },
                    'score_1000': { name: 'Coffee Connoisseur', description: 'Score 1000 points', icon: '☕' },
                    'score_5000': { name: 'Barista Master', description: 'Score 5000 points', icon: '👨‍🍳' },
                    'games_10': { name: 'Regular Customer', description: 'Play 10 games', icon: '🎮' },
                    'games_50': { name: 'Coffee Addict', description: 'Play 50 games', icon: '🏆' },
                    'collector_100': { name: 'Collector', description: 'Collect 100 items in one game', icon: '📦' },
                    'distance_10000': { name: 'Long Distance Flyer', description: 'Travel 10,000 units', icon: '✈️' }
                };

                const enrichedAchievements = achievements.map(achievement => ({
                    ...achievement,
                    ...achievementMeta[achievement.achievement_id],
                    id: achievement.achievement_id
                }));

                res.json({
                    username,
                    achievements: enrichedAchievements,
                    total_achievements: enrichedAchievements.length
                });
            });
        });
    } catch (error) {
        console.error('User achievements error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
