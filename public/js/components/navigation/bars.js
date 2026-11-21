/**
 * bars - the row of equalizer bars of the menu (F88), the one picture of the home's bar: each bar has
 * its own height, speed and offset (the home's own function, public/splash/menu.js); the stretch of
 * the current stop is lit in fire and its last bars move. Used by the bar of the computer
 * (barMenu.js) and by the tab bar of the phone (phoneTabs.js).
 */
import { threadBarStyle } from '../../../splash/menu.js'

/** How many bars at the end of the lit stretch move. */
const MOVING_BARS = 4

/**
 * @param {number} count - how many bars the row has
 * @param {number} index - the stop that is lit, 0 to stops - 1; below 0, none
 * @param {number} stops - how many stops share the row
 * @returns {string} the bars, each `<i>`, the lit ones with `on`, the moving ones with `cur`
 */
export function renderBars(count, index, stops) {
    const from = index / stops
    const to = (index + 1) / stops
    const end = Math.round(to * count)
    return Array.from({ length: count }, (_, k) => {
        const lit = index >= 0 && k / count >= from && k / count < to
        const moving = lit && k >= end - MOVING_BARS && k < end
        return `<i class="${lit ? 'on' : ''}${moving ? ' cur' : ''}" style="${threadBarStyle(k)}"></i>`
    }).join('')
}
