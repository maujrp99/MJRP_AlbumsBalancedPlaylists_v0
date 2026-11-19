import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BlendIngredientsPanel } from '../../../public/js/components/blend/BlendIngredientsPanel.js'
import { getAllAlgorithms } from '../../../public/js/algorithms/index.js'

// Mock Icons
vi.mock('../../../public/js/components/Icons.js', () => ({
    getIcon: (name) => `<svg data-icon="${name}"></svg>`
}))

describe('BlendIngredientsPanel', () => {
    let panel
    let container
    let mockCallback

    beforeEach(() => {
        // The panel finds its container by id: a container left by the test before would be found first
        document.body.innerHTML = ''
        container = document.createElement('div')
        container.id = 'test-panel'
        document.body.appendChild(container)

        mockCallback = vi.fn()
        panel = new BlendIngredientsPanel({
            containerId: 'test-panel',
            onConfigChange: mockCallback
        })
    })

    describe('Recipe Configuration (Visibility)', () => {
        it('should show duration and ranking for mjrp-balanced-cascade', () => {
            panel.setRecipe({ id: 'mjrp-balanced-cascade' })
            panel.render()

            expect(container.textContent).toContain('Target Duration')
            expect(container.textContent).toContain('Ranking Source')
            // Should NOT show Track Count section
            expect(container.innerHTML).not.toContain('Choose your Top #')
        })

        it('should show track count logic for top-n-popular', () => {
            panel.setRecipe({ id: 'top-n-popular' })
            panel.render()

            // Check for section headers
            expect(container.textContent).toContain('Choose your Top #')
            expect(container.textContent).toContain('Playlist Structure') // Output mode
        })

        // F62: an option is shown only where it changes the result
        it('shows the target duration of a Top N recipe when the output may be split, and hides it for one playlist', () => {
            panel.setRecipe({ id: 'top-n-popular' })

            panel.config.outputMode = 'auto' // splits when the tracks pass the target: the target is shown
            panel.render()
            expect(container.textContent).toContain('Target Duration')

            panel.config.outputMode = 'multiple'
            panel.render()
            expect(container.textContent).toContain('Target Duration')

            panel.config.outputMode = 'single'
            panel.render()
            expect(container.textContent).not.toContain('Target Duration')
        })

        it('shows «Discovery Mode» for no recipe of the menu: no recipe reads it (UAT-08)', () => {
            getAllAlgorithms().forEach(recipe => {
                panel.setRecipe(recipe)
                panel.render()
                expect(container.textContent, recipe.id).not.toContain('Discovery Mode')
            })
            expect(panel.getConfig()).not.toHaveProperty('discoveryMode')
        })

        it('says what «Combined» and «By Ranking» really do', () => {
            panel.setRecipe({ id: 'mjrp-balanced-cascade' })
            panel.render()
            expect(container.textContent).toContain('Acclaim first, popularity where unrated')

            panel.setRecipe({ id: 'top-n-user' })
            panel.render()
            expect(container.textContent).toContain('Every #1, then every #2')
            expect(container.textContent).not.toContain('Flow by Popularity')
        })
    })

    describe('getConfig Normalization', () => {
        it('should normalize duration to seconds', () => {
            panel.config.duration = 60
            const config = panel.getConfig()
            expect(config.targetDuration).toBe(3600)
        })

        it('should map ranking types to backend IDs', () => {
            panel.config.rankingType = 'combined'
            expect(panel.getConfig().rankingId).toBe('balanced')

            panel.config.rankingType = 'spotify'
            expect(panel.getConfig().rankingId).toBe('spotify')
        })

        it('should pass through trackCount', () => {
            panel.config.trackCount = 5
            expect(panel.getConfig().trackCount).toBe(5)
        })
    })

    describe('Interactions', () => {
        it('should update config and call callback on output mode change', () => {
            panel.setRecipe({ id: 's-draft-original' })
            panel.render()

            const btn = container.querySelector('[data-output="multiple"]')
            if (btn) btn.click()

            expect(panel.config.outputMode).toBe('multiple')
            expect(mockCallback).toHaveBeenCalled()
        })
    })
})
