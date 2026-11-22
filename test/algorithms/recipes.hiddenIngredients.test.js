/**
 * F83 wave 7a, a test of CHARACTERIZATION (it states what is, it fixes nothing): the panel of ingredients shows an option only for a recipe it changes the result
 * of (F62), but it hands the generation ALL FIVE keys every time (models/recipeIngredients.js `configOf`, as the hand-made panel did), and it does not wipe what
 * was chosen for another recipe. So an option chosen on one recipe and hidden on the next still goes to the generation. The question: does any recipe READ an
 * option the panel hides from it? This test answers it for the four recipes of the menu, key by key, through the service the blend and «generate again» use.
 *
 * The answer it holds: no recipe reads a hidden option to choose or order tracks (the playlists are the same track by track), but the playlists REMEMBER it
 * (`_meta` keeps all four options that were handed), so the panel that opens on those playlists shows an option the recipe never used. Whether that is a defect
 * for the F62 rule («an option only appears where it changes the result») is the owner's; it is listed in the report of wave 7a for an issue, and the migration keeps it.
 */
import { describe, it, expect } from 'vitest'
import { playlistGenerationService } from '../../public/js/services/PlaylistGenerationService.js'
import { getAllAlgorithms } from '../../public/js/algorithms/index.js'
import { DEFAULT_CHOICES, configOf, ingredientsOf, showsDuration } from '../../public/js/models/recipeIngredients.js'

const MIN = 60

/** rows: [title, minutes, popularity, rating] */
function album(id, artist, rows) {
    return {
        id, title: `Album ${id}`, artist,
        tracks: rows.map(([title, minutes, popularity, rating], index) => ({ id: `${id}-${index + 1}`, title, duration: minutes * MIN, spotifyPopularity: popularity, rating, position: index + 1 }))
    }
}

// four albums, twelve to fifteen tracks of five minutes each: enough to pass any target of the panel and to be split by a short one
const ALBUMS = ['A', 'B', 'C', 'D'].map((id, a) => album(id, `Artist ${id}`, Array.from({ length: 12 + a }, (_, i) => [`${id}${i + 1}`, 5, (i * 37 + a * 11) % 100, 40 + ((i * 17 + a * 5) % 60)])))

/** What the generation made, track by track (the titles of each playlist, in order). */
const made = (config) => playlistGenerationService.generate(ALBUMS, config)
const tracksOf = (config) => made(config).playlists.map(playlist => playlist.tracks.map(track => track.title))

/** The values a hidden option can be moved to, different from the default the panel starts from. */
const OTHER = {
    trackCount: 9, groupingStrategy: 'shuffle', outputMode: 'multiple', rankingType: 'bea', duration: 30
}

/** The ingredient that the configuration key stands for. */
const INGREDIENT_OF = { targetDuration: 'duration', rankingId: 'rankingType', outputMode: 'outputMode', groupingStrategy: 'groupingStrategy', trackCount: 'trackCount' }

describe('an option the panel hides from a recipe: does the recipe read it?', () => {
    const recipes = getAllAlgorithms()

    for (const recipe of recipes) {
        // a structure that splits, so that the duration is shown for a Top N recipe and the rest can be hidden
        const base = { ...DEFAULT_CHOICES, outputMode: recipe.id.startsWith('top-n') ? 'multiple' : DEFAULT_CHOICES.outputMode, duration: 45 }
        const shown = ingredientsOf(recipe.id)
        const hiddenKeys = Object.entries(INGREDIENT_OF).filter(([, ingredient]) => {
            if (ingredient === 'duration') return !showsDuration(shown, base.outputMode)
            return !shown[ingredient]
        })

        describe(recipe.id, () => {
            it('has options the panel hides from it (the check below is not empty)', () => {
                expect(hiddenKeys.map(([key]) => key).length).toBeGreaterThan(0)
            })

            for (const [key, ingredient] of hiddenKeys) {
                it(`${ingredient} (${key}): moving it changes no track and no order`, () => {
                    const asHandedOver = { algorithmId: recipe.id, ...configOf(base) }
                    const moved = { algorithmId: recipe.id, ...configOf({ ...base, [ingredient]: OTHER[ingredient] }) }
                    expect(moved[key]).not.toEqual(asHandedOver[key]) // it did move
                    expect(tracksOf(moved)).toEqual(tracksOf(asHandedOver))
                })
            }

            it('the playlists remember every option that was handed over, the hidden ones too (what a panel opened on them shows)', () => {
                const config = { algorithmId: recipe.id, ...configOf({ ...base, trackCount: OTHER.trackCount, groupingStrategy: OTHER.groupingStrategy }) }
                const [first] = made(config).playlists
                expect(first._meta).toMatchObject({ algorithmId: recipe.id, trackCount: 9, groupingStrategy: 'shuffle', outputMode: base.outputMode, targetDuration: 45 * MIN })
            })
        })
    }
})

describe('the options the panel SHOWS for a recipe are read by it (the control of the test above: the method can see a reading)', () => {
    it('the Top # of a Top N recipe changes the tracks, the duration of the balanced recipe changes the playlists', () => {
        const topN = { algorithmId: 'top-n-popular', ...configOf({ ...DEFAULT_CHOICES, outputMode: 'single' }) }
        expect(tracksOf({ ...topN, trackCount: 2 })).not.toEqual(tracksOf({ ...topN, trackCount: 6 }))

        const balanced = { algorithmId: 'mjrp-balanced-cascade', ...configOf(DEFAULT_CHOICES) }
        expect(tracksOf({ ...balanced, targetDuration: 30 * MIN })).not.toEqual(tracksOf({ ...balanced, targetDuration: 180 * MIN }))
    })
})
