/**
 * F78, REQ-09 (Ref-A): the repositories make the SAME Firestore calls, with the SAME payloads, in
 * the SAME order, wherever they live. Each scenario below drives every public method of a
 * repository against the recording fake (test/helpers/recordingFirestore.js) and compares the log
 * of calls (and of cache calls) with the one recorded on the code BEFORE the repositories moved to
 * shared/data/ (test/fixtures/repositories/write-sequence.json, recorded on `main` at 7a3237b).
 *
 * To record again (only on purpose, and say why in the commit):
 *   RECORD_WRITE_SEQUENCE=1 npx vitest run test/repositories/writeSequence.test.js
 */
import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

vi.mock('firebase/firestore', async () => (await import('../helpers/recordingFirestore.js')).firestoreModule)
vi.mock('../../public/js/firebase-init.js', () => ({ db: { fake: true } }))

import { recorder } from '../helpers/recordingFirestore.js'
import { SeriesRepository } from '../../public/js/repositories/SeriesRepository.js'
import { PlaylistRepository } from '../../public/js/repositories/PlaylistRepository.js'
import { InventoryRepository } from '../../public/js/repositories/InventoryRepository.js'
import { UserRankingRepository } from '../../public/js/repositories/UserRankingRepository.js'
import { SpotifyEnrichmentRepository } from '../../public/js/repositories/SpotifyEnrichmentRepository.js'

const DB = { fake: true }

/** How each repository is built: the only lines that change when the repositories move. */
const build = {
    series: (cache, userId) => new SeriesRepository(DB, cache, userId),
    playlists: (cache, userId, seriesId) => new PlaylistRepository(DB, cache, userId, seriesId),
    inventory: (cache, userId) => new InventoryRepository(DB, cache, userId),
    rankings: (cache) => new UserRankingRepository(cache),
    spotify: (cache) => new SpotifyEnrichmentRepository(DB, cache)
}

const FIXTURE = path.resolve(__dirname, '../fixtures/repositories/write-sequence.json')
const RECORD = !!process.env.RECORD_WRITE_SEQUENCE
const expected = RECORD || !fs.existsSync(FIXTURE) ? {} : JSON.parse(fs.readFileSync(FIXTURE, 'utf8'))
const recorded = {}

/** A cache with the three methods of the real one; its calls go into the same log. */
const makeCache = () => {
    const kept = new Map()
    const note = (name, args) => recorder.note(`cache.${name} ${JSON.stringify(args)}`)
    return {
        get: async (key) => { note('get', [key]); return kept.has(key) ? JSON.parse(JSON.stringify(kept.get(key))) : null },
        set: async (key, value, ttl) => { note('set', [key, ttl ?? null]); kept.set(key, value) },
        invalidate: async (key) => { note('invalidate', [key]); kept.delete(key) }
    }
}

