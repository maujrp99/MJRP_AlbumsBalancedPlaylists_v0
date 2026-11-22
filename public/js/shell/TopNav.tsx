/**
 * TopNav - the top menu of the computer (F88, the level «Transformar»; F83 sync of main: was components/TopNav.js): the home's bar continues inside
 * the app. The mark that leads to the home, the five stops over one row of bars (fire on the current screen), the account and the connections in
 * one panel, and under the bar a line for Albums and for Playlists. On the phone it is hidden by the stylesheet (public/css/mobile.css) and the
 * phone's own shell takes its place (PhoneShell).
 *
 * The hand-made menu was drawn again from the first element at every notice of the user store (what was open closed, the focus gone back to the
 * page); at the end of a navigation only the bar and the line under it were drawn again, and the panel kept its state. Here the same parts are
 * made again, with a `key`, at the same moments; the bars wake (their last bars move) at the first draw and at each navigation.
 */
import { useEffect } from 'react'
import { useLocale } from '../react-bridge/useLocale'
import { useNotices, useStore } from '../react-bridge/useStore'
import { t } from '../i18n/t.js'
import { AccountDesktop } from './Account'
import { BarMenu, restBars, wakeBars } from './BarMenu'
import { SubRow } from './SubRow'
import { WORDMARK_HEIGHT, WORDMARK_URL, WORDMARK_WIDTH } from './wordmark'
import { useRouteTicks, useShell, type UserState } from './context'

function Menu({ path, state, ticks }: { path: string; state: UserState; ticks: number }) {
    useEffect(() => {
        wakeBars()
    }, [ticks])
    useEffect(() => restBars, [])
    return (
        <header className="top-menu">
            <div className="top-menu__row">
                <a className="top-menu__home" href="/home" data-full-page="" aria-label={t('shell.logo.entryPage')}>
                    <img className="top-menu__logo" src={WORDMARK_URL} alt={t('shell.logo.title')} width={WORDMARK_WIDTH} height={WORDMARK_HEIGHT} />
                </a>
                <div className="top-menu__bar" id="top-menu-bar" key={ticks}><BarMenu path={path} /></div>
                <div className="top-menu__acct"><AccountDesktop state={state} /></div>
            </div>
            <div className="top-menu__sub" id="top-menu-sub" key={ticks}><SubRow path={path} /></div>
        </header>
    )
}

export function TopNav() {
    const { userStore } = useShell()
    useLocale()
    const ticks = useRouteTicks() // the bar and the line under it follow the address
    const state = useStore(userStore, store => store.getState())
    const drawnAnew = useNotices(userStore) // the hand-made menu was drawn again at each notice of the user store
    return <Menu key={drawnAnew} path={window.location.pathname} state={state} ticks={ticks} />
}
