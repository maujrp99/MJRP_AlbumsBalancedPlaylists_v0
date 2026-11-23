/**
 * The import graph of the repository, read from the source: which file loads which.
 * No file is run. Used by test/architecture/noDeadModules.test.js (F65) to prove that
 * every module under public/js, shared and server is reachable from an entry point.
 *
 * What counts as "loads":
 *   - JavaScript: `import … from`, `export … from`, `import()`, `require()`, `require.resolve()`,
 *     `new URL('./x', import.meta.url)`, `new Worker('./x')` — with Vite's query suffixes
 *     (`?worker`, `?url`, `?raw`) taken off;
 *   - HTML: `<script src>` and `<link href>` that point inside the site;
 *   - CSS: `@import`.
 * A dynamic import or require whose argument is not a literal cannot be followed: it is
 * returned in `unresolvedDynamic`, so the test can refuse it instead of guessing.
 *
 * As a script it prints the modules no entry point reaches:
 *   node test/architecture/support/importGraph.js
 */
import * as espree from 'espree'
import { parseSource, isTypeScript } from './parseSource.js'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')

/** Where Vite serves from: an absolute path in the site ("/js/app.js") is under this folder. */
const SITE_ROOT = 'public'

/** The aliases of vite.config.js and vitest.config.js. */
const ALIASES = [
    ['@stores', 'public/js/stores'],
    ['@components', 'public/js/components'],
    ['@views', 'public/js/views'],
    ['@shared', 'shared'],
    ['@', 'public/js']
]

/**
 * Where the graph starts. Tests are not users: nothing under test/ is an entry point.
 *   public/index.html   the site (the only page of the Vite build), which loads
 *                       /js/firebase-config.js and /js/app.js
 *   server/index.js     the server (`npm start` in server/, CMD of server/Dockerfile)
 * The scripts of the two package.json and the shell scripts under scripts/ run no other
 * code file of the repository today (they run vite, vitest, eslint, gcloud, firebase);
 * `entryPointsOfScripts` reads them, so a file they come to name becomes an entry point.
 */
export const ENTRY_POINTS = ['public/index.html', 'server/index.js']

const CODE_EXTENSIONS = ['.js', '.mjs', '.cjs', '.ts', '.tsx'] // .ts/.tsx: the React screens (F83)
const isCode = (file) => CODE_EXTENSIONS.includes(path.extname(file))
const posix = (file) => file.split(path.sep).join('/')

function exists(relative) {
    const absolute = path.join(ROOT, relative)
    return fs.existsSync(absolute) && fs.statSync(absolute).isFile()
}

/** Every file under a folder of the repository, as paths relative to the root. */
export function listFiles(relativeDir, keep = () => true) {
    const dir = path.join(ROOT, relativeDir)
    if (!fs.existsSync(dir)) return []
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        if (entry.name === 'node_modules') return []
        const child = posix(path.join(relativeDir, entry.name))
        if (entry.isDirectory()) return listFiles(child, keep)
        return keep(child) ? [child] : []
    })
}

function parse(source, file = 'file.js') {
    if (isTypeScript(file)) return parseSource(source, file)
    const options = { ecmaVersion: 'latest', loc: false, range: false }
    try {
        return espree.parse(source, { ...options, sourceType: 'module' })
    } catch {
        return espree.parse(source, { ...options, sourceType: 'commonjs' })
    }
}

/** The text of a node when it is a plain string: a literal, or a template with no expression. */
function literalOf(node) {
    if (!node) return null
    if (node.type === 'Literal' && typeof node.value === 'string') return node.value
    if (node.type === 'TemplateLiteral' && node.expressions.length === 0) return node.quasis[0].value.cooked
    return null
}

const isCallTo = (node, name) => node.callee.type === 'Identifier' && node.callee.name === name

const isRequireResolve = (node) => node.callee.type === 'MemberExpression' &&
    node.callee.object.type === 'Identifier' && node.callee.object.name === 'require' &&
    node.callee.property.name === 'resolve'

const isImportMetaUrl = (node) => Boolean(node) && node.type === 'MemberExpression' &&
    node.object.type === 'MetaProperty' && node.property.name === 'url'

const readOrDynamic = (node) => {
    const specifier = literalOf(node)
    return specifier === null ? { dynamic: true } : { specifier }
}

function loadOfNew(node) {
    if (node.callee.type !== 'Identifier') return null
    const first = literalOf(node.arguments[0])
    if (first === null) return null
    if (node.callee.name === 'URL' && isImportMetaUrl(node.arguments[1])) return { specifier: first }
    if (node.callee.name === 'Worker') return { specifier: first }
    return null
}

