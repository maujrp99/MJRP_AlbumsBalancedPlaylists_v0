/**
 * The states of the inventory screen (/inventory) that F83 wave 6a checks, written once so the screen as it was (hand-made: InventoryView
 * and its renderers) and the screen as it is (React) are asked the same thing: the same inventory in the store, the same answers of
 * the world outside (test/support/inventoryStandIns.js), the same clicks, keys, selections and letters, and what stands in `#app` (and in
 * the sheet the phone opens over the page) after each step, together with where the focus is and every call the screen made to what
 * is outside it (the service, the value service, the question dialog, the toast, the two hand-made windows).
 *
 * `normalize` is the one of wave 2 (elements with sorted attributes, text with runs of white space collapsed) with one change: the
 * no-break space the dates are written with («20 Nov») is kept visible, not collapsed. The clock is fixed and the zone is the one of
 * the command (`TZ=America/Sao_Paulo`), because «20 Nov» and the hour of a reading are written in local time.
 *
 * Used by: reports/evidence/F83/wave-6a/capture-before.test.js (run once, on the hand-made screen, before it was deleted; it wrote
 * test/fixtures/inventoryBeforeF83.json) and test/screens/inventory/Inventory.sameAsBefore.test.tsx (the React screen, against that file).
 */
import { vi } from 'vitest'
import { inventoryStore } from '../../public/js/stores/inventory.js'
import { discogsNoticeStore } from '../../public/js/stores/discogsNotice.js'
import { valuesWith, valuesOff, reading, RATES } from '../helpers/inventoryValuesStub.js'
import { ITEMS, held, manyItems, outside, world } from './inventoryStandIns.js'

export { outside, held, world }

// ---------------------------------------------------------------------------------------------- what the page says

const valueOf = (element, name, value) => {
    if (name === 'style') return element.style.cssText
    if (name === 'class') return value.split(/\s+/).filter(Boolean).sort().join(' ')
    return value
}
const attributesOf = (element) => [...element.attributes].map(({ name, value }) => [name, valueOf(element, name, value)])
    .sort(([a], [b]) => a.localeCompare(b)).map(([name, value]) => ` ${name}="${value}"`).join('')
const fingerprint = (text) => {
    let hash = 2166136261
    for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619)
    return (hash >>> 0).toString(36)
}
function describe(node) {
    if (node.nodeType === 3) return node.textContent.replace(/ /g, '⍽').replace(/\s+/g, ' ')
    if (node.nodeType !== 1) return ''
    const tag = node.tagName.toLowerCase()
    const inner = [...node.childNodes].map(describe).join('')
    const whole = `<${tag}${attributesOf(node)}>${inner}</${tag}>`
    return tag === 'svg' ? `<svg class="${node.getAttribute('class')}" shape="${fingerprint(whole)}"/>` : whole
}

/** A piece of the page as the proof compares it: a field as it holds its text now, a list as the option it has chosen. */
export function normalize(element) {
    if (!element) return null
    const copy = element.cloneNode(true)
    const typed = element.querySelectorAll('input')
    copy.querySelectorAll('input').forEach((input, i) => input.setAttribute('value', typed[i].value))
    const chosen = element.querySelectorAll('select')
    copy.querySelectorAll('select').forEach((select, i) => { select.setAttribute('data-value', chosen[i].value) })
    copy.querySelectorAll('[data-legacy-host]').forEach(host => host.replaceWith(...host.childNodes))
    copy.querySelectorAll('option').forEach(option => { option.removeAttribute('selected'); option.textContent = option.textContent.trim() })
    copy.normalize()
    return describe(copy).replace(/>\s+</g, '><').replace(/sheetTitle\d+/g, 'sheetTitle#').trim()
}

/** `#app`, and under it the sheet of the phone when one is open. */
const pageOf = () => [normalize(document.getElementById('app')), ...[...document.querySelectorAll('.sheet:not(.sheet--closing)')].map(sheet => `SHEET ${normalize(sheet)}`)].join('\n')

