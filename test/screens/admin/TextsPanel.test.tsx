/**
 * F82 TASK-01, TASK-15 and TASK-16 (REQ-01, REQ-06, REQ-09, REQ-12, REQ-13): the Painel's Texts section, one test per state
 * the owner can be in: reading, could not read, no permission, nothing waiting, a search with no result, an orphan, a text
 * refused by the current version, what the site shows; changes not saved, the confirmation of what goes live, saving,
 * saved, refused by the check, failed with the reason, and the conflict between two devices.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { TextsPanel, type PanelProps } from '../../../public/js/screens/admin/TextsPanel'
import type { SaveAnswer, Stored } from '../../../public/js/screens/admin/kitPorts'
import { renderScreen, itLeavesNoListeners, type RenderedScreen } from '../../support/renderScreen'
import { CODE, panelProps, stored, type, type PropsOptions } from './support'

let open: RenderedScreen | null = null
afterEach(async () => { await open?.leave(); open = null })

async function show(options: PropsOptions = {}) {
    const props = panelProps(options)
    open = await renderScreen<PanelProps>(TextsPanel, props, { screen: 'admin' })
    const app = open.app
    const act = open.act
    const click = (selector: string) => act(() => { (app.querySelector(selector) as HTMLElement).click() })
    const text = (selector: string) => app.querySelector(selector)?.textContent ?? ''
    /** Opens a key's two fields and types in one of them. */
    const edit = async (key: string, locale: 'en' | 'pt', value: string) => {
        if (!app.querySelector(`[data-key="${key}"] .cms-editor`)) await click(`[data-key="${key}"] [data-act="edit"]`)
        await act(() => type(app.querySelector(`[data-key="${key}"] [data-lang="${locale}"] input.ak-input`) as HTMLInputElement, value))
    }
    return { props, app, act, click, text, edit }
}

describe('the read of the Painel', () => {
    it('says it is reading while the published texts do not come', async () => {
        const { text } = await show({ read: () => new Promise<Stored>(() => {}) })
        expect(text('[data-read="reading"]')).toBe('Reading what is published…')
    })

    it('says it could not read, and reads again when asked', async () => {
        let fail = true
        const { app, click } = await show({ read: async () => { if (fail) throw new Error('offline'); return stored() } })
        expect(app.querySelector('[data-read="failed"]')?.textContent).toContain('Could not read what is published.')
        fail = false
        await click('[data-read="failed"] button')
        expect(app.querySelector('[data-key="albums.title"]')).not.toBeNull()
    })

    it('says «no permission» to an account with no administrator record, and shows no field', async () => {
        const { app, text } = await show({ start: stored({ allowed: false }) })
        expect(text('[data-read="denied"]')).toContain('No permission.')
        expect(app.querySelector('.cms-row')).toBeNull()
    })

    it('says what the site shows: published, a copy or the code, and how many texts the current version refuses', async () => {
        const { text, app } = await show({ site: { source: 'copy', rejected: [{ key: 'albums.title', reason: 'markup' }] } })
        expect(text('[data-site="copy"] b')).toBe('copy (kept in this browser, up to 30 days)')
        expect(text('[data-rejected="1"]')).toBe('1 text refused by the current version')
        expect(app.querySelector('[data-key="albums.title"] [data-tag="rejected"]')?.textContent).toBe('refused by the current version')
        expect(app.querySelector('[data-key="albums.title"] [data-cell="en"] .ak-err-t')?.textContent).toBe('It cannot have < nor >.')
    })
})

