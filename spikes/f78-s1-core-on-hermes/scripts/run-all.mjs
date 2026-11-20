// Spike S1 of F78: node scripts/run-all.mjs [--skip-extract] [--patched]
// (npm run spike runs it as-is, then again with --patched: the spike's small rewrites applied)
//
//  1. extract   the repository's own tests of the rules run with a recorder: their inputs become
//               corpus/extracted/*.json (skip with --skip-extract to reuse the committed ones)
//  2. reference Node runs the site's modules unbundled                      -> out/node-reference.json
//  3. bundle    esbuild makes ONE file with no module system; the build FAILS if a node: module
//               or a Node built-in is reached, or a Node global is named
//  4. node-vm   that same bundle on Node, in an EMPTY context (no process, require, Buffer...)
//  5. hermes    that same bundle on the Hermes of React Native 0.88.1:
//               bare (no polyfill), with the crypto stand-in (source), and as bytecode from hermesc
//  6. features  probes of each engine-dependent feature, on Node and on bare Hermes
//  7. diff      byte for byte against the reference                       -> out/summary.json
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { spawnSync } from 'node:child_process'
import { createRequire, builtinModules } from 'node:module'
import { fileURLToPath } from 'node:url'
import zlib from 'node:zlib'
import crypto from 'node:crypto'
import * as esbuild from 'esbuild'
import { PATCHES, applyPatches } from '../src/patches.js'

const HERE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ROOT = path.resolve(HERE, '../..')
const PATCHED = process.argv.includes('--patched')
const OUT = path.join(HERE, PATCHED ? 'out/patched' : 'out')
// Generated files live under node_modules/ so no linter or commit ever sees them
const BUILD = path.join(HERE, PATCHED ? 'node_modules/.s1-build/patched' : 'node_modules/.s1-build')
fs.mkdirSync(OUT, { recursive: true })
fs.mkdirSync(BUILD, { recursive: true })
const HERMES_RUN = path.join(HERE, 'node_modules/.s1-build/hermes-run')
const HERMESC = path.join(HERE, 'node_modules/hermes-compiler/hermesc/osx-bin/hermesc')

const step = (name) => console.log(`\n== ${name}`)
const sh = (cmd, args, opts = {}) => {
    const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 1 << 30, ...opts })
    if (r.error) throw r.error
    return r
}

// 0. the engine
if (!fs.existsSync(HERMES_RUN)) {
    step('get Hermes (scripts/get-hermes.sh)')
    const r = sh('sh', [path.join(HERE, 'scripts/get-hermes.sh')], { stdio: 'inherit' })
    if (r.status !== 0) process.exit(1)
}

// 1. extract
if (!process.argv.includes('--skip-extract') && !PATCHED) {
    step('extract the inputs of the repository\'s own tests')
    const require = createRequire(path.join(ROOT, 'package.json'))
    const vitestPkg = require.resolve('vitest/package.json')
    const vitest = path.join(path.dirname(vitestPkg), 'vitest.mjs')
    fs.rmSync(path.join(HERE, 'corpus/extracted'), { recursive: true, force: true })
    const r = sh(process.execPath, [vitest, 'run', '--config', path.join(HERE, 'extract/vitest.extract.config.js'), '--silent'], { cwd: ROOT })
    console.log(r.stdout.split('\n').filter(l => /Test Files|Tests /.test(l)).join('\n'))
    if (r.status !== 0) { console.error(r.stdout, r.stderr); process.exit(1) }
}
sh(process.execPath, [path.join(HERE, 'extract/write-index.mjs')], { stdio: 'inherit' })

// 2. reference
step('reference: Node, unbundled')
{
    const env = { ...process.env, S1_PATCHES: PATCHED ? '1' : '0' }
    const r = sh(process.execPath, ['--import', path.join(HERE, 'src/node-alias-hooks.mjs'), path.join(HERE, 'src/run-node-reference.mjs'), path.join(OUT, 'node-reference.json')], { cwd: HERE, env })
    if (r.status !== 0) { console.error(r.stderr); process.exit(1) }
}

