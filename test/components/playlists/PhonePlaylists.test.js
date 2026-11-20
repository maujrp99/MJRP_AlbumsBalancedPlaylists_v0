/**
 * F76 (TASK-04, REQ-08, REQ-12) - the playlists on the phone: one playlist at a time with chips
 * on top, track rows with named actions in a sheet, remove with Undo, delete asked first, save and
 * export in the action bar; the saved playlists closed by series. On the computer the markup is
 * the one of before.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const service = vi.hoisted(() => ({ moveTrack: vi.fn() }))
vi.mock('../../../public/js/services/playlists/playlistsWiring.js', () => ({ getPlaylistsService: () => service }))
const dialog = vi.hoisted(() => ({ confirm: vi.fn() }))
vi.mock('../../../public/js/services/DialogService.js', () => ({ dialogService: dialog }))

import { PhonePlaylists, playlistSummary, minutes } from '../../../public/js/components/playlists/PhonePlaylists.js'
import { attachPhonePlaylistActions } from '../../../public/js/views/playlists/phonePlaylistActions.js'
import { dismissUndoNotice } from '../../../public/js/components/playlists/PhoneUndoNotice.js'
import { dragHandleSelector } from '../../../public/js/components/playlists/PlaylistsDragHandler.js'
import { SavedSeriesGroup, seriesSummary } from '../../../public/js/components/playlists/SavedSeriesGroup.js'
import { PlaylistGrid } from '../../../public/js/components/playlists/PlaylistGrid.js'
import { playlistsStore } from '../../../public/js/stores/playlists.js'

const asPhone = (phone) => {
    window.matchMedia = vi.fn(() => ({ matches: phone, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
}
const track = (title, extra = {}) => ({ id: title, title, artist: 'King Crimson', album: 'In the Court of the Crimson King', duration: 200, ...extra })
const playlists = [
    { name: 'Greatest Hits', title: 'Greatest Hits', tracks: [track('21st Century Schizoid Man'), track('I Talk to the Wind'), track('Epitaph')] },
    { name: 'Deep Cuts <b>Vol. 1</b>', title: 'Deep Cuts <b>Vol. 1</b>', tracks: [track('Moonchild')] },
    { name: 'Closers', title: 'Closers', tracks: [] }
]
const draw = (html) => {
    const host = document.createElement('div')
    host.innerHTML = html
    return host
}

afterEach(() => {
    dismissUndoNotice()
    document.body.innerHTML = ''
    vi.clearAllMocks()
})

describe('the phone shows one playlist at a time', () => {
    it('a chip per playlist says its name, its tracks and its length; the open one is marked', () => {
        const host = draw(PhonePlaylists.render({ playlists, active: 1 }))
        const chips = [...host.querySelectorAll('.phone-pl-chip')]

        expect(chips.map(chip => chip.querySelector('.phone-pl-chip__name').textContent)).toEqual(['1 · Greatest Hits', '2 · Deep Cuts <b>Vol. 1</b>', '3 · Closers'])
        expect(chips[0].querySelector('.phone-pl-chip__meta').textContent).toBe('3 tracks · 10 min')
        expect(chips.map(chip => chip.getAttribute('aria-pressed'))).toEqual(['false', 'true', 'false'])
        expect(host.querySelector('b')).toBeNull() // outside text is text
    })

    it('only the open playlist is drawn, with no box that scrolls by itself', () => {
        const host = draw(PhonePlaylists.render({ playlists, active: 0 }))

        expect(host.querySelectorAll('.phone-pl')).toHaveLength(1)
        expect(host.querySelectorAll('.phone-track')).toHaveLength(3)
        expect(host.innerHTML).not.toMatch(/max-h-|overflow-y-auto/)
    })

    it('a track row says position, title, artist · album and duration, and its «⋯» is named', () => {
        const row = draw(PhonePlaylists.render({ playlists, active: 0 })).querySelectorAll('.phone-track')[1]

        expect(row.querySelector('.phone-track__pos').textContent.trim()).toBe('2')
        expect(row.querySelector('.phone-track__title').textContent).toBe('I Talk to the Wind')
        expect(row.querySelector('.phone-track__sub').textContent).toBe('King Crimson · In the Court of the Crimson King')
        expect(row.querySelector('.phone-track__time').textContent).toBe('3:20')
        const more = row.querySelector('[data-phone-action="track-options"]')
        expect(more.getAttribute('aria-label')).toBe('Actions for I Talk to the Wind')
        expect(more.dataset).toMatchObject({ playlistIndex: '0', trackIndex: '1' })
        // the drag and drop still finds its list and its rows
        expect(row.closest('.playlist-tracks').dataset.playlistIndex).toBe('0')
    })

    it('the title of the open playlist is the field the computer types over too', () => {
        const title = draw(PhonePlaylists.render({ playlists, active: 2 })).querySelector('.playlist-name')

        expect(title.getAttribute('contenteditable')).toBe('true')
        expect(title.dataset.playlistIndex).toBe('2')
        expect(title.textContent).toBe('Closers')
    })

    it('an index out of the set opens the last playlist', () => {
        const host = draw(PhonePlaylists.render({ playlists, active: 9 }))
        expect(host.querySelector('.phone-pl').dataset.playlistIndex).toBe('2')
    })

    it('counts and lengths read as words', () => {
        expect(playlistSummary({ tracks: [track('A')] })).toBe('1 track · 3 min')
        expect(minutes(4500)).toBe('1 h 15 min')
        expect(minutes(3600)).toBe('1 h')
    })

    it('the action bar has Export and Save, and it hides on the computer', () => {
        const bar = draw(PhonePlaylists.renderActionBar()).querySelector('.phone-action-bar')

        expect(bar.classList.contains('md:hidden')).toBe(true)
        expect([...bar.querySelectorAll('button')].map(b => b.textContent.trim())).toEqual(['Export', 'Save'])
        expect(draw(PhonePlaylists.renderActionBar({ isSaving: true })).querySelector('[data-phone-action="save"]').disabled).toBe(true)
    })
})

describe('what a tap does on the phone', () => {
    let container, controller, showPlaylist, actions

    beforeEach(() => {
        asPhone(true)
        playlistsStore.setPlaylists(JSON.parse(JSON.stringify(playlists)), 's1')
        container = document.createElement('div')
        container.innerHTML = `<input id="batchNameInput" value="Road trip">${PhonePlaylists.render({ playlists, active: 0 })}${PhonePlaylists.renderActionBar()}`
        document.body.appendChild(container)
        controller = { handleSave: vi.fn(), deleteTrack: vi.fn(), undo: vi.fn(), deletePlaylist: vi.fn() }
        showPlaylist = vi.fn()
        actions = attachPhonePlaylistActions(container, { controller, showPlaylist })
    })

    afterEach(() => actions.detach())

    const tap = (selector) => container.querySelector(selector).click()
    const sheetAction = (text) => [...document.querySelectorAll('.sheet .phone-sheet-action')].find(b => b.textContent.trim() === text)

    it('a chip opens its playlist', () => {
        tap('[data-phone-action="show-playlist"][data-playlist-index="2"]')
        expect(showPlaylist).toHaveBeenCalledWith(2)
    })

    it('Save saves under the name typed, as the computer does', () => {
        tap('[data-phone-action="save"]')
        expect(controller.handleSave).toHaveBeenCalledWith('Road trip')
    })

    it('the «⋯» of a track opens a sheet of named moves, the other playlists, and remove last', () => {
        tap('[data-phone-action="track-options"][data-track-index="0"]')

        const names = [...document.querySelectorAll('.sheet .phone-sheet-action')].map(b => b.textContent.trim())
        expect(names).toEqual(['Move up', 'Move down', 'Move to the top', 'Move to the end', '2 · Deep Cuts <b>Vol. 1</b>', '3 · Closers', 'Remove from this playlist'])
        expect(sheetAction('Move up').disabled).toBe(true)
    })

    it('moving calls the same move the drag and drop calls', () => {
        tap('[data-phone-action="track-options"][data-track-index="0"]')
        sheetAction('Move down').click()
        expect(service.moveTrack).toHaveBeenCalledWith(0, 0, 0, 1)

        tap('[data-phone-action="track-options"][data-track-index="1"]')
        sheetAction('2 · Deep Cuts <b>Vol. 1</b>').click()
        expect(service.moveTrack).toHaveBeenLastCalledWith(0, 1, 1, 1) // to the end of the other playlist
    })

    it('a move says where the track went, with Undo (recheck N20)', () => {
        tap('[data-phone-action="track-options"][data-track-index="0"]')
        sheetAction('Move down').click()
        expect(document.querySelector('.phone-undo').textContent).toContain('Moved "21st Century Schizoid Man" to number 2')

        tap('[data-phone-action="track-options"][data-track-index="1"]')
        sheetAction('3 · Closers').click()
        const notice = document.querySelector('.phone-undo')
        expect(notice.textContent).toContain('Moved "I Talk to the Wind" to playlist 3')
        notice.querySelector('button').click()
        expect(controller.undo).toHaveBeenCalledTimes(1)
    })

    it('removing happens at once and offers Undo, which takes it back', () => {
        tap('[data-phone-action="track-options"][data-track-index="2"]')
        sheetAction('Remove from this playlist').click()

        expect(controller.deleteTrack).toHaveBeenCalledWith(0, 2)
        const notice = document.querySelector('.phone-undo')
        expect(notice.textContent).toContain('Removed "Epitaph"')
        notice.querySelector('button').click()
        expect(controller.undo).toHaveBeenCalledTimes(1)
        expect(document.querySelector('.phone-undo')).toBeNull()
    })

    it('deleting a whole playlist is asked first', async () => {
        dialog.confirm.mockResolvedValueOnce(false).mockResolvedValueOnce(true)
        tap('[data-phone-action="playlist-options"]')
        sheetAction('Delete this playlist').click()
        await vi.waitFor(() => expect(dialog.confirm).toHaveBeenCalledTimes(1))
        expect(controller.deletePlaylist).not.toHaveBeenCalled()

        tap('[data-phone-action="playlist-options"]')
        sheetAction('Delete this playlist').click()
        await vi.waitFor(() => expect(controller.deletePlaylist).toHaveBeenCalledWith(0))
    })

    it('Export opens a sheet with the three exports', () => {
        tap('[data-phone-action="export"]')
        expect([...document.querySelectorAll('.sheet .phone-sheet-action')].map(b => b.textContent.trim()))
            .toEqual(['Export to Spotify', 'Export to Apple Music', 'Download JSON'])
    })
})

describe('the drag', () => {
    it('picks a track up by the whole row on the computer and by its position on the phone', () => {
        asPhone(false)
        expect(dragHandleSelector()).toBe('.track-row')
        asPhone(true)
        expect(dragHandleSelector()).toBe('.phone-track__pos')
    })
})

describe('the top of /playlists on the phone is one line (recheck N3)', () => {
    it('the batch name is the same field (same id), with undo and redo as named 44 px icons beside it', () => {
        const host = draw(PhonePlaylists.renderNameRow({ name: 'Road <i>trip</i>', canUndo: true, canRedo: false }))
        const input = host.querySelector('#batchNameInput')

        expect(input.value).toBe('Road <i>trip</i>')
        expect(host.querySelector('label[for="batchNameInput"]').textContent.trim()).toBe('Batch name')
        expect(host.querySelector('i')).toBeNull()
        const undo = host.querySelector('[data-action="undo-edit"]')
        const redo = host.querySelector('[data-action="redo-edit"]')
        expect(undo.getAttribute('aria-label')).toBe('Undo the last change')
        expect(undo.disabled).toBe(false)
        expect(redo.getAttribute('aria-label')).toBe('Redo the change that was undone')
        expect(redo.disabled).toBe(true)
        expect(host.firstElementChild.classList.contains('md:hidden')).toBe(true)
    })

    it('an empty name shows the name the save falls back to', () => {
        const host = draw(PhonePlaylists.renderNameRow({ name: '', defaultName: 'Prog 70s · 20 Nov' }))
        expect(host.querySelector('#batchNameInput').value).toBe('Prog 70s · 20 Nov')
    })
})

describe('the computer keeps its grid', () => {
    it('PlaylistGrid draws every playlist side by side, as before', () => {
        asPhone(false)
        const host = draw(PlaylistGrid.render({ playlists, batchName: 'Road trip' }))
        expect(host.querySelectorAll('.playlist-card')).toHaveLength(3)
        expect(host.querySelector('.phone-playlists')).toBeNull()
    })
})

describe('a saved series', () => {
    const batch = (name, count) => ({ name, savedAt: '2026-11-01T10:00:00Z', playlists: Array.from({ length: count }, (_, i) => ({ id: `${name}${i}`, name: `P${i}`, tracks: [] })) })
    const group = { series: { id: 'Jp93LzaUxyz', name: 'Prog Rock Classics' }, status: 'ready', batches: [batch('Sunday mix', 4), batch('Night drive', 2)], thumbnails: [] }
    const handlers = { onNavigate: vi.fn(), onOpenSeries: vi.fn(), onDeleteAll: vi.fn(), onEditBatch: vi.fn(), onDeleteBatch: vi.fn(), onOpenPlaylist: vi.fn(), onRetry: vi.fn() }

    it('on the phone is closed, says what it holds, and opens by a named row', () => {
        asPhone(true)
        const onToggle = vi.fn()
        const node = new SavedSeriesGroup({ group, handlers, onToggle }).render()
        const box = node.querySelector('.saved-series-batches')
        const toggle = node.querySelector('.saved-series-toggle')

        expect(box.hidden).toBe(true)
        expect(toggle.querySelector('.saved-phone-series__name').textContent).toBe('Prog Rock Classics')
        expect(toggle.querySelector('.saved-series-toggle__text').textContent).toBe('2 batches · 6 playlists')
        expect(toggle.getAttribute('aria-expanded')).toBe('false')
        toggle.click()
        expect(box.hidden).toBe(false)
        expect(toggle.getAttribute('aria-expanded')).toBe('true')
        expect(onToggle).toHaveBeenCalledWith('Jp93LzaUxyz', true)
    })

    it('on the phone opens again when it was open before', () => {
        asPhone(true)
        const node = new SavedSeriesGroup({ group, handlers, open: true }).render()
        expect(node.querySelector('.saved-series-batches').hidden).toBe(false)
    })

    it('on the computer is open with no toggle, as before', () => {
        asPhone(false)
        const node = new SavedSeriesGroup({ group, handlers }).render()

        expect(node.querySelector('.saved-series-toggle')).toBeNull()
        expect(node.querySelector('.saved-series-batches').hidden).toBe(false)
        expect(node.querySelectorAll('.batch-group-card')).toHaveLength(2)
    })

    it('on the computer keeps its buttons and its id, as before', () => {
        asPhone(false)
        const node = new SavedSeriesGroup({ group, handlers }).render()

        expect(node.querySelector('.saved-series-id').textContent).toContain('Jp93LzaU')
        expect(node.querySelector('[aria-label="Delete all playlists in Prog Rock Classics"]')).not.toBeNull()
        expect(node.querySelector('[aria-label="Delete batch Sunday mix"]')).not.toBeNull()
        expect(node.querySelector('[aria-label="Edit batch Sunday mix"]')).not.toBeNull()
    })

    describe('on the phone (recheck N5)', () => {
        beforeEach(() => asPhone(true))
        const sheetRows = () => [...document.querySelectorAll('.sheet .albums-sheet__row')]
        const tapRow = (text) => sheetRows().find(row => row.textContent.trim() === text).click()

        it('shows no raw id and no button but its rows and «⋯»: nothing red in view', () => {
            const node = new SavedSeriesGroup({ group, handlers, open: true }).render()
            expect(node.querySelector('.saved-series-id')).toBeNull()
            expect(node.querySelector('.btn')).toBeNull()
            expect([...node.querySelectorAll('.phone-more')].map(b => b.getAttribute('aria-label'))).toEqual([
                'Actions for series Prog Rock Classics', 'Actions for batch Sunday mix', 'Actions for batch Night drive'
            ])
        })

        it('a batch row says its name, playlists, tracks, length and one date format', () => {
            const node = new SavedSeriesGroup({ group, handlers, open: true }).render()
            const row = node.querySelector('.saved-phone-batch')
            expect(row.querySelector('.saved-phone-batch__name').textContent).toBe('Sunday mix')
            expect(row.querySelector('.saved-phone__meta').textContent).toBe('4 playlists · 0 tracks · 0 min · 1 Nov 2026')
        })

        it('the «⋯» of a series names its actions, delete last and red, and each calls the computer\'s handler', () => {
            const node = new SavedSeriesGroup({ group, handlers }).render()
            document.body.appendChild(node)
            node.querySelector('[aria-label="Actions for series Prog Rock Classics"]').click()
            expect(sheetRows().map(row => row.textContent.trim())).toEqual(['Add playlists', 'Open the album series', 'Delete all playlists of this series'])
            expect(sheetRows().at(-1).classList.contains('albums-sheet__row--danger')).toBe(true)
            tapRow('Delete all playlists of this series')
            expect(handlers.onDeleteAll).toHaveBeenCalledWith('Jp93LzaUxyz', 'Prog Rock Classics')
        })

        it('the «⋯» of a batch edits or deletes it (the view asks before deleting)', () => {
            const node = new SavedSeriesGroup({ group, handlers, open: true }).render()
            document.body.appendChild(node)
            node.querySelector('[aria-label="Actions for batch Sunday mix"]').click()
            tapRow('Edit batch')
            expect(handlers.onEditBatch).toHaveBeenCalledWith('Jp93LzaUxyz', 'Sunday mix', '2026-11-01T10:00:00Z')
            node.querySelector('[aria-label="Actions for batch Sunday mix"]').click()
            tapRow('Delete batch')
            expect(handlers.onDeleteBatch).toHaveBeenCalledWith('Jp93LzaUxyz', 'Sunday mix', 4)
        })

        it('a batch opens its playlists as rows; a playlist row opens its tracks', () => {
            const node = new SavedSeriesGroup({ group, handlers, open: true }).render()
            node.querySelector('.saved-phone-batch .batch-header').click()
            const rows = node.querySelectorAll('.saved-phone-batch')[0].querySelectorAll('.saved-phone-playlist')
            expect(rows).toHaveLength(4)
            rows[1].click()
            expect(handlers.onOpenPlaylist).toHaveBeenCalledWith('Jp93LzaUxyz', 'Sunday mix1')
        })
    })

    it('one batch, one playlist: singular words', () => {
        expect(seriesSummary([batch('Solo', 1)])).toBe('1 batch · 1 playlist')
    })
})
