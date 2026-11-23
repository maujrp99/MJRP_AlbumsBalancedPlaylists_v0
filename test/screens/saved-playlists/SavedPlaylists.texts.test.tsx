/**
 * F83 wave 1 (REQ-08): the texts of the saved playlists screen come from the dictionary, in English and in Portuguese.
 *
 * What it proves: that no text is written in the files of the screen (the counter of loose texts of the migration board finds none),
 * that in Portuguese the screen and the questions it asks speak Portuguese, that a name a person wrote is never translated, and
 * that the screen draws again when the language changes. What it does not prove: that every text the screen shows is in the
 * dictionary (the counter does not see a text that arrives by a variable): the reading of the screen in both languages, at the
 * visual recheck, is the proof of that. The texts of the hand-made pieces the screen holds (the filter bar, the rows of tracks,
 * the dialog's «Cancel») are theirs and stay in English until they are ported; they are listed in the plan, not hidden here.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import { act } from 'react'

vi.mock('../../../public/js/services/playlists/savedPlaylistsReading.js', () => ({ savedPlaylistsReader: {}, savedPlaylistsStore: {} }))
const dialog = vi.hoisted(() => ({ confirm: vi.fn(() => Promise.resolve(false)) }))
vi.mock('../../../public/js/ui/dialogs/dialogs', () => ({ dialogService: dialog }))

import { SavedPlaylists } from '../../../public/js/screens/saved-playlists/SavedPlaylists'
import { SavedPlaylistsController } from '../../../public/js/controllers/SavedPlaylistsController.js'
import { SavedPlaylistsStore } from '../../../public/js/stores/savedPlaylists.js'
import { setLocale, PREVIEW_KEY, localeListenerCount } from '../../../public/js/i18n/t.js'
import { renderScreen } from '../../support/renderScreen'
import { entry, asPhone, quietTheRouter } from '../../support/savedPlaylistsScenarios.js'
import { SeriesPlaylistsStatus as Status } from '../../../public/js/models/savedPlaylists.js'
import { countTsx } from '../../../scripts/lib/stringSites.mjs'

const FILES = [
    'public/js/screens/saved-playlists/SavedPlaylists.tsx',
    'public/js/screens/saved-playlists/SeriesGroup.tsx',
    'public/js/screens/saved-playlists/BatchCard.tsx',
    'public/js/screens/saved-playlists/PhoneParts.tsx',
    'public/js/screens/saved-playlists/PlaylistDetails.tsx',
    'public/js/screens/saved-playlists/listText.ts',
    'public/js/ui/AlbumCascade.tsx',
    'public/js/ui/CoverImage.tsx',
    'public/js/ui/SheetWindow.tsx',
    'public/js/ui/ModalWindow.tsx'
]

describe('no text is written in the files of the screen', () => {
    for (const file of FILES) {
        it(`${file}: the counter of loose texts finds none`, () => {
            expect(countTsx(fs.readFileSync(file, 'utf8'), file)).toEqual([])
        })
    }
})

describe('in Portuguese the screen speaks Portuguese', () => {
    let store: SavedPlaylistsStore
    let controller: SavedPlaylistsController
    const reader = { load: () => new Promise<void>(() => {}), refreshSeries: () => Promise.resolve(), removeBatch: () => Promise.resolve(1), removeAll: () => Promise.resolve(1) }

    beforeEach(() => {
        window.localStorage.setItem(PREVIEW_KEY, 'pt')
        asPhone(false)
        quietTheRouter()
        store = new SavedPlaylistsStore()
        controller = new SavedPlaylistsController({ reader, store })
    })
    afterEach(async () => {
        window.localStorage.removeItem(PREVIEW_KEY)
        await setLocale('en')
        document.body.innerHTML = ''
    })

    it('the title, the status, the options of the order, the series and the batch read in Portuguese; a name that was written is left alone', async () => {
        const rendered = await renderScreen(SavedPlaylists, { controller }, { screen: 'saved_playlists' })
        expect(rendered.app.querySelector('h1')!.textContent!.trim()).toBe('Your Playlists Series')

        await act(async () => { await setLocale('pt') })
        expect(rendered.app.querySelector('h1')!.textContent!.trim()).toBe('Suas séries de playlists')
        expect(rendered.app.querySelector('.saved-playlists-status')!.textContent!.trim()).toBe('Lendo as suas séries...')

        await rendered.act(() => {
            store.begin(1, 'u1')
            store.setSeries([entry('s1', 'Plant & Page', Status.READY, [{ id: 'p1', name: 'Kashmir <b>', batchName: 'Sunday mix', savedAt: '2026-11-01T10:00:00Z', tracks: [{ title: 'Song', album: 'A', duration: 3600 }] }])])
            store.flush()
        })
        const text = rendered.app.textContent!
        expect(rendered.app.querySelector('h2')!.textContent!.trim()).toBe('Plant & Page') // the name of a series is never translated
        expect(text).toContain('Adicionar playlists')
        expect(text).toContain('Abrir a série de álbuns')
        expect(text).toContain('Editar lote')
        expect([...rendered.app.querySelectorAll('#genericSort option')].map(option => option.textContent)).toEqual(['Atualizadas recentemente', 'Nome (A-Z)', 'Nome (Z-A)'])
        expect(rendered.app.querySelector('#filter-series option')!.textContent).toBe('Todas as séries de álbuns')

        await rendered.act(() => { rendered.app.querySelector<HTMLElement>('.batch-header')!.click() })
        await rendered.act(() => { rendered.app.querySelector<HTMLElement>('.playlist-row .playlist-row-buttons button:last-child')!.click() })
        const modal = document.getElementById('playlist-modal')!
        expect(modal.querySelector('.app-modal__title')!.textContent).toBe('Kashmir <b>') // text is text
        expect(modal.querySelector('b')).toBeNull()
        expect(modal.textContent).toContain('de duração')
        expect(modal.querySelector('.btn-secondary')!.textContent).toBe('Fechar')
        await rendered.leave()
    })

    it('the question before a delete is asked in Portuguese', async () => {
        await setLocale('pt')
        const rendered = await renderScreen(SavedPlaylists, { controller }, { screen: 'saved_playlists' })
        await rendered.act(() => {
            store.begin(1, 'u1')
            store.setSeries([entry('s1', 'Plant', Status.READY, [{ id: 'p1', name: 'P', batchName: 'Sunday mix', savedAt: '2026-11-01T10:00:00Z', tracks: [] }])])
            store.flush()
        })
        await rendered.act(() => { rendered.app.querySelector<HTMLElement>('[aria-label="Apagar o lote Sunday mix"]')!.click() })
        expect(dialog.confirm).toHaveBeenCalledWith({
            title: 'Apagar o lote?',
            message: 'Tem certeza de que quer apagar o lote "Sunday mix"? Ele tem 1 playlists.',
            confirmText: 'Apagar o lote',
            variant: 'danger'
        })
        await rendered.leave()
    })

    it('the screen that listened to the language lets go of it when it is left', async () => {
        const base = localeListenerCount()
        const rendered = await renderScreen(SavedPlaylists, { controller }, { screen: 'saved_playlists' })
        expect(localeListenerCount()).toBe(base + 1)
        await rendered.leave()
        expect(localeListenerCount()).toBe(base)
    })
})
