import { SafeDOM } from '../../utils/SafeDOM.js'
import { getIcon } from '../Icons.js'
import { openSheet } from '../ui/Sheet.js'
import { coverImage } from '../ui/coverImage.js'

/**
 * The chosen albums of a new series, on the phone (F76, REQ-09). Phone only: the Home mounts it
 * when isPhone() and unmounts it when the screen stops being a phone. On the computer the chosen
 * set stays where it was (section 03 of the left panel).
 *
 *  - a `.phone-action-bar`: «N albums chosen» (a tap opens the chosen set) and «Create series»,
 *    always in view; with none chosen the button is off and the note says why;
 *  - the answer ON the album tapped: an orange ring and a round mark with its place (1, 2, 3…),
 *    so the choice is said by shape and number, not by colour alone;
 *  - a sheet with the chosen set: each album removed (with «Undo») and moved up or down, no dragging.
 *
 * It decides nothing: every change goes through the Home's staging controller (the same methods
 * the computer uses), and it draws from the list it is given.
 */
const COVERS_IN_BAR = 3

const coverOf = (album, size) => {
    const template = album.artworkTemplate || album.coverUrl
    return template ? template.replace('{w}', size).replace('{h}', size) : null
}

const countText = (n) => (n === 0 ? 'No albums chosen' : `${n} album${n === 1 ? '' : 's'} chosen`)

export class HomePhoneChosen {
    /**
     * @param {Object} options
     * @param {{ removeAlbum: Function, moveAlbum: Function, insertAlbum: Function }} options.staging
     * @param {() => void} options.onCreate - «Create series» (the Home's own action)
     * @param {(selector: string) => NodeList} options.findCards - the album cards on screen
     */
    constructor({ staging, onCreate, findCards }) {
        this.staging = staging
        this.onCreate = onCreate
        this.findCards = findCards
        this.albums = []
        this.busy = false
        this.removed = null // { album, index } the last album removed in the sheet, for «Undo»
        this.sheet = null
        this.bar = null
    }

    /** @param {HTMLElement} host - where the bar goes (it is fixed: the place in the page does not matter) */
    mount(host) {
        if (this.bar || !host) return
        const count = SafeDOM.button({ type: 'button', className: 'phone-action-bar__note home-chosen-count', dataset: { action: 'open-chosen' } })
        const create = SafeDOM.button({ type: 'button', id: 'btnCreateSeriesPhone', className: 'btn btn-primary home-chosen-create' }, 'Create series')
        count.addEventListener('click', () => this.openSheet())
        create.addEventListener('click', () => this.onCreate())
        this.bar = SafeDOM.div({ className: 'phone-action-bar home-chosen-bar md:hidden' }, [count, create])
        this.elements = { count, create }
        host.appendChild(this.bar)
        this.show(this.albums)
    }

    unmount() {
        this.sheet?.close()
        this.bar?.remove()
        this.bar = null
        this.findCards('[data-action="pick-album"]').forEach(card => this.unmark(card))
    }

    /** Draw from the chosen list: the bar, the marks on the cards, the sheet when it is open. */
    show(albums) {
        this.albums = [...albums]
        if (!this.bar) return
        this.drawBar()
        this.markCards()
        if (this.sheet?.isOpen()) this.drawSheet()
    }

    /** «Create series» while the series is written: busy, and not to be tapped again. */
    setBusy(busy) {
        this.busy = busy
        if (this.bar) this.drawBar()
    }

    drawBar() {
        const { count, create } = this.elements
        const n = this.albums.length
        SafeDOM.clear(count)
        const covers = this.albums.slice(-COVERS_IN_BAR).map(album =>
            coverImage({ src: coverOf(album, '64'), className: 'home-chosen-count__cover', alt: '' }))
        if (covers.length) count.appendChild(SafeDOM.span({ className: 'home-chosen-count__covers', 'aria-hidden': 'true' }, covers))
        count.appendChild(SafeDOM.span({ className: 'home-chosen-count__text' }, [
            SafeDOM.span({ className: 'home-chosen-count__n' }, countText(n)),
            SafeDOM.span({ className: 'home-chosen-count__hint' }, n === 0 ? 'Pick albums to start' : 'Tap to review')
        ]))
        count.disabled = n === 0
        create.textContent = this.busy ? 'Creating…' : 'Create series'
        create.disabled = n === 0 || this.busy
        if (this.busy) create.setAttribute('aria-busy', 'true')
        else create.removeAttribute('aria-busy')
    }

