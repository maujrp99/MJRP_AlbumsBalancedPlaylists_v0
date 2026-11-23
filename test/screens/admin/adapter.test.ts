/**
 * F82 TASK-01, TASK-14 and TASK-16 (REQ-01, REQ-06, REQ-08, REQ-13): the adapters of the Painel, with no screen: the
 * dictionaries of one file per language as the kit's pairs and back; the storage on the content repository; the kit's
 * ports (storage, navigation on the router, words from the dictionary); and the translation's named failures.
 */
import { describe, it, expect, vi } from 'vitest'
import { admin as adminEn } from '../../../public/js/i18n/en/admin.js'
import { admin as adminPt } from '../../../public/js/i18n/pt/admin.js'
import { t, tPlural } from '../../../public/js/i18n/t.js'
import { APPROVED_ID, contentStore, type ContentRepository } from '../../../public/js/screens/admin/contentStore'
import { albumBlenderPorts, failureOf, hrefOf, kitTexts, locationOf, routerNavigation } from '../../../public/js/screens/admin/kitPorts'
import { installLeaveGuard } from '../../../public/js/screens/admin/leaveGuard'
import { richTexts } from '../../../public/js/screens/admin/richTexts'
import { editsOf, pendingOf, screensOf, toKitValues, unsavedKeys, visibleKeys, withEdit, type Sources } from '../../../public/js/screens/admin/model'
import { bodyOf, reasonOf, translateText } from '../../../public/js/screens/admin/translate'
import { forSave, invalidEdits, saveAll } from '../../../public/js/screens/admin/usePanel'
import { SKIN_TOKENS } from '../../../public/js/ui/admin-kit/index'
import { CODE, check, fakeStore, memoryNavigation, stored } from './support'
import fs from 'node:fs'

const sources = (over: Partial<Sources> = {}): Sources => ({ code: CODE, published: { en: {}, pt: {} }, approved: [], ...over })

describe('the dictionaries as the pairs of the kit', () => {
    it('one pair per key, the published text over the one of the code, in the order of the dictionary', () => {
        const values = toKitValues(sources({ published: { en: { 'albums.title': 'Records' }, pt: {} }, approved: ['albums.title'] }))
        expect(Object.keys(values)).toEqual(Object.keys(CODE.en))
        expect(values['albums.title']).toEqual({ en: 'Records', pt: 'Álbuns' })
        expect(values['albums.count']).toEqual({ en: '{count} albums', pt: '{count} álbuns', state: 'pending' })
    })

    it('a published key the code lost comes last, with no English of the code (an orphan)', () => {
        const values = toKitValues(sources({ published: { en: {}, pt: { 'albums.gone': 'Sumiu' } } }))
        expect(Object.keys(values).at(-1)).toBe('albums.gone')
        expect(values['albums.gone']).toEqual({ en: '', pt: 'Sumiu', state: 'pending' })
    })

    it('gives back only what changed, by language', () => {
        const saved = toKitValues(sources())
        const values = withEdit(withEdit(saved, 'albums.title', 'pt', 'Os álbuns'), 'blend.title', 'en', 'Mix')
        expect(editsOf(saved, values, 'pt')).toEqual({ 'albums.title': 'Os álbuns' })
        expect(editsOf(saved, values, 'en')).toEqual({ 'blend.title': 'Mix' })
        expect(unsavedKeys(saved, values)).toEqual(['blend.title', 'albums.title'])
        expect(unsavedKeys(saved, withEdit(values, 'albums.title', 'pt', 'Álbuns'))).toEqual(['blend.title'])
    })

    it('counts what waits by screen, and a search looks at every screen', () => {
        const values = toKitValues(sources({ approved: ['albums.title'] }))
        expect(screensOf(values)).toEqual([{ id: 'albums', waiting: 1 }, { id: 'blend', waiting: 1 }, { id: 'start', waiting: 1 }])
        expect(pendingOf(values, 'albums')).toEqual(['albums.count'])
        expect(visibleKeys(values, { screen: 'albums', query: '', onlyPending: true })).toEqual(['albums.count'])
        expect(visibleKeys(values, { screen: 'albums', query: 'MISTURA', onlyPending: false })).toEqual(['blend.title'])
    })
})

