// @vitest-environment node
/**
 * F79 (REQ-10): nothing of the Home moves for who asked the system for less motion. The equalizer,
 * the skeleton covers and the lift of a cover are the Home's motion; under
 * `prefers-reduced-motion: reduce` each of them is stopped, and the equalizer waiting stands still
 * at full height (the words carry the state).
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import postcss from 'postcss'

const css = fs.readFileSync(path.resolve(process.cwd(), 'public/css/views/home.css'), 'utf8')
const REDUCED = '(prefers-reduced-motion: reduce)'

/** The declarations of a selector inside the reduced-motion query, and outside it. */
function declarations(selector, { reduced }) {
    const found = {}
    postcss.parse(css).walkRules(rule => {
        const inside = rule.parent?.type === 'atrule' && rule.parent.params.trim() === REDUCED
        if (inside !== reduced) return
        if (!rule.selector.split(',').map(part => part.trim()).includes(selector)) return
        rule.walkDecls(decl => { found[decl.prop] = decl.value })
    })
    return found
}

/** Every selector that animates or moves, outside the reduced-motion query. */
function moving() {
    const selectors = []
    postcss.parse(css).walkDecls(decl => {
        const rule = decl.parent
        const inReduced = rule.parent?.type === 'atrule' && rule.parent.params.trim() === REDUCED
        if (inReduced || rule.type !== 'rule') return
        if (decl.prop === 'animation' || decl.prop === 'transition') selectors.push(...rule.selector.split(',').map(part => part.trim()))
    })
    return [...new Set(selectors)]
}

describe('the Home with less motion (F79)', () => {
    it('the motion of the Home is the equalizer, the skeleton covers and the lift of a cover', () => {
        expect(moving().sort()).toEqual(['.home-card__cover', '.home-eq i', '.home-eq.is-live i', '.home-skel'].sort())
    })

    it('under prefers-reduced-motion every one of them stops', () => {
        expect(declarations('.home-eq i', { reduced: true }).animation).toMatch(/^none/)
        expect(declarations('.home-skel', { reduced: true }).animation).toMatch(/^none/)
        expect(declarations('.home-eq i', { reduced: true }).transition).toMatch(/^none/)
        expect(declarations('.home-card__cover', { reduced: true }).transition).toMatch(/^none/)
        expect(declarations('.home-card:hover .home-card__cover', { reduced: true }).transform).toBe('none')
    })

    it('waiting, the bars stand still at full height', () => {
        expect(declarations('.home-eq.is-live i', { reduced: true }).transform).toBe('none')
    })
})
