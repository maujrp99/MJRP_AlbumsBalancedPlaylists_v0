/**
 * F76 (TASK-04, REQ-08, REQ-12) and F83 wave 1 - a saved series, on the phone and on the computer. Taken over from the block «a saved
 * series» of test/components/playlists/PhonePlaylists.test.js: the scaffold changes (the group is drawn in React, every tap goes
 * through `act`), not what each test asserts.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SeriesGroup } from '../../../public/js/screens/saved-playlists/SeriesGroup'
import { seriesSummary } from '../../../public/js/screens/saved-playlists/listText'
import type { Handlers, SeriesGroupData } from '../../../public/js/screens/saved-playlists/types'
import { renderScreen, type RenderedScreen } from '../../support/renderScreen'
import { asPhone } from '../../support/savedPlaylistsScenarios.js'

const batch = (name: string, count: number) => ({
    name,
    savedAt: '2026-11-01T10:00:00Z',
    playlists: Array.from({ length: count }, (_, i) => ({ id: `${name}${i}`, name: `P${i}`, tracks: [] }))
})
const group: SeriesGroupData = {
    seriesId: 'Jp93LzaUxyz',
    series: { id: 'Jp93LzaUxyz', name: 'Prog Rock Classics' },
    status: 'ready',
    error: null,
    batches: [batch('Sunday mix', 4), batch('Night drive', 2)],
    thumbnails: []
}
const handlers: Handlers = { onNavigate: vi.fn(), onOpenSeries: vi.fn(), onDeleteAll: vi.fn(), onEditBatch: vi.fn(), onDeleteBatch: vi.fn(), onOpenPlaylist: vi.fn(), onRetry: vi.fn() }

interface Props { phone: boolean; startsOpen?: boolean; onToggle?: (seriesId: string, open: boolean) => void }
const Host = ({ phone, startsOpen = false, onToggle = () => {} }: Props & { params: object }) => (
    <SeriesGroup group={group} phone={phone} startsOpen={startsOpen} onToggle={onToggle} handlers={handlers} />
)
const draw = (props: Props): Promise<RenderedScreen> => renderScreen(Host, props)
const one = (rendered: RenderedScreen, selector: string) => rendered.app.querySelector(selector) as HTMLElement
const tap = (rendered: RenderedScreen, selector: string) => rendered.act(() => { one(rendered, selector).click() })

beforeEach(() => { vi.clearAllMocks() })
afterEach(() => { document.body.innerHTML = '' })

describe('a saved series', () => {
    it('on the phone is closed, says what it holds, and opens by a named row', async () => {
        asPhone(true)
        const onToggle = vi.fn()
        const rendered = await draw({ phone: true, onToggle })
        const box = one(rendered, '.saved-series-batches')
        const toggle = one(rendered, '.saved-series-toggle')

        expect(box.hidden).toBe(true)
        expect(toggle.querySelector('.saved-phone-series__name')!.textContent).toBe('Prog Rock Classics')
        expect(toggle.querySelector('.saved-series-toggle__text')!.textContent).toBe('2 batches · 6 playlists')
        expect(toggle.getAttribute('aria-expanded')).toBe('false')
        await tap(rendered, '.saved-series-toggle')
        expect(box.hidden).toBe(false)
        expect(toggle.getAttribute('aria-expanded')).toBe('true')
        expect(onToggle).toHaveBeenCalledWith('Jp93LzaUxyz', true)
        await rendered.leave()
    })

    it('on the phone opens again when it was open before', async () => {
        asPhone(true)
        const rendered = await draw({ phone: true, startsOpen: true })
        expect(one(rendered, '.saved-series-batches').hidden).toBe(false)
        await rendered.leave()
    })

    it('on the computer is open with no toggle, as before', async () => {
        asPhone(false)
        const rendered = await draw({ phone: false })

        expect(rendered.app.querySelector('.saved-series-toggle')).toBeNull()
        expect(one(rendered, '.saved-series-batches').hidden).toBe(false)
        expect(rendered.app.querySelectorAll('.batch-group-card')).toHaveLength(2)
        await rendered.leave()
    })

    it('on the computer keeps its buttons and its id, as before', async () => {
        asPhone(false)
        const rendered = await draw({ phone: false })

        expect(one(rendered, '.saved-series-id').textContent).toContain('Jp93LzaU')
        expect(rendered.app.querySelector('[aria-label="Delete all playlists in Prog Rock Classics"]')).not.toBeNull()
        expect(rendered.app.querySelector('[aria-label="Delete batch Sunday mix"]')).not.toBeNull()
        expect(rendered.app.querySelector('[aria-label="Edit batch Sunday mix"]')).not.toBeNull()
        await rendered.leave()
    })

    describe('on the phone (recheck N5)', () => {
        beforeEach(() => asPhone(true))
        const sheetRows = () => [...document.querySelectorAll<HTMLElement>('.sheet .albums-sheet__row')]
        const tapRow = (rendered: RenderedScreen, text: string) => rendered.act(() => { sheetRows().find(row => row.textContent!.trim() === text)!.click() })

        it('shows no raw id and no button but its rows and «⋯»: nothing red in view', async () => {
            const rendered = await draw({ phone: true, startsOpen: true })
            expect(rendered.app.querySelector('.saved-series-id')).toBeNull()
            expect(rendered.app.querySelector('.btn')).toBeNull()
            expect([...rendered.app.querySelectorAll('.phone-more')].map(b => b.getAttribute('aria-label'))).toEqual([
                'Actions for series Prog Rock Classics', 'Actions for batch Sunday mix', 'Actions for batch Night drive'
            ])
            await rendered.leave()
        })

        it('a batch row says its name, playlists, tracks, length and one date format', async () => {
            const rendered = await draw({ phone: true, startsOpen: true })
            const row = one(rendered, '.saved-phone-batch')
            expect(row.querySelector('.saved-phone-batch__name')!.textContent).toBe('Sunday mix')
            expect(row.querySelector('.saved-phone__meta')!.textContent).toBe('4 playlists · 0 tracks · 0 min · 1\u00a0Nov\u00a02026')
            await rendered.leave()
        })

        it('the «⋯» of a series names its actions, delete last and red, and each calls the computer\'s handler', async () => {
            const rendered = await draw({ phone: true })
            await tap(rendered, '[aria-label="Actions for series Prog Rock Classics"]')
            expect(sheetRows().map(row => row.textContent!.trim())).toEqual(['Add playlists', 'Open the album series', 'Delete all playlists of this series'])
            expect(sheetRows().at(-1)!.classList.contains('albums-sheet__row--danger')).toBe(true)
            await tapRow(rendered, 'Delete all playlists of this series')
            expect(handlers.onDeleteAll).toHaveBeenCalledWith('Jp93LzaUxyz', 'Prog Rock Classics')
            await rendered.leave()
        })

        it('the «⋯» of a batch edits or deletes it (the screen asks before deleting)', async () => {
            const rendered = await draw({ phone: true, startsOpen: true })
            await tap(rendered, '[aria-label="Actions for batch Sunday mix"]')
            await tapRow(rendered, 'Edit batch')
            expect(handlers.onEditBatch).toHaveBeenCalledWith('Jp93LzaUxyz', 'Sunday mix', '2026-11-01T10:00:00Z')
            await tap(rendered, '[aria-label="Actions for batch Sunday mix"]')
            await tapRow(rendered, 'Delete batch')
            expect(handlers.onDeleteBatch).toHaveBeenCalledWith('Jp93LzaUxyz', 'Sunday mix', 4)
            await rendered.leave()
        })

        it('a batch opens its playlists as rows; a playlist row opens its tracks', async () => {
            const rendered = await draw({ phone: true, startsOpen: true })
            await tap(rendered, '.saved-phone-batch .batch-header')
            const rows = rendered.app.querySelectorAll('.saved-phone-batch')[0].querySelectorAll<HTMLElement>('.saved-phone-playlist')
            expect(rows).toHaveLength(4)
            await rendered.act(() => { rows[1].click() })
            expect(handlers.onOpenPlaylist).toHaveBeenCalledWith('Jp93LzaUxyz', 'Sunday mix1')
            await rendered.leave()
        })

        it('a sheet that is open when the screen is left is closed', async () => {
            const rendered = await draw({ phone: true })
            await tap(rendered, '[aria-label="Actions for series Prog Rock Classics"]')
            expect(document.querySelector('.sheet:not(.sheet--closing)')).not.toBeNull()
            await rendered.leave()
            expect(document.querySelector('.sheet:not(.sheet--closing)')).toBeNull()
        })
    })

    it('one batch, one playlist: singular words', () => {
        expect(seriesSummary([batch('Solo', 1)])).toBe('1 batch · 1 playlist')
    })
})
