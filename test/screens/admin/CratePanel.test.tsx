/**
 * F82 TASK-04 (REQ-03, REQ-09) and F95: the Painel's «Caixa» section, one test per thing the owner does and per state he
 * can be in: the crate read (published, the fixed set, one to mend), reading, could not read, no permission; reorder, to the
 * other side, remove, add by a search or a link; the limits of a side said and enforced; the save bar with its confirmation,
 * saving, saved, failed with the reason, and the conflict with another device; the changes kept between the sections.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { TextsPanel, type PanelProps, type Section } from '../../../public/js/screens/admin/TextsPanel'
import type { CrateRead, CrateSaveAnswer } from '../../../public/js/screens/admin/crateStore'
import { PREVIEW_KEY, setLocale } from '../../../public/js/i18n/t.js'
import { renderScreen, type RenderedScreen } from '../../support/renderScreen'
import { album, crateRead, fixedCrate, panelProps, side, type, type PropsOptions } from './support'

let open: RenderedScreen | null = null
afterEach(async () => { await open?.leave(); open = null; window.localStorage.removeItem(PREVIEW_KEY); await setLocale('en') })

async function show(options: PropsOptions = {}) {
    let where: Section = 'crate'
    const section = options.section ?? { where: () => where, go: (next: Section) => { where = next }, listen: () => () => {} }
    const props = panelProps({ ...options, section })
    open = await renderScreen<PanelProps>(TextsPanel, props, { screen: 'admin' })
    const app = open.app
    const act = open.act
    const click = (selector: string) => act(() => { (app.querySelector(selector) as HTMLElement).click() })
    const text = (selector: string) => app.querySelector(selector)?.textContent ?? ''
    const ids = (which: 'a' | 'b') => [...app.querySelectorAll(`[data-side="${which}"] [data-album]`)].map((row) => row.getAttribute('data-album')).join(' ')
    const row = (id: string | number) => `[data-album="${id}"]`
    const search = async (query: string) => {
        await act(() => type(app.querySelector('#cms-crate-q') as HTMLInputElement, query))
        await act(async () => { (app.querySelector('.cms-add form') as HTMLFormElement).requestSubmit() })
    }
    return { props, app, act, click, text, ids, row, search, crate: props.crate.store }
}

describe('the menu of the Painel', () => {
    it('has «Crate» beside «Texts», and keeps «Switches · later» and «Blend recipes · later» turned off', async () => {
        const { app } = await show()
        const entries = [...app.querySelectorAll('.cms-rail .cms-navb')].map((button) => `${button.textContent}${(button as HTMLButtonElement).disabled ? ' (off)' : ''}`)
        expect(entries).toEqual(['Texts', 'Crate', 'Switches · later (off)', 'Blend recipes · later (off)'])
        expect(app.querySelector('.cms-navb[aria-current="page"]')?.textContent).toBe('Crate')
        expect(app.querySelector('h1')?.textContent).toBe("The Album Blender's crate")
    })

    it('in Portuguese the section is «Caixa», «Caixa do The Album Blender», with «álbuns»', async () => {
        window.localStorage.setItem(PREVIEW_KEY, 'pt') // Portuguese is open to who asked to preview it
        expect(await setLocale('pt')).toBe(true)
        const { app, text } = await show()
        expect(app.querySelector('.cms-navb[aria-current="page"]')?.textContent).toBe('Caixa')
        expect(app.querySelector('h1')?.textContent).toBe('Caixa do The Album Blender')
        expect(text('[data-side="a"] [data-count-tag]')).toBe('6 álbuns · de 6 a 10')
        expect(app.textContent).not.toMatch(/disco/i)
    })

    it('a change of the crate not saved is kept while the owner looks at the texts, and leaving the Painel asks first', async () => {
        let unsaved: (() => boolean) | null = null
        const { click, ids, row, app } = await show({ guardLeave: (ask) => { unsaved = ask; return () => {} } })
        expect(unsaved!()).toBe(false)
        await click(`${row(2)} [data-act="up"]`)
        expect(unsaved!()).toBe(true)
        await click('[data-section="texts"]')
        expect(app.querySelector('h1')?.textContent).toBe('Texts')
        await click('[data-section="crate"]')
        expect(ids('a')).toBe('2 1 3 4 5 6')
    })
})

describe('the crate that is read', () => {
    it('shows the published crate in its two sides, in order, each album with its cover from Apple\'s image server, its name, its artist and its year', async () => {
        const { app, ids, text } = await show()
        expect(ids('a')).toBe('1 2 3 4 5 6')
        expect(ids('b')).toBe('20 21 22 23')
        expect(text('[data-crate-source="published"] b')).toBe('the crate published here')
        expect(text('[data-album="3"] .cms-album-t')).toBe('Album 3Artist 3 · 1990')
        expect(app.querySelector('[data-album="3"] img')?.getAttribute('src')).toBe('https://is1-ssl.mzstatic.com/image/thumb/Music1/v4/3/cover.jpg/112x112bb.webp')
        expect(text('[data-side="a"] [data-count-tag]')).toBe('6 albums · from 6 to 10')
        expect(text('[data-side="b"] [data-count-tag]')).toBe('4 albums · from 4 to 10')
    })

    it('with nothing published it shows the fixed set of the code, and says so; nothing is to save', async () => {
        const { app, ids, text } = await show({ crate: { start: crateRead({ sides: fixedCrate(), rev: 0, source: 'fixed' }) } })
        expect(ids('a').split(' ')[0]).toBe('vu-nico')
        expect(app.querySelectorAll('[data-side="a"] [data-album]')).toHaveLength(8)
        expect(app.querySelectorAll('[data-side="b"] [data-album]')).toHaveLength(7)
        expect(text('[data-crate-source="fixed"] b')).toBe('the fixed set of the code (nothing is published yet)')
        expect((app.querySelector('[data-act="save"]') as HTMLButtonElement).disabled).toBe(true)
    })

    it('a published crate that does not pass the check says the page shows the fixed set, and can be saved as it is to mend it', async () => {
        const { app, text } = await show({ crate: { start: crateRead({ source: 'mend', rejected: 1 }) } })
        expect(text('[data-crate-source="mend"] b')).toContain('the published crate does not pass the check')
        expect((app.querySelector('[data-act="save"]') as HTMLButtonElement).disabled).toBe(false)
    })

    it('says it is reading, that it could not read (and reads again when asked), and «no permission»', async () => {
        const reading = await show({ crate: { read: () => new Promise<CrateRead>(() => {}) } })
        expect(reading.text('[data-read="reading"]')).toBe('Reading what is published…')
        await open?.leave()
        let fail = true
        const failed = await show({ crate: { read: async () => { if (fail) throw new Error('offline'); return crateRead() } } })
        expect(failed.text('[data-read="failed"]')).toContain('Could not read what is published.')
        fail = false
        await failed.click('[data-read="failed"] button')
        expect(failed.ids('a')).toBe('1 2 3 4 5 6')
        await open?.leave()
        const denied = await show({ crate: { start: crateRead({ allowed: false }) } })
        expect(denied.text('[data-read="denied"]')).toContain('No permission.')
        expect(denied.app.querySelector('[data-album]')).toBeNull()
    })
})

describe('the order, the side and the removal', () => {
    it('up and down move an album one place; the first cannot go up nor the last down; the keyboard stays on the album that moved', async () => {
        const { app, click, ids, row } = await show()
        expect((app.querySelector(`${row(1)} [data-act="up"]`) as HTMLButtonElement).disabled).toBe(true)
        expect((app.querySelector(`${row(6)} [data-act="down"]`) as HTMLButtonElement).disabled).toBe(true)
        await click(`${row(3)} [data-act="up"]`)
        expect(ids('a')).toBe('1 3 2 4 5 6')
        expect(document.activeElement).toBe(app.querySelector(`${row(3)} [data-act="up"]`))
        await click(`${row(3)} [data-act="up"]`)
        expect(ids('a')).toBe('3 1 2 4 5 6')
        // at the front «up» is off: the focus goes to the same album's «down»
        expect(document.activeElement).toBe(app.querySelector(`${row(3)} [data-act="down"]`))
        await click(`${row(20)} [data-act="down"]`)
        expect(ids('b')).toBe('21 20 22 23')
    })

    it('the buttons are real buttons with a name that says the album', async () => {
        const { app, row } = await show()
        const names = [...app.querySelectorAll(`${row(2)} button`)].map((button) => `${button.tagName}:${button.getAttribute('aria-label')}`)
        expect(names).toEqual(['BUTTON:Move up: Album 2', 'BUTTON:Move down: Album 2', 'BUTTON:To side B: Album 2', 'BUTTON:Remove: Album 2'])
    })

    it('an album goes to the back of the other side', async () => {
        const { click, ids, row } = await show({ crate: { start: crateRead({ sides: { a: side(1, 7), b: side(20, 4) } }) } })
        await click(`${row(2)} [data-act="across"]`)
        expect(ids('a')).toBe('1 3 4 5 6 7')
        expect(ids('b')).toBe('20 21 22 23 2')
    })

    it('an album is removed', async () => {
        const { click, ids, row } = await show({ crate: { start: crateRead({ sides: { a: side(1, 7), b: side(20, 4) } }) } })
        await click(`${row(4)} [data-act="remove"]`)
        expect(ids('a')).toBe('1 2 3 5 6 7')
    })
})

describe('the limits of a side, said and enforced', () => {
    it('a side under its minimum says so, in words, and nothing can be saved until it is fixed', async () => {
        const { app, click, text, row } = await show()
        await click(`${row(6)} [data-act="remove"]`)
        expect(text('[data-side="a"] [data-count-problem="few"]')).toBe('Side A needs at least 6 albums (up to 10). Add one, or bring one from the other side.')
        expect(app.querySelector('[data-side="a"]')?.getAttribute('data-count-state')).toBe('few')
        expect((app.querySelector('[data-act="save"]') as HTMLButtonElement).disabled).toBe(true)
        expect(text('.cms-bar-info span')).toBe('a side is outside its limits: fix it to save')
        expect((app.querySelector('[data-act="discard"]') as HTMLButtonElement).disabled).toBe(false)
    })

    it('a full side takes no more: «to that side» and «add to that side» are off', async () => {
        const { app, row, search } = await show({ crate: { start: crateRead({ sides: { a: side(1, 10), b: side(20, 4) } }) } })
        expect((app.querySelector(`${row(20)} [data-act="across"]`) as HTMLButtonElement).disabled).toBe(true)
        await search('anything')
        const add = app.querySelector('[data-result="900"] [data-act="add-a"]') as HTMLButtonElement
        expect(add.disabled).toBe(true)
        expect(add.title).toBe('Side A is full (10 albums).')
        expect((app.querySelector('[data-result="900"] [data-act="add-b"]') as HTMLButtonElement).disabled).toBe(false)
    })
})

describe('adding an album', () => {
    it('a search shows what was found, with cover, album, artist and year; «add» puts it at the back of the side chosen', async () => {
        const { app, click, ids, text, search, crate } = await show()
        expect((app.querySelector('[data-act="search"]') as HTMLButtonElement).disabled).toBe(true)
        await search('  neil young  ')
        expect(crate.searches).toEqual(['neil young'])
        expect(text('[data-result="900"] .cms-album-t')).toBe('Album 900Artist 900 · 1990')
        expect(app.querySelector('[data-result="900"] img')?.getAttribute('src')).toContain('https://is1-ssl.mzstatic.com/image/thumb/Music1/v4/900/cover.jpg/')
        await click('[data-result="900"] [data-act="add-b"]')
        expect(ids('b')).toBe('20 21 22 23 900')
        // once in the crate it cannot be added again, and neither can one that was already there
        expect(text('[data-result="900"] [data-in-crate]')).toBe('already in the crate')
        expect(text('[data-result="21"] [data-in-crate]')).toBe('already in the crate')
        expect(app.querySelector('[data-result="21"] button')).toBeNull()
    })

    it('a pasted Apple Music link goes to the server as it is', async () => {
        const { search, crate } = await show()
        await search('https://music.apple.com/us/album/harvest/1015739190')
        expect(crate.searches).toEqual(['https://music.apple.com/us/album/harvest/1015739190'])
    })

    it('while the search goes it says so; nothing found and a failure are said in words, with the reason', async () => {
        let release: (answer: { ok: true; albums: [] }) => void = () => {}
        const busy = await show({ crate: { search: () => new Promise((resolve) => { release = resolve }) } })
        await busy.search('x')
        expect(busy.text('[data-search="busy"]')).toBe('Searching Apple Music…')
        await busy.act(async () => { release({ ok: true, albums: [] }) })
        expect(busy.text('[data-search="none"]')).toContain('No album found.')
        await open?.leave()
        const failed = await show({ crate: { search: async () => ({ ok: false, reason: 'notALink' }) } })
        await failed.search('https://open.spotify.com/album/1')
        expect(failed.text('[data-search="failed"]')).toBe('The search did not work: this address is not an album of Apple Music.')
        await open?.leave()
        const off = await show({ crate: { search: async () => ({ ok: false, reason: 'notConfigured' }) } })
        await off.search('x')
        expect(off.text('[data-search="failed"]')).toBe('The search did not work: the server has no working Apple Music key yet.')
    })
})

describe('saving the crate', () => {
    it('nothing changed: «All saved», and Save and Discard are off', async () => {
        const { app, text } = await show()
        expect(text('.cms-bar-info b')).toBe('All saved')
        expect((app.querySelector('[data-act="save"]') as HTMLButtonElement).disabled).toBe(true)
        expect((app.querySelector('[data-act="discard"]') as HTMLButtonElement).disabled).toBe(true)
    })

    it('a change lights the bar; Discard puts the crate back as it was read', async () => {
        const { click, ids, row, text } = await show()
        await click(`${row(2)} [data-act="up"]`)
        expect(text('.cms-bar-info b')).toBe('The crate has changes not saved')
        await click('[data-act="discard"]')
        expect(ids('a')).toBe('1 2 3 4 5 6')
        expect(text('.cms-bar-info b')).toBe('All saved')
    })

    it('Save asks first, saying what goes live: the count of each side, who comes in, who goes out and whether the order changes', async () => {
        const { click, text, row, search, crate } = await show({ crate: { start: crateRead({ sides: { a: side(1, 7), b: side(20, 4) } }) } })
        await click(`${row(7)} [data-act="remove"]`)
        await search('x')
        await click('[data-result="900"] [data-act="add-b"]')
        await click(`${row(2)} [data-act="up"]`)
        await click('[data-act="save"]')
        expect(text('[data-state="confirm"] b')).toBe('The crate goes live now: 6 albums on side A, 5 albums on side B.')
        expect(text('[data-change="added"]')).toBe('1 album comes in: Album 900')
        expect(text('[data-change="removed"]')).toBe('1 album goes out: Album 7')
        expect(text('[data-change="moved"]')).toBe('The order or the side of the albums that stay changes.')
        expect(crate.saves).toEqual([])
        await click('[data-act="save-back"]')
        expect(crate.saves).toEqual([])
    })

    it('confirmed, it saves the two sides on the revision read, and says «saved and live»', async () => {
        const { click, text, row, crate, app } = await show()
        await click(`${row(2)} [data-act="up"]`)
        await click('[data-act="save"]')
        await click('[data-act="save-confirm"]')
        expect(crate.saves).toHaveLength(1)
        expect(crate.saves[0].loadedRev).toBe(2)
        expect(crate.saves[0].sides.a.map((entry) => entry.id)).toEqual(['2', '1', '3', '4', '5', '6'])
        expect(crate.saves[0].sides.b).toEqual(side(20, 4))
        expect(text('[data-state="saved"]')).toBe('✓ Saved and live: the crate of the entry page.')
        expect(text('.cms-bar-info b')).toBe('All saved')
        expect(app.querySelector('[data-crate-source="published"]')).not.toBeNull()
    })

    it('while it saves it says so and Save is held', async () => {
        const { click, text, row, app } = await show({ crate: { answer: () => new Promise<CrateSaveAnswer>(() => {}) } })
        await click(`${row(2)} [data-act="up"]`)
        await click('[data-act="save"]')
        await click('[data-act="save-confirm"]')
        expect(text('[data-state="saving"]')).toContain('Saving…')
        expect((app.querySelector('[data-act="save"]') as HTMLButtonElement).disabled).toBe(true)
    })

    it('the rules of the database do not accept the crate yet: it says so in words, keeps the changes, and tries again when asked', async () => {
        const refusal = Object.assign(new Error('Missing or insufficient permissions.'), { code: 'permission-denied' })
        const { click, text, row, ids, crate } = await show({ crate: { answer: async () => { throw refusal } } })
        await click(`${row(2)} [data-act="up"]`)
        await click('[data-act="save"]')
        await click('[data-act="save-confirm"]')
        expect(text('[data-state="failed"] span')).toBe('Not saved: the database refused it: its rules do not accept this save yet (a new field, or a text outside the format). Nothing changed on the site, and your changes are still here.')
        expect(ids('a')).toBe('2 1 3 4 5 6')
        await click('[data-act="save-retry"]')
        expect(crate.saves).toHaveLength(2)
        expect(text('[data-state="saved"]')).toContain('Saved and live')
    })

    it('the database does not answer: «the database did not answer»', async () => {
        const { click, text, row } = await show({ crate: { answer: async () => { throw Object.assign(new Error('x'), { code: 'unavailable' }) } } })
        await click(`${row(2)} [data-act="up"]`)
        await click('[data-act="save"]')
        await click('[data-act="save-confirm"]')
        expect(text('[data-state="failed"] span')).toContain('the database did not answer.')
    })

    it('the crate changed on another device: it says so; «save mine» saves over the other on ITS revision', async () => {
        const theirs = { a: side(40, 6), b: side(60, 5) }
        const { click, text, row, crate } = await show({ crate: { answer: async () => ({ status: 'conflict', rev: 7, sides: theirs }) } })
        await click(`${row(2)} [data-act="up"]`)
        await click('[data-act="save"]')
        await click('[data-act="save-confirm"]')
        expect(text('[data-state="conflict"] b')).toBe('The crate changed on another device of yours after you opened this page.')
        expect(text('[data-state="conflict"] span')).toBe('The other crate (already live) has 6 albums on side A and 5 albums on side B.')
        await click('[data-act="conflict-mine"]')
        expect(crate.saves).toHaveLength(2)
        expect(crate.saves[1].loadedRev).toBe(7)
        expect(crate.saves[1].sides.a.map((entry) => entry.id)).toEqual(['2', '1', '3', '4', '5', '6'])
        expect(text('[data-state="saved"]')).toContain('Saved and live')
    })

    it('«keep the other» reads the crate again and drops the changes of this device', async () => {
        let stored = crateRead()
        const { click, row, ids, crate } = await show({ crate: { read: async () => stored, answer: async () => ({ status: 'conflict', rev: 7, sides: { a: side(40, 6), b: side(60, 5) } }) } })
        await click(`${row(2)} [data-act="up"]`)
        await click('[data-act="save"]')
        await click('[data-act="save-confirm"]')
        stored = crateRead({ sides: { a: side(40, 6), b: side(60, 5) }, rev: 7 })
        await click('[data-act="conflict-theirs"]')
        expect(ids('a')).toBe('40 41 42 43 44 45')
        expect(crate.saves).toHaveLength(1)
    })

    it('a name is written as text: markup in it never becomes an element', async () => {
        const hostile = album(1, { title: '<img src=x onerror=alert(1)>' })
        const { app } = await show({ crate: { start: crateRead({ sides: { a: [hostile, ...side(2, 5)], b: side(20, 4) } }) } })
        expect(app.querySelector('[data-album="1"] b')?.textContent).toBe('<img src=x onerror=alert(1)>')
        expect(app.querySelectorAll('[data-album="1"] img')).toHaveLength(1)
    })
})
