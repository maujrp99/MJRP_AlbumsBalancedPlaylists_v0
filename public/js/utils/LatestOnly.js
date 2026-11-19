/**
 * LatestOnly
 *
 * "Only the latest ask of a thing counts": each ask for a key replaces the one before it, and an
 * ask can tell, when its answer arrives, whether it is still the latest. It knows nothing about
 * the project.
 */
export class LatestOnly {
    constructor() {
        this._latest = new Map() // Map<key, number>: the number of the latest ask of each key
        this._count = 0 // never starts over, so an ask forgotten by clear() is never the latest again
    }

    /**
     * A new ask for `key`.
     * @param {string} key
     * @returns {Function} () => boolean, true while this ask is still the latest for its key
     */
    start(key) {
        const ask = ++this._count
        this._latest.set(key, ask)
        return () => this._latest.get(key) === ask
    }

    /** Forget every ask: none of the ones started before is the latest any more. */
    clear() {
        this._latest = new Map()
    }
}
