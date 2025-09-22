import crypto from 'crypto';

// Generate CSRF token
export const generateCSRFToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// CSRF protection middleware
export const csrfProtection = (req, res, next) => {
    // Skip CSRF for GET, HEAD, OPTIONS requests (safe methods)
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }
    
    // Get CSRF token from header or body
    const token = req.headers['x-csrf-token'] || req.body._csrf;
    const sessionToken = req.session?.csrfToken;
    
    if (!token || !sessionToken || token !== sessionToken) {
        return res.status(403).json({ 
            error: 'CSRF token missing or invalid',
            code: 'CSRF_INVALID'
        });
    }
    
    next();
};

// Middleware to provide CSRF token to client
export const provideCSRFToken = (req, res, next) => {
    if (!req.session) {
        return res.status(500).json({ error: 'Session not initialized' });
    }
    
    // Generate new CSRF token if none exists
    if (!req.session.csrfToken) {
        req.session.csrfToken = generateCSRFToken();
    }
    
    // Add CSRF token to response headers
    res.setHeader('X-CSRF-Token', req.session.csrfToken);
    
    next();
};

// Endpoint to get CSRF token
export const getCSRFToken = (req, res) => {
    if (!req.session) {
        return res.status(500).json({ error: 'Session not initialized' });
    }
    
    if (!req.session.csrfToken) {
        req.session.csrfToken = generateCSRFToken();
    }
    
    res.json({ csrfToken: req.session.csrfToken });
};
