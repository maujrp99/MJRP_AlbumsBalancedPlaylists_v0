// The golden corpus of the shared core (F78, TASK-04 and TASK-05).
//
//   node scripts/golden-core.mjs            Node runs the rules over the corpus and compares the
//                                           output with the reference, byte for byte (exit 1 if not)
//   node scripts/golden-core.mjs --write    writes the reference: after a REVIEWED change of a rule;
//                                           the diff of test/fixtures/golden-core/reference/cases.tsv
//                                           says which cases changed
//   node scripts/golden-core.mjs --hermes   the same corpus on Hermes, the engine of React Native
//                                           (optional: needs the engine, see below)
//
// The suite does the first one on every run (test/architecture/goldenCoreUnchanged.test.js).
// The corpus: test/fixtures/golden-core/inputs/ (the inputs the repository's own tests passed to the
// rules, recorded by spike S1; 28 public catalog albums; hand-made albums with accents, non-Latin
// scripts, ties, gaps, empty albums; tracks with no id). No data of the owner.
//
// --hermes needs, once, the engine the spike downloads (25 MB from Maven Central, sha256 checked)
// and its small host, built with the Command Line Tools' clang:
//   cd spikes/f78-s1-core-on-hermes && npm install && sh scripts/get-hermes.sh
// It bundles the corpus and the rules with esbuild into one file with no module system (the build
// fails if it reaches a Node module), wires the id port with a stand-in generator (bare Hermes has
// no crypto), runs it on Hermes from source and, when hermesc is there, as bytecode, and prints
// «N of N match» for each. It never runs in the suite.
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire, builtinModules, registerHooks } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SHARED = path.join(ROOT, 'shared')
const SPIKE = path.join(ROOT, 'spikes/f78-s1-core-on-hermes')
const HERMES_RUN = path.join(SPIKE, 'node_modules/.s1-build/hermes-run')
const HERMESC = path.join(SPIKE, 'node_modules/hermes-compiler/hermesc/osx-bin/hermesc')
const BUILD = path.join(SPIKE, 'node_modules/.golden-core')

// The site's modules import `@shared/…` (an alias of Vite and Vitest): map it to shared/, as Vite does
registerHooks({
    resolve(specifier, context, nextResolve) {
        if (specifier.startsWith('@shared/')) {
            return nextResolve(pathToFileURL(path.join(SHARED, specifier.slice('@shared/'.length))).href, context)
        }
        return nextResolve(specifier, context)
    }
})
const golden = await import('../test/fixtures/golden-core/run/golden.js')

const say = (text) => process.stdout.write(`${text}\n`)
const matchLine = (name, reference, output) => {
    const diff = golden.compareText(reference, output)
    const equal = diff.cases - diff.differentCases.length - diff.onlyInReference.length
    say(`${name}: ${equal} of ${diff.cases} match${diff.identical ? ', byte for byte' : ''}`)
    if (!diff.identical) {
        say(`  different: ${diff.differentCases.length}, missing: ${diff.onlyInReference.length}, extra: ${diff.onlyInOther.length}`)
        diff.differentCases.slice(0, 20).forEach(id => say(`  - ${id}`))
    }
    return diff.identical
}

async function hermes(reference) {
    if (!fs.existsSync(HERMES_RUN)) {
        say(`No Hermes here (${path.relative(ROOT, HERMES_RUN)}). Get it once:\n  cd spikes/f78-s1-core-on-hermes && npm install && sh scripts/get-hermes.sh`)
        return 2
    }
    const esbuild = createRequire(path.join(SPIKE, 'package.json'))('esbuild')
    fs.mkdirSync(BUILD, { recursive: true })
    // The entry: the JSON inputs inside the bundle, the stand-in id source, the same harness and runner
    const imports = golden.extractedFileNames().map((f, i) => `import x${i} from ${JSON.stringify(path.join(golden.EXTRACTED, f))}`)
    const run = path.join(golden.GOLDEN, 'run')
    const entry = path.join(BUILD, 'entry.js')
    fs.writeFileSync(entry, [
        ...imports,
        `import m1 from ${JSON.stringify(golden.MEASURED[0])}`,
        `import m2 from ${JSON.stringify(golden.MEASURED[1])}`,
        `import { runCore, goldenText } from ${JSON.stringify(path.join(run, 'runCore.js'))}`,
        `import { installHarness } from ${JSON.stringify(path.join(run, 'harness.js'))}`,
        `import { standInIdSource } from ${JSON.stringify(path.join(run, 'idStandIn.js'))}`,
        `import { setIdSource } from ${JSON.stringify(path.join(SHARED, 'platform/newId.js'))}`,
        'setIdSource(standInIdSource())',
        'installHarness()',
        `print(goldenText(runCore({ extractedFiles: [${imports.map((_, i) => `x${i}`).join(', ')}], measured1: m1, measured2: m2 })).slice(0, -1))`
    ].join('\n'))
    const NODE_BUILTINS = new Set(builtinModules.flatMap(m => [m, `node:${m}`]))
    const bundle = path.join(BUILD, 'core.golden.js')
    await esbuild.build({
        entryPoints: [entry], bundle: true, format: 'iife', platform: 'neutral', target: 'esnext', charset: 'utf8',
        alias: { '@shared': SHARED }, outfile: bundle, logLevel: 'error',
        plugins: [{
            name: 'no-node',
            setup(build) {
                build.onResolve({ filter: /.*/ }, (args) => (args.path.startsWith('node:') || NODE_BUILTINS.has(args.path)
                    ? { errors: [{ text: `Node built-in reached: "${args.path}" from ${args.importer}` }] } : null))
            }
        }]
    })
    const runs = [['Hermes, source', bundle]]
    if (fs.existsSync(HERMESC)) {
        const hbc = path.join(BUILD, 'core.golden.hbc')
        const c = spawnSync(HERMESC, ['-O', '-emit-binary', '-out', hbc, bundle], { encoding: 'utf8' })
        if (c.status === 0) runs.push(['Hermes, bytecode (hermesc -O)', hbc])
        else say(`hermesc failed: ${c.stderr.slice(0, 300)}`)
    }
    let allEqual = true
    for (const [name, file] of runs) {
        const r = spawnSync(HERMES_RUN, [file], { encoding: 'utf8', maxBuffer: 1 << 30 })
        if (r.status !== 0) { say(`${name}: exit ${r.status} — ${r.stderr.split('\n')[0]}`); allEqual = false; continue }
        allEqual = matchLine(name, reference, r.stdout) && allEqual
    }
    return allEqual ? 0 : 1
}

const mode = process.argv[2] || '--check'
if (mode === '--write') {
    const output = golden.runOnThisEngine()
    golden.writeReference(output)
    say(`wrote ${path.relative(ROOT, golden.REFERENCE)} (${fs.statSync(golden.REFERENCE).size} bytes) and ${path.relative(ROOT, golden.CASES)}`)
} else if (mode === '--check') {
    process.exitCode = matchLine('Node', golden.readReference(), golden.runOnThisEngine()) ? 0 : 1
} else if (mode === '--hermes') {
    process.exitCode = await hermes(golden.readReference())
} else {
    say('usage: node scripts/golden-core.mjs [--check | --write | --hermes]')
    process.exitCode = 2
}
