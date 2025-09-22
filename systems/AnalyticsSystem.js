// AnalyticsSystem - Comprehensive user behavior and performance analytics
// Tracks user engagement, game performance, and business metrics
// Privacy-compliant with GDPR considerations

export default class AnalyticsSystem {
    constructor(scene, databaseManager) {
        this.scene = scene;
        this.db = databaseManager;
        this.sessionId = this.generateSessionId();
        this.userId = null;
        this.isEnabled = this.checkAnalyticsConsent();
        
        // Event tracking
        this.eventQueue = [];
        this.batchSize = 10;
        this.flushInterval = 30000; // 30 seconds
        this.maxQueueSize = 100;
        
        // Performance tracking
        this.performanceMetrics = {
            frameRate: [],
            memoryUsage: [],
            loadTimes: {},
            errorCounts: {},
            featureUsage: new Map()
        };
        
        // User behavior tracking
        this.sessionData = {
            startTime: Date.now(),
            events: [],
            gameplayMetrics: {},
            deviceInfo: this.collectDeviceInfo(),
            userAgent: navigator.userAgent
        };
        
        // Privacy settings
        this.privacySettings = {
            collectPersonalData: false,
            collectDeviceInfo: true,
            collectPerformanceData: true,
            collectGameplayData: true,
            dataRetentionDays: 90
        };
        
        if (this.isEnabled) {
            this.initializeAnalytics();
        }
    }

    initializeAnalytics() {
        console.log('📊 AnalyticsSystem: Initializing user behavior analytics');
        
        this.setupEventListeners();
        this.startPerformanceMonitoring();
        this.startBatchProcessing();
        this.setupErrorTracking();
        this.trackSessionStart();
    }

    checkAnalyticsConsent() {
        // Check for user consent (GDPR compliance)
        const consent = localStorage.getItem('birddash_analytics_consent');
        return consent === 'true' || consent === null; // Default to enabled, but respect opt-out
    }

    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    collectDeviceInfo() {
        if (!this.privacySettings.collectDeviceInfo) return {};
        
        return {
            screenWidth: screen.width,
            screenHeight: screen.height,
            devicePixelRatio: window.devicePixelRatio || 1,
            colorDepth: screen.colorDepth,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            platform: navigator.platform,
            hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
            connectionType: navigator.connection?.effectiveType || 'unknown',
            isMobile: /Mobi|Android/i.test(navigator.userAgent),
            isTablet: /iPad|Tablet/i.test(navigator.userAgent)
        };
    }

    setupEventListeners() {
        // Game events
        this.scene.events.on('gameStarted', this.trackGameStart, this);
        this.scene.events.on('gameEnded', this.trackGameEnd, this);
        this.scene.events.on('gamePaused', this.trackGamePause, this);
        this.scene.events.on('gameResumed', this.trackGameResume, this);
        
        // User interaction events
        this.scene.events.on('collectibleGathered', this.trackCollectibleGathered, this);
        this.scene.events.on('powerUpActivated', this.trackPowerUpUsed, this);
        this.scene.events.on('obstacleHit', this.trackObstacleHit, this);
        this.scene.events.on('levelUp', this.trackLevelUp, this);
        this.scene.events.on('achievementUnlocked', this.trackAchievement, this);
        
        // UI events
        this.scene.events.on('tutorialStarted', this.trackTutorialStart, this);
        this.scene.events.on('tutorialCompleted', this.trackTutorialComplete, this);
        this.scene.events.on('tutorialSkipped', this.trackTutorialSkip, this);
        this.scene.events.on('shareScore', this.trackScoreShare, this);
        
        // Mobile-specific events
        this.scene.events.on('orientationChanged', this.trackOrientationChange, this);
        this.scene.events.on('touchGesture', this.trackTouchGesture, this);
        
        // Performance events
        this.scene.events.on('performanceIssue', this.trackPerformanceIssue, this);
        this.scene.events.on('errorOccurred', this.trackError, this);
    }

