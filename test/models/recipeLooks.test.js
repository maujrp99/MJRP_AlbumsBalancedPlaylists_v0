/**
 * F83 wave 7a: the look of a recipe card (models/recipeLooks.js), the table the hand-made card (components/blend/BlendRecipeCard.js)
 * had inside it. The two stay equal until the Blend screen moves (wave 7b); the first test reads the hand-made one.
 */
import { describe, it, expect } from 'vitest'
import { BlendRecipeCard } from '../../public/js/components/blend/BlendRecipeCard.js'
import { getAllAlgorithms } from '../../public/js/algorithms/index.js'
import { recipeLooksOf, badgeClassOf, cardClassOf, recipesOf } from '../../public/js/models/recipeLooks.js'

describe('recipeLooks: the icon and the colors of a recipe', () => {
    it('are the ones of the hand-made card, for every recipe of the menu and for one the card does not know', () => {
        const handMade = new BlendRecipeCard()
        const ids = [...getAllAlgorithms().map(recipe => recipe.id), 'gone-recipe']
        for (const id of ids) {
            const looks = recipeLooksOf(id)
            expect(looks.icon, id).toBe(handMade.getRecipeIcon(id))
            expect({ from: looks.from, to: looks.to }, id).toEqual(handMade.getRecipeColor(id))
        }
    })

    it('a recipe that is chosen has its colors at 10 % written whole (Tailwind reads them in the source, nothing is put together at run time)', () => {
        expect(recipeLooksOf('top-n-popular')).toMatchObject({ from: 'from-green-500', to: 'to-emerald-600', fromTint: 'from-green-500/10', toTint: 'to-emerald-600/10' })
        expect(recipeLooksOf('gone-recipe')).toMatchObject({ icon: 'Music', fromTint: 'from-gray-500/10', toTint: 'to-gray-600/10' })
    })
})

describe('recipeLooks: the class of the badge', () => {
    it.each([
        [{ badge: 'RECOMMENDED', isRecommended: true }, 'bg-amber-400/20 text-amber-400 font-bold'],
        [{ badge: 'SPOTIFY', isRecommended: false }, 'bg-green-500/20 text-green-400 font-semibold'],
        [{ badge: 'BEA', isRecommended: false }, 'bg-rose-500/20 text-rose-400 font-semibold'],
        [{ badge: 'TOP 3', isRecommended: false }, 'bg-orange-500/20 text-orange-400'],
        [{ badge: 'TOP 5', isRecommended: false }, 'bg-blue-500/20 text-blue-400'],
        [{ badge: 'USER', isRecommended: false }, 'bg-gray-500/20 text-gray-400'],
        [{ isRecommended: false }, 'bg-gray-500/20 text-gray-400']
    ])('%j', (recipe, expected) => {
        expect(badgeClassOf(recipe)).toBe(expected)
    })
})

describe('recipeLooks: the class of the card', () => {
    const looks = recipeLooksOf('top-n-user')

    it('the chosen one has the ring and its gradient; the recommended one that is not chosen is amber; the others are plain', () => {
        expect(cardClassOf({ isSelected: true, isRecommended: false }, looks)).toBe('border-amber-400 bg-gradient-to-br from-sky-500/10 to-blue-600/10 ring-2 ring-orange-400 shadow-lg shadow-orange-400/20')
        expect(cardClassOf({ isSelected: false, isRecommended: true }, looks)).toBe('border-amber-400/40 bg-gradient-to-br from-amber-900/10 to-orange-900/5 hover:border-amber-400/60')
        expect(cardClassOf({ isSelected: false, isRecommended: false }, looks)).toBe('border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10')
    })
})

describe('recipeLooks: the recipes of the registry as the cards take them', () => {
    it('keep the order of the registry and carry what the card needs, not the texts (the screen says the names by the dictionary)', () => {
        const recipes = recipesOf(getAllAlgorithms())
        expect(recipes.map(recipe => recipe.id)).toEqual(['mjrp-balanced-cascade', 'top-n-popular', 'top-n-acclaimed', 'top-n-user'])
        expect(recipes[0]).toMatchObject({ id: 'mjrp-balanced-cascade', badge: 'RECOMMENDED', isRecommended: true, looks: { icon: 'Sparkles' } })
        expect(recipes.map(recipe => Object.keys(recipe).sort())).toEqual(recipes.map(() => ['badge', 'id', 'isRecommended', 'looks']))
    })
})
