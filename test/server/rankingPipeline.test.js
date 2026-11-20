/**
 * F52, slice 5 - the ranking fetch of POST /api/generate (`fetchRankingForAlbum`): which source is
 * asked, in which order, and what leaves. The first five groups were written against the one
 * function of complexity 139, before it became a pipeline of sources, and pass unchanged against
 * the pipeline: what they pin is what the album gets on each path. The groups after them are what
 * the slice changed: every source ends in a typed outcome, and a failure is never read as "there
 * is none". No network and no paid call: every source is a double (helpers/rankingHarness.js).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createRequire } from 'node:module'
import { rankingFetchWith, beaPage, spotifyFound, aiRanking, BEA_URL, SPOTIFY_URL, PROMPTS } from './helpers/rankingHarness.js'
import { httpError } from './helpers/fakes.js'

const require = createRequire(import.meta.url)
const { UpstreamError } = require('../../server/lib/outcome.js')
const { createBudget } = require('../../server/lib/timeBudget.js')

const album = (titles = ['One', 'Two', 'Three', 'Four']) => ({ title: 'Album', artist: 'Artist', year: 1999, tracks: titles.map(title => ({ title })) })
const QUERY = 'Artist - Album'
const sourceDown = () => new UpstreamError('upstream_failed', 'the source is down')
/** [source, title, position, rating] of each entry, in the order they leave. */
const rows = (result) => result.entries.map(e => [e.provider, e.trackTitle, e.position, e.rating])
const ALL_RATED = { One: 70, Two: 90, Three: 80, Four: 60 }
/** A page with few ratings: fewer than 3 and fewer than 40% of the tracks. */
const FEW_RATED = { One: 70, Two: null, Three: null, Four: null }
const POPULARITY = { One: 10, Two: 90, Three: 50, Four: 30 }

beforeEach(() => {
    ['log', 'warn', 'error'].forEach(method => vi.spyOn(console, method).mockImplementation(() => {}))
})
afterEach(() => vi.restoreAllMocks())

describe('the ranking fetch: BestEverAlbums is asked first', () => {
    it('it has a rating for every track: its entries leave in page order, and no other source is asked', async () => {
        const fetch = rankingFetchWith({ bestEver: beaPage(ALL_RATED) })
        const result = await fetch.fetchRankingForAlbum(album(), QUERY)

        expect(fetch.asked).toEqual(['bestEver'])
        expect(fetch.bestEver.mock.calls[0].slice(0, 2)).toEqual(['Album', 'Artist'])
        expect(rows(result)).toEqual([
            ['BestEverAlbums', 'One', 1, 70], ['BestEverAlbums', 'Two', 2, 90], ['BestEverAlbums', 'Three', 3, 80], ['BestEverAlbums', 'Four', 4, 60]
        ])
        expect(result.entries[0].referenceUrl).toBe(BEA_URL)
        expect(result.sources).toEqual([{ provider: 'BestEverAlbums', providerType: 'community', referenceUrl: BEA_URL }])
        expect(result.bestEver).toEqual({ albumUrl: BEA_URL, albumId: '1', evidence: beaPage(ALL_RATED).evidence })
    })

    it('a rating that came as text is read as a number', async () => {
        const fetch = rankingFetchWith({ bestEver: beaPage({ One: '70', Two: 90, Three: 80, Four: 60 }) })

        expect(rows(await fetch.fetchRankingForAlbum(album(), QUERY))[0]).toEqual(['BestEverAlbums', 'One', 1, 70])
    })

    it('the album has no title of its own: the query is what is asked for', async () => {
        const fetch = rankingFetchWith({ bestEver: beaPage(ALL_RATED) })
        await fetch.fetchRankingForAlbum({ tracks: [] }, QUERY)

        expect(fetch.bestEver.mock.calls[0].slice(0, 2)).toEqual([QUERY, ''])
    })

    it('the tracks of the album are not known: the page is enough, whatever it has', async () => {
        const fetch = rankingFetchWith({ bestEver: beaPage({ One: 70, Two: 90, Three: 80 }) })
        const result = await fetch.fetchRankingForAlbum({ title: 'Album', artist: 'Artist' }, QUERY)

        expect(fetch.asked).toEqual(['bestEver'])
        expect(result.entries).toHaveLength(3)
    })
})