describe('the texts by screen, English and Portuguese side by side', () => {
    it('lists the texts of the screen with the two languages and marks the Portuguese that waits', async () => {
        const { app, text } = await show()
        expect([...app.querySelectorAll('.cms-row')].map((row) => row.getAttribute('data-key'))).toEqual(['albums.title', 'albums.count'])
        expect(text('[data-key="albums.count"] [data-cell="en"] .cms-text')).toBe('{count} albums')
        expect(text('[data-key="albums.count"] [data-cell="pt"] .cms-text')).toBe('{count} álbuns')
        expect(text('[data-key="albums.title"] [data-tag="pending"]')).toBe('waiting for you')
        expect(text('[data-screen="albums"] .cms-n')).toBe('2')
    })

    it('changes screen through the kit navigation, and the menu keeps switches and recipes for later, turned off', async () => {
        const { app, click, props } = await show()
        await click('[data-screen="blend"]')
        expect([...app.querySelectorAll('.cms-row')].map((row) => row.getAttribute('data-key'))).toEqual(['blend.title'])
        expect(props.went).toEqual([{ path: 'blend', replace: true }])
        expect(app.querySelector('[data-key="blend.title"] [data-tag="live"]')?.textContent).toBe('live')
        expect([...app.querySelectorAll<HTMLButtonElement>('[data-later]')].map((button) => button.disabled)).toEqual([true, true])
    })

    it('finds a text by the word, on every screen, and says when nothing has it', async () => {
        const { app, act, text } = await show()
        const search = app.querySelector('#cms-q') as HTMLInputElement
        await act(() => type(search, 'mistura'))
        expect([...app.querySelectorAll('.cms-row')].map((row) => row.getAttribute('data-key'))).toEqual(['blend.title'])
        await act(() => type(search, 'zzz'))
        expect(text('[data-empty="search"] b')).toBe('No text with «zzz».')
    })

    it('says «nothing waiting» when every Portuguese text of the screen is approved', async () => {
        const { app, click, text } = await show({ screen: 'blend' })
        await click('.cms-only input')
        expect(text('[data-empty="pending"] b')).toBe('Nothing waiting for you on this screen.')
        expect(app.querySelector('.cms-bulk')).toBeNull()
    })

    it('marks «orphan» a published text whose key left the code, and offers no field for it', async () => {
        const start = stored()
        start.sources = { ...start.sources, published: { en: {}, pt: { 'albums.gone': 'Sumiu' } } }
        const { app, text } = await show({ start })
        expect(text('[data-key="albums.gone"] [data-tag="orphan"]')).toBe('orphan')
        expect(app.querySelector('[data-key="albums.gone"] [data-act="edit"]')).toBeNull()
    })
})

describe('the fields of the kit', () => {
    it('a label is a plain one-line field; a running text is the kit rich editor with its bar', async () => {
        const { app, click } = await show({ screen: 'admin' })
        await click('[data-key="admin.help.rich"] [data-act="edit"]')
        expect(app.querySelectorAll('[data-key="admin.help.rich"] .ak-rt-bar').length).toBe(2)
        expect(app.querySelector('[data-key="admin.help.rich"] .ak-rt-bar [data-cmd="bold"]')?.getAttribute('aria-label')).toBe('Bold (⌘B)')
        expect(app.querySelector('[data-key="admin.help.rich"] .ak-rt-bar [data-cmd="bold"]')).not.toBeNull()
        await click('[data-screen="albums"]')
        await click('[data-key="albums.title"] [data-act="edit"]')
        expect(app.querySelectorAll('[data-key="albums.title"] input.ak-input[type="text"]').length).toBe(2)
        expect(app.querySelector('[data-key="albums.title"] .ak-rt-bar')).toBeNull()
    })

    it('translates from the other language and puts it in the field only when accepted', async () => {
        const { click, text } = await show()
        await click('[data-key="albums.title"] [data-act="edit"]')
        await click('[data-key="albums.title"] [data-lang="pt"] .ak-tr-btn')
        expect(text('[data-key="albums.title"] [data-lang="pt"] .ak-tr-rev textarea')).toBe('[pt] Albums')
        expect(text('[data-key="albums.title"] [data-cell="pt"] .cms-text')).toBe('Álbuns')
        await click('[data-key="albums.title"] [data-lang="pt"] .ak-tr-acts .pri')
        expect(text('[data-key="albums.title"] [data-cell="pt"] .cms-text')).toBe('[pt] Albums')
    })

    it('says in plain words that the translation is not configured, and the field does not change', async () => {
        const { click, text } = await show({ reason: () => 'notConfigured', translate: async () => ({ ok: false, failure: 'refused', message: 'notConfigured' }) })
        await click('[data-key="albums.title"] [data-act="edit"]')
        await click('[data-key="albums.title"] [data-lang="pt"] .ak-tr-btn')
        expect(text('[data-key="albums.title"] [data-lang="pt"] .ak-tr-fail span')).toBe('Could not translate: the translation service is not configured on the server yet (its key is missing). The field stays as it was.')
        expect(text('[data-key="albums.title"] [data-cell="pt"] .cms-text')).toBe('Álbuns')
    })
})

