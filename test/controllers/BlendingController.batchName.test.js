/**
 * UAT-225 - the default name of a new batch says the date and the hour of the same clock: the
 * person's. It used to take the day from UTC and the hour from the local clock, so a batch made at
 * 23:21 in São Paulo was named with the next day.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'

process.env.TZ = 'America/Sao_Paulo'

vi.mock('../../public/js/services/albums/albumLoading.js', () => ({ albumAsks: { albumsOf: vi.fn() } }))
vi.mock('../../public/js/services/PlaylistGenerationService.js', () => ({ playlistGenerationService: { generate: vi.fn() } }))

import { BlendingController } from '../../public/js/controllers/BlendingController.js'

describe('the stamped batch name (UAT-225)', () => {
    afterEach(() => vi.useRealTimers())

    it('late at night, takes the day and the hour of the same local clock', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-11-20T02:21:00Z')) // 23:21 of the 19th in São Paulo
        expect(new BlendingController()._generateDefaultBatchName()).toBe('TheAlbumBlender Playlist 2026-11-19 23:21')
    })

    it('in the morning, the same day', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-11-20T12:05:00Z')) // 09:05 of the 20th in São Paulo
        expect(new BlendingController()._generateDefaultBatchName()).toBe('TheAlbumBlender Playlist 2026-11-20 09:05')
    })
})
