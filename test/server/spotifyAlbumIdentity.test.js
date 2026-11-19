/**
 * F55, slice 1 - the server's Spotify lookup (popularity used when BestEverAlbums has few ratings)
 * accepts only the album asked for, by the one identity rule. It used to take the first result of
 * the search, whatever it was. No network: the HTTP client is injected.
 */
import { describe, it, expect, vi } from 'vitest'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { findSpotifyAlbum } = require('../../server/lib/services/spotifyPopularity.js')

const STP = 'Stone Temple Pilots'
const item = (id, name, artists = [STP]) => ({ id, name, release_date: '1992-09-29', artists: artists.map(n => ({ name: n })) })
const httpWith = (answer) => ({ get: vi.fn(async (url, { params }) => ({ data: { albums: { items: answer(params.q) } } })) })
const asked = { title: 'Core', artist: STP }

describe('findSpotifyAlbum (server)', () => {
    it('the first result is another album of the artist: it is not taken', async () => {
        const http = httpWith(() => [item('s-shangri', 'Shangri-La Dee Da'), item('s-mem', 'Core Memories')])

        expect(await findSpotifyAlbum(asked, 'token', http)).toBeNull()
    })

    it('picks the album asked for among the results', async () => {
        const http = httpWith(() => [item('s-shangri', 'Shangri-La Dee Da'), item('s-core', 'Core')])

        expect((await findSpotifyAlbum(asked, 'token', http)).id).toBe('s-core')
        expect(http.get).toHaveBeenCalledTimes(1)
    })

    it('when the search by title lists nothing, the albums of the artist are listed and only the album asked for is taken', async () => {
        const http = httpWith((q) => (q.includes('album:') ? [] : [item('s-purple', 'Purple'), item('s-core', 'Core')]))

        expect((await findSpotifyAlbum(asked, 'token', http)).id).toBe('s-core')
    })

    it('the same title by another artist is not the album', async () => {
        const http = httpWith(() => [item('s-other', 'Core', ['Persefone'])])

        expect(await findSpotifyAlbum(asked, 'token', http)).toBeNull()
    })

    it('sends the token it was given, and asks for an edition by its clean title too', async () => {
        const http = httpWith((q) => (q === `album:Core artist:${STP}` ? [item('s-core', 'Core')] : []))

        const found = await findSpotifyAlbum({ title: 'Core (Remastered)', artist: STP }, 'token-1', http)

        expect(found.id).toBe('s-core')
        expect(http.get.mock.calls[0][1].headers).toEqual({ Authorization: 'Bearer token-1' })
    })
})
