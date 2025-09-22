// ContentManager - Dynamic content and seasonal events system
// Manages live events, seasonal content, and dynamic game configuration

export default class ContentManager {
    constructor(scene, databaseManager, analyticsSystem) {
        this.scene = scene;
        this.db = databaseManager;
        this.analytics = analyticsSystem;
        
        // Content types
        this.contentTypes = {
            seasonal_event: 'Seasonal Event',
            daily_special: 'Daily Special',
            weekend_bonus: 'Weekend Bonus',
            holiday_theme: 'Holiday Theme',
            limited_time_offer: 'Limited Time Offer',
            community_event: 'Community Event'
        };
        
        // Active content
        this.activeContent = new Map();
        this.scheduledContent = new Map();
        this.contentCache = new Map();
        
        // Content refresh intervals
        this.refreshInterval = 5 * 60 * 1000; // 5 minutes
        this.cacheTimeout = 15 * 60 * 1000; // 15 minutes
        
        // Seasonal themes
        this.seasonalThemes = {
            spring: {
                name: 'Spring Awakening',
                colors: { primary: '#4CAF50', secondary: '#8BC34A', accent: '#CDDC39' },
                collectibles: ['🌸', '🌿', '🦋', '🌱'],
                music: 'spring_theme.mp3',
                effects: ['flower_petals', 'gentle_breeze']
            },
            summer: {
                name: 'Summer Heat',
                colors: { primary: '#FF9800', secondary: '#FFC107', accent: '#FFEB3B' },
                collectibles: ['☀️', '🏖️', '🌊', '🍉'],
                music: 'summer_theme.mp3',
                effects: ['sun_rays', 'heat_shimmer']
            },
            autumn: {
                name: 'Autumn Harvest',
                colors: { primary: '#FF5722', secondary: '#FF7043', accent: '#FFAB91' },
                collectibles: ['🍂', '🍁', '🎃', '🌰'],
                music: 'autumn_theme.mp3',
                effects: ['falling_leaves', 'golden_light']
            },
            winter: {
                name: 'Winter Wonderland',
                colors: { primary: '#2196F3', secondary: '#03A9F4', accent: '#81D4FA' },
                collectibles: ['❄️', '⛄', '🎿', '🔥'],
                music: 'winter_theme.mp3',
                effects: ['snowfall', 'frost_sparkle']
            }
        };
        
        this.initializeContentManager();
    }

    async initializeContentManager() {
        console.log('🎯 ContentManager: Initializing dynamic content system');
        
        try {
            await this.createContentTables();
            await this.loadActiveContent();
            await this.initializeDefaultContent();
            this.startContentManagement();
            this.setupEventListeners();
            
            console.log('✅ Content management system initialized');
        } catch (error) {
            console.error('❌ Failed to initialize content manager:', error);
        }
    }

