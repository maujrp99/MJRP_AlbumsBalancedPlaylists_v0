import { SafeDOM } from '../../utils/SafeDOM.js'
import { getIcon } from '../Icons.js'
import { openSheet } from '../ui/Sheet.js'
import { coverImage } from '../ui/coverImage.js'
import { createEqualizer, setEqualizerState } from './HomeEqualizer.js'
import { seriesCountLine, dockEmptyNote, NameState } from '../../models/homeSeries.js'

/**
 * The series being built, always in view (F79, HOME-09): the «dock».
 *
 * On the computer it is a bar fixed at the bottom of the window: the covers with their place (up to
 * seven, then «+N»), the name (suggested from the artists, editable), the count, «Edit order» and
 * «Create series»; «Edit order» opens the series panel above it (↑ ↓ ✕ of 44 px, no dragging); the
 * «Undo» strip sits right above it for 8 seconds after a removal or «Add all».
 *
 * On the phone the dock IS the action bar of F76 (`.phone-action-bar`): one cover with the count, the
 * name, «Tap to edit or reorder» and «Create series»; a tap opens the series in a full sheet
 * (components/ui/Sheet.js) with the name on top and «Create series» at its foot.
 *
 * It decides nothing: it draws the model it is given and hands every gesture to its handlers.
 */
const COVERS_ON_COMPUTER = 7
const NEXT = 'Next: the Blend turns the series into playlists.'
const ORDER = 'The order counts: the Blend reads the albums in this order when it spreads their tracks over the playlists. Use ↑ ↓ to change it.'
const GUEST_BEFORE = "You're not signed in: the series is saved to this browser only. "
const GUEST_AFTER = ' to keep it on every device.'

const coverOf = (album, size) => {
    const template = album.artworkTemplate || album.coverUrl
    return template ? template.replace('{w}', size).replace('{h}', size) : null
}
const plural = (n, one) => `${n} ${one}${n === 1 ? '' : 's'}`
const icon = (name, className = 'home-ico') => SafeDOM.fromHTML(getIcon(name, className))

function button(text, { className = 'home-btn', action, id, disabled = false, label } = {}) {
    const element = SafeDOM.button({ className, id, 'aria-label': label, dataset: { dock: action } }, text)
    element.disabled = disabled
    return element
}

/** The «Undo» strip: what just happened, and the way back. */
export function undoStrip(undo) {
    if (!undo) return null
    const text = undo.kind === 'remove' ? `Removed «${undo.album.title}».` : `Added ${plural(undo.n, 'album')}.`
    return SafeDOM.div({ className: 'home-undo', role: 'status' }, [
        SafeDOM.span({}, text),
        button('Undo', { className: 'home-undo__btn', action: 'undo' })
    ])
}

/** The line of the visitor who did not sign in (D7). */
export function guestLine(signInAction = 'sign-in') {
    return SafeDOM.p({ className: 'home-guest' }, [GUEST_BEFORE, button('Sign in', { className: 'home-link', action: signInAction }), GUEST_AFTER])
}

export class HomeDock {
    /**
     * @param {Object} options
     * @param {Object} options.on - the handlers: create, toggleOpen, close, move(id, delta), remove(id),
     *   undo, name(text), useName, blend, openSeries, restart, signIn
     * @param {() => boolean} options.phone
     */
    constructor({ on, phone }) {
        this.on = on
        this.phone = phone
        this.model = null
        this.host = null
        this.sheet = null
    }

    mount(host) {
        this.host = host
        host.addEventListener('click', (event) => this.onClick(event))
        host.addEventListener('input', (event) => this.onInput(event))
        host.addEventListener('keydown', (event) => this.onKeydown(event))
    }

    unmount() {
        this.sheet?.close()
        this.sheet = null
        if (this.host) SafeDOM.clear(this.host)
    }

    /** Draw from the model; the field being typed in keeps its focus and its caret. */
    draw(model) {
        this.model = model
        if (!this.host) return
        const kept = this.keepFocus()
        SafeDOM.clear(this.host)
        this.host.appendChild(this.phone() ? this.phoneDock(model) : this.computerDock(model))
        this.giveFocusBack(kept)
        this.drawSheet(model)
    }

    /** Where the focus is in the dock, as a selector that finds it again after the dock is drawn. */
    keepFocus() {
        const active = document.activeElement
        if (!active || !this.host.contains(active)) return null
        const { dock, id } = active.dataset || {}
        let selector = null
        if (active.id) selector = `#${active.id}`
        else if (dock) selector = id ? `[data-dock="${dock}"][data-id="${String(id).replace(/["\\]/g, '\\$&')}"]` : `[data-dock="${dock}"]`
        return selector ? { selector, start: active.selectionStart, end: active.selectionEnd } : null
    }

