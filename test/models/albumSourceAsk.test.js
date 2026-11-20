/**
 * F58 (UAT-194) - the rules of asking one enrichment source for one album, as pure functions:
 * whether the source is still to be asked, over which album its answer is applied, and what the
 * answer means for the screen and for what is kept.
 */
import { describe, it, expect, vi } from 'vitest'
import { awaitsSource, overNewestAlbum, sourceOutcome } from '../../public/js/models/albumSourceAsk.js'
import { createEntry, AlbumStatus, EnrichmentStatus } from '../../public/js/models/albumLoadState.js'

const found = (enrichment = {}) => ({
    ...createEntry('s1', 'Artist - One'),
    status: AlbumStatus.FOUND,
    album: { id: 'one' },
    enrichment: { acclaim: 'pending', popularity: 'pending', userRanking: 'pending', ...enrichment }
})

describe('awaitsSource: is this source still to be asked for this album?', () => {
    it('yes for a found album whose source has not answered, is being asked or failed', () => {
        expect(awaitsSource(found(), 'acclaim')).toBe(true)
        expect(awaitsSource(found({ acclaim: EnrichmentStatus.LOADING }), 'acclaim')).toBe(true)
        expect(awaitsSource(found({ acclaim: EnrichmentStatus.FAILED }), 'acclaim')).toBe(true)
    })

    it('no once the source answered, with data or with nothing', () => {
        expect(awaitsSource(found({ acclaim: EnrichmentStatus.DONE }), 'acclaim')).toBe(false)
        expect(awaitsSource(found({ acclaim: EnrichmentStatus.EMPTY }), 'acclaim')).toBe(false)
    })

    it('no for an album that is not on screen, or an entry that left', () => {
        expect(awaitsSource(createEntry('s1', 'Artist - One'), 'acclaim')).toBe(false)
        expect(awaitsSource({ ...found(), status: AlbumStatus.FAILED }, 'acclaim')).toBe(false)
        expect(awaitsSource(null, 'acclaim')).toBe(false)
    })
})

describe('overNewestAlbum: no source undoes another', () => {
    const given = { id: 'one', v: 0 }

    it('gives the album of the answer when nobody published a newer one meanwhile', async () => {
        const result = { status: 'done', album: { id: 'one', rated: true }, apply: vi.fn() }

        expect(await overNewestAlbum({ result, given }, () => given)).toBe(result.album)
        expect(result.apply).not.toHaveBeenCalled()
    })

    it('gives the album it was given when the answer brings none', async () => {
        expect(await overNewestAlbum({ result: { status: 'empty' }, given }, () => given)).toBe(given)
    })

    it('applies the answer over the album another source published meanwhile', async () => {
        const newer = { id: 'one', popular: true }
        const result = { status: 'done', album: { id: 'one', rated: true }, apply: vi.fn(async (album) => ({ ...album, rated: true })) }

        const album = await overNewestAlbum({ result, given }, () => newer)

        expect(result.apply).toHaveBeenCalledTimes(1)
        expect(album).toEqual({ id: 'one', popular: true, rated: true })
    })

    it('applies again when yet another album was published while it applied', async () => {
        const second = { id: 'one', n: 2 }
        const third = { id: 'one', n: 3 }
        const published = [second, third, third]
        const result = { status: 'done', album: {}, apply: vi.fn(async (album) => ({ ...album, rated: true })) }

        const album = await overNewestAlbum({ result, given }, () => published.shift())

        expect(result.apply.mock.calls.map(([base]) => base)).toEqual([second, third])
        expect(album).toEqual({ id: 'one', n: 3, rated: true })
    })

    it('an answer that cannot be applied again stays as it came, whatever was published', async () => {
        const result = { status: 'done', album: { id: 'one', rated: true } }

        expect(await overNewestAlbum({ result, given }, () => ({ id: 'one', popular: true }))).toBe(result.album)
    })

    it('an album that left the load meanwhile is not applied over', async () => {
        const result = { status: 'done', album: { id: 'one', rated: true }, apply: vi.fn() }

        expect(await overNewestAlbum({ result, given }, () => undefined)).toBe(result.album)
        expect(result.apply).not.toHaveBeenCalled()
    })
})

describe('sourceOutcome: what the answer of a source means', () => {
    it('"done" is done, with nothing to note', () => {
        expect(sourceOutcome({ status: 'done', album: {} })).toEqual({ status: EnrichmentStatus.DONE, note: { reason: null } })
    })

    it('anything else is "empty", with the reason the source gave', () => {
        expect(sourceOutcome({ status: 'empty', reason: 'not_found' })).toEqual({ status: EnrichmentStatus.EMPTY, note: { reason: 'not_found' } })
        expect(sourceOutcome({ status: 'empty' })).toEqual({ status: EnrichmentStatus.EMPTY, note: { reason: null } })
    })

    it('an "empty" carries the version of the identity rule it was decided with, when the source said (F68)', () => {
        expect(sourceOutcome({ status: 'empty', reason: 'not_found', rule: 2 }).note).toEqual({ reason: 'not_found', rule: 2 })
    })

    it('a "done" never carries a reason or a rule', () => {
        expect(sourceOutcome({ status: 'done', reason: 'x', rule: 2 }).note).toEqual({ reason: null })
    })
})
