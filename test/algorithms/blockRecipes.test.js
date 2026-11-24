/**
 * Recipes made of blocks (F92, REQ-04, REQ-05, REQ-06, REQ-10; TASK-07 and TASK-02): one engine (TopNAlgorithm) runs the three «Top N»
 * recipes and the two new ones, «Deep cuts» and «Least played», through the service the Blend screen and «generate again» use.
 *
 * The fixed sample: one album of eight tracks, popularity [50, 90, 70, none, 90, 20, 60, 30] in album order. By popularity from the top, the
 * tie broken by the order on the album: t2 (90), t5 (90), t3 (70), t7 (60), t1 (50), t8 (30), t6 (20); t4 has no popularity and never counts.
 */
import { describe, it, expect } from 'vitest'
import { playlistGenerationService } from '../../public/js/services/PlaylistGenerationService.js'
import { getAllAlgorithms, getAlgorithm, createAlgorithm } from '../../public/js/algorithms/index.js'
import { BlockRecipeAlgorithm } from '../../public/js/algorithms/BlockRecipeAlgorithm.js'
import { TopNAlgorithm } from '../../public/js/algorithms/TopNAlgorithm.js'
import { createRankingStrategy } from '../../public/js/ranking/index.js'
import { resolveRankingId, sourcesForRecipe } from '../../public/js/models/recipeSources.js'
import { validateRecipeDefinition, maxSkipFor } from '../../shared/content/recipeDefinition.js'
import { SKIP_RANGE } from '../../public/js/models/recipeIngredients.js'

const POPULARITY = [50, 90, 70, null, 90, 20, 60, 30]

function album(id, popularity, extra = () => ({})) {
    return {
        id, title: `Album ${id}`, artist: `Artist ${id}`,
        tracks: popularity.map((value, index) => ({
            id: `${id}-t${index + 1}`, title: `${id}t${index + 1}`, duration: 200 + index, spotifyPopularity: value, position: index + 1, ...extra(index)
        }))
    }
}

const titlesOf = (albums, config) => playlistGenerationService
    .generate(albums, { outputMode: 'single', groupingStrategy: 'by_album', ...config })
    .playlists.flatMap(playlist => playlist.tracks.map(track => track.title))

describe('«Deep cuts»: Spotify, from the top, skip 3, take 3 by album (REQ-04)', () => {
    it('is in the registry, visible, with its definition in the blocks, and that definition passes the validator', () => {
        expect(getAllAlgorithms().map(recipe => recipe.id)).toContain('deep-cuts')
        expect(getAlgorithm('deep-cuts').definition).toEqual({ source: 'spotify', direction: 'top', skip: 3, take: 3, minSeconds: 0, grouping: 'by_album' })
        expect(validateRecipeDefinition(getAlgorithm('deep-cuts').definition).ok).toBe(true)
    })

    it('gives the 4th to the 6th by popularity; the track with no popularity never counts', () => {
        expect(titlesOf([album('A', POPULARITY)], { algorithmId: 'deep-cuts' })).toEqual(['At7', 'At1', 'At8'])
    })

    it('the slider: skip 3 + X (X = 1 skips four; the take stays 3)', () => {
        expect(titlesOf([album('A', POPULARITY)], { algorithmId: 'deep-cuts', skip: 4 })).toEqual(['At1', 'At8', 'At6'])
        expect(titlesOf([album('A', POPULARITY)], { algorithmId: 'deep-cuts', skip: 6 })).toEqual(['At6'])
    })

    it('a skip out of the limits is held inside them: never under 3, never over 10 (with a take of 3)', () => {
        expect(titlesOf([album('A', POPULARITY)], { algorithmId: 'deep-cuts', skip: 1 })).toEqual(['At7', 'At1', 'At8'])
        const many = album('B', Array.from({ length: 16 }, (_, i) => 100 - i))
        expect(titlesOf([many], { algorithmId: 'deep-cuts', skip: 14 })).toEqual(['Bt11', 'Bt12', 'Bt13'])
    })

    it('the slider of the screen goes from its own skip to the limit for its take (the two places agree)', () => {
        const { skip, take } = getAlgorithm('deep-cuts').definition
        expect(SKIP_RANGE).toEqual({ min: skip, max: maxSkipFor(take) })
    })

    it('ignores the Top # of the menu and the source chosen there: its own blocks decide', () => {
        expect(titlesOf([album('A', POPULARITY)], { algorithmId: 'deep-cuts', trackCount: 9, rankingId: 'bea' })).toEqual(['At7', 'At1', 'At8'])
        expect(resolveRankingId({ algorithmId: 'deep-cuts', rankingId: 'bea' })).toBe('spotify')
        expect(sourcesForRecipe({ algorithmId: 'deep-cuts' })).toEqual(['popularity'])
    })
})

