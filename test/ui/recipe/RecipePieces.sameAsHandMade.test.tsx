/**
 * F83 wave 7a (REQ-05, risk 11 of the map of wave 7): the recipe cards and the ingredients of ui/recipe/ draw what the hand-made pieces draw
 * (components/blend/BlendRecipeCard.js, components/blend/BlendIngredientsPanel.js). The hand-made Blend screen (wave 7b) still uses the hand-made pieces, so
 * there are two writings of the same pieces for a while, and this test keeps them the same: the same elements, classes, attributes and text, for every recipe,
 * every choice and every structure. It is deleted in wave 7b with the hand-made pieces. A change to the pieces made on `main` in the meantime goes in both.
 * The comparison is the proof's `normalize`: it does not hide a changed word, a changed class or a text split in two nodes.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { RecipeCards } from '../../../public/js/ui/recipe/RecipeCards'
import { Ingredients } from '../../../public/js/ui/recipe/Ingredients'
import { BlendRecipeCard } from '../../../public/js/components/blend/BlendRecipeCard.js'
import { BlendIngredientsPanel } from '../../../public/js/components/blend/BlendIngredientsPanel.js'
import { getAllAlgorithms } from '../../../public/js/algorithms/index.js'
import { recipesOf } from '../../../public/js/models/recipeLooks.js'
import { GROUPING_STRATEGIES, OUTPUT_MODES, RANKING_TYPES, DEFAULT_CHOICES } from '../../../public/js/models/recipeIngredients.js'
import { registerTexts } from '../../../public/js/i18n/t.js'
import { normalize as pageOf } from '../../support/regenerateScenarios.js'

/** Says where two pages part, with a few words on each side (a whole page in a failed comparison is too long to read). */
function expectSame(now: string, old: string): void {
    let at = 0
    while (at < now.length && now[at] === old[at]) at++
    expect(now.slice(Math.max(0, at - 60), at + 60), `the pages part at ${at}; the hand-made one says: ${old.slice(Math.max(0, at - 60), at + 60)}`).toBe(old.slice(Math.max(0, at - 60), at + 60))
}

/** What is inside a box, compared: the box itself (its id) is not part of the piece. */
const normalize = (box: HTMLElement): string => [...box.children].map(child => pageOf(child as HTMLElement)).join('')

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const IDS = [...getAllAlgorithms().map(recipe => recipe.id), 'gone-recipe']

/** The hand-made piece's page: it writes into the element it finds by id. */
function handMade(draw: (containerId: string) => void): HTMLElement {
    const box = document.createElement('div')
    box.id = 'hand-made-box'
    document.body.appendChild(box)
    draw('hand-made-box')
    return box
}

async function inReact(element: React.ReactElement): Promise<HTMLElement> {
    const host = document.createElement('div')
    document.body.appendChild(host)
    await act(async () => { createRoot(host).render(element) })
    return host
}

describe('the recipe cards in React are the hand-made ones', () => {
    afterEach(() => { document.body.innerHTML = '' })

    for (const chosen of [...IDS, null]) {
        it(`with ${chosen ?? 'no recipe'} chosen`, async () => {
            const old = handMade((containerId) => {
                const cards = new BlendRecipeCard({ containerId })
                cards.selectedRecipe = cards.recipes.find((recipe: { id: string }) => recipe.id === chosen) ?? null
                cards.render()
            })
            const now = await inReact(<RecipeCards recipes={recipesOf(getAllAlgorithms())} selectedId={chosen} onSelect={() => {}} />)
            expectSame(normalize(now), normalize(old))
        })
    }
})

