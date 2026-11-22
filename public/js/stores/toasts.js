/**
 * toasts - the notices of the site (F83 wave 8b; they were components/Toast.js, which drew them by hand).
 *
 * `toast.success/error/warning/info(text, ms)` is the door for code that is not a component: the controllers, the services, the actions of a
 * screen. It keeps the list of the notices on screen and their clocks (in for one frame, out after `duration` ms, gone 300 ms later); the
 * shell draws the list (shell/Toasts.tsx). No React is here, so a controller can import it. What the hand-made notice did and this does the same:
 * 4 s by default, the newest at the bottom, the close button, and an exit that waits its 300 ms with no regard for the reduced-motion setting.
 * The old `showToast` handed back the element it drew; nobody read it, and this hands back the id of the notice.
 */

const TOAST_DURATION = 4000
const TOAST_ANIMATION_DURATION = 300

/**
 * @typedef {{ id: number, message: string, type: string, shown: boolean }} Notice
 * @typedef {{ notices: Notice[], everShown: boolean }} ToastState
 */

/** One list of notices with its clocks. The site has one (`toasts` below); a test makes its own. */
export function createToasts() {
    /** @type {ToastState} */
    let state = { notices: [], everShown: false }
    let nextId = 1
    const listeners = new Set()
    const timers = new Map()

    const change = (notices, everShown = state.everShown) => {
        state = { notices, everShown }
        listeners.forEach((listener) => listener())
    }
    const set = (id, shown) => {
        if (!state.notices.some((notice) => notice.id === id && notice.shown !== shown)) return
        change(state.notices.map((notice) => (notice.id === id ? { ...notice, shown } : notice)))
    }

    /** The notice goes out (its exit lasts 300 ms) and is taken off the page after it. Asked again, it only schedules the removal again. */
    function dismiss(id) {
        clearTimeout(timers.get(id))
        timers.delete(id)
        set(id, false)
        setTimeout(() => {
            if (state.notices.some((notice) => notice.id === id)) change(state.notices.filter((notice) => notice.id !== id))
        }, TOAST_ANIMATION_DURATION)
    }

    /**
     * Shows a notice.
     * @param {string} message
     * @param {string} [type] - 'success' | 'error' | 'warning' | 'info' (the default)
     * @param {number} [duration] - ms on screen before it goes out (default 4000)
     * @returns {number} the id of the notice
     */
    function showToast(message, type = 'info', duration = TOAST_DURATION) {
        const id = nextId++
        change([...state.notices, { id, message, type, shown: false }], true)
        // in on the next frame; as the hand-made notice did, this frame shows it even if it was dismissed before it came
        requestAnimationFrame(() => set(id, true))
        timers.set(id, setTimeout(() => dismiss(id), duration))
        return id
    }

    return {
        showToast,
        dismiss,
        toast: {
            success: (message, duration) => showToast(message, 'success', duration),
            error: (message, duration) => showToast(message, 'error', duration),
            warning: (message, duration) => showToast(message, 'warning', duration),
            info: (message, duration) => showToast(message, 'info', duration)
        },
        subscribe: (listener) => {
            listeners.add(listener)
            return () => listeners.delete(listener)
        },
        getState: () => state
    }
}

/** The notices of the site. */
export const toasts = createToasts()

export const { showToast, toast } = toasts

export default toast
