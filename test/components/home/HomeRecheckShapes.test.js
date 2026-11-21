// @vitest-environment node
/**
 * F79, after the independent visual recheck (reports/audits/2026-11-20-F79-visual-parity-recheck.md):
 * the shapes the prototype gives that the build had lost, read from the stylesheets.
 *
 *  P1-1  the pasted lines in the prototype's type (Syne 15/400 at 1280, the text face 16/400 at 393); the line
 *        that stays to fix in the prototype's form (Syne 18/600, the system face 16/600 at 393, the red line);
 *        the type of the artist's field no longer reaches the lines (it did: `.home-field input` matched them);
 *  P1-2  the phone's bar while creating: the small equalizer on the line of «Saving your series…»;
 *  P2    «Not saved: the connection dropped» wraps instead of being cut; a pasted line too long ends in «…»;
 *        in the phone's sheet a title is cut on one line with «…».
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import postcss from 'postcss'
import { PHONE_QUERY } from '../../../public/js/utils/isPhone.js'

const read = (file) => postcss.parse(fs.readFileSync(path.resolve(process.cwd(), file), 'utf8'))
const computer = read('public/css/views/home.css')
const phone = read('public/css/mobile/home.css')

/** The declarations of a selector: on the computer (outside any media query) or inside the phone's query. */
function declarations(root, selector, { inPhone = false } = {}) {
    const found = {}
    root.walkRules(rule => {
        const media = rule.parent?.type === 'atrule' ? rule.parent.params.trim() : null
        if (inPhone ? media !== PHONE_QUERY : media !== null) return
        if (!rule.selector.split(',').map(part => part.trim()).includes(selector)) return
        rule.walkDecls(decl => { found[decl.prop] = decl.value })
    })
    return found
}

const selectors = (root) => {
    const all = []
    root.walkRules(rule => all.push(...rule.selector.split(',').map(part => part.trim())))
    return all
}

describe('P1-1 · the pasted list in the type of the prototype', () => {
    it('the field of the artist styles its own input only, never the lines of the list', () => {
        const descendant = [...selectors(computer), ...selectors(phone)].filter(sel => /^\.home-field input\b/.test(sel))
        expect(descendant).toEqual([])
        expect(declarations(computer, '.home-field > input').font).toBe("600 18px 'Syne', sans-serif")
    })

    it('a line: Syne 15/400 on the computer, the text face 16/400 on the phone', () => {
        expect(declarations(computer, '.home-line__text').font).toBe("400 15px 'Syne', sans-serif")
        expect(declarations(phone, '.home-line__text', { inPhone: true }).font).toBe('400 16px var(--phone-font-text)')
    })

    it('the line that stays to fix: Syne 18/600 straight on the red band, no outlined box (the system face 16/600 on the phone)', () => {
        const skip = declarations(computer, '.home-line.is-skip .home-line__text')
        expect(skip.font).toBe("600 18px 'Syne', sans-serif")
        expect(skip.border).toBe('0')
        expect(declarations(phone, '.home-line.is-skip .home-line__text', { inPhone: true }).font).toBe('600 16px var(--phone-font-text)')
    })

    it('a line too long for its field ends in «…»', () => {
        expect(declarations(computer, '.home-line__text')['text-overflow']).toBe('ellipsis')
    })
})

describe('P1-2 · the phone bar while creating keeps its height', () => {
    it('the small equalizer sits on the line of «Saving your series…»: no margin, 14 px high', () => {
        const mini = declarations(phone, '.home-dock .home-eq--mini', { inPhone: true })
        expect(mini.margin).toBe('0')
        expect(mini.height).toBe('14px')
        expect(declarations(phone, '.home-dock .home-busy', { inPhone: true }).display).toBe('inline-flex')
    })
})

describe('P2-6 · the second row of covers where the prototype has it', () => {
    it('the year runs in the line of the card (inline, as the prototype): the card is as tall as there', () => {
        expect(declarations(computer, '.home-card__year').display).toBe('inline')
    })
})

describe('P2 · words that are not cut', () => {
    it('«Not saved: the connection dropped» wraps on the phone', () => {
        expect(declarations(phone, '.home-dock .home-fail', { inPhone: true })['white-space']).toBe('normal')
    })

    it('in the phone sheet a title is cut on one line with «…», as the prototype does', () => {
        expect(declarations(phone, '#homeSeriesSheet .home-rt strong', { inPhone: true })['white-space']).toBe('nowrap')
        expect(declarations(phone, '#homeSeriesSheet .home-rt strong', { inPhone: true })['text-overflow']).toBe('ellipsis')
    })
})
