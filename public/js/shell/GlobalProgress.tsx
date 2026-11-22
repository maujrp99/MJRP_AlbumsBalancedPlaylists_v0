/**
 * GlobalProgress - the bar at the top of the page that says something is loading, drawn (F83 wave 8b; it was components/GlobalProgress.js). The count
 * of loaders is in stores/progress.js, which the router and the series service call; this draws the bar into the end of `body` (a portal), always there
 * and shown only while something loads. The id (`#globalProgress`) and the classes are the hand-made ones: css/mobile.css moves it under the top bar of the
 * phone. The hand-made bar was put at the START of `body`; it is fixed and above the page, so where it sits in the list of children changes nothing a person sees.
 */
import { createPortal } from 'react-dom'
import { useSyncExternalStore } from 'react'
import { globalProgress } from '../stores/progress.js'

type ProgressStore = typeof globalProgress

export function GlobalProgress({ store = globalProgress }: { store?: ProgressStore }) {
    const { visible } = useSyncExternalStore(store.subscribe, store.getState)
    return createPortal(
        <div id="globalProgress" className="fixed top-0 left-0 w-full h-1.5 z-[9999] pointer-events-none" style={{ display: visible ? 'block' : 'none' }}>
            <div className="h-full bg-brand-orange shadow-[0_0_15px_rgba(255,100,0,0.8)] animate-progress-indeterminate w-full origin-left" />
        </div>,
        document.body
    )
}
