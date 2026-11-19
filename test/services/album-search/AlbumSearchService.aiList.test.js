/**
 * F52, slice 1 - the list of an artist's studio albums, asked of the server's paid AI route
 * (POST /api/ai/studio-albums). The answer is read by the one reader; a failure is never kept
 * as "the AI knows no album of this artist", from the new server or from the one before.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('../../../public/js/services/MusicKitService.js', () => ({ musicKitService: { getArtistAlbums: vi.fn(), getArtworkUrl: () => null } }))
vi.mock('../../../public/js/api/serverFetch.js', () => ({ serverFetch: vi.fn() }))

import { serverFetch } from '../../../public/js/api/serverFetch.js'
import { musicKitService } from '../../../public/js/services/MusicKitService.js'
import { AlbumSearchService } from '../../../public/js/services/album-search/AlbumSearchService.js'

const answer = (status, body) => ({ ok: status < 300, status, headers: { get: () => null }, json: async () => body })

describe('AlbumSearchService: the AI list of studio albums (F52)', () => {
    let service

    beforeEach(() => {
        serverFetch.mockReset()
        service = new AlbumSearchService()
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        vi.spyOn(console, 'log').mockImplementation(() => {})
    })

    afterEach(() => vi.restoreAllMocks())

    describe('the new server', () => {
        it('found: the list, remembered for the next ask', async () => {
            serverFetch.mockResolvedValue(answer(200, { data: { albums: ['One', 'Two'] }, outcome: 'found' }))

            expect(await service._fetchAIWithCache('Artist')).toEqual(['One', 'Two'])
            expect(await service._fetchAIWithCache('Artist')).toEqual(['One', 'Two'])
            expect(serverFetch).toHaveBeenCalledTimes(1)
        })

        it('not_found: the AI answered that there is none; an empty list, remembered', async () => {
            serverFetch.mockResolvedValue(answer(200, { data: { albums: [] }, outcome: 'not_found' }))

            expect(await service._fetchAIWithCache('Artist')).toEqual([])
            await service._fetchAIWithCache('Artist')
            expect(serverFetch).toHaveBeenCalledTimes(1)
        })

        it.each([
            [502, 'upstream_failed', true],
            [424, 'upstream_busy', false],
            [429, 'rate_limited', false],
            [401, 'unauthorized', false]
        ])('a failure (%i %s): the search goes on without the list, and the failure is NOT remembered', async (status, code, retryable) => {
            serverFetch.mockResolvedValue(answer(status, { error: { code, retryable } }))

            expect(await service._fetchAIWithCache('Artist')).toEqual([])
            expect(service.aiCache.has('Artist')).toBe(false)

            serverFetch.mockResolvedValue(answer(200, { data: { albums: ['One'] }, outcome: 'found' }))
            expect(await service._fetchAIWithCache('Artist')).toEqual(['One'])
        })

        it('is not asked again by itself after a failure: each ask may be paid', async () => {
            serverFetch.mockResolvedValue(answer(502, { error: { code: 'upstream_failed', retryable: true } }))
            await service._fetchAIWithCache('Artist')
            expect(serverFetch).toHaveBeenCalledTimes(1)
        })
    })

    describe('the server before F52', () => {
        it('{ albums } with 200 is the list', async () => {
            serverFetch.mockResolvedValue(answer(200, { albums: ['One', 'Two'] }))
            expect(await service._fetchAIWithCache('Artist')).toEqual(['One', 'Two'])
            expect(service.aiCache.get('Artist')).toEqual(['One', 'Two'])
        })

        it('{ albums: [], error } with 200 is its way of saying it failed: an empty list, not remembered', async () => {
            serverFetch.mockResolvedValue(answer(200, { albums: [], error: 'Request failed with status code 429' }))
            expect(await service._fetchAIWithCache('Artist')).toEqual([])
            expect(service.aiCache.has('Artist')).toBe(false)
        })

        it('an error as { error: "text" } is a failure, not remembered', async () => {
            serverFetch.mockResolvedValue(answer(401, { error: 'Sign in to use this.' }))
            expect(await service._fetchAIWithCache('Artist')).toEqual([])
            expect(service.aiCache.has('Artist')).toBe(false)
        })
    })

    it('no answer at all is a failure, not remembered', async () => {
        serverFetch.mockRejectedValue(new TypeError('Failed to fetch'))
        expect(await service._fetchAIWithCache('Artist')).toEqual([])
        expect(service.aiCache.has('Artist')).toBe(false)
    })

    it('one scan asks the list once, even when the ask fails and many albums want it', async () => {
        serverFetch.mockResolvedValue(answer(502, { error: { code: 'upstream_failed', retryable: true } }))
        musicKitService.getArtistAlbums.mockResolvedValue(['A', 'B', 'C', 'D'].map((title, i) => ({
            appleMusicId: String(i), title, artist: 'Artist', trackCount: 10, raw: { attributes: { genreNames: ['Electronic'] } }
        })))

        await (await service.scanArtist('Artist')).reclassified

        expect(serverFetch).toHaveBeenCalledTimes(1)
    })
})