describe('the storage on the content repository', () => {
    const repository = (over: Partial<ContentRepository> = {}): ContentRepository => ({
        readTexts: async (locale) => (locale === 'pt' ? { exists: true, data: { rev: 7, texts: { 'albums.title': 'Os álbuns' } } } : { exists: false }),
        readAdmin: async () => ({ role: 'super' }),
        readWork: async () => ({ keys: ['albums.title', 7] }),
        writeWork: vi.fn(async () => {}),
        saveTexts: vi.fn(async () => ({ status: 'saved' as const, rev: 8, texts: {}, changed: [] })),
        ...over,
    })
    const readDocument = (data: unknown) => ({ ok: true as const, rev: (data as { rev: number }).rev, texts: (data as { texts: Record<string, string> }).texts })
    const store = (repo: ContentRepository) => contentStore({ repository: async () => repo, uid: () => 'owner', code: CODE, readDocument })

    it('reads the two languages with their revisions (0 when the document does not exist) and the approvals', async () => {
        const read = await store(repository()).read()
        expect(read.revs).toEqual({ en: 0, pt: 7 })
        expect(read.sources.published).toEqual({ en: {}, pt: { 'albums.title': 'Os álbuns' } })
        expect(read.sources.approved).toEqual(['albums.title'])
        expect(read.allowed).toBe(true)
    })

    it('an account with no record is not allowed, and the work area is not asked for', async () => {
        const readWork = vi.fn(async () => null)
        const read = await store(repository({ readAdmin: async () => null, readWork })).read()
        expect(read.allowed).toBe(false)
        expect(readWork).not.toHaveBeenCalled()
    })

    it('a stored document that cannot be read keeps its revision, so the next save follows it', async () => {
        const repo = repository({ readTexts: async () => ({ exists: true, data: { rev: 4, texts: 'broken' } }) })
        const read = await contentStore({ repository: async () => repo, uid: () => 'owner', code: CODE, readDocument: () => ({ ok: false }) }).read()
        expect(read.revs).toEqual({ en: 4, pt: 4 })
        expect(read.sources.published).toEqual({ en: {}, pt: {} })
    })

    it('saves with who saved, and keeps the approvals as one sorted list', async () => {
        const repo = repository()
        await store(repo).saveTexts('pt', { loadedRev: 7, loadedTexts: {}, edits: { 'albums.title': 'Os álbuns' } })
        expect(repo.saveTexts).toHaveBeenCalledWith('pt', { loadedRev: 7, loadedTexts: {}, edits: { 'albums.title': 'Os álbuns' }, updatedBy: 'owner' })
        await store(repo).saveApproved(['b', 'a'])
        expect(repo.writeWork).toHaveBeenCalledWith(APPROVED_ID, { keys: ['a', 'b'] })
    })
})

