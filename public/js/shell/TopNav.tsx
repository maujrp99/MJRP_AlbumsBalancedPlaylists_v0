/**
 * TopNav - the top bar of the site (F83 wave 3; was components/TopNav.js): the logo, the links, the menu of series, the Spotify button and the
 * account on the computer; on the middle screens (up to 1023 px) the button that opens the drawer with the same places. On the phone the bar is
 * hidden by the stylesheet and the shell of the phone takes its place (PhoneShell).
 *
 * The hand-made bar was drawn again from the first element at every notice of the user store (what was open closed, the focus gone back to
 * the page), and not when the address changed. The bar here is made again at the same moments, with a `key` (see `drawnAnew`); and it
 * follows the address, which the hand-made one did not: its «current» link stayed where the address was when it was last drawn.
 */
import { useCallback, useEffect, useState } from 'react'
import { Icon } from '../ui/Icon'
import { useLocale } from '../react-bridge/useLocale'
import { useNotices, useStore } from '../react-bridge/useStore'
import { t } from '../i18n/t.js'
import { SeriesDropdown } from './SeriesDropdown'
import { SpotifyConnect } from './SpotifyConnect'
import { AccountDesktop, AccountDrawer } from './Account'
import { useRouteTicks, useShell, type ShellUser, type UserState } from './context'

const LOGO = '/assets/images/logo.png'

/** An address is the link's own, or inside it. */
const isCurrent = (path: string, link: string): boolean => path === link || path.startsWith(link + '/')

function NavLink({ to, label, path }: { to: string; label: string; path: string }) {
    const tone = isCurrent(path, to) ? 'text-accent-primary bg-white/5' : 'text-muted'
    return <a href={to} className={`nav-link-glow text-xs font-semibold uppercase tracking-wide px-2.5 py-1.5 rounded-lg transition-all duration-300 text-center whitespace-nowrap shrink-0 ${tone}`} data-link="">{` ${label} `}</a>
}

function DrawerLink({ to, label, icon, path }: { to: string; label: string; icon: string; path: string }) {
    const tone = isCurrent(path, to) ? 'bg-accent-primary/20 text-accent-primary' : 'text-white/70 hover:bg-white/5 hover:text-white'
    return (
        <a href={to} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${tone}`} data-link="">
            <Icon name={icon} className="w-5 h-5" />
            <span className="font-medium">{label}</span>
        </a>
    )
}

function DrawerSeries({ path }: { path: string }) {
    const [expanded, setExpanded] = useState(false)
    return (
        <div className="mobile-series-section">
            <button id="mobileSeriesToggle" className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-white/70 hover:bg-white/5 transition-all" onClick={() => setExpanded(was => !was)}>
                <div className="flex items-center gap-3">
                    <Icon name="Music" className="w-5 h-5" />
                    <span className="font-medium">{t('shell.series.label')}</span>
                </div>
                <Icon name="ChevronDown" className={`w-4 h-4 transition-transform duration-200${expanded ? ' rotate-180' : ''}`} />
            </button>
            <div id="mobileSeriesItems" className={`${expanded ? '' : 'hidden '}pl-8 space-y-1 mt-1`}>
                <DrawerLink to="/albums" label={t('shell.series.byAlbum')} icon="Disc" path={path} />
                <DrawerLink to="/artists" label={t('shell.series.byArtist')} icon="User" path={path} />
                <DrawerLink to="/genres" label={t('shell.series.byGenre')} icon="Tag" path={path} />
                <DrawerLink to="/tracks" label={t('shell.series.byTrack')} icon="Music" path={path} />
                <div className="border-t border-white/10 my-1" />
                <DrawerLink to="/playlist-series" label={t('shell.series.playlists')} icon="List" path={path} />
            </div>
        </div>
    )
}

/** The drawer of the middle screen: it holds the page while it is open, and closes by the background, by its X, by a link, by going back and by a wide window. */
function Drawer({ open, close, path, user }: { open: boolean; close: () => void; path: string; user: ShellUser | null }) {
    useEffect(() => {
        if (!open) return
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = '' }
    }, [open])

    useEffect(() => {
        const goneBack = () => close()
        const resized = () => { if (window.innerWidth >= 768) close() }
        window.addEventListener('popstate', goneBack)
        window.addEventListener('resize', resized)
        return () => {
            window.removeEventListener('popstate', goneBack)
            window.removeEventListener('resize', resized)
        }
    }, [close])

    return (
        <>
            <div id="mobileMenuOverlay" className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden${open ? '' : ' opacity-0 pointer-events-none'}`} onClick={close} />
            <div id="mobileMenu" className={`mobile-drawer fixed inset-y-0 left-0 z-50 flex flex-col w-[280px] max-w-[80vw] transition-transform duration-300 transform border-r border-orange-500/20 bg-brand-dark lg:hidden${open ? '' : ' -translate-x-full'}`} style={{ boxShadow: '4px 0 40px rgba(0,0,0,0.9)' }}>
                <div className="flex items-center justify-between p-5 border-b border-white/10 bg-brand-dark">
                    <div className="flex items-center gap-3">
                        <img src={LOGO} alt={t('shell.logo.markShort')} className="w-10 h-10" />
                        <span className="text-sm font-bold text-white/80">{t('shell.drawer.title')}</span>
                    </div>
                    <button id="closeMenuBtn" className="btn-icon p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors" onClick={close}>
                        <Icon name="X" className="w-5 h-5 text-white/70" />
                    </button>
                </div>
                {/* a click on a link closes the drawer; the router, listening to the page, takes the person there */}
                <nav className="flex flex-col p-4 gap-1 flex-1 bg-brand-dark" onClickCapture={(event) => { if ((event.target as Element).closest('a')) close() }}>
                    <DrawerLink to="/start" label={t('shell.nav.start')} icon="Rocket" path={path} />
                    <DrawerSeries path={path} />
                    <DrawerLink to="/blend" label={t('shell.nav.blend')} icon="Sliders" path={path} />
                    <DrawerLink to="/saved-playlists" label={t('shell.nav.playlists')} icon="List" path={path} />
                    <DrawerLink to="/inventory" label={t('shell.nav.inventory')} icon="Archive" path={path} />
                    <div className="px-4 py-2">
                        <div id="spotify-connect-mobile"><SpotifyConnect /></div>
                    </div>
                </nav>
                <div className="p-4 border-t border-white/10 text-center bg-brand-dark">
                    <AccountDrawer user={user} />
                </div>
            </div>
        </>
    )
}