    async createContentTables() {
        const isPostgres = this.db.isPostgreSQL();
        const autoIncrement = isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
        const timestamp = isPostgres ? 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' : 'DATETIME DEFAULT CURRENT_TIMESTAMP';
        const jsonType = isPostgres ? 'JSONB' : 'TEXT';

        const tables = {
            content_events: `
                CREATE TABLE IF NOT EXISTS content_events (
                    id ${autoIncrement},
                    event_id VARCHAR(100) NOT NULL UNIQUE,
                    name VARCHAR(200) NOT NULL,
                    description TEXT,
                    type VARCHAR(50) NOT NULL,
                    status VARCHAR(20) DEFAULT 'scheduled',
                    priority INTEGER DEFAULT 1,
                    start_date ${timestamp},
                    end_date ${timestamp},
                    configuration ${jsonType} DEFAULT '{}',
                    rewards ${jsonType} DEFAULT '{}',
                    conditions ${jsonType} DEFAULT '{}',
                    created_at ${timestamp},
                    updated_at ${timestamp}
                )
            `,
            
            seasonal_content: `
                CREATE TABLE IF NOT EXISTS seasonal_content (
                    id ${autoIncrement},
                    season VARCHAR(20) NOT NULL,
                    content_type VARCHAR(50) NOT NULL,
                    name VARCHAR(200) NOT NULL,
                    configuration ${jsonType} NOT NULL,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at ${timestamp}
                )
            `,
            
            dynamic_config: `
                CREATE TABLE IF NOT EXISTS dynamic_config (
                    id ${autoIncrement},
                    config_key VARCHAR(100) NOT NULL UNIQUE,
                    config_value ${jsonType} NOT NULL,
                    description TEXT,
                    category VARCHAR(50) DEFAULT 'general',
                    is_active BOOLEAN DEFAULT TRUE,
                    updated_at ${timestamp}
                )
            `,
            
            content_participation: `
                CREATE TABLE IF NOT EXISTS content_participation (
                    id ${autoIncrement},
                    user_id INTEGER NOT NULL,
                    event_id VARCHAR(100) NOT NULL,
                    participation_data ${jsonType} DEFAULT '{}',
                    rewards_claimed ${jsonType} DEFAULT '{}',
                    participated_at ${timestamp},
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                )
            `
        };

        for (const [tableName, definition] of Object.entries(tables)) {
            try {
                await this.db.query(definition);
                console.log(`✅ Content table '${tableName}' created/verified`);
            } catch (error) {
                if (!error.message.includes('already exists')) {
                    console.error(`❌ Failed to create content table '${tableName}':`, error);
                }
            }
        }

        // Create indexes
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_content_events_type ON content_events(type)',
            'CREATE INDEX IF NOT EXISTS idx_content_events_status ON content_events(status)',
            'CREATE INDEX IF NOT EXISTS idx_content_events_dates ON content_events(start_date, end_date)',
            'CREATE INDEX IF NOT EXISTS idx_seasonal_content_season ON seasonal_content(season)',
            'CREATE INDEX IF NOT EXISTS idx_dynamic_config_key ON dynamic_config(config_key)',
            'CREATE INDEX IF NOT EXISTS idx_content_participation_user ON content_participation(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_content_participation_event ON content_participation(event_id)'
        ];

