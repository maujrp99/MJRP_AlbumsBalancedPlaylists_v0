/**
 * Looks for credentials written in the text files of the repository (F65, UAT-17, UAT-20).
 *
 * It reports WHERE (file, line, which rule), never WHAT: the matched value is not kept, not
 * returned and not printed, so a red test or a script run leaks nothing to a log.
 *
 * The files are the ones git tracks. Where there is no .git (the clean copy the deploy scripts
 * export with `git archive`), every file of the folder is read except the ones .gitignore keeps
 * out by name (`.env`, `.env.local`, `.env.*.local`) and the folders of dependencies and builds.
 *
 * As a script it prints the findings:
 *   node test/security/support/secretScan.js
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')

const BINARY = /\.(png|jpe?g|gif|ico|webp|avif|bmp|pdf|zip|gz|tgz|woff2?|ttf|otf|eot|mp3|mp4|mov|wav|p8|icns)$/i
const SKIPPED_FOLDERS = new Set(['node_modules', 'dist', '.git', 'coverage', '.firebase'])
const LOCAL_SECRET_FILES = /^\.env(\.local|\..+\.local)?$/
const MAX_BYTES = 5 * 1024 * 1024

/** A name that says "this holds a credential". */
const SECRET_NAME = '[A-Za-z0-9_.-]*(?:token|secret|passwd|password|api[_-]?key|private[_-]?key|access[_-]?key)[A-Za-z0-9_-]*'
/** A long run of the characters credentials are made of (hex, base64, base64url). */
const LONG_VALUE = '[A-Za-z0-9+/_=-]{20,}'

/**
 * The rules. Each has a name (what the report shows) and a pattern; `value` is the group that
 * holds the candidate, checked by `looksLikeACredential` when the rule asks for it.
 */
const RULES = [
    // the header followed by key material: the header alone is code that builds or checks a key
    { name: 'private key', pattern: /-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----(?:\\[nr]|\s)*[A-Za-z0-9+/=]{40,}/g },
    { name: 'Discogs token in an Authorization header', pattern: new RegExp(`Discogs\\s+token=(${LONG_VALUE})`, 'g'), value: 1 },
    { name: 'literal Bearer token', pattern: new RegExp(`Bearer\\s+(${LONG_VALUE})`, 'g'), value: 1 },
    { name: 'credential assigned to a name', pattern: new RegExp(`\\b${SECRET_NAME}["']?\\s*[:=]\\s*["'\`](${LONG_VALUE})["'\`]`, 'gi'), value: 1 },
    { name: 'credential in an environment line', pattern: new RegExp(`^\\s*(?:export\\s+)?${SECRET_NAME}=(${LONG_VALUE})\\s*$`, 'gim'), value: 1 },
    { name: 'Google API key', pattern: /\bAIza[0-9A-Za-z_-]{35}\b/g },
    { name: 'AWS access key id', pattern: /\bAKIA[0-9A-Z]{16}\b/g },
    { name: 'GitHub token', pattern: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/g },
    { name: 'Slack token', pattern: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/g },
    { name: 'provider secret key (sk-…)', pattern: /\bsk-[A-Za-z0-9_-]{24,}\b/g },
    { name: 'signed web token (JWT)', pattern: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g }
]

const count = (value, pattern) => (value.match(pattern) || []).length

/** Bits per character: a random token is near the top of what its alphabet allows, a word is not. */
function entropyOf(value) {
    const seen = {}
    for (const char of value) seen[char] = (seen[char] || 0) + 1
    return Object.values(seen).reduce((sum, n) => sum - (n / value.length) * Math.log2(n / value.length), 0)
}

const isPlaceholder = (value) => /^(.)\1+$/.test(value) ||
    /your|example|placeholder|changeme|dummy|sample|fake|test|xxxx|redacted|here/i.test(value)

const isPath = (value) => value.includes('/') && /^[a-z0-9._/-]+$/.test(value)

/** Letters only, upper and lower case mixed with no pattern: what a name in camelCase never is. */
const isRandomLetters = (value) => count(value, /[a-z][A-Z]|[A-Z][a-z]/g) >= 8 && entropyOf(value) >= 4

/**
 * A long value is taken for a credential when it is a long hex number, or mixes letters with
 * digits, or is letters in random case; and is not plainly a placeholder ("your_api_key_here",
 * "xxxxxxxx"), a path or a word.
 */
export function looksLikeACredential(value) {
    if (isPlaceholder(value) || isPath(value)) return false
    if (/^[0-9a-f]{32,}$/i.test(value)) return true
    if (count(value, /[0-9]/g) >= 3 && /[A-Za-z]/.test(value)) return true
    return isRandomLetters(value)
}

function walk(relativeDir = '') {
    return fs.readdirSync(path.join(ROOT, relativeDir), { withFileTypes: true }).flatMap(entry => {
        if (SKIPPED_FOLDERS.has(entry.name)) return []
        const child = relativeDir ? `${relativeDir}/${entry.name}` : entry.name
        if (entry.isDirectory()) return walk(child)
        return entry.isFile() && !LOCAL_SECRET_FILES.test(entry.name) ? [child] : []
    })
}

/** The files to read: what git tracks, or the whole folder when this is not a git checkout. */
export function filesToScan() {
    try {
        const out = execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] })
        const tracked = out.split('\0').filter(Boolean)
        if (tracked.length > 0) return tracked
    } catch {
        // not a git checkout: read the folder
    }
    return walk()
}

const lineOf = (text, index) => text.slice(0, index).split('\n').length

/** The findings of one text: [{ line, rule }], in the order of the text. No value is kept. */
export function scanText(text) {
    const findings = []
    for (const rule of RULES) {
        rule.pattern.lastIndex = 0
        let match
        while ((match = rule.pattern.exec(text)) !== null) {
            if (rule.value && !looksLikeACredential(match[rule.value])) continue
            findings.push({ line: lineOf(text, match.index), rule: rule.name })
        }
    }
    return findings.sort((a, b) => a.line - b.line || a.rule.localeCompare(b.rule))
}

function readText(relative) {
    const absolute = path.join(ROOT, relative)
    let stat
    try { stat = fs.lstatSync(absolute) } catch { return null } // tracked and deleted in the working tree
    if (!stat.isFile() || stat.size > MAX_BYTES) return null
    const buffer = fs.readFileSync(absolute)
    return buffer.includes(0) ? null : buffer.toString('utf8')
}

/**
 * Every finding of the repository as "file:line  rule", one per file, line and rule.
 * `allowed(file, rule)` says which ones are public values or fixtures, and are left out.
 */
export function scanRepository(allowed = () => false) {
    const found = new Set()
    for (const file of filesToScan()) {
        if (BINARY.test(file)) continue
        const text = readText(file)
        if (text === null) continue
        for (const { line, rule } of scanText(text)) {
            if (!allowed(file, rule)) found.add(`${file}:${line}  ${rule}`)
        }
    }
    return [...found].sort()
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const findings = scanRepository()
    console.log(`${findings.length} finding(s), before any allowlist (values are never shown):`)
    findings.forEach(line => console.log(`  ${line}`))
}