/** What one syntax node loads: { specifier } when it can be read, { dynamic: true } when it cannot. */
function loadOf(node) {
    switch (node.type) {
        case 'ImportDeclaration':
        case 'ExportAllDeclaration':
            return { specifier: node.source.value }
        case 'ExportNamedDeclaration':
            return node.source ? { specifier: node.source.value } : null
        case 'ImportExpression':
            return readOrDynamic(node.source)
        case 'CallExpression':
            return isCallTo(node, 'require') || isRequireResolve(node) ? readOrDynamic(node.arguments[0]) : null
        case 'NewExpression':
            return loadOfNew(node)
        default:
            return null
    }
}

function walk(node, visit) {
    if (!node || typeof node.type !== 'string') return
    visit(node)
    for (const key of Object.keys(node)) {
        const value = node[key]
        if (Array.isArray(value)) value.forEach(child => walk(child, visit))
        else if (value && typeof value === 'object') walk(value, visit)
    }
}

function loadsOfCode(source, file) {
    const specifiers = []
    let dynamic = 0
    walk(parse(source, file), node => {
        const load = loadOf(node)
        if (!load) return
        if (load.dynamic) dynamic += 1
        else specifiers.push(load.specifier)
    })
    return { specifiers, dynamic }
}

function matchesOf(source, pattern) {
    const found = []
    let match
    while ((match = pattern.exec(source)) !== null) found.push(match[1])
    return found
}

const loadsOfHtml = (source) => ({
    specifiers: matchesOf(source, /<(?:script|link)\b[^>]*?\b(?:src|href)\s*=\s*["']([^"']+)["']/gi),
    dynamic: 0
})

