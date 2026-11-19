/**
 * App Entry Point
 * Initializes Router, Auth, and Views
 * 
 * V3 Architecture: Uses AuthService to gate routing behind auth readiness.
 */

import '../css/index.css'
import '../css/tailwind.css' // Tailwind, built with the site; after the app's own styles (F59)
import { canonicalLocalUrl } from './utils/localAddress.js'

// One local address (F50): a page opened at `localhost` goes to the same place at 127.0.0.1,
// where the logins, the Spotify redirect and the caches live.
const localUrl = canonicalLocalUrl(window.location)
if (localUrl) window.location.replace(localUrl)
import { app, auth, db } from './firebase-init.js'
import './services/auth/userSession.js' // the user store starts hearing who is signed in (F58)
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
import { BlendingMenuView } from './views/BlendingMenuView.js'

import toast from './components/Toast.js'

// Export for other modules if needed
export { app, auth, db }

// Initialize UI Components
import { TopNav } from './components/TopNav.js'
import { Footer } from './components/Footer.js'
import { clearAppAlbumCaches } from './services/albums/albumLoading.js'
import { CacheManager } from './cache/CacheManager.js'
import { MigrationUtility } from './migration/MigrationUtility.js'

const initUI = () => {
    // The menu is given what reaches the database; it imports none of it (UAT-19)
    const topNav = new TopNav({ migrationUtility: new MigrationUtility(db, new CacheManager()) })
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

    // 3. Setup background enrichment trigger
    // When Spotify auth succeeds, auto-start background enrichment
    window.addEventListener('spotify-auth-success', async () => {
        console.log('🎵 Spotify auth success, triggering background enrichment...')
        try {
            const { spotifyEnrichmentService } = await import('./services/SpotifyEnrichmentService.js')

            // Subscribe to progress for toast notifications
            spotifyEnrichmentService.subscribe((event) => {
                if (event.type === 'started') {
                    toast.info(`🎵 Enriching ${event.total} albums with Spotify data...`)
                } else if (event.type === 'completed') {
                    toast.success(`✅ Enriched ${event.completed} albums (${event.failed} failed)`)
                } else if (event.type === 'already_complete') {
                    console.log('[Enrichment] All albums already enriched')
                }
            })

            // Start the enrichment after a short delay to let auth stabilize
            setTimeout(() => {
                spotifyEnrichmentService.startEnrichment()
            }, 2000)
        } catch (error) {
            console.error('[Bootstrap] Failed to start enrichment:', error)
        }
    })

    // 4. Now safe to handle routes (auth and stores are ready)
    console.log('✅ Auth ready, handling route...')

    if (!window.location.pathname || window.location.pathname === '/' || window.location.pathname === '/index-v2.html') {
        router.redirect('/home')
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

    router.redirect('/home')
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

// Data Migration route
router.register('/save-all', async () => {
    // The screen gets the app's one Firestore through the migration utility, never an SDK of its own (UAT-14)
    const [{ SaveAllView }, { MigrationUtility }] = await Promise.all([
        import('./views/SaveAllView.js'),
        import('./migration/MigrationUtility.js')
    ])
    return new SaveAllView({
        migrationUtility: new MigrationUtility(db, null),
        getUserId: () => auth.currentUser?.uid || null
    })
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
