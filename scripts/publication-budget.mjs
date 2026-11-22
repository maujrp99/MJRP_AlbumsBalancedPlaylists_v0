// The weight budget measured on a build shaped like the PUBLISHED one (F83; wave 7b judge, P1-2).
//
//   node scripts/publication-budget.mjs [--out <folder>] [--json]
//
// Why: scripts/lib/site-build.sh checks the budget on the build made with the .env copied in, and that build carries values a plain
// `vite build` does not: the Spotify client id, the PostHog project key and host. They are inlined in the main script (SpotifyAuthService reads
// import.meta.env.VITE_SPOTIFY_CLIENT_ID; usageWiring takes the whole of import.meta.env, so every VITE_ value of the build goes in). A ceiling set on a
// build without them is too tight for the published one and publication is refused. The Firebase web configuration is NOT among them: it is copied as
// a file (public/js/firebase-config.js), not bundled.
//
// What this does: builds the site with STAND-IN values of the same length class as each key (deterministic, from a fixed seed, held only in the
// environment of the build: no real key is read, no value is written to any file), then runs scripts/bundle-budget.mjs's check against the budget AND
// demands the declared margin: each ceiling must have at least `publication.margin` bytes over what this build measures. Exit 0 inside, 1 outside.
//
// The rule (scripts/bundle-budget.json -> publication): ceilings are set on THIS build, plus the margin. The numbers measured are written there
// (`publication.measured`) and a unit test (test/scripts/publicationBudget.test.js) fails when a ceiling has less than the margin over them.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { checkBudget, gzipSize, mainScriptOf } from './bundle-budget.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BUDGET_FILE = path.join(ROOT, 'scripts/bundle-budget.json')
const BASE62 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

/** Bytes of a fixed seed, endless: the same stand-ins on every run, so the numbers measured can be reproduced. */
function* seeded(label) {
    for (let block = 0; ; block++) yield* crypto.createHash('sha256').update(`${label}:${block}`).digest()
}

/**
 * The stand-in value of each key the published build carries, by its length class (`publication.standIns` of the budget: name -> length).
 * Shapes: the Spotify client id is hex; the PostHog key is `phc_` + base62; the PostHog host is the EU ingestion host (the US one has the same length).
 * Anything else named is base62 of the length asked. These are not keys of anything.
 */
export function standIns(lengths) {
    const values = {}
    for (const [name, length] of Object.entries(lengths)) {
        const bytes = seeded(name)
        const draw = (alphabet, count) => Array.from({ length: count }, () => alphabet[bytes.next().value % alphabet.length]).join('')
        if (name === 'VITE_POSTHOG_HOST') values[name] = 'https://eu.i.posthog.com'.padEnd(length, 'x').slice(0, length)
        else if (name === 'VITE_POSTHOG_KEY') values[name] = `phc_${draw(BASE62, length - 4)}`
        else if (name === 'VITE_SPOTIFY_CLIENT_ID') values[name] = draw('0123456789abcdef', length)
        else values[name] = draw(BASE62, length)
    }
    return values
}

/** The failures of the margin: each ceiling must be at least `margin` bytes over what the publication-shaped build measures. Pure. */
export function marginFailures(report, budget, margin = budget.publication.margin) {
    const failures = []
    const main = report.main.gzip
    if (budget.main - main < margin) failures.push(`the main script is ${main} B on the publication-shaped build; its ceiling (${budget.main} B) has ${budget.main - main} B over it, less than the margin of ${margin} B`)
    const afterCap = budget.mainToday + budget.reactVendor + budget.background
    const sum = main + report.background
    if (afterCap - sum < margin) failures.push(`the main script and what comes after the first screen are ${sum} B on the publication-shaped build; the cap (${afterCap} B) has ${afterCap - sum} B over it, less than the margin of ${margin} B`)
    const vendor = report.reactVendor.gzip
    if (budget.reactVendor - vendor < 0) failures.push(`react-vendor is ${vendor} B, over its ceiling of ${budget.reactVendor} B`)
    return failures
}

function main(argv) {
    const args = argv.slice(2)
    const out = path.resolve(args.includes('--out') ? args[args.indexOf('--out') + 1] : fs.mkdtempSync(path.join(os.tmpdir(), 'mjrp-publication-budget-')))
    const budget = JSON.parse(fs.readFileSync(BUDGET_FILE, 'utf8'))
    const env = { ...process.env, ...standIns(budget.publication.standIns) }
    delete env.VITE_USAGE_MEASUREMENT // the measurement stays ON in the published build: the switch is not set
    const built = spawnSync('npx', ['vite', 'build', '--outDir', out, '--emptyOutDir'], { cwd: ROOT, env, encoding: 'utf8' })
    if (built.status !== 0) { console.error(built.stdout, built.stderr); console.error('publication-budget: the build failed'); return 2 }

    const assets = path.join(out, 'assets')
    const names = fs.readdirSync(assets).filter(name => name.endsWith('.js') || name.endsWith('.css'))
    const appHtml = fs.readFileSync(path.join(out, 'app.html'), 'utf8')
    const mainFile = mainScriptOf(appHtml)
    const files = Object.fromEntries(names.map(name => [name, { path: path.join(assets, name), text: name === mainFile ? fs.readFileSync(path.join(assets, name), 'utf8') : undefined }]))
    const indexHtml = fs.readFileSync(path.join(out, 'index.html'), 'utf8')
    const result = checkBudget({ appHtml, indexHtml, files, budget, sizeOf: (name, entry) => gzipSize(entry.path) })
    const failures = [...result.failures, ...(result.report.main ? marginFailures(result.report, budget) : [])]

    const lengths = Object.entries(budget.publication.standIns).map(([name, length]) => `${name} ${length}`).join(', ')
    if (args.includes('--json')) console.log(JSON.stringify({ standInLengths: budget.publication.standIns, report: result.report, failures }, null, 2))
    else {
        console.log(`publication-shaped build (stand-ins by length: ${lengths}) in ${out}`)
        console.log(`main script            ${result.report.main.gzip} B   (ceiling ${budget.main} B, margin ${budget.publication.margin} B)`)
        console.log(`after the first screen ${result.report.background} B`)
        console.log(`main + after           ${result.report.main.gzip + result.report.background} B   (cap ${budget.mainToday + budget.reactVendor + budget.background} B)`)
        console.log(`react-vendor           ${result.report.reactVendor.gzip} B   (ceiling ${budget.reactVendor} B)`)
    }
    failures.forEach(failure => console.error(`publication-budget: ${failure}`))
    if (!args.includes('--json')) console.log(failures.length ? `publication-budget: OVER (${failures.length})` : 'publication-budget: inside the budget, with the margin')
    return failures.length ? 1 : 0
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exit(main(process.argv))
