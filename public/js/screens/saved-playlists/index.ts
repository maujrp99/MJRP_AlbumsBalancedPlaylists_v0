/**
 * The route of the saved playlists screen: what app.js asks for when the person opens /saved-playlists (or /playlist-series).
 * A view the router can mount (the bridge makes it one), named `saved_playlists` for the measurement of use. The controller is
 * made here, one for each time the screen is opened, as the hand-made view made its own.
 */
import { ReactView } from '../../react-bridge/ReactView'
import { SavedPlaylistsController } from '../../controllers/SavedPlaylistsController.js'
import { SavedPlaylists } from './SavedPlaylists'

export function savedPlaylistsView() {
    return new ReactView(SavedPlaylists, { controller: new SavedPlaylistsController() }, { screen: 'saved_playlists' })
}
