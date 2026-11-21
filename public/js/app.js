/**
 * App Entry Point
 * Initializes Router, Auth, and Views
 * 
 * V3 Architecture: Uses AuthService to gate routing behind auth readiness.
 */

import '../css/index.css'
import '../css/tailwind.css' // Tailwind, built with the site; after the app's own styles (F59)
import '../css/mobile.css' // the phone (F76): after everything, every rule inside the phone's media query
import '../css/mobile/screens.css' // one file per screen of the phone, each inside the same media query
import '../css/safe-area.css' // a phone lying down: the page keeps clear of the island (F76)
import './services/platform/platformWiring.js' // the id port gets the browser's source before any module runs (F78)
import { canonicalLocalUrl } from './utils/localAddress.js'
import { installStaleBuildGuard } from './utils/staleBuild.js'
import { loadScreen } from './utils/loadScreen.js'

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
// V3 Architecture: SeriesView replaces AlbumsView
import SeriesView from './views/SeriesView.js'
import SeriesController from './controllers/SeriesController.js'
import { InventoryView } from './views/InventoryView.js'
import { BlendingMenuView } from './views/BlendingMenuView.js'

import toast from './components/Toast.js'

// app.js exports nothing: no module imports the file that mounts the app (UAT-19). Who needs the
// database or the login is handed it where it is put together (the *Wiring.js files of services/).

// The shell: the top bar and the footer of the computer, the shell of the phone, the window to sign in (F83 wave 3, in React). Its code is in
// the main script and React comes with it, as a file of its own (react-vendor), at the start; the screens in React come after the first screen.
import { startShell } from './shell/Shell.tsx'
import { clearAppAlbumCaches } from './services/albums/albumLoading.js'
import { userStore } from './stores/UserStore.js'
import { startUsageMeasurement } from './services/usage/usageWiring.js'
import { openSignInWhenAsked } from './components/navigation/signInFromLink.js'
import { START_PATH, leaveToHome } from './components/navigation/startRoute.js'
import { isSignedIn } from './utils/isSignedIn.js'
import { openLoginWindow } from './stores/loginWindow.js'
import { prefetchScreensAfterTheFirstScreen } from './utils/prefetchScreens.js'

const initUI = () => {
    // The top bar, the footer and the shell of the phone, in React, in their own places outside #app
    startShell({ router, userStore, clearCaches: clearAppAlbumCaches })
}

/**
 * Bootstrap the application.
 * Waits for auth to be ready before routing.
 */
async function bootstrap() {
    console.log('🚀 App Bootstrap Starting...')

    // 1. Initialize UI (the shell) - doesn't depend on auth
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
        openSignIn: openLoginWindow,
        setAddress: (address) => router.setAddress(address, { replace: true })
    })

    console.log('🚀 App Bootstrap Complete')
}

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', bootstrap)

// The measurement of use (F77): off unless the build has a project key and nobody turned it off.
// Started before the first route, so the first screen is measured; it never holds the app.
startUsageMeasurement({ router })

// Register Routes
// V3: SeriesController is instantiated once and passed to view
const seriesController = new SeriesController();

// The Start screen (F83 wave 4, in React) is the first screen the person sees, so its file starts to come down now, while the login
// is asked, and not when the route asks for it; the route waits for it. It is also one of the screens that come down in the background.
const loadStart = loadScreen(() => import('./screens/start/index.ts'))
const startRoute = async () => {
    const { startView } = await loadStart()
    return startView()
}
loadStart().catch(() => {}) // no network or a slow one: the route asks again and says so
router.register(START_PATH, startRoute)
// F85 (MJRP, 2026-11-21): /home is the entry page, not a screen of the app. If the app is ever asked
// for it, it leaves to the browser (a full load); a server that answers /home with the app would loop,
// so the second ask inside the window stays and goes to /start.
router.register('/home', () => {
    if (!leaveToHome(window)) router.redirect(START_PATH + window.location.search)
    return null
})
router.register('/albums', () => new SeriesView(seriesController))
router.register('/albums/:seriesId', () => new SeriesView(seriesController))
router.register('/inventory', () => new InventoryView())

// TopNav v2: New entity type routes (Coming Soon). The first screen in React (F83): its file, and React with it, come when
// the person opens one of the three; the main script carries neither.
const loadComingSoon = loadScreen(() => import('./screens/coming-soon/index.ts'))
const comingSoonRoute = (kind) => async () => {
    const { comingSoonView } = await loadComingSoon()
    return comingSoonView(kind)
}
router.register('/artists', comingSoonRoute('artists'))
router.register('/genres', comingSoonRoute('genres'))
router.register('/tracks', comingSoonRoute('tracks'))
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

// Redirect routes
router.register('/album-series', () => {
    router.redirect('/albums')
    return null
})
// The screens loaded late: the file comes with a deadline of 10 s (F83: after it, «no connection», not «new version»).
// loadScreen gives each file a deadline and, after a lost network, asks for it again in a way the browser does not refuse
const loadSavedPlaylists = loadScreen(() => import('./screens/saved-playlists/index.ts'))
const savedPlaylistsRoute = async () => {
    const { savedPlaylistsView } = await loadSavedPlaylists()
    return savedPlaylistsView()
}
const loadPlaylists = loadScreen(() => import('./screens/playlists/index.ts'))
const playlistsRoute = async () => {
    const { playlistsView } = await loadPlaylists()
    return playlistsView()
}
// The playlists screen (F83 wave 2): the set the blend made, or a saved batch being edited (/playlists/edit), the same screen
router.register('/playlists', playlistsRoute)
router.register('/playlists/edit', playlistsRoute)
router.register('/playlist-series', savedPlaylistsRoute)
router.register('/saved-playlists', savedPlaylistsRoute)
router.register('/series', () => {
    router.redirect('/albums')
    return null
})

// The screens in React come down in the background once the first screen is on the page (F83, REQ-10): changing screens still works
// with no network after the first load, as it did when everything was in the main script. React itself is already there: the shell is React.
prefetchScreensAfterTheFirstScreen(router, [loadStart, loadSavedPlaylists, loadPlaylists, loadComingSoon])

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
