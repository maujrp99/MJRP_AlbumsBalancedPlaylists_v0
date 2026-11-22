// @vitest-environment node
/**
 * F83, wave 7b fix (judge P1-2): the ceilings are measured on a build shaped like the published one (scripts/publication-budget.mjs), with the declared margin.
 *
 * The build itself (a `vite build`) is not run in the unit suite: it takes a long while and the suite has no build. What the suite can hold is the
 * rule: the numbers measured are written in scripts/bundle-budget.json (`publication.measured`) and every ceiling has at least the margin over them;
 * the stand-ins have the length class of each key and are the same on every run; and a build over the margin is refused by the same function the
 * script uses. The script itself, run on the real build, is the proof (reports/evidence/F83/wave-7b/fix-scroll-and-weight/proof.md).
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import { marginFailures, standIns } from '../../scripts/publication-budget.mjs'

const budget = JSON.parse(fs.readFileSync('scripts/bundle-budget.json', 'utf8'))

describe('the ceilings and the publication-shaped build', () => {
    it('declares the margin, the stand-in lengths and what was measured', () => {
        expect(budget.publication.margin).toBeGreaterThanOrEqual(100)
        expect(Object.keys(budget.publication.standIns)).toEqual(['VITE_SPOTIFY_CLIENT_ID', 'VITE_POSTHOG_KEY', 'VITE_POSTHOG_HOST'])
        expect(budget.publication.measured.main).toBeGreaterThan(0)
        expect(budget.publication.measured.afterFirstScreen).toBeGreaterThan(0)
    })

    it('the main ceiling has at least the margin over the main script measured on the publication-shaped build', () => {
        expect(budget.main - budget.publication.measured.main).toBeGreaterThanOrEqual(budget.publication.margin)
    })

    it('the cap of the main script and what comes after has at least the margin over what was measured', () => {
        const cap = budget.mainToday + budget.reactVendor + budget.background
        const measured = budget.publication.measured.main + budget.publication.measured.afterFirstScreen
        expect(cap - measured).toBeGreaterThanOrEqual(budget.publication.margin)
    })

    it('marginFailures judges a build as the rule says: inside with the margin, refused under it', () => {
        const { measured, margin } = budget.publication
        const report = (main, background) => ({ main: { gzip: main }, background, reactVendor: { gzip: budget.reactVendor } })
        expect(marginFailures(report(measured.main, measured.afterFirstScreen), budget)).toEqual([])
        expect(marginFailures(report(budget.main - margin + 1, 1), budget)).toHaveLength(1)
        const sumCap = budget.mainToday + budget.reactVendor + budget.background
        expect(marginFailures(report(1, sumCap - margin + 1), budget)).toHaveLength(1)
        expect(marginFailures(report(budget.main - margin, sumCap - margin - budget.main + margin), budget)).toEqual([])
    })

    it('the stand-ins have the length class of each key, are the same on every run and look like what they stand for', () => {
        const values = standIns(budget.publication.standIns)
        expect(values.VITE_SPOTIFY_CLIENT_ID).toMatch(/^[0-9a-f]{32}$/)
        expect(values.VITE_POSTHOG_KEY).toMatch(/^phc_[A-Za-z0-9]{43}$/)
        expect(values.VITE_POSTHOG_HOST).toHaveLength(24)
        expect(standIns(budget.publication.standIns)).toEqual(values)
    })

    it('the script writes no value to a file: the stand-ins go to the environment of the build only', () => {
        const script = fs.readFileSync('scripts/publication-budget.mjs', 'utf8')
        expect(script).toMatch(/\.\.\.process\.env, \.\.\.standIns\(/)
        expect(script).not.toMatch(/writeFile|appendFile|\.env['"`]/)
    })
})
