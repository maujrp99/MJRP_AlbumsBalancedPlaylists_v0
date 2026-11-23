/**
 * Toasts - the notices of the site, drawn (F83 wave 8b; they were components/Toast.js). The list and its clocks are in stores/toasts.js, which
 * controllers and services call without React; this draws it into a box at the end of `body` (a portal) that appears with the first notice and
 * stays, empty, after the last one, as the hand-made box did. A notice is drawn as it always was: a green, red, amber or dark box that comes in
 * from the right (`translate-x-full opacity-0` for its first frame), an icon, the text and a close button; phone placement is css/mobile.css.
 *
 * Kept as they were (existing defects, an issue candidate each): the close button asks for its name by `arialabel`, an attribute no browser reads
 * (the hand-made notice spelled it `ariaLabel` through its helper), and the icons are drawn with the attribute names `strokeLinecap`,
 * `strokeLinejoin` and `strokeWidth` as written, which an svg ignores, so they come out as thin lines with square ends.
 */
import { createPortal } from 'react-dom'
import { useSyncExternalStore } from 'react'
import { toasts } from '../stores/toasts.js'
import { t } from '../i18n/t.js'

type ToastStore = typeof toasts

const STYLES: Record<string, string> = {
    success: 'bg-green-600/95 text-white border border-green-500/50',
    error: 'bg-red-600/95 text-white border border-red-500/50',
    warning: 'bg-amber-600/95 text-white border border-amber-500/50'
}
const INFO_STYLE = 'bg-surface-dark/95 text-white border border-white/10'

const ICON_PATHS: Record<string, string> = {
    success: 'M5 13l4 4L19 7',
    error: 'M6 18L18 6M6 6l12 12',
    warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
}
const INFO_PATH = 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'

/** The stroke attributes as the hand-made notice wrote them: by their camel-case names, which an svg does not read. */
const drawn = (element: SVGPathElement | null): void => {
    if (!element) return
    element.setAttribute('strokeLinecap', 'round')
    element.setAttribute('strokeLinejoin', 'round')
    element.setAttribute('strokeWidth', '2')
}

function Notice({ id, message, type, shown, dismiss }: { id: number; message: string; type: string; shown: boolean; dismiss: (id: number) => void }) {
    const place = shown ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    const closeName = { arialabel: t('ui.window.close') }
    return (
        <div className={`toast pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg transform ${place} transition-all duration-300 ${STYLES[type] ?? INFO_STYLE}`}>
            <span className="toast-icon">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path ref={drawn} d={ICON_PATHS[type] ?? INFO_PATH} /></svg>
            </span>
            <span className="flex-1">{message}</span>
            <button type="button" className="toast-close opacity-60 hover:opacity-100 transition-opacity" {...closeName} onClick={() => dismiss(id)}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path ref={drawn} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
    )
}

/** The notices on the page; `store` is the site's, a test gives its own. */
export function Toasts({ store = toasts }: { store?: ToastStore }) {
    const { notices, everShown } = useSyncExternalStore(store.subscribe, store.getState)
    if (!everShown) return null
    return createPortal(
        <div id="toast-container" className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
            {notices.map((notice) => <Notice key={notice.id} {...notice} dismiss={store.dismiss} />)}
        </div>,
        document.body
    )
}
