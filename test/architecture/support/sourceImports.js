/**
 * What the architecture tests read from the source files of the app: which files there are and
 * what each one imports. No file is run.
 */
import fs from 'node:fs'
import path from 'node:path'

export const APP_ROOT = path.resolve(process.cwd(), 'public/js')

/** Every .js file under a folder of the app, as paths relative to public/js. */
export function listJs(relativeDir = '') {
    const dir = path.join(APP_ROOT, relativeDir)
    if (!fs.existsSync(dir)) return []
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const child = path.join(relativeDir, entry.name)
        if (entry.isDirectory()) return listJs(child)
        return entry.name.endsWith('.js') ? [child] : []
    })
}

export const read = (relative) => fs.readFileSync(path.join(APP_ROOT, relative), 'utf8')

/** As `wc -l` counts them. */
export const lineCount = (relative) => (read(relative).match(/\n/g) || []).length

/** The module specifiers a file imports, static and dynamic. */
export function importsOf(relative) {
    const source = read(relative)
    const found = []
    const pattern = /(?:import\s+(?:[^'"]*?\sfrom\s+)?|import\s*\(\s*)['"]([^'"]+)['"]/g
    let match
    while ((match = pattern.exec(source)) !== null) found.push(match[1])
    return found
}

/** "file -> specifier" for every import of `files` that `isForbidden` refuses. */
export const offenders = (files, isForbidden) => files.flatMap(file =>
    importsOf(file).filter(specifier => isForbidden(specifier, file)).map(specifier => `${file} -> ${specifier}`))

/** The files of the app itself: everything under public/js but the code of others. */
export const appFiles = () => listJs('').filter(file => !file.startsWith('vendor/'))
