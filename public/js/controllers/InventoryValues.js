/**
 * InventoryValues - the part of the inventory controller that knows what the albums are worth
 * (F75, S-57). It holds what the screen needs of the values (the switch, the rates, the readings
 * the browser keeps, the run of "Update values") and asks the value service for everything that
 * leaves the app. The rules are the models' (models/inventoryValue.js, inventoryValueRun.js).
 *
 * The host is the InventoryController: it gives the items, is told when the values changed, and
 * draws. Nothing here touches the page.
 *
 * A run starts ONLY when the person asks ("Update values", "Read them now"): opening the screen
 * reads nothing from Discogs, and a screen drawn again never starts a second run.
 */

import {
    BASE_CURRENCY, CURRENCIES, SourceState, itemsWithDiscogsValue, shownCurrency, totalsOf, usdOf, valueOfItem,
    writtenValueFrom
} from '../models/inventoryValue.js'
import { itemsToRead, readFailedText, valuesOutcome, valuesProgressText } from '../models/inventoryValueRun.js'

export const CURRENCY_KEY = 'inventoryCurrency'

/** The button "Update values" at rest. */
const VALUES_IDLE = Object.freeze({ busy: false, text: null, count: null })

export class InventoryValues {
    /**
     * @param {Object} deps
     * @param {Object} deps.service - services/inventory/InventoryValueService.js
     * @param {Object} deps.inventory - the InventoryService: { updateAlbum }
     * @param {Object} deps.toast - { success, error, info }
     * @param {Object} deps.host - { items(): Array, changed(), drawRun(), drawItem(id) }
     * @param {AbortSignal} deps.leaving - aborted when the screen is left
     * @param {Function} [deps.now] - () => ms
     */
    constructor({ service, inventory, toast, host, leaving, now = () => Date.now() }) {
        this.service = service
        this.inventory = inventory
        this.toast = toast
        this.host = host
        this.leaving = leaving
        this.now = now

        this.source = null // 'on' | 'off'; null while the server was not asked yet
        this.rates = null // { rates, date }; null when they did not come
        this.ratesAsked = false
        this.readings = new Map() // item id -> the reading the browser keeps
        this._lookedUp = new Set() // the ids of the items whose reading was already asked to the browser
        this.progress = new Map() // item id -> { state: 'reading' | 'failed', failure }
        this.run = VALUES_IDLE
        this.chosenCurrency = BASE_CURRENCY
        this._stop = null // the AbortController of the run under way
    }

    /** The currency the person chose before, from where the inventory always kept it. */
    loadSettings(storage) {
        const saved = storage.getItem(CURRENCY_KEY)
        if (CURRENCIES.includes(saved)) this.chosenCurrency = saved
    }

    /**
     * The screen opened: ask the switch and the rates, once, and read what the browser keeps.
     * Nothing is asked to Discogs here.
     */
    async open() {
        const signal = this.leaving
        const [source, rates] = await Promise.all([this.service.sourceState({ signal }), this.service.rates({ signal })])
        if (signal.aborted) return
        this.source = source
        this.rates = rates
        this.ratesAsked = true
        this.host.changed()
        await this.syncReadings()
    }

    /**
     * The readings the browser keeps for the items that were not looked up yet (the inventory may
     * arrive after the screen opened). The screen is told only when one was found.
     */
    async syncReadings() {
        if (this.source !== SourceState.ON) return
        const fresh = this.host.items().filter(item => !this._lookedUp.has(item.id))
        if (fresh.length === 0) return
        fresh.forEach(item => this._lookedUp.add(item.id))
        const kept = await this.service.readingsOf(fresh)
        if (kept.size === 0 || this.leaving.aborted) return
        kept.forEach((reading, id) => { if (!this.readings.has(id)) this.readings.set(id, reading) })
        this.host.changed()
    }

    // ---- What the screen is given -------------------------------------------------------------------

    /** The value of one item, as of now. */
    valueOf(item) {
        return valueOfItem(item, {
            reading: this.readings.get(item.id) ?? null,
            now: this.now(),
            source: this.source,
            progress: this.progress.get(item.id) ?? null
        })
    }

    /** How money is written on the screen: the currency shown and the rates of the day. */
    money() {
        const rates = this.rates?.rates ?? null
        return {
            chosen: this.chosenCurrency,
            currency: shownCurrency(this.chosenCurrency, rates),
            rates,
            ratesMissing: this.ratesAsked && !rates
        }
    }

