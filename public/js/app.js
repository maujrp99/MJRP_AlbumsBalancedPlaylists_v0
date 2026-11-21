/**
 * App Entry Point
 * Initializes Router, Auth, and Views
 * 
 * V3 Architecture: Uses AuthService to gate routing behind auth readiness.
 */

import '../css/index.css'
import '../css/tailwind.css' // Tailwind, built with the site; after the app's own styles (F59)
import '../splash/bar-menu.css' // the home's bar, shared with the entry page (F88)
import '../css/top-menu.css' // the top menu of the computer (F88); before the phone's, which hides it
import '../css/mobile.css' // the phone (F76): after everything, every rule inside the phone's media query
import '../css/mobile/screens.css' // one file per screen of the phone, each inside the same media query
import '../css/safe-area.css' // a phone lying down: the page keeps clear of the island (F76)
import './services/platform/platformWiring.js' // the id port gets the browser's source before any module runs (F78)
import { canonicalLocalUrl } from './utils/localAddress.js'
import { installStaleBuildGuard } from './utils/staleBuild.js'

// One local address (F50): a page opened at `localhost` goes to the same place at 127.0.0.1,
// where the logins, the Spotify redirect and the caches live.
const localUrl = canonicalLocalUrl(window.location)
if (localUrl) window.location.replace(localUrl)

// A tab opened before a publication asks for files that are gone: the app loads again, once (F73)
installStaleBuildGuard(window)
import './firebase-init.js' // Firebase starts before anything that uses it
import './services/auth/userSession.js' // the user store starts hearing who is signed in (F58)
import { AuthService } from './services/AuthService.js'

import { router } from './router.js'
import { HomeView } from './views/HomeView.js'
// V3 Architecture: SeriesView replaces AlbumsView
import SeriesView from './views/SeriesView.js'
import SeriesController from './controllers/SeriesController.js'
import { PlaylistsView } from './views/PlaylistsView.js'
import { InventoryView } from './views/InventoryView.js'
import { ComingSoonView } from './views/ComingSoonView.js'
import { BlendingMenuView } from './views/BlendingMenuView.js'

import toast from './components/Toast.js'

// app.js exports nothing: no module imports the file that mounts the app (UAT-19). Who needs the
// database or the login is handed it where it is put together (the *Wiring.js files of services/).

// Initialize UI Components
import { TopNav } from './components/TopNav.js'
import { Footer } from './components/Footer.js'
import { clearAppAlbumCaches } from './services/albums/albumLoading.js'
import { startPhoneShell } from './components/navigation/PhoneShell.js'
import { userStore } from './stores/UserStore.js'
import { startUsageMeasurement } from './services/usage/usageWiring.js'
import { openSignInWhenAsked } from './components/navigation/signInFromLink.js'
import { START_PATH, leaveToHome } from './components/navigation/startRoute.js'
import { isSignedIn } from './components/navigation/AuthNav.js'
import { showLoginModal } from './components/LoginModal.js'
import { checkAppleWhenIdle } from './components/navigation/appleState.js'

const initUI = () => {
    const topNav = new TopNav({ clearCaches: clearAppAlbumCaches })
    router.afterNavigate((path) => topNav.followScreen(path))
    const headerEl = document.getElementById('header-container')
    if (headerEl) {
        headerEl.innerHTML = topNav.render()
        topNav.attachListeners()
    }

    const footer = new Footer({ clearCaches: clearAppAlbumCaches })
    const footerEl = document.getElementById('footer-container')
    if (footerEl) {
        footerEl.innerHTML = footer.render()
        footer.attachListeners()
    }

    // The phone (F76): its top bar, its tab bar and its menu exist only on a screen up to 767 px
    startPhoneShell({ router, userStore, clearCaches: clearAppAlbumCaches })
}

/**
 * Bootstrap the application.
 * Waits for auth to be ready before routing.
 */