/** Where the focus is, as words. */
export const focusOf = () => {
    const active = document.activeElement
    if (!active || active === document.body) return 'the page'
    const mark = active.id ? `#${active.id}` : `.${[...active.classList].join('.')}`
    const which = active.dataset?.albumId ? `[album=${active.dataset.albumId}]` : active.dataset?.id ? `[id=${active.dataset.id}]` : ''
    return `${active.tagName.toLowerCase()}${mark}${which}${active.type === 'search' ? `[caret=${active.selectionStart}]` : ''}`
}

/** The window of the phone as the screen reads it, and a way to turn it into a computer and back. */
export function asPhone(phone) {
    const listeners = []
    const media = {
        matches: phone,
        addEventListener: (_type, listener) => listeners.push(listener),
        removeEventListener: (_type, listener) => { const i = listeners.indexOf(listener); if (i >= 0) listeners.splice(i, 1) }
    }
    window.scrollTo = vi.fn((...args) => { outside.push(['scrollTo', JSON.stringify(args)]) })
    Element.prototype.scrollIntoView = vi.fn(function scrollIntoView() { outside.push(['scrollIntoView', this.className || this.id]) })
    window.matchMedia = vi.fn(() => media)
    return { turn: (to) => { media.matches = to; [...listeners].forEach(listener => listener({ matches: to })) } }
}

// ---------------------------------------------------------------------------------------------- the world

export const NOW = '2026-11-20T15:30:00.000Z'
const RELEASE = { id: 249504, title: 'RCA 1987, UK', url: 'https://www.discogs.com/release/249504' }
const suggested = (extra = {}) => reading({ readAt: '2026-11-18T10:00:00.000Z', ...extra })
const lowest = () => ({ kind: 'found', basis: 'lowest_for_sale', release: RELEASE, conditions: null, currency: 'USD', lowest: { value: 12.93, currency: 'USD' }, forSale: 37, readAt: '2026-11-19T10:00:00.000Z' })

/** The Discogs values on, with a reading of each kind. */
const ON = (extra = {}) => valuesWith({ readings: new Map([['owned', suggested()], ['wanted', lowest()]]), ...extra })

/** A run of «Update values» that reads one album, fails another and waits for the scenario. */
const aRun = (gate) => async (items, { onProgress, onItem, signal }) => {
    onProgress({ done: 0, total: items.length })
    onItem(items[0], { state: 'reading' })
    signal.addEventListener('abort', () => gate.release())
    await gate.promise
    if (signal.aborted) return { total: items.length, done: 0, read: 0, noEdition: 0, noSuggestion: 0, failed: {}, stopped: null, aborted: true }
    onItem(items[0], { reading: suggested({ mint: 20, nearMint: 16, veryGoodPlus: 12, readAt: NOW }) })
    onProgress({ done: 1, total: items.length })
    onItem(items[1], { state: 'failed', failure: 'other' })
    return { total: items.length, done: items.length, read: 1, noEdition: 0, noSuggestion: 0, failed: { other: 1 }, stopped: null, aborted: false }
}

/** Everything a scenario starts from; `scenario.items`, `values`, `storage` and `phone` say what differs. */
export function prepare(scenario) {
    world.reset()
    localStorage.clear()
    inventoryStore.reset()
    discogsNoticeStore.setOn(false)
    outside.length = 0
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(NOW))
    Object.entries(scenario.storage || {}).forEach(([key, value]) => localStorage.setItem(key, value))
    inventoryStore.setAlbums(scenario.items ? scenario.items() : ITEMS())
    world.values = scenario.values ? scenario.values() : valuesOff()
    return asPhone(Boolean(scenario.phone))
}

export const keyOf = (scenario) => `${scenario.phone ? 'phone' : 'computer'} · ${scenario.name}`

// ---------------------------------------------------------------------------------------------- the harness

