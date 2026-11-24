/**
 * The database rules kept in the repository, RUN in the Firestore emulator (F82 TASK-05, ADR-0024).
 *
 * It replaces the F59 test that read the file as text and proved no refusal: here every claim is a
 * real read or write answered (or refused) by the rules engine. What the old test held is held
 * here, as behaviour: a person's data is closed on its owner (F59), and an update never lowers
 * `_schemaVersion` (F78, REQ-10). On top of that, the rules of the CMS content (F82, REQ-06/07):
 *
 *   published/*    everybody reads, with no login; only the administrator writes (signed in with a
 *                  real account, listed in cmsAdmins/{uid} with role "super"); closed list of
 *                  documents, fields, types and counts; `_schemaVersion` never down; `rev` = previous + 1
 *   cmsAdmins/*    each person reads their own record; nobody writes it through the app
 *   cmsWork/*      the administrator only
 *   albums/        read by a signed-in person; no writer since F65
 *
 * This file is NOT part of the default suite (`npx vitest run` does not match it: it is not named
 * *.test.js, on purpose). It has its own step, `npm run test:rules` (scripts/rules-emulator.mjs:
 * `firebase emulators:exec`, which needs Java and the Firebase CLI), which the CI and the deploy
 * scripts run; test/architecture/rulesTestHasItsOwnStep.test.js holds that wiring. Run alone, with
 * no emulator, it FAILS loudly: a rules test that quietly passes proves nothing.
 */
// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc, updateDoc, deleteDoc, runTransaction, serverTimestamp, writeBatch } from 'firebase/firestore'
import { PublishedContentSaveRepository } from '../../shared/data/PublishedContentSaveRepository.js'
import { batchTransaction } from '../../shared/data/batchTransaction.js'
import { PublishedCrateRepository } from '../../shared/data/PublishedCrateRepository.js'
import { CRATE, crateAlbums, crateLine, crateSide, longestLine } from './support/crateFixtures.js'

const RULES = readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf8')
const HOST = process.env.FIRESTORE_EMULATOR_HOST

const ADMIN = 'admin-uid'
const OTHER = 'other-uid'
const REAL = { firebase: { sign_in_provider: 'google.com' } }
const ANON = { firebase: { sign_in_provider: 'anonymous' } }

/**
 * The collections guests (the app's anonymous login) may still write, and why. A list that only
 * shrinks: when a feature closes one, it leaves here, and the case below that says "a guest writes
 * it" starts to fail until it does. F92 TASK-09 closes `spotify_enrichment`.
 */
const GUEST_WRITES_STILL_ALLOWED = Object.freeze({
    spotify_enrichment: 'the Spotify popularity is written by whoever is on the site, until F92 TASK-09 (ADR-0024, decision 4)'
})

const suite = describe

let env
const as = {
    admin: () => env.authenticatedContext(ADMIN, REAL).firestore(),
    adminAnonymous: () => env.authenticatedContext(ADMIN, ANON).firestore(),
    other: () => env.authenticatedContext(OTHER, REAL).firestore(),
    guest: () => env.authenticatedContext('guest-uid', ANON).firestore(),
    nobody: () => env.unauthenticatedContext().firestore()
}

/** Documents written with the rules off, the way the console or a past version left them. */
const seed = (fn) => env.withSecurityRulesDisabled(async (context) => fn(context.firestore()))
const seedAdmin = (role = 'super') => seed((db) => setDoc(doc(db, 'cmsAdmins', ADMIN), { role }))

const SITE = { _schemaVersion: 1, rev: 1, switches: { discogsValues: true, usageMeasurement: false, portugueseForAll: false } }
const TEXTS = { _schemaVersion: 1, rev: 1, texts: { 'nav.home': 'Home' } }

beforeAll(async () => {
    if (!HOST) {
        throw new Error('No Firestore emulator: run this test with `npm run test:rules` (it starts the emulator; Java and the Firebase CLI are needed).')
    }
    const [host, port] = HOST.split(':')
    env = await initializeTestEnvironment({ projectId: 'demo-mjrp-rules', firestore: { rules: RULES, host, port: Number(port) } })
})

afterAll(async () => { if (env) await env.cleanup() })
beforeEach(async () => { if (env) await env.clearFirestore() })


suite('the rules file', () => {
    it('has no wildcard rule at the root: what is not listed is closed, even to the administrator', async () => {
        const withoutComments = RULES.split('\n').map(line => line.replace(/\/\/.*$/, '')).join('\n')
        expect(withoutComments).not.toMatch(/match\s+\/\{[^}]*=\*\*\}/)
        await seedAdmin()
        await assertFails(setDoc(doc(as.admin(), 'anything', 'x'), { a: 1 }))
        await assertFails(getDoc(doc(as.admin(), 'anything', 'x')))
    })

    it('never allows without a condition, except reading the published content', () => {
        const withoutComments = RULES.split('\n').map(line => line.replace(/\/\/.*$/, '')).join('\n')
        const open = [...withoutComments.matchAll(/allow\s+([\w\s,]+?)\s*:\s*if\s+true\s*;/g)].map(m => m[1].trim())
        expect(open).toEqual(['read'])
    })
})

