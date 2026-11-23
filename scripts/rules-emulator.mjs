#!/usr/bin/env node
/**
 * The Firestore rules test, in its own step (F82 TASK-05, ADR-0024).
 *
 *   node scripts/rules-emulator.mjs test    start the emulator, run test/security/firestoreRules.emulator.js, stop it
 *   node scripts/rules-emulator.mjs start   start the emulator and leave it running (a server; stop it with Ctrl-C)
 *   node scripts/rules-emulator.mjs check   only look for Java and the Firebase CLI
 *
 * `npm run test:rules` and `npm run rules:emulator` call it. The default suite (`npx vitest run --config vitest.rules.config.js`) does
 * NOT run that file (vitest.config.js excludes it, and test/architecture/rulesTestHasItsOwnStep.test.js
 * holds the CI and the deploy to run this step instead), so the suite needs no emulator.
 *
 * The emulator needs Java and the Firebase CLI. Java may be installed but not on PATH (Homebrew's
 * openjdk keeps it in /opt/homebrew/opt/openjdk/bin): this script looks there too. With no Java it
 * stops with a clear message; it never skips. No credential: the project is `demo-mjrp-rules`.
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { delimiter } from 'node:path'

const PROJECT = 'demo-mjrp-rules'
const HOMEBREW_JAVA_DIRS = ['/opt/homebrew/opt/openjdk/bin', '/usr/local/opt/openjdk/bin']

const works = (command, args, env) => spawnSync(command, args, { env, stdio: 'ignore' }).status === 0

/** The environment with a working Java on PATH, or null. */
export function environmentWithJava(env = process.env) {
    if (works('java', ['-version'], env)) return env
    for (const dir of HOMEBREW_JAVA_DIRS) {
        if (!existsSync(`${dir}/java`)) continue
        const withDir = { ...env, PATH: `${dir}${delimiter}${env.PATH ?? ''}` }
        if (works('java', ['-version'], withDir)) return withDir
    }
    return null
}

function fail(message) {
    console.error(`[rules-emulator] ${message}`)
    process.exit(1)
}

function prepare() {
    const env = environmentWithJava()
    if (!env) fail('No Java found: the Firestore emulator needs it (install a JDK, e.g. `brew install openjdk`, or put `java` on PATH). The rules test was NOT run.')
    if (!works('firebase', ['--version'], env)) fail('The Firebase CLI is not on PATH (`npm install -g firebase-tools`). The rules test was NOT run.')
    return env
}

const mode = process.argv[2]
if (!['test', 'start', 'check'].includes(mode)) fail('usage: rules-emulator.mjs test | start | check')
const env = prepare()
if (mode === 'check') process.exit(0)

const args = mode === 'start'
    ? ['emulators:start', '--only', 'firestore', '--project', PROJECT]
    : ['emulators:exec', '--only', 'firestore', '--project', PROJECT, `npx vitest run --config vitest.rules.config.js`]
process.exit(spawnSync('firebase', args, { env: { ...env, MJRP_RULES_STEP: '1' }, stdio: 'inherit' }).status ?? 1)