describe('the ranking fetch: the page has few ratings, so Spotify popularity is asked', () => {
    it('Spotify has the album: its popularity leaves instead, highest first', async () => {
        const fetch = rankingFetchWith({ bestEver: beaPage(FEW_RATED), spotify: spotifyFound(POPULARITY) })
        const result = await fetch.fetchRankingForAlbum(album(), QUERY)

        expect(fetch.asked).toEqual(['bestEver', 'spotify'])
        expect(fetch.spotify.mock.calls[0].slice(0, 2)).toEqual(['Album', 'Artist'])
        expect(rows(result)).toEqual([['Spotify', 'Two', 2, 90], ['Spotify', 'Three', 3, 50], ['Spotify', 'Four', 4, 30], ['Spotify', 'One', 1, 10]])
        expect(result.sources).toEqual([{ provider: 'Spotify', providerType: 'popularity', referenceUrl: SPOTIFY_URL }])
        expect(result.spotify).toEqual({ referenceUrl: SPOTIFY_URL })
    })

    it('Spotify has fewer than half of the tracks: the page wins', async () => {
        const fetch = rankingFetchWith({ bestEver: beaPage(FEW_RATED), spotify: spotifyFound({ One: 10 }) })
        const result = await fetch.fetchRankingForAlbum(album(), QUERY)

        expect(fetch.asked).toEqual(['bestEver', 'spotify'])
        expect(result.entries.map(e => e.provider)).toEqual(['BestEverAlbums', 'BestEverAlbums', 'BestEverAlbums', 'BestEverAlbums'])
    })

    it.each([
        ['does not have the album', { outcome: 'not_found' }],
        ['is not set up on this server', { outcome: 'not_configured' }],
        ['fails', sourceDown()]
    ])('Spotify %s: the entries of the page leave', async (name, spotify) => {
        const fetch = rankingFetchWith({ bestEver: beaPage(FEW_RATED), spotify })
        const result = await fetch.fetchRankingForAlbum(album(), QUERY)

        expect(fetch.asked).toEqual(['bestEver', 'spotify'])
        expect(rows(result)).toEqual([
            ['BestEverAlbums', 'One', 1, 70], ['BestEverAlbums', 'Two', 2, null], ['BestEverAlbums', 'Three', 3, null], ['BestEverAlbums', 'Four', 4, null]
        ])
        expect(result.sources).toEqual([{ provider: 'BestEverAlbums', providerType: 'community', referenceUrl: BEA_URL }])
        expect(result.bestEver).toMatchObject({ albumUrl: BEA_URL, albumId: '1' })
    })

    it('three rated tracks are enough, whatever the size of the album: Spotify is not asked', async () => {
        const titles = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten']
        const page = beaPage(Object.fromEntries(titles.map((title, i) => [title, i < 3 ? 80 : null])))
        const fetch = rankingFetchWith({ bestEver: page })
        await fetch.fetchRankingForAlbum(album(titles), QUERY)

        expect(fetch.asked).toEqual(['bestEver'])
    })
})

describe('the ranking fetch: the page lists fewer tracks than the album, so the AI is asked to complete it', () => {
    const PARTIAL = { Two: 90, One: 70, Three: 80 } // the page lists three of the four tracks

    it('the entries leave in album order: the page where it has the track, the AI where it does not', async () => {
        const fetch = rankingFetchWith({ bestEver: beaPage(PARTIAL), ai: aiRanking([['Four', 'Rolling Stone'], ['One', 'NME']]) })
        const result = await fetch.fetchRankingForAlbum(album(), QUERY)

        expect(fetch.asked).toEqual(['bestEver', 'ai'])
        expect(rows(result)).toEqual([
            ['BestEverAlbums', 'Two', 1, 90], ['Rolling Stone', 'Four', 1, null], ['BestEverAlbums', 'One', 2, 70], ['BestEverAlbums', 'Three', 3, 80]
        ])
        expect(result.sources).toEqual([
            { provider: 'BestEverAlbums', providerType: 'community', referenceUrl: BEA_URL },
            { name: 'Rolling Stone', type: 'external', reference: '', secure: true, description: '', metadata: { position: 1 } },
            { name: 'NME', type: 'external', reference: '', secure: true, description: '', metadata: { position: 2 } }
        ])
        expect(result.bestEver).toMatchObject({ albumUrl: BEA_URL, albumId: '1' })
    })

    it('the AI is asked with the ranking prompt of the album, with no list of sources', async () => {
        const fetch = rankingFetchWith({ bestEver: beaPage(PARTIAL) })
        await fetch.fetchRankingForAlbum(album(), QUERY)

        expect(fetch.callProvider).toHaveBeenCalledWith(expect.objectContaining({
            prompt: 'rank Album by Artist (1999) q=Artist - Album providers:\n',
            maxTokens: 2048
        }))
    })

    it('at most three sources of the AI are listed beside the page', async () => {
        const five = [['Four', 'A'], ['One', 'B'], ['Two', 'C'], ['Three', 'D'], ['Five', 'E']]
        const fetch = rankingFetchWith({ bestEver: beaPage(PARTIAL), ai: aiRanking(five) })
        const result = await fetch.fetchRankingForAlbum(album(), QUERY)

        expect(result.sources.map(s => s.provider || s.name)).toEqual(['BestEverAlbums', 'A', 'B', 'C'])
    })

    it('the AI fails: the entries of the page leave as they are', async () => {
        const fetch = rankingFetchWith({ bestEver: beaPage(PARTIAL), ai: httpError(500) })
        const result = await fetch.fetchRankingForAlbum(album(), QUERY)

        expect(rows(result)).toEqual([['BestEverAlbums', 'Two', 1, 90], ['BestEverAlbums', 'One', 2, 70], ['BestEverAlbums', 'Three', 3, 80]])
        expect(result.sources).toEqual([{ provider: 'BestEverAlbums', providerType: 'community', referenceUrl: BEA_URL }])
        expect(result.bestEver).toMatchObject({ albumUrl: BEA_URL, albumId: '1' })
    })
})