const loadsOfCss = (source) => ({
    specifiers: matchesOf(source, /@import\s+(?:url\(\s*)?["']([^"']+)["']/g),
    dynamic: 0
})

/** The specifiers a file loads, and how many of its dynamic loads cannot be read. */
export function loadsOf(relative) {
    const source = fs.readFileSync(path.join(ROOT, relative), 'utf8')
    if (isCode(relative)) return loadsOfCode(source, relative)
    if (relative.endsWith('.html')) return loadsOfHtml(source)
    if (relative.endsWith('.css')) return loadsOfCss(source)
    return { specifiers: [], dynamic: 0 }
}

const besideOf = (fromFile, specifier) => posix(path.normalize(path.join(path.dirname(fromFile), specifier)))

function aliased(specifier) {
    for (const [alias, target] of ALIASES) {
        if (specifier === alias) return target
        if (specifier.startsWith(`${alias}/`)) return posix(path.join(target, specifier.slice(alias.length + 1)))
    }
    return null
}

/** The path inside the repository a specifier names, before trying extensions; null for a package or a URL. */
function basePathOf(specifier, fromFile) {
    const clean = specifier.replace(/[?#].*$/, '')
    if (/^[a-z][a-z0-9+.-]*:/i.test(clean) || clean.startsWith('//')) return null // http:, data:, node:
    if (clean.startsWith('./') || clean.startsWith('../')) return besideOf(fromFile, clean)
    if (clean.startsWith('/')) return fromFile.startsWith(`${SITE_ROOT}/`) ? posix(path.join(SITE_ROOT, clean)) : null
    // In HTML and CSS a bare name is a file beside the page ("css/x.css"); in code it is a package.
    return aliased(clean) || (isCode(fromFile) ? null : besideOf(fromFile, clean))
}

/** The file of the repository a specifier points to, or null (a package, a URL, a file that is not there). */
export function resolve(specifier, fromFile) {
    const base = basePathOf(specifier, fromFile)
    if (base === null || base.startsWith('..')) return null
    const candidates = [
        base,
        ...CODE_EXTENSIONS.map(ext => base + ext),
        `${base}.json`,
        ...CODE_EXTENSIONS.map(ext => `${base}/index${ext}`)
    ]
    return candidates.find(exists) || null
}

/**
 * Walks the graph from the entry points.
 * Returns { reachable: Set<file>, missing: ["file -> specifier"], unresolvedDynamic: ["file (n)"] }.
 * `missing` are relative, absolute or aliased specifiers that point to no file: a broken import.
 * `optional` names the specifiers allowed to point to nothing (a file that exists on the
 * machine and is not in the repository, as public/js/firebase-config.js).
 */
export function graphFrom(entries = ENTRY_POINTS, { optional = [] } = {}) {
    const reachable = new Set()
    const missing = []
    const unresolvedDynamic = []
    const queue = entries.filter(exists)
    while (queue.length > 0) {
        const file = queue.pop()
        if (reachable.has(file)) continue
        reachable.add(file)
        const { specifiers, dynamic } = loadsOf(file)
        if (dynamic > 0) unresolvedDynamic.push(`${file} (${dynamic})`)
        for (const specifier of specifiers) {
            const target = resolve(specifier, file)
            if (target) queue.push(target)
            else if (basePathOf(specifier, file) !== null && !optional.includes(specifier)) missing.push(`${file} -> ${specifier}`)
        }
    }
    return { reachable, missing: missing.sort(), unresolvedDynamic: unresolvedDynamic.sort() }
}

/**
 * The code files of the repository that a command line names (the scripts of a package.json,
 * a shell script): a word of the text that is the path of a code file, from the root or from
 * `baseDir`, is an entry point.
 */
export function entryPointsOfText(text, baseDir = '') {
    const found = new Set()
    for (const word of text.split(/[\s"'`=;()&|<>]+/).filter(Boolean)) {
        const clean = word.replace(/^\.\//, '').replace(/^\$\{?[A-Za-z_]+\}?\//, '')
        if (!isCode(clean)) continue
        for (const candidate of [clean, posix(path.join(baseDir, clean))]) {
            if (exists(candidate)) found.add(posix(path.normalize(candidate)))
        }
    }
    return [...found]
}

function entryPointsOfPackage(file, baseDir) {
    if (!exists(file)) return []
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'))
    const text = [...Object.values(pkg.scripts || {}), pkg.main || ''].join('\n')
    return entryPointsOfText(text, baseDir)
}

/** Entry points named by the npm scripts (root and server/) and by the shell scripts under scripts/. */
export function entryPointsOfScripts() {
    const shell = listFiles('scripts', file => file.endsWith('.sh'))
    return [...new Set([
        ...entryPointsOfPackage('package.json', ''),
        ...entryPointsOfPackage('server/package.json', 'server'),
        // A shell script names server files as it sees them from inside server/ ("node index.js").
        ...shell.flatMap(file => entryPointsOfText(fs.readFileSync(path.join(ROOT, file), 'utf8'), 'server'))
    ])]
}

/**
 * The modules of the core the phone app loads (F78): app/ is TypeScript, built by Metro, outside
 * this graph; what it imports of shared/ by the package name (`@album-blender/shared/…`) is an entry
 * point here, as the site's index.html is. Read as tokens, so a name inside a comment does not count.
 */
export function entryPointsOfApp() {
    const files = listFiles('app/src', file => /\.(ts|tsx)$/.test(file) && !file.endsWith('.d.ts'))
    const found = files.flatMap(file => {
        const code = fs.readFileSync(path.join(ROOT, file), 'utf8')
        const tokens = espree.tokenize(code, { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: file.endsWith('.tsx') } })
        return tokens
            .filter(token => token.type === 'String' && token.value.slice(1).startsWith('@album-blender/shared/'))
            .map(token => `shared/${token.value.slice(1, -1).slice('@album-blender/shared/'.length)}`)
    })
    return [...new Set(found)].filter(exists)
}

/** Every entry point: the fixed ones, the ones the scripts name, and the core modules the app loads. */
export const allEntryPoints = () => [...new Set([...ENTRY_POINTS, ...entryPointsOfScripts(), ...entryPointsOfApp()])]

/**
 * The code modules the fitness test watches: every code file under public/js, shared and server.
 * The tests of the project live under test/, outside these folders: a test file put inside them
 * is watched like any other module, so it cannot hide there.
 */
export const watchedModules = () => ['public/js', 'shared', 'server']
    .flatMap(dir => listFiles(dir, isCode))
    .sort()

/** The stylesheets of the site: every .css under public/css. */
export const watchedStylesheets = () => listFiles('public/css', file => file.endsWith('.css')).sort()

/** The watched modules no entry point reaches. */
export function deadModules(options) {
    const { reachable } = graphFrom(allEntryPoints(), options)
    return watchedModules().filter(file => !reachable.has(file))
}

function printReport() {
    const entries = allEntryPoints()
    const graph = graphFrom(entries)
    const dead = watchedModules().filter(file => !graph.reachable.has(file))
    const lines = (file) => (fs.readFileSync(path.join(ROOT, file), 'utf8').match(/\n/g) || []).length
    console.log(`entry points: ${entries.join(', ')}`)
    console.log(`reachable files: ${graph.reachable.size}`)
    console.log(`\nwatched modules no entry point reaches: ${dead.length} (${dead.reduce((sum, file) => sum + lines(file), 0)} lines)`)
    dead.forEach(file => console.log(`  ${String(lines(file)).padStart(5)}  ${file}`))
    console.log(`\nimports that point to no file: ${graph.missing.length}`)
    graph.missing.forEach(line => console.log(`  ${line}`))
    console.log(`\nfiles with a dynamic import or require that cannot be read: ${graph.unresolvedDynamic.length}`)
    graph.unresolvedDynamic.forEach(line => console.log(`  ${line}`))
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) printReport()
