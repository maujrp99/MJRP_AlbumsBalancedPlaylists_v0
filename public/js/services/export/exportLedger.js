/**
 * exportLedger
 *
 * What this session already sent to a music service (F62), so that exporting again does not
 * create a second copy: for each playlist sent, the id the service gave it.
 *
 * A playlist is the same one when it goes to the same service, under the same name, with the same
 * tracks in the same order. Change any of the three and it is another playlist, and it is created.
 *
 * The ledger lives in memory: it answers for this session (until the page is reloaded), which is
 * where the second click happens. It is not a copy of the person's library: a playlist deleted in
 * the service during the session is not created again by a second export.
 */

const SEPARATOR = '\u0000'

class ExportLedger {
    constructor() {
        this.entries = new Map()
    }

    /**
     * @param {string} service - 'spotify' | 'apple'
     * @param {string} name - the name the playlist has in the service
     * @param {string[]} trackRefs - the ids of its tracks in the service, in order
     * @returns {string}
     */
    keyOf(service, name, trackRefs) {
        return [service, name, ...trackRefs].join(SEPARATOR)
    }

    /** @returns {Object|null} what was recorded for that playlist */
    get(key) {
        return this.entries.get(key) || null
    }

    /** Record (or replace) what is known of a playlist sent. */
    set(key, entry) {
        this.entries.set(key, { ...entry })
        return this.get(key)
    }

    clear() {
        this.entries.clear()
    }
}

export const exportLedger = new ExportLedger()