describe('the ranking fetch: BestEverAlbums has nothing to give, so Spotify popularity is asked', () => {
    it.each([
        ['has no page for the album', null],
        ['has the page with no track on it', beaPage({})],
        ['fails', sourceDown()]
    ])('BestEverAlbums %s, Spotify has the album: its popularity leaves, highest first', async (name, bestEver) => {
        const fetch = rankingFetchWith({ bestEver, spotify: spotifyFound(POPULARITY) })
        const result = await fetch.fetchRankingForAlbum(album(), QUERY)

        expect(fetch.asked).toEqual(['bestEver', 'spotify'])
        expect(rows(result)).toEqual([['Spotify', 'Two', 2, 90], ['Spotify', 'Three', 3, 50], ['Spotify', 'Four', 4, 30], ['Spotify', 'One', 1, 10]])
        expect(result.entries[0].referenceUrl).toBe(SPOTIFY_URL)
        expect(result.sources).toEqual([{ provider: 'Spotify', providerType: 'popularity', referenceUrl: SPOTIFY_URL }])
        expect(result.spotify).toEqual({ referenceUrl: SPOTIFY_URL })
        expect(result.bestEver).toBeUndefined()
    })
})

describe('the ranking fetch: neither has it, so the AI is asked for the ranking (the last source)', () => {
    it.each([
        ['does not have the album', { outcome: 'not_found' }],
        ['is not set up on this server', { outcome: 'not_configured' }],
        ['fails', sourceDown()]
    ])('Spotify %s: the ranking the AI gave leaves, in its order', async (name, spotify) => {
        const fetch = rankingFetchWith({ bestEver: null, spotify, ai: aiRanking([['Three', 'Rolling Stone'], ['One', 'NME']]) })
        const result = await fetch.fetchRankingForAlbum(album(), QUERY)

        expect(fetch.asked).toEqual(['bestEver', 'spotify', 'ai'])
        expect(result.entries).toEqual([
            { provider: 'Rolling Stone', summary: '', position: 1, trackTitle: 'Three', referenceUrl: '', type: 'external' },
            { provider: 'NME', summary: '', position: 2, trackTitle: 'One', referenceUrl: '', type: 'external' }
        ])
        expect(result.sources).toEqual([
            { name: 'Rolling Stone', type: 'external', reference: '', secure: true, description: '', metadata: { position: 1 } },
            { name: 'NME', type: 'external', reference: '', secure: true, description: '', metadata: { position: 2 } }
        ])
        expect(result.bestEver).toBeUndefined()
    })

    it('the AI is asked with the ranking prompt of the album and the first ten sources of the prompts file, numbered', async () => {
        const fetch = rankingFetchWith({ bestEver: null })
        await fetch.fetchRankingForAlbum(album(), QUERY)

        expect(fetch.callProvider).toHaveBeenCalledTimes(1)
        expect(fetch.callProvider).toHaveBeenCalledWith(expect.objectContaining({
            prompt: 'rank Album by Artist (1999) q=Artist - Album providers:\n1. Rolling Stone\n2. NME\n3. Pitchfork',
            maxTokens: 2048
        }))
    })

    it('the AI answered with no ranking in it: no entry and no source', async () => {
        const fetch = rankingFetchWith({ bestEver: null, ai: aiRanking([]) })
        const result = await fetch.fetchRankingForAlbum(album(), QUERY)

        expect(result.entries).toEqual([])
        expect(result.sources).toEqual([])
    })
})

