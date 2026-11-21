// @vitest-environment node
/**
 * F88 (the owner's finding on his iPhone, 2026-11-21: «Na prévia do menu no cel, os copies dos menus estão em cima das
 * barras de gráficos»). In the BUILT page the stylesheet Vite makes from public/splash/bar-menu.css comes AFTER the home's
 * inline <style>, so a rule of the home that only matches the specificity of a rule of bar-menu.css lost to it on the phone:
 * the labels went up onto the row of bars. Two guards:
 *  1. every rule the home writes for its bottom bar (the `.thread`) is scoped by `.thread`, so it wins whatever the order;
 *  2. the labels start below the row of bars by construction (padding of the stop), never by a fixed height.
 * The real proof is in a browser engine: test/visual/phoneBarLabels.mjs runs it in WebKit (iPhone profiles) on the BUILT site.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const home = fs.readFileSync(path.resolve(process.cwd(), 'public/splash.html'), 'utf8')
const phoneBlocks = [...home.matchAll(/@media \(max-width:899px\)\{([\s\S]*?)\n\}/g)].map(m => m[1])
const barRules = phoneBlocks.flatMap(block => block.split('\n')).map(line => line.trim()).filter(line => /(^|[ ,])(\.ms(?![\w-])|\.eqbar)/.test(line) && line.includes('{'))

describe('the home\'s bottom bar on the phone does not depend on the order of the stylesheets', () => {
    it('finds the rules it is about', () => {
        expect(barRules.length).toBeGreaterThanOrEqual(3)
    })

    it.each(barRules.map(rule => [rule]))('%s is scoped by .thread', (rule) => {
        expect(rule.startsWith('.thread ')).toBe(true)
    })

    it('the stop leaves room above its label for the row of bars: padding, not a fixed height', () => {
        const stop = barRules.find(rule => rule.startsWith('.thread .ms .stop{'))
        expect(stop).toMatch(/padding:\s*3[0-9]px 0/)
        expect(stop).not.toMatch(/[^-]height:\s*\d+px/)
    })
})
