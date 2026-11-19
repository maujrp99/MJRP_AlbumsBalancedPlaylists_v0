/**
 * F52, slice 1 - a browser tab opened BEFORE the site was published keeps running the old code
 * against the NEW server. The three functions below are that old code, copied as it was at
 * `be346b8` (public/js/api/client.js and AlbumSearchService.js) and frozen here: they are not
 * imported from the app on purpose. The answers come from the real builder of the server
 * (server/lib/outcome.js) and the real table of the AI provider.
 */
import { describe, it, expect, vi } from 'vitest'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { success, failure, bodyOf } = require('../../server/lib/outcome.js')
const { AI_PROVIDER_TABLE, providerFailure } = require('../../server/lib/aiProviderOutcome.js')

/** What fetch gives the tab for a result of the new server. */
const wire = (result) => ({ ok: result.status < 300, status: result.status, statusText: '', json: async () => bodyOf(result) })

// ---- the old tab, frozen -------------------------------------------------------------------
/** old ApiError.isTransient + _fetchAlbumFromAPI: asked again after no answer or ANY 5xx, up to twice. */
async function oldTabGenerate(fetchImpl) {
    const isTransient = (error) => error.kind === 'network' || (error.kind === 'http' && error.status >= 500)
    for (let attempt = 0; ; attempt++) {
        try {
            const response = await fetchImpl()
            if (!response.ok) throw Object.assign(new Error(`HTTP ${response.status}`), { kind: 'http', status: response.status })
            const data = await response.json()
            return data.data || data
        } catch (error) {
            if (attempt >= 2 || !isTransient(error)) throw error
        }
    }
}
/** old BEAenrichAlbum: null when the answer is not ok. */
async function oldTabRatings(fetchImpl) {
    try {
        const response = await fetchImpl()
        if (!response.ok) return null
        const json = await response.json()
        return json.data || {}
    } catch {
        return null
    }
}
/** old _fetchAIStudioAlbums: reads `albums` at the top of the body, whatever the status. */
async function oldTabAiList(fetchImpl) {
    try {
        const res = await fetchImpl()
        const data = await res.json()
        return data.albums || []
    } catch {
        return []
    }
}
// --------------------------------------------------------------------------------------------

describe('an old tab against the new server', () => {
    describe('POST /api/generate (each call is paid)', () => {
        AI_PROVIDER_TABLE.forEach(row => {
            const expectedCalls = row.retryable ? 3 : 1
            it(`provider case "${row.provider}" (${row.status}): the old tab makes ${expectedCalls} call(s)`, async () => {
                const fetchImpl = vi.fn(async () => wire(providerFailure(row.provider)))
                await oldTabGenerate(fetchImpl).catch(() => {})
                expect(fetchImpl).toHaveBeenCalledTimes(expectedCalls)
            })
        })

        it('billing, quota, a refused request and an unusable answer are never asked again', () => {
            const notAgain = AI_PROVIDER_TABLE.filter(row => ['402', '429', '4xx', 'unusable'].includes(row.provider))
            expect(notAgain).toHaveLength(4)
            notAgain.forEach(row => expect(row.status).toBeLessThan(500))
        })

        it('still reads the album of { data, outcome }', async () => {
            const album = { title: 'Album', artist: 'Artist', tracks: [] }
            expect(await oldTabGenerate(async () => wire(success(album)))).toEqual(album)
        })
    })

    describe('POST /api/enrich-album', () => {
        it.each(['upstream_failed', 'upstream_timeout', 'upstream_busy', 'internal'])('a failure (%s) becomes null, which the old tab marks as "failed", never as "no ratings"', async (code) => {
            expect(await oldTabRatings(async () => wire(failure(code)))).toBeNull()
        })

        it('still reads the ratings of { data, outcome }, whatever the outcome', async () => {
            const data = { bestEverInfo: null, trackRatings: [] }
            for (const outcome of ['found', 'not_found', 'no_ratings']) {
                expect(await oldTabRatings(async () => wire(success(data, outcome)))).toEqual(data)
            }
        })
    })

    describe('POST /api/enrich-album, slice 3: the server now answers in time and may say "the source asked to wait"', () => {
        /**
         * The tab of slice 1 (the site in production on 2026-11-19), frozen: its reader held the
         * load only for its own door and its own limit (public/js/api/serverResult.js at `dd16b01`).
         */
        const slice1HoldOf = (code, status) => {
            if (code === 'unauthorized' && status === 401) return { reason: 'unauthorized' }
            if (code === 'rate_limited') return { reason: 'rate_limited' }
            return null
        }

        it('503 upstream_busy with Retry-After: the tab of slice 1 reads a failure it may ask again, and holds nothing', () => {
            const result = failure('upstream_busy', { retryAfterSeconds: 42 })
            expect(bodyOf(result)).toEqual({ error: { code: 'upstream_busy', retryable: true } })
            expect(slice1HoldOf(result.code, result.status)).toBeNull()
        })

        it('504 upstream_timeout at the budget: the oldest tab reads null ("failed"), the tab of slice 1 a failure it may ask again', async () => {
            const result = failure('upstream_timeout')
            expect(await oldTabRatings(async () => wire(result))).toBeNull()
            expect(bodyOf(result).error.retryable).toBe(true)
        })

        it('the body of a success has the same two fields as before: nothing of the log goes on the wire', () => {
            const result = { ...success({ trackRatings: [] }, 'not_found'), trace: { how: 'joined', sourceRequests: 0 } }
            expect(Object.keys(bodyOf(result)).sort()).toEqual(['data', 'outcome'])
        })
    })

    describe('POST /api/ai/studio-albums', () => {
        it('a failure is an empty list for the old tab (its fallback to heuristics), as it was', async () => {
            expect(await oldTabAiList(async () => wire(providerFailure('5xx')))).toEqual([])
        })

        it('KNOWN LIMIT: the list itself moved to data.albums, so the old tab reads no list until it is reloaded', async () => {
            expect(await oldTabAiList(async () => wire(success({ albums: ['One'] })))).toEqual([])
        })
    })
})
