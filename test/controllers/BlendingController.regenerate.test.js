/**
 * F60 (UAT-197) - generating again keeps the playlists in the series they belong to. The series
 * of the set on screen used to be overwritten by whatever series was active elsewhere, and the
 * next save went there.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../public/js/api/client.js', () => ({ apiClient: {} }))
vi.mock('../../public/js/repositories/UserRankingRepository.js', () => ({ userRankingRepository: {} }))
vi.mock('../../public/js/services/PlaylistGenerationService.js', () => ({
    playlistGenerationService: { generate: vi.fn(() => ({ playlists: [{ name: 'Again 1', tracks: [] }], stats: {} })) }
}))
vi.mock('../../public/js/stores/albums.js', () => ({
    albumsStore: { getAlbums: () => [{ id: 'a1', title: 'Animals' }] }
}))

import { blendingController } from '../../public/js/controllers/BlendingController.js'
import { playlistsStore } from '../../public/js/stores/playlists.js'
import { albumSeriesStore } from '../../public/js/stores/albumSeries.js'

describe('BlendingController.regenerate', () => {
    beforeEach(() => {
        playlistsStore.reset()
        albumSeriesStore.setSeries([{ id: 'sA', name: 'Series A' }, { id: 'sB', name: 'Series B' }])
    })

    it('keeps the series of the playlists on screen when another series is the active one', async () => {
        playlistsStore.setPlaylists([{ id: 'p1', name: 'Rock 1', tracks: [] }], 'sA')
        albumSeriesStore.setActiveSeries('sB')

        await blendingController.regenerate({ algorithmId: 'x' })

        expect(playlistsStore.getPlaylists().map(p => p.name)).toEqual(['Again 1'])
        expect(playlistsStore.getSeriesId()).toBe('sA')
    })

    it('takes the active series when nothing on screen says which series it is', async () => {
        albumSeriesStore.setActiveSeries('sB')

        await blendingController.regenerate({ algorithmId: 'x' })

        expect(playlistsStore.getSeriesId()).toBe('sB')
    })
})