describe('«Least played»: Spotify, from the bottom, skip 0, take 3 by album (REQ-04)', () => {
    it('is in the registry, visible, with its definition, which passes the validator', () => {
        expect(getAllAlgorithms().map(recipe => recipe.id)).toContain('least-played')
        expect(getAlgorithm('least-played').definition).toEqual({ source: 'spotify', direction: 'bottom', skip: 0, take: 3, minSeconds: 0, grouping: 'by_album' })
        expect(validateRecipeDefinition(getAlgorithm('least-played').definition).ok).toBe(true)
    })

    it('gives the three least popular; the track with no popularity is not the least played', () => {
        expect(titlesOf([album('A', POPULARITY)], { algorithmId: 'least-played' })).toEqual(['At6', 'At8', 'At1'])
    })

    it('a tie is broken by the order on the album, from the bottom too', () => {
        expect(titlesOf([album('T', [40, 10, 10, 80, 10])], { algorithmId: 'least-played' })).toEqual(['Tt2', 'Tt3', 'Tt5'])
    })

    it('an album with no popularity at all gives nothing', () => {
        expect(titlesOf([album('N', [null, null, null])], { algorithmId: 'least-played' })).toEqual([])
    })

    it('a popularity of 0 is a value (the least played), not a lack of data', () => {
        expect(titlesOf([album('Z', [0, 50, null, 90])], { algorithmId: 'least-played' })).toEqual(['Zt1', 'Zt2', 'Zt4'])
    })
})

describe('the engine of the blocks', () => {
    const run = (definition, albums, opts = {}) => {
        const recipe = new BlockRecipeAlgorithm({ definition })
        return recipe.generate(albums, { rankingStrategy: createRankingStrategy('spotify'), outputMode: 'single', ...opts })
            .playlists.flatMap(playlist => playlist.tracks.map(track => track.title))
    }

    it('same recipe and same albums give the same tracks, byte for byte', () => {
        const albums = [album('A', POPULARITY), album('B', [5, 5, 5, 5, 5])]
        const first = playlistGenerationService.generate(albums, { algorithmId: 'deep-cuts', outputMode: 'auto', groupingStrategy: 'artist_rank' })
        const again = playlistGenerationService.generate(albums, { algorithmId: 'deep-cuts', outputMode: 'auto', groupingStrategy: 'artist_rank' })
        const ids = (result) => JSON.stringify(result.playlists.map(p => [p.title, p.tracks.map(track => [track.title, track.duration])]))
        expect(ids(again)).toBe(ids(first))
    })

    it('the shuffle is not a grouping of a block recipe: it keeps the album order (the result does not move)', () => {
        const albums = [album('A', POPULARITY), album('B', [9, 8, 7, 6, 5, 4, 3])]
        const byAlbum = titlesOf(albums, { algorithmId: 'least-played' })
        for (let i = 0; i < 5; i++) expect(titlesOf(albums, { algorithmId: 'least-played', groupingStrategy: 'shuffle' })).toEqual(byAlbum)
    })

    it('the exclusion leaves out a track shorter than S seconds before skipping', () => {
        // durations 200..207: under 203 seconds are t1, t2, t3
        expect(run({ source: 'spotify', direction: 'top', skip: 0, take: 3, minSeconds: 203 }, [album('A', POPULARITY)])).toEqual(['At5', 'At7', 'At8'])
    })

    it('a definition out of the limits is refused whole: the engine will not run it', () => {
        expect(() => new BlockRecipeAlgorithm({ definition: { skip: 10, take: 6 } })).toThrow(/skip\+take/)
    })

    it('keeps the recipe id on the playlists, so a saved playlist names its recipe', () => {
        const [playlist] = playlistGenerationService.generate([album('A', POPULARITY)], { algorithmId: 'deep-cuts', outputMode: 'single', skip: 5 }).playlists
        expect(playlist._meta).toMatchObject({ algorithmId: 'deep-cuts', rankingId: 'spotify', skip: 5 })
    })
})

