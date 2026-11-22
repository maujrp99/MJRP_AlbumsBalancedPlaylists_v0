/**
 * The bar is the menu (F80, UAT-240, UAT-241): one continuous row of equalizer bars with the five
 * items of the app's menu as its stops (Criar · Álbuns · Blend · Playlists · Inventário); the page
 * tells the story of each item while you scroll, and the bar fills as you read. On a computer the
 * bar is the header's menu; on the phone it moves to the bottom bar.
 *
 * Signed out an item scrolls to its story; signed in it goes to its screen of the app (decided by the
 * orchestrator, revisable), and the page shows the menu and only the «Criar» button.
 * The pure parts are exported for the tests; `startMenuBar(window)` wires them to the page.
 */

import { stopIcon } from './phoneBar.js'

/** The items, in the order of the app's menu: the story's id, its text in copy.js, its screen of the app. */
export const MENU = Object.freeze([
    { id: 'start', key: 'm.start', app: '/start' },
    { id: 'albums', key: 'm.albums', app: '/albums' },
    { id: 'blend', key: 'm.blend', app: '/blend' },
    { id: 'playlists', key: 'm.playlists', app: '/saved-playlists' },
    { id: 'inventory', key: 'm.inventory', app: '/inventory' }
])

/** Where an item leads: its story signed out, its screen of the app signed in. */
export const menuHref = (item, signedIn) => (signedIn ? item.app : `#${item.id}`)

/** Where each part of the page sits on the bar (0 to 1): the five items share it, the opening and the close are its two ends. */
export const SLOTS = Object.freeze({
    a1: [0, 0], start: [0, 0.2], albums: [0.2, 0.4], blend: [0.4, 0.6], flip: [0.6, 0.6], playlists: [0.6, 0.8], inventory: [0.8, 1], end: [1, 1]
})

/** How far the page has been read, 0 to 1: the last parts whose top passed 55% of the screen, by how much of them has been read. */
export function barProgress(rows, viewportHeight, atEnd) {
    if (atEnd) return 1
    const mark = viewportHeight * 0.55
    let p = 0
    rows.forEach(({ id, top, height }) => {
        if (top >= mark) return
        const read = Math.max(0, Math.min(1, (mark - top) / height))
        const [from, to] = SLOTS[id]
        p = from + (to - from) * read
    })
    return p
}

/** The stop the bar is in (0 to 4), or -1 at the opening and at the close. */
export const stopIndex = (p) => (p <= 0 || p >= 1 ? -1 : Math.min(MENU.length - 1, Math.floor(p * MENU.length + 1e-6)))

/** The bars of the row: each its own height, duration and offset, never in unison. */
export function threadBarStyle(k) {
    const h = 38 + Math.round(58 * Math.abs(Math.sin(k * 1.93 + 0.4)))
    const d = (0.55 + ((k * 37) % 9) / 10).toFixed(2)
    const o = (((k * 53) % 7) / 10).toFixed(1)
    return `--h:${h}%;--d:${d}s;--o:-${o}s`
}

/** Signed in or out: the page's class and where the menu leads. */
export function applyAccount(doc, signedIn) {
    doc.documentElement.classList.toggle('in', signedIn)
    MENU.forEach((item) => {
        doc.querySelectorAll(`.stop[data-for="${item.id}"]`).forEach((a) => a.setAttribute('href', menuHref(item, signedIn)))
    })
}

/** The phone's bottom menu has an icon above each label (the app's bar has the same): put them in, once; the computer's bar hides them. */
export function addStopIcons(doc) {
    MENU.forEach((item) => {
        doc.querySelectorAll(`.stop[data-for="${item.id}"]`).forEach((a) => {
            if (!a.querySelector('.ic')) a.insertAdjacentHTML('afterbegin', stopIcon(item.id))
        })
    })
}

/** The bar paints itself from the page's scroll: lit bars, the current stop, the flip mark. */
function painter(D, ms, bar) {
    const stops = [...ms.querySelectorAll('.stop')]
    const flipmark = ms.querySelector('.flipmark')
    const rows = Object.keys(SLOTS).map(id => ({ id, el: D.getElementById(id) }))
    let bars = [], last = -1
    const progress = (win) => barProgress(
        rows.map(({ id, el }) => { const r = el.getBoundingClientRect(); return { id, top: r.top, height: r.height } }),
        win.innerHeight, win.innerHeight + win.scrollY >= D.documentElement.scrollHeight - 2)
    const mark = (p) => {
        const current = stopIndex(p)
        stops.forEach((s, i) => {
            s.classList.toggle('on', p > i / MENU.length + 1e-6)
            s.classList.toggle('cur', i === current)
            if (i === current) s.setAttribute('aria-current', 'step'); else s.removeAttribute('aria-current')
        })
        if (flipmark) flipmark.classList.toggle('on', p >= SLOTS.flip[0])
        ms.style.setProperty('--p', `${(p * 100).toFixed(2)}%`)
    }
    return {
        build(win) {
            const n = Math.max(30, Math.round((bar.getBoundingClientRect().width || 600) / 6))
            bar.innerHTML = Array.from({ length: n }, (_, k) => `<i style="${threadBarStyle(k)}"></i>`).join('')
            bars = [...bar.children]
            this.paint(win, true)
        },
        paint(win, force) {
            const p = progress(win)
            if (!force && Math.abs(p - last) < 0.002) return
            last = p
            const lit = Math.round(p * bars.length)
            bars.forEach((b, k) => { b.classList.toggle('on', k < lit); b.classList.toggle('cur', k < lit && k >= lit - 4) })
            mark(p)
        }
    }
}

/**
 * Wire the bar: it sits in the header on a computer and in the bottom bar on the phone, and fills as the page scrolls.
 * @param {Window} win
 */
export function startMenuBar(win) {
    const D = win.document
    const ms = D.getElementById('ms'), bar = D.getElementById('eqbar')
    if (!ms || !bar) return null
    const slots = { desk: D.getElementById('slot-header'), phone: D.getElementById('slot-thread') }
    const mq = win.matchMedia('(max-width:899px)')
    const view = painter(D, ms, bar)
    addStopIcons(D)
    const place = () => { const slot = mq.matches ? slots.phone : slots.desk; if (slot && ms.parentNode !== slot) slot.appendChild(ms) }
    place()
    if (mq.addEventListener) mq.addEventListener('change', () => { place(); view.build(win) })
    win.addEventListener('scroll', () => view.paint(win, false), { passive: true })
    win.addEventListener('resize', () => view.build(win))
    view.build(win)
    return view
}
