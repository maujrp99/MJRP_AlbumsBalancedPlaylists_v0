/**
 * F58, second slice (UAT-18) - what the app holds of an earlier answer of Spotify about an album.
 *
 * The popularity source of the album load asks two things of it: "what do we already hold for
 * this album?" (get) and "keep this" (save). It used to be a "store" that imported Firestore; it
 * is a service over SpotifyEnrichmentRepository now. These cases pin what is stored and where, so
 * that nothing already in the database stops being read: the collection, the document id and the
 * fields are the ones of before, and so is the rule that says when a stored answer is trusted.
 * (They were run against the old store before it was removed: all passed there too.)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('firebase/firestore', async () => (await import('../../helpers/fakeFirestore.js')).firestoreModule)

import { fake } from '../../helpers/fakeFirestore.js'
import { SpotifyEnrichmentRepository } from '../../../shared/data/SpotifyEnrichmentRepository.js'
import { firestoreStore } from '../../../public/js/repositories/firestoreStore.js'
import { StoredSpotifyPopularity } from '../../../public/js/services/spotify/StoredSpotifyPopularity.js'

const DAY = 24 * 60 * 60 * 1000
const NOW = Date.UTC(2026, 10, 19)
const DATA = {
    spotifyId: 'sp1', spotifyUrl: 'https://open.spotify.com/album/sp1', spotifyPopularity: 60, spotifyArtwork: null,
    trackPopularity: [{ name: 'One', popularity: 70, spotifyId: 'x1', spotifyUri: 'u1' }]
}
const PATH = 'spotify_enrichment/beyonce-lemonade-deluxe'

/** A cache that keeps nothing: every read goes to the database. */
const noCache = () => ({ get: async () => null, set: async () => {}, invalidate: async () => {} })

const build = (cache = noCache()) =>
    new StoredSpotifyPopularity({ repository: new SpotifyEnrichmentRepository(firestoreStore({}), cache) })

describe('StoredSpotifyPopularity: what is held of an earlier answer of Spotify', () => {
    beforeEach(() => {
        fake.reset()
        vi.useFakeTimers({ toFake: ['Date'] })
        vi.setSystemTime(NOW)
        vi.spyOn(console, 'log').mockImplementation(() => {})
        vi.spyOn(console, 'error').mockImplementation(() => {})
    })
    afterEach(() => {
        vi.useRealTimers()
        vi.restoreAllMocks()
    })

    it('"keep this" writes one document of the shared collection, named after the artist and the album, with the fields of before', async () => {
        await build().save('Beyoncé', 'Lemonade (Deluxe)', DATA)

        expect(fake.list('spotify_enrichment').map(doc => doc.id)).toEqual(['beyonce-lemonade-deluxe'])
        expect(fake.get(PATH)).toEqual({
            ...DATA,
            artist: 'Beyoncé',
            album: 'Lemonade (Deluxe)',
            enrichedAt: NOW,
            schemaVersion: 1,
            _schemaVersion: 1,
            updatedAt: 'server-time'
        })
    })

    it('"what do we hold?" answers what was kept, whatever the case and the accents of the names asked', async () => {
        const held = build()
        await held.save('Beyoncé', 'Lemonade (Deluxe)', DATA)

        expect(await held.get('BEYONCE', 'lemonade deluxe')).toMatchObject({ ...DATA, id: 'beyonce-lemonade-deluxe' })
    })

    it('nothing kept for the album: null', async () => {
        expect(await build().get('Nobody', 'Nothing')).toBeNull()
    })

    it('a document written before today, with no mark of the identity rule, is trusted for 30 days', async () => {
        fake.seed(PATH, { ...DATA, artist: 'Beyoncé', album: 'Lemonade (Deluxe)', enrichedAt: NOW - 29 * DAY, schemaVersion: 1 })

        expect(await build().get('Beyoncé', 'Lemonade (Deluxe)')).toMatchObject({ spotifyId: 'sp1', spotifyPopularity: 60 })
    })

    it('after 30 days it is not an answer any more, and the document is left where it is', async () => {
        fake.seed(PATH, { ...DATA, enrichedAt: NOW - 31 * DAY, schemaVersion: 1 })

        expect(await build().get('Beyoncé', 'Lemonade (Deluxe)')).toBeNull()
        expect(fake.get(PATH)).not.toBeNull()
        expect(fake.writes()).toEqual([])
    })

    it('a document of another format, or with no Spotify id, is not an answer', async () => {
        fake.seed(PATH, { ...DATA, enrichedAt: NOW, schemaVersion: 2 })
        expect(await build().get('Beyoncé', 'Lemonade (Deluxe)')).toBeNull()

        fake.seed(PATH, { ...DATA, spotifyId: null, enrichedAt: NOW, schemaVersion: 1 })
        expect(await build().get('Beyoncé', 'Lemonade (Deluxe)')).toBeNull()
    })

    it('the database cannot be read: null, never a throw (the popularity source goes on to ask Spotify)', async () => {
        fake.seed(PATH, { ...DATA, enrichedAt: NOW, schemaVersion: 1 })
        fake.failNext('read')

        expect(await build().get('Beyoncé', 'Lemonade (Deluxe)')).toBeNull()
    })

    it('the database cannot be written: "keep this" throws, and nothing is left half written', async () => {
        fake.failNext('set', new Error('permission-denied'))

        await expect(build().save('Beyoncé', 'Lemonade (Deluxe)', DATA)).rejects.toThrow('permission-denied')
        expect(fake.get(PATH)).toBeNull()
    })

    it('what was just read is answered from the cache it was given, without a second read of the database', async () => {
        const kept = new Map()
        const cache = {
            get: async (key) => kept.get(key) ?? null,
            set: async (key, value) => { kept.set(key, value) },
            invalidate: async (key) => { kept.delete(key) }
        }
        fake.seed(PATH, { ...DATA, enrichedAt: NOW, schemaVersion: 1 })
        const held = build(cache)

        await held.get('Beyoncé', 'Lemonade (Deluxe)')
        await held.get('Beyoncé', 'Lemonade (Deluxe)')

        expect(fake.reads()).toEqual([PATH])
        expect([...kept.keys()]).toEqual(['spotify_enrichment:beyonce-lemonade-deluxe'])
    })
})
