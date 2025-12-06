/**
 * App Entry Point
 * Initializes Router, Auth, and Views
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js'
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js'
import { getFirestore } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js'

import { router } from './router.js'
import { HomeView } from './views/HomeView.js'
import { AlbumsView } from './views/AlbumsView.js'
import { PlaylistsView } from './views/PlaylistsView.js'
import { InventoryView } from './views/InventoryView.js'
import { RankingView } from './views/RankingView.js'
import { ConsolidatedRankingView } from './views/ConsolidatedRankingView.js'

// Initialize Firebase
const firebaseConfig = window.__firebase_config || {
    // Fallback if window config is missing (should be injected by server/build)
    apiKey: "API_KEY_PLACEHOLDER",
    authDomain: "mjrp-albums.firebaseapp.com",
    projectId: "mjrp-albums",
    storageBucket: "mjrp-albums.appspot.com",
    messagingSenderId: "SENDER_ID_PLACEHOLDER",
    appId: "APP_ID_PLACEHOLDER"
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

// Export for other modules if needed (though they should import from config)
export { app, auth, db }

// Auth State Listener
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('✅ Authenticated as:', user.uid)
        document.body.classList.add('authenticated')

        // Initialize Router if not already started
        // (Router handles its own initialization on load, but we might want to gate it)
    } else {
        console.log('⚠️ Not authenticated, signing in anonymously...')
        signInAnonymously(auth).catch((error) => {
            console.error('Auth failed:', error)
            alert('Authentication failed. App may not work correctly.')
        })
    }
})

// Register Routes
router.register('/home', () => new HomeView())
router.register('/albums', () => new AlbumsView())
router.register('/playlists', () => new PlaylistsView())
router.register('/saved-playlists', async () => {
    const { SavedPlaylistsView } = await import('./views/SavedPlaylistsView.js')
    return new SavedPlaylistsView()
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
