/**
 * F78, REQ-10: `_schemaVersion` never goes down (shared/data/schemaVersion.js).
 */
import { describe, it, expect } from 'vitest'
import { keptSchemaVersion } from '@shared/data/schemaVersion.js'

describe('the version a write stamps (F78, REQ-10)', () => {
    it('is the higher of the writer’s and the document’s', () => {
        expect(keptSchemaVersion(1, 2)).toBe(2)
        expect(keptSchemaVersion(2, 1)).toBe(2)
        expect(keptSchemaVersion(1, 1)).toBe(1)
    })

    it('is the writer’s when the document carries none, or not a number', () => {
        expect(keptSchemaVersion(1, undefined)).toBe(1)
        expect(keptSchemaVersion(1, null)).toBe(1)
        expect(keptSchemaVersion(1, '3')).toBe(1)
        expect(keptSchemaVersion(1, NaN)).toBe(1)
    })
})
