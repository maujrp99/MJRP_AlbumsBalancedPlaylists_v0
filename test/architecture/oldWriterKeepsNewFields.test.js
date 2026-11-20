/**
 * F78, REQ-10 (proposal § 6.2 and § 11): an old writer does not erase what a newer one wrote.
 * A version of the app stays installed after the site and the data change; site and app write
 * through the same repositories (shared/data/), so the rules hold there:
 *
 *   - a field the writer does not know survives its write, at the root of the document and inside
 *     an object of a list it hands back (`albumQueries`, `tracks`);
 *   - `_schemaVersion` never goes down: a write keeps the higher of the writer's version and the
 *     one of the document as the writer read it (BaseRepository.save). The Firestore rules refuse
 *     a write that would lower it anyway (firestore.rules, test/security/firestoreRules.test.js).
 *
 * A "new writer" is the same repository with a higher `schemaVersion`; it writes a field no code
 * knows today. The "old writer" is today's code (version 1). The in-memory Firestore applies
 * `merge` and `update` as the real one does (test/helpers/fakeFirestore.js).
 *
 * What does NOT hold today, and is left to Ref-B (no write changes shape here; recorded in the
 * plan of F78, § Technical Design, «Convivência: casos abertos»):
 *   - SpotifyEnrichmentRepository.saveEnrichment and any `save` given a payload that was not read
 *     from the document: the writer does not know the stored version, so it writes its own; the
 *     rules refuse that write when the stored version is higher (refused, not lowered).
 *   - UserRankingRepository.saveRanking hands the whole `rankings` list: a field inside an entry
 *     survives only if the caller hands the entry back as it read it.
 *   - A document with a higher version is not opened read-only yet (rule 3 of § 6.2): that is the
 *     use case's answer, with the screen's text, in Ref-B.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('firebase/firestore', async () => (await import('../helpers/fakeFirestore.js')).firestoreModule)

import { fake } from '../helpers/fakeFirestore.js'
import { firestoreStore } from '../../public/js/repositories/firestoreStore.js'
import { SeriesRepository } from '../../shared/data/SeriesRepository.js'
import { PlaylistRepository } from '../../shared/data/PlaylistRepository.js'
import { InventoryRepository } from '../../shared/data/InventoryRepository.js'
import { UserRankingRepository } from '../../shared/data/UserRankingRepository.js'
import { SpotifyEnrichmentRepository } from '../../shared/data/SpotifyEnrichmentRepository.js'

const store = () => firestoreStore({ fake: true })
const noCache = null
const memoryCache = () => ({ get: async () => null, set: async () => {}, invalidate: async () => {} })
/** The same repository, as a newer version of the app would write with it. */
const newer = (repository) => Object.assign(repository, { schemaVersion: 2 })

const SERIES = 'artifacts/mjrp-albums/users/user-1/curator/data/series'
const INVENTORY = 'artifacts/mjrp-albums/users/user-1/inventory'