    giveFocusBack(kept) {
        if (!kept) return
        const element = this.host.querySelector(kept.selector)
        if (!element || element.disabled) return
        element.focus()
        if (kept.start !== null && kept.start !== undefined) element?.setSelectionRange?.(kept.start, kept.end)
    }

    /** The name field, focused (the name is missing). On the phone it is in the series sheet. */
    focusName() {
        if (this.phone()) {
            this.openSheet()
            this.sheet?.body.querySelector('#homeChosenName')?.focus()
            return
        }
        this.host?.querySelector('#seriesNameInput')?.focus()
    }

    // --- the computer ---

    computerDock(m) {
        const n = m.albums.length
        const dock = SafeDOM.div({
            className: `home-dock${n ? ' is-full' : ''}${m.create === 'created' ? ' is-done' : ''}`,
            role: 'region',
            'aria-label': 'Your series'
        }, [
            m.guest ? guestLine() : null,
            SafeDOM.div({ className: 'home-dock__row' }, [this.pile(m, COVERS_ON_COMPUTER), this.computerMeta(m), this.computerGo(m)]),
            this.computerNote(m)
        ])
        return SafeDOM.div({ className: 'home-dockwrap' }, [m.open ? this.panel(m) : null, undoStrip(m.undo), dock])
    }

    pile(m, max) {
        const n = m.albums.length
        const content = n
            ? [...m.albums.slice(0, max).map((album, i) => SafeDOM.span({ className: 'home-dcv' }, [
                coverImage({ src: coverOf(album, '100'), className: 'home-dcv__img', alt: '' }),
                SafeDOM.span({ className: 'home-dn' }, String(i + 1))
            ])), n > max ? SafeDOM.span({ className: 'home-more' }, `+${n - max}`) : null]
            : [SafeDOM.span({ className: 'home-slot' }), SafeDOM.span({ className: 'home-slot' }), SafeDOM.span({ className: 'home-slot' })]
        return SafeDOM.div({ className: 'home-pile', dataset: { n: String(n) }, 'aria-hidden': 'true' }, content)
    }

    computerMeta(m) {
        if (m.create === 'created') return this.savedMeta(m, 'find it any time in Music Series')
        if (!m.albums.length) {
            const empty = dockEmptyNote({ phone: false, covers: m.coversOnScreen })
            return SafeDOM.div({ className: 'home-dock__meta' }, [SafeDOM.strong({}, empty.title), SafeDOM.span({}, empty.note)])
        }
        return SafeDOM.div({ className: 'home-dock__meta' }, [this.nameBox(m, 'seriesNameInput'), this.status(m)])
    }

    savedMeta(m, where) {
        const saved = SafeDOM.strong({ className: 'home-saved' }, [icon('Check', 'home-ico home-saved__ico'), ` «${m.created.name}» is saved`])
        return SafeDOM.div({ className: 'home-dock__meta' }, [saved, SafeDOM.span({}, `${plural(m.created.count, 'album')} · ${where}.`)])
    }

    /** The name: suggested as real text, with «suggested · edit it»; empty on create, it asks for one. */
    nameBox(m, id) {
        const need = m.create === 'noname'
        const label = SafeDOM.label({ className: 'home-name__label', htmlFor: id }, ['Series name',
            m.nameState === NameState.SUGGESTED ? SafeDOM.span({ className: 'home-name__sugg' }, 'suggested · edit it') : null])
        const field = SafeDOM.input({ type: 'text', id, className: 'home-name', autocomplete: 'off', dataset: { dock: 'name' } })
        field.value = m.name
        if (need) {
            field.setAttribute('aria-invalid', 'true')
            field.setAttribute('aria-describedby', `${id}Error`)
        }
        const error = need ? SafeDOM.p({ className: 'home-name__error', id: `${id}Error`, role: 'alert' }, [
            'Give the series a name first. ',
            button(`Use «${m.suggestion}»`, { className: 'home-link', action: 'use-name' })
        ]) : null
        return SafeDOM.div({ className: `home-namebox${need ? ' is-need' : ''}` }, [label, field, error])
    }

    status(m) {
        if (m.create === 'creating') {
            const equalizer = createEqualizer(5, 'home-eq--mini')
            setEqualizerState(equalizer, 'live')
            return SafeDOM.span({ className: 'home-busy', role: 'status' }, [equalizer, ' Saving your series…'])
        }
        if (m.create === 'failed') return SafeDOM.span({ className: 'home-fail', role: 'alert' }, m.failure)
        return SafeDOM.span({ className: 'home-count' }, seriesCountLine(m.albums))
    }