suite('published/*: everybody reads, only the administrator writes (REQ-07)', () => {
    beforeEach(async () => { await seed((db) => setDoc(doc(db, 'published', 'site'), SITE)) })

    it('a guest, a person with no login, another account and the administrator all read it', async () => {
        await seedAdmin()
        for (const who of ['nobody', 'guest', 'other', 'admin']) {
            await assertSucceeds(getDoc(doc(as[who](), 'published', 'site')))
        }
    })

    it('the administrator, signed in with a real account and listed with role "super", creates and updates it', async () => {
        await seedAdmin()
        await assertSucceeds(setDoc(doc(as.admin(), 'published', 'texts_en'), TEXTS))
        await assertSucceeds(updateDoc(doc(as.admin(), 'published', 'site'), { rev: 2, switches: { discogsValues: false }, previous: { discogsValues: true } }))
    })

    it('a person with no login, a guest and another account are refused, create and update', async () => {
        await seedAdmin()
        for (const who of ['nobody', 'guest', 'other']) {
            await assertFails(setDoc(doc(as[who](), 'published', 'texts_en'), TEXTS))
            await assertFails(updateDoc(doc(as[who](), 'published', 'site'), { rev: 2 }))
        }
    })

    it('the administrator signed in anonymously is refused, even with the record', async () => {
        await seedAdmin()
        await assertFails(setDoc(doc(as.adminAnonymous(), 'published', 'texts_en'), TEXTS))
        await assertFails(updateDoc(doc(as.adminAnonymous(), 'published', 'site'), { rev: 2 }))
    })

    it('the record must say "super": another role, or no record, writes nothing', async () => {
        await seedAdmin('editor')
        await assertFails(updateDoc(doc(as.admin(), 'published', 'site'), { rev: 2 }))
        await env.clearFirestore()
        await seed((db) => setDoc(doc(db, 'published', 'site'), SITE))
        await assertFails(updateDoc(doc(as.admin(), 'published', 'site'), { rev: 2 }))
    })

    it('nobody deletes a document through the app, not even the administrator (going back is the console)', async () => {
        await seedAdmin()
        await assertFails(deleteDoc(doc(as.admin(), 'published', 'site')))
    })

    it('a document that is not on the closed list is refused', async () => {
        await seedAdmin()
        await assertFails(setDoc(doc(as.admin(), 'published', 'surprise'), TEXTS))
    })
})

suite('published/*: fields, types, counts, version and sequence (REQ-06)', () => {
    beforeEach(async () => {
        await seedAdmin()
        await seed(async (db) => {
            await setDoc(doc(db, 'published', 'site'), SITE)
            await setDoc(doc(db, 'published', 'texts_pt'), { ...TEXTS, rev: 4, _schemaVersion: 2 })
        })
    })
    const site = () => doc(as.admin(), 'published', 'site')
    const textsPt = () => doc(as.admin(), 'published', 'texts_pt')

    it('a field outside the list is refused, in a document and inside the switches', async () => {
        await assertFails(updateDoc(site(), { rev: 2, extra: 'x' }))
        await assertFails(updateDoc(site(), { rev: 2, switches: { discogsValues: true, madeUpFeature: true } }))
        await assertFails(updateDoc(textsPt(), { rev: 5, switches: {} }))
    })

    it('a switch that is not true or false, or texts that are not a map, are refused', async () => {
        await assertFails(updateDoc(site(), { rev: 2, switches: { discogsValues: 'yes' } }))
        await assertFails(updateDoc(site(), { rev: 2, switches: { usageMeasurement: 1 } }))
        await assertFails(updateDoc(textsPt(), { rev: 5, texts: 'a string' }))
        await assertFails(updateDoc(textsPt(), { rev: 5, previous: 'a string' }))
        await assertFails(updateDoc(textsPt(), { rev: 5, texts: ['a', 'list'] }))
    })

    it('the site document keeps at most 10 keys in previous', async () => {
        const keys = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [`k${i}`, true]))
        await assertFails(updateDoc(site(), { rev: 2, previous: keys(11) }))
        await assertSucceeds(updateDoc(site(), { rev: 2, previous: keys(10) }))
    })

    it('a map with more keys than the count allows is refused (texts and previous)', async () => {
        const many = Object.fromEntries(Array.from({ length: 6001 }, (_, i) => [`k${i}`, 'x']))
        await assertFails(updateDoc(textsPt(), { rev: 5, texts: many }))
        await assertFails(updateDoc(textsPt(), { rev: 5, previous: many }))
        const fits = Object.fromEntries(Array.from({ length: 6000 }, (_, i) => [`k${i}`, 'x']))
        await assertSucceeds(updateDoc(textsPt(), { rev: 5, texts: fits }))
    })

    it('_schemaVersion going down is refused; staying or going up is accepted', async () => {
        await assertFails(updateDoc(textsPt(), { rev: 5, _schemaVersion: 1 }))
        await assertSucceeds(updateDoc(textsPt(), { rev: 5, _schemaVersion: 2 }))
        await assertSucceeds(updateDoc(textsPt(), { rev: 6, _schemaVersion: 3 }))
    })

    it('rev must be the previous plus one: the same, a jump, back, or not a number are refused', async () => {
        for (const bad of [4, 6, 3, 0, '5', 5.5, null]) {
            await assertFails(updateDoc(textsPt(), { rev: bad }))
        }
        await assertFails(updateDoc(textsPt(), { _schemaVersion: 2 })) // a write that leaves rev as it was
        await assertSucceeds(updateDoc(textsPt(), { rev: 5 }))
        await assertSucceeds(updateDoc(textsPt(), { rev: 6 }))
    })

    it('a document is created with rev 1 and a version, and with its required fields', async () => {
        await assertFails(setDoc(doc(as.admin(), 'published', 'texts_en'), { ...TEXTS, rev: 2 }))
        await assertFails(setDoc(doc(as.admin(), 'published', 'texts_en'), { rev: 1, texts: {} }))
        await assertFails(setDoc(doc(as.admin(), 'published', 'texts_en'), { _schemaVersion: 1, texts: {} }))
        await assertFails(setDoc(doc(as.admin(), 'published', 'texts_en'), { _schemaVersion: 1, rev: 1 }))
        await assertSucceeds(setDoc(doc(as.admin(), 'published', 'texts_en'), TEXTS))
    })

    it('the recipes document has its own closed shape', async () => {
        await assertSucceeds(setDoc(doc(as.admin(), 'published', 'recipes'), { _schemaVersion: 1, rev: 1, recipes: { top3: { visible: true } } }))
        await assertFails(setDoc(doc(as.admin(), 'published', 'recipes'), { _schemaVersion: 1, rev: 1, recipes: {}, texts: {} }))
    })
})