describe('the ingredients in React are the hand-made ones', () => {
    afterEach(() => { document.body.innerHTML = '' })

    // every recipe, every structure, every grouping and every source (the Top # and the duration walk through their values)
    const cases = IDS.flatMap(id => OUTPUT_MODES.flatMap(({ value: outputMode }) => GROUPING_STRATEGIES.flatMap(({ value: groupingStrategy }) => RANKING_TYPES.map(({ value: rankingType }) => ({ id, outputMode, groupingStrategy, rankingType })))))

    it('the cases cover the whole space', () => {
        expect(cases).toHaveLength(5 * 3 * 5 * 3)
    })

    cases.forEach((one, index) => {
        const choices = { ...DEFAULT_CHOICES, ...one, trackCount: 1 + (index % 10), duration: [30, 45, 60, 90, 120, 150, 180][index % 7] }
        if (index % 9 !== 0 && !(index < 20)) return // a ninth of the space and the first twenty: the walk is not slower than the suite wants
        it(`${one.id} · ${one.outputMode} · ${one.groupingStrategy} · ${one.rankingType} · Top ${choices.trackCount} · ${choices.duration} min`, async () => {
            const old = handMade((containerId) => {
                const panel = new BlendIngredientsPanel({ containerId, config: { ...choices } })
                panel.setRecipe({ id: one.id })
                panel.render()
            })
            const now = await inReact(<Ingredients recipeId={one.id} choices={choices} onChange={() => {}} />)
            expectSame(normalize(now), normalize(old))
        })
    })

    it('the slider and its number are the hand-made ones after the slider moved', async () => {
        const old = handMade((containerId) => {
            const panel = new BlendIngredientsPanel({ containerId })
            panel.setRecipe({ id: 'mjrp-balanced-cascade' })
            panel.render()
        })
        let latest = DEFAULT_CHOICES
        const host = document.createElement('div')
        document.body.appendChild(host)
        const root = createRoot(host)
        const show = () => act(async () => { root.render(<Ingredients recipeId="mjrp-balanced-cascade" choices={latest} onChange={(next) => { latest = next; show() }} />) })
        await show()
        // two pieces on one page have the same ids: ask the box for the slider by its type (a query by id is answered by the first element of the page)
        const sliderOf = (box: HTMLElement) => box.querySelector<HTMLInputElement>('input[type="range"]')!
        const numberOf = (box: HTMLElement) => box.querySelector('span.text-2xl')!.textContent
        for (const slider of [sliderOf(old), sliderOf(host)]) {
            await act(async () => {
                slider.value = '135'
                slider.dispatchEvent(new Event('input'))
            })
        }
        expectSame(normalize(host), normalize(old))
        expect(numberOf(host)).toBe('135m')
        expect(numberOf(old)).toBe('135m')
    })
})

describe('the comparison catches a difference (it is not a rubber stamp)', () => {
    afterEach(() => { document.body.innerHTML = '' })

    const drawBoth = async (): Promise<[string, string]> => {
        const old = handMade((containerId) => {
            const panel = new BlendIngredientsPanel({ containerId })
            panel.setRecipe({ id: 'top-n-popular' })
            panel.render()
        })
        const now = await inReact(<Ingredients recipeId="top-n-popular" choices={DEFAULT_CHOICES} onChange={() => {}} />)
        return [normalize(now), normalize(old)]
    }

    it('one word changed in a dictionary is a different page', async () => {
        const [same, was] = await drawBoth()
        expect(same).toBe(was)
        document.body.innerHTML = ''
        registerTexts('en', { 'ui.recipe.structure.single.label': 'Solo Playlist' })
        try {
            const [now, old] = await drawBoth()
            expect(now).not.toBe(old)
            expect(now).toContain('Solo Playlist')
        } finally {
            registerTexts('en', { 'ui.recipe.structure.single.label': 'Single Playlist' })
        }
    })

    it('a text split in two nodes is a different page too', () => {
        const whole = document.createElement('div')
        whole.innerHTML = '<span>Top 3</span>'
        const split = document.createElement('div')
        split.appendChild(document.createElement('span')).append('Top ', '3')
        expect(normalize(whole)).not.toBe(normalize(split))
    })
})
