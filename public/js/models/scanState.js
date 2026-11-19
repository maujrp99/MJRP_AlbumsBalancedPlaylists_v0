/**
 * scanState
 *
 * The rules of the state of an artist scan, as pure functions (F67). A scan has exactly one state
 * at any time, held by one owner (`components/album-picker/AlbumPickerController.js`, the one
 * album picker of the Home and of the series edit - F57) and drawn through the picker's view port.
 * Every answer carries the generation of the scan that asked: an answer of an older scan, or one
 * that comes after its scan already ended, changes nothing.
 */

/** How long the catalog may take to answer a scan (artist lookup and all the pages of albums). */
export const CATALOG_DEADLINE_MS = 15000
export const CATALOG_DEADLINE_SECONDS = CATALOG_DEADLINE_MS / 1000

/** Where the scan is. */
export const ScanStatus = Object.freeze({
    IDLE: 'idle',           // nothing asked yet
    SCANNING: 'scanning',   // the catalog is being asked
    RESULTS: 'results',     // albums on screen; the AI list may still be on its way (`classifying`)
    EMPTY: 'empty',         // the catalog answered: no album for this text
    FAILED: 'failed'        // the catalog did not answer, or answered with a failure - see `failure`
})

/** Why a scan failed. "Failed" is never the same as "no results". */
export const ScanFailure = Object.freeze({
    TIMEOUT: 'timeout',
    ERROR: 'error'
})

/** @returns {Object} the state before any scan */
export function idleScan() {
    return { status: ScanStatus.IDLE, generation: 0, query: '', artist: null, albums: [], classifying: false, failure: null }
}

/** True when a scan of this text may start: there is text and no scan is running. */
export function canStartScan(state, query) {
    return state.status !== ScanStatus.SCANNING && String(query || '').trim().length > 0
}

/** A new scan: a new generation. While one is running, or with no text, nothing changes. */
export function startScan(state, query) {
    if (!canStartScan(state, query)) return state
    return { ...idleScan(), status: ScanStatus.SCANNING, generation: state.generation + 1, query: String(query).trim() }
}

/** True when the answer belongs to the scan that is still waiting for it. */
function isAwaited(state, generation) {
    return state.generation === generation && state.status === ScanStatus.SCANNING
}

/**
 * The catalog answered.
 * @param {Object} state
 * @param {number} generation - of the scan that asked
 * @param {{ albums: Array, classifying?: boolean }} answer - `classifying`: the AI list is still to come
 */
export function scanFound(state, generation, { albums = [], classifying = false } = {}) {
    if (!isAwaited(state, generation)) return state
    if (albums.length === 0) return { ...state, status: ScanStatus.EMPTY }
    return { ...state, status: ScanStatus.RESULTS, albums, artist: albums[0].artist || state.query, classifying }
}

/** The catalog answered that it has no album for this text. */
export function scanEmpty(state, generation) {
    if (!isAwaited(state, generation)) return state
    return { ...state, status: ScanStatus.EMPTY }
}

/** The catalog did not answer in time, or failed. */
export function scanFailed(state, generation, failure = ScanFailure.ERROR) {
    if (!isAwaited(state, generation)) return state
    return { ...state, status: ScanStatus.FAILED, failure }
}

/**
 * The AI list arrived (or will not arrive) for the albums on screen.
 * @param {Array|null} albums - the albums classified again, or null to keep the ones shown
 */
export function scanReclassified(state, generation, albums) {
    const awaited = state.generation === generation && state.status === ScanStatus.RESULTS && state.classifying
    if (!awaited) return state
    return { ...state, classifying: false, albums: albums && albums.length > 0 ? albums : state.albums }
}

const FAILURE_TITLES = Object.freeze({
    [ScanFailure.TIMEOUT]: `The catalog did not answer in ${CATALOG_DEADLINE_SECONDS} seconds.`,
    [ScanFailure.ERROR]: 'The search could not be completed.'
})

/** The message of the panel in each state that has one; results have none (the albums are the panel). */
const PANELS = Object.freeze({
    [ScanStatus.IDLE]: () => ({ kind: 'idle', title: 'Search for an artist to begin scanning.', detail: '', retry: false }),
    [ScanStatus.SCANNING]: (state) => ({ kind: 'scanning', title: `Searching the catalog for «${state.query}»…`, detail: 'The albums appear as soon as the catalog answers.', retry: false }),
    [ScanStatus.RESULTS]: () => null,
    [ScanStatus.EMPTY]: (state) => ({ kind: 'empty', title: `No albums found for «${state.query}».`, detail: 'Check the spelling or try another name.', retry: false }),
    [ScanStatus.FAILED]: (state) => ({ kind: 'failed', title: FAILURE_TITLES[state.failure] || FAILURE_TITLES[ScanFailure.ERROR], detail: 'Nothing was changed. You can ask again.', retry: true })
})

const STATUS_LINES = Object.freeze({
    [ScanStatus.IDLE]: () => '',
    [ScanStatus.SCANNING]: () => 'Scanning…',
    [ScanStatus.RESULTS]: (state) => `→ ${state.artist}${state.classifying ? ' · confirming album types…' : ''}`,
    [ScanStatus.EMPTY]: () => '→ Not found',
    [ScanStatus.FAILED]: () => '→ Search failed'
})

/**
 * What the screen shows for a state: the one place the texts of the scan live.
 * @returns {{ busy: boolean, buttonLabel: string, statusLine: string, panel: Object|null }}
 */
export function describeScan(state) {
    const busy = state.status === ScanStatus.SCANNING
    return {
        busy,
        buttonLabel: busy ? 'Scanning…' : 'Scan',
        statusLine: STATUS_LINES[state.status](state),
        panel: PANELS[state.status](state)
    }
}
