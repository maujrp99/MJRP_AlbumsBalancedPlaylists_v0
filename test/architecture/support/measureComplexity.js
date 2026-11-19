/**
 * Measures the cyclomatic complexity of every function with ESLint's own
 * `complexity` rule, ignoring the project's lint configuration: the fitness
 * tests of F58 need the number, not the lint verdict.
 *
 * Returns one row per function ABOVE `limit`:
 *   { file, line, name, complexity }
 * `file` is relative to the repository root, `name` is ESLint's description
 * without the article ("Async method '_enrichOne'" → "_enrichOne").
 *
 * As a script it prints the table:
 *   node test/architecture/support/measureComplexity.js public/js shared server
 */
import { ESLint } from 'eslint'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
export const COMPLEXITY_LIMIT = 10

/** "Async method '_enrichOne'" → "_enrichOne"; "Arrow function" stays as it is. */
export function functionName(description) {
    const quoted = description.match(/'([^']+)'/)
    return quoted ? quoted[1] : description.toLowerCase()
}

export async function functionsAbove(targets, limit = COMPLEXITY_LIMIT) {
    const eslint = new ESLint({
        cwd: ROOT,
        overrideConfigFile: true,
        overrideConfig: [{
            files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
            languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
            linterOptions: { noInlineConfig: true, reportUnusedDisableDirectives: 'off' },
            rules: { complexity: ['error', limit] }
        }],
        ignorePatterns: ['**/node_modules/**', '**/dist/**']
    })
    const results = await eslint.lintFiles(targets)
    const rows = []
    for (const result of results) {
        const file = path.relative(ROOT, result.filePath)
        for (const message of result.messages) {
            if (message.fatal) throw new Error(`${file}:${message.line} does not parse: ${message.message}`)
            if (message.ruleId !== 'complexity') continue
            const found = message.message.match(/^(.*?) has a complexity of (\d+)/)
            rows.push({ file, line: message.line, name: functionName(found[1]), complexity: Number(found[2]) })
        }
    }
    return rows.sort((a, b) => b.complexity - a.complexity || a.file.localeCompare(b.file) || a.line - b.line)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const rows = await functionsAbove(process.argv.slice(2))
    for (const row of rows) console.log(`${row.complexity}\t${row.file}:${row.line}\t${row.name}`)
    console.error(`${rows.length} functions above ${COMPLEXITY_LIMIT}`)
}
