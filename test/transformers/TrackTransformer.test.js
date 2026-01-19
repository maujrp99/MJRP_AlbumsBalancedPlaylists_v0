import { describe, it, expect } from 'vitest'
import { TrackTransformer } from '../../public/js/transformers/TrackTransformer.js'

describe('TrackTransformer', () => {

    describe('toCanonical', () => {
        it('should preserve ranking evidence (Sprint 23)', () => {
            const rawTrack = {
                title: 'Track A',
                evidence: [
                    { source: 'BestEverAlbums', score: 90 },
                    { source: 'Spotify', score: 75 }
                ],
                rating: 90
            }

            const canonical = TrackTransformer.toCanonical(rawTrack)

            // Verify Conslidated Schema
            expect(canonical.ranking).toBeDefined()
            expect(canonical.ranking.evidence).toHaveLength(2)
            expect(canonical.ranking.evidence[0].source).toBe('BestEverAlbums')

            // Verify Backward Compatibility
            expect(canonical.rating).toBe(90)
        })

        it('should handle missing evidence gracefully', () => {
            const rawTrack = { title: 'Track B' }
            const canonical = TrackTransformer.toCanonical(rawTrack)

            expect(canonical.ranking).toBeDefined()
            expect(canonical.ranking.evidence).toEqual([])
        })
    })

})
