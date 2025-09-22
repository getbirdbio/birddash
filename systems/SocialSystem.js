// SocialSystem - Friends, competitions, and community features
// Implements social gaming features for increased user engagement and retention

export default class SocialSystem {
    constructor(scene, databaseManager, analyticsSystem) {
        this.scene = scene;
        this.db = databaseManager;
        this.analytics = analyticsSystem;
        this.currentUser = null;
        this.friends = new Map();
        this.activeCompetitions = new Map();
        this.socialFeatures = {
            friends: true,
            competitions: true,
            sharing: true,
            challenges: true,
            leaderboards: true
        };
        
        // Social notifications
        this.notifications = [];
        this.notificationQueue = [];
        
        // Competition types
        this.competitionTypes = {
            daily_challenge: {
                name: 'Daily Challenge',
                duration: 24 * 60 * 60 * 1000, // 24 hours
                icon: '📅',
                description: 'Complete daily objectives for rewards'
            },
            weekly_tournament: {
                name: 'Weekly Tournament',
                duration: 7 * 24 * 60 * 60 * 1000, // 7 days
                icon: '🏆',
                description: 'Compete with players worldwide'
            },
            friend_challenge: {
                name: 'Friend Challenge',
                duration: 3 * 24 * 60 * 60 * 1000, // 3 days
                icon: '👥',
                description: 'Challenge your friends to beat your score'
            },
            speed_run: {
                name: 'Speed Run',
                duration: 60 * 60 * 1000, // 1 hour
                icon: '⚡',
                description: 'Race against time for the highest score'
            }
        };
        
        this.initializeSocialSystem();
    }

    async initializeSocialSystem() {
        console.log('👥 SocialSystem: Initializing social features');
        
        try {
            await this.createSocialTables();
            this.setupEventListeners();
            this.startNotificationSystem();
            this.initializeCompetitions();
            
            console.log('✅ Social system initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize social system:', error);
        }
    }