describe('the ranking fetch: the raw stage (a debug feature)', () => {
    it('asks only the AI, with the ranking prompt, and hands its answer back as it came', async () => {
        const answer = aiRanking([['One', 'NME']])
        const fetch = rankingFetchWith({ bestEver: beaPage(ALL_RATED), ai: answer })
        const result = await fetch.fetchRankingForAlbum(album(), QUERY, { raw: true })

        expect(fetch.asked).toEqual(['ai'])
        expect(result.raw).toBe(answer)
    })
})

describe('the ranking fetch: the prompts', () => {
    it('reads the prompts file through loadPrompts', async () => {
        const loadPrompts = vi.fn(() => PROMPTS)
        const fetch = rankingFetchWith({ prompts: loadPrompts, bestEver: beaPage(ALL_RATED) })
        await fetch.fetchRankingForAlbum(album(), QUERY)

        expect(loadPrompts).toHaveBeenCalled()
    })

    it('no ranking prompt in the file is a broken server, said before any source is asked; never "no ranking"', async () => {
        const fetch = rankingFetchWith({ prompts: { albumSearchPrompt: 'find {{albumQuery}}' }, bestEver: beaPage(ALL_RATED) })

        await expect(fetch.fetchRankingForAlbum(album(), QUERY)).rejects.toMatchObject({ name: 'PromptsError' })
        expect(fetch.asked).toEqual([])
    })
})

