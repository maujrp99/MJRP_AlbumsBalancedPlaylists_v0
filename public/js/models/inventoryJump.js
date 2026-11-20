/**
 * inventoryJump - how the inventory of the phone is reached far down (F76, TASK-07, REQ-11).
 *
 * The phone draws the rows in chunks (PHONE_CHUNK at a time, «Show more» for the next ones) and
 * offers a jump: in the order by artist, to the first artist of a letter; in any other order, to
 * a stretch of positions («126–150»). Jumping past what is drawn draws the chunks up to there.
 * Pure: items in, places out.
 */

/** How many rows the phone draws at a time. */
export const PHONE_CHUNK = 50

/** The size of a stretch of positions, in the orders that are not by artist. */
const STRETCH = 25

const ARTIST_ORDERS = new Set(['artist', 'artist_desc'])

/** "B" for "Björk", "#" for "10,000 Maniacs" or for no artist. */
export function initialOf(text) {
    const first = String(text ?? '').trim().normalize('NFD').replace(/[̀-ͯ]/g, '').charAt(0).toUpperCase()
    return /[A-Z]/.test(first) ? first : '#'
}

/** The letters of the artists, in the order of the list, each where it first appears. */
function letters(items) {
    const found = new Map()
    items.forEach((item, index) => {
        const label = initialOf(item?.artist)
        const place = found.get(label)
        if (place) place.count += 1
        else found.set(label, { label, index, count: 1 })
    })
    return [...found.values()]
}

/** «1–25», «26–50», ... up to the last item. */
function stretches(total) {
    const out = []
    for (let from = 0; from < total; from += STRETCH) {
        const to = Math.min(from + STRETCH, total)
        out.push({ label: `${from + 1}–${to}`, index: from, count: to - from })
    }
    return out
}

/** Is the list in the order by artist (the jump is by letter)? */
export const jumpsByLetter = (choice) => ARTIST_ORDERS.has(choice)

/**
 * The places the list can jump to.
 * @param {Array<Object>} items - the items as the list shows them (filtered and ordered)
 * @param {string} choice - the order (models/inventorySort.js `choiceOf`)
 * @returns {Array<{ label: string, index: number, count: number }>}
 */
export function jumpTargets(items, choice) {
    return jumpsByLetter(choice) ? letters(items) : stretches(items.length)
}

/**
 * How many rows must be drawn for the item at `index` to be on the page.
 * @param {number} index
 * @param {number} shown - how many are drawn now
 */
export function shownFor(index, shown) {
    if (index < shown) return shown
    return Math.ceil((index + 1) / PHONE_CHUNK) * PHONE_CHUNK
}
