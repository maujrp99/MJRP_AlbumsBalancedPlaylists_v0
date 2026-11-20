/**
 * F77, REQ-04: the switch of the measurement.
 *
 * ON only when a project key was given at build AND nobody turned it off: not the build
 * (VITE_USAGE_MEASUREMENT=off), not the browser (localStorage `mjrp.usage` = off). The browser can
 * also ask for `debug`: the events are kept in memory, on the page, and sent nowhere.
 */
import { describe, it, expect } from 'vitest'
import { usageMode, readUsageFlag, UsageMode, USAGE_FLAG_KEY } from '../../../public/js/services/usage/usageSwitch.js'

const KEY = 'project-key-for-the-test'

describe('usageMode', () => {
    it('no key at build: off', () => {
        expect(usageMode({ key: '', buildSwitch: undefined, flag: null })).toBe(UsageMode.OFF)
        expect(usageMode({ key: undefined })).toBe(UsageMode.OFF)
        expect(usageMode({ key: '   ' })).toBe(UsageMode.OFF)
    })

    it('a key and nothing turned off: on', () => {
        expect(usageMode({ key: KEY, buildSwitch: undefined, flag: null })).toBe(UsageMode.ON)
        expect(usageMode({ key: KEY, buildSwitch: 'on', flag: 'on' })).toBe(UsageMode.ON)
    })

    it('the build turned it off: off, with any key', () => {
        expect(usageMode({ key: KEY, buildSwitch: 'off' })).toBe(UsageMode.OFF)
        expect(usageMode({ key: KEY, buildSwitch: ' OFF ' })).toBe(UsageMode.OFF)
    })

    it('the browser turned it off: off, with any key', () => {
        expect(usageMode({ key: KEY, flag: 'off' })).toBe(UsageMode.OFF)
        expect(usageMode({ key: KEY, flag: 'Off' })).toBe(UsageMode.OFF)
    })

    it('the browser asked for debug: debug, with or without a key, and never on', () => {
        expect(usageMode({ key: '', flag: 'debug' })).toBe(UsageMode.DEBUG)
        expect(usageMode({ key: KEY, flag: 'debug' })).toBe(UsageMode.DEBUG)
        expect(usageMode({ key: KEY, buildSwitch: 'off', flag: 'debug' })).toBe(UsageMode.DEBUG)
    })
})

describe('readUsageFlag', () => {
    it('reads the key mjrp.usage of the storage', () => {
        expect(USAGE_FLAG_KEY).toBe('mjrp.usage')
        expect(readUsageFlag({ getItem: (key) => (key === 'mjrp.usage' ? 'off' : null) })).toBe('off')
    })

    it('a storage that cannot be read (a private window) is no flag', () => {
        expect(readUsageFlag({ getItem: () => { throw new Error('SecurityError') } })).toBeNull()
        expect(readUsageFlag(undefined)).toBeNull()
    })
})
