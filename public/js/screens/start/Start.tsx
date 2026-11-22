/**
 * Start - the first screen of the app (/start; the old Home, F79; in React since F83 wave 4, with the same look and the same behaviour).
 *
 * The Start screen that explains itself (design/inception/home-transformar-v2.html): one stage.
 *
 *   the stage     the title and what a series is (before anything is found), the one field (an artist or a pasted list), the hint
 *                 that points to the next gesture, the equalizer (Stage.tsx);
 *   the results   the three steps (first visit), the wait, the artist with the type chips and «Add all», the grid of covers (numbered
 *                 when chosen), «not found», «no answer» (Results.tsx);
 *   the dock      the series being built, always in view; on the phone, the action bar (Dock.tsx).
 *
 * The screen draws; the controller (StartController.ts) decides. It tells the screen to draw again by moving a version, and the screen
 * reads what it needs from the controller while it draws (nothing is kept from a draw to the next: the lists the controller hands out are
 * replaced, never changed inside, but a screen that kept one would be wrong the day that changed). The one store the screen depends on,
 * the user's (the line of the visitor), is listened to by the controller, as the old controller did.
 */
import { useEffect, useSyncExternalStore } from 'react'
import { useLocale } from '../../react-bridge/useLocale'
import { usePhone } from '../../react-bridge/usePhone'
import { useScreenTitle } from '../../react-bridge/useScreenTitle'
import { countListener } from '../../react-bridge/listeners'
import { onPhoneChange } from '../../utils/isPhone.js'
import { Dock } from './Dock'
import { barShows } from './homeSeries'
import { Results } from './Results'
import { Stage } from './Stage'
import type { StartController } from './StartController'

interface Props {
    controller: StartController
}

export function Start({ controller }: Props) {
    useLocale()
    const phone = usePhone()
    useSyncExternalStore(controller.subscribe, controller.getVersion)
    useScreenTitle({ tab: 'MJRP The Album Blender - Playlist Generator' }) // one title for the whole app (UAT-192): the same text as in index.html

    // The screen became a phone or stopped being one: the dock takes the other form.
    useEffect(() => {
        const stop = onPhoneChange(() => controller.screenChanged())
        const release = countListener()
        return () => {
            stop()
            release()
        }
    }, [controller])

    // The phone's bar comes with the first cover (UAT-281): without it the page needs less room below
    const model = controller.model
    const barless = phone && !barShows({ chosen: model?.albums.length ?? 0, created: Boolean(model?.created) })
    return (
        <div id="home-page" className={`home-page${barless ? ' is-barless' : ''}`}>
            <Stage controller={controller} phone={phone} />
            <Results controller={controller} phone={phone} />
            <div id="homeDockHost"><Dock controller={controller} phone={phone} /></div>
        </div>
    )
}