async function bootstrap() {
    console.log('🚀 App Bootstrap Starting...')

    // 1. Initialize UI (TopNav, Footer) - doesn't depend on auth
    initUI()

    // 2. Wait for authentication to be ready
    const user = await AuthService.waitForAuth()

    if (!user) {
        console.warn('⚠️ App started without authenticated user. Some features may not work.')
        toast.warning('Authentication issue. Some features may be limited.')
    }

    // 3. (F69) Nothing is started here when Spotify connects: the album load asks the popularity
    //    of the albums it has, through its own queue (services/albums/popularityOnConnect.js).

    // 4. Now safe to handle routes (auth and stores are ready)
    console.log('✅ Auth ready, handling route...')

    if (!window.location.pathname || window.location.pathname === '/' || window.location.pathname === '/index-v2.html') {
        router.redirect(START_PATH)
    } else {
        router.handleRouteChange()
    }

    // «Sign in» on the entry page (F80) leads to /start?signin: the sign-in window opens here
    openSignInWhenAsked({
        location: window.location,
        signedIn: isSignedIn(user),
        openSignIn: showLoginModal,
        setAddress: (address) => router.setAddress(address, { replace: true })
    })

    console.log('🚀 App Bootstrap Complete')
}

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', bootstrap)

// The measurement of use (F77): off unless the build has a project key and nobody turned it off.
// Started before the first route, so the first screen is measured; it never holds the app.
startUsageMeasurement({ router })

// Apple Music's state (the owner uses it): asked once, in the background, when the page is idle after the
// first paint; the account button, the panel and the phone's sheet read that one answer (F88).
checkAppleWhenIdle()

// Register Routes
// V3: SeriesController is instantiated once and passed to view
const seriesController = new SeriesController();

router.register(START_PATH, () => new HomeView())
// F85 (MJRP, 2026-11-21): /home is the entry page, not a screen of the app. If the app is ever asked
// for it, it leaves to the browser (a full load); a server that answers /home with the app would loop,
// so the second ask inside the window stays and goes to /start.
router.register('/home', () => {
    if (!leaveToHome(window)) router.redirect(START_PATH + window.location.search)
    return null
})
router.register('/albums', () => new SeriesView(seriesController))
router.register('/albums/:seriesId', () => new SeriesView(seriesController))
router.register('/playlists', () => new PlaylistsView())
router.register('/inventory', () => new InventoryView())

// TopNav v2: New entity type routes (Coming Soon)
router.register('/artists', () => new ComingSoonView())
router.register('/genres', () => new ComingSoonView())
router.register('/tracks', () => new ComingSoonView())
router.register('/blend', () => new BlendingMenuView())

// Sprint 11 Phase 1: Spotify Auth Callback
router.register('/callback', async () => {
    const { SpotifyAuthService } = await import('./services/SpotifyAuthService.js')
    const toast = (await import('./components/Toast.js')).default

    await SpotifyAuthService.handleCallback().then(success => {
        if (success) {
            toast.success('Connected to Spotify!')
        } else {
            toast.error('Failed to connect to Spotify')
        }
    })

    router.redirect(START_PATH)
    return null
})

// Sprint 11: EditPlaylistView for editing existing batches
// ARCH-1 Refactor: Consolidated into PlaylistsView
router.register('/playlists/edit', () => new PlaylistsView())

// Redirect routes
router.register('/album-series', () => {
    router.redirect('/albums')
    return null
})
router.register('/playlist-series', async () => {
    const { SavedPlaylistsView } = await import('./views/SavedPlaylistsView.js')
    return new SavedPlaylistsView()
})
router.register('/saved-playlists', async () => {
    const { SavedPlaylistsView } = await import('./views/SavedPlaylistsView.js')
    return new SavedPlaylistsView()
})
router.register('/series', () => {
    router.redirect('/albums')
    return null
})

// Global Error Handler
window.addEventListener('error', (e) => {
    console.error('Global Error:', e.error)
})

// Expose stores/router globally, for the browser console and for browser-driven checks
if (typeof window !== 'undefined') {
    import('./stores/albumSeries.js').then(m => { window.albumSeriesStore = m.albumSeriesStore })
    import('./stores/albums.js').then(m => { window.albumsStore = m.albumsStore })
    import('./stores/playlists.js').then(m => { window.playlistsStore = m.playlistsStore })
    import('./stores/albumLoad.js').then(m => { window.albumLoadStore = m.albumLoadStore })
    import('./services/albums/albumLoading.js').then(m => {
        window.albumLoadService = m.albumLoadService
        // F55: `await albumIdentityAudit()` in the console counts, read-only, the albums that are not the album asked for
        window.albumIdentityAudit = m.countWrongAlbums
    })
    import('./services/SpotifyAuthService.js').then(m => { window.SpotifyAuthService = m.SpotifyAuthService })
    import('./services/SpotifyService.js').then(m => { window.SpotifyService = m.SpotifyService })
    window.router = router
}