describe('the save of the Painel', () => {
    it('saves each language on the revision read and says what is live', async () => {
        const store = fakeStore()
        const start = stored()
        const saved = toKitValues(start.sources)
        const values = withEdit(withEdit(saved, 'albums.title', 'en', 'Records'), 'albums.title', 'pt', 'Os álbuns')
        const live = vi.fn()
        const result = await saveAll(store, start, forSave(start, saved, values), live)
        expect(store.saves).toEqual([{ locale: 'en', loadedRev: 3, edits: { 'albums.title': 'Records' } }, { locale: 'pt', loadedRev: 5, edits: { 'albums.title': 'Os álbuns' } }])
        expect(result).toMatchObject({ saved: 2, stored: { revs: { en: 4, pt: 6 } } })
        expect(live).toHaveBeenCalledWith('pt', { 'albums.title': 'Os álbuns' })
    })

    it('stops at a conflict: the language in conflict is not written and the next one is not tried', async () => {
        const store = fakeStore({ answer: async () => ({ status: 'conflict', rev: 9, texts: {}, conflicts: [{ key: 'albums.title', loaded: null, other: 'Discs', yours: 'Records' }] }) })
        const start = stored()
        const saved = toKitValues(start.sources)
        const values = withEdit(withEdit(saved, 'albums.title', 'en', 'Records'), 'albums.title', 'pt', 'Os álbuns')
        const result = await saveAll(store, start, forSave(start, saved, values))
        expect(result).toMatchObject({ locale: 'en', conflict: { rev: 9 } })
        expect(store.saves.length).toBe(1)
    })

    it('names the edits that fail the check, and an orphan is never saved', () => {
        const start = stored()
        const bad = invalidEdits({ check, kindOf: () => 'plain' }, start, { en: { 'albums.count': 'many' }, pt: { 'albums.title': ' ', 'albums.gone': 'x', 'blend.title': 'Mix' } })
        expect(bad).toEqual(['albums.count', 'albums.title', 'albums.gone'])
    })
})

