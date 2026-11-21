import { SafeDOM } from '../../utils/SafeDOM.js'

/**
 * The equalizer of the Home (F79, D6): bars in the colours of the fire, part of the site's identity,
 * with a meaning. `still` (half light, varied heights): ready, nothing asked; `live` (moving): waiting
 * for an answer (the catalog, the save of the series); `flat` (low): the answer did not come. The words
 * of the screen always say the same, so the bars are never the only sign. With
 * `prefers-reduced-motion` nothing moves (css/views/home.css).
 */

/** The height of a bar, between a quarter and the whole: varied, never random (the same on every draw). */
const heightOf = (i) => (0.25 + 0.75 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.37))).toFixed(2)

/**
 * @param {number} bars - 48 under the field, 32 on the phone, 5 beside «Saving your series…»
 * @param {string} [className]
 * @returns {HTMLElement}
 */
export function createEqualizer(bars, className = '') {
    const children = Array.from({ length: bars }, () => SafeDOM.create('i'))
    const equalizer = SafeDOM.div({ className: `home-eq is-still ${className}`.trim(), 'aria-hidden': 'true', dataset: { state: 'still' } }, children)
    // the height and the phase of each bar, as custom properties (an object given to `style` does not set them)
    children.forEach((bar, i) => {
        bar.style.setProperty('--h', heightOf(i))
        bar.style.setProperty('--d', `${(i % 7) * -0.13}s`)
    })
    return equalizer
}

/** The class of each state, written whole (the build reads class names from the source: test/architecture/tailwindBuiltWithSite.test.js). */
const STATE_CLASSES = Object.freeze({ still: 'is-still', live: 'is-live', flat: 'is-flat' })

/** @param {'still'|'live'|'flat'} state */
export function setEqualizerState(equalizer, state) {
    if (!equalizer) return
    Object.entries(STATE_CLASSES).forEach(([name, className]) => equalizer.classList.toggle(className, name === state))
    equalizer.dataset.state = state
}
