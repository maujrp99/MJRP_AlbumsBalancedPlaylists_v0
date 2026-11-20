/**
 * InventoryValueService - reads what the albums of the inventory are worth (F75, S-57).
 *
 * It asks the app's own server (api/valueApi.js), never Discogs: the token of the account lives
 * on the server. What it is given (`api`, `cache`, `inventory`) is a port; this file imports no
 * Firestore, no cache and no screen. services/inventory/inventoryValueWiring.js puts it together.
 *
 * Where a Discogs reading lives: ONLY in the browser cache, one record per item of a person, for
 * six hours (READING_TTL_MS). It is never written to the cloud: the terms of the Discogs API do
 * not let a price be kept longer than needed nor shown when older than six hours. What IS written
 * to the item is which edition was used (`discogs`: catalogue data), so the next read asks one
 * question to Discogs and not three.
 *
 * "Update values" (`readMany`) asks one album after the other. A failure of one album does not
 * stop the run; "wait" is waited (a few times, a few minutes at most); a failure every album
 * would repeat stops it. The caller's signal drops the run where it is.
 */

import { SIX_HOURS_MS, SourceState, isFresh } from '../../models/inventoryValue.js'
import {
    WAITS_PER_ALBUM, askOfItem, countAfter, editionOf, editionToKeep, emptyCount, readOutcomeOf
} from '../../models/inventoryValueRun.js'

/**
 * v2 (2026-11-20): the readings of the first run in production were wrong («No CD edition found»
 * for editions whose price page Discogs refused); under a new key they are never read back.
 */
export const READING_PREFIX = 'inventoryvalue:v2:'
export const READING_TTL_MS = SIX_HOURS_MS
export const RATES_KEY = 'exchangerates:v1'
const DAY_MS = 24 * 60 * 60 * 1000
/** The editions found during a run are written to the items in parts of this size. */
export const EDITION_WRITE_SIZE = 25

const DROPPED = 'dropped'
const FOUND = 'found'
const dayOf = (ms) => new Date(ms).toISOString().slice(0, 10)
const isAborted = (signal) => Boolean(signal && signal.aborted)

/** Wait `ms`, or less when the signal is aborted. @returns {Promise<boolean>} false when it was dropped */
const realSleep = (ms, signal) => new Promise(resolve => {
    if (signal?.aborted) return resolve(false)
    const done = () => { clearTimeout(timer); resolve(false) }
    const timer = setTimeout(() => { signal?.removeEventListener('abort', done); resolve(true) }, ms)
    signal?.addEventListener('abort', done, { once: true })
})

/** The rates of an answer of the server, or null (and a line in the console) when they did not come. */
function ratesOf(result) {
    const given = result.kind === FOUND && result.data ? result.data.rates : null
    if (given) return { rates: given, date: result.data.date || null }
    console.warn('[InventoryValueService] the exchange rates did not come:', result.code || result.kind)
    return null
}

const nothing = () => { }

export class InventoryValueService {
    /**
     * @param {Object} deps
     * @param {Object} deps.api - api/valueApi.js: { albumValue, valueSources, exchangeRates }
     * @param {Object} deps.cache - the browser cache: { get, set, invalidate }
     * @param {{ userId: string, setEditions: Function }} deps.inventory - the InventoryService
     * @param {Function} [deps.mayAsk] - () => boolean: a guest is never asked for (the route refuses guests)
     * @param {Function} [deps.now] - () => ms
     * @param {Function} [deps.sleep] - (ms, signal) => Promise<boolean>
     */
    constructor({ api, cache, inventory, mayAsk = () => true, now = () => Date.now(), sleep = realSleep }) {
        this.api = api
        this.cache = cache
        this.inventory = inventory
        this.mayAsk = mayAsk
        this.now = now
        this.sleep = sleep
        // Until when the suggestions are known to be refused for the seller settings (ms). In the
        // memory of this page only: a reload, a new run or six hours make them be tried again.
        this._lowestOnlyUntil = 0
    }

    /** Discogs refused the price suggestions to the account (no seller settings), as far as this page knows. */
    sellerSettingsMissing() {
        return this.now() < this._lowestOnlyUntil
    }

    /**
     * The switch of the Discogs values, asked to the server now. Anything but a clear "on" is off:
     * a guest, a server that does not know the route, a call with no answer.
     * @returns {Promise<'on'|'off'>}
     */
    async sourceState({ signal = null } = {}) {
        if (!this.mayAsk()) return SourceState.OFF
        const result = await this.api.valueSources({ signal })
        if (result.kind !== FOUND) console.warn('[InventoryValueService] the switch of the values could not be read:', result.code || result.kind)
        return result.kind === FOUND && result.data?.discogs === SourceState.ON ? SourceState.ON : SourceState.OFF
    }

    /**
     * The rates of the day from USD, kept in the browser for the day.
     * @returns {Promise<{ rates: Object, date: string|null }|null>} null when they did not come
     */
    async rates({ signal = null } = {}) {
        const today = dayOf(this.now())
        const kept = await this.cache.get(RATES_KEY)
        if (kept && kept.day === today) return kept.data

        const data = ratesOf(await this.api.exchangeRates({ signal }))
        if (data) await this.cache.set(RATES_KEY, { day: today, data }, DAY_MS)
        return data
    }

