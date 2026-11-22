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

/** F76, recheck N7: an inventory item's window, on the phone, folds the value and the stores. */
describe('the album window of an inventory item (F76, recheck N7)', () => {
    const item = { id: 'inv-1', title: album.title, artist: album.artist, format: 'cd', owned: true, albumData: album }
    let shown
    const value = () => ({
        view: () => shown,
        onWrite: async () => true, onForget: () => { }, onRead: async () => { }
    })
    afterEach(() => {
        document.querySelectorAll('.modal-overlay').forEach(node => node.remove())
        delete window.matchMedia
    })

    it('on the phone: one line with the value, its origin and the Discogs credit; the section opens on a tap', async () => {
        asScreen(true)
        shown = {
            value: { origin: 'discogs', currency: 'USD', readAt: '2026-11-19T12:00:00Z', conditions: { mint: 42.5, nearMint: 31, veryGoodPlus: 18.75 }, release: { url: 'https://www.discogs.com/release/1' } },
            money: { currency: 'USD' }, source: 'on', busy: false
        }
        const overlay = await showViewAlbumModal(item, { value: value() })
        const fold = overlay.querySelector('[data-role="value-fold"]')
        const toggle = fold.querySelector('.value-fold__toggle')
        expect(toggle.textContent).toMatch(/^Estimated value≈ \$30\.75Discogs · \d{1,2}\u00a0[A-Z][a-z]{2}$/) // REQ-16: and when it was read
        expect(toggle.getAttribute('aria-expanded')).toBe('false')
        const credit = fold.querySelector('.value-fold__line [data-role="discogs-credit"]')
        expect(credit.textContent).toBe('Data provided by Discogs.')
        expect(credit.getAttribute('href')).toBe('https://www.discogs.com/release/1')
        const panel = fold.querySelector('.value-fold__panel')
        expect(panel.hidden).toBe(true)
        expect(panel.querySelector('[data-role="estimated-value"]')).not.toBe(null) // the whole section, folded
        toggle.click()
        expect(panel.hidden).toBe(false)
        expect(toggle.getAttribute('aria-expanded')).toBe('true')

        // the stores, in one row, before the tracks
        const buy = overlay.querySelector('[data-role="where-to-buy"]')
        expect([...buy.querySelectorAll('.value-fold__store')].map(a => a.dataset.store)).toHaveLength(3)
        expect(buy.nextElementSibling.id).toBe('modal-ranking-container')

        // the line follows the section when it is drawn again (a value written, read again)
        shown = { ...shown, value: { origin: 'yours', amount: 50, currency: 'USD' } }
        overlay.redrawValue()
        expect(fold.querySelector('.value-fold__toggle').textContent).toBe('Estimated value≈ $50.00Yours')
        expect(fold.querySelector('.value-fold__line [data-role="discogs-credit"]')).toBe(null)
    })

    it('on the computer: the two sections of today, open, with no fold', async () => {
        asScreen(false)
        shown = { value: { origin: 'yours', amount: 50, currency: 'USD' }, money: { currency: 'USD' }, source: 'on', busy: false }
        const overlay = await showViewAlbumModal(item, { value: value() })
        expect(overlay.querySelector('[data-role="value-fold"]')).toBe(null)
        expect(overlay.querySelector('[data-role="estimated-value"]').parentElement.className).toContain('overflow-y-auto')
        expect(overlay.querySelector('[data-role="where-to-buy"] .btn-secondary')).not.toBe(null)
    })
})
