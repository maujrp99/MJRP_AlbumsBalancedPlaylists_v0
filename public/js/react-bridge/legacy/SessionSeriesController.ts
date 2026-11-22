/**
 * The controller of the albums screen (controllers/SeriesController.js, hand-written, one for the whole visit: the load goes on in the
 * service after the screen is left and the next visit shows the progress it made). TEMPORARY, listed in bridgesOnlyShrink: it goes when
 * the controller is rewritten in TypeScript (wave 8). It is made on the first ask.
 */
import SeriesController from '../../controllers/SeriesController.js'

let made: object | null = null

export function sessionSeriesController(): object {
    made ??= new SeriesController()
    return made
}
