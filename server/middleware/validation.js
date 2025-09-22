import { body, query, param, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';

// Enhanced input sanitization and validation
export const sanitizeInput = (value) => {
    if (typeof value !== 'string') return value;
    
    // Remove potentially dangerous characters
    return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
        .replace(/javascript:/gi, '') // Remove javascript: URLs
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .trim();
};

// Custom validation middleware
export const validateAndSanitize = (validations) => {
    return async (req, res, next) => {
        // Run all validations
        await Promise.all(validations.map(validation => validation.run(req)));
        
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: errors.array() 
            });
        }
        
        // Sanitize string inputs
        const sanitizeObject = (obj) => {
            for (const key in obj) {
                if (typeof obj[key] === 'string') {
                    obj[key] = sanitizeInput(obj[key]);
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    sanitizeObject(obj[key]);
                }
            }
        };
        
        if (req.body) sanitizeObject(req.body);
        if (req.query) sanitizeObject(req.query);
        if (req.params) sanitizeObject(req.params);
        
        next();
    };
};

// Username validation
export const validateUsername = body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens')
    .custom(async (value) => {
        // Check for inappropriate content (basic filter)
        const inappropriate = ['admin', 'root', 'system', 'null', 'undefined'];
        if (inappropriate.some(word => value.toLowerCase().includes(word))) {
            throw new Error('Username contains inappropriate content');
        }
        return true;
    });

// Email validation
export const validateEmail = body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required')
    .isLength({ max: 254 })
    .withMessage('Email too long');

// Password validation
export const validatePassword = body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be 8-128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number');

// Score validation
export const validateScore = body('score')
    .isInt({ min: 0, max: 1000000 })
    .withMessage('Score must be between 0 and 1,000,000')
    .custom((value) => {
        // Basic anti-cheat: extremely high scores are suspicious
        if (value > 100000) {
            console.warn(`Suspicious high score submitted: ${value}`);
        }
        return true;
    });

// Game stats validation
export const validateGameStats = body('gameStats')
    .optional()
    .isObject()
    .withMessage('Game stats must be an object')
    .custom((value) => {
        if (!value) return true;
        
        const allowedKeys = [
            'distance', 'collectibles', 'powerUpsUsed', 'obstacles', 
            'playtime', 'maxCombo', 'deaths', 'level'
        ];
        
        for (const key in value) {
            if (!allowedKeys.includes(key)) {
                throw new Error(`Invalid game stat key: ${key}`);
            }
            
            if (typeof value[key] !== 'number' || value[key] < 0) {
                throw new Error(`Game stat ${key} must be a non-negative number`);
            }
        }
        
        return true;
    });

// Pagination validation
export const validatePagination = [
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    query('offset')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Offset must be non-negative')
];

// Rate limiting for different endpoints
export const createRateLimit = (windowMs, max, message) => {
    return rateLimit({
        windowMs,
        max,
        message: { error: message },
        standardHeaders: true,
        legacyHeaders: false,
    });
};

// Specific rate limits
export const authRateLimit = createRateLimit(
    15 * 60 * 1000, // 15 minutes
    5, // 5 attempts
    'Too many authentication attempts, please try again later'
);

export const scoreSubmissionRateLimit = createRateLimit(
    60 * 1000, // 1 minute
    10, // 10 submissions per minute
    'Too many score submissions, please slow down'
);

export const generalRateLimit = createRateLimit(
    15 * 60 * 1000, // 15 minutes
    100, // 100 requests
    'Too many requests, please try again later'
);

// SQL injection prevention
export const preventSQLInjection = (req, res, next) => {
    const checkValue = (value) => {
        if (typeof value !== 'string') return;
        
        const sqlPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
            /(--|\/\*|\*\/)/g,
            /(\b(OR|AND)\b.*=.*)/gi,
            /['"`;]/g
        ];
        
        for (const pattern of sqlPatterns) {
            if (pattern.test(value)) {
                throw new Error('Potentially malicious input detected');
            }
        }
    };
    
    try {
        const checkObject = (obj) => {
            for (const key in obj) {
                if (typeof obj[key] === 'string') {
                    checkValue(obj[key]);
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    checkObject(obj[key]);
                }
            }
        };
        
        if (req.body) checkObject(req.body);
        if (req.query) checkObject(req.query);
        if (req.params) checkObject(req.params);
        
        next();
    } catch (error) {
        console.warn('SQL injection attempt detected:', error.message, req.ip);
        res.status(400).json({ error: 'Invalid input detected' });
    }
};
