/**
 * useScreenTitle - what a React screen says of itself outside its own box: the name in the top bar of the phone and the
 * title of the tab (F83). Both go through the functions of today: `nameThisScreen` of the phone shell, and `setTitle` of the
 * base view, the one place the tab title is written (test/architecture/oneTabTitle.test.js). The shell of the phone
 * hears the name through a small store (stores/screenName.js); the base view is hand-made and leaves in wave 8; this hook is the one door to both.
 */
import { useEffect } from 'react'
import { nameThisScreen } from '../stores/screenName.js'
import { BaseView } from '../views/BaseView.js'

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
        if (tab) new BaseView().setTitle(tab)
    }, [tab])
}