describe('the save bar', () => {
    it('starts «All saved», with Save and Discard turned off', async () => {
        const { app, text } = await show()
        expect(text('.cms-bar-info b')).toBe('All saved')
        expect((app.querySelector('[data-act="save"]') as HTMLButtonElement).disabled).toBe(true)
        expect((app.querySelector('[data-act="discard"]') as HTMLButtonElement).disabled).toBe(true)
    })

    it('counts the changes not saved, and «Discard» puts the texts back', async () => {
        const { edit, click, text } = await show()
        await edit('albums.title', 'en', 'Records')
        expect(text('.cms-bar-info b')).toBe('1 change not saved')
        expect(text('[data-key="albums.title"] [data-tag="unsaved"]')).toBe('not saved')
        await click('[data-act="discard"]')
        expect(text('.cms-bar-info b')).toBe('All saved')
        expect(text('[data-key="albums.title"] [data-cell="en"] .cms-text')).toBe('Albums')
    })

    it('asks to confirm what goes live, and «Back» saves nothing', async () => {
        const { edit, click, text, app, props } = await show()
        await edit('albums.title', 'en', 'Records')
        await edit('albums.count', 'pt', '{count} discos')
        await click('[data-act="save"]')
        expect(text('[data-state="confirm"] b')).toBe('2 texts go live now.')
        expect(text('[data-state="confirm"] .cms-keys')).toBe('albums.title · albums.count')
        await click('[data-act="save-back"]')
        expect(app.querySelector('[data-state="confirm"]')).toBeNull()
        expect(props.store.saves).toEqual([])
    })

    it('says «saving» while the save runs, then «saved and live», on the revision that was read', async () => {
        let finish: (answer: SaveAnswer) => void = () => {}
        const { edit, click, text, act, props } = await show({ answer: () => new Promise<SaveAnswer>((resolve) => { finish = resolve }) })
        await edit('albums.title', 'en', 'Records')
        await click('[data-act="save"]')
        await click('[data-act="save-confirm"]')
        expect(text('[data-state="saving"]')).toBe('Saving… the site stays live with the version of now.')
        await act(() => finish({ status: 'saved', rev: 4, texts: { 'albums.title': 'Records' }, changed: ['albums.title'] }))
        expect(text('[data-state="saved"]')).toBe('✓ Saved and live: 1 text.')
        expect(text('.cms-bar-info b')).toBe('All saved')
        expect(props.store.saves).toEqual([{ locale: 'en', loadedRev: 3, edits: { 'albums.title': 'Records' } }])
    })

    it('a text put back to the code leaves the published document', async () => {
        const start = stored()
        start.sources = { ...start.sources, published: { en: { 'albums.title': 'Records' }, pt: {} } }
        const { edit, click, props } = await show({ start })
        await edit('albums.title', 'en', CODE.en['albums.title']!)
        await click('[data-act="save"]')
        await click('[data-act="save-confirm"]')
        expect(props.store.saves[0]?.edits).toEqual({ 'albums.title': null })
    })

    it('refuses a text without the {count} of the English, says why, and saves nothing', async () => {
        const { edit, click, text, props } = await show()
        await edit('albums.count', 'pt', 'muitos álbuns')
        expect(text('[data-key="albums.count"] [data-invalid="placeholders"]')).toBe('It must keep the same {markers} as the English.')
        await click('[data-act="save"]')
        await click('[data-act="save-confirm"]')
        expect(text('[data-state="invalid"]')).toBe('Not saved: 1 text does not pass the check. Fix it and save again.')
        expect(props.store.saves).toEqual([])
    })

    it('warns when the text is much longer than the English, and still saves', async () => {
        const { edit, text } = await show()
        await edit('albums.title', 'pt', 'Os seus álbuns')
        expect(text('[data-key="albums.title"] [data-warning="long"]')).toBe('Much longer than the English: check that it fits on the screen.')
    })

    it('says the rules of the database refused the save, never silently, and keeps the changes', async () => {
        const { edit, click, text } = await show({ answer: async () => { throw Object.assign(new Error('denied'), { code: 'permission-denied' }) } })
        await edit('albums.title', 'en', 'Records')
        await click('[data-act="save"]')
        await click('[data-act="save-confirm"]')
        expect(text('[data-state="failed"] span')).toBe('Not saved: the database refused it: its rules do not accept this save yet (a new field, or a text outside the format). Nothing changed on the site, and your changes are still here.')
        expect(text('.cms-bar-info b')).toBe('1 change not saved')
    })

    it('says the database did not answer, and «Try again» saves', async () => {
        const { edit, click, text } = await show({ answer: async () => { throw Object.assign(new Error('down'), { code: 'unavailable' }) } })
        await edit('albums.title', 'en', 'Records')
        await click('[data-act="save"]')
        await click('[data-act="save-confirm"]')
        expect(text('[data-state="failed"] span')).toContain('the database did not answer.')
        await click('[data-act="save-retry"]')
        expect(text('[data-state="saved"]')).toBe('✓ Saved and live: 1 text.')
    })
})

