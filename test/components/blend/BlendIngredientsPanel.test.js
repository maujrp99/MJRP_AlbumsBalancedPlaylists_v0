import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BlendIngredientsPanel } from '../../../public/js/components/blend/BlendIngredientsPanel.js'

// Mock Icons
vi.mock('../../../public/js/components/Icons.js', () => ({
    getIcon: (name) => `<svg data-icon="${name}"></svg>`
}))

describe('BlendIngredientsPanel', () => {
    let panel
    let container
    let mockCallback

    beforeEach(() => {
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
            // Should NOT show Duration
            expect(container.textContent).not.toContain('Target Duration')
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
