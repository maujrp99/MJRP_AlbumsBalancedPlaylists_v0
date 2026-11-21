import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// UAT-232 (the owner's choice, 2026-11-21): opening «paste a list» puts the focus on the last line,
// and the box around the list must not light up in orange for it, as the approved prototype shows.
// The line in focus keeps its own mark, so the keyboard focus is still visible.
const css = readFileSync(resolve(process.cwd(), 'public/css/views/home.css'), 'utf8')
const ruleOf = (selector) => {
    const at = css.indexOf(`${selector} {`)
    return at < 0 ? '' : css.slice(at, css.indexOf('}', at) + 1)
}

describe('the box of the pasted list, with the focus inside (UAT-232)', () => {
    it('keeps the resting border and shadow of the field', () => {
        const rule = ruleOf('.home-paste:focus-within')
        expect(rule).not.toBe('')
        expect(rule).toMatch(/border-color:\s*var\(--home-line\)/)
        expect(rule).toMatch(/box-shadow:\s*0 10px 40px rgba\(0, 0, 0, 0\.5\)\s*;/)
    })
    it('still marks the line in focus', () => {
        expect(ruleOf('.home-line__text:focus')).toMatch(/box-shadow/)
    })
})
