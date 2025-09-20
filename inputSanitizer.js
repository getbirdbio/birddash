/**
 * Input Sanitizer Utility
 * Sanitize and validate user inputs
 */

export default class InputSanitizer {
    /**
     * Sanitize a string input
     */
    static sanitizeString(input, maxLength = 50) {
        if (typeof input !== 'string') {
            return '';
        }
        
        // Remove HTML tags and scripts
        let sanitized = input.replace(/<[^>]*>/g, '');
        
        // Remove potentially dangerous characters
        sanitized = sanitized.replace(/[<>\"'`]/g, '');
        
        // Trim whitespace
        sanitized = sanitized.trim();
        
        // Limit length
        if (sanitized.length > maxLength) {
            sanitized = sanitized.substring(0, maxLength);
        }
        
        return sanitized;
    }

    /**
     * Sanitize a name input
     */
    static sanitizeName(name) {
        // Sanitize basic string
        let sanitized = this.sanitizeString(name, 20);
        
        // Allow only alphanumeric, spaces, and basic punctuation
        sanitized = sanitized.replace(/[^a-zA-Z0-9\s\-_.]/g, '');
        
        // Ensure at least 1 character
        if (sanitized.length < 1) {
            return 'Player';
        }
        
        return sanitized;
    }

    /**
     * Sanitize phone number
     */
    static sanitizePhone(phone) {
        if (typeof phone !== 'string') {
            return '';
        }
        
        // Remove all non-digits
        let sanitized = phone.replace(/\D/g, '');
        
        // Limit to reasonable phone number length
        if (sanitized.length > 15) {
            sanitized = sanitized.substring(0, 15);
        }
        
        return sanitized;
    }

    /**
     * Validate email format
     */
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Sanitize email
     */
    static sanitizeEmail(email) {
        let sanitized = this.sanitizeString(email, 100);
        
        // Convert to lowercase
        sanitized = sanitized.toLowerCase();
        
        // Basic email validation
        if (!this.validateEmail(sanitized)) {
            return '';
        }
        
        return sanitized;
    }

    /**
     * Sanitize numeric input
     */
    static sanitizeNumber(input, min = 0, max = Number.MAX_SAFE_INTEGER) {
        const num = parseFloat(input);
        
        if (isNaN(num)) {
            return min;
        }
        
        // Clamp between min and max
        return Math.max(min, Math.min(max, num));
    }

    /**
     * Sanitize integer input
     */
    static sanitizeInteger(input, min = 0, max = Number.MAX_SAFE_INTEGER) {
        const num = parseInt(input, 10);
        
        if (isNaN(num)) {
            return min;
        }
        
        // Clamp between min and max
        return Math.max(min, Math.min(max, num));
    }

    /**
     * Check for profanity (basic filter)
     */
    static containsProfanity(text) {
        // Basic profanity list (extend as needed)
        const profanityList = [
            'badword1', 'badword2', 'badword3'
            // Add more as needed
        ];
        
        const lowerText = text.toLowerCase();
        return profanityList.some(word => lowerText.includes(word));
    }

    /**
     * Filter profanity from text
     */
    static filterProfanity(text) {
        if (this.containsProfanity(text)) {
            return text.replace(/[a-zA-Z]/g, '*');
        }
        return text;
    }

    /**
     * Validate and sanitize leaderboard entry
     */
    static sanitizeLeaderboardEntry(entry) {
        return {
            name: this.filterProfanity(this.sanitizeName(entry.name || '')),
            score: this.sanitizeInteger(entry.score, 0, 999999999),
            phone: this.sanitizePhone(entry.phone || ''),
            date: entry.date || new Date().toISOString()
        };
    }

    /**
     * Escape HTML entities
     */
    static escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    /**
     * Validate URL
     */
    static isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    /**
     * Sanitize URL
     */
    static sanitizeUrl(url) {
        if (!this.isValidUrl(url)) {
            return '';
        }
        
        // Only allow http and https protocols
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return '';
        }
        
        return parsed.toString();
    }
}