const scenarios = {
    async series() {
        const cache = makeCache()
        const repository = build.series(cache, 'user-1')
        recorder.note('create')
        const id = await repository.create({ name: 'Grunge', albumQueries: [{ artist: 'Pearl Jam', title: 'Ten', extra: 'kept' }] })
        recorder.note('findById twice (the second from the cache)')
        await repository.findById(id)
        await repository.findById(id)
        recorder.note('findAll with where, orderBy, limit')
        await repository.findAll({ where: [['name', '==', 'Grunge']], orderBy: ['name', 'desc'], limit: 5 })
        recorder.note('update, rename')
        await repository.update(id, { name: 'Grunge 2', status: 'ready' })
        await repository.rename(id, '  Grunge 3  ')
        recorder.note('saveAlbumFacts')
        await repository.saveAlbumFacts(id, [{ artist: 'Pearl Jam', title: 'Ten', facts: { year: 1991 } }])
        recorder.note('findWithAlbums, findPlaylists')
        recorder.fake.seed(`artifacts/mjrp-albums/users/user-1/curator/data/series/${id}/albums/a1`, { title: 'Ten' })
        recorder.fake.seed(`artifacts/mjrp-albums/users/user-1/curator/data/series/${id}/playlists/p1`, { name: 'P1' })
        await repository.findWithAlbums(id)
        await repository.findPlaylists(id)
        recorder.note('exists, count, findByField, getCount')
        await repository.exists(id)
        await repository.count()
        await repository.findByField('name', 'Grunge 3')
        await repository.getCount()
        recorder.note('createFromInventory')
        const other = await repository.createFromInventory(['a1'], 'From shelf')
        recorder.note('deleteWithPlaylists, delete')
        await repository.deleteWithPlaylists(id)
        await repository.delete(other)
        recorder.note('deleteMany')
        const third = await repository.create({ name: 'Third' })
        await repository.deleteMany([third])
        return recorder.fake.list('artifacts/mjrp-albums/users/user-1/curator/data/series')
    },

    async playlists() {
        const cache = makeCache()
        const seriesPath = 'artifacts/mjrp-albums/users/user-1/curator/data/series'
        recorder.fake.seed(`${seriesPath}/s1`, { name: 'Series', _schemaVersion: 1 })
        recorder.fake.seed(`${seriesPath}/s1/playlists/old`, { name: 'Old', tracks: [], _schemaVersion: 1 })
        recorder.fake.seed(`${seriesPath}/s1/playlists/keep`, { name: 'Keep', tracks: [{ title: 'A', duration: 100 }], mood: 'unknown field', _schemaVersion: 1 })
        const repository = build.playlists(cache, 'user-1', 's1')
        recorder.note('replaceBatch: one kept, one new, one removed')
        const stored = await repository.replaceBatch([
            { id: 'keep', name: 'Keep renamed', tracks: [{ title: 'A', duration: 100 }] },
            { name: 'Brand new', tracks: [{ title: 'B', duration: 50 }] }
        ], ['old', 'keep'])
        recorder.note('updateTracks, rename, getTotalDuration')
        await repository.updateTracks('keep', [{ title: 'A', duration: 120 }, { title: 'C', duration: 30 }])
        await repository.rename('keep', 'Kept')
        await repository.getTotalDuration('keep')
        recorder.note('findAll, deleteMany')
        await repository.findAll()
        await repository.deleteMany([stored[1].id])
        return recorder.fake.list(`${seriesPath}/s1/playlists`)
    },

    async inventory() {
        const cache = makeCache()
        const repository = build.inventory(cache, 'user-1')
        const album = { id: 'alb-1', title: 'Ten', artist: 'Pearl Jam', year: 1991, coverUrl: 'https://example.com/ten.jpg' }
        recorder.note('addAlbum')
        const itemId = await repository.addAlbum(album, 'vinyl', { purchasePrice: 30, currency: 'BRL', notes: 'first' })
        recorder.note('addBatch')
        const [secondId] = await repository.addBatch([{ id: 'alb-2', title: 'Vs.', artist: 'Pearl Jam' }, { id: 'alb-3', title: 'Core', artist: 'STP' }])
        recorder.note('updateAlbum with a written value')
        await repository.updateAlbum(itemId, { format: 'cd', owned: true, value: { amount: 25.5, currency: 'USD', at: '2026-11-20T12:00:00.000Z' }, ignored: 'x' })
        recorder.note('setAverages, setEditions, updatePrice')
        await repository.setAverages([{ id: itemId, averages: { bea: 85, undefinedOne: undefined } }, { id: secondId, coverUrl: 'https://example.com/vs.jpg' }])
        await repository.setEditions([{ id: itemId, discogs: { releaseId: 123, title: 'Ten (LP)' } }])
        await repository.updatePrice(itemId, 40, 'USD')
        recorder.note('findByAlbumId twice, findByFormat, getStatistics, search')
        await repository.findByAlbumId('alb-1')
        await repository.findByAlbumId('alb-1')
        await repository.findByFormat('cd')
        await repository.getStatistics()
        await repository.search('pearl')
        recorder.note('removeAlbum')
        await repository.removeAlbum(itemId)
        return recorder.fake.list('artifacts/mjrp-albums/users/user-1/inventory')
    },

    async rankings() {
        const cache = makeCache()
        const repository = build.rankings(cache)
        recorder.note('saveRanking: new, then existing')
        await repository.saveRanking('user-1', 'alb/1', { albumTitle: 'Ten', artistName: 'Pearl Jam', rankings: [{ trackTitle: 'Once', userRank: 1 }] })
        await repository.saveRanking('user-1', 'alb/1', { rankings: [{ trackTitle: 'Once', userRank: 2 }] })
        recorder.note('getRanking twice, hasRanking, getAllRankings')
        await repository.getRanking('user-1', 'alb/1')
        await repository.getRanking('user-1', 'alb/1')
        await repository.hasRanking('user-1', 'alb-none')
        await repository.getAllRankings('user-1')
        recorder.note('deleteRanking')
        await repository.deleteRanking('user-1', 'alb/1')
        return recorder.fake.list('users/user-1/albumRankings')
    },

    async spotify() {
        const cache = makeCache()
        const repository = build.spotify(cache)
        recorder.note('saveEnrichment, getByArtistAlbum twice, findById of a missing key')
        await repository.saveEnrichment('Sigur Rós', 'Ágætis byrjun', { spotifyId: 'sp-1', popularity: 61 })
        await repository.getByArtistAlbum('Sigur Rós', 'Ágætis byrjun')
        await repository.getByArtistAlbum('Sigur Rós', 'Ágætis byrjun')
        await repository.findById('missing')
        return recorder.fake.list('spotify_enrichment')
    }
}

describe('the repositories make the same Firestore calls as before the move (F78, REQ-09)', () => {
    beforeEach(() => {
        recorder.reset()
        vi.useFakeTimers({ toFake: ['Date'] })
        vi.setSystemTime(new Date('2026-11-20T15:00:00.000Z'))
        vi.spyOn(console, 'log').mockImplementation(() => {})
        vi.spyOn(console, 'warn').mockImplementation(() => {})
    })
    afterEach(() => {
        vi.useRealTimers()
        vi.restoreAllMocks()
    })
    afterAll(() => {
        if (!RECORD) return
        fs.mkdirSync(path.dirname(FIXTURE), { recursive: true })
        fs.writeFileSync(FIXTURE, JSON.stringify(recorded, null, 1) + '\n')
    })

    for (const name of Object.keys(scenarios)) {
        it(`${name}: the same calls, payloads and order, and the same documents left`, async () => {
            const documents = await scenarios[name]()
            const outcome = { calls: recorder.calls(), documents }
            recorded[name] = outcome
            if (RECORD) return
            expect(outcome.calls.length).toBeGreaterThan(10)
            expect(outcome).toEqual(expected[name])
        })
    }
})