    /** The person whose inventory this is, as the InventoryService knows it now. */
    get userId() {
        return this.inventory.userId
    }

    _key(item) {
        return `${READING_PREFIX}${this.userId}:${item.id}`
    }

    /**
     * The readings the browser still keeps for these items, the fresh ones only.
     * @param {Array<Object>} items
     * @returns {Promise<Map<string, Object>>} item id -> reading
     */
    async readingsOf(items) {
        const now = this.now()
        const kept = await Promise.all(items.map(async item => [item.id, await this.cache.get(this._key(item))]))
        return new Map(kept.filter(([, reading]) => reading && isFresh(reading, now)))
    }

    /**
     * Read the value of one album now, and keep the reading in the browser for six hours.
     * @param {Object} item - an inventory item
     * @param {{ signal?: AbortSignal }} [options]
     * @returns {Promise<Object>} { reading } | { off: true } | { dropped: true } | { failure, waitMs, stops }
     */
    async readItem(item, { signal = null } = {}) {
        const result = await this.api.albumValue(askOfItem(item, { lowestOnly: this.sellerSettingsMissing() }), { signal })
        if (result.code === DROPPED) return { dropped: true }
        const outcome = readOutcomeOf(result, new Date(this.now()).toISOString())
        if (outcome.sellerSettingsMissing) this._lowestOnlyUntil = this.now() + READING_TTL_MS
        if (!outcome.reading) return outcome
        const reading = { ...outcome.reading, release: editionOf(item, outcome.reading.release) }
        await this.cache.set(this._key(item), reading, READING_TTL_MS)
        return { reading }
    }

    /**
     * Keep in the items which edition each reading was of. A write that fails loses nothing the
     * person sees: the next read looks for the edition again.
     * @param {Array<{ item: Object, reading: Object }>} read
     */
    async keepEditions(read) {
        const entries = read
            .map(({ item, reading }) => ({ id: item.id, discogs: editionToKeep(item, reading) }))
            .filter(entry => entry.discogs)
        if (entries.length === 0) return
        try {
            await this.inventory.setEditions(entries)
        } catch (error) {
            console.error('[InventoryValueService] The editions could not be kept in the items; they will be looked for again:', error)
        }
    }

    /** One album, asked again after each "wait" the server allows. */
    async _readWithWaits(item, signal) {
        for (let waits = 0; ; waits++) {
            const outcome = await this.readItem(item, { signal })
            const mayWait = typeof outcome.waitMs === 'number' && !outcome.stops && waits < WAITS_PER_ALBUM
            if (!mayWait) return outcome
            if (!await this.sleep(outcome.waitMs, signal)) return { dropped: true }
        }
    }

    /**
     * "Update values": read these items, one after the other.
     * @param {Array<Object>} items - the items to read, in order
     * @param {Object} [options]
     * @param {AbortSignal} [options.signal] - aborted when the person stops the run or leaves the screen
     * @param {Function} [options.onProgress] - (count) after each album
     * @param {Function} [options.onItem] - (item, { state: 'reading' } | { reading } | { state: 'failed', failure } | null)
     * @returns {Promise<Object>} the count of models/inventoryValueRun.js, with `stopped` and `aborted`
     */
    async readMany(items, options = {}) {
        const told = { signal: null, onProgress: nothing, onItem: nothing, ...options }
        const run = { count: emptyCount(items.length), read: [], halted: false }
        // each run tries the suggestion once, on its first album: when the seller settings get
        // filled in, the three conditions come back; when they are still refused, the rest of the
        // run asks for the lowest price only
        this._lowestOnlyUntil = 0
        told.onProgress(run.count)

        for (const item of items) {
            if (run.halted || isAborted(told.signal)) break
            await this._readNext(item, run, told)
        }

        await this.keepEditions(run.read)
        return { ...run.count, aborted: run.count.aborted || isAborted(told.signal) }
    }

    /** One album of a run: read it, count it, tell the caller; `run.halted` when the run ends here. */
    async _readNext(item, run, { signal, onProgress, onItem }) {
        onItem(item, { state: 'reading' })
        const outcome = await this._readWithWaits(item, signal)
        const halt = this._haltOf(outcome)
        if (halt) {
            onItem(item, null)
            run.count = { ...run.count, ...halt }
            run.halted = true
            return
        }
        run.count = countAfter(run.count, outcome)
        if (outcome.reading) run.read.push({ item, reading: outcome.reading })
        onItem(item, outcome.reading ? { reading: outcome.reading } : { state: 'failed', failure: outcome.failure })
        onProgress(run.count)
        if (outcome.stops) {
            run.count = { ...run.count, stopped: outcome.failure }
            run.halted = true
        }
        if (run.read.length >= EDITION_WRITE_SIZE) await this.keepEditions(run.read.splice(0))
    }

    /** An answer that ends the run without counting the album: the run was dropped, or the source was turned off. */
    _haltOf(outcome) {
        if (outcome.dropped) return { aborted: true }
        return outcome.off ? { stopped: 'off' } : null
    }
}