suite('cmsAdmins/{uid}: each person reads only their own; nobody writes it by the app', () => {
    beforeEach(async () => { await seedAdmin() })

    it('the administrator reads their own record; another account, a guest and a person with no login do not', async () => {
        await assertSucceeds(getDoc(doc(as.admin(), 'cmsAdmins', ADMIN)))
        await assertFails(getDoc(doc(as.other(), 'cmsAdmins', ADMIN)))
        await assertFails(getDoc(doc(as.guest(), 'cmsAdmins', ADMIN)))
        await assertFails(getDoc(doc(as.nobody(), 'cmsAdmins', ADMIN)))
    })

    it('a person reads their own absence of a record (the Painel asks before it loads)', async () => {
        await assertSucceeds(getDoc(doc(as.other(), 'cmsAdmins', OTHER)))
    })

    it('nobody writes it: not another account, not the administrator, not for themselves', async () => {
        await assertFails(setDoc(doc(as.other(), 'cmsAdmins', OTHER), { role: 'super' }))
        await assertFails(setDoc(doc(as.guest(), 'cmsAdmins', 'guest-uid'), { role: 'super' }))
        await assertFails(updateDoc(doc(as.admin(), 'cmsAdmins', ADMIN), { role: 'super' }))
        await assertFails(setDoc(doc(as.admin(), 'cmsAdmins', 'someone-new'), { role: 'super' }))
        await assertFails(deleteDoc(doc(as.admin(), 'cmsAdmins', ADMIN)))
    })

    it('an account that tried to make itself administrator is still refused on the content', async () => {
        await assertFails(setDoc(doc(as.other(), 'cmsAdmins', OTHER), { role: 'super' }))
        await assertFails(setDoc(doc(as.other(), 'published', 'texts_en'), TEXTS))
    })
})

suite('cmsWork/*: the administrator only', () => {
    it('reads and writes for the administrator; everybody else is refused', async () => {
        await seedAdmin()
        const path = ['cmsWork', 'approvals']
        await assertSucceeds(setDoc(doc(as.admin(), ...path), { approved: ['nav.home'] }))
        await assertSucceeds(getDoc(doc(as.admin(), ...path)))
        await assertSucceeds(updateDoc(doc(as.admin(), ...path), { approved: [] }))
        for (const who of ['nobody', 'guest', 'other', 'adminAnonymous']) {
            await assertFails(getDoc(doc(as[who](), ...path)))
            await assertFails(setDoc(doc(as[who](), 'cmsWork', 'x'), { a: 1 }))
            await assertFails(updateDoc(doc(as[who](), ...path), { approved: ['x'] }))
        }
    })

    it('a lower _schemaVersion on an update is refused here too', async () => {
        await seedAdmin()
        await seed((db) => setDoc(doc(db, 'cmsWork', 'approvals'), { _schemaVersion: 2 }))
        await assertFails(updateDoc(doc(as.admin(), 'cmsWork', 'approvals'), { _schemaVersion: 1 }))
        await assertSucceeds(updateDoc(doc(as.admin(), 'cmsWork', 'approvals'), { _schemaVersion: 2 }))
    })
})

