/**
 * savedPlaylistsReading - where the read of the saved playlists is put together with its real
 * sources (the app has no Composition Root yet; this is the one place that knows which adapter
 * serves which port of SavedPlaylistsReader).
 */

import { db, auth } from '../../firebase-init.js'
import { cacheManager } from '../../cache/CacheManager.js'
import { savedPlaylistsStore } from '../../stores/savedPlaylists.js'
import { optimizedAlbumLoader } from '../OptimizedAlbumLoader.js'
import { SavedPlaylistsReader } from './SavedPlaylistsReader.js'
import { RepositoryPlaylistsSource } from './adapters/RepositoryPlaylistsSource.js'

/** The size, in pixels, of a cover on a series card. */
const COVER_SIZE = 100

const covers = {
    /** The cover of an album the series stores only as text, from the dataset the app already has. */
    find: async (artist, title) => {
        const match = await optimizedAlbumLoader.findAlbum(artist, title)
        return match ? optimizedAlbumLoader.getArtworkUrl(match, COVER_SIZE) : null
    }
}

export const savedPlaylistsReader = new SavedPlaylistsReader({
    store: savedPlaylistsStore,
    source: new RepositoryPlaylistsSource({ db, cache: cacheManager }),
    covers,
    getUserId: () => auth.currentUser?.uid || 'anonymous-user'
})

export { savedPlaylistsStore }