function Logo() {
    return (
        <a href="/home" className="nav-logo flex items-center gap-3 group flex-1 lg:flex-none lg:shrink-0" data-full-page="" aria-label={t('shell.logo.entryPage')}>
            <div className="logo-icon w-12 h-12 md:w-16 md:h-16 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform shrink-0">
                <img src={LOGO} alt={t('shell.logo.mark')} className="w-full h-full object-contain" />
            </div>
            <img src="/assets/images/TheAlbumBlender.png" alt={t('shell.logo.title')} className="block h-8 sm:h-12 md:h-14 w-auto object-contain hover:opacity-80 transition-opacity" loading="lazy" />
        </a>
    )
}

function Bar({ path, state }: { path: string; state: UserState }) {
    const [drawerOpen, setDrawerOpen] = useState(false)
    const closeDrawer = useCallback(() => setDrawerOpen(false), [])
    return (
        <nav className="top-nav glass-panel mx-auto max-w-[1200px] xl:max-w-[1400px] mt-4 mb-8 px-3 py-1 flex justify-between items-center gap-2 sticky top-4 z-50">
            <button id="mobileMenuBtn" className="lg:hidden btn-icon p-2 mr-2" onClick={() => setDrawerOpen(true)}>
                <Icon name="Menu" className="w-6 h-6" />
            </button>
            <Logo />
            <div className="hidden lg:flex items-center gap-2 lg:gap-3 xl:gap-6 min-w-0">
                <NavLink to="/start" label={t('shell.nav.start')} path={path} />
                <SeriesDropdown path={path} />
                <NavLink to="/blend" label={t('shell.nav.blend')} path={path} />
                <NavLink to="/saved-playlists" label={t('shell.nav.playlists')} path={path} />
                <NavLink to="/inventory" label={t('shell.nav.inventory')} path={path} />
                <div id="spotify-connect-desktop" className="min-w-0"><SpotifyConnect /></div>
            </div>
            <div className="flex items-center gap-2 min-w-0">
                <AccountDesktop state={state} />
            </div>
            <Drawer open={drawerOpen} close={closeDrawer} path={path} user={state.currentUser} />
        </nav>
    )
}

export function TopNav() {
    const { userStore } = useShell()
    useLocale()
    useRouteTicks() // the bar follows the address
    const state = useStore(userStore, store => store.getState())
    const drawnAnew = useNotices(userStore) // the hand-made bar was drawn again at each notice of the user store
    return <Bar key={drawnAnew} path={window.location.pathname} state={state} />
}