/**
 * REQ-05, the equivalence: each «Top N» recipe of today and its form in blocks give the same tracks on the fixed sample (every track with its
 * data, no ties). Where the rule «no data never counts» or the tie-break by album order would change a track, the difference is LISTED here
 * (and taken to the owner): the «Top N» recipes keep today's behaviour until he decides.
 */
describe('equivalence of the three «Top N» recipes and their form in blocks (REQ-05)', () => {
    const FULL = ['A', 'B', 'C'].map((id, a) => {
        const values = Array.from({ length: 9 }, (_, i) => ((i * 37 + a * 11) % 97) + 1)
        return {
            id, title: `Album ${id}`, artist: `Artist ${id}`,
            tracks: values.map((value, i) => ({ id: `${id}-${i + 1}`, title: `${id}${i + 1}`, duration: 240, spotifyPopularity: value, rating: 100 - value, position: i + 1 })),
            userRanking: values.map((value, i) => ({ title: `${id}${i + 1}`, userRank: ((i * 5 + a) % 9) + 1 }))
        }
    })
    const blockTitles = (recipeId, n, albums) => {
        const definition = { ...getAlgorithm(recipeId).definition, take: n }
        const recipe = new BlockRecipeAlgorithm({ definition })
        return recipe.generate(albums, { rankingStrategy: createRankingStrategy(resolveRankingId({ algorithmId: recipeId })), outputMode: 'single', groupingStrategy: 'by_album' })
            .playlists.flatMap(p => p.tracks.map(track => track.title))
    }

    for (const recipeId of ['top-n-popular', 'top-n-acclaimed', 'top-n-user']) {
        it(`${recipeId}: its fixed definition is in the blocks (from the top, skip 0) and passes the validator`, () => {
            const { definition } = getAlgorithm(recipeId)
            expect(definition).toMatchObject({ direction: 'top', skip: 0, take: 3 })
            expect(validateRecipeDefinition(definition).ok).toBe(true)
        })

        for (const n of [1, 3, 5]) {
            it(`${recipeId}, top ${n}: the same tracks as its form in blocks on the fixed sample`, () => {
                expect(titlesOf(FULL, { algorithmId: recipeId, trackCount: n })).toEqual(blockTitles(recipeId, n, FULL))
            })
        }
    }

    it('LISTED difference 1: «Top N by popularity» takes a track with no popularity when the album runs short; the blocks never do', () => {
        const short = [album('S', [80, null, 40])]
        expect(titlesOf(short, { algorithmId: 'top-n-popular', trackCount: 3 })).toEqual(['St1', 'St3', 'St2'])
        expect(blockTitles('top-n-popular', 3, short)).toEqual(['St1', 'St3'])
    })

    it('LISTED difference 2: on a tie of popularity, «Top N by popularity» puts the higher BestEverAlbums rating first; the blocks the album order', () => {
        const tie = [album('R', [70, 70, 10], (i) => ({ rating: [60, 90, 50][i] }))]
        expect(titlesOf(tie, { algorithmId: 'top-n-popular', trackCount: 1 })).toEqual(['Rt2'])
        expect(blockTitles('top-n-popular', 1, tie)).toEqual(['Rt1'])
    })

    it('the «Top N» recipes run through the same engine (one engine, not two)', () => {
        for (const id of ['top-n-popular', 'top-n-acclaimed', 'top-n-user', 'deep-cuts', 'least-played']) {
            expect(createAlgorithm(id)).toBeInstanceOf(TopNAlgorithm)
        }
    })
})
