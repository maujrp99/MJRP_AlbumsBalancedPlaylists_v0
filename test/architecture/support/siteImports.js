/**
 * What the sensors of the React edge (F83) read from the source of the site: which file imports which, with the target of
 * each import worked out as a path under public/js ("stores/albums.js", "screens/coming-soon/ComingSoon") or left as the
 * package name ("react"). No file is run. A file is `.js`, `.ts` or `.tsx`.
 */
import fs from 'node:fs'
import path from 'node:path'
import { parseSource, listSourceFiles } from './parseSource.js'

export const SITE_ROOT = path.join(process.cwd(), 'public/js')

const ALIASES = [['@stores/', 'stores/'], ['@components/', 'components/'], ['@views/', 'views/'], ['@/', '']]

const walk = (node, visit) => {
    if (!node || typeof node.type !== 'string') return
    visit(node)
    for (const key of Object.keys(node)) {
        if (key === 'loc' || key === 'range') continue
        const value = node[key]
        for (const child of Array.isArray(value) ? value : [value]) {
            if (child && typeof child === 'object') walk(child, visit)
        }
    }
}

/** The files of the site (relative to public/js, with forward slashes). */
export const siteFiles = (root = SITE_ROOT) => listSourceFiles(root).map(file => file.split(path.sep).join('/')).sort()

/**
 * What a source loads: `{ specifier, dynamic }` for each import, export-from, import() and `lazy(() => import())`.
 * @param {string} source
 * @param {string} file - decides the parser
 */
export function loadsIn(source, file) {
    const found = []
    walk(parseSource(source, file), node => {
        if (node.type === 'ImportDeclaration' || node.type === 'ExportAllDeclaration' || (node.type === 'ExportNamedDeclaration' && node.source)) {
            found.push({ specifier: node.source.value, dynamic: false })
        } else if (node.type === 'ImportExpression' && node.source.type === 'Literal') {
            found.push({ specifier: node.source.value, dynamic: true })
        }
    })
    return found
}

/** The call names of a source: `lazy`, `React.lazy` come back as "lazy" and "React.lazy". */
export function callsIn(source, file) {
    const names = []
    walk(parseSource(source, file), node => {
        if (node.type !== 'CallExpression') return
        const { callee } = node
        if (callee.type === 'Identifier') names.push(callee.name)
        else if (callee.type === 'MemberExpression' && callee.object.type === 'Identifier' && !callee.computed) names.push(`${callee.object.name}.${callee.property.name}`)
    })
    return names
}

/** How many `as unknown as` casts a TypeScript source has. */
export function doubleCastsIn(source, file) {
    let count = 0
    walk(parseSource(source, file), node => {
        if (node.type === 'TSAsExpression' && node.expression.type === 'TSAsExpression' && node.expression.typeAnnotation.type === 'TSUnknownKeyword') count += 1
    })
    return count
}

/**
 * Where an import points: a path under public/js for a file of the site (the alias and the relative forms), or null for
 * a package or an address.
 */
export function targetOf(fromFile, specifier) {
    for (const [alias, base] of ALIASES) {
        if (specifier.startsWith(alias)) return path.posix.normalize(base + specifier.slice(alias.length))
    }
    if (specifier.startsWith('./') || specifier.startsWith('../')) return path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), specifier))
    return null
}

/** The first folder of a path under public/js ("screens/coming-soon/X" -> "screens"; "app.js" -> ""). */
export const folderOf = (relative) => (relative.includes('/') ? relative.split('/')[0] : '')

/** The imports of every file given, as [{ file, specifier, dynamic, target }]. */
export function importsOfFiles(files, root = SITE_ROOT) {
    return files.flatMap(file => loadsIn(fs.readFileSync(path.join(root, file), 'utf8'), file)
        .map(load => ({ file, ...load, target: targetOf(file, load.specifier) })))
}
