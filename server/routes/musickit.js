/**
 * MusicKit API Routes
 * 
 * Endpoints for Apple MusicKit integration:
 * - /api/musickit-token: Get developer token for frontend initialization
 */

const express = require('express');
const router = express.Router();
const { musicKitTokenService } = require('../services/MusicKitTokenService');

/**
 * GET /api/musickit-token
 * 
 * Returns a developer token for initializing MusicKit JS on the frontend.
 * The token is cached server-side to minimize JWT generation overhead.
 * 
 * Response:
 * {
 *   "token": "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkFCQzEyMzQ1NiJ9...",
 *   "expiresAt": 1717948800,
 *   "expiresIn": 15552000
 * }
 */
router.get('/musickit-token', (req, res) => {
    try {
        // Check if service is configured
        const configCheck = musicKitTokenService.checkConfig();
        if (!configCheck.ready) {
            console.warn('[MusicKit] Service not configured:', configCheck.missing);
            return res.status(503).json({
                error: 'MusicKit not configured',
                missing: configCheck.missing
            });
        }

        // Get token (cached or fresh)
        const result = musicKitTokenService.getToken();

        const now = Math.floor(Date.now() / 1000);

        return res.json({
            token: result.token,
            expiresAt: result.expiresAt,
            expiresIn: result.expiresAt - now,
            cached: result.cached || false
        });
    } catch (error) {
        console.error('[MusicKit] Token generation failed:', error.message);
        return res.status(500).json({
            error: 'Failed to generate MusicKit token',
            message: error.message
        });
    }
});

/**
 * GET /api/musickit-status
 * 
 * Health check for MusicKit configuration.
 */
router.get('/musickit-status', (req, res) => {
    const configCheck = musicKitTokenService.checkConfig();
    return res.json({
        configured: configCheck.ready,
        missing: configCheck.missing
    });
});

module.exports = router;
