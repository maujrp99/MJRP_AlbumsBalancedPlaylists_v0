/**
 * Playlist Routes
 * Sprint 10 refactoring: Extracted from server/index.js
 * Handles /api/playlists endpoint
 */

const express = require('express')
const router = express.Router()

/**
 * POST /api/playlists
 * Generate playlists from albums using curation algorithm
 */
router.post('/playlists', async (req, res) => {
    try {
        const { albums, options = {} } = req.body

        if (!Array.isArray(albums) || albums.length === 0) {
            return res.status(400).json({ error: 'albums array required' })
        }

        // Import curation logic (ES module from shared folder)
        const { curateAlbums } = await import('../../shared/curation.js')

        // Convert duration from minutes to seconds
        const targetSeconds = (() => {
            if (options.minDuration && options.maxDuration) {
                // Use average of min/max
                const avgMinutes = (Number(options.minDuration) + Number(options.maxDuration)) / 2
                return avgMinutes * 60
            }
            if (options.targetDuration) {
                return Number(options.targetDuration) * 60
            }
            // Default: 45 minutes
            return 45 * 60
        })()

        // Run curation
        const result = curateAlbums(albums, { targetSeconds })

        // Format response
        const response = {
            playlists: (result.playlists || []).map(p => ({
                id: p.id,
                name: p.title || p.id,
                subtitle: p.subtitle,
                tracks: (p.tracks || []).map(t => ({
                    id: t.id,
                    title: t.title,
                    artist: t.artist,
                    album: t.album,
                    rating: t.rating,
                    rank: t.rank,
                    duration: t.duration,
                    originAlbumId: t.originAlbumId
                }))
            })),
            summary: result.rankingSummary,
            sources: result.rankingSources
        }

        return res.json(response)
    } catch (err) {
        console.error('Playlist generation error:', err)
        return res.status(500).json({
            error: 'Playlist generation failed',
            message: err.message
        })
    }
})

module.exports = router
