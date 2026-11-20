/**
 * F72 (S-55) - the header of the albums screen shows the count line it is given.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import SeriesHeader from '../../../public/js/components/series/SeriesHeader.js'

describe('SeriesHeader: how many series and albums', () => {
    let container
    beforeEach(() => { container = document.createElement('div') })
    const header = (props) => { const h = new SeriesHeader({ container, props: { onGeneratePlaylists: () => {}, ...props } }); h.mount(); return h }

    it('shows the count line under the title', () => {
        header({ pageTitle: 'All Albums Series', counts: '47 series · 227 albums' })
        expect(container.querySelector('[data-series-counts]').textContent).toBe('47 series · 227 albums')
    })

    it('has no line when there is nothing to say', () => {
        header({ pageTitle: 'All Albums Series', counts: '' })
        expect(container.querySelector('[data-series-counts]')).toBeNull()
    })

    it('follows a new count', () => {
        const h = header({ pageTitle: 'All Albums Series', counts: '47 series · 227 albums' })
        h.update({ counts: '12 of 47 series · 60 albums' })
        expect(container.querySelector('[data-series-counts]').textContent).toBe('12 of 47 series · 60 albums')
        expect(container.querySelectorAll('[data-series-counts]')).toHaveLength(1)
    })
})
