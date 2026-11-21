// @vitest-environment node
/**
 * F88 (the judge's P2-1 and P2-3): the bar of the top menu sits in the SAME place in the home and in the app,
 * whatever the account: centred on the PAGE (not pinned to the mark, not pushed by the account side), with ONE
 * width that depends only on the width of the screen (`--bar-w`, public/splash/bar-menu.css). The two stylesheets
 * that frame it (css/top-menu.css, the app's; splash.html, the home's) must say so in the same words, or the two
 * bars drift. The ⟲ between the two sides is a small box with room on both sides.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const read = (file) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8')
const flat = (text) => text.replace(/\s+/g, '')
const rule = (css, selector) => {
    const at = css.indexOf(`${selector} {`) >= 0 ? css.indexOf(`${selector} {`) : css.indexOf(`${selector}{`)
    expect(at, `${selector} not found`).toBeGreaterThanOrEqual(0)
    return flat(css.slice(at, css.indexOf('}', at)))
}

describe('the bar of the menu is centred on the page, the same in the home and in the app', () => {
    const shared = read('public/splash/bar-menu.css')
    const app = read('public/css/top-menu.css')
    const home = read('public/splash.html')

    it('has one width, a function of the screen only, written once', () => {
        expect(flat(shared)).toMatch(/--bar-w:min\(620px,calc\(100vw-502px\)\)/)
        expect(home).not.toMatch(/--bar-w\s*:/)
        expect(app).not.toMatch(/--bar-w\s*:/)
    })

    it.each([['the app', app, '.top-menu__bar'], ['the home', home, '.ms-desk']])('%s places the bar at the middle of the page, out of the flow of the account side', (_name, css, selector) => {
        const body = rule(css, selector)
        expect(body).toContain('position:absolute')
        expect(body).toContain('left:50%')
        expect(body).toContain('width:var(--bar-w)')
        expect(body).not.toContain('margin:0auto0')
    })

    it('the ⟲ is a narrow box (12 px) with a real gap on each side of it, 7 px at the narrowest bar (judge, second look P2-3)', () => {
        const body = rule(shared, '.ms .flipmark')
        expect(body).toContain('width:12px')
        expect(body).toContain('left:59%')
    })

    it('the bar is the 620 px of the approved v4 and of the Transformar prototype (the owner chose «A», 2026-11-21), giving way only when the sides need the room', () => {
        expect(flat(shared)).toContain('min(620px,')
    })

    it('the home\'s header signed out has only «Entrar»: the main button stays in the page, at every width of the computer', () => {
        expect(home).toMatch(/\n\.top \.acct \.btn-primary\.only-out\{display:none\}/)
        expect(flat(home)).not.toMatch(/@media\(max-width:1279px\)/)
    })
})
