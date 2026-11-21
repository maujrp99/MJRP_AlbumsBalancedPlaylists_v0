/**
 * usePhone - «is this the phone?» for a React screen (F83). It sits on the one function of the site, utils/isPhone.js, so the
 * line of 767 px stays written in the two places it was (the function and the stylesheets), checked by the same test.
 */
import { useSyncExternalStore } from 'react'
import { isPhone, onPhoneChange } from '../utils/isPhone.js'
import { countListener } from './listeners'

function subscribe(changed: () => void): () => void {
    const stop = onPhoneChange(() => changed())
    const release = countListener()
    return () => {
        stop()
        release()
    }
}

/** True on a screen up to 767 px wide; the screen is drawn again when a turn of the phone or a resize changes the answer. */
export function usePhone(): boolean {
    return useSyncExternalStore(subscribe, () => isPhone())
}
