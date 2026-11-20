/**
 * F58, second slice (UAT-19) - the playlists service is put together in ONE place
 * (services/playlists/playlistsWiring.js): there it is handed the database, the cache and the
 * person signed in. Controllers and components ask it; none of them brings a database, the login
 * or a repository along.
 *
 * The wiring is the real one; Firestore is the in-memory double and the login is a stand-in.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const session = vi.hoisted(() => ({ auth: { currentUser: { uid: 'u1' } } }))

vi.mock('firebase/firestore', async () => (await import('../../helpers/fakeFirestore.js')).firestoreModule)
vi.mock('../../../public/js/firebase-init.js', () => ({ db: { fake: true }, auth: session.auth }))
vi.mock('../../../public/js/cache/CacheManager.js', () => {
    const cacheManager = { get: async () => null, set: async () => { }, invalidate: async () => { } }
    return { cacheManager, CacheManager: class { } }
})

import { fake } from '../../helpers/fakeFirestore.js'
import { getPlaylistsService } from '../../../public/js/services/playlists/playlistsWiring.js'
import { PlaylistsService } from '../../../public/js/services/PlaylistsService.js'
import { playlistsStore } from '../../../public/js/stores/playlists.js'
import { albumSeriesStore } from '../../../public/js/stores/albumSeries.js'

const seriesPath = (userId, seriesId) => `artifacts/mjrp-albums/users/${userId}/curator/data/series/${seriesId}`
const savedOf = (userId, seriesId) => fake.list(`${seriesPath(userId, seriesId)}/playlists`).sort((a, b) => a.order - b.order)
const flush = () => new Promise(resolve => setTimeout(resolve, 0))

describe('playlistsWiring: the one place the playlists service is put together', () => {
    beforeEach(() => {
        fake.reset()
        session.auth.currentUser = { uid: 'u1' }
        albumSeriesStore.setUserId('u1')
        getPlaylistsService().reset()
        fake.seed(seriesPath('u1', 'sA'), { name: 'Series A' })
        fake.seed(seriesPath('u2', 'sA'), { name: 'Series A of another person' })
    })

    it('gives the same service to everyone who asks, and nobody hands it anything', () => {
        expect(getPlaylistsService()).toBeInstanceOf(PlaylistsService)
        expect(getPlaylistsService()).toBe(getPlaylistsService())
        expect(getPlaylistsService.length).toBe(0)
    })

    it('a save with no person named goes to the series of the person signed in', async () => {
        playlistsStore.setPlaylists([{ name: 'Mix 1', tracks: [{ title: 'T1' }] }], 'sA')

        const result = await getPlaylistsService().saveCurrentBatch({ batchName: 'Mix' })

        expect(result.status).toBe('saved')
        expect(savedOf('u1', 'sA').map(p => [p.name, p.batchName])).toEqual([['Mix 1', 'Mix']])
        expect(savedOf('u2', 'sA')).toEqual([])
    })

    it('the person is read when the save is asked, not when the service was made', async () => {
        session.auth.currentUser = { uid: 'u2' }
        playlistsStore.setPlaylists([{ name: 'Mix 1', tracks: [] }], 'sA')

        await getPlaylistsService().saveCurrentBatch({ batchName: 'Mix' })

        expect(savedOf('u2', 'sA')).toHaveLength(1)
        expect(savedOf('u1', 'sA')).toEqual([])
    })

    it('nobody signed in: the save goes where it always went, to «anonymous-user»', async () => {
        session.auth.currentUser = null
        fake.seed(seriesPath('anonymous-user', 'sA'), { name: 'Series A' })
        playlistsStore.setPlaylists([{ name: 'Mix 1', tracks: [] }], 'sA')

        await getPlaylistsService().saveCurrentBatch({ batchName: 'Mix' })

        expect(savedOf('anonymous-user', 'sA')).toHaveLength(1)
    })

    it('reads one saved batch of a series of the person signed in, in the order it was saved', async () => {
        const playlists = `${seriesPath('u1', 'sA')}/playlists`
        fake.seed(`${playlists}/p2`, { name: 'Rock 2', batchName: 'Rock', order: 1, tracks: [] })
        fake.seed(`${playlists}/p1`, { name: 'Rock 1', batchName: ' Rock ', order: 0, tracks: [] })
        fake.seed(`${playlists}/j1`, { name: 'Jazz 1', batchName: 'Jazz', order: 0, tracks: [] })
        fake.seed(`${playlists}/old`, { name: 'No batch', order: 0, tracks: [] })
        fake.seed(`${seriesPath('u2', 'sA')}/playlists/x`, { name: 'Of another person', batchName: 'Rock', order: 0, tracks: [] })

        const batch = await getPlaylistsService().findBatch('sA', 'Rock')

        expect(batch.map(p => p.name)).toEqual(['Rock 1', 'Rock 2'])
        expect(playlistsStore.getPlaylists()).toEqual([]) // reading a batch shows nothing by itself
    })

    it('a batch that is not there: an empty list', async () => {
        expect(await getPlaylistsService().findBatch('sA', 'Nothing')).toEqual([])
    })

    it('the service watches the store from the moment it is made: playlists generated and not saved are kept as a draft', async () => {
        const service = getPlaylistsService()
        playlistsStore.setPlaylists([{ name: 'Mix 1', tracks: [{ title: 'T1' }] }], 'sA')
        await flush()
        playlistsStore.reset() // a reload of the page

        expect(service.restoreDraft({ seriesId: 'sA' })).toBe(true)
        expect(playlistsStore.getPlaylists().map(p => p.name)).toEqual(['Mix 1'])
    })
})
