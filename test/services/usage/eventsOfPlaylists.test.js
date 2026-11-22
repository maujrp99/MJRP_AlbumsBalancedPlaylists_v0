/**
 * F77, REQ-02: the ranking saved, the playlists generated, saved and exported are measured where
 * they work (the services), after the work is done. A failure is not a success; an export says how
 * it ended. No name of playlist, batch or series leaves (REQ-03).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('../../../public/js/components/Toast.js', () => {
    const toast = { info: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn() }
    return { default: toast, toast }
})

import { recordUsage, stopRecording } from '../../helpers/usageRecorder.js'
import { track } from '../../../public/js/services/usage/track.js'
import { OwnRankingService } from '../../../public/js/services/ranking/OwnRankingService.js'
import { OwnRankingsStore } from '../../../public/js/stores/ownRankings.js'
import { playlistGenerationService } from '../../../public/js/services/PlaylistGenerationService.js'
import { PlaylistsService } from '../../../public/js/services/PlaylistsService.js'
import { PlaylistHistoryService } from '../../../public/js/services/playlists/PlaylistHistoryService.js'
import { SpotifyExportService } from '../../../public/js/services/SpotifyExportService.js'
import { SpotifyAuthService } from '../../../public/js/services/SpotifyAuthService.js'
import { AppleMusicExportService } from '../../../public/js/services/AppleMusicExportService.js'
import { exportLedger } from '../../../public/js/services/export/exportLedger.js'
import { handleExportJson } from '../../../public/js/controllers/playlistExports.js'
import { exportOutcome } from '../../../public/js/models/exportOutcome.js'
import { playlistsStore } from '../../../public/js/stores/playlists.js'

const storage = { save: vi.fn(), load: vi.fn(() => null), remove: vi.fn() }
const album = (id, titles) => ({
    id, title: `Album ${id}`, artist: 'Artist',
    tracks: titles.map((title, index) => ({ id: `${id}-${index}`, title, duration: 240, spotifyPopularity: 50 + index, rating: 80 - index, position: index + 1 }))
})

let sent
beforeEach(async () => {
    vi.spyOn(console, 'log').mockImplementation(() => { })
    vi.spyOn(console, 'error').mockImplementation(() => { })
    playlistsStore.reset()
    exportLedger.clear?.()
    sent = await recordUsage()
})
afterEach(() => {
    stopRecording()
    vi.restoreAllMocks()
})

describe('ranking_saved', () => {
    const service = (saveRanking) => new OwnRankingService({
        store: new OwnRankingsStore(), getUserId: () => 'u1', getAllRankings: async () => [], saveRanking, measure: track
    })

    it('with how many tracks were ranked, after the write', async () => {
        await service(async () => true).save({ id: 'a1', title: 'Animals', artist: 'Pink Floyd' }, [{ trackTitle: 'Dogs', userRank: 1 }, { trackTitle: 'Pigs', userRank: 2 }])
        expect(sent).toEqual([['ranking_saved', { track_count: 2 }]])
    })

    it('not when the write did not happen', async () => {
        await service(async () => false).save({ id: 'a1', title: 'Animals', artist: 'Pink Floyd' }, [])
        expect(sent).toEqual([])
    })
})

describe('playlists_generated', () => {
    it('with the recipe, how many playlists and how many tracks', () => {
        const result = playlistGenerationService.generate([album('r', ['One', 'Two', 'Three']), album('j', ['Four', 'Five'])],
            { algorithmId: 'top-n-popular', trackCount: 2, outputMode: 'single', groupingStrategy: 'by_album' })

        expect(sent).toEqual([['playlists_generated', { recipe: 'top-n-popular', playlist_count: result.playlists.length, track_count: 4 }]])
    })

    it('not when the recipe could not run', () => {
        expect(() => playlistGenerationService.generate([], { algorithmId: 'no-such-recipe' })).toThrow()
        expect(sent).toEqual([])
    })
})

describe('playlists_saved', () => {
    const serviceWith = (repository) => new PlaylistsService({}, {}, storage, new PlaylistHistoryService(), { playlistRepositoryFor: () => repository })
    const repository = () => ({
        findAll: vi.fn(async () => [{ id: 'p1', batchName: 'Rock' }]),
        replaceBatch: vi.fn(async (playlists) => playlists.map((p, order) => ({ ...p, order, id: p.id || `new-${order}` })))
    })

    it('a new batch: how many playlists, never the name of the batch', async () => {
        playlistsStore.setPlaylists([{ name: 'Mix 1', tracks: [] }, { name: 'Mix 2', tracks: [] }], 'sA')
        await serviceWith(repository()).saveCurrentBatch({ userId: 'u1', batchName: 'My private mix' })
        expect(sent).toEqual([['playlists_saved', { playlist_count: 2, batch: 'new' }]])
    })

    it('a batch being edited', async () => {
        const service = serviceWith(repository())
        service.setEditMode('Rock', 'sA', null)
        playlistsStore.setPlaylists([{ id: 'p1', name: 'Rock 1', batchName: 'Rock', tracks: [] }], 'sA')
        await service.saveCurrentBatch({ userId: 'u1', batchName: 'Rock' })
        expect(sent).toEqual([['playlists_saved', { playlist_count: 1, batch: 'edited' }]])
    })

    it('not when the write fails', async () => {
        const failing = repository()
        failing.replaceBatch.mockRejectedValue(new Error('offline'))
        playlistsStore.setPlaylists([{ name: 'Mix 1', tracks: [] }], 'sA')
        await expect(serviceWith(failing).saveCurrentBatch({ userId: 'u1', batchName: 'Mix' })).rejects.toThrow('offline')
        expect(sent).toEqual([])
    })
})

describe('exportOutcome: how an export ended', () => {
    it.each([
        ['everything created', { created: [{}, {}], failure: null }, 'complete'],
        ['created, some left out', { created: [{}], empty: ['x'], failure: null }, 'partial'],
        ['created, one incomplete', { created: [], incomplete: [{}], failure: null }, 'partial'],
        ['created, then stopped', { created: [{}], notCreated: ['y'], failure: { kind: 'rate-limit' } }, 'partial'],
        ['Apple said no to one', { created: [{}], failed: [{}], failure: null }, 'partial'],
        ['never began', { created: [], notCreated: ['a'], failure: { kind: 'reconnect' } }, 'failed'],
        ['nothing found', { created: [], empty: ['a'], failure: null }, 'failed']
    ])('%s', (label, report, outcome) => {
        expect(exportOutcome(report)).toBe(outcome)
    })
})

describe('playlists_exported', () => {
    const playlists = [{ name: 'Mix 1', tracks: [{ title: 'One', artist: 'A' }] }, { name: 'Mix 2', tracks: [{ title: 'Two', artist: 'A' }] }]

    it('to Spotify: the target, how it ended, how many playlists', async () => {
        vi.spyOn(SpotifyAuthService, 'getAccessToken').mockResolvedValue('token')
        vi.spyOn(SpotifyExportService, '_match').mockResolvedValue()
        vi.spyOn(SpotifyExportService, '_deliverAll').mockImplementation(async (targets, report) => {
            report.created = targets.map(target => ({ name: target.name }))
        })
        await SpotifyExportService.exportPlaylists(playlists, { mode: 'separate', name: 'Secret name' })
        expect(sent).toEqual([['playlists_exported', { target: 'spotify', outcome: 'complete', playlist_count: 2 }]])
    })

    it('to Spotify, when it never began', async () => {
        vi.spyOn(SpotifyAuthService, 'getAccessToken').mockResolvedValue(null)
        await SpotifyExportService.exportPlaylists(playlists, { mode: 'merge', name: 'x' })
        expect(sent).toEqual([['playlists_exported', { target: 'spotify', outcome: 'failed', playlist_count: 2 }]])
    })

    it('to Apple Music', async () => {
        const musicKit = {
            init: async () => { }, authorize: async () => { }, createOrGetFolder: async () => 'f1',
            findTrackFromAlbum: async (title) => (title === 'One' ? { id: '101' } : null),
            createPlaylistInFolder: async (name) => ({ id: name })
        }
        vi.spyOn(AppleMusicExportService, 'pause').mockResolvedValue()
        await AppleMusicExportService.exportPlaylists(playlists, { seriesName: 'S', batchName: 'B' }, { musicKit })
        expect(sent).toEqual([['playlists_exported', { target: 'apple_music', outcome: 'partial', playlist_count: 2 }]])
    })

    it('as a JSON file', () => {
        URL.createObjectURL = vi.fn(() => 'blob:x')
        URL.revokeObjectURL = vi.fn()
        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => { })
        handleExportJson(playlists)
        expect(sent).toEqual([['playlists_exported', { target: 'json', outcome: 'complete', playlist_count: 2 }]])
    })
})
