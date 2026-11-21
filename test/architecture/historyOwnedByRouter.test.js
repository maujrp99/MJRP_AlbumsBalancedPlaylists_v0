// @vitest-environment node
/**
 * Fitness function of F63 (UAT-201): the history of the browser has one owner, the router.
 *
 * A screen that writes the history by itself (history.pushState, history.replaceState, the hash)
 * leaves the router not knowing where the person is, and an entry added on the way IN to a screen
 * traps the back button (the albums screen did it until F63). And a route that only sends the
 * person on (an old address, the return from Spotify) has to take the place of its own entry
 * (router.redirect), never add one (router.navigate).
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { listSourceFiles } from './support/parseSource.js'

const JS_ROOT = path.join(process.cwd(), 'public/js')
const ROUTER = 'router.js'

/** Files that still write the history by themselves, each with its reason. A new one fails. */
const KNOWN = {
    // Takes the one-time code of Spotify out of the address before anything else can read it;
    // the /callback route then redirects through the router.
    'services/SpotifyAuthService.js': 1,
    // Marks the edit address after a restore. Left as it is: the file is being rewritten by F56.
    'controllers/PlaylistsController.js': 1
}

const WRITES_HISTORY = /history\s*\.\s*(pushState|replaceState)\s*\(|location\s*\.\s*hash\s*=[^=]/g

/** Every .js, .ts and .tsx file of the app, absolute (F83: the React screens write no history either). */
const jsFiles = (dir) => listSourceFiles(dir).map(file => path.join(dir, file))
const writesOf = (source) => (source.match(WRITES_HISTORY) || []).length

describe('the router owns the history of the browser (F63)', () => {
    /** The files of a folder that write the history, with how many times. */
    const scan = (root) => {
        const found = {}
        jsFiles(root).forEach(file => {
            const relative = path.relative(root, file)
            if (relative === ROUTER) return
            const count = writesOf(fs.readFileSync(file, 'utf8'))
            if (count > 0) found[relative] = count
        })
        return found
    }

    it('no file outside the router writes the history, except the known ones', () => {
        expect(scan(JS_ROOT)).toEqual(KNOWN)
    })

    it('it reads .ts and .tsx: a React file that writes the history by itself is accused (F83)', () => {
        expect(scan(path.join(process.cwd(), 'test/architecture/fixtures/typescript'))).toEqual({ 'writesHistory.tsx': 1 })
    })

    it('the routes that only send the person on use redirect, not navigate', () => {
        const app = fs.readFileSync(path.join(JS_ROOT, 'app.js'), 'utf8')

        expect(app).not.toMatch(/router\s*\.\s*navigate\s*\(/)
        expect(app.match(/router\s*\.\s*redirect\s*\(/g)).toHaveLength(5) // + the old /home, which leads to /start (F85)
    })
})