    /** The answer on the album: chosen cards get the ring and their place in the series. */
    markCards() {
        const place = new Map(this.albums.map((album, index) => [String(album.id), index + 1]))
        this.findCards('[data-action="pick-album"]').forEach(card => {
            const n = place.get(card.dataset.id)
            if (n) this.mark(card, n)
            else this.unmark(card)
        })
    }

    mark(card, n) {
        card.classList.add('is-chosen')
        card.setAttribute('aria-pressed', 'true')
        let badge = card.querySelector('.home-chosen-mark')
        if (!badge) {
            badge = SafeDOM.span({ className: 'home-chosen-mark' })
            const frame = card.firstElementChild || card
            frame.appendChild(badge)
        }
        badge.textContent = String(n)
        badge.setAttribute('aria-label', `Chosen, number ${n}`)
    }

    unmark(card) {
        card.classList.remove('is-chosen')
        card.removeAttribute('aria-pressed')
        card.querySelector('.home-chosen-mark')?.remove()
    }

    openSheet() {
        if (this.albums.length === 0 || this.sheet?.isOpen()) return
        const create = SafeDOM.button({ type: 'button', className: 'btn btn-primary' }, 'Create series')
        create.addEventListener('click', () => { this.sheet.close(); this.onCreate() })
        this.removed = null
        this.sheet = openSheet({
            variant: 'bottom',
            title: countText(this.albums.length),
            content: SafeDOM.div({ className: 'home-chosen-sheet' }),
            footer: create,
            onClose: () => { this.sheet = null }
        })
        this.sheet.body.addEventListener('click', (event) => this.onSheetClick(event))
        this.drawSheet()
    }

    drawSheet() {
        const { body } = this.sheet
        const holder = body.querySelector('.home-chosen-sheet')
        SafeDOM.clear(holder)
        this.sheet.setTitle(countText(this.albums.length))
        if (this.removed) {
            holder.appendChild(SafeDOM.div({ className: 'home-chosen-undo', role: 'status' }, [
                SafeDOM.span({}, `Removed «${this.removed.album.title}»`),
                SafeDOM.button({ type: 'button', className: 'home-chosen-undo__btn', dataset: { action: 'undo-remove' } }, 'Undo')
            ]))
        }
        if (this.albums.length === 0) {
            holder.appendChild(SafeDOM.p({ className: 'home-chosen-empty' }, 'No albums chosen. Tap the albums in the grid to choose them.'))
            return
        }
        holder.appendChild(SafeDOM.create('ol', { className: 'home-chosen-list' },
            this.albums.map((album, index) => this.row(album, index))))
    }

    row(album, index) {
        const last = this.albums.length - 1
        const button = (action, icon, label, disabled, extra = '') => {
            const b = SafeDOM.button({ type: 'button', className: `home-chosen-row__btn ${extra}`, 'aria-label': label, dataset: { action, id: album.id } })
            b.appendChild(SafeDOM.fromHTML(getIcon(icon, 'w-5 h-5 pointer-events-none')))
            b.disabled = disabled
            return b
        }
        return SafeDOM.create('li', { className: 'home-chosen-row' }, [
            SafeDOM.span({ className: 'home-chosen-row__n' }, String(index + 1)),
            coverImage({ src: coverOf(album, '100'), className: 'home-chosen-row__cover', alt: '' }),
            SafeDOM.span({ className: 'home-chosen-row__text' }, [
                SafeDOM.span({ className: 'home-chosen-row__title' }, album.title),
                SafeDOM.span({ className: 'home-chosen-row__artist' }, album.artist || '')
            ]),
            button('move-up', 'ArrowUp', `Move «${album.title}» up`, index === 0),
            button('move-down', 'ArrowUp', `Move «${album.title}» down`, index === last, 'home-chosen-row__btn--down'),
            button('remove', 'X', `Remove «${album.title}»`, false, 'home-chosen-row__btn--remove')
        ])
    }

    onSheetClick(event) {
        const target = event.target.closest('[data-action]')
        if (!target) return
        const { action, id } = target.dataset
        if (action === 'undo-remove') return this.undo()
        const index = this.albums.findIndex(album => String(album.id) === id)
        if (index < 0) return
        const album = this.albums[index]
        if (action === 'remove') {
            this.removed = { album, index }
            return this.staging.removeAlbum(album.id)
        }
        this.removed = null
        this.staging.moveAlbum(album.id, action === 'move-up' ? -1 : 1)
    }

    undo() {
        if (!this.removed) return
        const { album, index } = this.removed
        this.removed = null
        this.staging.insertAlbum(album, index)
    }
}
