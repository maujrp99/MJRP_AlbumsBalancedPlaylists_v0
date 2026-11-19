import { describe, it, expect } from 'vitest'
import { formatDuration, NO_DURATION } from '../../public/js/utils/duration.js'

// Track durations are kept in seconds (models/Track.js). One formatter for every screen (UAT-188).
describe('formatDuration', () => {
    it('formats seconds as m:ss', () => {
        expect(formatDuration(276)).toBe('4:36')
        expect(formatDuration(61)).toBe('1:01')
        expect(formatDuration(15)).toBe('0:15')
    })

    it('formats an hour or more as h:mm:ss', () => {
        expect(formatDuration(4767)).toBe('1:19:27')
    })

    it('rounds fractions of a second down', () => {
        expect(formatDuration(59.9)).toBe('0:59')
    })

    it('says there is no duration instead of 0:00', () => {
        expect(NO_DURATION).toBe('--:--')
        for (const missing of [0, null, undefined, '', -5, NaN, 'abc']) {
            expect(formatDuration(missing)).toBe(NO_DURATION)
        }
    })

    it('accepts a number written as text', () => {
        expect(formatDuration('180')).toBe('3:00')
    })
})
