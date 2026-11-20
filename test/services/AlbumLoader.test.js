/**
 * F64 (UAT-20) - AlbumLoader.load was a Promise built with an async function (ESLint:
 * `no-async-promise-executor`: an error thrown inside is lost instead of rejecting). It is an
 * async method now. These cases were written and run before the change and pass the same after:
 * the expanded dataset first, the CSV when it is not there, an empty list when neither can be
 * read (and the next call tries again), one fetch for calls made together.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AlbumLoader } from '../../public/js/services/AlbumLoader.js'

const ok = (body) => ({ ok: true, json: async () => body, text: async () => body })
const missing = () => ({ ok: false, json: async () => ({}), text: async () => '' })
const CSV = 'i,PLACE,Artist,Album,Year\n1,1,"Beatles, The",Abbey Road,1969\n2,2,Nirvana,Nevermind,1991\n'

describe('AlbumLoader.load', () => {
    beforeEach(() => {
        vi.spyOn(console, 'log').mockImplementation(() => {})
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        vi.spyOn(console, 'error').mockImplementation(() => {})
    })
    afterEach(() => {
        vi.unstubAllGlobals()
        vi.restoreAllMocks()
    })

    it('reads the expanded dataset, and answers from memory the next time', async () => {
        const albums = [{ artist: 'Nirvana', album: 'Nevermind' }]
        const fetch = vi.fn(async () => ok(albums))
        vi.stubGlobal('fetch', fetch)
        const loader = new AlbumLoader()

        expect(await loader.load()).toEqual(albums)
        expect(loader.isLoaded).toBe(true)
        expect(await loader.load()).toEqual(albums)
        expect(fetch.mock.calls.map(([url]) => url)).toEqual(['/assets/data/albums-expanded.json'])
    })

    it('falls back to the CSV when the expanded dataset is not there', async () => {
        const fetch = vi.fn(async (url) => (url.endsWith('.json') ? missing() : ok(CSV)))
        vi.stubGlobal('fetch', fetch)
        const loader = new AlbumLoader()

        expect(await loader.load()).toEqual([
            { artist: 'Beatles, The', album: 'Abbey Road', year: '1969' },
            { artist: 'Nirvana', album: 'Nevermind', year: '1991' }
        ])
        expect(fetch.mock.calls.map(([url]) => url)).toEqual(['/assets/data/albums-expanded.json', '/assets/data/albums.csv'])
    })

    it('neither can be read: an empty list, never a rejection, and the next call tries again', async () => {
        const fetch = vi.fn(async () => missing())
        vi.stubGlobal('fetch', fetch)
        const loader = new AlbumLoader()

        expect(await loader.load()).toEqual([])
        expect(loader.isLoaded).toBe(false)
        expect(loader.loadPromise).toBeNull()

        fetch.mockImplementation(async () => ok([{ artist: 'A', album: 'B' }]))
        expect(await loader.load()).toEqual([{ artist: 'A', album: 'B' }])
    })

    it('the network throws: an empty list, never a rejection', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))

        expect(await new AlbumLoader().load()).toEqual([])
    })

    it('an answer that is not JSON: an empty list, never a rejection', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => { throw new SyntaxError('Unexpected token <') } })))

        expect(await new AlbumLoader().load()).toEqual([])
    })

    it('calls made together share one read', async () => {
        const fetch = vi.fn(async () => ok([{ artist: 'A', album: 'B' }]))
        vi.stubGlobal('fetch', fetch)
        const loader = new AlbumLoader()

        const [first, second] = await Promise.all([loader.load(), loader.load()])

        expect(first).toBe(second)
        expect(fetch).toHaveBeenCalledTimes(1)
    })
})
