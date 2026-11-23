/**
 * useScreenTitle - what a React screen says of itself outside its own box: the name in the top bar of the phone and the
 * title of the tab (F83). The name goes through `nameThisScreen` of the phone shell (the shell hears it through a small store,
 * stores/screenName.js); the title of the tab is written here, the one place that writes it (test/architecture/oneTabTitle.test.js).
 * It was `setTitle` of the hand-made BaseView until wave 8d; this hook is the one door to both.
 */
import { useEffect } from 'react'
import { nameThisScreen } from '../stores/screenName.js'

export interface ScreenTitle {
    /** The name in the top bar of the phone, in place of the name of the address (a series name, say). */
    name?: string
    /** The title of the tab. Leave it out to keep the one the page has. */
    tab?: string
}

export function useScreenTitle({ name, tab }: ScreenTitle): void {
    useEffect(() => {
        if (name) nameThisScreen(name)
    }, [name])
    useEffect(() => {
        if (tab) document.title = tab
    }, [tab])
}
