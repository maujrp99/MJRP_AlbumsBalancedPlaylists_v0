/**
 * F88 (REQ-02) - the line under the bar replaces the Series dropdown: where it was, nothing is lost.
 * It has «By Album» and the three kinds of series that are coming (shown, not links), and the three
 * places of Playlists (saved, new, series).
 */
import { describe, it, expect } from 'vitest'
import { subRowFor, renderSubRow } from '../../../public/js/components/navigation/subRow.js'

const draw = (path) => { document.body.innerHTML = renderSubRow(path); return document.querySelector('nav') }

describe('the line under the bar', () => {
    it('exists only for Albums and for Playlists', () => {
        for (const path of ['/start', '/blend', '/inventory', '/artists', '/somewhere']) expect(subRowFor(path)).toBeNull()
        expect(renderSubRow('/blend')).toBe('')
    })

    it.each(['/albums', '/albums/abc123'])('on %s: By Album (current) and the kinds of series coming, shown and not links', (path) => {
        const nav = draw(path)
        expect(nav.getAttribute('aria-label')).toBe('Albums')
        const links = [...nav.querySelectorAll('a')]
        expect(links.map(a => [a.textContent.trim(), a.getAttribute('href'), a.getAttribute('aria-current')])).toEqual([['By Album', '/albums', 'page']])
        const soon = [...nav.querySelectorAll('[aria-disabled="true"]')]
        expect(soon.map(s => s.textContent.replace(/\s+/g, ' ').trim())).toEqual(['By Artist Soon', 'By Genre Soon', 'By Track Soon'])
        soon.forEach(s => expect(s.tagName).not.toBe('A'))
    })

    it.each([
        ['/saved-playlists', 'Saved'],
        ['/playlists', 'New'],
        ['/playlists/edit', 'New'],
        ['/playlist-series', 'Series']
    ])('on %s the place of Playlists lit is %s', (path, label) => {
        const nav = draw(path)
        expect(nav.getAttribute('aria-label')).toBe('Playlists')
        expect([...nav.querySelectorAll('a')].map(a => a.getAttribute('href'))).toEqual(['/saved-playlists', '/playlists', '/playlist-series'])
        const current = [...nav.querySelectorAll('a[aria-current="page"]')]
        expect(current.map(a => a.textContent.trim())).toEqual([label])
    })
})