describe('leaving with changes not saved', () => {
    it('tells the guard whether something is not saved, at the moment it is asked, and lets go of it on leaving', async () => {
        let unsaved: () => boolean = () => false
        let stopped = 0
        const { edit, click } = await show({ guardLeave: (asked) => { unsaved = asked; return () => { stopped++ } } })
        expect(unsaved()).toBe(false)
        await edit('albums.title', 'en', 'Records')
        expect(unsaved()).toBe(true)
        await click('[data-act="discard"]')
        expect(unsaved()).toBe(false)
        await open?.leave()
        open = null
        expect(stopped).toBeGreaterThan(0)
    })
})

describe('the conflict between two devices', () => {
    const conflict = async (): Promise<SaveAnswer> => ({
        status: 'conflict', rev: 9, texts: { 'albums.title': 'Discs' },
        conflicts: [{ key: 'albums.title', loaded: null, other: 'Discs', yours: 'Records' }],
    })
    const reach = async () => {
        const screen = await show({ answer: conflict })
        await screen.edit('albums.title', 'en', 'Records')
        await screen.click('[data-act="save"]')
        await screen.click('[data-act="save-confirm"]')
        return screen
    }

    it('shows as it was, the other and yours', async () => {
        const { app, text } = await reach()
        expect(text('[data-state="conflict"] b')).toBe('This text changed on another device of yours after you opened this page.')
        expect([...app.querySelectorAll('.cms-conflict-grid > div')].map((cell) => cell.textContent)).toEqual(['As it was(the text of the code)', 'The other change (already live)Discs', 'YoursRecords'])
    })

    it('«Save mine» saves again over the revision the other device left', async () => {
        const { click, text, props } = await reach()
        await click('[data-act="conflict-mine"]')
        expect(props.store.saves[1]).toEqual({ locale: 'en', loadedRev: 9, edits: { 'albums.title': 'Records' } })
        expect(text('[data-state="saved"]')).toBe('✓ Saved and live: 1 text.')
    })

    it('«Keep the other» gives up the change and shows what is live', async () => {
        const { click, text, props } = await reach()
        await click('[data-act="conflict-theirs"]')
        expect(props.store.saves.length).toBe(1)
        expect(text('[data-key="albums.title"] [data-cell="en"] .cms-text')).toBe('Discs')
        expect(text('.cms-bar-info b')).toBe('All saved')
    })
})

describe('approving the Portuguese saves', () => {
    it('one text: the approval is kept and the text no longer waits', async () => {
        const { app, click, text, props } = await show()
        await click('[data-key="albums.title"] [data-act="approve"]')
        expect(props.store.approved).toEqual([['blend.title', 'admin.help.rich', 'albums.title']])
        expect(app.querySelector('[data-key="albums.title"] [data-tag="pending"]')).toBeNull()
        expect(text('[data-state="saved"]')).toBe('✓ Approved and live: 1 Portuguese text.')
    })

    it('the selected ones, with the change typed in one of them saved along', async () => {
        const { app, edit, click, props } = await show()
        await edit('albums.count', 'pt', '{count} discos')
        await click('[data-key="albums.count"] .cms-chk input')
        await click('[data-act="approve-selected"]')
        expect(props.store.saves).toEqual([{ locale: 'pt', loadedRev: 5, edits: { 'albums.count': '{count} discos' } }])
        expect(props.store.approved[0]).toContain('albums.count')
        expect(app.querySelector('[data-key="albums.title"] [data-tag="pending"]')).not.toBeNull()
    })

    it('all of the screen at once', async () => {
        const { app, click, props } = await show()
        await click('[data-act="approve-screen"]')
        expect(props.store.approved[0]).toEqual(['blend.title', 'admin.help.rich', 'albums.title', 'albums.count'])
        expect(app.querySelector('[data-tag="pending"]')).toBeNull()
    })
})

itLeavesNoListeners<PanelProps>('TextsPanel', TextsPanel, panelProps(), { screen: 'admin' })