    async createSocialTables() {
        const isPostgres = this.db.isPostgreSQL();
        const autoIncrement = isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
        const timestamp = isPostgres ? 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' : 'DATETIME DEFAULT CURRENT_TIMESTAMP';
        const jsonType = isPostgres ? 'JSONB' : 'TEXT';

        const tables = {
            friendships: `
                CREATE TABLE IF NOT EXISTS friendships (
                    id ${autoIncrement},
                    user_id INTEGER NOT NULL,
                    friend_id INTEGER NOT NULL,
                    status VARCHAR(20) DEFAULT 'pending',
                    created_at ${timestamp},
                    accepted_at ${timestamp} NULL,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                    FOREIGN KEY (friend_id) REFERENCES users (id) ON DELETE CASCADE,
                    UNIQUE(user_id, friend_id)
                )
            `,
            
            competitions: `
                CREATE TABLE IF NOT EXISTS competitions (
                    id ${autoIncrement},
                    competition_id VARCHAR(100) NOT NULL UNIQUE,
                    name VARCHAR(200) NOT NULL,
                    description TEXT,
                    type VARCHAR(50) NOT NULL,
                    status VARCHAR(20) DEFAULT 'active',
                    start_date ${timestamp},
                    end_date ${timestamp},
                    rules ${jsonType} DEFAULT '{}',
                    rewards ${jsonType} DEFAULT '{}',
                    max_participants INTEGER DEFAULT 1000,
                    created_by INTEGER,
                    FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
                )
            `,
            
            competition_participants: `
                CREATE TABLE IF NOT EXISTS competition_participants (
                    id ${autoIncrement},
                    competition_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    best_score INTEGER DEFAULT 0,
                    attempts INTEGER DEFAULT 0,
                    last_attempt ${timestamp},
                    joined_at ${timestamp},
                    FOREIGN KEY (competition_id) REFERENCES competitions (id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                    UNIQUE(competition_id, user_id)
                )
            `,
            
            social_challenges: `
                CREATE TABLE IF NOT EXISTS social_challenges (
                    id ${autoIncrement},
                    challenge_id VARCHAR(100) NOT NULL UNIQUE,
                    challenger_id INTEGER NOT NULL,
                    challenged_id INTEGER NOT NULL,
                    challenge_type VARCHAR(50) NOT NULL,
                    target_score INTEGER,
                    status VARCHAR(20) DEFAULT 'active',
                    created_at ${timestamp},
                    expires_at ${timestamp},
                    completed_at ${timestamp} NULL,
                    winner_id INTEGER NULL,
                    FOREIGN KEY (challenger_id) REFERENCES users (id) ON DELETE CASCADE,
                    FOREIGN KEY (challenged_id) REFERENCES users (id) ON DELETE CASCADE,
                    FOREIGN KEY (winner_id) REFERENCES users (id) ON DELETE SET NULL
                )
            `,
            
            social_notifications: `
                CREATE TABLE IF NOT EXISTS social_notifications (
                    id ${autoIncrement},
                    user_id INTEGER NOT NULL,
                    type VARCHAR(50) NOT NULL,
                    title VARCHAR(200) NOT NULL,
                    message TEXT,
                    data ${jsonType} DEFAULT '{}',
                    read_status BOOLEAN DEFAULT FALSE,
                    created_at ${timestamp},
                    expires_at ${timestamp} NULL,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                )
            `,
            
            social_shares: `
                CREATE TABLE IF NOT EXISTS social_shares (
                    id ${autoIncrement},
                    user_id INTEGER NOT NULL,
                    share_type VARCHAR(50) NOT NULL,
                    content ${jsonType} NOT NULL,
                    platform VARCHAR(50),
                    shared_at ${timestamp},
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                )
            `
        };

        for (const [tableName, definition] of Object.entries(tables)) {
            try {
                await this.db.query(definition);
                console.log(`✅ Social table '${tableName}' created/verified`);
            } catch (error) {
                if (!error.message.includes('already exists')) {
                    console.error(`❌ Failed to create social table '${tableName}':`, error);
                }
            }
        }

        // Create indexes for social tables
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id)',
            'CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status)',
            'CREATE INDEX IF NOT EXISTS idx_competitions_type ON competitions(type)',
            'CREATE INDEX IF NOT EXISTS idx_competitions_status ON competitions(status)',
            'CREATE INDEX IF NOT EXISTS idx_competitions_dates ON competitions(start_date, end_date)',
            'CREATE INDEX IF NOT EXISTS idx_competition_participants_competition ON competition_participants(competition_id)',
            'CREATE INDEX IF NOT EXISTS idx_competition_participants_user ON competition_participants(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_social_challenges_challenger ON social_challenges(challenger_id)',
            'CREATE INDEX IF NOT EXISTS idx_social_challenges_challenged ON social_challenges(challenged_id)',
            'CREATE INDEX IF NOT EXISTS idx_social_challenges_status ON social_challenges(status)',
            'CREATE INDEX IF NOT EXISTS idx_social_notifications_user ON social_notifications(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_social_notifications_read ON social_notifications(read_status)'
        ];

        for (const indexQuery of indexes) {
            try {
                await this.db.query(indexQuery);
            } catch (error) {
                if (!error.message.includes('already exists')) {
                    console.warn('⚠️ Social index creation warning:', error.message);
                }
            }
        }
    }

    setupEventListeners() {
        // Game events that trigger social interactions
        this.scene.events.on('gameEnded', this.onGameEnded, this);
        this.scene.events.on('achievementUnlocked', this.onAchievementUnlocked, this);
        this.scene.events.on('levelUp', this.onLevelUp, this);
        this.scene.events.on('highScore', this.onHighScore, this);
    }

    startNotificationSystem() {
        // Process notification queue every 5 seconds
        setInterval(() => {
            this.processNotificationQueue();
        }, 5000);

        // Clean up old notifications every hour
        setInterval(() => {
            this.cleanupNotifications();
        }, 60 * 60 * 1000);
    }

    async initializeCompetitions() {
        // Create default competitions if they don't exist
        await this.createDefaultCompetitions();
        
        // Start competition management
        this.startCompetitionManagement();
    }

    // Friend Management
    async sendFriendRequest(userId, friendUsername) {
        try {
            // Find friend by username
            const friendResult = await this.db.query(
                'SELECT id, username FROM users WHERE username = ?',
                [friendUsername]
            );

            if (friendResult.rows.length === 0) {
                return { success: false, error: 'User not found' };
            }

            const friendId = friendResult.rows[0].id;

            // Check if friendship already exists
            const existingFriendship = await this.db.query(
                'SELECT * FROM friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
                [userId, friendId, friendId, userId]
            );

            if (existingFriendship.rows.length > 0) {
                return { success: false, error: 'Friendship already exists or pending' };
            }

            // Create friend request
            await this.db.query(
                'INSERT INTO friendships (user_id, friend_id, status) VALUES (?, ?, ?)',
                [userId, friendId, 'pending']
            );

            // Send notification to friend
            await this.sendNotification(friendId, 'friend_request', 'Friend Request', 
                `${await this.getUsernameById(userId)} wants to be your friend!`, {
                    requesterId: userId,
                    requesterUsername: await this.getUsernameById(userId)
                });

            this.trackSocialEvent('friend_request_sent', { friendId, friendUsername });

            return { success: true };
        } catch (error) {
            console.error('❌ Failed to send friend request:', error);
            return { success: false, error: 'Failed to send friend request' };
        }
    }

    async acceptFriendRequest(userId, requesterId) {
        try {
            // Update friendship status
            const result = await this.db.query(
                'UPDATE friendships SET status = ?, accepted_at = CURRENT_TIMESTAMP WHERE user_id = ? AND friend_id = ? AND status = ?',
                ['accepted', requesterId, userId, 'pending']
            );

            if (result.rowCount === 0) {
                return { success: false, error: 'Friend request not found' };
            }

            // Create reciprocal friendship
            await this.db.query(
                'INSERT INTO friendships (user_id, friend_id, status, accepted_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
                [userId, requesterId, 'accepted']
            );

            // Send notification to requester
            await this.sendNotification(requesterId, 'friend_accepted', 'Friend Request Accepted', 
                `${await this.getUsernameById(userId)} accepted your friend request!`, {
                    friendId: userId,
                    friendUsername: await this.getUsernameById(userId)
                });

            this.trackSocialEvent('friend_request_accepted', { friendId: requesterId });

            return { success: true };
        } catch (error) {
            console.error('❌ Failed to accept friend request:', error);
            return { success: false, error: 'Failed to accept friend request' };
        }
    }

    async getFriends(userId) {
        try {
            const friends = await this.db.query(`
                SELECT u.id, u.username, u.best_score, u.total_games_played, f.accepted_at
                FROM friendships f
                JOIN users u ON f.friend_id = u.id
                WHERE f.user_id = ? AND f.status = 'accepted'
                ORDER BY f.accepted_at DESC
            `, [userId]);

            return friends.rows;
        } catch (error) {
            console.error('❌ Failed to get friends:', error);
            return [];
        }
    }

    async getFriendRequests(userId) {
        try {
            const requests = await this.db.query(`
                SELECT f.id, u.id as requester_id, u.username, f.created_at
                FROM friendships f
                JOIN users u ON f.user_id = u.id
                WHERE f.friend_id = ? AND f.status = 'pending'
                ORDER BY f.created_at DESC
            `, [userId]);

            return requests.rows;
        } catch (error) {
            console.error('❌ Failed to get friend requests:', error);
            return [];
        }
    }

    // Competition Management
    async createDefaultCompetitions() {
        const defaultCompetitions = [
            {
                competition_id: 'daily_challenge_' + new Date().toISOString().split('T')[0],
                name: 'Daily Coffee Challenge',
                description: 'Collect 50 coffee beans in a single game',
                type: 'daily_challenge',
                rules: JSON.stringify({
                    objective: 'collect_coffee_beans',
                    target: 50,
                    timeLimit: null
                }),
                rewards: JSON.stringify({
                    points: 100,
                    badge: 'daily_champion'
                }),
                end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            },
            {
                competition_id: 'weekly_tournament_' + this.getWeekNumber(),
                name: 'Weekly High Score Tournament',
                description: 'Compete for the highest score this week',
                type: 'weekly_tournament',
                rules: JSON.stringify({
                    objective: 'highest_score',
                    maxAttempts: 10
                }),
                rewards: JSON.stringify({
                    first: { points: 500, badge: 'weekly_champion' },
                    second: { points: 300, badge: 'weekly_runner_up' },
                    third: { points: 200, badge: 'weekly_third_place' }
                }),
                end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];

        for (const competition of defaultCompetitions) {
            try {
                await this.db.query(
                    `INSERT INTO competitions (competition_id, name, description, type, rules, rewards, end_date)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        competition.competition_id,
                        competition.name,
                        competition.description,
                        competition.type,
                        competition.rules,
                        competition.rewards,
                        competition.end_date
                    ]
                );
            } catch (error) {
                // Competition might already exist
                if (!error.message.includes('UNIQUE constraint failed') && 
                    !error.message.includes('duplicate key')) {
                    console.warn('⚠️ Failed to create default competition:', error.message);
                }
            }
        }
    }

    async joinCompetition(userId, competitionId) {
        try {
            // Check if competition exists and is active
            const competition = await this.db.query(
                'SELECT * FROM competitions WHERE competition_id = ? AND status = ? AND end_date > CURRENT_TIMESTAMP',
                [competitionId, 'active']
            );

            if (competition.rows.length === 0) {
                return { success: false, error: 'Competition not found or expired' };
            }

            // Check if user is already participating
            const existing = await this.db.query(
                'SELECT * FROM competition_participants WHERE competition_id = ? AND user_id = ?',
                [competition.rows[0].id, userId]
            );

            if (existing.rows.length > 0) {
                return { success: false, error: 'Already participating in this competition' };
            }

            // Join competition
            await this.db.query(
                'INSERT INTO competition_participants (competition_id, user_id) VALUES (?, ?)',
                [competition.rows[0].id, userId]
            );

            this.trackSocialEvent('competition_joined', { competitionId });

            return { success: true, competition: competition.rows[0] };
        } catch (error) {
            console.error('❌ Failed to join competition:', error);
            return { success: false, error: 'Failed to join competition' };
        }
    }

    async submitCompetitionScore(userId, competitionId, score, gameStats) {
        try {
            // Get competition details
            const competition = await this.db.query(
                'SELECT * FROM competitions WHERE competition_id = ?',
                [competitionId]
            );

            if (competition.rows.length === 0) {
                return { success: false, error: 'Competition not found' };
            }

            const comp = competition.rows[0];
            const rules = JSON.parse(comp.rules);

            // Validate score against competition rules
            if (!this.validateCompetitionScore(score, gameStats, rules)) {
                return { success: false, error: 'Score does not meet competition requirements' };
            }

            // Update participant's best score
            await this.db.query(`
                UPDATE competition_participants 
                SET best_score = GREATEST(best_score, ?), 
                    attempts = attempts + 1, 
                    last_attempt = CURRENT_TIMESTAMP
                WHERE competition_id = ? AND user_id = ?
            `, [score, comp.id, userId]);

            this.trackSocialEvent('competition_score_submitted', { 
                competitionId, 
                score,
                type: comp.type 
            });

            return { success: true };
        } catch (error) {
            console.error('❌ Failed to submit competition score:', error);
            return { success: false, error: 'Failed to submit score' };
        }
    }

    async getCompetitionLeaderboard(competitionId, limit = 20) {
        try {
            const leaderboard = await this.db.query(`
                SELECT cp.best_score, cp.attempts, cp.last_attempt,
                       u.username, u.id as user_id
                FROM competition_participants cp
                JOIN competitions c ON cp.competition_id = c.id
                JOIN users u ON cp.user_id = u.id
                WHERE c.competition_id = ?
                ORDER BY cp.best_score DESC
                LIMIT ?
            `, [competitionId, limit]);

            return leaderboard.rows.map((row, index) => ({
                rank: index + 1,
                ...row
            }));
        } catch (error) {
            console.error('❌ Failed to get competition leaderboard:', error);
            return [];
        }
    }

    // Challenge System
    async createChallenge(challengerId, challengedUsername, challengeType, targetScore) {
        try {
            // Find challenged user
            const challengedUser = await this.db.query(
                'SELECT id FROM users WHERE username = ?',
                [challengedUsername]
            );

            if (challengedUser.rows.length === 0) {
                return { success: false, error: 'User not found' };
            }

            const challengedId = challengedUser.rows[0].id;
            const challengeId = `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days

            // Create challenge
            await this.db.query(`
                INSERT INTO social_challenges 
                (challenge_id, challenger_id, challenged_id, challenge_type, target_score, expires_at)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [challengeId, challengerId, challengedId, challengeType, targetScore, expiresAt.toISOString()]);

            // Send notification
            await this.sendNotification(challengedId, 'challenge_received', 'New Challenge!', 
                `${await this.getUsernameById(challengerId)} challenges you to beat their score of ${targetScore}!`, {
                    challengeId,
                    challengerId,
                    challengerUsername: await this.getUsernameById(challengerId),
                    targetScore,
                    challengeType
                });

            this.trackSocialEvent('challenge_created', { challengeType, targetScore });

            return { success: true, challengeId };
        } catch (error) {
            console.error('❌ Failed to create challenge:', error);
            return { success: false, error: 'Failed to create challenge' };
        }
    }

    async acceptChallenge(userId, challengeId) {
        try {
            const result = await this.db.query(
                'UPDATE social_challenges SET status = ? WHERE challenge_id = ? AND challenged_id = ? AND status = ?',
                ['accepted', challengeId, userId, 'active']
            );

            if (result.rowCount === 0) {
                return { success: false, error: 'Challenge not found or already completed' };
            }

            // Get challenge details
            const challenge = await this.db.query(
                'SELECT * FROM social_challenges WHERE challenge_id = ?',
                [challengeId]
            );

            // Notify challenger
            await this.sendNotification(challenge.rows[0].challenger_id, 'challenge_accepted', 
                'Challenge Accepted!', 
                `${await this.getUsernameById(userId)} accepted your challenge!`, {
                    challengeId,
                    challengedId: userId,
                    challengedUsername: await this.getUsernameById(userId)
                });

            this.trackSocialEvent('challenge_accepted', { challengeId });

            return { success: true };
        } catch (error) {
            console.error('❌ Failed to accept challenge:', error);
            return { success: false, error: 'Failed to accept challenge' };
        }
    }

    // Notification System
    async sendNotification(userId, type, title, message, data = {}) {
        try {
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

            await this.db.query(`
                INSERT INTO social_notifications (user_id, type, title, message, data, expires_at)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [userId, type, title, message, JSON.stringify(data), expiresAt.toISOString()]);

            // Add to real-time notification queue
            this.notificationQueue.push({
                userId,
                type,
                title,
                message,
                data,
                timestamp: Date.now()
            });

        } catch (error) {
            console.error('❌ Failed to send notification:', error);
        }
    }

    async getNotifications(userId, unreadOnly = false) {
        try {
            let query = `
                SELECT * FROM social_notifications 
                WHERE user_id = ? AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
            `;
            
            if (unreadOnly) {
                query += ' AND read_status = FALSE';
            }
            
            query += ' ORDER BY created_at DESC LIMIT 50';

            const notifications = await this.db.query(query, [userId]);
            return notifications.rows;
        } catch (error) {
            console.error('❌ Failed to get notifications:', error);
            return [];
        }
    }

    async markNotificationAsRead(userId, notificationId) {
        try {
            await this.db.query(
                'UPDATE social_notifications SET read_status = TRUE WHERE id = ? AND user_id = ?',
                [notificationId, userId]
            );
            return { success: true };
        } catch (error) {
            console.error('❌ Failed to mark notification as read:', error);
            return { success: false };
        }
    }

    // Social Sharing
    async shareScore(userId, score, platform, gameStats) {
        try {
            const shareData = {
                score,
                gameStats,
                timestamp: Date.now()
            };

            await this.db.query(
                'INSERT INTO social_shares (user_id, share_type, content, platform) VALUES (?, ?, ?, ?)',
                [userId, 'score', JSON.stringify(shareData), platform]
            );

            this.trackSocialEvent('score_shared', { score, platform });

            return { success: true };
        } catch (error) {
            console.error('❌ Failed to share score:', error);
            return { success: false };
        }
    }

    // Event Handlers
    async onGameEnded(gameData) {
        if (!this.currentUser) return;

        const userId = this.currentUser.id;
        const score = gameData.score;

        // Check for active challenges
        await this.checkChallengeCompletion(userId, score, gameData.stats);

        // Update competition scores
        await this.updateCompetitionScores(userId, score, gameData.stats);

        // Check for social achievements
        await this.checkSocialAchievements(userId, gameData);
    }

    async onAchievementUnlocked(achievementData) {
        if (!this.currentUser) return;

        // Notify friends about achievement
        const friends = await this.getFriends(this.currentUser.id);
        for (const friend of friends) {
            await this.sendNotification(
                friend.id,
                'friend_achievement',
                'Friend Achievement!',
                `${this.currentUser.username} unlocked: ${achievementData.name}`,
                { achievementData, friendId: this.currentUser.id }
            );
        }
    }

    async onHighScore(scoreData) {
        if (!this.currentUser) return;

        // Create automatic challenge opportunity
        const friends = await this.getFriends(this.currentUser.id);
        for (const friend of friends.slice(0, 5)) { // Top 5 friends
            if (friend.best_score < scoreData.score) {
                await this.sendNotification(
                    friend.id,
                    'score_challenge',
                    'Beat This Score!',
                    `${this.currentUser.username} scored ${scoreData.score}. Think you can beat it?`,
                    { 
                        challengerScore: scoreData.score,
                        challengerId: this.currentUser.id,
                        autoChallenge: true
                    }
                );
            }
        }
    }

    // Helper Methods
    async getUsernameById(userId) {
        try {
            const result = await this.db.query('SELECT username FROM users WHERE id = ?', [userId]);
            return result.rows[0]?.username || 'Unknown';
        } catch (error) {
            return 'Unknown';
        }
    }

    validateCompetitionScore(score, gameStats, rules) {
        if (rules.objective === 'highest_score') {
            return score > 0;
        } else if (rules.objective === 'collect_coffee_beans') {
            return gameStats?.collectiblesGathered >= rules.target;
        } else if (rules.objective === 'survival_time') {
            return gameStats?.playtime >= rules.target;
        }
        return true;
    }

    async checkChallengeCompletion(userId, score, gameStats) {
        try {
            const activeChallenges = await this.db.query(`
                SELECT * FROM social_challenges 
                WHERE challenged_id = ? AND status = 'accepted' AND expires_at > CURRENT_TIMESTAMP
            `, [userId]);

            for (const challenge of activeChallenges.rows) {
                if (score > challenge.target_score) {
                    // Challenge completed successfully
                    await this.db.query(
                        'UPDATE social_challenges SET status = ?, completed_at = CURRENT_TIMESTAMP, winner_id = ? WHERE id = ?',
                        ['completed', userId, challenge.id]
                    );

                    // Notify challenger
                    await this.sendNotification(
                        challenge.challenger_id,
                        'challenge_completed',
                        'Challenge Completed!',
                        `${await this.getUsernameById(userId)} beat your challenge with a score of ${score}!`,
                        { challengeId: challenge.challenge_id, winnerScore: score }
                    );
                }
            }
        } catch (error) {
            console.error('❌ Failed to check challenge completion:', error);
        }
    }

    async updateCompetitionScores(userId, score, gameStats) {
        try {
            // Get active competitions user is participating in
            const participations = await this.db.query(`
                SELECT cp.*, c.competition_id, c.rules 
                FROM competition_participants cp
                JOIN competitions c ON cp.competition_id = c.id
                WHERE cp.user_id = ? AND c.status = 'active' AND c.end_date > CURRENT_TIMESTAMP
            `, [userId]);

            for (const participation of participations.rows) {
                await this.submitCompetitionScore(
                    userId, 
                    participation.competition_id, 
                    score, 
                    gameStats
                );
            }
        } catch (error) {
            console.error('❌ Failed to update competition scores:', error);
        }
    }

    startCompetitionManagement() {
        // Check for expired competitions every hour
        setInterval(() => {
            this.processExpiredCompetitions();
        }, 60 * 60 * 1000);
    }

    async processExpiredCompetitions() {
        try {
            const expiredCompetitions = await this.db.query(
                'SELECT * FROM competitions WHERE status = ? AND end_date <= CURRENT_TIMESTAMP',
                ['active']
            );

            for (const competition of expiredCompetitions.rows) {
                await this.finalizeCompetition(competition);
            }
        } catch (error) {
            console.error('❌ Failed to process expired competitions:', error);
        }
    }

    async finalizeCompetition(competition) {
        try {
            // Mark competition as completed
            await this.db.query(
                'UPDATE competitions SET status = ? WHERE id = ?',
                ['completed', competition.id]
            );

            // Get winners
            const winners = await this.getCompetitionLeaderboard(competition.competition_id, 3);
            const rewards = JSON.parse(competition.rewards);

            // Distribute rewards
            for (let i = 0; i < winners.length && i < 3; i++) {
                const winner = winners[i];
                const rewardKey = ['first', 'second', 'third'][i];
                const reward = rewards[rewardKey];

                if (reward) {
                    await this.sendNotification(
                        winner.user_id,
                        'competition_reward',
                        'Competition Reward!',
                        `Congratulations! You placed ${this.getOrdinal(i + 1)} in ${competition.name}`,
                        { reward, rank: i + 1, competitionName: competition.name }
                    );
                }
            }

            this.trackSocialEvent('competition_completed', {
                competitionId: competition.competition_id,
                participantCount: winners.length,
                type: competition.type
            });
        } catch (error) {
            console.error('❌ Failed to finalize competition:', error);
        }
    }

    processNotificationQueue() {
        if (this.notificationQueue.length === 0) return;

        // Process notifications for current user
        if (this.currentUser) {
            const userNotifications = this.notificationQueue.filter(
                notif => notif.userId === this.currentUser.id
            );

            userNotifications.forEach(notification => {
                this.showInGameNotification(notification);
            });

            // Remove processed notifications
            this.notificationQueue = this.notificationQueue.filter(
                notif => notif.userId !== this.currentUser.id
            );
        }

        // Clean up old notifications
        const now = Date.now();
        this.notificationQueue = this.notificationQueue.filter(
            notif => now - notif.timestamp < 60000 // Keep for 1 minute
        );
    }

    showInGameNotification(notification) {
        if (this.scene.uiManager) {
            this.scene.uiManager.showNotification(
                notification.title,
                notification.message,
                this.getNotificationColor(notification.type)
            );
        }
    }

    getNotificationColor(type) {
        const colors = {
            friend_request: 0x4CAF50,
            friend_accepted: 0x4CAF50,
            challenge_received: 0xFF9800,
            challenge_accepted: 0xFF9800,
            challenge_completed: 0xFFD700,
            competition_reward: 0xFFD700,
            friend_achievement: 0x2196F3,
            score_challenge: 0xF44336
        };
        return colors[type] || 0xFFFFFF;
    }

    async cleanupNotifications() {
        try {
            await this.db.query(
                'DELETE FROM social_notifications WHERE expires_at <= CURRENT_TIMESTAMP'
            );
        } catch (error) {
            console.error('❌ Failed to cleanup notifications:', error);
        }
    }

    getOrdinal(n) {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    }

    getWeekNumber() {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        return Math.ceil((((now - start) / 86400000) + start.getDay() + 1) / 7);
    }

    trackSocialEvent(eventType, data) {
        if (this.analytics) {
            this.analytics.trackEvent(`social_${eventType}`, data);
        }
    }

    // Public API
    setCurrentUser(user) {
        this.currentUser = user;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isFeatureEnabled(feature) {
        return this.socialFeatures[feature] === true;
    }

    async getSocialStats(userId) {
        try {
            const [friends, competitions, challenges] = await Promise.all([
                this.db.query('SELECT COUNT(*) as count FROM friendships WHERE user_id = ? AND status = ?', [userId, 'accepted']),
                this.db.query('SELECT COUNT(*) as count FROM competition_participants WHERE user_id = ?', [userId]),
                this.db.query('SELECT COUNT(*) as count FROM social_challenges WHERE (challenger_id = ? OR challenged_id = ?) AND status = ?', [userId, userId, 'completed'])
            ]);

            return {
                friendsCount: friends.rows[0].count,
                competitionsJoined: competitions.rows[0].count,
                challengesCompleted: challenges.rows[0].count
            };
        } catch (error) {
            console.error('❌ Failed to get social stats:', error);
            return { friendsCount: 0, competitionsJoined: 0, challengesCompleted: 0 };
        }
    }

    // Cleanup
    cleanup() {
        // Clear intervals and event listeners
        this.scene.events.removeAllListeners();
        this.notifications = [];
        this.notificationQueue = [];
        this.friends.clear();
        this.activeCompetitions.clear();
        
        console.log('👥 SocialSystem: Cleanup completed');
    }
}
