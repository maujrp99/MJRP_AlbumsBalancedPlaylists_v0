// @vitest-environment node
/**
 * F83 TASK-08 (REQ-07, REQ-10): the budget of what the browser downloads, read over dist/ (scripts/bundle-budget.mjs).
 * The rules: the main script does not pass its ceiling; React is in one file of its own (exactly one) under its ceiling and
 * is not loaded at the start (no static import from the main script, no tag in the page) until the shell is React; each
 * other file is under the alarm of a screen, unless it is on the list with its reason; what is downloaded in the
 * background after the first screen stays inside the allowance. The weights are gzip bytes (zlib, level 6).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { checkBudget, classifyFiles, gzipSize } from '../../scripts/bundle-budget.mjs'

const BUDGET = {
    main: 1000,
    mainToday: 900,
    reactVendor: 500,
    screen: 200,
    background: 200,
    reactAtStart: false,
    allowed: { posthogAdapter: 'F77: loaded only with a project key' }
}

/** A dist/ in memory: the pages and the files of assets with the gzip size each one should have. */
const dist = (overrides = {}) => ({
    appHtml: '<html><script type="module" src="/assets/main-AAA.js"></script></html>',
    indexHtml: '<html><script type="module" src="/assets/splash-BBB.js"></script></html>',
    files: {
        'main-AAA.js': { gzip: 900, text: 'console.log(1)' },
        'react-vendor-CCC.js': { gzip: 450, text: 'react' },
        'ComingSoon-DDD.js': { gzip: 40, text: 'screen' },
        'SavedPlaylistsView-EEE.js': { gzip: 150, text: 'screen' },
        'splash-BBB.js': { gzip: 50, text: 'splash' },
        'posthogAdapter-FFF.js': { gzip: 9000, text: 'ph' },
        'main-GGG.css': { gzip: 300, text: 'css' }
    },
    ...overrides
})
const without = (files, name) => Object.fromEntries(Object.entries(files).filter(([file]) => file !== name))
const verdict = (made, budget = BUDGET) => checkBudget({ ...made, budget, sizeOf: (file, entry) => entry.gzip })

