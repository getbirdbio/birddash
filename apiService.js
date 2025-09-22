// API Service for BirdDash Game
export default class ApiService {
    constructor() {
        // Auto-detect API base URL based on environment
        this.baseUrl = this.detectApiUrl();
        // Note: JWT token now stored in HTTP-only cookie for security
        // No longer accessible via JavaScript (prevents XSS attacks)
        this.currentUser = null;
        
        console.log('🌐 API Service initialized with base URL:', this.baseUrl);
        
        // Try to load cached user data
        this.loadCachedUser();
    }

    detectApiUrl() {
        // In production, use same domain
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            return window.location.origin + '/api';
        }
        
        // In development, try to detect if backend is running
        return 'http://localhost:3000/api';
    }

    loadCachedUser() {
        try {
            const cached = localStorage.getItem('birddash_user');
            if (cached) {
                this.currentUser = JSON.parse(cached);
                console.log('👤 Loaded cached user:', this.currentUser.username);
            }
        } catch (error) {
            console.warn('Failed to load cached user:', error);
        }
    }

    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        // JWT token now sent automatically via HTTP-only cookie
        // No need to manually set Authorization header
        // Cookies are sent automatically with credentials: 'include'
        defaultOptions.credentials = 'include';

        const finalOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers,
            },
        };

        try {
            console.log(`🔄 API Request: ${options.method || 'GET'} ${url}`);
            
            const response = await fetch(url, finalOptions);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Network error' }));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log(`✅ API Response: ${endpoint}`, data);
            return data;
            
        } catch (error) {
            console.error(`❌ API Error: ${endpoint}`, error);
            
            // If it's a network error, fall back to local storage
            if (error.message.includes('fetch') || error.message.includes('Network')) {
                console.log('🔄 Falling back to local storage mode');
                return this.handleOfflineMode(endpoint, options);
            }
            
            throw error;
        }
    }

    handleOfflineMode(endpoint, options) {
        console.log('📱 Operating in offline mode');
        
        // Basic offline functionality for core features
        if (endpoint.includes('/leaderboard') && options.method === 'POST') {
            return this.saveScoreOffline(JSON.parse(options.body));
        }
        
        if (endpoint.includes('/leaderboard') && !options.method) {
            return this.getOfflineLeaderboard();
        }
        
        return { error: 'Offline mode - limited functionality' };
    }

    saveScoreOffline(scoreData) {
        try {
            const key = 'birddash_offline_scores';
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            
            existing.push({
                ...scoreData,
                id: Date.now(),
                game_date: new Date().toISOString(),
                rank: existing.length + 1
            });
            
            // Sort by score and keep top 50
            existing.sort((a, b) => b.score - a.score);
            const top50 = existing.slice(0, 50);
            
            localStorage.setItem(key, JSON.stringify(top50));
            
            return {
                message: 'Score saved offline',
                entry_id: Date.now(),
                rank: top50.findIndex(s => s.score === scoreData.score) + 1,
                score: scoreData.score,
                username: scoreData.username
            };
        } catch (error) {
            console.error('Offline save error:', error);
            return { error: 'Failed to save offline' };
        }
    }

    getOfflineLeaderboard() {
        try {
            const key = 'birddash_offline_scores';
            const scores = JSON.parse(localStorage.getItem(key) || '[]');
            
            return {
                leaderboard: scores.slice(0, 20).map((score, index) => ({
                    ...score,
                    rank: index + 1
                })),
                pagination: {
                    total: scores.length,
                    limit: 20,
                    offset: 0,
                    hasMore: false
                },
                timeframe: 'all',
                offline: true
            };
        } catch (error) {
            console.error('Offline leaderboard error:', error);
            return { leaderboard: [], pagination: { total: 0 } };
        }
    }

    // Authentication methods
    async createGuestUser(username) {
        try {
            const response = await this.makeRequest('/auth/guest', {
                method: 'POST',
                body: JSON.stringify({ username })
            });

            // JWT token now stored in HTTP-only cookie by server
            // Only store user data in localStorage (no sensitive token)
            if (response.user) {
                this.currentUser = response.user;
                localStorage.setItem('birddash_user', JSON.stringify(this.currentUser));
            }

            return response;
        } catch (error) {
            // Fallback to offline guest mode
            const guestUser = {
                id: Date.now(),
                username,
                is_guest: true,
                offline: true
            };
            
            this.currentUser = guestUser;
            localStorage.setItem('birddash_user', JSON.stringify(guestUser));
            
            return {
                message: 'Guest user created (offline mode)',
                user: guestUser,
                offline: true
            };
        }
    }

    async verifyToken() {
        // Token verification now handled by HTTP-only cookie
        
        try {
            const response = await this.makeRequest('/auth/verify');
            if (response.valid) {
                this.currentUser = response.user;
                localStorage.setItem('birddash_user', JSON.stringify(this.currentUser));
                return response.user;
            }
        } catch (error) {
            console.log('Token verification failed, clearing auth data');
            this.clearAuth();
        }
        
        return null;
    }

    async clearAuth() {
        // Call logout endpoint to clear HTTP-only cookie
        try {
            await this.makeRequest('/auth/logout', { method: 'POST' });
        } catch (error) {
            console.warn('Logout request failed:', error);
        }
        
        this.currentUser = null;
        localStorage.removeItem('birddash_user');
    }

    // Leaderboard methods
    async getLeaderboard(limit = 20, offset = 0, timeframe = 'all') {
        const params = new URLSearchParams({ limit, offset, timeframe });
        return await this.makeRequest(`/leaderboard?${params}`);
    }

    async submitScore(scoreData) {
        return await this.makeRequest('/leaderboard/submit', {
            method: 'POST',
            body: JSON.stringify({
                ...scoreData,
                user_id: this.currentUser?.id,
                is_guest: this.currentUser?.is_guest ?? true
            })
        });
    }

    async getUserScores(username, limit = 10) {
        return await this.makeRequest(`/leaderboard/user/${encodeURIComponent(username)}?limit=${limit}`);
    }

    async getLeaderboardStats() {
        return await this.makeRequest('/leaderboard/stats');
    }

    // User methods
    async getUserProfile(username) {
        return await this.makeRequest(`/users/${encodeURIComponent(username)}`);
    }

    async updateGameStats(username, gameData) {
        return await this.makeRequest(`/users/${encodeURIComponent(username)}/game-complete`, {
            method: 'POST',
            body: JSON.stringify(gameData)
        });
    }

    async getUserAchievements(username) {
        return await this.makeRequest(`/users/${encodeURIComponent(username)}/achievements`);
    }

    // Utility methods
    isOnline() {
        return navigator.onLine && this.baseUrl;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    // Health check
    async checkHealth() {
        try {
            const response = await this.makeRequest('/health');
            console.log('🏥 API Health:', response);
            return response;
        } catch (error) {
            console.log('❌ API Health check failed:', error.message);
            return { status: 'OFFLINE', error: error.message };
        }
    }
}
