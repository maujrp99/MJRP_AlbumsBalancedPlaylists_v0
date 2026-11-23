/**
 * regenerateMemory - what the panel to generate again remembers between the draws of the playlists screen and between visits (F83 wave 7a; it was
 * the static `pending` of components/playlists/RegeneratePanel.js).
 *
 * The recipe the panel shows is, in this order: what the person changed in the panel and did not generate yet (`pending`, kept through every
 * draw of the panel, because the panel is made again whenever what it is made from changes), or the recipe the playlists on screen were generated
 * with, or the recommended one. Always in the form the generation takes (algorithmId, rankingId, targetDuration in seconds, outputMode,
 * groupingStrategy, trackCount). It lives as long as the page: the screen forgets it when it opens (`playlistsView`) and after a generation.
 */

/** A recipe in the form of the generation. */
export interface GeneratedRecipe {
    algorithmId: string
    rankingId?: string
    targetDuration?: number
    outputMode?: string
    groupingStrategy?: string
    trackCount?: number
}

/** The recipe the panel opens on when the playlists do not say how they were generated. */
const DEFAULT_RECIPE: GeneratedRecipe = Object.freeze({ algorithmId: 'mjrp-balanced-cascade', rankingId: 'balanced' })

let pending: GeneratedRecipe | null = null

/** What the panel shows: what was changed and not generated yet, else the recipe of the playlists, else the recommended one. */
export const recipeToShow = (generatedWith: GeneratedRecipe | null): GeneratedRecipe => ({ ...(pending || generatedWith || DEFAULT_RECIPE) })

/** What is in the panel now becomes what the next draw shows. */
export function remember(config: GeneratedRecipe): void {
    pending = { ...config }
}

/** Forget what was changed in the panel: after a generation, and when the screen opens. */
export function forgetWhatWasChanged(): void {
    pending = null
}
