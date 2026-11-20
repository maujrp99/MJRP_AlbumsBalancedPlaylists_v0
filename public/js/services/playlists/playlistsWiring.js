/**
 * playlistsWiring - where the playlists service is put together with its real sources (the app
 * has no Composition Root yet; like services/inventory/inventoryWiring.js, this is the one place
 * that knows which database, which cache and which login serve the playlists on screen).
 *
 * Exports the app's PlaylistsService. A controller or a component asks it for every edit, save
 * and read of the set on screen; none of them imports the database, the login or a repository,
 * and none imports the file that mounts the app (UAT-19: that made import cycles).
 *
 * The service is made the first time somebody asks for it, as it always was: from then on it
 * watches the playlists store (the draft kept in the browser and the undo history follow it).
 */

import { db, auth } from '../../firebase-init.js'
import { cacheManager } from '../../cache/CacheManager.js'
import { StorageService } from '../infra/StorageService.js'
import { PlaylistHistoryService } from './PlaylistHistoryService.js'
import { PlaylistsService } from '../PlaylistsService.js'

let service = null

/** @returns {PlaylistsService} the one service of the playlists on screen */
export function getPlaylistsService() {
    if (!service) {
        service = new PlaylistsService(db, cacheManager, new StorageService(), new PlaylistHistoryService(), {
            // Whose series a save and a read go to: the person signed in when it is asked
            signedInUserId: () => auth.currentUser?.uid || 'anonymous-user'
        })
        service.watchStore()
    }
    return service
}
