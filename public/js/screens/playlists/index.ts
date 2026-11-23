/**
 * The route of the playlists screen: what app.js asks for when the person opens /playlists or /playlists/edit. A view the router can
 * mount (the bridge makes it one), named `playlists` for the measurement of use. The controller is made here, one for each time the
 * screen is opened, as the hand-made view made its own; the router waits for `initialize` (what decides what the screen shows: the
 * set kept from the blend, a saved batch read for editing, a draft restored) before the screen is drawn, as it waited for the old `render`.
 * The controller is let go of once, when the screen is left.
 */
import { ReactView } from '../../react-bridge/ReactView'
import { PlaylistsController } from '../../controllers/PlaylistsController.js'
import { forgetWhatWasChanged } from './regenerateMemory'
import { GeneratingFlag, Playlists } from './Playlists'

export function playlistsView() {
    const generating = new GeneratingFlag()
    const controller = new PlaylistsController(generating)
    return new ReactView(Playlists, { controller, generating }, {
        screen: 'playlists',
        prepare: (params) => {
            forgetWhatWasChanged() // the panel opens on the recipe of the playlists of this screen
            return controller.initialize(params)
        },
        dispose: () => controller.destroy()
    })
}