    /**
     * Everything the screen draws of the values, for these items.
     * @param {Array<Object>} items - every item of the inventory
     * @param {Array<Object>} counted - the items the totals are made of (what the search and the format let through)
     */
    view(items, counted) {
        const values = new Map(items.map(item => [item.id, this.valueOf(item)]))
        const money = this.money()
        const valueFor = (item) => values.get(item.id)
        return {
            source: this.source,
            values,
            money,
            totals: totalsOf(counted, valueFor, money.rates),
            waiting: this.source === SourceState.ON ? itemsToRead(items, this.readings, this.now()).length : 0,
            discogsShown: itemsWithDiscogsValue(values) > 0,
            run: this.run,
            usdOf: (item) => usdOf(valueFor(item), money.rates)
        }
    }

    // ---- What the person does -----------------------------------------------------------------------

    chooseCurrency(code, storage) {
        if (!CURRENCIES.includes(code)) return
        this.chosenCurrency = code
        storage.setItem(CURRENCY_KEY, code)
        this.host.changed()
    }

    /**
     * "Update values" and "Read them now": read every item with no value written and no fresh
     * reading, one after the other. A second press while it runs does nothing.
     */
    async updateAll() {
        if (this.run.busy || this.source !== SourceState.ON) return
        const items = itemsToRead(this.host.items(), this.readings, this.now())
        if (items.length === 0) {
            this.toast.info('Every album already has a value written by you or read in the last six hours.')
            return
        }
        this._stop = new AbortController()
        const drop = () => this._stop?.abort()
        this.leaving.addEventListener('abort', drop, { once: true })
        this.progress.clear()
        this._showRun({ done: 0, total: items.length })
        let count
        try {
            count = await this.service.readMany(items, {
                signal: this._stop.signal,
                onProgress: (step) => this._showRun(step),
                onItem: (item, told) => this._showItem(item, told)
            })
        } finally {
            this.leaving.removeEventListener('abort', drop)
            this._stop = null
            this.run = VALUES_IDLE
        }
        this._endRun(count)
    }

    /** "Stop": the run ends after the album it is reading. */
    stop() {
        this._stop?.abort()
    }

    _showRun(count) {
        this.run = { busy: true, text: valuesProgressText(count), count }
        this.host.drawRun()
    }

    /** One album of the run changed: it is being read, it was read, it failed, or it was left as it was. */
    _showItem(item, told) {
        if (told?.reading) this.readings.set(item.id, told.reading)
        if (told?.state) this.progress.set(item.id, told)
        else this.progress.delete(item.id)
        this.host.drawItem(item.id)
    }

    _endRun(count) {
        if (this.leaving.aborted) return
        if (count.stopped === 'off') this.source = SourceState.OFF
        const outcome = valuesOutcome(count)
        if (outcome.ok) this.toast.success(outcome.text)
        else this.toast.error(outcome.text)
        this.host.changed()
    }

    /**
     * The person wrote the value of an album: kept in the item, in USD. A reading never replaces it.
     * @returns {Promise<boolean>} whether it was saved
     */
    async write(item, text) {
        const value = writtenValueFrom(text, this.money(), new Date(this.now()).toISOString())
        if (!value) {
            this.toast.error('Write the value as a number above zero, for example 12.50.')
            return false
        }
        return this._save(item, value, 'Value saved')
    }

    /** "Use the Discogs value instead": what the person wrote is taken away; the reading shows again. */
    async forget(item) {
        return this._save(item, null, 'Your value was removed')
    }

    async _save(item, value, done) {
        try {
            await this.inventory.updateAlbum(item.id, { value })
        } catch (error) {
            console.error('[InventoryValues] The value could not be saved:', error)
            this.toast.error('The value could not be saved. Your inventory is as it was.')
            return false
        }
        this.toast.success(done)
        return true
    }

    /**
     * "Read the value now", "Read again", "Look again": one album, asked for now, whatever the
     * browser keeps. Says what failed when it fails.
     */
    async readOne(item) {
        if (this.source !== SourceState.ON || this.run.busy) return
        this._showItem(item, { state: 'reading' })
        const outcome = await this.service.readItem(item, { signal: this.leaving })
        if (outcome.reading) await this.service.keepEditions([{ item, reading: outcome.reading }])
        if (outcome.off) this.source = SourceState.OFF
        this._showItem(item, outcome.failure ? { state: 'failed', failure: outcome.failure } : { reading: outcome.reading })
        if (outcome.failure) this.toast.error(readFailedText(outcome.failure))
        if (outcome.off) this.toast.info('Discogs values are turned off on the server.')
        if (!this.leaving.aborted) this.host.changed()
    }
}
