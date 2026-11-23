// The weight budget of what the browser downloads (F83, REQ-07, REQ-10; proposal § 11), read over the build.
//
//   node scripts/bundle-budget.mjs [dist] [--budget file] [--json]
//
//   dist      the built site (default: dist/); the app is dist/app.html and the entry page dist/index.html
//   --budget  the ceilings (default: scripts/bundle-budget.json); the numbers and why are there
//   --json    print the report as JSON
//
// Exit: 0 inside the budget · 1 over it (each failure on stderr) · 2 dist/ is not a build (or the budget cannot be read).
// Used by scripts/deploy-site.sh (verify_build), which refuses to publish a build over the budget, and by the tests
// (test/scripts/bundleBudget.test.js).
//
// The weights are gzip bytes (zlib, level 6, the `gzip` default), the way the browser downloads them: a 30,000 B ceiling
// means 30,000 B on the wire. The rules:
//   1. the main script (the one app.html names) is under its ceiling, which only goes down from one wave to the next;
//   2. React is in ONE file of its own (`react-vendor-*.js`), under its ceiling;
//   3. until the shell is in React (`reactAtStart: false`), React is not loaded at the start: the main script has no static
//      import of it and neither page names it. It comes with the first React screen. From wave 3 it is loaded at the start;
//   4. every other file is under the alarm of a screen, unless it is on `allowed` with the reason;
//   5. what comes AFTER the first screen (React and the screens, not the entry page's script nor what `allowed` names) stays
//      inside: the main script of today + the ceiling of React + `background`.
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DEFAULT_BUDGET = path.join(ROOT, 'scripts/bundle-budget.json')
const REACT_VENDOR = /^react-vendor-.*\.js$/

/** gzip bytes of a file, the level `gzip` uses. */
export const gzipSize = (file) => zlib.gzipSync(fs.readFileSync(file), { level: 6 }).length

/** "main-Cp3Nsp6i.js" -> "main"; "react-vendor-AbCd1234.js" -> "react-vendor". The hash Vite adds is 8 characters. */
export function baseName(file) {
    const eight = file.match(/^(.*)-[A-Za-z0-9_-]{8}\.(?:js|css)$/)
    if (eight) return eight[1]
    return file.replace(/-[A-Za-z0-9_]+\.(?:js|css)$/, '')
}

/** The main script a page names (the first script under /assets/). */
export function mainScriptOf(html) {
    const found = String(html || '').match(/<script[^>]*src="\/assets\/([^"]+\.js)"/)
    return found ? found[1] : null
}

/** Sorts the files of dist/assets: the main script, React, the stylesheets, and every other script (screens and pieces). */
export function classifyFiles(names, mainFile) {
    return {
        main: mainFile,
        reactVendor: names.filter(name => REACT_VENDOR.test(name)),
        styles: names.filter(name => name.endsWith('.css')),
        screens: names.filter(name => name.endsWith('.js') && name !== mainFile && !REACT_VENDOR.test(name))
    }
}

const STATIC_IMPORT_OF_REACT = /(?:\bfrom\s*|\bimport\s*)["']\.\/react-vendor-[^"']*["']/

/**
 * Judges a build against the budget. Pure: the files come as `{ name: entry }` and `sizeOf(name, entry)` gives the gzip bytes.
 * @param {Object} build
 * @param {string} build.appHtml - the text of dist/app.html
 * @param {string} build.indexHtml - the text of dist/index.html (the entry page)
 * @param {Record<string, { text?: string }>} build.files - the files of dist/assets
 * @param {Object} build.budget - scripts/bundle-budget.json
 * @param {(name: string, entry: object) => number} build.sizeOf
 * @returns {{ ok: boolean, failures: string[], report: object }}
 */
