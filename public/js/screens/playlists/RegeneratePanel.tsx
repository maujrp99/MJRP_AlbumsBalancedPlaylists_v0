/**
 * RegeneratePanel - the panel «Reconfigure your Music Playlist Blend» of the playlists screen (F83 wave 7a; it was components/playlists/RegeneratePanel.js
 * behind react-bridge/legacy/RegeneratePanel.tsx): a header that folds, the cards to choose the recipe, the ingredients, and «Regenerate Playlists».
 * The same HTML and the same behaviour as the hand-made panel. The cards and the ingredients are ui/recipe/, shared with the Blend screen.
 *
 * What it does as the hand-made panel did:
 *   - it is made again (a new `key`) whenever what it is made from changes: the playlists on screen, the series, the batch name. It is NOT made again
 *     for another reason (a letter typed in the name field), so what the person changed and did not generate yet is kept by `regenerateMemory`
 *     through every new making; whether it is open is kept here, outside the making;
 *   - choosing a recipe draws the cards and the ingredients anew; a button of the ingredients draws them anew; the slider does not;
 *   - «Regenerate Playlists» hands the controller the configuration in the form of the generation (`algorithmId` and the five keys of the ingredients),
 *     the ones a recipe does not show included: an option chosen for a recipe and hidden by the next one still goes (a defect kept by the migration);
 *   - on the phone the «⋯» of a playlist asks for the panel: it opens (if shut) and the page scrolls to it. The screen counts the asks (`asked`).
 */
import { useLayoutEffect, useRef, useState } from 'react'
import { Icon } from '../../ui/Icon'
import { RecipeCards, type RecipeOfCard } from '../../ui/recipe/RecipeCards'
import { Ingredients, type Choices } from '../../ui/recipe/Ingredients'
import { t, tPlural } from '../../i18n/t.js'
import { getAllAlgorithms } from '../../algorithms/index.js'
import { recipesOf } from '../../models/recipeLooks.js'
import { choicesOf, configOf } from '../../models/recipeIngredients.js'
import { recipeToShow, remember, type GeneratedRecipe } from './regenerateMemory'

export interface RegeneratePanelProps {
    seriesId?: string
    batchName: string
    ids: string[]
    count: number
    /** The recipe the playlists on screen were generated with (`_meta` of a playlist), or null when they do not say. */
    generatedWith: object | null
    /** How many times the phone asked for the panel (the «⋯» of a playlist, «Reconfigure and regenerate»). */
    asked: number
    /** Called with the recipe in the panel, in the form of the generation, when «Regenerate Playlists» is pressed. */
    onRegenerate: (config: object) => void
}

export function RegeneratePanel({ seriesId, batchName, ids, count, generatedWith, asked, onRegenerate }: RegeneratePanelProps) {
    const box = useRef<HTMLDivElement>(null)
    const [expanded, setExpanded] = useState(false)
    // the phone asked for the panel: it opens in this same draw (the old panel toggled first and scrolled after)
    const [seen, setSeen] = useState(asked)
    if (asked !== seen) {
        setSeen(asked)
        setExpanded(true)
    }
    useLayoutEffect(() => {
        if (asked) box.current?.querySelector('.regenerate-panel')?.scrollIntoView({ block: 'start' })
    }, [asked])
    const made = JSON.stringify({ seriesId, batchName, ids, count, generatedWith })
    return (
        <div ref={box} id="regeneratePanelMount" className="mb-6 fade-in" style={{ animationDelay: '0.05s' }}>
            <PanelBody key={made} seriesId={seriesId ?? ''} batchName={batchName} playlistCount={count || ids.length} generatedWith={generatedWith as GeneratedRecipe | null} expanded={expanded} onToggle={() => setExpanded(open => !open)} onRegenerate={onRegenerate} />
        </div>
    )
}

interface BodyProps {
    seriesId: string
    batchName: string
    playlistCount: number
    generatedWith: GeneratedRecipe | null
    expanded: boolean
    onToggle: () => void
    onRegenerate: (config: object) => void
}

function PanelBody({ seriesId, batchName, playlistCount, generatedWith, expanded, onToggle, onRegenerate }: BodyProps) {
    const recipes: RecipeOfCard[] = recipesOf(getAllAlgorithms())
    // made from what was changed and not generated yet, else the recipe of the playlists, else the recommended one
    const [recipeId, setRecipeId] = useState(() => {
        const wanted = recipeToShow(generatedWith).algorithmId
        return recipes.find(recipe => recipe.id === wanted)?.id ?? recipes[0]?.id ?? wanted
    })
    const [choices, setChoices] = useState<Choices>(() => choicesOf(recipeToShow(generatedWith)))
    const [recipeChosen, setRecipeChosen] = useState(0)

    const chooseRecipe = (recipe: RecipeOfCard) => {
        setRecipeId(recipe.id)
        setRecipeChosen(count => count + 1)
        remember({ algorithmId: recipe.id, ...configOf(choices) })
    }
    const change = (next: Choices) => {
        setChoices(next)
        remember({ algorithmId: recipeId, ...configOf(next) })
    }

    return (
        <div className="regenerate-panel bg-surface rounded-xl border border-white/10 mb-6" data-series-id={seriesId} data-batch-name={batchName}>
            <button className="regenerate-header w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors" data-action="toggle-regenerate-panel" onClick={onToggle}>
                <div className="flex items-center gap-3">
                    <Icon name="RefreshCw" className="w-5 h-5 text-brand-orange" />
                    <h3 className="regenerate-header text-lg font-bold flex-1">{t('playlists.regenerate.title')}</h3>
                    <span className="text-sm text-muted">{tPlural('playlists.regenerate.count', playlistCount, { count: playlistCount })}</span>
                </div>
                <div className={`regenerate-chevron transition-transform ${expanded ? 'rotate-180' : ''}`}>
                    <Icon name="ChevronDown" className="w-5 h-5" />
                </div>
            </button>
            <div className={`regenerate-content ${expanded ? '' : 'hidden'} border-t border-white/10 p-4 space-y-4`}>
                <div id="regenerate-recipe-container">
                    <RecipeCards recipes={recipes} selectedId={recipeId} onSelect={chooseRecipe} />
                </div>
                <div id="regenerate-ingredients-container">
                    <Ingredients recipeId={recipeId} choices={choices} onChange={change} recipeChosen={recipeChosen} />
                </div>
                <button className="btn btn-primary w-full flex items-center justify-center gap-2" data-action="regenerate-playlists" onClick={() => onRegenerate({ algorithmId: recipeId, ...configOf(choices) })}>
                    <Icon name="RefreshCw" className="w-5 h-5" />
                    <span>{t('playlists.regenerate.button')}</span>
                </button>
            </div>
        </div>
    )
}