suite('the save of the Painel (F82 TASK-14), with the real repository and the real transaction', () => {
    const repository = (db) => new PublishedContentSaveRepository({ db, doc, getDoc, setDoc, runTransaction, serverTimestamp })

    it('the administrator saves twice: rev 1 then 2, previous of the changed keys only, who saved in cmsWork alone', async () => {
        await seedAdmin()
        const repo = repository(as.admin())

        const first = await repo.saveTexts('pt', { loadedRev: 0, loadedTexts: {}, edits: { 'nav.home': 'Início', 'nav.albums': 'Álbuns' }, updatedBy: ADMIN })
        expect(first).toMatchObject({ status: 'saved', rev: 1, changed: ['nav.home', 'nav.albums'] })
        const second = await repo.saveTexts('pt', { loadedRev: first.rev, loadedTexts: first.texts, edits: { 'nav.home': 'Casa' }, updatedBy: ADMIN })
        expect(second).toMatchObject({ status: 'saved', rev: 2, changed: ['nav.home'] })

        const stored = (await getDoc(doc(as.nobody(), 'published', 'texts_pt'))).data()
        expect(stored).toEqual({ _schemaVersion: 1, rev: 2, texts: { 'nav.home': 'Casa', 'nav.albums': 'Álbuns' }, previous: { 'nav.home': 'Início' } })
        expect(JSON.stringify(stored)).not.toContain(ADMIN)
        const work = (await getDoc(doc(as.admin(), 'cmsWork', 'save_texts_pt'))).data()
        expect(work).toMatchObject({ _schemaVersion: 1, doc: 'texts_pt', rev: 2, keys: ['nav.home'], updatedBy: ADMIN })
        expect(typeof work.updatedAt.toMillis()).toBe('number')
    })

    it('the same key saved on another device comes back as a conflict, and nothing is written', async () => {
        await seedAdmin()
        const here = repository(as.admin())
        const there = repository(as.admin())
        const loaded = await here.saveTexts('en', { loadedRev: 0, loadedTexts: {}, edits: { 'nav.home': 'Home' }, updatedBy: ADMIN })
        await there.saveTexts('en', { loadedRev: 1, loadedTexts: loaded.texts, edits: { 'nav.home': 'Start' }, updatedBy: ADMIN })

        const result = await here.saveTexts('en', { loadedRev: 1, loadedTexts: loaded.texts, edits: { 'nav.home': 'Front page' }, updatedBy: ADMIN })

        expect(result).toEqual({ status: 'conflict', rev: 2, texts: { 'nav.home': 'Start' }, conflicts: [{ key: 'nav.home', loaded: 'Home', other: 'Start', yours: 'Front page' }] })
        expect((await getDoc(doc(as.nobody(), 'published', 'texts_en'))).data().rev).toBe(2)
    })

    it('another account, a guest and the administrator signed in anonymously are refused by the rules, and nothing is written', async () => {
        await seedAdmin()
        for (const who of ['other', 'guest', 'adminAnonymous']) {
            await assertFails(repository(as[who]()).saveTexts('pt', { loadedRev: 0, loadedTexts: {}, edits: { 'nav.home': 'x' }, updatedBy: 'someone' }))
        }
        expect((await getDoc(doc(as.nobody(), 'published', 'texts_pt'))).exists()).toBe(false)
    })
})

suite('the save of the Painel as the SITE makes it: one batch, locked by the rule of `rev` (the judge of 2026-11-23, P2-1)', () => {
    const store = (db) => ({ db, doc, getDoc, setDoc, writeBatch, serverTimestamp })
    const repository = (db) => { const given = store(db); return new PublishedContentSaveRepository({ ...given, runTransaction: batchTransaction(given) }) }

    it('the administrator saves twice: rev 1 then 2, previous of the changed keys only, who saved in cmsWork alone', async () => {
        await seedAdmin()
        const repo = repository(as.admin())
        const first = await repo.saveTexts('pt', { loadedRev: 0, loadedTexts: {}, edits: { 'nav.home': 'Início', 'nav.albums': 'Álbuns' }, updatedBy: ADMIN })
        expect(first).toMatchObject({ status: 'saved', rev: 1 })
        const second = await repo.saveTexts('pt', { loadedRev: first.rev, loadedTexts: first.texts, edits: { 'nav.home': 'Casa' }, updatedBy: ADMIN })
        expect(second).toMatchObject({ status: 'saved', rev: 2, changed: ['nav.home'] })
        const stored = (await getDoc(doc(as.nobody(), 'published', 'texts_pt'))).data()
        expect(stored).toEqual({ _schemaVersion: 1, rev: 2, texts: { 'nav.home': 'Casa', 'nav.albums': 'Álbuns' }, previous: { 'nav.home': 'Início' } })
        const work = (await getDoc(doc(as.admin(), 'cmsWork', 'save_texts_pt'))).data()
        expect(work).toMatchObject({ doc: 'texts_pt', rev: 2, keys: ['nav.home'], updatedBy: ADMIN })
        expect(typeof work.updatedAt.toMillis()).toBe('number')
    })

    it('the same key saved on another device comes back as a conflict, and nothing is written', async () => {
        await seedAdmin()
        const here = repository(as.admin())
        const there = repository(as.admin())
        const loaded = await here.saveTexts('en', { loadedRev: 0, loadedTexts: {}, edits: { 'nav.home': 'Home' }, updatedBy: ADMIN })
        await there.saveTexts('en', { loadedRev: 1, loadedTexts: loaded.texts, edits: { 'nav.home': 'Start' }, updatedBy: ADMIN })
        const result = await here.saveTexts('en', { loadedRev: 1, loadedTexts: loaded.texts, edits: { 'nav.home': 'Front page' }, updatedBy: ADMIN })
        expect(result).toEqual({ status: 'conflict', rev: 2, texts: { 'nav.home': 'Start' }, conflicts: [{ key: 'nav.home', loaded: 'Home', other: 'Start', yours: 'Front page' }] })
        expect((await getDoc(doc(as.nobody(), 'published', 'texts_en'))).data().rev).toBe(2)
    })

    it('a save that loses the race (another device saved between its read and its write) is refused by the rule, read again and lands on top: no change is lost', async () => {
        await seedAdmin()
        const db = as.admin()
        const there = repository(as.admin())
        const first = await there.saveTexts('en', { loadedRev: 0, loadedTexts: {}, edits: { 'nav.home': 'Home' }, updatedBy: ADMIN })
        // this device reads rev 1; before it writes, the other device saves another key (rev 2)
        let raced = false
        const given = store(db)
        const slow = { ...given, getDoc: async (ref) => {
            const snapshot = await getDoc(ref)
            if (!raced) { raced = true; await there.saveTexts('en', { loadedRev: 1, loadedTexts: first.texts, edits: { 'nav.albums': 'Albums' }, updatedBy: ADMIN }) }
            return snapshot
        } }
        const here = new PublishedContentSaveRepository({ ...slow, runTransaction: batchTransaction(slow) })
        const result = await here.saveTexts('en', { loadedRev: 1, loadedTexts: first.texts, edits: { 'nav.home': 'Front page' }, updatedBy: ADMIN })
        expect(result).toMatchObject({ status: 'saved', rev: 3 })
        expect((await getDoc(doc(as.nobody(), 'published', 'texts_en'))).data()).toMatchObject({ rev: 3, texts: { 'nav.home': 'Front page', 'nav.albums': 'Albums' } })
    })

    it('another account, a guest and the administrator signed in anonymously are refused by the rules, and nothing is written', async () => {
        await seedAdmin()
        for (const who of ['other', 'guest', 'adminAnonymous']) {
            await assertFails(repository(as[who]()).saveTexts('pt', { loadedRev: 0, loadedTexts: {}, edits: { 'nav.home': 'x' }, updatedBy: 'someone' }))
        }
        expect((await getDoc(doc(as.nobody(), 'published', 'texts_pt'))).exists()).toBe(false)
    })
})

