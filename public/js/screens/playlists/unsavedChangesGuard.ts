/**
 * Unsaved changes guard (F60; moved from views/playlists/unsavedChangesGuard.js in F83 wave 2, with the same rule).
 *
 * While the screen holds work the database does not have, leaving it asks first:
 * - a navigation of the app (link, button, back and forward of the browser) asks through the router;
 * - closing or reloading the tab asks through the browser's own dialog (its text is the browser's).
 *
 * The screen installs the guard when it opens and uninstalls it when it is left.
 */
import { t } from '../../i18n/t.js'

interface Guarded {
    beforeNavigate: (hook: () => boolean) => Function // the router gives back what stops the hook
}

export interface GuardOptions {
    router: Guarded
    /** Asked at the moment of leaving. */
    hasUnsavedChanges: () => boolean
    /** The browser's confirm by default. */
    confirmLeave?: (message: string) => boolean
}

/** @returns uninstall */
export function installUnsavedChangesGuard({ router, hasUnsavedChanges, confirmLeave }: GuardOptions): () => void {
    const ask = confirmLeave || ((message: string) => window.confirm(message))

    const removeHook = router.beforeNavigate(() => {
        if (!hasUnsavedChanges()) return true
        return ask(t('playlists.leave')) === true
    })

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
        if (!hasUnsavedChanges()) return
        event.preventDefault()
        event.returnValue = '' // older browsers show their dialog only with this
    }
    window.addEventListener('beforeunload', onBeforeUnload)

    return () => {
        ;(removeHook as () => void)()
        window.removeEventListener('beforeunload', onBeforeUnload)
    }
}