export function checkBudget({ appHtml, indexHtml, files, budget, sizeOf }) {
    const failures = []
    const names = Object.keys(files)
    const mainFile = mainScriptOf(appHtml)
    if (!mainFile) return { ok: false, failures: ['app.html names no main script under /assets/'], report: {} }
    if (!files[mainFile]) return { ok: false, failures: [`${mainFile} is not in dist/assets`], report: {} }

    const classes = classifyFiles(names, mainFile)
    const size = (name) => sizeOf(name, files[name])
    const over = (name, limit, what = '') => size(name) > limit && failures.push(`${name} is ${size(name)} B, over ${limit} B${what}`)

    over(mainFile, budget.main)

    const vendorBytes = classes.reactVendor.reduce((sum, name) => sum + size(name), 0)
    if (classes.reactVendor.length !== 1) failures.push(`exactly one react-vendor file was expected, there are ${classes.reactVendor.length}${classes.reactVendor.length ? `: ${classes.reactVendor.join(', ')}` : ''}`)
    classes.reactVendor.forEach(name => over(name, budget.reactVendor))

    if (!budget.reactAtStart) {
        if (STATIC_IMPORT_OF_REACT.test(files[mainFile].text || '')) failures.push(`the main script imports react-vendor at the start: React must come with the first React screen only`)
        if (/react-vendor/.test(appHtml)) failures.push('app.html names react-vendor: React must not be loaded before a React screen opens')
        if (/react-vendor/.test(indexHtml || '')) failures.push('index.html (the entry page) names react-vendor: the entry page does not use React')
    }

    const entryScript = mainScriptOf(indexHtml)
    const counted = classes.screens.filter(name => !(baseName(name) in budget.allowed))
    for (const name of counted.filter(file => size(file) > budget.screen)) {
        failures.push(`${name} is ${size(name)} B, over the ${budget.screen} B alarm of a screen (put it on "allowed" with the reason, or split it)`)
    }

    const afterFirstScreen = vendorBytes + counted.filter(name => name !== entryScript).reduce((sum, name) => sum + size(name), 0)
    const afterCap = budget.mainToday + budget.reactVendor + budget.background
    if (size(mainFile) + afterFirstScreen > afterCap) {
        failures.push(`the main script (${size(mainFile)} B) and what is downloaded after the first screen (${afterFirstScreen} B) are over ${afterCap} B: the main script of today + React + the allowance of ${budget.background} B`)
    }

    const biggestScreen = Math.max(0, ...counted.filter(name => name !== entryScript).map(size))
    const firstScreen = size(mainFile) + biggestScreen + (budget.reactAtStart ? vendorBytes : 0)
    const firstScreenCap = budget.main + budget.screen + (budget.reactAtStart ? budget.reactVendor : 0)
    if (firstScreen > firstScreenCap) failures.push(`to see the first screen the browser downloads ${firstScreen} B, over ${firstScreenCap} B`)

    const report = {
        main: { file: mainFile, gzip: size(mainFile) },
        reactVendor: { files: classes.reactVendor, gzip: vendorBytes },
        screens: classes.screens.map(file => ({ file, gzip: size(file), allowed: baseName(file) in budget.allowed })),
        styles: classes.styles.map(file => ({ file, gzip: size(file) })),
        background: afterFirstScreen,
        firstScreen,
        limits: { main: budget.main, reactVendor: budget.reactVendor, screen: budget.screen, afterCap, firstScreenCap }
    }
    return { ok: failures.length === 0, failures, report }
}

function readBuild(dist) {
    const assets = path.join(dist, 'assets')
    if (!fs.existsSync(path.join(dist, 'app.html')) || !fs.existsSync(assets)) return null
    const names = fs.readdirSync(assets).filter(name => name.endsWith('.js') || name.endsWith('.css'))
    const appHtml = fs.readFileSync(path.join(dist, 'app.html'), 'utf8')
    const mainFile = mainScriptOf(appHtml)
    const files = Object.fromEntries(names.map(name => [name, {
        path: path.join(assets, name),
        text: name === mainFile ? fs.readFileSync(path.join(assets, name), 'utf8') : undefined
    }]))
    const indexHtml = fs.existsSync(path.join(dist, 'index.html')) ? fs.readFileSync(path.join(dist, 'index.html'), 'utf8') : ''
    return { appHtml, indexHtml, files }
}

function printReport({ report }) {
    const line = (label, file, bytes, limit = '') => console.log(`${label.padEnd(14)}${String(file).padEnd(44)}${String(bytes).padStart(9)} B${limit ? `   (ceiling ${limit} B)` : ''}`)
    line('main script', report.main.file, report.main.gzip, report.limits.main)
    line('react-vendor', report.reactVendor.files.join(', ') || '-', report.reactVendor.gzip, report.limits.reactVendor)
    for (const screen of report.screens) line(screen.allowed ? 'file (listed)' : 'file', screen.file, screen.gzip, screen.allowed ? '' : report.limits.screen)
    for (const style of report.styles) line('stylesheet', style.file, style.gzip)
    line('after 1st', 'React + screens, downloaded after the first screen', report.background)
    line('1st screen', 'main script + the biggest screen', report.firstScreen, report.limits.firstScreenCap)
}

function main(argv) {
    const args = argv.slice(2)
    const flag = (name) => args.includes(name) ? args[args.indexOf(name) + 1] : null
    const json = args.includes('--json')
    const dist = path.resolve(args.find((arg, index) => !arg.startsWith('--') && args[index - 1] !== '--budget') || path.join(ROOT, 'dist'))
    let budget
    try { budget = JSON.parse(fs.readFileSync(flag('--budget') || DEFAULT_BUDGET, 'utf8')) } catch (error) {
        console.error(`bundle-budget: the budget cannot be read: ${error.message}`)
        return 2
    }
    const build = readBuild(dist)
    if (!build) {
        console.error(`bundle-budget: ${dist} is not a build (no app.html or assets/): run \`npx vite build\` first`)
        return 2
    }
    const result = checkBudget({ ...build, budget, sizeOf: (name, entry) => gzipSize(entry.path) })
    if (json) console.log(JSON.stringify(result.report, null, 2))
    else if (result.report.main) printReport(result)
    result.failures.forEach(failure => console.error(`bundle-budget: ${failure}`))
    if (!json) console.log(result.ok ? 'bundle-budget: inside the budget' : `bundle-budget: OVER THE BUDGET (${result.failures.length})`)
    return result.ok ? 0 : 1
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exit(main(process.argv))
