/**
 * App Entry Point
 * Initializes Router, Auth, and Views
 */

import '../css/index.css'
import { app, auth, db } from './firebase-init.js'
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'

import { router } from './router.js'
import { HomeView } from './views/HomeView.js'
import { AlbumsView } from './views/AlbumsView.js'
import { PlaylistsView } from './views/PlaylistsView.js'
import { InventoryView } from './views/InventoryView.js'
import { RankingView } from './views/RankingView.js'
import { ConsolidatedRankingView } from './views/ConsolidatedRankingView.js'
import toast from './components/Toast.js'
import { albumSeriesStore } from './stores/albumSeries.js'

// Export for other modules if needed (though they should import from config)
export { app, auth, db }

// Auth State Listener
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('✅ Authenticated as:', user.uid)
        document.body.classList.add('authenticated')

        // Initialize stores with Firestore and userId (Repository Pattern)
        // Store initialization logic handles checking if already initialized
        albumSeriesStore.init(db, user.uid)

        // Initialize Router if not already started
        // (Router handles its own initialization on load, but we might want to gate it)
    } else {
        console.log('⚠️ Not authenticated, signing in anonymously...')
        signInAnonymously(auth).catch((error) => {
            console.error('Auth failed:', error)
            toast.error('Authentication failed. App may not work correctly.')
        })
    }
})

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

// Initialize Router and UI when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initUI()

    // Default route handling
    if (!window.location.pathname || window.location.pathname === '/' || window.location.pathname === '/index-v2.html') {
        router.navigate('/home')
    } else {
        router.handleRouteChange()
    }
})

// Register Routes
router.register('/home', () => new HomeView())
router.register('/albums', () => new AlbumsView())
router.register('/playlists', () => new PlaylistsView())

// New routes for Phase 1 TopNav fix
router.register('/album-series', async () => {
    const { AlbumSeriesListView } = await import('./views/AlbumSeriesListView.js')
    return new AlbumSeriesListView(db)
})
router.register('/playlist-series', async () => {
    const { SavedPlaylistsView } = await import('./views/SavedPlaylistsView.js')
    return new SavedPlaylistsView()
})

// Legacy routes (kept for backward compatibility)
router.register('/saved-playlists', async () => {
    const { SavedPlaylistsView } = await import('./views/SavedPlaylistsView.js')
    return new SavedPlaylistsView()
})
router.register('/series', async () => {
    const { AlbumSeriesListView } = await import('./views/AlbumSeriesListView.js')
    return new AlbumSeriesListView(db)
})

router.register('/inventory', () => new InventoryView())
router.register('/ranking/:albumId', () => new RankingView())
router.register('/consolidated-ranking', () => new ConsolidatedRankingView())

// Default route handling is done by Router class (popstate/load)

// Global Error Handler
window.addEventListener('error', (e) => {
    console.error('Global Error:', e.error)
    // Optional: Show toast
})


console.log('🚀 App Initialized')

// Expose stores/router globally for Puppeteer testing
if (typeof window !== 'undefined') {
    import('./stores/albumSeries.js').then(m => { window.albumSeriesStore = m.albumSeriesStore })
    import('./stores/albums.js').then(m => { window.albumsStore = m.albumsStore })
    import('./stores/playlists.js').then(m => { window.playlistsStore = m.playlistsStore })
    window.router = router
}

