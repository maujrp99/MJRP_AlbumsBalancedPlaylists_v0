// @vitest-environment node
/**
 * F76 polish, recheck N1, kept by F79: on the phone the Home's type chips flow with the page.
 *
 * Before F79 the computer's narrow window pinned #home-toolbar (sticky, top 0), and on the phone it
 * floated over the covers, under the top bar. F79 pins nothing; the phone's sheet still says so,
 * inside the phone's media query, so a later rule of the computer cannot float the chips again.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import postcss from 'postcss'
import { PHONE_QUERY } from '../../../public/js/utils/isPhone.js'

const css = fs.readFileSync(path.resolve(process.cwd(), 'public/css/mobile/home.css'), 'utf8')

const phoneDeclarations = (selector) => {
    const found = {}
    postcss.parse(css).walkRules(rule => {
        const media = rule.parent
        if (rule.selector.trim() !== selector || media?.type !== 'atrule' || media.params.trim() !== PHONE_QUERY) return
        rule.walkDecls(decl => { found[decl.prop] = decl.value })
    })
    return found
}

describe('the Home on the phone: the type filters (recheck N1)', () => {
    it('are not pinned: they scroll away with the page instead of floating over the covers', () => {
        expect(phoneDeclarations('#home-toolbar').position).toBe('static')
    })
})

describe('the Home on the phone: the pasted list (F79)', () => {
    it('grows with its lines: the 56 px of the field do not hold the list (it covered the hint and the equalizer)', () => {
        expect(phoneDeclarations('.home-field.home-paste').height).toBe('auto')
    })

    it('the lines are written at 16 px, so the iPhone does not zoom in', () => {
        expect(phoneDeclarations('.home-line__text').font).toMatch(/\b16px\b/)
        expect(phoneDeclarations('.home-field > input').font).toMatch(/16px/)
    })
})
