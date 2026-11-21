/**
 * barMenu - the home's bar, inside the app (F88, the level «Transformar» on the computer): five stops
 * over ONE row of equalizer bars, ⟲ between the two sides, the fire on the stretch of the current
 * screen. The look is public/css/bar-menu.css, shared with the home (public/splash.html); the bars
 * are drawn by the home's own function (public/splash/menu.js, threadBarStyle), so the passage from
 * the home to the app does not change the bar. Here the fire marks WHERE THE PERSON IS (on the home it
 * follows the reading).
 *
 * `renderBarMenu` is a pure drawing (tested without a browser); `fitBars` redraws the row for its width;
 * `wakeBars` lets the last bars of the lit stretch move for a short while, never when the person asked
 * the system for less motion.
 */
import { PHONE_TABS, currentTab } from './phoneTabs.js'
import { MENU_TEXT } from './menuText.js'
import { renderBars } from './bars.js'

/** How many bars a bar of the computer has before it is measured (about its width over six). */
export const DEFAULT_BARS = 104
const MIN_BARS = 30
const PIXELS_PER_BAR = 6
/** The bars move for this long after the screen changes (the home's rest time), then rest. */
export const BAR_REST_MS = 10000
/** Side B starts at this stop: Playlists. */
const SIDE_B_FROM = 3

/** @returns {number} the index of the stop the path stands for, -1 on a screen no stop stands for */
const stopIndexOf = (path) => PHONE_TABS.indexOf(currentTab(path))

/** @returns {string} the row of bars, the stretch of the current stop lit */
const barsFor = (count, path) => renderBars(count, stopIndexOf(path), PHONE_TABS.length)

function renderStop(tab, current) {
    const isCurrent = tab === current
    return `<a class="stop${isCurrent ? ' cur' : ''}" href="/${tab.route}" data-link data-for="${tab.id}"${isCurrent ? ' aria-current="page"' : ''}><span class="lb">${tab.label}</span></a>`
}

/**
 * @param {string} path - the path of the address (no query)
 * @param {{ bars?: number }} [options]
 * @returns {string} the bar: a navigation with the five stops, the flip mark and the row of bars
 */
export function renderBarMenu(path, { bars = DEFAULT_BARS } = {}) {
    const current = currentTab(path)
    const sideB = stopIndexOf(path) >= SIDE_B_FROM
    return `<nav class="ms" aria-label="${MENU_TEXT.mainNav}">${PHONE_TABS.map(tab => renderStop(tab, current)).join('')}<span class="flipmark${sideB ? ' on' : ''}" aria-hidden="true" title="${MENU_TEXT.flipMark}">⟲</span><div class="eqbar" aria-hidden="true">${barsFor(bars, path)}</div></nav>`
}

/** Draws the row of bars again for the width the bar has now (a resized window). */
export function fitBars(nav, path) {
    const row = nav?.querySelector('.eqbar')
    if (!row) return
    const count = Math.max(MIN_BARS, Math.round((row.getBoundingClientRect().width || 600) / PIXELS_PER_BAR))
    row.innerHTML = barsFor(count, path)
}

let restTimer = null

/**
 * The last bars of the lit stretch move, and rest after BAR_REST_MS. With less motion asked for
 * they never move.
 * @param {Window} win
 */
export function wakeBars(win = window) {
    const root = win.document.documentElement
    clearTimeout(restTimer)
    if (win.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
        root.classList.remove('moving')
        return
    }
    root.classList.add('moving')
    restTimer = setTimeout(() => root.classList.remove('moving'), BAR_REST_MS)
}