describe('the weight budget of dist/ (F83)', () => {
    it('a build inside the budget passes, and the report carries the numbers', () => {
        const { ok, failures, report } = verdict(dist())
        expect(failures).toEqual([])
        expect(ok).toBe(true)
        expect(report.main).toEqual({ file: 'main-AAA.js', gzip: 900 })
        expect(report.reactVendor).toEqual({ files: ['react-vendor-CCC.js'], gzip: 450 })
        expect(report.screens.map(screen => screen.file).sort()).toEqual(['ComingSoon-DDD.js', 'SavedPlaylistsView-EEE.js', 'posthogAdapter-FFF.js', 'splash-BBB.js'])
        expect(report.screens.find(screen => screen.file === 'posthogAdapter-FFF.js').allowed).toBe(true)
        expect(report.background).toBe(450 + 40 + 150) // React and the screens; not the entry page's script, not what is listed
    })

    it('the main script over its ceiling is refused', () => {
        const files = { ...dist().files, 'main-AAA.js': { gzip: 1001, text: 'x' } }
        expect(verdict(dist({ files })).failures.join('\n')).toMatch(/main-AAA\.js is 1001 B, over 1000 B/)
    })

    it('React in two files, or in none, is refused: it must be exactly one', () => {
        const two = { ...dist().files, 'react-vendor-ZZZ.js': { gzip: 10, text: 'react' } }
        expect(verdict(dist({ files: two })).failures.join('\n')).toMatch(/exactly one react-vendor/)
        expect(verdict(dist({ files: without(dist().files, 'react-vendor-CCC.js') })).failures.join('\n')).toMatch(/exactly one react-vendor/)
    })

    it('React over its ceiling is refused', () => {
        const files = { ...dist().files, 'react-vendor-CCC.js': { gzip: 501, text: 'react' } }
        expect(verdict(dist({ files })).failures.join('\n')).toMatch(/react-vendor-CCC\.js is 501 B, over 500 B/)
    })

    it('a screen over the alarm is refused, unless it is on the list with its reason', () => {
        const big = { ...dist().files, 'InventoryView-HHH.js': { gzip: 201, text: 'screen' } }
        expect(verdict(dist({ files: big })).failures.join('\n')).toMatch(/InventoryView-HHH\.js is 201 B, over the 200 B alarm of a screen/)
        const listed = verdict(dist({ files: big }), { ...BUDGET, allowed: { ...BUDGET.allowed, InventoryView: 'the biggest screen, judged in wave 6' } })
        expect(listed.failures.join('\n')).not.toMatch(/InventoryView/)
        expect(verdict(dist()).failures).toEqual([]) // posthogAdapter is 9000 B and is on the list
    })

    it('React loaded at the start is refused while the shell is hand-made: a static import from the main script, or a tag in the page', () => {
        const imports = { ...dist().files, 'main-AAA.js': { gzip: 900, text: 'import{r as a}from"./react-vendor-CCC.js";a()' } }
        expect(verdict(dist({ files: imports })).failures.join('\n')).toMatch(/main script imports react-vendor/)
        const tagged = dist({ appHtml: '<html><script type="module" src="/assets/main-AAA.js"></script><link rel="modulepreload" href="/assets/react-vendor-CCC.js"></html>' })
        expect(verdict(tagged).failures.join('\n')).toMatch(/app\\.html names react-vendor|app\.html names react-vendor/)
        // from wave 3 the shell is React and React is loaded at the start: then it is allowed, and counted in the first screen
        expect(verdict(dist({ files: imports }), { ...BUDGET, reactAtStart: true }).failures.join('\n')).not.toMatch(/imports react-vendor/)
    })

    it('what is downloaded after the first screen has an allowance: the main script of today + the React ceiling + the dictionary', () => {
        const files = { ...dist().files, 'Blend-III.js': { gzip: 190, text: 'screen' }, 'Albums-JJJ.js': { gzip: 190, text: 'screen' } }
        const failures = verdict(dist({ files }), { ...BUDGET, background: 500, mainToday: 900 }).failures.join('\n')
        expect(failures).toMatch(/downloaded after the first screen/)
    })

    it('the page that names no main script, or a main script that is not there, is refused', () => {
        expect(verdict(dist({ appHtml: '<html></html>' })).failures.join('\n')).toMatch(/names no main script/)
        expect(verdict(dist({ appHtml: '<html><script src="/assets/main-NOPE.js"></script></html>' })).failures.join('\n')).toMatch(/main-NOPE\.js is not in dist/)
    })
})

describe('classifyFiles', () => {
    it('tells the main script, React, the screens and the stylesheets apart', () => {
        const classes = classifyFiles(Object.keys(dist().files), 'main-AAA.js')
        expect(classes.reactVendor).toEqual(['react-vendor-CCC.js'])
        expect(classes.styles).toEqual(['main-GGG.css'])
        expect(classes.screens).toContain('ComingSoon-DDD.js')
        expect(classes.screens).not.toContain('main-AAA.js')
    })
})

