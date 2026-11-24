/**
 * The tests of the hand-made panel of ingredients (test/components/blend/BlendIngredientsPanel.test.js: 9 cases), taken over for the piece in React (F83 wave 7a).
 * The assertions are the same; what changes is the scaffold: the piece is drawn into a box on the page, a choice made by the test is a prop (the owner holds
 * the choices: `panel.config.outputMode = 'auto'` is `outputMode: 'auto'`), and `panel.getConfig()` is `configOf(choices)` of models/recipeIngredients.js,
 * where the rule moved to. The original stays with the hand-made panel until the Blend screen moves (wave 7b), when it is deleted with it.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Ingredients, type Choices } from '../../../public/js/ui/recipe/Ingredients'
import { DEFAULT_CHOICES, configOf } from '../../../public/js/models/recipeIngredients.js'
import { getAllAlgorithms } from '../../../public/js/algorithms/index.js'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

describe('Ingredients', () => {
    let container: HTMLElement
    let root: Root
    let mockCallback: ReturnType<typeof vi.fn>

    /** Draws the piece for a recipe, with the choices given over the defaults (what the old test wrote into `panel.config`). */
    const draw = async (recipeId: string | undefined, choices: Partial<Choices> = {}) => {
        await act(async () => { root.render(<Ingredients recipeId={recipeId} choices={{ ...DEFAULT_CHOICES, ...choices }} onChange={mockCallback} />) })
    }

    beforeEach(() => {
        // the box is found by the page: a box left by the test before would be found first
        document.body.innerHTML = ''
        container = document.createElement('div')
        container.id = 'test-panel'
        document.body.appendChild(container)
        root = createRoot(container)
        mockCallback = vi.fn()
    })

    afterEach(async () => {
        await act(async () => { root.unmount() })
    })

    describe('Recipe Configuration (Visibility)', () => {
        it('should show duration and ranking for mjrp-balanced-cascade', async () => {
            await draw('mjrp-balanced-cascade')

            expect(container.textContent).toContain('Target Duration')
            expect(container.textContent).toContain('Ranking Source')
            // Should NOT show Track Count section
            expect(container.innerHTML).not.toContain('Choose your Top #')
        })

        it('should show track count logic for top-n-popular', async () => {
            await draw('top-n-popular')

            // Check for section headers
            expect(container.textContent).toContain('Choose your Top #')
            expect(container.textContent).toContain('Playlist Structure') // Output mode
        })

        // F62: an option is shown only where it changes the result
        it('shows the target duration of a Top N recipe when the output may be split, and hides it for one playlist', async () => {
            await draw('top-n-popular', { outputMode: 'auto' }) // splits when the tracks pass the target: the target is shown
            expect(container.textContent).toContain('Target Duration')

            await draw('top-n-popular', { outputMode: 'multiple' })
            expect(container.textContent).toContain('Target Duration')

            await draw('top-n-popular', { outputMode: 'single' })
            expect(container.textContent).not.toContain('Target Duration')
        })

        it('shows «Discovery Mode» for no recipe of the menu: no recipe reads it (UAT-08)', async () => {
            for (const recipe of getAllAlgorithms()) {
                await draw(recipe.id)
                expect(container.textContent, recipe.id).not.toContain('Discovery Mode')
            }
            expect(configOf(DEFAULT_CHOICES)).not.toHaveProperty('discoveryMode')
        })

        it('says what «Combined» and «By Ranking» really do', async () => {
            await draw('mjrp-balanced-cascade')
            expect(container.textContent).toContain('Acclaim first, popularity where unrated')

            await draw('top-n-user')
            expect(container.textContent).toContain('Every #1, then every #2')
            expect(container.textContent).not.toContain('Flow by Popularity')
        })
    })

    describe('getConfig Normalization', () => {
        it('should normalize duration to seconds', () => {
            const config = configOf({ ...DEFAULT_CHOICES, duration: 60 })
            expect(config.targetDuration).toBe(3600)
        })

        it('should map ranking types to backend IDs', () => {
            expect(configOf({ ...DEFAULT_CHOICES, rankingType: 'combined' }).rankingId).toBe('balanced')

            expect(configOf({ ...DEFAULT_CHOICES, rankingType: 'spotify' }).rankingId).toBe('spotify')
        })

        it('should pass through trackCount', () => {
            expect(configOf({ ...DEFAULT_CHOICES, trackCount: 5 }).trackCount).toBe(5)
        })
    })

    // F92, REQ-10: «Deep cuts» lets the person skip 3 + X of the most popular tracks of each album
    describe('the skip slider of «Deep cuts»', () => {
        const slider = () => container.querySelector<HTMLInputElement>('#blend-skip-slider')

        it('is drawn for «Deep cuts», from 3 to 10, at 3, and says how many it skips', async () => {
            await draw('deep-cuts')
            expect(slider()).not.toBeNull()
            expect([slider()!.min, slider()!.max, slider()!.value]).toEqual(['3', '10', '3'])
            expect(container.querySelector('#blend-skip-display')!.textContent).toBe('3')
            expect(container.textContent).toContain('Skip the most popular')
        })

        it('moving it hands the new skip to the owner and shows it', async () => {
            await draw('deep-cuts')
            await act(async () => {
                slider()!.value = '5'
                slider()!.dispatchEvent(new Event('input', { bubbles: true }))
            })
            expect(mockCallback.mock.calls.at(-1)![0].skip).toBe(5)
            expect(container.querySelector('#blend-skip-display')!.textContent).toBe('5')
        })

        it('is not drawn for «Least played» nor for a Top N recipe', async () => {
            await draw('least-played')
            expect(slider()).toBeNull()
            await draw('top-n-popular')
            expect(slider()).toBeNull()
        })

        it('the recipes made of blocks show no Top # and no shuffle', async () => {
            for (const id of ['deep-cuts', 'least-played']) {
                await draw(id)
                expect(container.textContent, id).not.toContain('Choose your Top #')
                expect(container.querySelector('[data-grouping="shuffle"]'), id).toBeNull()
                expect(container.querySelector('[data-grouping="by_album"]'), id).not.toBeNull()
            }
        })
    })

    describe('Interactions', () => {
        it('should update config and call callback on output mode change', async () => {
            await draw('s-draft-original')

            const btn = container.querySelector<HTMLElement>('[data-output="multiple"]')
            if (btn) await act(async () => { btn.click() })

            expect(mockCallback.mock.calls.at(-1)![0].outputMode).toBe('multiple')
            expect(mockCallback).toHaveBeenCalled()
        })
    })
})
