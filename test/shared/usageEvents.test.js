/**
 * F77, REQ-01, REQ-03, REQ-05: the one list of what the app may measure.
 *
 * Every event has a fixed name and a fixed list of properties, each of a fixed kind: a count, or
 * one value of a closed set. Nothing a person types (the name of a series, of a playlist, an
 * e-mail, a search) can pass, because no property takes free text.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { describeEvent, EVENT_NAMES, USAGE_EVENTS, SCREENS, RECIPES } from '../../shared/usageEvents.js'
import { getAllAlgorithms } from '../../public/js/algorithms/index.js'

describe('the closed list of events', () => {
    it('names every event the feature asked for, and the ones the agent added', () => {
        expect(EVENT_NAMES).toEqual(expect.arrayContaining([
            'screen_viewed', 'series_created', 'series_edited', 'series_deleted', 'ranking_saved',
            'playlists_generated', 'playlists_saved', 'playlists_exported', 'inventory_status_changed',
            'inventory_value_written', 'inventory_values_read', 'buy_link_opened', 'filter_used',
            'sign_in', 'sign_out',
            'inventory_value_removed', 'inventory_albums_added'
        ]))
    })

    it('every property is a count or one of a closed set: none takes free text', () => {
        for (const [name, properties] of Object.entries(USAGE_EVENTS)) {
            for (const [property, kind] of Object.entries(properties)) {
                expect(['count', 'oneOf'], `${name}.${property}`).toContain(kind.kind)
                if (kind.kind === 'oneOf') expect(kind.values.length, `${name}.${property}`).toBeGreaterThan(0)
            }
        }
    })

    it('the list cannot be changed by whoever imports it', () => {
        expect(Object.isFrozen(USAGE_EVENTS)).toBe(true)
        expect(Object.isFrozen(USAGE_EVENTS.buy_link_opened)).toBe(true)
        expect(Object.isFrozen(USAGE_EVENTS.buy_link_opened.store.values)).toBe(true)
    })

    it('every recipe of the app is a recipe the list knows', () => {
        expect(RECIPES).toEqual(expect.arrayContaining(getAllAlgorithms().map(recipe => recipe.id)))
    })
})

describe('describeEvent: the cleaned event, or a refusal', () => {
    it('an event of the list, with its properties, passes as it is', () => {
        expect(describeEvent('buy_link_opened', { store: 'amazon', place: 'card' }))
            .toEqual({ ok: true, name: 'buy_link_opened', properties: { store: 'amazon', place: 'card' } })
    })

    it('an event with no properties passes with none', () => {
        expect(describeEvent('sign_out')).toEqual({ ok: true, name: 'sign_out', properties: {} })
    })

    it('a name that is not on the list is refused', () => {
        expect(describeEvent('page_opened', {})).toEqual({ ok: false, reason: 'unknown-event' })
        expect(describeEvent(undefined)).toEqual({ ok: false, reason: 'unknown-event' })
        expect(describeEvent('toString')).toEqual({ ok: false, reason: 'unknown-event' })
    })

    it('a property that is not on the list of the event is dropped', () => {
        const event = describeEvent('series_created', { album_count: 4, name: 'My 90s', email: 'a@b.com' })
        expect(event.properties).toEqual({ album_count: 4 })
    })

    it('text a person typed never passes, whatever property it is put in (REQ-03)', () => {
        expect(describeEvent('filter_used', { screen: 'albums', which: 'radiohead' }).properties).toEqual({ screen: 'albums' })
        expect(describeEvent('playlists_generated', { recipe: 'My recipe', playlist_count: 2 }).properties).toEqual({ playlist_count: 2 })
        expect(describeEvent('screen_viewed', { screen: '/albums/abc123' }).properties).toEqual({})
    })

    it('a count is a whole number from 0 up; anything else is dropped', () => {
        const counts = [3, 0, -1, 2.5, '7', NaN, Infinity, null]
        const kept = counts.map(value => describeEvent('ranking_saved', { track_count: value }).properties.track_count)
        expect(kept).toEqual([3, 0, undefined, undefined, undefined, undefined, undefined, undefined])
    })

    it('a count too large to be a count of this app is dropped', () => {
        expect(describeEvent('inventory_values_read', { count: 10_000_001 }).properties).toEqual({})
    })

    it('the screens are names, never addresses', () => {
        for (const screen of SCREENS) expect(screen).toMatch(/^[a-z_]+$/)
    })

    it('the properties given are not changed', () => {
        const given = { store: 'discogs', place: 'phone_sheet', extra: 'x' }
        describeEvent('buy_link_opened', given)
        expect(given).toEqual({ store: 'discogs', place: 'phone_sheet', extra: 'x' })
    })
})

describe('the list is for every client: the site and the phone app (REQ-05)', () => {
    it('the module uses no browser and no server API, and imports nothing', () => {
        const source = fs.readFileSync(path.join(process.cwd(), 'shared/usageEvents.js'), 'utf8')
        const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
        expect(code).not.toMatch(/\b(window|document|localStorage|sessionStorage|navigator|fetch|process|require)\b/)
        expect(code).not.toMatch(/^\s*import\s/m)
    })
})