suite('albums/ (legacy root): read by a signed-in person, closed to writing since F65', () => {
    it('reads stay as they were; a write is refused to everybody', async () => {
        await seed((db) => setDoc(doc(db, 'albums', 'a1'), { title: 'T' }))
        await seedAdmin()
        await assertSucceeds(getDoc(doc(as.other(), 'albums', 'a1')))
        await assertSucceeds(getDoc(doc(as.guest(), 'albums', 'a1')))
        await assertFails(getDoc(doc(as.nobody(), 'albums', 'a1')))
        for (const who of ['guest', 'other', 'admin']) {
            await assertFails(setDoc(doc(as[who](), 'albums', 'a2'), { title: 'T' }))
            await assertFails(updateDoc(doc(as[who](), 'albums', 'a1'), { title: 'U' }))
            await assertFails(deleteDoc(doc(as[who](), 'albums', 'a1')))
        }
    })
})

suite('what guests may still write: a declared list that only shrinks (F92 TASK-04, F-13)', () => {
    /** One probe path for every root collection that is not a person's own. */
    const COLLECTIONS = {
        published: ['published', 'site'],
        cmsAdmins: ['cmsAdmins', 'guest-uid'],
        cmsWork: ['cmsWork', 'x'],
        albums: ['albums', 'a1'],
        spotify_enrichment: ['spotify_enrichment', 'artist__album']
    }

    it('every collection that is not on the list stays closed to a guest: create, update and delete', async () => {
        await seed(async (db) => {
            for (const path of Object.values(COLLECTIONS)) await setDoc(doc(db, ...path), { _schemaVersion: 1, rev: 1, a: 1 })
        })
        for (const [name, path] of Object.entries(COLLECTIONS)) {
            if (name in GUEST_WRITES_STILL_ALLOWED) continue
            await assertFails(setDoc(doc(as.guest(), path[0], `${path[1]}-new`), { a: 1 }))
            await assertFails(updateDoc(doc(as.guest(), ...path), { a: 2 }))
            await assertFails(deleteDoc(doc(as.guest(), ...path)))
        }
    })

    it('the collections on the list are written by a guest today (the day one stops, it must leave the list)', async () => {
        for (const name of Object.keys(GUEST_WRITES_STILL_ALLOWED)) {
            expect(COLLECTIONS, name).toHaveProperty(name)
            await assertSucceeds(setDoc(doc(as.guest(), ...COLLECTIONS[name]), { a: 1 }))
        }
    })

    it('the list names one collection today, with its reason', () => {
        expect(Object.keys(GUEST_WRITES_STILL_ALLOWED)).toEqual(['spotify_enrichment'])
        Object.values(GUEST_WRITES_STILL_ALLOWED).forEach(reason => expect(reason.length).toBeGreaterThan(20))
    })
})

suite('what the rules held before the CMS stays held (F59, F78 REQ-10)', () => {
    const OWNED = [
        ['artifacts', 'app1', 'users', OTHER, 'curator', 'c1'],
        ['artifacts', 'app1', 'users', OTHER, 'inventory', 'i1'],
        ['users', OTHER, 'series', 's1'],
        ['users', OTHER, 'series', 's1', 'albums', 'a1'],
        ['users', OTHER, 'series', 's1', 'playlists', 'p1'],
        ['users', OTHER, 'albumRankings', 'r1']
    ]

    it('what lives under a person is read and written by that person only', async () => {
        await seedAdmin()
        for (const path of OWNED) {
            await assertSucceeds(setDoc(doc(as.other(), ...path), { a: 1 }))
            await assertSucceeds(getDoc(doc(as.other(), ...path)))
            for (const who of ['admin', 'guest', 'nobody']) {
                await assertFails(getDoc(doc(as[who](), ...path)))
                await assertFails(setDoc(doc(as[who](), ...path), { a: 2 }))
            }
        }
    })

    const VERSIONED = [
        ['artifacts', 'app1', 'users', OTHER, 'curator', 'c1'],
        ['artifacts', 'app1', 'users', OTHER, 'inventory', 'i1'],
        ['users', OTHER, 'albumRankings', 'r1']
    ]

    it('an update on a path a repository writes never lowers _schemaVersion; absent counts as 0; create and delete are not asked', async () => {
        for (const path of VERSIONED) {
            await seed((db) => setDoc(doc(db, ...path), { _schemaVersion: 2, a: 1 }))
            await assertFails(updateDoc(doc(as.other(), ...path), { _schemaVersion: 1 }))
            await assertSucceeds(updateDoc(doc(as.other(), ...path), { _schemaVersion: 2 }))
            await assertSucceeds(updateDoc(doc(as.other(), ...path), { a: 5 })) // a write with no version leaves the stored one
            await assertSucceeds(deleteDoc(doc(as.other(), ...path)))
            await assertSucceeds(setDoc(doc(as.other(), ...path), { _schemaVersion: 1 })) // creating is not asked
        }
        await seed((db) => setDoc(doc(db, 'spotify_enrichment', 'k'), { _schemaVersion: 2 }))
        await assertFails(updateDoc(doc(as.guest(), 'spotify_enrichment', 'k'), { _schemaVersion: 1 }))
        await assertSucceeds(updateDoc(doc(as.guest(), 'spotify_enrichment', 'k'), { _schemaVersion: 2 }))
    })

    it('the Discogs reading of an inventory item needs no field list: any field of the owner is accepted (F75 REQ-14)', async () => {
        await assertSucceeds(setDoc(doc(as.other(), 'artifacts', 'app1', 'users', OTHER, 'inventory', 'i9'), { discogsReading: { value: 9 }, anyNewField: true }))
    })

    it('the spotify_enrichment cache is read by any signed-in person and by no one with no login', async () => {
        await seed((db) => setDoc(doc(db, 'spotify_enrichment', 'k'), { a: 1 }))
        await assertSucceeds(getDoc(doc(as.guest(), 'spotify_enrichment', 'k')))
        await assertFails(getDoc(doc(as.nobody(), 'spotify_enrichment', 'k')))
    })
})

