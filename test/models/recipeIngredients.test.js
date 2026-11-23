/**
 * F83 wave 7a: which ingredient a recipe shows and the configuration the generation takes (models/recipeIngredients.js), the rules the
 * hand-made panel of ingredients (components/blend/BlendIngredientsPanel.js, deleted with the Blend screen in wave 7b) had inside it. Wave 7a proved the model equal
 * to the panel, for every recipe, every structure and every option; since the panel left, the same values are written here as the table of what it showed.
 */
import { describe, it, expect } from 'vitest'
import { getAllAlgorithms } from '../../public/js/algorithms/index.js'
import { DEFAULT_CHOICES, ingredientsOf, showsDuration, configOf, choicesOf, TRACK_COUNTS, OUTPUT_MODES, RANKING_TYPES, GROUPING_STRATEGIES } from '../../public/js/models/recipeIngredients.js'

describe('recipeIngredients: what a recipe shows', () => {
    it('is what the hand-made panel showed, for every recipe of the menu and for one it does not know', () => {
        const SHOWN = {
            'mjrp-balanced-cascade': { duration: true, outputMode: false, rankingType: true, groupingStrategy: false },
            'top-n-popular': { groupingStrategy: true, outputMode: true, duration: false, rankingType: false, trackCount: true },
            'top-n-acclaimed': { groupingStrategy: true, outputMode: true, duration: false, rankingType: false, trackCount: true },
            'top-n-user': { groupingStrategy: true, outputMode: true, duration: false, rankingType: false, trackCount: true }
        }
        expect(getAllAlgorithms().map(recipe => recipe.id)).toEqual(Object.keys(SHOWN))
        for (const [id, shown] of Object.entries(SHOWN)) expect(ingredientsOf(id), id).toEqual(shown)
        const everything = { groupingStrategy: true, outputMode: true, duration: true, rankingType: true, trackCount: false }
        expect(ingredientsOf('gone-recipe')).toEqual(everything)
        expect(ingredientsOf(undefined)).toEqual(everything)
    })

    it('the balanced recipe shows the duration and the source; a Top N recipe shows its number, the grouping and the structure', () => {
        expect(ingredientsOf('mjrp-balanced-cascade')).toMatchObject({ duration: true, rankingType: true })
        expect(ingredientsOf('mjrp-balanced-cascade').trackCount).toBeFalsy()
        expect(ingredientsOf('top-n-popular')).toMatchObject({ trackCount: true, groupingStrategy: true, outputMode: true, rankingType: false })
    })

    it('a recipe that is not known shows everything but the Top #', () => {
        expect(ingredientsOf('gone-recipe')).toEqual({ groupingStrategy: true, outputMode: true, duration: true, rankingType: true, trackCount: false })
    })
})

describe('recipeIngredients: the duration is shown only where it changes the result (F62)', () => {
    it('is what the hand-made panel decided, for every recipe and every structure', () => {
        const SHOWS = { 'mjrp-balanced-cascade': [true, true, true], 'top-n-popular': [false, true, true], 'top-n-acclaimed': [false, true, true], 'top-n-user': [false, true, true], 'gone-recipe': [true, true, true] }
        for (const [id, expected] of Object.entries(SHOWS)) {
            expect(['single', 'multiple', 'auto'].map(outputMode => showsDuration(ingredientsOf(id), outputMode)), id).toEqual(expected)
        }
    })

    it('a Top N recipe hides it for a single playlist and shows it for multiple and auto', () => {
        const ingredients = ingredientsOf('top-n-user')
        expect([showsDuration(ingredients, 'single'), showsDuration(ingredients, 'multiple'), showsDuration(ingredients, 'auto')]).toEqual([false, true, true])
    })
})

describe('recipeIngredients: the configuration the generation takes', () => {
    it('normalizes the choices as the hand-made panel does: the duration in seconds, «combined» as «balanced»', () => {
        const choices = { ...DEFAULT_CHOICES, duration: 90, rankingType: 'combined', trackCount: 7 }
        expect(configOf(choices)).toEqual({ targetDuration: 5400, rankingId: 'balanced', outputMode: 'auto', groupingStrategy: 'by_album', trackCount: 7 })
        expect(configOf({ ...choices, rankingType: 'spotify' }).rankingId).toBe('spotify')
        expect(configOf({ ...choices, rankingType: 'bea' }).rankingId).toBe('bea')
    })

    it('gives all five keys always, the ones a recipe does not show included (the hand-made panel did, and the generation reads what it needs)', () => {
        expect(Object.keys(configOf(DEFAULT_CHOICES)).sort()).toEqual(['groupingStrategy', 'outputMode', 'rankingId', 'targetDuration', 'trackCount'])
    })

    it('the defaults are the ones of the hand-made panel', () => {
        expect(DEFAULT_CHOICES).toEqual({ duration: 60, outputMode: 'auto', groupingStrategy: 'by_album', rankingType: 'combined', trackCount: 3 })
    })
})

describe('recipeIngredients: the choices that a generated recipe stands for', () => {
    it('are read back from the configuration (seconds to minutes, the ranking id to the ranking type); what the recipe does not carry keeps the default', () => {
        expect(choicesOf({ algorithmId: 'top-n-user', rankingId: 'user', trackCount: 5, outputMode: 'multiple', groupingStrategy: 'artist_rank', targetDuration: 45 * 60 }))
            .toEqual({ duration: 45, outputMode: 'multiple', groupingStrategy: 'artist_rank', rankingType: 'combined', trackCount: 5 })
        expect(choicesOf({ algorithmId: 'mjrp-balanced-cascade', rankingId: 'spotify' })).toEqual({ ...DEFAULT_CHOICES, rankingType: 'spotify' })
        expect(choicesOf({ rankingId: 'bea', trackCount: null }).rankingType).toBe('bea')
        expect(choicesOf({}).trackCount).toBe(3)
    })
})

describe('recipeIngredients: the options on offer', () => {
    it('are the ones of the hand-made panel, in the same order (the texts are the dictionary\'s)', () => {
        const shape = (list) => list.map(({ value, icon }) => [value, icon])
        expect(shape(OUTPUT_MODES)).toEqual([['single', 'ListMusic'], ['multiple', 'LayoutGrid'], ['auto', 'Sparkles']])
        expect(shape(RANKING_TYPES)).toEqual([['spotify', 'TrendingUp'], ['bea', 'Award'], ['combined', 'Scale']])
        expect(shape(GROUPING_STRATEGIES)).toEqual([['by_album', 'Disc'], ['flat_ranked', 'TrendingUp'], ['artist_rank', 'Users'], ['ranked_interleave', 'GitMerge'], ['shuffle', 'Shuffle']])
        expect(TRACK_COUNTS).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    })
})
