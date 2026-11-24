/**
 * generate - what «Blend it!» does (F83 wave 7b; `handleGenerate` of the hand-made view): ask the controller for the playlists of the series with the recipe and the
 * five keys of the ingredients, say what the load left out, say it is done, and take the person to the playlists screen of that series.
 *
 * It is called from the click, never from an effect (the strict mode runs an effect twice, and a generation is not asked twice). The move goes by the bridge, which hands it
 * to the router after the draw in course. It never throws: it answers with the message of a failure, or nothing when it went well or when the person left while the albums
 * loaded (the visit aborts the load: nothing is said then).
 */
import toast from '../../stores/toasts.js'
import { blendingController } from '../../controllers/BlendingController.js'
import { t, tPlural } from '../../i18n/t.js'
import { configOf } from '../../models/recipeIngredients.js'
import { navigate } from '../../react-bridge/navigation'
import type { Choices } from '../../ui/recipe/Ingredients'
import type { BlendVisit } from './blendVisit'
import type { BlendingController, Series } from './types'

/** How long a notice about what the load left out stays: it is read on the next screen. */
const NOTICE_MS = 10000

interface Generation {
    visit: BlendVisit
    chosen: Series
    recipe: { id: string }
    choices: Choices
    onProgress: (message: string) => void
}

/** @returns the message of the failure to show, or null (it went well, or the person left) */
export async function generate({ visit, chosen, recipe, choices, onProgress }: Generation): Promise<string | null> {
    const signal = visit.beginGeneration() // aborted if the person leaves while the albums load
    const controller: object = blendingController
    try {
        const config = { algorithmId: recipe.id, ...configOf(choices, recipe.id) }
        const result = await (controller as BlendingController).generateFromSeries(chosen.id, config, { onProgress, signal })
        // what the load left out (albums that failed, sources missing) is said before the result
        result.notices.forEach((notice: string) => toast.warning(notice, NOTICE_MS))
        toast.success(tPlural('blend.generated', result.playlists.length, { count: result.playlists.length }))
        navigate(`/playlists?seriesId=${chosen.id}`)
        return null
    } catch (error) {
        if ((error as Error | undefined)?.name === 'BlendCancelledError') return null // the person left: nothing to show
        console.error('[Blend] Generation error:', error)
        return (error as Error | undefined)?.message || t('blend.failed')
    }
}
