// PerformanceMonitor - Real-time performance monitoring and optimization
// Monitors FPS, memory usage, network performance, and system health
// Provides automatic optimization recommendations and alerts

export default class PerformanceMonitor {
    constructor(scene, databaseManager, analyticsSystem) {
        this.scene = scene;
        this.db = databaseManager;
        this.analytics = analyticsSystem;
        
        // Performance thresholds
        this.thresholds = {
            fps: {
                excellent: 58,
                good: 45,
                poor: 30,
                critical: 15
            },
            memory: {
                excellent: 50, // MB
                good: 100,
                poor: 200,
                critical: 500
            },
            loadTime: {
                excellent: 1000, // ms
                good: 3000,
                poor: 5000,
                critical: 10000
            },
            networkLatency: {
                excellent: 50, // ms
                good: 150,
                poor: 500,
                critical: 1000
            }
        };
        
        // Monitoring state
        this.isMonitoring = false;
        this.monitoringInterval = null;
        this.performanceHistory = [];
        this.currentMetrics = {};
        this.alerts = [];
        this.optimizations = new Set();
        
        // Performance budget
        this.performanceBudget = {
            targetFPS: 60,
            maxMemoryMB: 150,
            maxLoadTimeMs: 3000,
            maxNetworkLatencyMs: 200
        };
        
        // Auto-optimization settings
        this.autoOptimization = {
            enabled: true,
            aggressiveness: 'moderate', // conservative, moderate, aggressive
            adaptiveQuality: true,
            batteryOptimization: true
        };
        
        this.initializeMonitoring();
    }

    initializeMonitoring() {
        console.log('📈 PerformanceMonitor: Initializing performance monitoring');
        
        this.detectCapabilities();
        this.setupPerformanceObserver();
        this.startMonitoring();
        this.setupEventListeners();
        this.initializeOptimizations();
    }

    detectCapabilities() {
        this.capabilities = {
            performanceAPI: 'performance' in window,
            performanceObserver: 'PerformanceObserver' in window,
            memoryAPI: 'memory' in performance,
            navigationTiming: 'navigation' in performance,
            resourceTiming: 'getEntriesByType' in performance,
            userTiming: 'mark' in performance && 'measure' in performance,
            batteryAPI: 'getBattery' in navigator,
            networkInformation: 'connection' in navigator,
            deviceMemory: 'deviceMemory' in navigator,
            hardwareConcurrency: 'hardwareConcurrency' in navigator
        };
        
        console.log('📊 Performance capabilities detected:', this.capabilities);
    }

