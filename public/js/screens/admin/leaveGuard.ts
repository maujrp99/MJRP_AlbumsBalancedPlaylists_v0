/**
 * Leaving the Painel with changes not saved asks first (F82, REQ-09): a navigation of the app (a link, the back and forward
 * buttons of the browser) asks through the router, which keeps the person where they are when the answer is no; closing or
 * reloading the tab asks through the browser's own dialog. Moving between the screens of the Painel never asks: the Painel
 * replaces its own address instead of adding one, so «back» always leaves the Painel, and this is where it is asked.
 */
export interface LeaveGuardDeps {
    /** The router's hook before a move: returning false refuses it. Returns the way to take the hook away. */
    beforeNavigate: (hook: () => boolean) => () => void
    /** The question, in the site's language. */
    question: () => string
    /** The browser's confirm by default. */
    confirm?: (message: string) => boolean
}

/** Installs the guard; `unsaved` is asked at the moment of leaving. Returns the uninstall. */
export function installLeaveGuard(deps: LeaveGuardDeps, unsaved: () => boolean): () => void {
    const ask = deps.confirm ?? ((message: string) => window.confirm(message))
    const removeHook = deps.beforeNavigate(() => !unsaved() || ask(deps.question()))
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
        if (!unsaved()) return
        event.preventDefault()
        event.returnValue = '' // older browsers show their dialog only with this
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
        removeHook()
        window.removeEventListener('beforeunload', onBeforeUnload)
    }
}
