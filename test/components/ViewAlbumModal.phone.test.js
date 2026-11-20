/**
 * F76, REQ-06 (audit finding 3): the album window on the phone has a bar with close always in
 * view, and the cover blurred behind the header; on the computer the window is the one of today.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { showViewAlbumModal } from '../../public/js/components/ViewAlbumModal.js'

const album = {
    id: 'dire-straits_brothers-in-arms', title: 'Brothers In Arms', artist: 'Dire Straits', year: 1985,
    coverUrl: 'https://example.com/bia.jpg',
    tracks: [{ title: 'So Far Away', position: 1 }, { title: 'Money for Nothing', position: 2 }]
}

const asScreen = (phone) => {
    window.matchMedia = (query) => ({
        matches: phone && query.includes('max-width'),
        addEventListener() { },
        removeEventListener() { }
    })
}

describe('the album window (F76)', () => {
    afterEach(() => {
        document.querySelectorAll('.modal-overlay').forEach(node => node.remove())
        delete window.matchMedia
    })

    it('on the phone: a bar first, with a named close that closes, and the cover behind the header', async () => {
        asScreen(true)
        const overlay = await showViewAlbumModal(album)
        const container = overlay.querySelector('.modal-container')
        const bar = container.firstElementChild

        expect(bar.classList.contains('album-window__bar')).toBe(true)
        expect(bar.classList.contains('md:hidden')).toBe(true) // never on the computer
        expect(bar.querySelector('.album-window__bar-title').textContent).toBe('Brothers In Arms')
        const glow = overlay.querySelector('.modal-header .album-window__glow')
        expect(glow.querySelector('img').getAttribute('src')).toBe(album.coverUrl)
        expect(glow.getAttribute('aria-hidden')).toBe('true')
        // the cover and the details keep their places in the header (mobile.css § 8.3 counts on them)
        const header = overlay.querySelector('.modal-header')
        expect(header.children[1].querySelector('h2').textContent).toBe('Brothers In Arms')

        const close = bar.querySelector('button.album-window__close')
        expect(close.getAttribute('aria-label')).toBe('Close')
        close.click()
        expect(overlay.style.opacity).toBe('0')
    })

    it('on the computer: the window of today, with no bar and no blurred cover', async () => {
        asScreen(false)
        const overlay = await showViewAlbumModal(album)
        const container = overlay.querySelector('.modal-container')

        expect(overlay.querySelector('.album-window__bar')).toBe(null)
        expect(overlay.querySelector('.album-window__glow')).toBe(null)
        expect(container.firstElementChild.classList.contains('modal-header')).toBe(true)
        expect([...container.children].map(c => c.className.split(' ')[0])).toEqual(['modal-header', 'modal-content', 'modal-footer'])
    })

    it('on the phone, an album with no cover has no blurred cover', async () => {
        asScreen(true)
        const overlay = await showViewAlbumModal({ ...album, coverUrl: null })
        expect(overlay.querySelector('.album-window__glow')).toBe(null)
        expect(overlay.querySelector('.album-window__bar')).not.toBe(null)
    })
})