const tick = () => new Promise(resolve => setImmediate(resolve))

/**
 * What a scenario is given. `session` is the way the screen is opened and left (hand-made or React), `act` lets React finish what a
 * change set going (the hand-made screen needs nothing).
 */
export function harness({ session, act, phone, snaps }) {
    const settleAfter = async (change) => { await act(async () => { await change(); for (let i = 0; i < 4; i++) await tick() }) }
    const at = (selector, index = 0) => {
        const found = document.querySelectorAll(selector)[index]
        if (!found) throw new Error(`nothing matches ${selector}[${index}]`)
        return found
    }
    const writeValue = (field, value) => {
        Object.getOwnPropertyDescriptor(field.constructor.prototype, 'value').set.call(field, value)
    }
    const h = {
        controller: () => session.controller(),
        snap: (label, selector) => { snaps[label] = selector ? normalize(document.querySelector(selector)) : pageOf() },
        focus: (label) => { snaps[`focus · ${label}`] = focusOf() },
        note: (label) => { snaps[`calls · ${label}`] = JSON.stringify(outside.splice(0)) },
        has: (selector) => document.querySelectorAll(selector).length,
        settle: async (ms) => {
            await settleAfter(async () => { await session.controller().valuesOpened; if (ms) await new Promise(resolve => setTimeout(resolve, ms)) })
        },
        click: (selector, index = 0) => settleAfter(() => { const node = at(selector, index); node.focus(); node.click() }),
        /** a click on a node of the card that is not a control (the cover, the row): the way a person points at it */
        clickText: (selector, index = 0) => settleAfter(() => { at(selector, index).click() }),
        type: (selector, value) => settleAfter(() => {
            const field = at(selector)
            field.focus()
            writeValue(field, value)
            field.setSelectionRange?.(value.length, value.length)
            field.dispatchEvent(new Event('input', { bubbles: true }))
        }),
        select: (selector, value, index = 0) => settleAfter(() => {
            const field = at(selector, index)
            field.focus()
            writeValue(field, value)
            field.dispatchEvent(new Event('change', { bubbles: true }))
        }),
        run: (change) => settleAfter(() => change(session.controller())),
        /** the inventory changes under the screen (the service wrote the store) */
        store: (change) => settleAfter(() => change(inventoryStore)),
        turn: (to) => settleAfter(() => phone.turn(to)),
        leave: () => settleAfter(() => session.leave()),
        enter: () => settleAfter(async () => { await session.enter(); await session.controller().valuesOpened }),
        /** a window the screen opened asks something of it (the album window's host) */
        fromWindow: (name, ...args) => settleAfter(() => world.viewWindow.value[name](...args)),
        saveEdit: (updates) => settleAfter(() => world.editWindow.onSave(world.editWindow.album.id, updates)),
        notice: () => { snaps['the Discogs notice in the footer'] = String(discogsNoticeStore.isOn()) },
        set: world
    }
    return h
}

// ---------------------------------------------------------------------------------------------- the scenarios

const SORTS = ['artist', 'artist_desc', 'averageRating', 'averageRating_asc', 'averagePopularity', 'averagePopularity_asc', 'value', 'value_asc', 'addedToInventory', 'addedToInventory_asc']
const LIST = { mjrp_inventory_view_mode: 'list' }
const GALLERY = { mjrp_inventory_view_mode: 'grid' }

/** A run of «Update values» held in the middle: the buttons and the notice in their running state, a card swapped in place. */
const startRun = async (h) => {
    const gate = held()
    h.set.values.readMany = vi.fn(aRun(gate))
    await h.click('#updateValuesBtn')
    return gate
}

