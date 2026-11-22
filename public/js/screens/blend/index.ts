/**
 * The route of the Blend screen: what app.js asks for when the person opens /blend (F83 wave 7b). A view the router can mount (the bridge makes it one),
 * named `blend` for the measurement of use. The visit (blendVisit.ts) is made here and started in `prepare`, never in an effect of the screen (the strict
 * mode runs an effect twice): it begins reading the person's series and does NOT wait for the read, so the screen draws at once and shows «loading», as
 * the hand-made screen did. Leaving drops the albums a generation waits for. The controller that generates (controllers/BlendingController.js) stays in
 * JavaScript; the screen calls it as the hand-made one did.
 */
import { ReactView } from '../../react-bridge/ReactView'
import { Blend } from './Blend'
import { BlendVisit } from './blendVisit'

export function blendView() {
    const visit = new BlendVisit()
    return new ReactView(Blend, { visit }, {
        screen: 'blend',
        // opened from a series («Blend your Albums»): /blend?seriesId=<id> comes with that series chosen (F63)
        prepare: async (params) => { visit.start(params.query?.seriesId) },
        dispose: () => visit.dispose()
    })
}
