/**
 * useLocale - a React screen draws again when the language of the site, or its published texts (F82), change (F83; the contract of the proposal § 5.2).
 * It sits on the same module the hand-made screens call (`t()` and `onLocaleChange` of i18n/t.js), so one dictionary serves
 * both kinds of screen. The listener is counted by the bridge, so a screen that is left is proved to have let go of it.
 */
import { useSyncExternalStore } from 'react'
import { getLocale, getTextsVersion, onTextsChange } from '../i18n/t.js'
import { countListener } from './listeners'

function subscribe(changed: () => void): () => void {
    const stop = onTextsChange(changed)
    const release = countListener()
    return () => {
        stop()
        release()
    }
}

// What a screen draws from: the language and the version of the published texts (F82, REQ-10). A text the owner published
// arrives after the first draw, with no change of language, and the screen must draw again.
const drawnFrom = (): string => `${getLocale()}|${getTextsVersion()}`

/** The language the site speaks now (`en` or `pt`); the screen draws again when it, or the published texts, change. */
export function useLocale(): string {
    return useSyncExternalStore(subscribe, drawnFrom).split('|')[0]
}