describe('an old writer keeps what a newer one wrote (F78, REQ-10)', () => {
    beforeEach(() => {
        fake.reset()
        vi.spyOn(console, 'log').mockImplementation(() => {})
    })

    describe('playlists: the save of a batch writes each playlist whole (BaseRepository.save, merge)', () => {
        it('the old writer renames a playlist the new one made: the version stays 2 and no unknown field is lost', async () => {
            fake.seed(`${SERIES}/s1`, { name: 'Series', _schemaVersion: 1 })
            const [made] = await newer(new PlaylistRepository(store(), noCache, 'user-1', 's1'))
                .replaceBatch([{ name: 'Made by v2', mood: 'calm', tracks: [{ title: 'A', tempo: 92 }] }])

            const oldWriter = new PlaylistRepository(store(), noCache, 'user-1', 's1')
            const [asRead] = await oldWriter.findAll()
            await oldWriter.replaceBatch([{ ...asRead, name: 'Renamed by v1' }])

            const stored = fake.get(`${SERIES}/s1/playlists/${made.id}`)
            expect(stored._schemaVersion).toBe(2)
            expect(stored.name).toBe('Renamed by v1')
            expect(stored.mood).toBe('calm')
            expect(stored.tracks).toEqual([{ title: 'A', tempo: 92 }])
        })

        it('a field at the root the old writer was not handed survives too (the write merges)', async () => {
            fake.seed(`${SERIES}/s1`, { name: 'Series', _schemaVersion: 1 })
            fake.seed(`${SERIES}/s1/playlists/p1`, { name: 'P', tracks: [], mood: 'calm', _schemaVersion: 2 })

            await new PlaylistRepository(store(), noCache, 'user-1', 's1').replaceBatch([{ id: 'p1', name: 'P2', tracks: [], _schemaVersion: 2 }])

            expect(fake.get(`${SERIES}/s1/playlists/p1`)).toMatchObject({ name: 'P2', mood: 'calm', _schemaVersion: 2 })
        })

        it('a writer newer than the document raises the version; one of the same version keeps it', async () => {
            fake.seed(`${SERIES}/s1`, { name: 'Series', _schemaVersion: 1 })
            fake.seed(`${SERIES}/s1/playlists/p1`, { name: 'P', tracks: [], _schemaVersion: 1 })
            fake.seed(`${SERIES}/s1/playlists/p2`, { name: 'Q', tracks: [], _schemaVersion: 1 })

            await newer(new PlaylistRepository(store(), noCache, 'user-1', 's1')).replaceBatch([{ id: 'p1', name: 'P', tracks: [], _schemaVersion: 1 }])
            await new PlaylistRepository(store(), noCache, 'user-1', 's1').replaceBatch([{ id: 'p2', name: 'Q', tracks: [], _schemaVersion: 1 }])

            expect(fake.get(`${SERIES}/s1/playlists/p1`)._schemaVersion).toBe(2)
            expect(fake.get(`${SERIES}/s1/playlists/p2`)._schemaVersion).toBe(1)
        })
    })

    describe('series: edits are updates of the fields that changed', () => {
        it('rename and the facts of the albums leave the version and the unknown fields as they were', async () => {
            const id = await newer(new SeriesRepository(store(), noCache, 'user-1'))
                .create({ name: 'Grunge', palette: 'dark', albumQueries: [{ artist: 'Pearl Jam', title: 'Ten', pinned: true }] })

            const oldWriter = new SeriesRepository(store(), noCache, 'user-1')
            await oldWriter.rename(id, 'Grunge 90s')
            const asRead = await oldWriter.findById(id)
            await oldWriter.saveAlbumFacts(id, asRead.albumQueries.map(query => ({ ...query, facts: { year: 1991 } })))

            const stored = fake.get(`${SERIES}/${id}`)
            expect(stored._schemaVersion).toBe(2)
            expect(stored.name).toBe('Grunge 90s')
            expect(stored.palette).toBe('dark')
            expect(stored.albumQueries).toEqual([{ artist: 'Pearl Jam', title: 'Ten', pinned: true, facts: { year: 1991 } }])
        })
    })

    describe('inventory: every change is an update of its fields', () => {
        it('a change of format, of price, of averages leaves the version and the unknown fields', async () => {
            const id = await newer(new InventoryRepository(store(), memoryCache(), 'user-1'))
                .create({ title: 'Ten', artist: 'Pearl Jam', format: 'cd', shelf: 'B3', albumData: { id: 'alb-1', label: 'Epic' } })

            const oldWriter = new InventoryRepository(store(), memoryCache(), 'user-1')
            await oldWriter.updateAlbum(id, { format: 'vinyl' })
            await oldWriter.updatePrice(id, 30, 'USD')
            await oldWriter.setAverages([{ id, averages: { bea: 85 }, coverUrl: 'https://example.com/ten.jpg' }])

            const stored = fake.get(`${INVENTORY}/${id}`)
            expect(stored).toMatchObject({ _schemaVersion: 2, shelf: 'B3', format: 'vinyl', purchasePrice: 30 })
            expect(stored.albumData).toEqual({ id: 'alb-1', label: 'Epic', coverUrl: 'https://example.com/ten.jpg' })
        })
    })

    describe('own ranking: saved with merge, with no version of its own', () => {
        it('saving a ranking again keeps the version and the unknown fields a newer writer put there', async () => {
            fake.seed('users/user-1/albumRankings/alb-1', { albumId: 'alb-1', rankings: [], note: 'kept', _schemaVersion: 2 })

            await new UserRankingRepository(store(), memoryCache()).saveRanking('user-1', 'alb-1', { rankings: [{ trackTitle: 'Once', userRank: 1 }] })

            expect(fake.get('users/user-1/albumRankings/alb-1')).toMatchObject({ note: 'kept', _schemaVersion: 2, rankings: [{ trackTitle: 'Once', userRank: 1 }] })
        })
    })

    describe('Spotify answers: a shared cache keyed by album', () => {
        it('a save keeps the unknown fields at the root (the write merges)', async () => {
            const repository = new SpotifyEnrichmentRepository(store(), memoryCache())
            const key = repository.normalizeKey('Pearl Jam', 'Ten')
            fake.seed(`spotify_enrichment/${key}`, { spotifyId: 'sp-1', markets: ['BR'], _schemaVersion: 1 })

            await repository.saveEnrichment('Pearl Jam', 'Ten', { spotifyId: 'sp-1', popularity: 70 })

            expect(fake.get(`spotify_enrichment/${key}`)).toMatchObject({ markets: ['BR'], popularity: 70, _schemaVersion: 1 })
        })
    })
})
