/**
 * F93 TASK-04 (REQ-05): the validator of the feature switches, one for the Painel, the site and the
 * server (shared/content). A closed list of three, each true or false, each with its default; a key
 * out of the list or of another type is refused alone, and the others go on.
 */
import { describe, it, expect } from 'vitest'
import { SWITCH_IDS, SWITCHES, validateSwitches, switchValue } from '../../../shared/content/switches.js'

describe('the closed list of switches (F93, REQ-05)', () => {
    it('are three, in this order, and nothing else', () => {
        expect(SWITCH_IDS).toEqual(['discogsValues', 'usageMeasurement', 'portugueseForAll'])
        expect(Object.keys(SWITCHES)).toEqual(SWITCH_IDS)
    })

    it('each says its default (true or false), what a reader does with no reading and no copy, and whether the CMS can only turn it off', () => {
        for (const id of SWITCH_IDS) {
            expect(typeof SWITCHES[id].default, id).toBe('boolean')
            expect(['ask-server', 'follow-build', 'closed'], id).toContain(SWITCHES[id].whenUnknown)
            expect(typeof SWITCHES[id].onlyTurnsOff, id).toBe('boolean')
        }
        expect(SWITCHES.discogsValues).toMatchObject({ default: false, whenUnknown: 'ask-server', onlyTurnsOff: false })
        expect(SWITCHES.usageMeasurement).toMatchObject({ default: true, whenUnknown: 'follow-build', onlyTurnsOff: true })
        expect(SWITCHES.portugueseForAll).toMatchObject({ default: false, whenUnknown: 'closed', onlyTurnsOff: false })
    })

    it('the list and its entries cannot be changed by who imports them', () => {
        expect(Object.isFrozen(SWITCH_IDS)).toBe(true)
        expect(Object.isFrozen(SWITCHES)).toBe(true)
        expect(Object.isFrozen(SWITCHES.discogsValues)).toBe(true)
    })
})

describe('validateSwitches', () => {
    it('a valid document: the three are read, nothing is refused', () => {
        const result = validateSwitches({ discogsValues: true, usageMeasurement: false, portugueseForAll: true })
        expect(result.values).toEqual({ discogsValues: true, usageMeasurement: false, portugueseForAll: true })
        expect(result.rejected).toEqual([])
    })

    it('a key left out is not set (the default is not written into the values)', () => {
        expect(validateSwitches({ discogsValues: true }).values).toEqual({ discogsValues: true })
        expect(validateSwitches({}).values).toEqual({})
    })

    it('{ discogsValues: "yes", foo: true }: both are refused, each with its reason, and the rest goes on', () => {
        const result = validateSwitches({ discogsValues: 'yes', foo: true, usageMeasurement: false })
        expect(result.values).toEqual({ usageMeasurement: false })
        expect(result.rejected).toEqual([
            { key: 'discogsValues', reason: 'not_boolean' },
            { key: 'foo', reason: 'unknown_key' }
        ])
    })

    it('only a real true or false counts: 1, 0, "true", null, undefined, objects are refused', () => {
        for (const bad of [1, 0, 'true', 'false', null, undefined, {}, [], NaN]) {
            const result = validateSwitches({ portugueseForAll: bad })
            expect(result.values, String(bad)).toEqual({})
            expect(result.rejected, String(bad)).toEqual([{ key: 'portugueseForAll', reason: 'not_boolean' }])
        }
    })

    it('a name that only looks like a key of the list (case, space, inherited names) is out of the list', () => {
        for (const key of ['DiscogsValues', 'discogsValues ', '__proto__', 'constructor', 'toString']) {
            const input = JSON.parse(`{${JSON.stringify(key)}: true}`)
            expect(validateSwitches(input).rejected, key).toEqual([{ key, reason: 'unknown_key' }])
            expect(validateSwitches(input).values, key).toEqual({})
        }
    })

    it('what is not a map at all: nothing is read, one refusal with no key', () => {
        for (const bad of [null, undefined, 'a text', 5, true, ['discogsValues']]) {
            expect(validateSwitches(bad), String(bad)).toEqual({ values: {}, rejected: [{ key: null, reason: 'not_a_map' }] })
        }
    })

    it('the answer does not share the input: changing it later changes nothing', () => {
        const input = { discogsValues: true }
        const { values } = validateSwitches(input)
        input.discogsValues = false
        expect(values.discogsValues).toBe(true)
    })
})

describe('switchValue: the value read, else the default', () => {
    it('a read key gives its value; one not read gives its default', () => {
        expect(switchValue('discogsValues', { discogsValues: true })).toBe(true)
        expect(switchValue('usageMeasurement', { usageMeasurement: false })).toBe(false)
        expect(switchValue('discogsValues', {})).toBe(false)
        expect(switchValue('usageMeasurement', {})).toBe(true)
    })

    it('a key out of the list is an error, never a guess', () => {
        expect(() => switchValue('foo', {})).toThrow(/foo/)
    })
})
