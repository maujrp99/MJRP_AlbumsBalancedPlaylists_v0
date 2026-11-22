/**
 * isPhone - the one place that answers "is this the phone?" (F76, REQ-12).
 *
 * The phone is a screen up to 899 px wide: the same line the stylesheets of the phone draw
 * (`@media (max-width: 899px)` in public/css/mobile.css). The answer comes from the width of the
 * screen, never from the name of the browser, and it changes when the person turns the phone or
 * resizes the window: who draws something only for the phone listens with onPhoneChange.
 */

/** The media query of the phone. The stylesheets write the same text. */
export const PHONE_QUERY = '(max-width: 899px)'

const query = (win) => (typeof win?.matchMedia === 'function' ? win.matchMedia(PHONE_QUERY) : null)

/**
 * @param {Window} [win]
 * @returns {boolean} true on a screen up to 899 px wide; false where the width cannot be asked
 */
export function isPhone(win = window) {
    return Boolean(query(win)?.matches)
}

/**
 * Hears the screen become a phone or stop being one (a turn of the phone, a resized window).
 * @param {(phone: boolean) => void} listener
 * @param {Window} [win]
 * @returns {Function} stops listening
 */
export function onPhoneChange(listener, win = window) {
    const media = query(win)
    if (!media?.addEventListener) return () => { }
    const heard = (event) => listener(Boolean(event.matches))
    media.addEventListener('change', heard)
    return () => media.removeEventListener('change', heard)
}
