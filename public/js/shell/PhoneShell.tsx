/**
 * PhoneShell - what frames every screen on the phone (F76, REQ-03; F83 wave 3, was components/navigation/PhoneShell.js): a low top bar that
 * says where the person is and opens the menu, the tab bar at the bottom with the five destinations, and a «back to top» button after two
 * screens of scroll. Styles: public/css/mobile.css.
 *
 * It exists only on the phone: its three elements are put straight in the body (a portal, in the order they always had) when the screen is a
 * phone and taken away when it stops being one (a turn of the phone, a resized window). On the computer nothing of it is on the page. The top
 * bar and the footer of the computer stay in the page and are hidden on the phone by the stylesheet.
 *
 * The hand-made shell drew the top bar again at each notice of the user store, at the end of each navigation and each time a screen named
 * itself, and the tab bar at the end of each navigation: the focus a tab held went back to the page. Here the same parts are made again, with
 * a `key`, at the same moments.
 */
import { Fragment, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../ui/Icon'
import { usePhone } from '../react-bridge/usePhone'
import { useLocale } from '../react-bridge/useLocale'
import { useNotices, useStore } from '../react-bridge/useStore'
import { giveBackAStrayHold, holdPageBehindWindows } from '../components/ui/windowsHoldThePage.js'
import { screenNameStore } from '../stores/screenName.js'
import { isSignedIn } from '../utils/isSignedIn.js'
import { t } from '../i18n/t.js'
import { PHONE_TABS, currentTab, screenName, type PhoneTab } from './phoneTabs'
import { accountInitial, usePhoneMenus } from './PhoneMenu'
import { useRouteTicks, useShell, type ShellUser } from './context'

const LOGO = '/assets/images/logo.png'
/** «Back to top» shows after this many screens of scroll (finding 23 of the UX audit). */
const SCREENS_BEFORE_TO_TOP = 2

const toTop = (): void => {
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: still ? 'auto' : 'smooth' })
}

/**
 * «Back to top». The tapped button lets go of the focus first: the button hides itself on the way up (below two screens of scroll), and React,
 * when a commit takes the focus from an element, puts the scroll of the page back where it was at that moment, which stops a smooth scroll
 * half way. With the focus on nothing there is nothing for React to restore, and the page goes all the way up, as it did.
 */
function backToTop(event: ReactMouseEvent<HTMLButtonElement>): void {
    event.currentTarget.blur()
    toTop()
}

function TopBarContent({ path, user, named, openMenu }: { path: string; user: ShellUser | null; named: string | null; openMenu: () => void }) {
    return (
        <>
            <a className="phone-topbar__logo-link" href="/home" data-full-page="" aria-label={t('shell.logo.entryPage')}><img className="phone-topbar__logo" src={LOGO} alt="" /></a>
            {/* what a person wrote is a text node, never HTML */}
            <span className="phone-topbar__title" data-screen-name="">{named || screenName(path)}</span>
            <button type="button" id="phoneMenuBtn" className="phone-topbar__menu" aria-haspopup="dialog" aria-label={t('shell.phone.menuAndAccount')} onClick={openMenu}>
                {isSignedIn(user) ? <span className="phone-avatar" data-account-initial="">{accountInitial(user)}</span> : <Icon name="Menu" className="phone-topbar__menu-icon" />}
            </button>
        </>
    )
}

/** A tap on the tab of the screen the person is on goes to the top of it, as on the iPhone. */
function Tab({ tab, path }: { tab: PhoneTab; path: string }) {
    const isCurrent = currentTab(path)?.id === tab.id
    const onClick = (event: ReactMouseEvent) => {
        if (!isCurrent || `/${tab.route}` !== path) return
        event.preventDefault()
        event.stopPropagation()
        toTop()
    }
    return (
        <a href={`/${tab.route}`} data-link="" data-tab={tab.id} className={`phone-tabbar__tab${isCurrent ? ' is-current' : ''}`} aria-current={isCurrent ? 'page' : undefined} onClick={onClick}>
            <Icon name={tab.icon} className="phone-tabbar__icon" />
            <span className="phone-tabbar__label">{t(tab.labelKey)}</span>
        </a>
    )
}

/** The page behind a window of the app does not scroll while one is on it; a hold left with nothing open never outlives its screen (recheck N22). */
function usePageHold(ticks: number): void {
    useEffect(() => holdPageBehindWindows(window) as () => void, [])
    const seen = useRef(ticks)
    useEffect(() => {
        if (seen.current === ticks) return
        seen.current = ticks
        giveBackAStrayHold(window)
    }, [ticks])
}

/** «Back to top» shows after two screens of scroll. */
function useFarDown(): boolean {
    const far = () => window.scrollY >= window.innerHeight * SCREENS_BEFORE_TO_TOP
    const [isFar, setFar] = useState(far)
    useEffect(() => {
        const onScroll = () => setFar(far())
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])
    return isFar
}

function PhoneParts() {
    useLocale()
    const { userStore } = useShell()
    const ticks = useRouteTicks()
    const user = useStore(userStore, store => store.getState().currentUser)
    const named = useStore(screenNameStore, store => store.getName())
    const drawnAnew = `${useNotices(userStore)}-${ticks}-${useNotices(screenNameStore)}`
    const path = window.location.pathname
    const menus = usePhoneMenus(user)
    const isFar = useFarDown()
    usePageHold(ticks)

    // A new screen starts at its top; the same screen drawn again stays where it was. The menu of the old screen leaves.
    const lastPath = useRef(path)
    const seen = useRef(ticks)
    useEffect(() => {
        if (seen.current === ticks) return
        seen.current = ticks
        menus.closeMenu()
        if (path !== lastPath.current) window.scrollTo(0, 0)
        lastPath.current = path
    })

    const bars = (
        <>
            <header id="phone-topbar" className="phone-topbar">
                <Fragment key={drawnAnew}><TopBarContent path={path} user={user} named={named} openMenu={menus.open} /></Fragment>
            </header>
            <div id="phone-tabbar" className="phone-tabbar">
                <Fragment key={ticks}>
                    <nav className="phone-tabbar__tabs" aria-label={t('shell.phone.tabsLabel')}>
                        {PHONE_TABS.map(tab => <Tab key={tab.id} tab={tab} path={path} />)}
                    </nav>
                </Fragment>
            </div>
            <button type="button" className="phone-to-top" hidden={!isFar} aria-label={t('shell.phone.backToTop')} onClick={backToTop}>
                <Icon name="ArrowUp" className="phone-to-top__icon" />
            </button>
        </>
    )
    return <>{createPortal(bars, document.body)}{menus.layer}</>
}

/** The shell of the phone: on the page only while the screen is a phone. */
export function PhoneShell() {
    return usePhone() ? <PhoneParts /> : null
}
