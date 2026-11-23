/**
 * The phone's row of albums, «Na caixa do The Album Blender» (F96): the page's only sideways swipe.
 *
 * The row is the browser's own horizontal scroll (the albums are written in the page by the build: it reads and scrolls without this script).
 * What this adds is the path by a simple tap and by the keyboard: two arrows, and the arrow keys on the row, each moving it by one album.
 * Nothing here moves by itself: no timer, no automatic advance. With less motion asked the row jumps instead of gliding.
 * The pure part is exported for the tests; `startShelf(window)` wires it to the page.
 */

/** Rounding slack, in pixels: a row resting on an album counts as being exactly there. */
const SLACK = 4

/**
 * Where an arrow takes the row: forward (dir 1) to the first album that starts past the left edge, back (dir -1) to the last one that
 * starts before it; never before the start nor past the end of the row.
 * @param {number[]} starts - where each album starts, from the first one (0), in pixels
 * @param {number} x - where the row is (its scrollLeft)
 * @param {number} dir - 1 forward, -1 back
 * @param {number} max - the furthest the row scrolls
 */
export function stepTarget(starts, x, dir, max) {
    const clamp = (v) => Math.max(0, Math.min(max, v))
    if (dir > 0) {
        const next = starts.find(s => s > x + SLACK)
        return clamp(next === undefined ? max : next)
    }
    const before = starts.filter(s => s < x - SLACK)
    return clamp(before.length ? before[before.length - 1] : 0)
}

/**
 * Wire the row's arrows and keys. Returns null when the page has no row.
 * @param {Window} win
 */
export function startShelf(win) {
    const D = win.document
    const row = D.getElementById('shelf')
    const prev = D.getElementById('shelf-prev'), next = D.getElementById('shelf-next')
    if (!row || !prev || !next) return null
    // read at each step: the albums of the row are replaced when the owner's published crate arrives (publishedCrate.js)
    const items = () => [...row.querySelectorAll('.al')]
    if (!items().length) return null
    const reduce = win.matchMedia('(prefers-reduced-motion: reduce)').matches
    const starts = () => { const all = items(); return all.map(item => item.offsetLeft - all[0].offsetLeft) }
    const max = () => Math.max(0, row.scrollWidth - row.clientWidth)
    // an arrow at the end of its way stays focusable (a disabled button would drop the keyboard's focus): it says so and does nothing
    const update = () => {
        prev.setAttribute('aria-disabled', String(row.scrollLeft <= 2))
        next.setAttribute('aria-disabled', String(row.scrollLeft >= max() - 2))
    }
    const go = (dir) => {
        const left = stepTarget(starts(), row.scrollLeft, dir, max())
        if (typeof row.scrollTo === 'function') row.scrollTo({ left, behavior: reduce ? 'auto' : 'smooth' })
        else row.scrollLeft = left
        update()
    }
    prev.addEventListener('click', () => go(-1))
    next.addEventListener('click', () => go(1))
    row.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); go(1) } else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1) }
    })
    row.addEventListener('scroll', update, { passive: true })
    win.addEventListener('resize', update)
    // the row may not have its width yet when this runs (WebKit lays it out after the style arrives: «próximo» came up switched off): judge again when it has
    win.addEventListener('load', update)
    D.addEventListener('cratechange', update)
    if ('ResizeObserver' in win) new win.ResizeObserver(update).observe(row.firstElementChild || row)
    update()
    return { go, update }
}
