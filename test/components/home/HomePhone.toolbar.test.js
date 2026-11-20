// @vitest-environment node
/**
 * F76 polish, recheck N1: on the phone the Home's type filters flow with the page.
 *
 * css/views/home.css pins #home-toolbar (sticky, top 0) below 769 px, for the computer's narrow
 * window; on the phone its background is cleared, so pinned it floated over the covers, under
 * the top bar. The phone's sheet must undo the pinning, inside the phone's media query.
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
