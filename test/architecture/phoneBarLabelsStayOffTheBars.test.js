// @vitest-environment node
/**
 * F88 (the owner's finding on his iPhone, 2026-11-21: «Na prévia do menu no cel, os copies dos menus estão em cima das
 * barras de gráficos»; and the same day: «Os menus não eram pra ser iguais?»). The phone's bottom menu is ONE component in
 * the home and in the app, and every rule that draws it lives in ONE place, public/splash/bar-menu.css, scoped by `.pbar`
 * (the class both pages put on the bottom bar). In the BUILT page the stylesheet Vite makes from that file comes AFTER the
 * home's inline <style>, so a phone rule of the home that only matched a rule of bar-menu.css in specificity lost to it and
 * the labels went up onto the row of bars. Guards:
 *  1. the home's own style writes NO rule of the bar on the phone (nothing to lose to, nothing to drift);
 *  2. every phone rule of the bar in bar-menu.css is scoped by `.pbar`, so it wins over the desktop rules;
 *  3. the labels start below the row of bars by construction (padding of the stop), never by a fixed height.
 * The real proof is in a browser engine: test/visual/phoneBarLabels.mjs runs it in WebKit (iPhone profiles) on the BUILT site.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const read = (file) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8')
const phoneRulesOf = (text) => [...text.matchAll(/@media \(max-width:899px\)\{([\s\S]*?)\n\}/g)].map(m => m[1]).flatMap(block => block.split('\n')).map(line => line.trim()).filter(line => line.includes('{'))
const aboutTheBar = (line) => /(^|[ ,])(\.ms(?![\w-])|\.eqbar|\.pbar|\.stop|\.thread)/.test(line)

const homeRules = phoneRulesOf(read('public/splash.html')).filter(aboutTheBar)
const sharedRules = phoneRulesOf(read('public/splash/bar-menu.css'))

describe('the phone\'s bottom bar does not depend on the order of the stylesheets', () => {
    it('the home writes no rule of the bar on the phone but showing it: the shared stylesheet is the only source', () => {
        expect(homeRules.filter(rule => !/^(\.thread\{display:block\}|html:not\(\.js\) \.thread\{display:none\})$/.test(rule))).toEqual([])
    })

    it('finds the rules it is about in the shared stylesheet', () => {
        expect(sharedRules.length).toBeGreaterThanOrEqual(6)
    })

    it.each(sharedRules.map(rule => [rule]))('%s is scoped by .pbar', (rule) => {
        expect(rule.startsWith('.pbar')).toBe(true)
    })

    it('the stop leaves room above its icon and label for the row of bars: padding, not a fixed height', () => {
        const stop = sharedRules.find(rule => rule.startsWith('.pbar .ms .stop{'))
        expect(stop).toMatch(/padding:\s*2[6-9]px 0/)
        expect(stop).not.toMatch(/[^-]height:\s*\d+px/)
    })
})
