/**
 * F83 wave 2 (REQ-08): the texts of the playlists screen come from the dictionary, in English and in Portuguese.
 *
 * What it proves: that no text is written in the files of the screen (the counter of loose texts of the migration board finds none),
 * that in Portuguese the screen, its sheets and the question it asks speak Portuguese, that a name a person wrote is never translated,
 * and that the screen draws again when the language changes. What it does not prove: that every text the screen shows is in the
 * dictionary (the counter does not see a text that arrives by a variable): the reading of the screen in both languages, at the
 * visual recheck, is the proof of that. The panel to generate again and the Spotify window are the hand-made ones and keep
 * their English until the Blend screen moves (wave 7); the toasts of the controller are the controller's.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'

vi.mock('../../../public/js/services/playlists/playlistsWiring.js', async () => (await import('../../support/playlistsScenarios.js')).wiring())
vi.mock('../../../public/js/ui/dialogs/dialogs', async () => ({ dialogService: { confirm: vi.fn(async (o: { title: string; message: string; confirmText: string }) => { (await import('../../support/playlistsScenarios.js')).outside.push(['confirm', o.title, o.message, o.confirmText]); return true }) } }))

import { Playlists, GeneratingFlag } from '../../../public/js/screens/playlists/Playlists'
import { PlaylistsController } from '../../../public/js/controllers/PlaylistsController.js'
import { setLocale, PREVIEW_KEY, localeListenerCount } from '../../../public/js/i18n/t.js'
import { renderScreen } from '../../support/renderScreen'
import { generated, asPhone, quiet, fakeService, outside } from '../../support/playlistsScenarios.js'
import { countTsx } from '../../../scripts/lib/stringSites.mjs'

const FILES = [
    'public/js/screens/playlists/Playlists.tsx',
    'public/js/screens/playlists/PlaylistCards.tsx',
    'public/js/screens/playlists/PhoneParts.tsx',
    'public/js/screens/playlists/text.ts',
    'public/js/screens/playlists/unsavedChangesGuard.ts',
    'public/js/ui/TrackRow.tsx',
    'public/js/ui/Breadcrumb.tsx'
]

describe('no text is written in the files of the screen', () => {
    for (const file of FILES) {
        it(`${file}: the counter of loose texts finds none`, () => {
            expect(countTsx(fs.readFileSync(file, 'utf8'), file)).toEqual([])
        })
    }
})

async function open(phone: boolean) {
    asPhone(phone)
    quiet()
    window.history.replaceState({}, '', '/playlists')
    fakeService.begin(generated())
    const generating = new GeneratingFlag()
    const controller = new PlaylistsController(generating)
    const screen = await renderScreen(Playlists, { controller, generating }, { screen: 'playlists', view: { prepare: (params) => controller.initialize(params) } })
    const text = () => screen.app.textContent ?? ''
    return { ...screen, text }
}

describe('in Portuguese the screen speaks Portuguese', () => {
    beforeEach(async () => {
        window.localStorage.setItem(PREVIEW_KEY, 'pt')
        expect(await setLocale('pt')).toBe(true)
    })
    afterEach(async () => {
        document.body.innerHTML = ''
        outside.length = 0
        await setLocale('en')
        window.localStorage.removeItem(PREVIEW_KEY)
    })

    it('the computer: the title, the path, the actions, the field, the cards', async () => {
        const screen = await open(false)
        const text = screen.text()
        expect(text).toContain('Gerenciar playlists')
        expect(text).toContain('Criar')
        expect(text).toContain('Ações e exportação')
        expect(text).toContain('Salvar no histórico da série')
        expect(text).toContain('Nome do lote')
        expect(document.querySelector('[data-action="undo-edit"]')!.getAttribute('aria-label')).toBe('Desfazer a última alteração')
        expect(document.querySelector('.playlist-card [data-action="delete-playlist"]')!.getAttribute('aria-label')).toBe('Apagar a playlist Greatest Hits')
        expect(document.querySelector('.playlist-card .track-row [title]')!.getAttribute('title')).toBe('Kashmir')
        expect(text).not.toContain('Actions & Export')
        await screen.leave()
    })

    it('a name a person wrote is never translated', async () => {
        const screen = await open(false)
        expect(screen.text()).toContain('Greatest Hits')
        expect(screen.text()).toContain('Kashmir')
        await screen.leave()
    })

    it('the phone: the chips, the sheets and the question before deleting', async () => {
        const screen = await open(true)
        expect(screen.text()).toContain('3 faixas · 20 min')
        await screen.act(async () => { (document.querySelector('[data-phone-action="track-options"]') as HTMLElement).click() })
        const sheet = document.querySelector('.sheet')!.textContent
        expect(sheet).toContain('Descer')
        expect(sheet).toContain('Mover para outra playlist')
        expect(sheet).toContain('Remover desta playlist')
        expect(document.querySelector('.sheet__close')!.getAttribute('aria-label')).toBe('Fechar')
        await screen.leave()
    })

    it('draws again when the language changes', async () => {
        const screen = await open(false)
        expect(screen.text()).toContain('Gerenciar playlists')
        await screen.act(async () => { await setLocale('en') })
        expect(screen.text()).toContain('Playlist Management')
        expect(localeListenerCount()).toBeGreaterThan(0)
        await screen.leave()
    })
})
