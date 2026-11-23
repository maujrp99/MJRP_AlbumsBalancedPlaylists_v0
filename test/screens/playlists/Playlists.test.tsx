/**
 * The playlists screen, in React (F83 wave 2). Taken over from the tests of the hand-made screen (PlaylistsScreen.edit, PhonePlaylists,
 * playlistEditActions, PlaylistGrid.duration, PlaylistsGridRenderer.save): the scaffold changes (the screen is mounted the way production mounts it,
 * every tap goes through `act`), the assertion does not. What the new screen adds is at the end: it reads a store whose lists
 * change inside, and what a person is typing is not taken away by a draw.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'

vi.mock('../../../public/js/services/playlists/playlistsWiring.js', async () => (await import('../../support/playlistsScenarios.js')).wiring())
vi.mock('../../../public/js/ui/dialogs/dialogs', async () => ({ dialogService: { confirm: vi.fn(async (o: { title: string; message: string }) => { (await import('../../support/playlistsScenarios.js')).outside.push(['confirm', o.title, o.message]); return true }) } }))
vi.mock('../../../public/js/ui/SpotifyExportWindow.tsx', async () => ({ showSpotifyExportWindow: () => import('../../support/playlistsScenarios.js').then(m => m.outside.push(['spotifyWindow'])) }))
vi.mock('../../../public/js/controllers/playlistExports.js', async () => {
    const m = await import('../../support/playlistsScenarios.js')
    const asked = (options?: object) => JSON.stringify(Object.fromEntries(Object.entries(options ?? {}).filter(([key]) => key !== 'btn' && key !== 'onStatus' && key !== 'ok')))
    return { seriesNameOf: (given?: string) => given || 'MJRP Playlists', handleExportJson: () => m.outside.push(['exportJson']), handleExportToAppleMusic: (options?: object) => m.outside.push(['exportApple', asked(options)]) }
})
vi.mock('../../../public/js/services/MusicKitService.js', async () => ({ musicKitService: (await import('../../support/exportStandIns.js')).musicKitService }))

import { Playlists, GeneratingFlag } from '../../../public/js/screens/playlists/Playlists'
import { PlaylistsController } from '../../../public/js/controllers/PlaylistsController.js'
import { router } from '../../../public/js/router.js'
import { playlistsStore } from '../../../public/js/stores/playlists.js'
import { renderScreen, itLeavesNoListeners } from '../../support/renderScreen'
import { generated, asPhone, quiet, fakeService, outside } from '../../support/playlistsScenarios.js'

const flush = () => new Promise(resolve => setTimeout(resolve, 20))
const q = <T extends Element = HTMLElement>(selector: string) => document.querySelector(selector) as T
const all = (selector: string) => [...document.querySelectorAll<HTMLElement>(selector)]

async function open(playlists: ReturnType<typeof generated>, { phone = false, url = '/playlists', batches = {} }: { phone?: boolean; url?: string; batches?: Record<string, unknown[]> } = {}) {
    asPhone(phone)
    quiet()
    window.history.replaceState({}, '', url)
    fakeService.batches = batches as typeof fakeService.batches
    fakeService.begin(playlists)
    const generating = new GeneratingFlag()
    const controller = new PlaylistsController(generating)
    const rendered = await renderScreen(Playlists, { controller, generating }, { screen: 'playlists', view: { prepare: (params) => controller.initialize(params) } })
    const tap = (selector: string) => rendered.act(async () => { q(selector).click(); await flush() })
    const tapText = (selector: string, text: string) => rendered.act(async () => { all(selector).find(e => e.textContent?.includes(text))!.click(); await flush() })
    return { ...rendered, tap, tapText }
}

afterEach(() => { document.body.innerHTML = ''; outside.length = 0 })

describe('the buttons of undo and redo (UAT-02)', () => {
    it('are drawn in the actions of the screen, each saying what it does', async () => {
        await open(generated())
        await playlistsStoreState(true, true)
        const [undo, redo] = [q('[data-action="undo-edit"]'), q('[data-action="redo-edit"]')]
        expect(undo.textContent).toContain('Undo')
        expect(redo.textContent).toContain('Redo')
        expect(undo.getAttribute('aria-label')).toBe('Undo the last change')
        expect(redo.getAttribute('aria-label')).toBe('Redo the change that was undone')
    })

    it('are disabled when there is nothing to undo or to redo, from the state of the store', async () => {
        await open(generated())
        const state = () => [q<HTMLButtonElement>('[data-action="undo-edit"]').disabled, q<HTMLButtonElement>('[data-action="redo-edit"]').disabled]
        expect(state()).toEqual([true, true])
        await playlistsStoreState(true, false)
        expect(state()).toEqual([false, true])
        await playlistsStoreState(false, true)
        expect(state()).toEqual([true, false])
    })

    it('go to the controller, and a disabled one does nothing', async () => {
        const screen = await open(generated())
        await screen.tap('[data-action="undo-edit"]')
        expect(outside).toEqual([])
        await screen.act(async () => { fakeService.moveTrack(0, 1, 0, 0) })
        outside.length = 0
        await screen.tap('[data-action="undo-edit"]')
        await screen.tap('[data-action="redo-edit"]')
        expect(outside).toEqual([['undo'], ['redo']])
    })
})

async function playlistsStoreState(canUndo: boolean, canRedo: boolean) {
    await new Promise<void>(resolve => { playlistsStore.setUndoState(canUndo, canRedo); resolve() })
    await flush()
}

describe('the card of a playlist', () => {
    it('has a button that deletes that playlist of the set (UAT-03)', async () => {
        const screen = await open(generated())
        const button = q('.playlist-card [data-action="delete-playlist"]')
        expect(button.dataset.playlistIndex).toBe('0')
        expect(button.getAttribute('aria-label')).toBe('Delete playlist Greatest Hits')
        await screen.tap('[data-action="delete-playlist"][data-playlist-index="1"]')
        expect(outside).toEqual([['removePlaylist', 1]])
    })

    it('shows the position and the batch name beside the title, and only the title can be typed over (UAT-04)', async () => {
        await open(generated().map(p => ({ ...p, batchName: 'Road trip' })))
        const input = q<HTMLInputElement>('#batchNameInput')
        expect(input.value).toBe('')
        const screen = await open(generated())
        await screen.act(async () => { playlistsStore.setBatchName('Road trip'); playlistsStore.setDefaultBatchName('Road trip') })
        const title = q('.playlist-name')
        expect(title.textContent).toBe('Greatest Hits')
        expect(title.getAttribute('contenteditable')).toBe('true')
        expect(title.dataset.playlistIndex).toBe('0')
        expect(title.getAttribute('aria-label')).toBe('Title of playlist 1')
        expect(q('.playlist-title-prefix').textContent).toBe('1. Road trip - ')
        expect(q('.playlist-title-prefix').hasAttribute('contenteditable')).toBe(false)
    })

    it('says its number of tracks, its length and, with no tracks, so', async () => {
        await open(generated())
        const cards = all('.playlist-card')
        expect(cards[0].querySelector('.font-mono')!.textContent).toBe('19:58') // 510 + 275 + 413 s
        expect(cards[2].textContent).toContain('No tracks')
        expect(cards[2].querySelector('.font-mono')!.textContent).toBe('0:00')
    })
})

describe('a title typed over', () => {
    const type = async (screen: Awaited<ReturnType<typeof open>>, selector: string, text: string, how: 'blur' | 'Enter' | 'Escape' = 'blur') => {
        const field = q(selector)
        await screen.act(async () => { field.dispatchEvent(new FocusEvent('focusin', { bubbles: true })) })
        field.textContent = text
        if (how === 'blur') await screen.act(async () => { field.dispatchEvent(new FocusEvent('focusout', { bubbles: true })) })
        else await screen.act(async () => { field.dispatchEvent(new KeyboardEvent('keydown', { key: how, bubbles: true, cancelable: true })) })
        await screen.act(async () => { await flush() })
        return field
    }
    const first = '.playlist-name[data-playlist-index="0"]'

    it('goes to the controller when the field loses the focus', async () => {
        const screen = await open(generated())
        await type(screen, first, '  Best of Zeppelin ')
        expect(outside).toEqual([['renamePlaylist', 0, 'Best of Zeppelin']])
        expect(q(first).textContent).toBe('Best of Zeppelin')
    })

    it('an empty title or the same title changes nothing, and the field shows the title again', async () => {
        const screen = await open(generated())
        expect((await type(screen, first, '   ')).textContent).toBe('Greatest Hits')
        expect((await type(screen, first, 'Greatest Hits')).textContent).toBe('Greatest Hits')
        expect(outside).toEqual([])
    })

    it('Enter ends the edit and does not break the line', async () => {
        const screen = await open(generated())
        const field = q(first)
        const entered = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
        await screen.act(async () => { field.dispatchEvent(new FocusEvent('focusin', { bubbles: true })); field.dispatchEvent(entered) })
        expect(entered.defaultPrevented).toBe(true)
    })

    it('a draw of the screen while it is being typed does not take the typed text away', async () => {
        const screen = await open(generated())
        const field = q(first)
        await screen.act(async () => { field.dispatchEvent(new FocusEvent('focusin', { bubbles: true })) })
        field.textContent = 'Half a tit'
        await screen.act(async () => { playlistsStore.setDirty(true); playlistsStore.setSaving(false) }) // the stores say something unrelated
        expect(q(first).textContent).toBe('Half a tit')
        expect(q(first)).toBe(field)
    })
})

describe('the top of the screen (UAT-190)', () => {
    it('names the batch being edited, with the path from the saved playlists', async () => {
        await open([], { url: '/playlists/edit?edit=Sunday%20mix&seriesId=s1', batches: { 'Sunday mix': generated().map(p => ({ ...p, batchName: 'Sunday mix' })) } })
        expect(q('h1').textContent).toContain('Edit Playlist Batch')
        expect(q('.badge-success').textContent).toBe('Editing: Sunday mix')
        expect(all('.breadcrumb a').map(a => a.getAttribute('href'))).toEqual(['/start', '/saved-playlists'])
        expect(q('.breadcrumb-current').textContent).toBe('Edit Batch')
    })

    it('shows the path from the blend when creating, with no badge', async () => {
        await open(generated())
        expect(q('h1').textContent).toContain('Playlist Management')
        expect(q('.badge-success')).toBeNull()
        expect(all('.breadcrumb a').map(a => a.getAttribute('href'))).toEqual(['/start', '/blend'])
        expect(q('.breadcrumb-current').textContent).toBe('Playlists')
    })

    it('labels the batch name once, tied to its field', async () => {
        await open(generated())
        const labels = all('label[for="batchNameInput"]')
        expect(labels).toHaveLength(1)
        expect(labels[0].textContent).toBe('Batch Name')
        expect(labels[0].getAttribute('for')).toBe('batchNameInput')
    })

    it('a click on a step of the path goes there through the router', async () => {
        const screen = await open(generated())
        await screen.act(async () => { q('.breadcrumb a').click(); await flush() })
        expect(vi.mocked(router.navigate).mock.calls.at(-1)?.[0]).toBe('/start')
    })
})

describe('the screen with no playlists (F73, UAT-214)', () => {
    it('says there are none and leads to The Blending Menu; there is nothing to name, reconfigure or export', async () => {
        await open([])
        expect(q('[data-playlists-empty]').textContent).toContain('No playlists here yet')
        expect(q('[data-playlists-empty] a').textContent!.trim()).toBe('Go to The Blending Menu')
        expect(q('#batchNameInput')).toBeNull()
        expect(q('#exportSection')).toBeNull()
        expect(q('.regenerate-panel')).toBeNull()
    })

    it('a saved batch that was not found says so, and leads back', async () => {
        await open([], { url: '/playlists/edit?edit=Ghost&seriesId=s1' })
        expect(q('.alert-error h3').textContent).toBe('Batch Not Found')
        expect(q('.alert-error').textContent).toContain('"Ghost"')
        expect(q('.alert-error a').getAttribute('href')).toBe('/saved-playlists')
    })
})

describe('the save button', () => {
    it('is ready to click when nothing is being saved, and disabled and busy while a save is on its way', async () => {
        const screen = await open(generated())
        expect(q<HTMLButtonElement>('#saveToHistoryBtn').disabled).toBe(false)
        expect(q('#saveToHistoryBtn').textContent).toContain('Save to Series History')
        await screen.act(async () => { playlistsStore.setSaving(true) })
        expect(q<HTMLButtonElement>('#saveToHistoryBtn').disabled).toBe(true)
        expect(q('#saveToHistoryBtn').getAttribute('aria-busy')).toBe('true')
        expect(q('#saveToHistoryBtn').textContent).toContain('Saving')
    })

    it('saves under the name typed, as the computer always did', async () => {
        const screen = await open(generated())
        await screen.act(async () => {
            const input = q<HTMLInputElement>('#batchNameInput')
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'Road trip')
            input.dispatchEvent(new Event('input', { bubbles: true }))
        })
        expect(playlistsStore.batchName).toBe('Road trip') // the store hears it (silently: no draw of the screen takes the cursor)
        await screen.tap('#saveToHistoryBtn')
        expect(outside).toEqual([['saveCurrentBatch', 'Road trip']])
    })
})

describe('what the screen reads: a store whose lists change inside (risk R4)', () => {
    it('draws what the lists hold now when the service changed a playlist in place and said so (applyBatchName)', async () => {
        const screen = await open(generated())
        await screen.act(async () => {
            const onScreen = playlistsStore.getPlaylists()
            onScreen[0].tracks!.push({ id: 'new', title: 'Brand new', duration: 60 }) // inside the list, as applyBatchName writes inside the playlists
            playlistsStore.setPlaylists(onScreen) // the same list given again
        })
        expect(all('.playlist-card')[0].textContent).toContain('Brand new')
    })

    it('draws a move by its place, so a row put where it was by the drag is the one the move changes', async () => {
        const screen = await open(generated())
        await screen.act(async () => { fakeService.moveTrack(0, 0, 0, 2) })
        expect(all('.playlist-card')[0].querySelectorAll('.track-row .font-medium').length).toBe(3)
        expect([...all('.playlist-card')[0].querySelectorAll('.track-row .font-medium')].map(e => e.textContent)).toEqual(['Ramble On', 'Time', 'Kashmir'])
    })
})

describe('the phone shows one playlist at a time', () => {
    it('a chip per playlist says its name, its tracks and its length; the open one is marked', async () => {
        await open(generated(), { phone: true })
        const chips = all('.phone-pl-chip')
        expect(chips).toHaveLength(3)
        expect(chips[0].classList.contains('is-current')).toBe(true)
        expect(chips[0].getAttribute('aria-pressed')).toBe('true')
        expect(chips[0].textContent).toContain('1 · Greatest Hits')
        expect(chips[0].textContent).toContain('3 tracks · 20 min')
        expect(chips[2].textContent).toContain('0 tracks · 0 min')
    })

    it('only the open playlist is drawn, a chip opens its playlist, and a row says position, title, artist · album and length', async () => {
        const screen = await open(generated(), { phone: true })
        expect(all('.phone-pl')).toHaveLength(1)
        expect(q('.phone-track__sub').textContent).toBe('Led Zeppelin · Physical Graffiti')
        expect(q('.phone-track__time').textContent).toBe('8:30')
        expect(q('.phone-track .phone-more').getAttribute('aria-label')).toBe('Actions for Kashmir')
        await screen.tap('[data-phone-action="show-playlist"][data-playlist-index="1"]')
        expect(q('.phone-pl').dataset.playlistIndex).toBe('1')
        expect(q('.phone-pl__meta').textContent).toBe('Playlist 2 of the set · 2 tracks · 10 min')
        expect(q('.phone-pl__title .playlist-name').getAttribute('contenteditable')).toBe('true')
    })

    it('the top is one line: the same field, with undo and redo as named icons; an empty name shows the one the save falls back to', async () => {
        const screen = await open(generated(), { phone: true })
        expect(q('#batchNameInput').className).toBe('phone-batch__input')
        expect(q('.phone-batch__row [data-action="undo-edit"]').getAttribute('aria-label')).toBe('Undo the last change')
        expect(q('.phone-batch__row [data-action="redo-edit"]').getAttribute('aria-label')).toBe('Redo the change that was undone')
        await screen.act(async () => { playlistsStore.setDefaultBatchName('TheAlbumBlender Playlist 2026-11-21') })
        expect(q<HTMLInputElement>('#batchNameInput').value).toBe('TheAlbumBlender Playlist 2026-11-21')
    })

    it('the action bar has Export and Save, and Save saves under the name typed', async () => {
        const screen = await open(generated(), { phone: true })
        expect(all('.phone-action-bar button').map(b => b.textContent!.trim())).toEqual(['Export', 'Save'])
        await screen.act(async () => {
            const input = q<HTMLInputElement>('#batchNameInput')
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'On the bus')
            input.dispatchEvent(new Event('input', { bubbles: true }))
        })
        await screen.tap('[data-phone-action="save"]')
        expect(outside).toEqual([['saveCurrentBatch', 'On the bus']])
    })

    it('the action bar is not there on the computer', async () => {
        await open(generated())
        expect(q('.phone-action-bar')).toBeNull()
        expect(all('[data-phone-action]')).toHaveLength(0)
    })
})

describe('what a tap does on the phone', () => {
    it('the «⋯» of a track opens a sheet of named moves, the other playlists, and remove last', async () => {
        const screen = await open(generated(), { phone: true })
        await screen.tap('[data-phone-action="track-options"][data-track-index="1"]')
        const rows = all('.sheet .phone-sheet-action').map(r => r.textContent)
        expect(rows).toEqual(['Move up', 'Move down', 'Move to the top', 'Move to the end', '2 · Playlist 2', '3 · Playlist 3', 'Remove from this playlist'])
        expect(q('.sheet .phone-sheet-heading').textContent).toBe('Move to another playlist')
        expect(all('.sheet .phone-sheet-action--danger')).toHaveLength(1)
    })

    it('nothing to move up from the first track, nothing to move down from the last', async () => {
        const screen = await open(generated(), { phone: true })
        await screen.tap('[data-phone-action="track-options"][data-track-index="0"]')
        const disabled = all('.sheet .phone-sheet-action').filter(r => (r as HTMLButtonElement).disabled).map(r => r.textContent)
        expect(disabled).toEqual(['Move up', 'Move to the top'])
    })

    it('moving calls the same move the drag and drop calls, says where the track went with Undo, and Undo takes it back', async () => {
        const screen = await open(generated(), { phone: true })
        await screen.tap('[data-phone-action="track-options"][data-track-index="0"]')
        await screen.tapText('.sheet .phone-sheet-action', '2 · Playlist 2')
        expect(outside[0]).toEqual(['moveTrack', 0, 1, 0, 2])
        expect(q('.phone-undo__text').textContent).toBe('Moved "Kashmir" to playlist 2')
        await screen.tap('.phone-undo__btn')
        expect(outside[1]).toEqual(['undo'])
        expect(q('.phone-undo')).toBeNull()
    })

    it('removing happens at once and offers Undo, which goes away by itself after a few seconds', async () => {
        vi.useFakeTimers()
        try {
            const screen = await open(generated(), { phone: true })
            await screen.act(async () => { q('[data-phone-action="track-options"][data-track-index="0"]').click() })
            await screen.act(async () => { all('.sheet .phone-sheet-action').find(r => r.textContent === 'Remove from this playlist')!.click() })
            expect(outside).toContainEqual(['removeTrack', 0, 0])
            expect(q('.phone-undo__text').textContent).toBe('Removed "Kashmir"')
            await screen.act(async () => { vi.advanceTimersByTime(6100) })
            expect(q('.phone-undo')).toBeNull()
        } finally { vi.useRealTimers() }
    })

    it('deleting a whole playlist is asked first', async () => {
        const screen = await open(generated(), { phone: true })
        await screen.tap('[data-phone-action="playlist-options"]')
        await screen.tapText('.sheet .phone-sheet-action', 'Delete this playlist')
        expect(outside[0]).toEqual(['confirm', 'Delete playlist?', '"Greatest Hits" and its tracks leave this set. You can undo it until you save.'])
        expect(outside).toContainEqual(['removePlaylist', 0])
    })

    it('Export opens the export window (F90): Apple Music, Spotify, the file, in that order', async () => {
        const screen = await open(generated(), { phone: true })
        await screen.tap('[data-phone-action="export"]')
        expect(all('.sheet [data-export]').map(r => r.textContent!.trim())).toEqual(['Export to Apple Music', 'Export to Spotify', 'Download JSON'])
        await screen.tap('.sheet [data-export="json"]')
        expect(outside).toEqual([['exportJson']])
        expect(q('.sheet:not(.sheet--closing)')).toBeNull()
    })

    it('the export window gives the focus back to the «Export» of the bar when it closes (F90), and the draw that follows does not take it away', async () => {
        const screen = await open(generated(), { phone: true })
        q('[data-phone-action="export"]').focus()
        await screen.tap('[data-phone-action="export"]')
        await screen.act(async () => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await flush() })
        expect(document.activeElement).toBe(q('[data-phone-action="export"]'))
    })

    it('the sheet is shut when the screen is left', async () => {
        const screen = await open(generated(), { phone: true })
        await screen.tap('[data-phone-action="export"]')
        await screen.leave()
        expect(q('.sheet:not(.sheet--closing)')).toBeNull()
    })
})

describe('the computer keeps its grid and the phone its list', () => {
    it('turning the phone into a computer draws the grid again, and back', async () => {
        const phone = asPhone(true)
        const screen = await open(generated(), { phone: true })
        void phone
        expect(all('.playlist-card')).toHaveLength(0)
        const turn = (window.matchMedia as unknown as () => { matches: boolean })()
        expect(turn.matches).toBe(true)
        await screen.leave()
    })
})

describe('the exports of the computer', () => {
    it('Spotify, the file and Apple Music each ask for their own', async () => {
        const screen = await open(generated())
        await screen.tap('#exportSpotifyBtn')
        await screen.tap('#exportJsonBtn')
        expect(outside).toEqual([['spotifyWindow'], ['exportJson']])
        // F90: Apple Music asks for the folder first, in the export window; what the person picks there is what the export is told
        await screen.tap('#exportAppleMusicBtn')
        expect(q('#playlist-export-window [data-apple-folder-step]')).not.toBeNull()
        expect(q('#playlist-export-window .app-modal__title').textContent).toBe('Export to Apple Music')
        await screen.tap('[data-apple-export]')
        expect(outside).toEqual([['spotifyWindow'], ['exportJson'], ['exportApple', '{"folderName":"MJRP Playlists"}']])
    })

    it('the window gives the focus back to the Apple Music button when it closes', async () => {
        const screen = await open(generated())
        q('#exportAppleMusicBtn').focus()
        await screen.tap('#exportAppleMusicBtn')
        await screen.act(async () => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })) })
        expect(q('#playlist-export-window')).toBeNull()
        expect(document.activeElement).toBe(q('#exportAppleMusicBtn'))
    })
})

itLeavesNoListeners('the playlists screen', Playlists, { controller: new PlaylistsController(new GeneratingFlag()), generating: new GeneratingFlag() }, { screen: 'playlists' })
