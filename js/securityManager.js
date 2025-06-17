// Enhanced Security Manager
const crypto = require('crypto');

class SecurityManager {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        this.keyLength = 32;
        this.ivLength = 16;
        this.tagLength = 16;
    }

    // Generate a secure hash for password storage
    hashPassword(password, salt = null) {
        if (!salt) {
            salt = crypto.randomBytes(16).toString('hex');
        }
        const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512');
        return {
            hash: hash.toString('hex'),
            salt: salt
        };
    }

    // Verify password against stored hash
    verifyPassword(password, storedHash, salt) {
        const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512');
        return crypto.timingSafeEqual(Buffer.from(storedHash, 'hex'), hash);
    }

    // Encrypt sensitive data
    encrypt(text, key) {
        const iv = crypto.randomBytes(this.ivLength);
        const cipher = crypto.createCipher(this.algorithm, key, iv);
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const tag = cipher.getAuthTag();
        
        return {
            encrypted: encrypted,
            iv: iv.toString('hex'),
            tag: tag.toString('hex')
        };
    }

    // Decrypt sensitive data
    decrypt(encryptedData, key) {
        const decipher = crypto.createDecipher(
            this.algorithm, 
            key, 
            Buffer.from(encryptedData.iv, 'hex')
        );
        
        decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
        
        let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    }

    // Generate secure session token
    generateSessionToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    // Rate limiting for login attempts
    checkRateLimit(identifier, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
        const now = Date.now();
        const key = `rateLimit_${identifier}`;
        
        let attempts = JSON.parse(localStorage.getItem(key) || '[]');
        
        // Clean old attempts outside window
        attempts = attempts.filter(timestamp => now - timestamp < windowMs);
        
        if (attempts.length >= maxAttempts) {
            return {
                allowed: false,
                retryAfter: windowMs - (now - attempts[0])
            };
        }
        
        // Add current attempt
        attempts.push(now);
        localStorage.setItem(key, JSON.stringify(attempts));
        
        return {
            allowed: true,
            attemptsRemaining: maxAttempts - attempts.length
        };
    }
}

// Export for use in main renderer and testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityManager;
} else {
    window.SecurityManager = SecurityManager;
}
