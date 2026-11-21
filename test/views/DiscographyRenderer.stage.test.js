/**
 * F79 - the album card has a second form, the Home's («stage»): a button with the square cover, the
 * «+» to add it, the title and the year. The card of the series edit stays as it was (F57: one
 * renderer draws every album card).
 */
import { describe, it, expect } from 'vitest'
import { DiscographyRenderer } from '../../public/js/views/renderers/DiscographyRenderer.js'

const album = { id: 'a1', title: 'Animals', artist: 'Pink Floyd', year: 1977, type: 'Album', coverUrl: 'https://img/{w}x{h}.jpg' }

describe('the Home form of the album card (F79)', () => {
    it('is one button that says the album and the gesture, with the cover, «+», the title and the year', () => {
        const grid = document.createElement('div')
        new DiscographyRenderer(grid, { variant: 'stage' }).render([album, { ...album, id: 'a2', title: 'Animals Deluxe Live', type: 'Live' }])

        const card = grid.querySelector('[data-action="pick-album"]')
        expect(card.tagName).toBe('BUTTON')
        expect(card.getAttribute('type')).toBe('button')
        expect(card.classList.contains('home-card')).toBe(true)
        expect(card.dataset.id).toBe('a1')
        expect(card.getAttribute('aria-pressed')).toBe('false')
        expect(card.getAttribute('aria-label')).toBe('Animals, 1977. Click to add it')
        expect(card.querySelector('.home-card__cover img').getAttribute('src')).toBe('https://img/300x300.jpg')
        expect(card.querySelector('.home-card__mark svg')).not.toBeNull()
        expect(card.querySelector('.home-card__title').textContent).toBe('Animals')
        expect(card.querySelector('.home-card__year').textContent).toBe('1977')
        expect(grid.querySelectorAll('.home-card__year')[1].textContent).toBe('1977 · Deluxe, Live')
    })

    it('the card of the series edit is the one of before', () => {
        const grid = document.createElement('div')
        new DiscographyRenderer(grid).render([album])

        const card = grid.querySelector('[data-action="pick-album"]')
        expect(card.tagName).toBe('DIV')
        expect(card.querySelector('h3').textContent).toBe('Animals')
    })

    it('no album of the chosen types: says so, in both forms', () => {
        const grid = document.createElement('div')
        new DiscographyRenderer(grid, { variant: 'stage' }).render([])
        expect(grid.textContent).toBe('No albums of the selected types.')
    })
})