    startPerformanceMonitoring() {
        if (!this.privacySettings.collectPerformanceData) return;
        
        // Frame rate monitoring
        let frameCount = 0;
        let lastTime = performance.now();
        
        const monitorFrameRate = () => {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime - lastTime >= 1000) { // Every second
                const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                this.performanceMetrics.frameRate.push({
                    fps,
                    timestamp: currentTime
                });
                
                // Keep only last 60 seconds of data
                if (this.performanceMetrics.frameRate.length > 60) {
                    this.performanceMetrics.frameRate.shift();
                }
                
                // Track performance issues
                if (fps < 30) {
                    this.trackEvent('performance_issue', {
                        type: 'low_fps',
                        fps,
                        severity: fps < 15 ? 'critical' : 'warning'
                    });
                }
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(monitorFrameRate);
        };
        
        requestAnimationFrame(monitorFrameRate);
        
        // Memory usage monitoring (if available)
        if (performance.memory) {
            setInterval(() => {
                const memInfo = {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit,
                    timestamp: performance.now()
                };
                
                this.performanceMetrics.memoryUsage.push(memInfo);
                
                // Keep only last 10 minutes of data
                if (this.performanceMetrics.memoryUsage.length > 600) {
                    this.performanceMetrics.memoryUsage.shift();
                }
                
                // Track memory issues
                const usagePercent = (memInfo.used / memInfo.limit) * 100;
                if (usagePercent > 80) {
                    this.trackEvent('performance_issue', {
                        type: 'high_memory_usage',
                        usagePercent: Math.round(usagePercent),
                        severity: usagePercent > 90 ? 'critical' : 'warning'
                    });
                }
            }, 10000); // Every 10 seconds
        }
    }

    startBatchProcessing() {
        // Batch process events to reduce database load
        setInterval(() => {
            if (this.eventQueue.length > 0) {
                this.flushEvents();
            }
        }, this.flushInterval);
        
        // Flush on page unload
        window.addEventListener('beforeunload', () => {
            this.flushEvents();
            this.trackSessionEnd();
        });
    }

