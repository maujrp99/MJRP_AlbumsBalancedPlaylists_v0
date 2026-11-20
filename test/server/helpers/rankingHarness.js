/**
 * The ranking fetch of POST /api/generate with every outside source replaced by a double: the
 * prompts file, the paid AI provider, the BestEverAlbums scraper and the Spotify lookup. No
 * network, no paid call. Each double records that it was called, in `asked`, in order.
 *
 * `rankingFetchWith(doubles)` -> { fetchRankingForAlbum, asked, callProvider, bestEver, spotify }
 * The pipeline is built by `createRankingFetch` with the doubles injected (F52, slice 5). The first
 * version of this file put them in the place of the modules the old function required by itself.
 */
import { vi } from 'vitest'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const LIB = '../../../server/lib/'
const realPrompts = require(`${LIB}prompts.js`)
const { createRankingFetch } = require(`${LIB}fetchRanking.js`)
const { extractAndValidateRankingEntries, rankingEntriesToSources } = require(`${LIB}normalize.js`)
const { loadTrackIdentity } = require(`${LIB}trackIdentity.js`)

const quiet = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }

export const BEA_URL = 'https://www.besteveralbums.com/thechart.php?a=1'
export const SPOTIFY_URL = 'https://open.spotify.com/album/s1'
export const PROMPTS = Object.freeze({
    albumSearchPrompt: 'find {{albumQuery}}',
    rankingPrompt: 'rank {{albumTitle}} by {{albumArtist}} ({{albumYear}}) q={{albumQuery}} providers:\n{{rankingProviders}}',
    defaultRankingProviders: ['Rolling Stone', ' NME ', 'Pitchfork']
})

/** What the scraper answers for a page it read: the tracks in page order, each with its rating or null. */
export const beaPage = (ratings) => ({
    provider: 'BestEverAlbums',
    providerType: 'community',
    referenceUrl: BEA_URL,
    albumId: '1',
    evidence: Object.entries(ratings).map(([trackTitle, rating]) => ({ trackTitle, rating }))
})

/** What the Spotify lookup answers when it has the album: the tracks by popularity, highest first. */
export const spotifyFound = (popularity) => ({
    outcome: 'found',
    provider: 'Spotify',
    providerType: 'popularity',
    referenceUrl: SPOTIFY_URL,
    evidence: Object.entries(popularity)
        .map(([trackTitle, rating], index) => ({ trackTitle, rating, position: index + 1, durationMs: 1000 }))
        .sort((a, b) => b.rating - a.rating)
})

/** The paid provider's answer with a ranking in it: [title, source] in the order the model gave. */
export const aiRanking = (rows) => ({
    status: 200,
    data: { candidates: [{ content: { parts: [{ text: JSON.stringify({ ranking: rows.map(([trackTitle, provider], index) => ({ provider, trackTitle, position: index + 1 })) }) }] } }] }
})

const answering = (answer) => async () => {
    const value = typeof answer === 'function' ? answer() : answer
    if (value instanceof Error) throw value
    return value
}

/**
 * @param {Object} doubles
 * @param {Object|Function} [doubles.prompts] - what loadPrompts gives (or a function that throws)
 * @param {*} [doubles.bestEver] - the page, null, an Error to throw, or a function giving one of them
 * @param {*} [doubles.spotify] - the answer, an Error to throw, or a function
 * @param {*} [doubles.ai] - the provider's answer, an Error to throw, or a function
 */
export function rankingFetchWith ({ prompts = PROMPTS, bestEver = null, spotify = { outcome: 'not_found' }, ai = aiRanking([]) } = {}) {
    const asked = []
    const recorded = (name, answer) => vi.fn(async (...args) => {
        asked.push(name)
        return answering(answer)(...args)
    })
    const doubles = {
        callProvider: recorded('ai', ai),
        bestEver: recorded('bestEver', bestEver),
        spotify: recorded('spotify', spotify)
    }

    const fetchRankingForAlbum = createRankingFetch({
        loadPrompts: typeof prompts === 'function' ? prompts : () => prompts,
        renderPrompt: realPrompts.renderPrompt,
        requirePrompt: realPrompts.requirePrompt,
        callProvider: doubles.callProvider,
        extractAndValidateRankingEntries,
        rankingEntriesToSources,
        getBestEverRanking: doubles.bestEver,
        getSpotifyPopularityRanking: doubles.spotify,
        loadTrackIdentity,
        logger: quiet,
        env: { AI_API_KEY: 'k' }
    })

    return { fetchRankingForAlbum, asked, ...doubles }
}