    setupPerformanceObserver() {
        if (!this.capabilities.performanceObserver) return;
        
        try {
            // Monitor long tasks (blocking the main thread)
            const longTaskObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.handleLongTask(entry);
                }
            });
            longTaskObserver.observe({ entryTypes: ['longtask'] });
            
            // Monitor layout shifts
            const layoutShiftObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.handleLayoutShift(entry);
                }
            });
            layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
            
            // Monitor largest contentful paint
            const lcpObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.handleLargestContentfulPaint(entry);
                }
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            
        } catch (error) {
            console.warn('⚠️ Performance Observer setup failed:', error);
        }
    }

    startMonitoring() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        
        // Main monitoring loop
        this.monitoringInterval = setInterval(() => {
            this.collectMetrics();
            this.analyzePerformance();
            this.applyOptimizations();
        }, 1000); // Every second
        
        // Periodic detailed analysis
        setInterval(() => {
            this.performDetailedAnalysis();
            this.cleanupHistory();
        }, 30000); // Every 30 seconds
        
        console.log('📈 Performance monitoring started');
    }

    collectMetrics() {
        const timestamp = performance.now();
        
        // Collect FPS
        const fps = this.calculateFPS();
        
        // Collect memory usage
        const memory = this.collectMemoryMetrics();
        
        // Collect network metrics
        const network = this.collectNetworkMetrics();
        
        // Collect game-specific metrics
        const game = this.collectGameMetrics();
        
        // Collect system metrics
        const system = this.collectSystemMetrics();
        
        this.currentMetrics = {
            timestamp,
            fps,
            memory,
            network,
            game,
            system
        };
        
        // Add to history
        this.performanceHistory.push(this.currentMetrics);
        
        // Keep only last 5 minutes of history
        if (this.performanceHistory.length > 300) {
            this.performanceHistory.shift();
        }
    }

    calculateFPS() {
        if (!this.lastFrameTime) {
            this.lastFrameTime = performance.now();
            this.frameCount = 0;
            return 60; // Default assumption
        }
        
        this.frameCount++;
        const currentTime = performance.now();
        const elapsed = currentTime - this.lastFrameTime;
        
        if (elapsed >= 1000) { // Calculate every second
            const fps = Math.round((this.frameCount * 1000) / elapsed);
            this.lastFrameTime = currentTime;
            this.frameCount = 0;
            return fps;
        }
        
        return this.currentMetrics.fps || 60;
    }

    collectMemoryMetrics() {
        if (!this.capabilities.memoryAPI) {
            return { available: false };
        }
        
        const memory = performance.memory;
        return {
            available: true,
            used: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
            total: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
            limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024), // MB
            usagePercent: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
        };
    }

    collectNetworkMetrics() {
        const network = {
            available: this.capabilities.networkInformation,
            type: 'unknown',
            effectiveType: 'unknown',
            downlink: 0,
            rtt: 0
        };
        
        if (navigator.connection) {
            network.type = navigator.connection.type || 'unknown';
            network.effectiveType = navigator.connection.effectiveType || 'unknown';
            network.downlink = navigator.connection.downlink || 0;
            network.rtt = navigator.connection.rtt || 0;
        }
        
        return network;
    }

    collectGameMetrics() {
        const gameState = this.scene.gameStateManager?.getGameState();
        const powerUpSystem = this.scene.powerUpSystem;
        
        return {
            isRunning: gameState?.isRunning || false,
            isPaused: gameState?.isPaused || false,
            score: gameState?.score || 0,
            level: gameState?.level || 1,
            gameSpeed: gameState?.gameSpeed || 0,
            activePowerUps: powerUpSystem ? this.getActivePowerUps(powerUpSystem) : [],
            objectCount: this.estimateObjectCount()
        };
    }

    collectSystemMetrics() {
        return {
            deviceMemory: navigator.deviceMemory || 'unknown',
            hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
            platform: navigator.platform,
            userAgent: navigator.userAgent.substring(0, 100), // Truncated
            screenSize: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            devicePixelRatio: window.devicePixelRatio || 1
        };
    }

    getActivePowerUps(powerUpSystem) {
        const powerUpTypes = ['shield', 'speedBoost', 'scoreMultiplier', 'timeSlow', 'magnet', 'birdCompanion'];
        return powerUpTypes.filter(type => powerUpSystem.isPowerUpActive(type));
    }

    estimateObjectCount() {
        // Estimate number of active game objects
        let count = 0;
        
        if (this.scene.children) {
            count += this.scene.children.list.length;
        }
        
        if (this.scene.physics && this.scene.physics.world) {
            count += this.scene.physics.world.bodies.entries.length;
        }
        
        return count;
    }

    analyzePerformance() {
        const metrics = this.currentMetrics;
        const issues = [];
        
        // FPS analysis
        if (metrics.fps < this.thresholds.fps.critical) {
            issues.push({
                type: 'critical_fps',
                severity: 'critical',
                message: `Critical FPS: ${metrics.fps} (target: ${this.performanceBudget.targetFPS})`,
                recommendation: 'Reduce visual effects and object count'
            });
        } else if (metrics.fps < this.thresholds.fps.poor) {
            issues.push({
                type: 'poor_fps',
                severity: 'warning',
                message: `Poor FPS: ${metrics.fps}`,
                recommendation: 'Consider reducing quality settings'
            });
        }
        
        // Memory analysis
        if (metrics.memory.available) {
            if (metrics.memory.used > this.thresholds.memory.critical) {
                issues.push({
                    type: 'critical_memory',
                    severity: 'critical',
                    message: `Critical memory usage: ${metrics.memory.used}MB`,
                    recommendation: 'Force garbage collection and reduce object pools'
                });
            } else if (metrics.memory.used > this.thresholds.memory.poor) {
                issues.push({
                    type: 'high_memory',
                    severity: 'warning',
                    message: `High memory usage: ${metrics.memory.used}MB`,
                    recommendation: 'Monitor object creation and cleanup'
                });
            }
        }
        
        // Network analysis
        if (metrics.network.available && metrics.network.rtt > this.thresholds.networkLatency.poor) {
            issues.push({
                type: 'high_latency',
                severity: 'warning',
                message: `High network latency: ${metrics.network.rtt}ms`,
                recommendation: 'Reduce network requests and implement caching'
            });
        }
        
        // Game-specific analysis
        if (metrics.game.objectCount > 100) {
            issues.push({
                type: 'high_object_count',
                severity: 'info',
                message: `High object count: ${metrics.game.objectCount}`,
                recommendation: 'Implement object pooling'
            });
        }
        
        // Update alerts
        this.updateAlerts(issues);
        
        // Trigger analytics events for significant issues
        issues.filter(issue => issue.severity === 'critical').forEach(issue => {
            if (this.analytics) {
                this.analytics.trackEvent('performance_critical', {
                    type: issue.type,
                    message: issue.message,
                    metrics: this.currentMetrics
                });
            }
        });
    }

    updateAlerts(newIssues) {
        const timestamp = Date.now();
        
        // Add new alerts
        newIssues.forEach(issue => {
            const existingAlert = this.alerts.find(alert => 
                alert.type === issue.type && !alert.resolved
            );
            
            if (!existingAlert) {
                this.alerts.push({
                    ...issue,
                    id: `alert_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
                    timestamp,
                    resolved: false,
                    count: 1
                });
            } else {
                existingAlert.count++;
                existingAlert.timestamp = timestamp;
            }
        });
        
        // Resolve alerts that are no longer present
        this.alerts.forEach(alert => {
            if (!alert.resolved && !newIssues.some(issue => issue.type === alert.type)) {
                alert.resolved = true;
                alert.resolvedAt = timestamp;
            }
        });
        
        // Clean up old resolved alerts
        this.alerts = this.alerts.filter(alert => 
            !alert.resolved || (timestamp - alert.resolvedAt) < 300000 // Keep for 5 minutes
        );
    }

    applyOptimizations() {
        if (!this.autoOptimization.enabled) return;
        
        const metrics = this.currentMetrics;
        
        // FPS optimizations
        if (metrics.fps < this.thresholds.fps.poor) {
            this.applyFPSOptimizations(metrics.fps);
        }
        
        // Memory optimizations
        if (metrics.memory.available && metrics.memory.used > this.thresholds.memory.poor) {
            this.applyMemoryOptimizations(metrics.memory.used);
        }
        
        // Battery optimizations
        if (this.autoOptimization.batteryOptimization) {
            this.applyBatteryOptimizations();
        }
    }

    applyFPSOptimizations(currentFPS) {
        const aggressiveness = this.autoOptimization.aggressiveness;
        
        if (currentFPS < this.thresholds.fps.critical) {
            // Critical optimizations
            this.reduceParticleEffects('critical');
            this.reduceAnimationComplexity('critical');
            this.optimizeRenderingQuality('critical');
            this.optimizations.add('critical_fps_optimization');
        } else if (currentFPS < this.thresholds.fps.poor) {
            // Moderate optimizations
            if (aggressiveness !== 'conservative') {
                this.reduceParticleEffects('moderate');
                this.reduceAnimationComplexity('moderate');
                this.optimizations.add('moderate_fps_optimization');
            }
        }
    }

    applyMemoryOptimizations(memoryUsage) {
        if (memoryUsage > this.thresholds.memory.critical) {
            // Force garbage collection if available
            if (window.gc) {
                window.gc();
            }
            
            this.clearObjectPools();
            this.reduceTextureQuality();
            this.optimizations.add('critical_memory_optimization');
        } else if (memoryUsage > this.thresholds.memory.poor) {
            this.optimizeObjectPools();
            this.optimizations.add('moderate_memory_optimization');
        }
    }

    async applyBatteryOptimizations() {
        if (!this.capabilities.batteryAPI) return;
        
        try {
            const battery = await navigator.getBattery();
            
            if (battery.level < 0.2 && !battery.charging) {
                // Low battery - aggressive power saving
                this.scene.sys.game.loop.targetFps = 45;
                this.reduceParticleEffects('critical');
                this.reduceAnimationComplexity('critical');
                this.optimizations.add('battery_power_saving');
                
                if (this.analytics) {
                    this.analytics.trackEvent('battery_optimization', {
                        batteryLevel: battery.level,
                        isCharging: battery.charging
                    });
                }
            } else if (battery.level < 0.5 && !battery.charging) {
                // Moderate battery saving
                this.scene.sys.game.loop.targetFps = 55;
                this.reduceParticleEffects('moderate');
                this.optimizations.add('battery_moderate_saving');
            }
        } catch (error) {
            console.warn('⚠️ Battery optimization failed:', error);
        }
    }

    // Optimization implementation methods
    reduceParticleEffects(level) {
        if (this.scene.particleManager) {
            const reductions = {
                critical: 0.3,  // 70% reduction
                moderate: 0.5,  // 50% reduction
                conservative: 0.8 // 20% reduction
            };
            
            const factor = reductions[level] || reductions.moderate;
            this.scene.particleManager.setMaxParticles(
                Math.floor(this.scene.particleManager.getMaxParticles() * factor)
            );
        }
    }

    reduceAnimationComplexity(level) {
        if (level === 'critical') {
            // Disable non-essential animations
            this.scene.tweens.globalTimeScale = 0.5;
        } else if (level === 'moderate') {
            this.scene.tweens.globalTimeScale = 0.8;
        }
    }

    optimizeRenderingQuality(level) {
        const canvas = this.scene.sys.canvas;
        const context = canvas.getContext('2d');
        
        if (level === 'critical') {
            // Reduce canvas resolution
            const scale = 0.75;
            canvas.style.width = canvas.width + 'px';
            canvas.style.height = canvas.height + 'px';
            canvas.width = Math.floor(canvas.width * scale);
            canvas.height = Math.floor(canvas.height * scale);
            
            // Disable image smoothing
            if (context) {
                context.imageSmoothingEnabled = false;
            }
        }
    }

    clearObjectPools() {
        if (this.scene.objectPool) {
            this.scene.objectPool.clear();
        }
    }

    optimizeObjectPools() {
        if (this.scene.objectPool) {
            this.scene.objectPool.optimize();
        }
    }

    reduceTextureQuality() {
        // Reduce texture quality for memory optimization
        this.scene.textures.each((texture) => {
            if (texture.source && texture.source.length > 0) {
                texture.source[0].scaleMode = Phaser.ScaleModes.LINEAR;
            }
        });
    }

    // Performance event handlers
    handleLongTask(entry) {
        const duration = entry.duration;
        
        if (duration > 50) { // Blocking for more than 50ms
            this.alerts.push({
                type: 'long_task',
                severity: duration > 100 ? 'critical' : 'warning',
                message: `Long task blocked main thread for ${Math.round(duration)}ms`,
                timestamp: Date.now(),
                resolved: false
            });
            
            if (this.analytics) {
                this.analytics.trackEvent('performance_long_task', {
                    duration,
                    startTime: entry.startTime,
                    name: entry.name
                });
            }
        }
    }

    handleLayoutShift(entry) {
        const score = entry.value;
        
        if (score > 0.1) { // Significant layout shift
            if (this.analytics) {
                this.analytics.trackEvent('performance_layout_shift', {
                    score,
                    startTime: entry.startTime
                });
            }
        }
    }

    handleLargestContentfulPaint(entry) {
        const lcp = entry.startTime;
        
        if (lcp > this.thresholds.loadTime.poor) {
            if (this.analytics) {
                this.analytics.trackEvent('performance_lcp', {
                    lcp,
                    threshold: this.thresholds.loadTime.poor
                });
            }
        }
    }

    performDetailedAnalysis() {
        if (this.performanceHistory.length < 10) return;
        
        const analysis = this.analyzePerformanceHistory();
        
        // Store analysis in database
        this.storePerformanceAnalysis(analysis);
        
        // Generate recommendations
        const recommendations = this.generateRecommendations(analysis);
        
        // Log significant findings
        if (analysis.trends.fps.declining || analysis.trends.memory.increasing) {
            console.warn('📉 Performance degradation detected:', analysis.trends);
        }
        
        return { analysis, recommendations };
    }

    analyzePerformanceHistory() {
        const recent = this.performanceHistory.slice(-60); // Last minute
        const older = this.performanceHistory.slice(-120, -60); // Previous minute
        
        const analysis = {
            averages: {
                fps: this.calculateAverage(recent, 'fps'),
                memory: recent[0]?.memory.available ? this.calculateAverage(recent, 'memory.used') : 0
            },
            trends: {
                fps: {
                    current: this.calculateAverage(recent, 'fps'),
                    previous: this.calculateAverage(older, 'fps'),
                    declining: false
                },
                memory: {
                    current: recent[0]?.memory.available ? this.calculateAverage(recent, 'memory.used') : 0,
                    previous: older[0]?.memory.available ? this.calculateAverage(older, 'memory.used') : 0,
                    increasing: false
                }
            },
            stability: {
                fpsVariance: this.calculateVariance(recent, 'fps'),
                memoryVariance: recent[0]?.memory.available ? this.calculateVariance(recent, 'memory.used') : 0
            }
        };
        
        // Determine trends
        analysis.trends.fps.declining = analysis.trends.fps.current < analysis.trends.fps.previous - 5;
        analysis.trends.memory.increasing = analysis.trends.memory.current > analysis.trends.memory.previous + 10;
        
        return analysis;
    }

    calculateAverage(data, path) {
        if (data.length === 0) return 0;
        
        const values = data.map(item => this.getNestedValue(item, path)).filter(v => v !== undefined);
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    calculateVariance(data, path) {
        if (data.length === 0) return 0;
        
        const values = data.map(item => this.getNestedValue(item, path)).filter(v => v !== undefined);
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
        
        return Math.sqrt(variance); // Return standard deviation
    }

    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current && current[key], obj);
    }

    generateRecommendations(analysis) {
        const recommendations = [];
        
        if (analysis.trends.fps.declining) {
            recommendations.push({
                type: 'fps_optimization',
                priority: 'high',
                message: 'FPS is declining over time',
                actions: [
                    'Reduce particle effects',
                    'Optimize object pooling',
                    'Check for memory leaks'
                ]
            });
        }
        
        if (analysis.trends.memory.increasing) {
            recommendations.push({
                type: 'memory_optimization',
                priority: 'high',
                message: 'Memory usage is increasing over time',
                actions: [
                    'Implement proper object cleanup',
                    'Optimize texture usage',
                    'Check for memory leaks'
                ]
            });
        }
        
        if (analysis.stability.fpsVariance > 10) {
            recommendations.push({
                type: 'stability_improvement',
                priority: 'medium',
                message: 'FPS is unstable',
                actions: [
                    'Optimize game loop timing',
                    'Reduce variable load operations',
                    'Implement frame pacing'
                ]
            });
        }
        
        return recommendations;
    }

    async storePerformanceAnalysis(analysis) {
        try {
            await this.db.query(
                'INSERT INTO performance_metrics (metric_type, metric_value, metadata) VALUES (?, ?, ?)',
                ['performance_analysis', analysis.averages.fps, JSON.stringify(analysis)]
            );
        } catch (error) {
            console.warn('⚠️ Failed to store performance analysis:', error);
        }
    }

    setupEventListeners() {
        // Game state changes
        this.scene.events.on('gameStarted', () => {
            this.resetOptimizations();
        });
        
        this.scene.events.on('gameEnded', () => {
            this.logGamePerformance();
        });
        
        // System events
        window.addEventListener('beforeunload', () => {
            this.stopMonitoring();
        });
        
        // Visibility change (tab switching)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseMonitoring();
            } else {
                this.resumeMonitoring();
            }
        });
    }

    initializeOptimizations() {
        // Set initial optimizations based on device capabilities
        const deviceMemory = navigator.deviceMemory || 4;
        const hardwareConcurrency = navigator.hardwareConcurrency || 4;
        
        if (deviceMemory < 4 || hardwareConcurrency < 4) {
            this.autoOptimization.aggressiveness = 'aggressive';
            this.applyInitialOptimizations();
        }
    }

    applyInitialOptimizations() {
        // Apply conservative optimizations for low-end devices
        this.reduceParticleEffects('conservative');
        this.scene.sys.game.loop.targetFps = 55;
        this.optimizations.add('initial_device_optimization');
    }

    resetOptimizations() {
        // Reset optimizations at game start
        this.optimizations.clear();
        this.scene.sys.game.loop.targetFps = 60;
        this.scene.tweens.globalTimeScale = 1.0;
    }

    logGamePerformance() {
        const gameStats = this.scene.gameStateManager?.getGameState();
        const performanceSummary = this.getPerformanceSummary();
        
        if (this.analytics) {
            this.analytics.trackEvent('game_performance_summary', {
                ...performanceSummary,
                gameStats: gameStats,
                optimizationsApplied: Array.from(this.optimizations)
            });
        }
    }

    // Public API methods
    getPerformanceSummary() {
        if (this.performanceHistory.length === 0) {
            return { available: false };
        }
        
        const recent = this.performanceHistory.slice(-60); // Last minute
        
        return {
            available: true,
            averageFPS: this.calculateAverage(recent, 'fps'),
            minFPS: Math.min(...recent.map(m => m.fps)),
            maxFPS: Math.max(...recent.map(m => m.fps)),
            averageMemory: recent[0]?.memory.available ? this.calculateAverage(recent, 'memory.used') : 0,
            currentAlerts: this.alerts.filter(a => !a.resolved).length,
            optimizationsActive: this.optimizations.size,
            networkType: recent[recent.length - 1]?.network.effectiveType || 'unknown'
        };
    }

    getCurrentMetrics() {
        return { ...this.currentMetrics };
    }

    getActiveAlerts() {
        return this.alerts.filter(alert => !alert.resolved);
    }

    getPerformanceHistory(minutes = 5) {
        const entries = minutes * 60; // 60 entries per minute
        return this.performanceHistory.slice(-entries);
    }

    setPerformanceBudget(budget) {
        this.performanceBudget = { ...this.performanceBudget, ...budget };
    }

    setAutoOptimization(settings) {
        this.autoOptimization = { ...this.autoOptimization, ...settings };
    }

    pauseMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        this.isMonitoring = false;
    }

    resumeMonitoring() {
        if (!this.isMonitoring) {
            this.startMonitoring();
        }
    }

    stopMonitoring() {
        this.pauseMonitoring();
        this.performanceHistory = [];
        this.alerts = [];
        this.optimizations.clear();
    }

    cleanupHistory() {
        // Keep only last 10 minutes of history
        const maxEntries = 10 * 60;
        if (this.performanceHistory.length > maxEntries) {
            this.performanceHistory = this.performanceHistory.slice(-maxEntries);
        }
        
        // Clean up old alerts
        const now = Date.now();
        this.alerts = this.alerts.filter(alert => 
            !alert.resolved || (now - alert.resolvedAt) < 300000
        );
    }

    // Cleanup
    cleanup() {
        this.stopMonitoring();
        
        // Remove event listeners
        this.scene.events.removeAllListeners();
        window.removeEventListener('beforeunload', this.cleanup);
        document.removeEventListener('visibilitychange', this.pauseMonitoring);
        
        console.log('📈 PerformanceMonitor: Cleanup completed');
    }
}