    setupErrorTracking() {
        // Global error handler
        window.addEventListener('error', (event) => {
            this.trackError({
                type: 'javascript_error',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack
            });
        });
        
        // Promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            this.trackError({
                type: 'unhandled_promise_rejection',
                reason: event.reason?.toString(),
                stack: event.reason?.stack
            });
        });
    }

    // Event tracking methods
    trackEvent(eventType, eventData = {}, immediate = false) {
        if (!this.isEnabled) return;
        
        const event = {
            sessionId: this.sessionId,
            userId: this.userId,
            eventType,
            eventData: JSON.stringify(eventData),
            timestamp: new Date().toISOString(),
            userAgent: this.privacySettings.collectPersonalData ? navigator.userAgent : null
        };
        
        if (immediate) {
            this.saveEventToDatabase(event);
        } else {
            this.eventQueue.push(event);
            
            // Flush if queue is full
            if (this.eventQueue.length >= this.maxQueueSize) {
                this.flushEvents();
            }
        }
        
        // Update feature usage
        this.performanceMetrics.featureUsage.set(
            eventType,
            (this.performanceMetrics.featureUsage.get(eventType) || 0) + 1
        );
    }

    async flushEvents() {
        if (this.eventQueue.length === 0) return;
        
        const eventsToFlush = this.eventQueue.splice(0, this.batchSize);
        
        try {
            await this.db.transaction(async (query) => {
                for (const event of eventsToFlush) {
                    await query(
                        `INSERT INTO analytics_events 
                         (user_id, session_id, event_type, event_data, timestamp, user_agent) 
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [
                            event.userId,
                            event.sessionId,
                            event.eventType,
                            event.eventData,
                            event.timestamp,
                            event.userAgent
                        ]
                    );
                }
            });
            
            console.log(`📊 Flushed ${eventsToFlush.length} analytics events`);
        } catch (error) {
            console.error('❌ Failed to flush analytics events:', error);
            // Re-add failed events to queue (with limit)
            this.eventQueue.unshift(...eventsToFlush.slice(0, this.maxQueueSize - this.eventQueue.length));
        }
    }

    async saveEventToDatabase(event) {
        try {
            await this.db.query(
                `INSERT INTO analytics_events 
                 (user_id, session_id, event_type, event_data, timestamp, user_agent) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    event.userId,
                    event.sessionId,
                    event.eventType,
                    event.eventData,
                    event.timestamp,
                    event.userAgent
                ]
            );
        } catch (error) {
            console.error('❌ Failed to save analytics event:', error);
        }
    }

    // Specific event tracking methods
    trackSessionStart() {
        this.trackEvent('session_start', {
            deviceInfo: this.sessionData.deviceInfo,
            referrer: document.referrer,
            url: window.location.href
        });
    }

    trackSessionEnd() {
        const sessionDuration = Date.now() - this.sessionData.startTime;
        this.trackEvent('session_end', {
            duration: sessionDuration,
            eventsCount: this.sessionData.events.length,
            performanceMetrics: this.getPerformanceSummary()
        }, true); // Immediate flush
    }

    trackGameStart(gameState) {
        this.trackEvent('game_start', {
            gameMode: gameState.mode || 'normal',
            userLevel: gameState.level || 1,
            tutorialCompleted: localStorage.getItem('birddash_tutorial_progress') !== null
        });
    }

    trackGameEnd(gameData) {
        this.trackEvent('game_end', {
            finalScore: gameData.score,
            survivalTime: gameData.stats?.playtime || 0,
            collectiblesGathered: gameData.stats?.collectiblesGathered || 0,
            maxCombo: gameData.stats?.maxCombo || 0,
            powerUpsUsed: gameData.stats?.powerUpsUsed || 0,
            distanceTraveled: gameData.stats?.distanceTraveled || 0,
            reason: gameData.reason || 'unknown',
            achievements: gameData.stats?.achievements || []
        });
    }

    trackGamePause() {
        this.trackEvent('game_pause', {
            gameTime: this.scene.gameStateManager?.getGameState()?.playtime || 0
        });
    }

    trackGameResume() {
        this.trackEvent('game_resume', {
            gameTime: this.scene.gameStateManager?.getGameState()?.playtime || 0
        });
    }

    trackCollectibleGathered(collectibleData) {
        this.trackEvent('collectible_gathered', {
            type: collectibleData.type,
            points: collectibleData.points,
            currentScore: this.scene.gameStateManager?.getScore() || 0,
            comboCount: this.scene.gameStateManager?.getCombo() || 0
        });
    }

    trackPowerUpUsed(powerUpData) {
        this.trackEvent('powerup_used', {
            type: powerUpData.type,
            duration: powerUpData.duration,
            currentScore: this.scene.gameStateManager?.getScore() || 0
        });
    }

    trackObstacleHit(obstacleData) {
        this.trackEvent('obstacle_hit', {
            type: obstacleData.type,
            playerPosition: obstacleData.playerPosition,
            gameSpeed: this.scene.gameStateManager?.getGameState()?.gameSpeed || 0,
            shieldActive: this.scene.powerUpSystem?.isPowerUpActive('shield') || false
        });
    }

    trackLevelUp(levelData) {
        this.trackEvent('level_up', {
            newLevel: levelData.newLevel,
            oldLevel: levelData.oldLevel,
            score: this.scene.gameStateManager?.getScore() || 0,
            bonus: levelData.bonus
        });
    }

    trackAchievement(achievementData) {
        this.trackEvent('achievement_unlocked', {
            achievementId: achievementData.id,
            achievementName: achievementData.name,
            category: achievementData.category,
            difficulty: achievementData.difficulty,
            currentScore: this.scene.gameStateManager?.getScore() || 0
        });
    }

    trackTutorialStart() {
        this.trackEvent('tutorial_start', {
            isFirstTime: !localStorage.getItem('birddash_tutorial_progress')
        });
    }

    trackTutorialComplete() {
        this.trackEvent('tutorial_complete', {
            completionTime: Date.now() - this.sessionData.startTime
        });
    }

    trackTutorialSkip() {
        this.trackEvent('tutorial_skip', {
            skipTime: Date.now() - this.sessionData.startTime
        });
    }

    trackScoreShare(shareData) {
        this.trackEvent('score_share', {
            score: shareData.score,
            platform: shareData.platform || 'unknown',
            method: shareData.method || 'unknown'
        });
    }

    trackOrientationChange(orientationData) {
        this.trackEvent('orientation_change', {
            newOrientation: orientationData.orientation,
            screenWidth: orientationData.dimensions.width,
            screenHeight: orientationData.dimensions.height
        });
    }

    trackTouchGesture(gestureData) {
        this.trackEvent('touch_gesture', {
            gestureType: gestureData.type,
            duration: gestureData.duration,
            distance: gestureData.distance,
            force: gestureData.force
        });
    }

    trackPerformanceIssue(issueData) {
        this.trackEvent('performance_issue', issueData);
    }

    trackError(errorData) {
        this.performanceMetrics.errorCounts[errorData.type] = 
            (this.performanceMetrics.errorCounts[errorData.type] || 0) + 1;
        
        this.trackEvent('error_occurred', {
            ...errorData,
            errorCount: this.performanceMetrics.errorCounts[errorData.type]
        }, true); // Immediate flush for errors
    }

    // Analytics reporting methods
    async generateUserReport(userId, days = 7) {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
        
        try {
            const events = await this.db.query(
                `SELECT event_type, event_data, timestamp 
                 FROM analytics_events 
                 WHERE user_id = ? AND timestamp >= ? AND timestamp <= ?
                 ORDER BY timestamp DESC`,
                [userId, startDate.toISOString(), endDate.toISOString()]
            );
            
            const sessions = await this.db.query(
                `SELECT * FROM game_sessions 
                 WHERE user_id = ? AND session_date >= ? AND session_date <= ?
                 ORDER BY session_date DESC`,
                [userId, startDate.toISOString(), endDate.toISOString()]
            );
            
            return this.processUserReport(events.rows, sessions.rows);
        } catch (error) {
            console.error('❌ Failed to generate user report:', error);
            return null;
        }
    }

    processUserReport(events, sessions) {
        const report = {
            totalSessions: sessions.length,
            totalPlaytime: sessions.reduce((sum, s) => sum + (s.playtime || 0), 0),
            averageScore: sessions.length > 0 ? 
                sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length : 0,
            bestScore: sessions.length > 0 ? Math.max(...sessions.map(s => s.score)) : 0,
            totalDistance: sessions.reduce((sum, s) => sum + (s.distance_traveled || 0), 0),
            eventBreakdown: {},
            performanceIssues: 0,
            achievements: 0
        };
        
        events.forEach(event => {
            report.eventBreakdown[event.event_type] = 
                (report.eventBreakdown[event.event_type] || 0) + 1;
                
            if (event.event_type === 'performance_issue') {
                report.performanceIssues++;
            }
            
            if (event.event_type === 'achievement_unlocked') {
                report.achievements++;
            }
        });
        
        return report;
    }

    async generateSystemReport(days = 1) {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
        
        try {
            const events = await this.db.query(
                `SELECT event_type, COUNT(*) as count 
                 FROM analytics_events 
                 WHERE timestamp >= ? AND timestamp <= ?
                 GROUP BY event_type
                 ORDER BY count DESC`,
                [startDate.toISOString(), endDate.toISOString()]
            );
            
            const performance = await this.db.query(
                `SELECT metric_type, AVG(metric_value) as avg_value, 
                        MIN(metric_value) as min_value, MAX(metric_value) as max_value
                 FROM performance_metrics 
                 WHERE timestamp >= ? AND timestamp <= ?
                 GROUP BY metric_type`,
                [startDate.toISOString(), endDate.toISOString()]
            );
            
            return {
                period: { start: startDate, end: endDate },
                eventCounts: events.rows,
                performanceMetrics: performance.rows,
                systemHealth: await this.db.healthCheck()
            };
        } catch (error) {
            console.error('❌ Failed to generate system report:', error);
            return null;
        }
    }

    getPerformanceSummary() {
        const frameRates = this.performanceMetrics.frameRate.map(f => f.fps);
        const memoryUsage = this.performanceMetrics.memoryUsage.map(m => m.used);
        
        return {
            averageFPS: frameRates.length > 0 ? 
                frameRates.reduce((a, b) => a + b, 0) / frameRates.length : 0,
            minFPS: frameRates.length > 0 ? Math.min(...frameRates) : 0,
            maxFPS: frameRates.length > 0 ? Math.max(...frameRates) : 0,
            averageMemory: memoryUsage.length > 0 ? 
                memoryUsage.reduce((a, b) => a + b, 0) / memoryUsage.length : 0,
            errorCounts: { ...this.performanceMetrics.errorCounts },
            featureUsage: Object.fromEntries(this.performanceMetrics.featureUsage)
        };
    }

    // Privacy and consent management
    setAnalyticsConsent(consent) {
        localStorage.setItem('birddash_analytics_consent', consent.toString());
        this.isEnabled = consent;
        
        if (consent && !this.scene.events.hasListener('gameStarted')) {
            this.initializeAnalytics();
        } else if (!consent) {
            this.disableAnalytics();
        }
        
        this.trackEvent('consent_changed', { consent }, true);
    }

    disableAnalytics() {
        this.isEnabled = false;
        this.eventQueue = [];
        
        // Remove event listeners
        this.scene.events.off('gameStarted', this.trackGameStart, this);
        this.scene.events.off('gameEnded', this.trackGameEnd, this);
        // ... remove all other listeners
        
        console.log('📊 AnalyticsSystem: Analytics disabled');
    }

    // Data export for GDPR compliance
    async exportUserData(userId) {
        try {
            const events = await this.db.query(
                'SELECT * FROM analytics_events WHERE user_id = ?',
                [userId]
            );
            
            const sessions = await this.db.query(
                'SELECT * FROM game_sessions WHERE user_id = ?',
                [userId]
            );
            
            return {
                events: events.rows,
                sessions: sessions.rows,
                exportDate: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Failed to export user data:', error);
            return null;
        }
    }

    // Data deletion for GDPR compliance
    async deleteUserData(userId) {
        try {
            await this.db.transaction(async (query) => {
                await query('DELETE FROM analytics_events WHERE user_id = ?', [userId]);
                await query('DELETE FROM game_sessions WHERE user_id = ?', [userId]);
            });
            
            console.log(`🗑️ Deleted analytics data for user ${userId}`);
            return true;
        } catch (error) {
            console.error('❌ Failed to delete user data:', error);
            return false;
        }
    }

    // Public API
    setUserId(userId) {
        this.userId = userId;
    }

    getSessionId() {
        return this.sessionId;
    }

    isAnalyticsEnabled() {
        return this.isEnabled;
    }

    getCurrentMetrics() {
        return {
            performance: this.getPerformanceSummary(),
            queueSize: this.eventQueue.length,
            sessionDuration: Date.now() - this.sessionData.startTime
        };
    }

    // Cleanup
    cleanup() {
        this.flushEvents();
        this.trackSessionEnd();
        
        // Clear intervals and event listeners
        this.scene.events.removeAllListeners();
        
        console.log('📊 AnalyticsSystem: Cleanup completed');
    }
}
