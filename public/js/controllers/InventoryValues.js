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
 * reads nothing from Discogs, and a screen drawn again never starts a second run. The reading of
 * an item is kept in the item (REQ-14), so what the screen shows after opening is what the last
 * run kept, on any device; the browser holds a reading six hours as the guard.
 */

import {
    BASE_CURRENCY, CURRENCIES, SourceState, itemsWithDiscogsValue, lowestValuesShown, shownCurrency, totalsOf, usdOf, valueOfItem,
    writtenValueFrom
} from '../models/inventoryValue.js'
import { itemsNeverRead, itemsToRead, readFailedText, readingsToKeep, valuesOutcome, valuesProgressText, valuesRunOutcome } from '../models/inventoryValueRun.js'
import { track } from '../services/usage/track.js'

export const CURRENCY_KEY = 'inventoryCurrency'

/** F77: one album read from its window, as the measurement says it. */
const oneReadEvent = (outcome) => (outcome.reading
    ? { scope: 'one', count: 1, outcome: 'complete' }
    : { scope: 'one', count: 0, outcome: 'failed' })

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
        this._openedFor = undefined // the person the switch was asked for
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
        const person = this.service.userId
        this._openedFor = person
        const [source, rates] = await Promise.all([this.service.sourceState({ signal }), this.service.rates({ signal })])
        // the answer belongs to who asked: if the person changed while it was on its way, it is dropped
        if (signal.aborted || person !== this._openedFor) return
        this.source = source
        this.rates = rates
        this.ratesAsked = true
        this.host.changed()
        await this.syncReadings()
    }

    /**
     * The inventory on the screen changed. When it is now of another person than the one the
     * switch was asked for (the screen opened before the sign-in was known, or the person signed
     * in or out), what was known is of nobody: it is forgotten and the switch is asked again,
     * once, for who is here. Otherwise the readings of the items that just arrived are looked up.
     */
    async inventoryChanged() {
        if (this._openedFor === undefined || this.service.userId === this._openedFor) return this.syncReadings()
        this.stop()
        this.source = null
        this.readings = new Map()
        this.progress = new Map()
        this._lookedUp = new Set()
        return this.open()
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
            waiting: this.source === SourceState.ON ? itemsNeverRead(items, this.readings).length : 0,
            discogsShown: itemsWithDiscogsValue(values) > 0,
            lowestShown: lowestValuesShown(values) > 0,
            // Discogs refuses suggestions to the account: known by the service, or seen in a value on the screen
            sellerSettingsMissing: this.source === SourceState.ON && (lowestValuesShown(values) > 0 || Boolean(this.service.sellerSettingsMissing?.())),
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
     * "Update values" and "Read them now" (REQ-15): read AGAIN from Discogs, one album after the
     * other, and replace the reading kept in the item. "Update values" reads every item with no
     * value written, except what was read less than six hours ago (the guard against asking twice
     * in a row); "Read them now" (`onlyNeverRead`) reads only the items that never had a reading.
     * A reading only the browser holds is kept in its item first, with no question to Discogs.
     * A second press while it runs does nothing.
     */
    async updateAll({ onlyNeverRead = false } = {}) {
        if (this.run.busy || this.source !== SourceState.ON) return
        const all = this.host.items()
        const toKeep = readingsToKeep(all, this.readings)
        const items = onlyNeverRead ? itemsNeverRead(all, this.readings) : itemsToRead(all, this.readings, this.now())
        if (items.length === 0) {
            if (toKeep.length > 0) await this.service.keepReadings(toKeep)
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
            if (toKeep.length > 0) await this.service.keepReadings(toKeep)
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
        track('inventory_values_read', { scope: 'all', count: count.read, outcome: valuesRunOutcome(count) })
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
        const saved = await this._save(item, value, 'Value saved')
        if (saved) track('inventory_value_written')
        return saved
    }

    /** "Use the Discogs value instead": what the person wrote is taken away; the reading shows again. */
    async forget(item) {
        const saved = await this._save(item, null, 'Your value was removed')
        if (saved) track('inventory_value_removed')
        return saved
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
        track('inventory_values_read', oneReadEvent(outcome))
        if (outcome.reading) await this.service.keepReadings([{ item, reading: outcome.reading }])
        if (outcome.off) this.source = SourceState.OFF
        this._showItem(item, outcome.failure ? { state: 'failed', failure: outcome.failure } : { reading: outcome.reading })
        if (outcome.failure) this.toast.error(readFailedText(outcome.failure))
        if (outcome.off) this.toast.info('Discogs values are turned off on the server.')
        if (!this.leaving.aborted) this.host.changed()
    }
}