describe('the command', () => {
    let folder
    beforeEach(() => {
        folder = fs.mkdtempSync(path.join(os.tmpdir(), 'budget-'))
        fs.mkdirSync(path.join(folder, 'assets'))
    })
    afterEach(() => fs.rmSync(folder, { recursive: true, force: true }))

    const put = (name, bytes) => fs.writeFileSync(path.join(folder, 'assets', name), crypto.randomBytes(bytes)) // random: it does not compress
    const run = (...args) => spawnSync('node', ['scripts/bundle-budget.mjs', folder, ...args], { cwd: process.cwd(), encoding: 'utf8' })

    it('measures the real gzip of a file', () => {
        put('a.js', 1000)
        const size = gzipSize(path.join(folder, 'assets', 'a.js'))
        expect(size).toBeGreaterThan(1000)
        expect(size).toBeLessThan(1100)
    })

    it('exits 0 and prints the numbers for a build inside the budget; exits 1 and says why for one outside', () => {
        fs.writeFileSync(path.join(folder, 'app.html'), '<script type="module" src="/assets/main-AAA.js"></script>')
        fs.writeFileSync(path.join(folder, 'index.html'), '<script type="module" src="/assets/splash-BBB.js"></script>')
        put('main-AAA.js', 1000)
        put('splash-BBB.js', 100)
        put('react-vendor-CCC.js', 1000)
        const budget = path.join(folder, 'budget.json')
        fs.writeFileSync(budget, JSON.stringify({ ...BUDGET, main: 5000, mainToday: 5000, reactVendor: 5000, screen: 5000, background: 20000 }))

        const good = run('--budget', budget)
        expect(good.status, good.stdout + good.stderr).toBe(0)
        expect(good.stdout).toMatch(/main script\s+main-AAA\.js\s+10\d\d B/)

        fs.writeFileSync(budget, JSON.stringify({ ...BUDGET, main: 500, mainToday: 500, reactVendor: 5000, screen: 5000, background: 20000 }))
        const bad = run('--budget', budget)
        expect(bad.status).toBe(1)
        expect(bad.stderr).toMatch(/over 500 B/)
    })

    it('exits 2 when dist/ is not a build', () => {
        const nothing = spawnSync('node', ['scripts/bundle-budget.mjs', path.join(folder, 'nowhere')], { cwd: process.cwd(), encoding: 'utf8' })
        expect(nothing.status).toBe(2)
    })
})

describe('the build and the publication use the budget', () => {
    it('Vite puts React and its renderer in a file of their own, named react-vendor', async () => {
        const { default: viteConfig } = await import('../../vite.config.js')
        const manualChunks = viteConfig.build.rollupOptions.output.manualChunks
        expect(manualChunks('/repo/node_modules/react/index.js')).toBe('react-vendor')
        expect(manualChunks('/repo/node_modules/react-dom/client.js')).toBe('react-vendor')
        expect(manualChunks('/repo/node_modules/scheduler/index.js')).toBe('react-vendor')
        expect(manualChunks('/repo/node_modules/firebase/app/dist/index.js')).toBeUndefined()
        expect(manualChunks('/repo/public/js/react-bridge/ReactView.tsx')).toBeUndefined()
    })

    it('the budget check lives in the shared build (scripts/lib/site-build.sh), so the production AND the preview publication run it', () => {
        const shared = fs.readFileSync('scripts/lib/site-build.sh', 'utf8')
        expect(shared).toMatch(/node scripts\/bundle-budget\.mjs "\$dist"/)
        expect(shared).toMatch(/over the weight budget/)
        for (const script of ['scripts/deploy-site.sh', 'scripts/deploy-preview.sh']) {
            const text = fs.readFileSync(script, 'utf8')
            expect(text, script).toMatch(/^verify_build$/m) // each one calls the shared check...
            expect(text, script).not.toMatch(/bundle-budget/) // ...and keeps none of its own: one place
        }
        // the types go with the lint, also shared
        expect(fs.readFileSync('scripts/lib/deploy-common.sh', 'utf8')).toMatch(/npm run typecheck --silent && npx eslint \. --quiet/)
        for (const script of ['scripts/deploy-site.sh', 'scripts/deploy-preview.sh']) expect(fs.readFileSync(script, 'utf8'), script).toMatch(/^run_lint$/m)
    })

    it('the budget file has the ceilings', () => {
        const budget = JSON.parse(fs.readFileSync('scripts/bundle-budget.json', 'utf8'))
        for (const key of ['main', 'mainToday', 'reactVendor', 'screen', 'background']) expect(budget[key], key).toBeGreaterThan(0)
        expect(typeof budget.reactAtStart).toBe('boolean')
        for (const [chunk, reason] of Object.entries(budget.allowed)) expect(reason.length, chunk).toBeGreaterThan(10)
    })
})
