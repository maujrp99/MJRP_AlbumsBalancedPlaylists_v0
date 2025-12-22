/**
 * App Entry Point
 * Initializes Router, Auth, and Views
 * 
 * V3 Architecture: Uses AuthService to gate routing behind auth readiness.
 */

import '../css/index.css'
import { app, auth, db } from './firebase-init.js'
import { AuthService } from './services/AuthService.js'

import { router } from './router.js'
import { HomeView } from './views/HomeView.js'
// V3 Architecture: SeriesView replaces AlbumsView
import SeriesView from './views/SeriesView.js'
import SeriesController from './controllers/SeriesController.js'
import { PlaylistsView } from './views/PlaylistsView.js'
import { InventoryView } from './views/InventoryView.js'
import { RankingView } from './views/RankingView.js'
import { ConsolidatedRankingView } from './views/ConsolidatedRankingView.js'
import { ComingSoonView } from './views/ComingSoonView.js'

import toast from './components/Toast.js'

// Export for other modules if needed
export { app, auth, db }

// Initialize UI Components
import { TopNav } from './components/TopNav.js'
import { Footer } from './components/Footer.js'

const initUI = () => {
    const topNav = new TopNav()
    const headerEl = document.getElementById('header-container')
    if (headerEl) {
        headerEl.innerHTML = topNav.render()
        topNav.attachListeners()
    }

    const footer = new Footer()
    const footerEl = document.getElementById('footer-container')
    if (footerEl) {
        footerEl.innerHTML = footer.render()
        footer.attachListeners()
    }
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

    // 3. Now safe to handle routes (auth and stores are ready)
    console.log('✅ Auth ready, handling route...')

    if (!window.location.pathname || window.location.pathname === '/' || window.location.pathname === '/index-v2.html') {
        router.navigate('/home')
    } else {
        router.handleRouteChange()
    }

    console.log('🚀 App Bootstrap Complete')
}

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', bootstrap)

// Register Routes
// V3: SeriesController is instantiated once and passed to view
const seriesController = new SeriesController();

router.register('/home', () => new HomeView())
router.register('/albums', () => new SeriesView(seriesController))
router.register('/albums/:seriesId', () => new SeriesView(seriesController))
router.register('/playlists', () => new PlaylistsView())
router.register('/inventory', () => new InventoryView())

// TopNav v2: New entity type routes (Coming Soon)
router.register('/artists', () => new ComingSoonView())
router.register('/genres', () => new ComingSoonView())
router.register('/tracks', () => new ComingSoonView())
router.register('/blend', () => new ComingSoonView())

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

    router.navigate('/home')
    return null
})

// Sprint 11: EditPlaylistView for editing existing batches
router.register('/playlists/edit', async () => {
    const { EditPlaylistView } = await import('./views/EditPlaylistView.js')
    return new EditPlaylistView()
})

// Redirect routes
router.register('/album-series', () => {
    router.navigate('/albums')
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
    router.navigate('/albums')
    return null
})

// Data Migration route
router.register('/save-all', async () => {
    const { SaveAllView } = await import('./views/SaveAllView.js')
    return new SaveAllView()
})

router.register('/ranking/:albumId', () => new RankingView())
router.register('/consolidated-ranking', () => new ConsolidatedRankingView())

// Global Error Handler
window.addEventListener('error', (e) => {
    console.error('Global Error:', e.error)
})

// Expose stores/router globally for Puppeteer testing
if (typeof window !== 'undefined') {
    import('./stores/albumSeries.js').then(m => { window.albumSeriesStore = m.albumSeriesStore })
    import('./stores/albums.js').then(m => { window.albumsStore = m.albumsStore })
    import('./stores/playlists.js').then(m => { window.playlistsStore = m.playlistsStore })
    import('./services/SpotifyAuthService.js').then(m => { window.SpotifyAuthService = m.SpotifyAuthService })
    import('./services/SpotifyService.js').then(m => { window.SpotifyService = m.SpotifyService })
    window.router = router
}
