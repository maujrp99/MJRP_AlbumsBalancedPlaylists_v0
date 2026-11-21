/**
 * Start the app again from the Home address.
 *
 * Used when the person changes (sign-out): a fresh page is the one way to be sure nothing of the
 * person who left stays in memory or on screen (series, playlists in use, caches of the page).
 * Decision of the MJRP on 2026-11-19. In its own file so the screens that call it can be tested.
 */
export function reloadApp() {
    window.location.assign('/start')
}
