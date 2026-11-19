/**
 * F58 (UAT-194) - "only the latest ask of a thing counts": the rule the load follows for each
 * source of each album, on its own.
 */
import { describe, it, expect } from 'vitest'
import { LatestOnly } from '../../public/js/utils/LatestOnly.js'

describe('LatestOnly', () => {
    it('an ask is the latest until another one starts for the same thing', () => {
        const asks = new LatestOnly()

        const first = asks.start('s1|one|acclaim')
        expect(first()).toBe(true)

        const second = asks.start('s1|one|acclaim')
        expect(first()).toBe(false)
        expect(second()).toBe(true)
    })

    it('asks for different things do not replace each other', () => {
        const asks = new LatestOnly()

        const acclaim = asks.start('s1|one|acclaim')
        const popularity = asks.start('s1|one|popularity')

        expect(acclaim()).toBe(true)
        expect(popularity()).toBe(true)
    })

    it('after clear() nothing asked before is the latest', () => {
        const asks = new LatestOnly()
        const before = asks.start('s1|one|acclaim')

        asks.clear()

        expect(before()).toBe(false)
        expect(asks.start('s1|one|acclaim')()).toBe(true)
        expect(before()).toBe(false) // the first ask after clear() is not mistaken for the first one before it
    })
})