describe('the ports the kit is given', () => {
    const ports = (store = fakeStore(), navigation = memoryNavigation()) => albumBlenderPorts({
        store, navigation, pages: [], texts: kitTexts(t), translate: async (text) => ({ ok: true, value: text }),
    })

    it('loads the content as pairs with one version for the two revisions, and saves on it', async () => {
        const store = fakeStore()
        const kit = ports(store)
        const read = await kit.load()
        if (!read.ok) throw new Error('the read failed')
        expect(read.value.version).toBe('3.5')
        const saved = await kit.save(withEdit(read.value.values, 'albums.title', 'pt', 'Os álbuns'), read.value.version)
        expect(saved).toEqual({ ok: true, value: { version: '3.6' } })
        expect(await kit.save(read.value.values, '3.5')).toEqual({ ok: false, failure: 'conflict' })
    })

    it('a read that fails is a failure, never an empty content', async () => {
        const kit = ports(fakeStore({ read: async () => { throw new Error('offline') } }))
        expect(await kit.load()).toEqual({ ok: false, failure: 'read-failed', message: 'offline' })
    })

    it('names the failure of a save from what the database said', () => {
        expect(failureOf({ code: 'permission-denied' })).toEqual({ failure: 'refused' })
        expect(failureOf({ code: 'unauthenticated' })).toEqual({ failure: 'session-expired' })
        expect(failureOf({ code: 'unavailable' })).toEqual({ failure: 'save-failed', message: 'unavailable' })
    })

    it('moves through the router: it writes the address by setAddress and never touches the history', () => {
        const router = { pathname: () => '/admin/texts/blend', setAddress: vi.fn(), afterNavigate: vi.fn(() => () => {}) }
        const navigation = routerNavigation(router)
        expect(navigation.where()).toEqual({ path: 'blend' })
        navigation.go({ path: 'albums' }, { replace: true })
        expect(router.setAddress).toHaveBeenCalledWith('/admin/texts/albums', { replace: true })
        expect(locationOf('/admin')).toEqual({ path: '' })
        expect(hrefOf('')).toBe('/admin')
        const source = fs.readFileSync('public/js/screens/admin/kitPorts.ts', 'utf8')
        expect(source).not.toMatch(/history\.\w+\(|popstate|hashchange/)
    })

    it('hands the kit every word it asks for, from the dictionary, in English and in Portuguese', () => {
        const dictionary = (name: string) => fs.readFileSync(`public/js/i18n/${name}/admin.js`, 'utf8')
        const words = kitTexts(t)
        const missing = Object.entries(words).filter(([, value]) => typeof value === 'string' && value.startsWith('admin.'))
        expect(missing).toEqual([])
        expect(words.translate?.from).toBe('Translate from {language}')
        const keys = (text: string) => [...text.matchAll(/^ {4}'(admin\.[\w.]+)'/gm)].map((match) => match[1])
        expect(keys(dictionary('pt'))).toEqual(keys(dictionary('en')))
        expect(keys(dictionary('en')).length).toBeGreaterThan(150)
    })

    it('the skin declares every token of the kit contract, and hides image, video and book', () => {
        const skin = fs.readFileSync('public/css/admin-skin.css', 'utf8')
        expect(SKIN_TOKENS.filter((token) => !skin.includes(`${token}:`))).toEqual([])
        for (const tool of ['img', 'video', 'book']) expect(skin).toContain(`.ak-rt-bar button[data-cmd="${tool}"]`)
        expect(skin).toMatch(/@media \(max-width: 767px\) \{\s*\[data-admin-skin="albumblender"\] \.ak-rt-bar button \{ min-width: 44px; min-height: 44px; \}/)
    })
})

describe('the Painel lists the texts of the site only (the judge of 2026-11-23, P2-2)', () => {
    it('its own words (admin.*) are not offered for editing: the reader of the site would refuse them as unknown keys', () => {
        const wiring = fs.readFileSync('public/js/screens/admin/adminPanel.ts', 'utf8')
        expect(wiring).toContain('code: { en, pt },')
        expect(wiring).not.toMatch(/OWN_RICH|\.\.\.adminEn|\.\.\.adminPt/)
        expect(Object.keys(adminEn).filter((key) => /^admin\.(help|screens\.admin)/.test(key))).toEqual([])
    })
})

describe('the save bar stays in reach (the judge of 2026-11-23, P1-1)', () => {
    const skin = fs.readFileSync('public/css/admin-skin.css', 'utf8')
    const phone = skin.slice(skin.indexOf('@media (max-width: 899px)'))

    it('on the phone it sticks below the top bar of the app, by the app own measures, never under it', () => {
        expect(phone).toMatch(/\.cms-bar \{[^}]*top: calc\(var\(--phone-topbar-h\) \+ var\(--phone-safe-top\)\)/)
    })

    it('a tall message (the confirmation, the conflict) scrolls inside the bar instead of pushing the buttons off the screen', () => {
        expect(phone).toMatch(/\.cms-bar \{[^}]*max-height: calc\(100dvh - var\(--phone-topbar-h\) - var\(--phone-safe-top\) - var\(--phone-tabbar-h\) - var\(--phone-safe-bottom\)\);[^}]*overflow-y: auto/)
    })
})

describe('the translation by the route of the server', () => {
    const ask = { target: 'pt', text: 'Albums', kind: 'short', context: 'albums.title' }
    const failed = (reason: string) => ({ error: { code: 'X', retryable: false, reason } })

    it('posts the text with the language and the kind the route knows, and gives the translation', async () => {
        const post = vi.fn(async () => ({ status: 200, body: { data: { translation: 'Álbuns' }, outcome: 'found' } }))
        expect(await translateText({ post }, ask)).toEqual({ ok: true, value: 'Álbuns' })
        expect(post).toHaveBeenCalledWith('/api/admin/translate', { target: 'pt-BR', text: 'Albums', kind: 'plain', context: 'albums.title' })
        expect(bodyOf({ target: 'en', text: 'x', kind: 'rich' })).toEqual({ target: 'en', text: 'x', kind: 'rich' })
    })

    it.each([
        [401, failed('session-expired'), 'session'], [403, failed('not-an-administrator'), 'notAdmin'],
        [503, failed('translation-not-configured'), 'notConfigured'], [502, failed('translation-not-configured'), 'notConfigured'],
        [402, failed('credit-exhausted'), 'credit'], [503, failed('service-unavailable'), 'service'], [413, failed('text-too-long'), 'tooLong'],
        [429, failed('too-many-requests'), 'tooMany'], [400, failed('invalid-request'), 'invalid'], [502, failed('translation-unusable'), 'unusable'],
        [401, null, 'session'], [403, {}, 'notAdmin'], [500, null, 'service'],
    ])('a %i answer %j is the failure «%s»', (status, body, reason) => {
        expect(reasonOf(status, body)).toBe(reason)
    })

    it('every reason has its plain words in the dictionary, in English and in Portuguese', () => {
        for (const reason of ['session', 'notAdmin', 'notConfigured', 'credit', 'service', 'tooLong', 'tooMany', 'invalid', 'unusable']) {
            expect(adminEn[`admin.translate.reason.${reason}` as keyof typeof adminEn], reason).toBeTruthy()
            expect(adminPt[`admin.translate.reason.${reason}` as keyof typeof adminPt], reason).toBeTruthy()
        }
    })

    it('a failure names its reason to the Painel and to the kit, and an answer with no text is a failure', async () => {
        const onFailure = vi.fn()
        expect(await translateText({ post: async () => ({ status: 503, body: failed('translation-not-configured') }), onFailure }, ask)).toEqual({ ok: false, failure: 'refused', message: 'notConfigured' })
        expect(onFailure).toHaveBeenCalledWith('notConfigured')
        expect(await translateText({ post: async () => ({ status: 401, body: null }) }, ask)).toEqual({ ok: false, failure: 'session-expired' })
        expect(await translateText({ post: async () => ({ status: 200, body: { data: {} } }) }, ask)).toMatchObject({ ok: false, message: 'unusable' })
        expect(await translateText({ post: async () => { throw new Error('offline') } }, ask)).toMatchObject({ ok: false, message: 'service' })
    })
})

describe('the words of the rich editor', () => {
    it('come from the dictionary for every tool the bar shows, and count the words in the language', () => {
        const words = richTexts(t, tPlural)
        expect(words.tools.bold).toEqual({ name: 'Bold', does: 'Stresses the stretch; on the site, in the accent colour.' })
        expect(words.tools.undo).toEqual({ name: 'Undo', does: '' })
        expect(words.count(1, 1, 0)).toBe('1 word · 1 min read')
        expect(words.count(19, 1, 0)).toBe('19 words · 1 min read')
        const raw = JSON.stringify([words.tools, words.styles, words.inserts, words.link, words.expanded, words.toolbar, words.footHint, words.pasted, words.calloutPlaceholder, words.plainHint])
        expect(raw).not.toContain('admin.rich.')
        expect(adminPt['admin.rich.tools.bold.name']).toBe('Negrito')
        expect(adminPt['admin.rich.count.other']).toBe('{count} palavras · {minutes} min de leitura')
    })
})

describe('leaving the Painel with changes not saved', () => {
    const install = (unsaved: boolean, answer = false) => {
        let hook: () => boolean = () => true
        const removed = vi.fn()
        const confirm = vi.fn(() => answer)
        const uninstall = installLeaveGuard({ beforeNavigate: (asked) => { hook = asked; return removed }, question: () => t('admin.leave'), confirm }, () => unsaved)
        return { move: () => hook(), confirm, removed, uninstall }
    }

    it('asks before a move of the app, and a «no» keeps the person in the Painel', () => {
        const guard = install(true, false)
        expect(guard.move()).toBe(false)
        expect(guard.confirm).toHaveBeenCalledWith('There are changes not saved. Leave the admin and lose them?')
        const yes = install(true, true)
        expect(yes.move()).toBe(true)
        guard.uninstall()
        yes.uninstall()
    })

    it('does not ask when everything is saved', () => {
        const guard = install(false)
        expect(guard.move()).toBe(true)
        expect(guard.confirm).not.toHaveBeenCalled()
        guard.uninstall()
    })

    it('asks through the browser when the tab is closed, and lets go of everything when the Painel is left', () => {
        const guard = install(true)
        const closing = new Event('beforeunload', { cancelable: true })
        window.dispatchEvent(closing)
        expect(closing.defaultPrevented).toBe(true)
        guard.uninstall()
        expect(guard.removed).toHaveBeenCalled()
        const later = new Event('beforeunload', { cancelable: true })
        window.dispatchEvent(later)
        expect(later.defaultPrevented).toBe(false)
    })
})
