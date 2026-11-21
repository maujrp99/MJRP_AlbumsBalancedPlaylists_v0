import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// UAT-231: on the phone, with the real covers, the credit under each record
// («Album · Artist — Listen on Apple Music») must wrap inside the column;
// a line that cannot wrap made the page wider than the screen.
const page = readFileSync(resolve(process.cwd(), 'public/splash.html'), 'utf8')
const rule = (page.match(/\.slot \.slot-am\{([^}]*)\}/) || [])[1] || ''

describe('the credit under a record on the phone (UAT-231)', () => {
    it('has a rule of its own', () => {
        expect(rule).not.toBe('')
    })
    it('may wrap', () => {
        expect(rule).not.toMatch(/white-space:\s*nowrap/)
    })
    it('is as wide as the column, never wider than the screen', () => {
        expect(rule).toMatch(/width:\s*calc\(100vw - 2 \* var\(--gutter\)\)/)
    })
})