        for (const indexQuery of indexes) {
            try {
                await this.db.query(indexQuery);
            } catch (error) {
                if (!error.message.includes('already exists')) {
                    console.warn('⚠️ Content index creation warning:', error.message);
                }
            }
        }
    }

    async initializeDefaultContent() {
        // Initialize seasonal events
        await this.createSeasonalEvents();
        
        // Initialize dynamic configuration
        await this.createDefaultConfiguration();
        
        // Initialize current seasonal theme
        await this.activateSeasonalTheme();
    }

    async createSeasonalEvents() {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth(); // 0-11
        
        // Define seasonal events
        const seasonalEvents = [
            {
                event_id: 'spring_festival_2025',
                name: 'Spring Coffee Festival',
                description: 'Celebrate spring with special coffee collectibles and bonuses!',
                type: 'seasonal_event',
                start_date: new Date(2025, 2, 20), // March 20
                end_date: new Date(2025, 5, 20),   // June 20
                configuration: JSON.stringify({
                    theme: 'spring',
                    bonusMultiplier: 1.5,
                    specialCollectibles: ['🌸', '🌿', '🦋'],
                    backgroundMusic: 'spring_theme.mp3'
                }),
                rewards: JSON.stringify({
                    dailyBonus: 50,
                    completionReward: 500,
                    specialBadge: 'spring_champion'
                })
            },
            {
                event_id: 'summer_heat_wave_2025',
                name: 'Summer Heat Wave',
                description: 'Beat the heat with iced coffee specials and cooling power-ups!',
                type: 'seasonal_event',
                start_date: new Date(2025, 5, 21), // June 21
                end_date: new Date(2025, 8, 22),   // September 22
                configuration: JSON.stringify({
                    theme: 'summer',
                    bonusMultiplier: 2.0,
                    specialCollectibles: ['🧊', '🥤', '☀️'],
                    specialPowerUps: ['ice_shield', 'cooling_breeze']
                })
            },
            {
                event_id: 'autumn_harvest_2025',
                name: 'Autumn Harvest Festival',
                description: 'Gather autumn flavors and seasonal spices!',
                type: 'seasonal_event',
                start_date: new Date(2025, 8, 23),  // September 23
                end_date: new Date(2025, 11, 20),   // December 20
                configuration: JSON.stringify({
                    theme: 'autumn',
                    bonusMultiplier: 1.8,
                    specialCollectibles: ['🍂', '🎃', '🌰'],
                    specialFlavors: ['pumpkin_spice', 'cinnamon', 'maple']
                })
            },
            {
                event_id: 'winter_wonderland_2025',
                name: 'Winter Wonderland',
                description: 'Warm up with hot coffee and winter magic!',
                type: 'seasonal_event',
                start_date: new Date(2025, 11, 21), // December 21
                end_date: new Date(2026, 2, 19),    // March 19
                configuration: JSON.stringify({
                    theme: 'winter',
                    bonusMultiplier: 2.5,
                    specialCollectibles: ['❄️', '⛄', '🔥'],
                    specialEffects: ['snowfall', 'warm_glow']
                })
            }
        ];

        // Weekly events
        const weeklyEvents = [
            {
                event_id: 'monday_motivation',
                name: 'Monday Motivation',
                description: 'Start your week with extra energy!',
                type: 'weekly_special',
                configuration: JSON.stringify({
                    dayOfWeek: 1, // Monday
                    bonusMultiplier: 1.2,
                    specialMessage: 'Monday Motivation Active!'
                })
            },
            {
                event_id: 'weekend_warrior',
                name: 'Weekend Warrior',
                description: 'Weekend double points!',
                type: 'weekend_bonus',
                configuration: JSON.stringify({
                    daysOfWeek: [6, 0], // Saturday, Sunday
                    bonusMultiplier: 2.0,
                    specialEffects: ['celebration_particles']
                })
            }
        ];

        // Insert events
        for (const event of [...seasonalEvents, ...weeklyEvents]) {
            try {
                await this.db.query(`
                    INSERT INTO content_events 
                    (event_id, name, description, type, start_date, end_date, configuration, rewards)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    event.event_id,
                    event.name,
                    event.description,
                    event.type,
                    event.start_date?.toISOString(),
                    event.end_date?.toISOString(),
                    event.configuration,
                    event.rewards || '{}'
                ]);
            } catch (error) {
                // Event might already exist
                if (!error.message.includes('UNIQUE constraint failed') && 
                    !error.message.includes('duplicate key')) {
                    console.warn('⚠️ Failed to create event:', event.event_id, error.message);
                }
            }
        }
    }

    async createDefaultConfiguration() {
        const defaultConfigs = [
            {
                config_key: 'game_balance',
                config_value: JSON.stringify({
                    scoreMultiplier: 1.0,
                    difficultyScale: 1.0,
                    powerUpSpawnRate: 0.1,
                    collectibleSpawnRate: 0.8
                }),
                description: 'Core game balance parameters',
                category: 'gameplay'
            },
            {
                config_key: 'ui_settings',
                config_value: JSON.stringify({
                    showFPS: false,
                    enableParticles: true,
                    animationSpeed: 1.0,
                    soundVolume: 0.7
                }),
                description: 'User interface configuration',
                category: 'ui'
            },
            {
                config_key: 'feature_flags',
                config_value: JSON.stringify({
                    enableSocialFeatures: true,
                    enableSeasonalEvents: true,
                    enableDynamicContent: true,
                    enableAnalytics: true
                }),
                description: 'Feature toggle flags',
                category: 'features'
            },
            {
                config_key: 'performance_settings',
                config_value: JSON.stringify({
                    targetFPS: 60,
                    maxParticles: 100,
                    enableOptimizations: true,
                    qualityLevel: 'high'
                }),
                description: 'Performance optimization settings',
                category: 'performance'
            }
        ];

        for (const config of defaultConfigs) {
            try {
                await this.db.query(`
                    INSERT INTO dynamic_config (config_key, config_value, description, category)
                    VALUES (?, ?, ?, ?)
                `, [
                    config.config_key,
                    config.config_value,
                    config.description,
                    config.category
                ]);
            } catch (error) {
                // Config might already exist
                if (!error.message.includes('UNIQUE constraint failed') && 
                    !error.message.includes('duplicate key')) {
                    console.warn('⚠️ Failed to create config:', config.config_key);
                }
            }
        }
    }

    async loadActiveContent() {
        try {
            // Load active events
            const activeEvents = await this.db.query(`
                SELECT * FROM content_events 
                WHERE status = 'active' 
                AND (start_date IS NULL OR start_date <= CURRENT_TIMESTAMP)
                AND (end_date IS NULL OR end_date > CURRENT_TIMESTAMP)
            `);

            for (const event of activeEvents.rows) {
                this.activeContent.set(event.event_id, {
                    ...event,
                    configuration: JSON.parse(event.configuration),
                    rewards: JSON.parse(event.rewards || '{}')
                });
            }

            // Load scheduled events
            const scheduledEvents = await this.db.query(`
                SELECT * FROM content_events 
                WHERE status = 'scheduled' 
                AND start_date > CURRENT_TIMESTAMP
            `);

            for (const event of scheduledEvents.rows) {
                this.scheduledContent.set(event.event_id, {
                    ...event,
                    configuration: JSON.parse(event.configuration),
                    rewards: JSON.parse(event.rewards || '{}')
                });
            }

            console.log(`📅 Loaded ${activeEvents.rows.length} active events and ${scheduledEvents.rows.length} scheduled events`);
        } catch (error) {
            console.error('❌ Failed to load active content:', error);
        }
    }

    async activateSeasonalTheme() {
        const currentSeason = this.getCurrentSeason();
        const theme = this.seasonalThemes[currentSeason];
        
        if (theme) {
            console.log(`🌟 Activating seasonal theme: ${theme.name}`);
            
            // Apply theme to game
            this.applyTheme(theme);
            
            // Track seasonal activation
            if (this.analytics) {
                this.analytics.trackEvent('seasonal_theme_activated', {
                    season: currentSeason,
                    theme: theme.name
                });
            }
        }
    }

    startContentManagement() {
        // Check for content updates every 5 minutes
        setInterval(() => {
            this.checkContentUpdates();
        }, this.refreshInterval);

        // Check for scheduled content activation every minute
        setInterval(() => {
            this.checkScheduledContent();
        }, 60 * 1000);

        // Daily content refresh at midnight
        this.scheduleDaily(() => {
            this.refreshDailyContent();
        });

        console.log('🔄 Content management system started');
    }

    async checkContentUpdates() {
        try {
            // Check for expired content
            const expiredEvents = Array.from(this.activeContent.values()).filter(event => {
                return event.end_date && new Date(event.end_date) <= new Date();
            });

            for (const event of expiredEvents) {
                await this.deactivateContent(event.event_id);
            }

            // Refresh cache periodically
            if (Date.now() - this.lastCacheRefresh > this.cacheTimeout) {
                await this.refreshContentCache();
            }
        } catch (error) {
            console.error('❌ Failed to check content updates:', error);
        }
    }

    async checkScheduledContent() {
        try {
            const now = new Date();
            
            for (const [eventId, event] of this.scheduledContent.entries()) {
                if (new Date(event.start_date) <= now) {
                    await this.activateContent(eventId);
                    this.scheduledContent.delete(eventId);
                }
            }
        } catch (error) {
            console.error('❌ Failed to check scheduled content:', error);
        }
    }

    async activateContent(eventId) {
        try {
            // Update database
            await this.db.query(
                'UPDATE content_events SET status = ? WHERE event_id = ?',
                ['active', eventId]
            );

            // Load and cache the event
            const eventData = await this.db.query(
                'SELECT * FROM content_events WHERE event_id = ?',
                [eventId]
            );

            if (eventData.rows.length > 0) {
                const event = eventData.rows[0];
                this.activeContent.set(eventId, {
                    ...event,
                    configuration: JSON.parse(event.configuration),
                    rewards: JSON.parse(event.rewards || '{}')
                });

                // Apply event effects
                await this.applyEventEffects(event);

                // Notify players
                this.notifyEventActivation(event);

                console.log(`🎉 Activated content event: ${event.name}`);
            }
        } catch (error) {
            console.error('❌ Failed to activate content:', error);
        }
    }

    async deactivateContent(eventId) {
        try {
            const event = this.activeContent.get(eventId);
            if (!event) return;

            // Update database
            await this.db.query(
                'UPDATE content_events SET status = ? WHERE event_id = ?',
                ['completed', eventId]
            );

            // Remove from active content
            this.activeContent.delete(eventId);

            // Remove event effects
            await this.removeEventEffects(event);

            // Notify players
            this.notifyEventDeactivation(event);

            console.log(`📅 Deactivated content event: ${event.name}`);
        } catch (error) {
            console.error('❌ Failed to deactivate content:', error);
        }
    }

    async applyEventEffects(event) {
        const config = typeof event.configuration === 'string' 
            ? JSON.parse(event.configuration) 
            : event.configuration;

        // Apply theme changes
        if (config.theme) {
            const theme = this.seasonalThemes[config.theme];
            if (theme) {
                this.applyTheme(theme);
            }
        }

        // Apply gameplay modifiers
        if (config.bonusMultiplier) {
            this.scene.events.emit('bonusMultiplierChanged', config.bonusMultiplier);
        }

        // Apply special collectibles
        if (config.specialCollectibles) {
            this.scene.events.emit('specialCollectiblesActivated', config.specialCollectibles);
        }

        // Apply special effects
        if (config.specialEffects) {
            this.scene.events.emit('specialEffectsActivated', config.specialEffects);
        }
    }

    async removeEventEffects(event) {
        const config = typeof event.configuration === 'string' 
            ? JSON.parse(event.configuration) 
            : event.configuration;

        // Reset modifiers
        if (config.bonusMultiplier) {
            this.scene.events.emit('bonusMultiplierChanged', 1.0);
        }

        // Remove special collectibles
        if (config.specialCollectibles) {
            this.scene.events.emit('specialCollectiblesDeactivated');
        }

        // Remove special effects
        if (config.specialEffects) {
            this.scene.events.emit('specialEffectsDeactivated', config.specialEffects);
        }
    }

    applyTheme(theme) {
        // Apply visual theme
        this.scene.events.emit('themeChanged', {
            name: theme.name,
            colors: theme.colors,
            effects: theme.effects
        });

        // Update UI colors
        if (this.scene.uiManager) {
            this.scene.uiManager.applyTheme(theme);
        }

        // Apply background music
        if (theme.music && this.scene.soundManager) {
            this.scene.soundManager.playBackgroundMusic(theme.music);
        }
    }

    notifyEventActivation(event) {
        if (this.scene.uiManager) {
            this.scene.uiManager.showNotification(
                '🎉 New Event!',
                event.name,
                0xFFD700
            );
        }

        // Track event activation
        if (this.analytics) {
            this.analytics.trackEvent('content_event_activated', {
                eventId: event.event_id,
                eventName: event.name,
                eventType: event.type
            });
        }
    }

    notifyEventDeactivation(event) {
        if (this.scene.uiManager) {
            this.scene.uiManager.showNotification(
                '📅 Event Ended',
                `${event.name} has concluded`,
                0xFF9800
            );
        }
    }

    async refreshDailyContent() {
        console.log('🌅 Refreshing daily content');

        // Create new daily challenges
        await this.createDailyChallenge();

        // Update seasonal content if needed
        await this.checkSeasonalTransition();

        // Refresh leaderboards
        this.scene.events.emit('dailyContentRefresh');
    }

    async createDailyChallenge() {
        const today = new Date().toISOString().split('T')[0];
        const challenges = [
            {
                name: 'Coffee Collector',
                description: 'Collect 30 coffee beans in a single game',
                target: 30,
                type: 'collect_coffee',
                reward: 100
            },
            {
                name: 'Distance Runner',
                description: 'Travel 2000 units in a single game',
                target: 2000,
                type: 'travel_distance',
                reward: 150
            },
            {
                name: 'Combo Master',
                description: 'Achieve a 15x combo',
                target: 15,
                type: 'achieve_combo',
                reward: 200
            }
        ];

        const todaysChallenge = challenges[Math.floor(Math.random() * challenges.length)];
        const eventId = `daily_challenge_${today}`;

        try {
            await this.db.query(`
                INSERT INTO content_events 
                (event_id, name, description, type, status, start_date, end_date, configuration, rewards)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                eventId,
                todaysChallenge.name,
                todaysChallenge.description,
                'daily_challenge',
                'active',
                new Date().toISOString(),
                new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                JSON.stringify({
                    challengeType: todaysChallenge.type,
                    target: todaysChallenge.target
                }),
                JSON.stringify({
                    points: todaysChallenge.reward,
                    badge: 'daily_challenger'
                })
            ]);

            await this.activateContent(eventId);
        } catch (error) {
            // Challenge might already exist for today
            if (!error.message.includes('UNIQUE constraint failed')) {
                console.error('❌ Failed to create daily challenge:', error);
            }
        }
    }

    async checkSeasonalTransition() {
        const currentSeason = this.getCurrentSeason();
        const activeSeason = this.getActiveSeason();

        if (currentSeason !== activeSeason) {
            console.log(`🍃 Season transition: ${activeSeason} → ${currentSeason}`);
            await this.activateSeasonalTheme();
        }
    }

    getCurrentSeason() {
        const month = new Date().getMonth(); // 0-11
        if (month >= 2 && month <= 4) return 'spring';   // Mar-May
        if (month >= 5 && month <= 7) return 'summer';   // Jun-Aug
        if (month >= 8 && month <= 10) return 'autumn';  // Sep-Nov
        return 'winter'; // Dec-Feb
    }

    getActiveSeason() {
        // Get currently active seasonal theme
        for (const [eventId, event] of this.activeContent.entries()) {
            if (event.type === 'seasonal_event') {
                const config = typeof event.configuration === 'string' 
                    ? JSON.parse(event.configuration) 
                    : event.configuration;
                if (config.theme) {
                    return config.theme;
                }
            }
        }
        return this.getCurrentSeason();
    }

    async refreshContentCache() {
        try {
            this.contentCache.clear();
            
            // Cache active configuration
            const configs = await this.db.query(
                'SELECT * FROM dynamic_config WHERE is_active = TRUE'
            );

            for (const config of configs.rows) {
                this.contentCache.set(config.config_key, JSON.parse(config.config_value));
            }

            this.lastCacheRefresh = Date.now();
            console.log('🔄 Content cache refreshed');
        } catch (error) {
            console.error('❌ Failed to refresh content cache:', error);
        }
    }

    scheduleDaily(callback) {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const msUntilMidnight = tomorrow.getTime() - now.getTime();
        
        setTimeout(() => {
            callback();
            // Schedule for every 24 hours after that
            setInterval(callback, 24 * 60 * 60 * 1000);
        }, msUntilMidnight);
    }

    setupEventListeners() {
        // Listen for game events to track content engagement
        this.scene.events.on('gameEnded', this.onGameEnded, this);
        this.scene.events.on('collectibleGathered', this.onCollectibleGathered, this);
        this.scene.events.on('achievementUnlocked', this.onAchievementUnlocked, this);
    }

    async onGameEnded(gameData) {
        // Check daily challenge completion
        await this.checkDailyChallengeCompletion(gameData);
        
        // Track content engagement
        this.trackContentEngagement(gameData);
    }

    async checkDailyChallengeCompletion(gameData) {
        const today = new Date().toISOString().split('T')[0];
        const eventId = `daily_challenge_${today}`;
        const event = this.activeContent.get(eventId);

        if (!event || !this.scene.gameStateManager) return;

        const config = event.configuration;
        const userId = this.scene.gameStateManager.getCurrentUser()?.id;
        if (!userId) return;

        let completed = false;

        switch (config.challengeType) {
            case 'collect_coffee':
                completed = (gameData.stats?.collectiblesGathered || 0) >= config.target;
                break;
            case 'travel_distance':
                completed = (gameData.stats?.distanceTraveled || 0) >= config.target;
                break;
            case 'achieve_combo':
                completed = (gameData.stats?.maxCombo || 0) >= config.target;
                break;
        }

        if (completed) {
            await this.awardChallengeReward(userId, eventId, event.rewards);
        }
    }

    async awardChallengeReward(userId, eventId, rewards) {
        try {
            // Record participation
            await this.db.query(`
                INSERT INTO content_participation (user_id, event_id, participation_data, rewards_claimed)
                VALUES (?, ?, ?, ?)
            `, [
                userId,
                eventId,
                JSON.stringify({ completed: true, completedAt: new Date().toISOString() }),
                JSON.stringify(rewards)
            ]);

            // Notify player
            if (this.scene.uiManager) {
                this.scene.uiManager.showNotification(
                    '🏆 Challenge Complete!',
                    `You earned ${rewards.points} points!`,
                    0xFFD700
                );
            }

            // Track completion
            if (this.analytics) {
                this.analytics.trackEvent('daily_challenge_completed', {
                    eventId,
                    rewards,
                    userId
                });
            }
        } catch (error) {
            console.error('❌ Failed to award challenge reward:', error);
        }
    }

    trackContentEngagement(gameData) {
        const activeEvents = Array.from(this.activeContent.keys());
        
        if (this.analytics && activeEvents.length > 0) {
            this.analytics.trackEvent('content_engagement', {
                activeEvents,
                gameScore: gameData.score,
                sessionDuration: gameData.stats?.playtime || 0
            });
        }
    }

    // Public API
    getActiveEvents() {
        return Array.from(this.activeContent.values());
    }

    getScheduledEvents() {
        return Array.from(this.scheduledContent.values());
    }

    getConfig(key, defaultValue = null) {
        return this.contentCache.get(key) || defaultValue;
    }

    async updateConfig(key, value, description = '') {
        try {
            await this.db.query(`
                UPDATE dynamic_config 
                SET config_value = ?, description = ?, updated_at = CURRENT_TIMESTAMP
                WHERE config_key = ?
            `, [JSON.stringify(value), description, key]);

            // Update cache
            this.contentCache.set(key, value);
            
            return true;
        } catch (error) {
            console.error('❌ Failed to update config:', error);
            return false;
        }
    }

    isEventActive(eventId) {
        return this.activeContent.has(eventId);
    }

    getCurrentTheme() {
        const season = this.getCurrentSeason();
        return this.seasonalThemes[season];
    }

    async getContentStats() {
        try {
            const stats = await this.db.query(`
                SELECT 
                    COUNT(*) as total_events,
                    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_events,
                    SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled_events,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_events
                FROM content_events
            `);

            const participation = await this.db.query(`
                SELECT COUNT(*) as total_participations
                FROM content_participation
            `);

            return {
                ...stats.rows[0],
                total_participations: participation.rows[0].total_participations,
                cache_size: this.contentCache.size,
                active_content_count: this.activeContent.size
            };
        } catch (error) {
            console.error('❌ Failed to get content stats:', error);
            return {};
        }
    }

    // Cleanup
    cleanup() {
        this.activeContent.clear();
        this.scheduledContent.clear();
        this.contentCache.clear();
        
        // Remove event listeners
        this.scene.events.removeAllListeners();
        
        console.log('🎯 ContentManager: Cleanup completed');
    }
}
