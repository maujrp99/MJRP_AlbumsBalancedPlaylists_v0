/**
 * Unsaved changes guard
 *
 * While a screen holds work the database does not have, leaving it asks first:
 * - a navigation of the app (link, button, back and forward of the browser) asks through the router;
 * - closing or reloading the tab asks through the browser's own dialog (its text is the browser's).
 *
 * The screen installs the guard when it mounts and uninstalls it when it is destroyed.
 */

const LEAVE_MESSAGE = 'You have changes to these playlists that are not saved. Leave without saving?'

/**
 * @param {Object} options
 * @param {Router} options.router
 * @param {Function} options.hasUnsavedChanges - () => boolean, asked at the moment of leaving
 * @param {Function} [options.confirmLeave] - (message) => boolean; the browser's confirm by default
 * @returns {Function} uninstall
 */
export function installUnsavedChangesGuard({ router, hasUnsavedChanges, confirmLeave }) {
    const ask = confirmLeave || ((message) => window.confirm(message))

    const removeHook = router.beforeNavigate(() => {
        if (!hasUnsavedChanges()) return true
        return ask(LEAVE_MESSAGE) === true
    })

    const onBeforeUnload = (event) => {
        if (!hasUnsavedChanges()) return
        event.preventDefault()
        event.returnValue = '' // older browsers show their dialog only with this
    }
    window.addEventListener('beforeunload', onBeforeUnload)

    return () => {
        removeHook()
        window.removeEventListener('beforeunload', onBeforeUnload)
    }
}
