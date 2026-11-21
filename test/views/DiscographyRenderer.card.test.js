/**
 * The album card of the series edit (F57: one renderer draws every album card of the hand-made screens). The Start screen's own form
 * of the card (the «stage» card, F79) is drawn in React since F83 wave 4: see test/screens/start/Start.stage.test.js and
 * Start.sameAsBefore.test.tsx.
 */
import { describe, it, expect } from 'vitest'
import { DiscographyRenderer } from '../../public/js/views/renderers/DiscographyRenderer.js'

const album = { id: 'a1', title: 'Animals', artist: 'Pink Floyd', year: 1977, type: 'Album', coverUrl: 'https://img/{w}x{h}.jpg' }

describe('the album card of the series edit', () => {
    it('is a block with the cover, the title and the year', () => {
        const grid = document.createElement('div')
        new DiscographyRenderer(grid).render([album])

        const card = grid.querySelector('[data-action="pick-album"]')
        expect(card.tagName).toBe('DIV')
        expect(card.dataset.id).toBe('a1')
        expect(card.querySelector('h3').textContent).toBe('Animals')
        expect(card.querySelector('img').getAttribute('src')).toBe('https://img/300x300.jpg')
    })

    it('says so when no album has the types chosen', () => {
        const grid = document.createElement('div')
        new DiscographyRenderer(grid).render([])
        expect(grid.textContent).toBe('No albums of the selected types.')
    })
})