export const SCENARIOS = [
    // ------------------------------------------------------------------------------------------ the computer
    { name: 'empty', items: () => [], run: async (h) => { h.snap('no albums'); h.notice() } },
    {
        name: 'loading', run: async (h) => {
            await h.run(c => { c.state.isLoading = true; c.refresh() })
            h.snap('the loading line')
            await h.run(c => { c.state.isLoading = false; c.refresh() })
            h.snap('and the albums again')
        }
    },
    { name: 'grid, values off, three statuses', run: async (h) => { h.snap('the cards'); h.notice(); h.note('opening') } },
    { name: 'list, values off', storage: LIST, run: async (h) => { h.snap('the rows') } },
    {
        name: 'values on, every origin: suggested, lowest asking, written, never read', values: () => ON(), run: async (h) => {
            h.snap('the cards, the totals, the waiting notice, the seller settings notice')
            h.notice()
            await h.click('#toggleViewMode')
            h.snap('the rows')
            h.note('a switch to the list')
        }
    },
    {
        name: 'values on, the rates did not come', values: () => ON({ rates: null }), run: async (h) => { h.snap('the currencies that cannot be chosen, and why') }
    },
    {
        name: 'values on, euro chosen', values: () => ON(), run: async (h) => {
            await h.click('[data-currency="EUR"]')
            h.snap('the values in euros, the note of the rate')
            h.focus('after the currency')
            h.note('euro')
            await h.click('[data-currency="BRL"]')
            h.snap('and in reais')
        }
    },
    {
        name: 'values on, albums waiting: Read them now, then Stop', values: () => ON({ readings: new Map() }), run: async (h) => {
            h.snap('the notice of the albums that wait')
            const gate = held()
            h.set.values.readMany = vi.fn(aRun(gate))
            await h.click('[data-notice-action="read-values"]')
            h.snap('a run under way: Stop, the button busy, the first card reading')
            h.focus('after Read them now')
            await h.type('#inventorySearch', 'fl')
            h.snap('the search typed during the run')
            h.focus('the search during the run')
            await h.click('[data-notice-action="stop-values"]')
            h.snap('stopped')
            h.note('Read them now, Stop')
        }
    },
    {
        name: 'values on, Update values: a run, a card changed in place, the end', values: () => ON(), run: async (h) => {
            const gate = await startRun(h)
            h.snap('running')
            h.focus('after Update values')
            gate.release()
            await h.settle(50)
            h.snap('the end of the run: one read, one failed')
            h.note('Update values')
        }
    },
    {
        name: 'a count of the header pressed, and pressed again', run: async (h) => {
            await h.click('[data-status-count="owned"]')
            h.snap('only the owned')
            h.focus('after the count')
            await h.click('[data-status-count="owned"]')
            h.snap('all again')
            await h.click('[data-status-count="wishlist"]')
            h.snap('only the wishlist')
        }
    },
    {
        name: 'the search typed, found and not found', run: async (h) => {
            await h.type('#inventorySearch', 'fl')
            h.snap('two letters')
            h.focus('typing')
            await h.type('#inventorySearch', 'zzz')
            h.snap('nothing found')
            await h.type('#inventorySearch', '')
            h.snap('cleared')
            h.note('the search')
        }
    },
    {
        name: 'the format Vinyl', run: async (h) => {
            await h.select('#formatFilter', 'vinyl')
            h.snap('vinyl only')
            h.focus('after the format')
            h.note('format')
        }
    },
    {
        name: 'the ten orders', values: () => ON({ readings: new Map([['owned', suggested()], ['wanted', lowest()], ['wished', suggested({ mint: 3, nearMint: 2, veryGoodPlus: 1 })]]) }), run: async (h) => {
            for (const sort of SORTS) {
                await h.select('#inventorySort', sort)
                h.snap(`order ${sort}`)
            }
            h.note('the orders')
        }
    },
    {
        name: 'the view switch: list and back', run: async (h) => {
            await h.click('#toggleViewMode')
            h.snap('the list')
            h.focus('after the switch')
            await h.click('#toggleViewMode')
            h.snap('the grid')
            outside.push(['stored view', localStorage.getItem('mjrp_inventory_view_mode')])
            h.note('the switch')
        }
    },
    {
        name: 'Update ratings: busy, the other action waits; the question above 30', items: () => manyItems(31), run: async (h) => {
            h.set.confirm.gate = held()
            h.set.averagesGate = held()
            await h.click('#updateRatingsBtn')
            h.snap('asking: the button is busy, the other waits')
            h.note('the question')
            h.set.confirm.gate.release()
            await h.settle(20)
            h.snap('reading ratings')
            h.set.averagesGate.release()
            await h.settle(20)
            h.snap('done')
            h.note('the end')
        }
    },
    {
        name: 'Update ratings: the person says no, and nothing to read', items: () => manyItems(31), run: async (h) => {
            h.set.confirm.answer = false
            await h.click('#updateRatingsBtn')
            h.snap('no')
            h.note('no')
        }
    },
    {
        name: 'Update ratings with no albums', items: () => [], run: async (h) => {
            await h.click('#updateRatingsBtn')
            h.note('an empty inventory')
        }
    },
    {
        name: 'Add the albums of my series: reading, the question, writing, the end', run: async (h) => {
            h.set.seriesGate = held()
            h.set.confirm.gate = held()
            h.set.addProgress = held()
            await h.click('#addSeriesAlbumsBtn')
            h.snap('reading the series: the button busy, the other waits')
            h.set.seriesGate.release()
            await h.settle(20)
            h.snap('the question is open')
            h.note('the question')
            h.set.confirm.gate.release()
            await h.settle(20)
            h.snap('writing')
            h.set.addProgress.release()
            await h.settle(20)
            h.snap('the end')
            h.note('the end')
        }
    },
    {
        name: 'Add the albums of my series: nothing to add', run: async (h) => {
            h.set.plan = { toAdd: [], skipped: [], alreadyThere: 3, repeated: 0, incomplete: 0, seriesCount: 2 }
            await h.click('#addSeriesAlbumsBtn')
            h.snap('nothing to add')
            h.note('nothing')
        }
    },
    {
        name: 'Add the albums of my series: the person says no', run: async (h) => {
            h.set.confirm.answer = false
            await h.click('#addSeriesAlbumsBtn')
            h.note('no')
        }
    },
    {
        name: 'delete: the question, yes; and a failure', run: async (h) => {
            await h.click('.delete-album-btn', 0)
            h.snap('after yes')
            h.note('removed')
            h.set.failRemove = true
            await h.click('.delete-album-btn', 0)
            h.snap('after a failure')
            h.note('failed')
            h.set.confirm.answer = false
            await h.click('.delete-album-btn', 0)
            h.note('no')
        }
    },
    {
        name: 'edit opens the window; saving writes and draws the item again', run: async (h) => {
            await h.click('.edit-album-btn', 1)
            h.note('the window opened')
            await h.saveEdit({ format: 'cd', currency: 'USD', purchasePrice: 12.5, notes: 'bought in 2026' })
            h.snap('saved')
            h.note('saved')
        }
    },
    {
        name: 'the album window: opened by the card, the value host', values: () => ON(), run: async (h) => {
            await h.clickText('.album-card-compact [data-action="view-modal"]', 0)
            h.note('the window opened by the cover')
            await h.fromWindow('onWrite', '31.5')
            await h.fromWindow('onForget')
            await h.fromWindow('onRead')
            h.note('the host answers')
            await h.clickText('.inventory-card-wrapper h3', 1)
            h.note('opened by the title')
            await h.click('[data-line="5"] [data-action="view-modal"]')
            h.note('opened by Where to buy')
        }
    },
    {
        name: 'a link of the card opens no window', run: async (h) => {
            await h.run(() => { document.querySelector('a[href]').addEventListener('click', event => event.preventDefault()) })
            await h.click('.inventory-card-wrapper[data-album-id="wanted"] a[href]')
            h.note('the store link')
        }
    },
    {
        name: 'the list: the row opens the window, Edit and Delete', storage: LIST, run: async (h) => {
            await h.clickText('.inventory-row-wrapper', 0)
            h.note('the row')
            await h.click('.edit-album-btn', 1)
            h.note('edit')
            h.set.confirm.answer = false
            await h.click('.delete-album-btn', 2)
            h.note('delete, refused')
        }
    },
    {
        name: 'the status changed on a card: written, and put back when the write fails', run: async (h) => {
            await h.select('.status-select', 'wishlist', 0)
            h.snap('the first card is now a wishlist card')
            h.note('written')
            h.set.failUpdate = true
            await h.select('.status-select', 'owned', 1)
            h.snap('the write failed: the selector went back')
            h.note('failed')
        }
    },
    {
        name: 'the Discogs notice follows the switch', values: () => ON(), run: async (h) => { h.notice() }
    },
    {
        name: 'the inventory changes under the screen', run: async (h) => {
            await h.store(store => store.replaceAlbums([...store.getAlbums(), { id: 'late', artist: 'Cream', title: 'Disraeli Gears', owned: true, format: 'cd' }]))
            h.snap('an album arrived')
            h.focus('after the store')
            await h.store(store => store.reset())
            h.snap('the inventory emptied')
        }
    },
    {
        name: 'leaving and coming back', run: async (h) => {
            await h.type('#inventorySearch', 'yes')
            await h.leave()
            h.snap('left: nothing of the screen on the page')
            h.notice()
            await h.enter()
            h.snap('back: the search is empty again')
        }
    },

    // ------------------------------------------------------------------------------------------ the phone (393)
    { name: 'the list, values off', phone: true, run: async (h) => { h.snap('the bar, the title, the totals and the rows'); h.notice() } },
    { name: 'the gallery, chosen', phone: true, storage: GALLERY, run: async (h) => { h.snap('the tiles') } },
    {
        name: 'loading: the ghosts of the list and of the gallery', phone: true, run: async (h) => {
            await h.run(c => { c.state.isLoading = true; c.refresh() })
            h.snap('the ghost rows')
            await h.run(c => { c.state.viewMode = 'grid'; c.state.viewChosen = true; c.refresh() })
            h.snap('the ghost tiles')
        }
    },
    {
        name: 'the two empty states', phone: true, items: () => [], run: async (h) => {
            h.snap('the collection is empty')
            await h.click('[data-phone-action="add-series"]')
            h.note('add series from the empty state')
            await h.run(() => inventoryStore.setAlbums(ITEMS()))
            await h.type('#inventorySearch', 'zzz')
            h.snap('no album matches')
            await h.click('[data-phone-action="clear-filters"]')
            h.snap('cleared')
            h.note('the clear')
        }
    },
    {
        name: 'the bar: filters on, the jump by letter and by position, the jump disabled when empty', phone: true, values: () => ON(), run: async (h) => {
            await h.run(c => { c.handleFilterChange('format', 'vinyl'); c.handleSortChoice('value') })
            h.snap('two filters on: the badge, 1–N')
            await h.type('#inventorySearch', 'zzz')
            h.snap('the jump is disabled')
        }
    },
    {
        name: 'Show 50 more, and All N albums', phone: true, items: () => manyItems(120), run: async (h) => {
            h.snap('the first 50', '.inv-more')
            await h.click('[data-phone-action="more-rows"]')
            h.snap('100 shown')
            h.focus('the first new row')
            await h.click('[data-phone-action="more-rows"]')
            h.snap('all 120', '.inv-more')
            h.note('more')
        }
    },
    {
        name: 'the status sheet: the same status does nothing, another one is written', phone: true, run: async (h) => {
            await h.click('.inv-row__status', 0)
            h.snap('the sheet')
            h.focus('the status sheet')
            await h.click('.inv-choice', 0)
            h.note('the same status')
            await h.click('.inv-row__status', 0)
            await h.click('.inv-choice', 2)
            h.snap('after the choice')
            h.note('another status')
        }
    },
    {
        name: 'the sheet of an album: every kind of value, and each action', phone: true, values: () => ON(), run: async (h) => {
            for (let i = 0; i < 5; i++) {
                await h.click('.inv-row__more', i)
                h.snap(`the sheet of the album ${i}`)
                await h.click('.sheet__close')
            }
            await h.click('.inv-row__more', 0)
            await h.click('.inv-action', 0)
            h.note('Open album')
            await h.click('.inv-row__more', 0)
            await h.click('.inv-action', 1)
            h.note('Edit')
            h.set.confirm.answer = false
            await h.click('.inv-row__more', 0)
            await h.click('.inv-action--danger')
            h.note('Remove, refused')
        }
    },
    {
        name: 'the filters sheet: view, format and order, applied at once; scrolling to the top when closed', phone: true, items: () => manyItems(8), run: async (h) => {
            await h.click('[data-phone-action="filters"]')
            h.snap('the sheet')
            await h.click('[data-view="grid"]')
            h.snap('gallery chosen')
            await h.click('[data-format="cd"]')
            await h.click('[data-sort="artist_desc"]')
            h.snap('format and order chosen, the count in the footer')
            await h.click('[data-role="filters-done"]')
            h.snap('closed')
            h.note('the filters sheet')
        }
    },
    {
        name: 'the filters sheet closed with nothing changed', phone: true, run: async (h) => {
            await h.click('[data-phone-action="filters"]')
            await h.click('[data-role="filters-done"]')
            h.note('no scroll')
        }
    },
    {
        name: 'the actions sheet: the same buttons, each with its words; the sheet closes first', phone: true, values: () => ON(), run: async (h) => {
            await h.click('[data-phone-action="actions"]')
            h.snap('the sheet')
            h.set.seriesGate = held()
            await h.click('#addSeriesAlbumsBtn')
            h.snap('closed, the action running')
            h.set.seriesGate.release()
            await h.settle(20)
            h.note('add series')
        }
    },
    {
        name: 'the jump sheet: by letter, then by position', phone: true, items: () => manyItems(120), run: async (h) => {
            await h.click('[data-phone-action="jump"]')
            h.snap('letters')
            await h.click('.inv-jump__target', 3)
            h.focus('the jumped row')
            h.note('the jump')
            await h.run(c => c.handleSortChoice('averageRating'))
            await h.click('[data-phone-action="jump"]')
            h.snap('positions')
        }
    },
    {
        name: 'the values sheet: About the values, and Why?', phone: true, values: () => ON(), run: async (h) => {
            await h.click('[data-values-about]')
            h.snap('why: the seller settings missing')
            await h.click('.sheet__close')
            await h.run(() => { world.values = ON({ readings: new Map([['owned', suggested()]]) }); world.values.sellerSettingsMissing = () => false })
            await h.click('[data-values-about]')
            h.snap('about')
        }
    },
    {
        name: 'a run: the line under the search, with Stop; the totals and the notices on the phone', phone: true, values: () => ON(), run: async (h) => {
            h.snap('the notices')
            await h.click('[data-phone-action="actions"]')
            const gate = await startRun(h)
            h.snap('running: the line and Stop')
            await h.click('[data-phone-action="stop-values"]')
            gate.release()
            await h.settle(30)
            h.snap('stopped')
            h.note('the run')
        }
    },
    {
        name: 'turning into a computer and back', phone: true, run: async (h) => {
            await h.turn(false)
            h.snap('the computer')
            await h.turn(true)
            h.snap('the phone again')
        }
    },
    {
        name: 'the album window opened from a row and from a tile', phone: true, storage: GALLERY, run: async (h) => {
            await h.click('.inv-tile__open', 1)
            h.note('a tile')
            await h.run(c => { c.handleViewModeChange('list') })
            await h.click('.inv-row__open', 2)
            h.note('a row')
        }
    }
]