    createButton(m, id) {
        const n = m.albums.length
        if (m.create === 'creating') {
            const busy = button('Creating…', { className: 'home-btn is-big is-flame', id, disabled: true })
            busy.setAttribute('aria-busy', 'true')
            return busy
        }
        const created = button(m.create === 'failed' ? 'Try again' : 'Create series', {
            className: `home-btn is-big${m.flame === 'create' ? ' is-flame' : ''}`, id, action: 'create', disabled: n === 0
        })
        if (!this.phone()) created.appendChild(icon('ArrowRight', 'home-ico home-ico--arrow'))
        return created
    }

    afterButtons() {
        const blend = button('Blend it now', { className: 'home-btn is-big is-flame', action: 'blend', id: 'btnBlendNow' })
        if (!this.phone()) blend.appendChild(icon('ArrowRight', 'home-ico home-ico--arrow'))
        return SafeDOM.div({ className: 'home-go home-go--after' }, [
            button('Open the series', { className: 'home-btn is-ghost', action: 'open-series', id: 'btnOpenSeries' }),
            blend
        ])
    }

    computerGo(m) {
        if (m.create === 'created') return this.afterButtons()
        if (!m.albums.length) {
            return SafeDOM.div({ className: 'home-go' }, [SafeDOM.small({}, 'Add one album to create the series'), this.createButton(m, 'btnCreateSeries')])
        }
        const toggle = button(m.open ? 'Done' : 'Edit order', { className: 'home-btn is-ghost', action: 'toggle', id: 'btnEditOrder' })
        toggle.setAttribute('aria-expanded', String(m.open))
        return SafeDOM.div({ className: 'home-go' }, [toggle, this.createButton(m, 'btnCreateSeries')])
    }

    computerNote(m) {
        if (m.create === 'created') return button('Start another series', { className: 'home-link home-restart', action: 'restart' })
        return m.albums.length ? SafeDOM.small({ className: 'home-next' }, NEXT) : null
    }

    /** The series panel (computer): the rows with ↑ ↓ ✕, above the dock. */
    panel(m) {
        return SafeDOM.div({ className: 'home-panel', role: 'region', 'aria-label': 'Your series, in order', id: 'homeSeriesPanel' }, [
            SafeDOM.div({ className: 'home-panel__head' }, [
                SafeDOM.create('h3', {}, ['Your series ', SafeDOM.span({}, plural(m.albums.length, 'album'))]),
                button('Done', { className: 'home-btn is-ghost', action: 'close' })
            ]),
            SafeDOM.p({ className: 'home-order' }, ORDER),
            this.rows(m)
        ])
    }

    rows(m) {
        const last = m.albums.length - 1
        return SafeDOM.create('ol', { className: 'home-rows' }, m.albums.map((album, i) => {
            const moved = m.moved?.id === album.id
            const small = [album.artist, album.year].filter(Boolean).join(' · ') + (moved ? ` · moved ${m.moved.dir}` : '')
            return SafeDOM.li({ className: moved ? 'is-moved' : '' }, [
                SafeDOM.span({ className: 'home-num' }, String(i + 1)),
                SafeDOM.span({ className: 'home-rcv' }, [coverImage({ src: coverOf(album, '100'), className: 'home-rcv__img', alt: '' })]),
                SafeDOM.span({ className: 'home-rt' }, [SafeDOM.strong({}, album.title), SafeDOM.small({}, small)]),
                SafeDOM.span({ className: 'home-rbtn' }, [
                    this.rowButton('up', 'ArrowUp', `Move «${album.title}» up`, album.id, i === 0),
                    this.rowButton('down', 'ArrowUp', `Move «${album.title}» down`, album.id, i === last),
                    this.rowButton('remove', 'X', `Remove «${album.title}» from the series`, album.id, false)
                ])
            ])
        }))
    }

    rowButton(action, iconName, label, id, disabled) {
        const element = SafeDOM.button({ className: `home-rbtn__${action}`, 'aria-label': label, dataset: { dock: action, id: String(id) } })
        element.appendChild(icon(iconName, `home-ico pointer-events-none${action === 'down' ? ' home-ico--down' : ''}`))
        element.disabled = disabled
        return element
    }

    // --- the phone ---

    phoneDock(m) {
        const n = m.albums.length
        const bar = SafeDOM.div({
            className: `home-dock phone-action-bar md:hidden${n ? ' is-full' : ''}${m.create === 'created' ? ' is-done' : ''}`,
            role: 'region',
            'aria-label': 'Your series'
        }, [this.phonePile(m), this.phoneMeta(m), this.phoneGo(m)])
        const sheetOpen = this.sheet?.isOpen()
        return SafeDOM.div({ className: 'home-dockwrap is-phone' }, [sheetOpen ? null : undoStrip(m.undo), bar])
    }

    phonePile(m) {
        if (m.create === 'created') return null
        const pile = this.pile(m, 1)
        if (m.albums.length) {
            pile.dataset.dock = 'open'
            pile.removeAttribute('aria-hidden')
            pile.setAttribute('role', 'button')
            pile.setAttribute('tabindex', '-1')
        }
        return pile
    }

