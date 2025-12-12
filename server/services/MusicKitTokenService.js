/**
 * MusicKitTokenService
 * 
 * Generates Apple MusicKit Developer Tokens (JWT) for frontend authentication.
 * 
 * The token uses ES256 (ECDSA with P-256 and SHA-256) algorithm.
 * The private key (.p8 file) is stored in GCP Secret Manager.
 * 
 * @see https://developer.apple.com/documentation/applemusicapi/generating_developer_tokens
 */

const jwt = require('jsonwebtoken');

class MusicKitTokenService {
    constructor() {
        // These will be loaded from environment variables
        this.teamId = process.env.APPLE_TEAM_ID;
        this.keyId = process.env.APPLE_KEY_ID;
        this.privateKey = process.env.APPLE_MUSIC_PRIVATE_KEY;

        // Token validity period (6 months max per Apple docs)
        this.tokenTTL = 180 * 24 * 60 * 60; // 180 days in seconds

        // Cache the token to avoid regenerating on every request
        this._cachedToken = null;
        this._tokenExpiry = null;
    }

    /**
     * Initialize with credentials (can be called after env vars are loaded)
     */
    init({ teamId, keyId, privateKey }) {
        if (teamId) this.teamId = teamId;
        if (keyId) this.keyId = keyId;
        if (privateKey) this.privateKey = privateKey;
    }

    /**
     * Generate a new MusicKit developer token
     * @returns {string} JWT token
     */
    generateToken() {
        if (!this.privateKey) {
            throw new Error('APPLE_MUSIC_PRIVATE_KEY not configured');
        }
        if (!this.teamId) {
            throw new Error('APPLE_TEAM_ID not configured');
        }
        if (!this.keyId) {
            throw new Error('APPLE_KEY_ID not configured');
        }

        const now = Math.floor(Date.now() / 1000);
        const exp = now + this.tokenTTL;

        const payload = {
            iss: this.teamId,  // Team ID from Apple Developer Portal
            iat: now,          // Issued at
            exp: exp           // Expiry (max 6 months)
        };

        const options = {
            algorithm: 'ES256',
            keyid: this.keyId  // Key ID from the .p8 file download
        };

        // The private key from .p8 file should be in PEM format
        // If it's not already in PEM format, wrap it
        let key = this.privateKey;
        if (!key.includes('-----BEGIN')) {
            key = `-----BEGIN PRIVATE KEY-----\n${key}\n-----END PRIVATE KEY-----`;
        }

        return jwt.sign(payload, key, options);
    }

    /**
     * Get a token, using cached version if still valid
     * @param {boolean} forceRefresh - Force generate a new token
     * @returns {Object} { token: string, expiresAt: number }
     */
    getToken(forceRefresh = false) {
        const now = Math.floor(Date.now() / 1000);

        // Return cached token if valid (with 1 hour buffer)
        if (!forceRefresh && this._cachedToken && this._tokenExpiry && (this._tokenExpiry - now) > 3600) {
            return {
                token: this._cachedToken,
                expiresAt: this._tokenExpiry,
                cached: true
            };
        }

        // Generate new token
        const token = this.generateToken();
        const expiresAt = now + this.tokenTTL;

        // Cache it
        this._cachedToken = token;
        this._tokenExpiry = expiresAt;

        return {
            token,
            expiresAt,
            cached: false
        };
    }

    /**
     * Check if service is properly configured
     * @returns {Object} { ready: boolean, missing: string[] }
     */
    checkConfig() {
        const missing = [];
        if (!this.teamId) missing.push('APPLE_TEAM_ID');
        if (!this.keyId) missing.push('APPLE_KEY_ID');
        if (!this.privateKey) missing.push('APPLE_MUSIC_PRIVATE_KEY');

        return {
            ready: missing.length === 0,
            missing
        };
    }
}

// Singleton instance
const musicKitTokenService = new MusicKitTokenService();

module.exports = { musicKitTokenService, MusicKitTokenService };