// 3. bundle
step('bundle: esbuild, one file, no Node')
const NODE_BUILTINS = new Set(builtinModules.flatMap(m => [m, `node:${m}`]))
const noNode = {
    name: 'no-node',
    setup(build) {
        build.onResolve({ filter: /.*/ }, (args) => {
            if (args.path.startsWith('node:') || NODE_BUILTINS.has(args.path)) {
                return { errors: [{ text: `Node built-in reached: "${args.path}" from ${args.importer}` }] }
            }
            return null
        })
    }
}
const patching = {
    name: 'spike-patches',
    setup(build) {
        build.onLoad({ filter: /\.js$/ }, (args) => {
            const relative = path.relative(ROOT, args.path)
            if (!PATCHED || !PATCHES.some(p => p.file === relative)) return null
            return { contents: applyPatches(relative, fs.readFileSync(args.path, 'utf8')), loader: 'js' }
        })
    }
}
const bundleFile = path.join(BUILD, 'core.bundle.js')
await esbuild.build({
    entryPoints: [path.join(HERE, 'src/entry.js')],
    bundle: true,
    format: 'iife',
    platform: 'neutral',
    target: 'esnext', // no syntax lowering: the engine gets the syntax the site is written in
    charset: 'utf8',
    alias: { '@shared': path.join(ROOT, 'shared') },
    plugins: [noNode, patching],
    outfile: bundleFile,
    logLevel: 'error'
})
const bundle = fs.readFileSync(bundleFile, 'utf8')
const NODE_GLOBALS = /\b(?:process\.|require\(|Buffer\.|__dirname|__filename|global\.|setImmediate\()/g
const nodeGlobals = [...new Set(bundle.match(NODE_GLOBALS) || [])]
if (nodeGlobals.length) { console.error('Node globals named in the bundle:', nodeGlobals); process.exit(1) }
console.log(`bundle ${bundle.length} chars, no node: import, no Node global named`)

// 4. node-vm: the same bundle in an empty context
step('node-vm: the bundle on Node, empty context')
{
    let text = null
    const context = vm.createContext({ __emit: (t) => { text = t }, crypto: globalThis.crypto })
    vm.runInContext(bundle, context, { filename: 'core.bundle.js' })
    fs.writeFileSync(path.join(OUT, 'node-bundle.json'), text + '\n')
}

// 5. hermes
step('hermes: the bundle on Hermes 260318099.0.5')
const PRELUDE = 'globalThis.__emit = print;\n'
const polyfill = fs.readFileSync(path.join(HERE, 'src/polyfill-crypto.js'), 'utf8')
fs.writeFileSync(path.join(BUILD, 'core.hermes-bare.js'), PRELUDE + bundle)
fs.writeFileSync(path.join(BUILD, 'core.hermes-polyfill.js'), PRELUDE + polyfill + ';\n' + bundle)
const hermesRuns = {}
const runHermes = (name, file) => {
    const r = sh(HERMES_RUN, [file])
    hermesRuns[name] = { exit: r.status, stderr: r.stderr.trim().split('\n').slice(0, 6).join('\n') }
    if (r.status === 0) fs.writeFileSync(path.join(OUT, `${name}.json`), r.stdout)
    console.log(`${name}: exit ${r.status}${r.status ? ' — ' + hermesRuns[name].stderr.split('\n')[0] : ''}`)
}
runHermes('hermes-bare', path.join(BUILD, 'core.hermes-bare.js'))
runHermes('hermes-polyfill-source', path.join(BUILD, 'core.hermes-polyfill.js'))
{
    const hbc = path.join(BUILD, 'core.hermes-polyfill.hbc')
    const c = sh(HERMESC, ['-O', '-emit-binary', '-out', hbc, path.join(BUILD, 'core.hermes-polyfill.js')])
    if (c.status !== 0) { console.error('hermesc:', c.stderr); hermesRuns['hermes-polyfill-bytecode'] = { exit: 'compile failed', stderr: c.stderr.slice(0, 500) } }
    else runHermes('hermes-polyfill-bytecode', hbc)
}

// 6. features
if (!PATCHED) {
    step('features: each engine-dependent feature, on Node and on bare Hermes')
    const probeBundle = path.join(BUILD, 'probes.js')
    await esbuild.build({ entryPoints: [path.join(HERE, 'src/probes.js')], bundle: true, format: 'iife', platform: 'neutral', target: 'esnext', charset: 'utf8', plugins: [noNode], outfile: probeBundle, logLevel: 'error' })
    const probes = fs.readFileSync(probeBundle, 'utf8')
    let nodeText = null
    globalThis.__emit = (t) => { nodeText = t } // Node's own globals, as the site's browser has them
    vm.runInThisContext(probes, { filename: 'probes.js' })
    await new Promise(r => setTimeout(r, 50))
    fs.writeFileSync(path.join(OUT, 'features-node.json'), nodeText + '\n')
    fs.writeFileSync(path.join(BUILD, 'probes.hermes.js'), PRELUDE + probes)
    const r = sh(HERMES_RUN, [path.join(BUILD, 'probes.hermes.js')])
    if (r.status !== 0) console.error(r.stderr)
    fs.writeFileSync(path.join(OUT, 'features-hermes.json'), r.stdout)
    const hbc = path.join(BUILD, 'probes.hbc')
    sh(HERMESC, ['-O', '-emit-binary', '-out', hbc, path.join(BUILD, 'probes.hermes.js')])
    const rb = sh(HERMES_RUN, [hbc])
    fs.writeFileSync(path.join(OUT, 'features-hermes-bytecode.json'), rb.stdout)
}

// 7. diff
step('diff against the reference, byte for byte')
const reference = fs.readFileSync(path.join(OUT, 'node-reference.json'))
const ref = JSON.parse(reference)
const compared = {}
for (const name of ['node-bundle', 'hermes-bare', 'hermes-polyfill-source', 'hermes-polyfill-bytecode']) {
    const file = path.join(OUT, `${name}.json`)
    if (!fs.existsSync(file) || (hermesRuns[name] && hermesRuns[name].exit !== 0)) {
        compared[name] = { ran: false, ...(hermesRuns[name] || {}) }
        fs.rmSync(file, { force: true })
        continue
    }
    const other = fs.readFileSync(file)
    const identical = Buffer.compare(reference, other) === 0
    let differentCases = []
    if (!identical) {
        const theirs = JSON.parse(other)
        const byId = new Map(theirs.cases.map(c => [c.id, JSON.stringify(c)]))
        differentCases = ref.cases.filter(c => byId.get(c.id) !== JSON.stringify(c)).map(c => c.id)
        const d = sh('diff', ['-u', '--label', 'node-reference.json', '--label', `${name}.json`, path.join(OUT, 'node-reference.json'), file])
        fs.writeFileSync(path.join(OUT, `diff-${name}.txt`), d.stdout)
    } else {
        fs.writeFileSync(path.join(OUT, `diff-${name}.txt`), '')
    }
    compared[name] = { ran: true, identical, bytes: other.length, differentCases: differentCases.length, firstDifferent: differentCases.slice(0, 20) }
}
const errorsInReference = ref.cases.filter(c => c.error).map(c => `${c.id}: ${c.error.name}`)
// The big outputs are kept compressed (gzip, fixed header) next to their sha256; the plain files
// stay on disk for reading but are not committed (see .gitignore).
const digests = {}
for (const f of fs.readdirSync(OUT).filter(f => /\.json$|^diff-.*\.txt$/.test(f) && f !== 'summary.json')) {
    const data = fs.readFileSync(path.join(OUT, f))
    digests[f] = { bytes: data.length, sha256: crypto.createHash('sha256').update(data).digest('hex') }
    if (data.length > 2_000_000) fs.writeFileSync(path.join(OUT, f + '.gz'), zlib.gzipSync(data, { level: 9 }))
}
const summary = {
    pass: PATCHED ? 'patched (src/patches.js applied to both sides)' : 'as-is (the site\'s files unchanged)',
    patches: PATCHED ? PATCHES.map(p => ({ id: p.id, file: p.file, find: p.find, replace: p.replace })) : [],
    digests,
    hermes: { version: '260318099.0.5', shippedBy: 'react-native@0.88.1 (dependency hermes-compiler 260318099.0.5)', artifact: 'com.facebook.hermes:hermes-ios:260318099.0.5, macOS slice of hermesvm.framework' },
    referenceBytes: reference.length,
    cases: ref.cases.length,
    casesByKind: ref.counts,
    corpus: ref.corpus,
    ids: ref.ids,
    errorsInReference,
    compared,
    hermesRuns
}
fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2) + '\n')
console.log(JSON.stringify({ cases: summary.cases, compared }, null, 2))