    phoneMeta(m) {
        if (m.create === 'created') return SafeDOM.div({ className: 'home-dock__meta' }, [
            SafeDOM.strong({ className: 'home-saved' }, [icon('Check', 'home-ico home-saved__ico'), ` «${m.created.name}» is saved`])
        ])
        if (!m.albums.length) {
            const empty = dockEmptyNote({ phone: true, covers: m.coversOnScreen })
            return SafeDOM.div({ className: 'home-dock__meta' }, [SafeDOM.strong({}, empty.title), SafeDOM.span({}, empty.note)])
        }
        const n = m.albums.length
        const short = m.failure.includes('connection dropped') ? 'Not saved: the connection dropped' : 'Not saved'
        const status = m.create === 'failed' ? SafeDOM.span({ className: 'home-fail', role: 'alert' }, short) : this.status(m)
        const open = SafeDOM.button({
            className: 'home-dock__open',
            dataset: { dock: 'open' },
            'aria-label': `Your series: ${plural(n, 'album')}, ${m.name || 'no name yet'}. Tap to edit or reorder`
        }, [SafeDOM.strong({}, m.name || 'No name yet'), status, SafeDOM.small({}, 'Tap to edit or reorder')])
        return SafeDOM.div({ className: 'home-dock__meta' }, [open])
    }

    phoneGo(m) {
        if (m.create === 'created') return this.afterButtons()
        return SafeDOM.div({ className: 'home-go' }, [this.createButton(m, 'btnCreateSeriesPhone')])
    }

    /** The series sheet (phone): full, because it holds the name field (design-system.md § Folha). */
    openSheet() {
        const m = this.model
        if (!m?.albums.length || this.sheet?.isOpen()) return
        this.sheetParts = {
            name: SafeDOM.div({ className: 'home-sheet__name' }),
            rows: SafeDOM.div({ className: 'home-sheet__rows' }),
            foot: SafeDOM.div({ className: 'home-sheet__foot' })
        }
        this.sheet = openSheet({
            variant: 'full',
            title: 'Your series',
            content: [this.sheetParts.name, SafeDOM.p({ className: 'home-order' }, ORDER), this.sheetParts.rows],
            footer: this.sheetParts.foot,
            closeLabel: 'Done',
            id: 'homeSeriesSheet',
            onClose: () => {
                this.sheet = null
                this.on.close?.()
            }
        })
        this.sheet.element.querySelector('.sheet__title')?.appendChild(SafeDOM.span({ className: 'home-sheet__count' }))
        this.sheet.element.addEventListener('click', (event) => this.onClick(event))
        this.sheet.element.addEventListener('input', (event) => this.onInput(event))
        this.sheet.element.addEventListener('keydown', (event) => this.onKeydown(event))
        this.drawSheet(m)
        this.draw(m)
    }

    drawSheet(m) {
        if (!this.sheet?.isOpen()) return
        if (!m.albums.length || m.create === 'created' || m.create === 'creating') {
            this.sheet.close()
            return
        }
        const { name, rows, foot } = this.sheetParts
        const active = document.activeElement
        const typing = active?.id === 'homeChosenName' && this.sheet.element.contains(active)
        if (!typing) {
            SafeDOM.clear(name)
            name.appendChild(this.nameBox(m, 'homeChosenName'))
        }
        SafeDOM.clear(rows)
        rows.appendChild(this.rows(m))
        SafeDOM.clear(foot)
        foot.append(...[undoStrip(m.undo), this.createButton(m, 'btnCreateSeriesSheet')].filter(Boolean))
        const count = this.sheet.element.querySelector('.home-sheet__count')
        if (count) count.textContent = plural(m.albums.length, 'album')
    }

    // --- the gestures ---

    onClick(event) {
        const target = event.target.closest('[data-dock]')
        if (!target || target.disabled) return
        const { dock, id } = target.dataset
        const actions = {
            create: () => this.on.create(),
            toggle: () => this.on.toggleOpen(),
            close: () => this.on.close(),
            open: () => this.openSheet(),
            up: () => this.on.move(id, -1),
            down: () => this.on.move(id, 1),
            remove: () => this.on.remove(id),
            undo: () => this.on.undo(),
            'use-name': () => this.on.useName(),
            blend: () => this.on.blend(),
            'open-series': () => this.on.openSeries(),
            restart: () => this.on.restart(),
            'sign-in': () => this.on.signIn()
        }
        actions[dock]?.()
    }

    onInput(event) {
        if (event.target.dataset?.dock === 'name') this.on.name(event.target.value)
    }

    onKeydown(event) {
        if (event.key === 'Enter' && event.target.dataset?.dock === 'name') this.on.create()
    }
}
