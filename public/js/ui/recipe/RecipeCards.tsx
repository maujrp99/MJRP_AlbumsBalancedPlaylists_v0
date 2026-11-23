/**
 * RecipeCards - the cards to choose the recipe of a blend (F83 wave 7a), the piece the playlists screen's panel to generate again and,
 * from wave 7b, the Blend screen both use. The same HTML and the same classes as the hand-made cards (components/blend/BlendRecipeCard.js,
 * deleted with the hand-made Blend screen in wave 7b); the pictures of the two screens (test/fixtures/blendBeforeF83.json, regenerateBeforeF83.json) keep them the same.
 *
 * It has no store and no service: it is given the recipes (models/recipeLooks.js `recipesOf`) and the one that is chosen, and tells which
 * card was pressed. What it does as the hand-made cards did: pressing a card draws the whole row of cards anew (a new `key`), so that nothing of the
 * row keeps what it held. The cards are `div`s the mouse presses: they have no role and no tab stop, so they cannot be chosen by the
 * keyboard; that is how they were (a defect kept by the migration, to be fixed in the two screens at once).
 * The words come from the dictionary by the id of the recipe (`blend.recipes.<id>.name|description|badge`). The label and the badge are written as the hand-made template
 * broke them in lines (`broken`, ONE text node, like the hand-made one): the browser draws none of that white space, but WebKit shapes the characters it is given, and the test of
 * the playlists screen compares it.
 */
import { useState } from 'react'
import { Icon } from '../Icon'
import { t } from '../../i18n/t.js'
import { badgeClassOf, cardClassOf } from '../../models/recipeLooks.js'
import { broken } from './broken'

export interface RecipeOfCard {
    id: string
    badge?: string
    isRecommended: boolean
    looks: { icon: string; from: string; to: string; fromTint: string; toTint: string }
}

export interface RecipeCardsProps {
    recipes: RecipeOfCard[]
    /** The id of the chosen recipe, or null when none is. */
    selectedId: string | null
    onSelect: (recipe: RecipeOfCard) => void
}

/** `top-n-popular` is `topNPopular`: the part of a dictionary key that names the recipe (a key has no hyphen). */
export const recipeKeyOf = (id: string): string => id.replace(/-(\w)/g, (_, letter: string) => letter.toUpperCase())

export function RecipeCards({ recipes, selectedId, onSelect }: RecipeCardsProps) {
    // pressing a card draws the row of cards anew, as the hand-made cards did (the focus and what a card held do not survive it)
    const [drawn, setDrawn] = useState(0)
    return (
        <div key={drawn} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {recipes.map(recipe => (
                <RecipeCard key={recipe.id} recipe={recipe} isSelected={selectedId === recipe.id} onPress={() => { onSelect(recipe); setDrawn(count => count + 1) }} />
            ))}
        </div>
    )
}

function RecipeCard({ recipe, isSelected, onPress }: { recipe: RecipeOfCard; isSelected: boolean; onPress: () => void }) {
    const { isRecommended, looks } = recipe
    const key = recipeKeyOf(recipe.id)
    return (
        <div
            className={`blend-recipe-card group relative cursor-pointer p-4 rounded-xl border transition-all duration-300 transform hover:scale-[1.02] ${cardClassOf({ isSelected, isRecommended }, looks)}`}
            data-recipe-id={recipe.id}
            onClick={onPress}
        >
            {isRecommended ? (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-400 text-black whitespace-nowrap">{broken(t('ui.recipe.recommended'), 24, 20)}</div>
            ) : null}
            <div className="flex items-center justify-center mb-3">
                <div className={`w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br ${looks.from} ${looks.to} flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                    <Icon name={looks.icon} className="w-6 h-6 text-white" />
                </div>
            </div>
            <h4 className={`font-bold text-base mb-1 ${isSelected || isRecommended ? 'text-amber-400' : ''}`}>{t(`blend.recipes.${key}.name`)}</h4>
            <span className={`inline-block px-2 py-0.5 text-[10px] rounded-full mb-2 ${badgeClassOf(recipe)}`}>{broken(recipe.badge ? t(`blend.recipes.${key}.badge`) : t('ui.recipe.badgeDefault'), 20, 16)}</span>
            <p className="text-[11px] text-muted leading-snug line-clamp-2">{t(`blend.recipes.${key}.description`)}</p>
        </div>
    )
}
