/**
 * useLocale - a React screen draws again when the language of the site changes (F83; the contract of the proposal § 5.2).
 * It sits on the same module the hand-made screens call (`t()` and `onLocaleChange` of i18n/t.js), so one dictionary serves
 * both kinds of screen. The listener is counted by the bridge, so a screen that is left is proved to have let go of it.
 */
import { useSyncExternalStore } from 'react'
import { getLocale, onLocaleChange } from '../i18n/t.js'
import { countListener } from './listeners'

function subscribe(changed: () => void): () => void {
    const stop = onLocaleChange(() => changed())
    const release = countListener()
    return () => {
        stop()
        release()
    }
}

/** The language the site speaks now (`en` or `pt`); the screen draws again when it changes. */
export function useLocale(): string {
    return useSyncExternalStore(subscribe, getLocale)
}
