/**
 * useScreenTitle - what a React screen says of itself outside its own box: the name in the top bar of the phone and the
 * title of the tab (F83). Both go through the functions of today: `nameThisScreen` of the phone shell, and `setTitle` of the
 * base view, the one place the tab title is written (test/architecture/oneTabTitle.test.js). The phone shell and the base
 * view are hand-made and leave in waves 3 and 8; this hook is the one door to them, so only it changes then.
 */
import { useEffect } from 'react'
import { nameThisScreen } from '../components/navigation/PhoneShell.js'
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