describe('the ranking fetch: what happened to each source is said (F52, slice 5)', () => {
    const NOT_FOUND = { outcome: 'not_found' }
    const NO_RATING_ON_THE_PAGE = { One: null, Two: null, Three: null, Four: null }
    const PARTIAL = { Two: 90, One: 70, Three: 80 }

    it.each([
        ['the page has the ratings', { bestEver: beaPage(ALL_RATED) }, ['found', 'not_asked', 'not_asked']],
        ['few ratings, Spotify has the album', { bestEver: beaPage(FEW_RATED), spotify: spotifyFound(POPULARITY) }, ['found', 'found', 'not_asked']],
        ['few ratings, Spotify does not have the album', { bestEver: beaPage(FEW_RATED), spotify: NOT_FOUND }, ['found', 'not_found', 'not_asked']],
        ['few ratings, Spotify is not set up', { bestEver: beaPage(FEW_RATED), spotify: { outcome: 'not_configured' } }, ['found', 'not_configured', 'not_asked']],
        ['few ratings, Spotify FAILS', { bestEver: beaPage(FEW_RATED), spotify: sourceDown() }, ['found', 'failed', 'not_asked']],
        ['the page lists the tracks with no rating', { bestEver: beaPage(NO_RATING_ON_THE_PAGE), spotify: NOT_FOUND }, ['no_ratings', 'not_found', 'not_asked']],
        ['the page is there with no track on it', { bestEver: beaPage({}), spotify: NOT_FOUND, ai: aiRanking([['One', 'NME']]) }, ['no_ratings', 'not_found', 'found']],
        ['no page, Spotify has the album', { bestEver: null, spotify: spotifyFound(POPULARITY) }, ['not_found', 'found', 'not_asked']],
        ['no page, no album on Spotify, the AI ranks', { bestEver: null, spotify: NOT_FOUND, ai: aiRanking([['One', 'NME']]) }, ['not_found', 'not_found', 'found']],
        ['no source has anything', { bestEver: null, spotify: NOT_FOUND, ai: aiRanking([]) }, ['not_found', 'not_found', 'not_found']],
        ['BestEverAlbums FAILS, Spotify has the album', { bestEver: sourceDown(), spotify: spotifyFound(POPULARITY) }, ['failed', 'found', 'not_asked']],
        ['the page is partial and the AI FAILS', { bestEver: beaPage(PARTIAL), ai: httpError(500) }, ['found', 'not_asked', 'failed']],
        ['every source FAILS', { bestEver: sourceDown(), spotify: sourceDown(), ai: httpError(500) }, ['failed', 'failed', 'failed']]
    ])('%s', async (name, doubles, [acclaim, popularity, aiRanking]) => {
        const result = await rankingFetchWith(doubles).fetchRankingForAlbum(album(), QUERY)

        expect(result.ratings).toEqual({ acclaim, popularity, aiRanking })
    })

    it('every source fails: no entry and no source leave, and nothing is thrown', async () => {
        const fetch = rankingFetchWith({ bestEver: sourceDown(), spotify: sourceDown(), ai: httpError(500) })
        const result = await fetch.fetchRankingForAlbum(album(), QUERY)

        expect(fetch.asked).toEqual(['bestEver', 'spotify', 'ai'])
        expect(result).toMatchObject({ entries: [], sources: [] })
    })

    it('the trace says, source by source, the outcome and the code of a failure, and no message of a source', async () => {
        const slow = new UpstreamError('upstream_timeout', 'BestEverAlbums: secret detail of the request')
        const fetch = rankingFetchWith({ bestEver: slow, spotify: spotifyFound(POPULARITY) })
        const result = await fetch.fetchRankingForAlbum(album(), QUERY)

        expect(result.debugTrace).toEqual([
            { source: 'acclaim', outcome: 'failed', entries: 0, code: 'upstream_timeout' },
            { source: 'popularity', outcome: 'found', entries: 4 },
            { source: 'aiRanking', outcome: 'not_asked', entries: 0 }
        ])
        expect(JSON.stringify(result)).not.toContain('secret detail')
    })

    it.each([
        [402, 'upstream_failed'],
        [429, 'upstream_busy'],
        [500, 'upstream_failed']
    ])('the AI provider answering %i is a failure with the code of its table: %s', async (status, code) => {
        const fetch = rankingFetchWith({ bestEver: null, ai: httpError(status, { error: { message: 'Your prepayment credits are depleted' } }) })
        const result = await fetch.fetchRankingForAlbum(album(), QUERY)

        expect(result.debugTrace[2]).toEqual({ source: 'aiRanking', outcome: 'failed', entries: 0, code })
        expect(JSON.stringify(result)).not.toContain('prepayment')
    })

    it('something of this server that breaks inside a source is a failure of that source (internal), not "it has none"', async () => {
        const fetch = rankingFetchWith({ bestEver: new TypeError('x is not a function'), spotify: spotifyFound(POPULARITY) })
        const result = await fetch.fetchRankingForAlbum(album(), QUERY)

        expect(result.ratings.acclaim).toBe('failed')
        expect(result.debugTrace[0]).toMatchObject({ outcome: 'failed', code: 'internal' })
    })
})

describe('the ranking fetch: the time of the request (F52, slice 5)', () => {
    it('the scraper is told when the time of the request ends', async () => {
        const budget = createBudget({ ms: 60000 })
        const fetch = rankingFetchWith({ bestEver: beaPage(ALL_RATED) })
        await fetch.fetchRankingForAlbum(album(), QUERY, { budget })

        expect(fetch.bestEver.mock.calls[0][2]).toEqual({ deadlineAt: budget.deadlineAt })
    })

    it('a source still running when the time ends is a failure (upstream_timeout), and the next ones are not asked', async () => {
        const never = () => new Promise(() => {})
        const fetch = rankingFetchWith({ bestEver: never, spotify: spotifyFound(POPULARITY) })
        const result = await fetch.fetchRankingForAlbum(album(), QUERY, { budget: createBudget({ ms: 5 }) })

        expect(fetch.asked).toEqual(['bestEver'])
        expect(result.ratings).toEqual({ acclaim: 'failed', popularity: 'failed', aiRanking: 'failed' })
        expect(result.debugTrace.map(row => row.code)).toEqual(['upstream_timeout', 'upstream_timeout', 'upstream_timeout'])
        expect(result).toMatchObject({ entries: [], sources: [] })
    })

    it('with no time left, no source is asked: each is a failure, none is "not found"', async () => {
        const over = { deadlineAt: 0, remainingMs: () => 0, race: (work) => work }
        const fetch = rankingFetchWith({ bestEver: beaPage(ALL_RATED) })
        const result = await fetch.fetchRankingForAlbum(album(), QUERY, { budget: over })

        expect(fetch.asked).toEqual([])
        expect(result.ratings).toEqual({ acclaim: 'failed', popularity: 'failed', aiRanking: 'failed' })
    })
})