// ---------------------------------------------------------------------------------------------
// The crate of the entry page (F82 TASK-04, REQ-03): `published/crate`
// ---------------------------------------------------------------------------------------------
suite('published/crate: the crate of albums of the entry page (F82 REQ-03, F95)', () => {
    const store = (db) => ({ db, doc, getDoc, setDoc, writeBatch, serverTimestamp })
    const repository = (db) => { const given = store(db); return new PublishedCrateRepository({ ...given, runTransaction: batchTransaction(given) }) }
    const crate = () => doc(as.admin(), 'published', 'crate')
    /** The crate with the first line of side A replaced. */
    const withLine = (line) => ({ ...CRATE, sideA: [line, ...crateSide(2, 5)] })
    const withAlbum = (over) => withLine(crateLine(1, over))
    const refusedEach = async (documents) => { for (const data of documents) await assertFails(setDoc(crate(), data)) }

    beforeEach(async () => { await seedAdmin() })

    it('everybody reads it, with no login (the entry page reads it for every visitor)', async () => {
        await seed((db) => setDoc(doc(db, 'published', 'crate'), CRATE))
        for (const who of ['nobody', 'guest', 'other', 'admin']) await assertSucceeds(getDoc(doc(as[who](), 'published', 'crate')))
    })

    it('the administrator saves the crate twice by the Painel\'s own save: rev 1 then 2; the public document is the crate alone, and the earlier side and who saved are in cmsWork', async () => {
        const repo = repository(as.admin())
        const sides = { a: crateAlbums(1, 6), b: crateAlbums(20, 4) }
        const first = await repo.saveCrate({ loadedRev: 0, sides, updatedBy: ADMIN })
        expect(first).toMatchObject({ status: 'saved', rev: 1 })
        const turned = [...sides.b].reverse()
        const second = await repo.saveCrate({ loadedRev: 1, sides: { a: sides.a, b: turned }, updatedBy: ADMIN })
        expect(second).toMatchObject({ status: 'saved', rev: 2 })
        const stored = (await getDoc(doc(as.nobody(), 'published', 'crate'))).data()
        expect(stored).toEqual({ _schemaVersion: 1, rev: 2, sideA: CRATE.sideA, sideB: [...CRATE.sideB].reverse() })
        expect(JSON.stringify(stored)).not.toContain(ADMIN)
        expect((await getDoc(doc(as.admin(), 'cmsWork', 'save_crate'))).data()).toMatchObject({ doc: 'crate', rev: 2, keys: ['sideB'], previous: { sideB: CRATE.sideB }, updatedBy: ADMIN })
        await assertFails(getDoc(doc(as.nobody(), 'cmsWork', 'save_crate')))
    })

    it('the largest crate (ten a side, every line at its longest) is accepted, created and updated: the check of twenty albums fits the rules\' limit of 1000 expressions', async () => {
        const full = (from) => ({ sideA: Array.from({ length: 10 }, (_, i) => longestLine(from + i)), sideB: Array.from({ length: 10 }, (_, i) => longestLine(from + 50 + i)) })
        expect(longestLine(1).length).toBeGreaterThan(1200)
        await assertSucceeds(setDoc(crate(), { ...CRATE, ...full(1) }))
        await assertSucceeds(setDoc(crate(), { ...CRATE, rev: 2, ...full(200) }))
    })

    it('the margin under the limit of 1000 expressions, measured: the largest save still fits with 32 more checks added to the rule, created and updated', async () => {
        const end = '        && validCrateSide(request.resource.data.sideB, 4, 10);'
        expect(RULES).toContain(end)
        const padded = RULES.replace(end, end.slice(0, -1) + ' && request.resource.data.rev is int'.repeat(32) + ';')
        const [host, port] = HOST.split(':')
        const wider = await initializeTestEnvironment({ projectId: 'demo-mjrp-rules-margin', firestore: { rules: padded, host, port: Number(port) } })
        try {
            await wider.withSecurityRulesDisabled((context) => setDoc(doc(context.firestore(), 'cmsAdmins', ADMIN), { role: 'super' }))
            const target = doc(wider.authenticatedContext(ADMIN, REAL).firestore(), 'published', 'crate')
            const full = (from) => ({ sideA: Array.from({ length: 10 }, (_, i) => longestLine(from + i)), sideB: Array.from({ length: 10 }, (_, i) => longestLine(from + 50 + i)) })
            await assertSucceeds(setDoc(target, { ...CRATE, ...full(1) }))
            await assertSucceeds(setDoc(target, { ...CRATE, rev: 2, ...full(200) }))
        } finally { await wider.cleanup() }
    })

    it('a crate saved on another device in between comes back as a conflict, and nothing is written', async () => {
        const here = repository(as.admin())
        const there = repository(as.admin())
        const b = crateAlbums(20, 4)
        await here.saveCrate({ loadedRev: 0, sides: { a: crateAlbums(1, 6), b }, updatedBy: ADMIN })
        await there.saveCrate({ loadedRev: 1, sides: { a: crateAlbums(40, 6), b }, updatedBy: ADMIN })
        const result = await here.saveCrate({ loadedRev: 1, sides: { a: crateAlbums(60, 6), b }, updatedBy: ADMIN })
        expect(result).toMatchObject({ status: 'conflict', rev: 2 })
        expect((await getDoc(doc(as.nobody(), 'published', 'crate'))).data().sideA[0]).toBe(crateLine(40))
    })

    it('another account, a guest, a person with no login and the administrator signed in anonymously are refused, create and update', async () => {
        for (const who of ['other', 'guest', 'nobody', 'adminAnonymous']) await assertFails(setDoc(doc(as[who](), 'published', 'crate'), CRATE))
        await seed((db) => setDoc(doc(db, 'published', 'crate'), CRATE))
        for (const who of ['other', 'guest', 'nobody', 'adminAnonymous']) await assertFails(setDoc(doc(as[who](), 'published', 'crate'), { ...CRATE, rev: 2 }))
    })

    it('the record must say "super": another role writes nothing', async () => {
        await seedAdmin('editor')
        await assertFails(setDoc(crate(), CRATE))
    })

    it('a side outside its limits is refused: side A 6 to 10, side B 4 to 10', async () => {
        await refusedEach([
            { ...CRATE, sideA: crateSide(1, 5) }, { ...CRATE, sideA: crateSide(1, 11) }, { ...CRATE, sideB: crateSide(20, 3) }, { ...CRATE, sideB: crateSide(20, 11) }
        ])
    })

    it('the document is the two sides and nothing else: a field more (a «previous» too), a side that is not a list and a missing side are refused', async () => {
        await refusedEach([
            { ...CRATE, updatedBy: ADMIN }, { ...CRATE, previous: { sideA: null, sideB: null } }, { ...CRATE, previous: { sideA: ['x'.repeat(900000)] } },
            { ...CRATE, sideA: { 0: crateLine(1) } }, { _schemaVersion: 1, rev: 1, sideA: CRATE.sideA }, { ...CRATE, sideB: 'x' }
        ])
    })

    it('an album is one line of text of six values: a map (with any keys), a number, a line with a value more or a value less are refused', async () => {
        await refusedEach([
            withLine({ id: '1', title: 'T', artist: 'A', year: 1990, art: 'Music1/v4/1/c.jpg', href: 'https://music.apple.com/us/album/a/1' }),
            withLine({ id: '1', art: 'Music1/v4/1/c.jpg', href: 'https://music.apple.com/us/album/a/1', x: 1, y: 2, z: 3 }),
            withLine(7), withLine(null), withLine(true),
            withLine(`${crateLine(1)}<more`), withLine(crateLine(1).split('<').slice(1).join('<')), withLine('')
        ])
    })

    it('no text has room to grow: a line over 1300 characters is refused, whichever value is the long one (a title of 900 KB too)', async () => {
        await refusedEach([
            withAlbum({ title: 'x'.repeat(900000) }), withAlbum({ title: 'x'.repeat(201) }), withAlbum({ artist: 'x'.repeat(201) }),
            withAlbum({ id: 'x'.repeat(65) }), withAlbum({ href: `https://music.apple.com/${'x'.repeat(471)}` }),
            withAlbum({ art: `Music1/${'a'.repeat(1400)}.jpg` }), withAlbum({ title: 'T'.repeat(200), artist: 'A'.repeat(200), art: `Music1/${'a'.repeat(900)}.jpg` })
        ])
    })

    it('a title or an artist with markup or empty is refused; so is a bad id, and a year that is not four digits', async () => {
        await refusedEach([
            withAlbum({ title: '<img src=x onerror=alert(1)>' }), withAlbum({ artist: 'A > B' }), withAlbum({ title: 'a<b' }), withAlbum({ title: '' }), withAlbum({ artist: '' }),
            withAlbum({ id: 'a b' }), withAlbum({ id: '../x' }), withAlbum({ id: '' }), withAlbum({ id: 'a.b' }),
            withAlbum({ year: 90 }), withAlbum({ year: 19900 }), withAlbum({ year: '199x' }), withAlbum({ year: '0990' }), withAlbum({ year: 1990.5 })
        ])
    })

    it('the cover is a path on Apple\'s image server, never an address: another server, a way out of the folder (written plainly or as %2e), % and backslash are refused', async () => {
        for (const art of [
            'https://evil.example/x.jpg', '//evil.example/x.jpg', '/Music/x.jpg', 'Music/../../x.jpg', '../x.jpg', 'Music/..', 'Music/x y.jpg', 'Music/x.jpg?u=1',
            'Music/x.jpg#f', 'Music\\x.jpg', 'Music/a@b/x.jpg', 'javascript:alert(1)', 'x.jpg', '', 'Music/a..b.jpg', 'Music//x.jpg', 'Music/x.jpg/',
            'a/%2e%2e/%2e%2e/x', 'Music/%2E%2E/x.jpg', 'Music/a%2fb/x.jpg', 'Music/%5c/x.jpg', 'Music/.hidden/x.jpg', 'Music/x.jpg.'
        ]) await assertFails(setDoc(crate(), withAlbum({ art })))
        await assertSucceeds(setDoc(crate(), withAlbum({ art: 'Music115/v4/e0/4b/c4/e04bc4e6-9d3a-0bab/093624924722.rgb.jpg' })))
    })

    it('the address to listen is an Apple Music page, https, in printable ASCII: anything else is refused', async () => {
        for (const href of [
            'http://music.apple.com/us/album/x/1', 'https://music.apple.com.evil.example/us/album/x/1', 'https://musicXapple.com/x', 'https://evil.example/', 'javascript:alert(1)',
            'music://x', 'https://music.apple.com/us/album/x y/1', 'https://music.apple.com/us\nx', 'https://music.apple.com/us/>b', 'https://music.apple.com/us/álbum', ''
        ]) await assertFails(setDoc(crate(), withAlbum({ href })))
        await assertSucceeds(setDoc(crate(), withAlbum({ href: 'https://music.apple.com/us/album/admir%C3%A1vel-chip-novo/977428211' })))
    })

    it('a bad album is refused in any place of either side, the last ones too', async () => {
        const bad = crateLine(99, { art: 'https://evil.example/x.jpg' })
        await refusedEach([
            { ...CRATE, sideA: [...crateSide(1, 9), bad] }, { ...CRATE, sideB: [...crateSide(20, 9), bad] }, { ...CRATE, sideB: [...crateSide(20, 3), bad] },
            { ...CRATE, sideA: [...crateSide(1, 5), bad] }
        ])
    })

    it('rev starts at 1 and follows by one; _schemaVersion never goes down; nobody deletes', async () => {
        await assertFails(setDoc(crate(), { ...CRATE, rev: 2 }))
        await assertSucceeds(setDoc(crate(), CRATE))
        await assertFails(setDoc(crate(), { ...CRATE, rev: 1 }))
        await assertFails(setDoc(crate(), { ...CRATE, rev: 3 }))
        await assertSucceeds(setDoc(crate(), { ...CRATE, rev: 2, _schemaVersion: 2 }))
        await assertFails(setDoc(crate(), { ...CRATE, rev: 3, _schemaVersion: 1 }))
        await assertFails(deleteDoc(crate()))
    })

    it('the crate cannot hide in another document: a field outside the site\'s list is refused, and so is a crate under another name', async () => {
        await assertFails(setDoc(doc(as.admin(), 'published', 'site'), { ...SITE, crate: { sideA: CRATE.sideA, sideB: CRATE.sideB } }))
        await assertFails(setDoc(doc(as.admin(), 'published', 'surprise'), CRATE))
        await assertFails(setDoc(doc(as.admin(), 'published', 'texts_pt'), CRATE))
    })

    it('the rules and the Painel\'s validator say the same of an album: what one accepts the other accepts, what one refuses the other refuses', async () => {
        const { validateAlbum, decodeAlbum } = await import('../../shared/content/crate.js')
        const cases = [
            {}, { title: 'Admirável Chip Novo', artist: 'Pitty' }, { title: 'A "quoted" & odd title' }, { art: 'Music5/v4/2f/c7/19/2fc71988/Court_2500px.jpg' },
            { title: '<b>x</b>' }, { art: 'a/%2e%2e/x' }, { art: 'Music/../x.jpg' }, { href: 'https://evil.example/' }, { year: 90 }, { id: 'a b' }, { title: 'x'.repeat(201) }
        ]
        for (const over of cases) {
            await env.clearFirestore()
            await seedAdmin()
            const line = crateLine(1, over)
            const byTheRules = await setDoc(crate(), withLine(line)).then(() => true, () => false)
            expect(byTheRules, JSON.stringify(over).slice(0, 60)).toBe(validateAlbum(decodeAlbum(line)).ok)
        }
    })

    it('what the rules cannot say the readers refuse: a control character or a mark that turns the text around in a name passes the rules and is refused by the validator of the Painel and of the entry page', async () => {
        const { validateAlbum, decodeAlbum } = await import('../../shared/content/crate.js')
        for (const title of ['evil‮gnp.exe', 'bell\u0007', '​​']) {
            await env.clearFirestore()
            await seedAdmin()
            await assertSucceeds(setDoc(crate(), withAlbum({ title })))
            expect(validateAlbum(decodeAlbum(crateLine(1, { title }))).ok, JSON.stringify(title)).toBe(false)
        }
    })

    it('the fixed set of the entry page saves as it is', async () => {
        const { COVER_SETS } = await import('../../public/splash/covers.js')
        const { encodeAlbum, validateAlbum } = await import('../../shared/content/crate.js')
        const real = COVER_SETS.real.map((r) => ({ id: r.k, title: r.t, artist: r.a, year: r.y, art: r.art, href: r.href }))
        expect(real.every((album) => validateAlbum(album).ok)).toBe(true)
        await assertSucceeds(setDoc(crate(), { ...CRATE, sideA: real.slice(0, 8).map(encodeAlbum), sideB: real.slice(8).reverse().map(encodeAlbum) }))
    })
})
