/**
 * F83 wave 4 (REQ-08): the texts of the Start screen come from the dictionary, in English and in Portuguese.
 *
 * What it proves: that no text is written in the files of the screen (the counter of loose texts of the migration board finds none),
 * that in Portuguese the stage, the results, the dock, the pasted list and the sheet of the phone speak Portuguese, that a name the
 * catalog gave or a person wrote is never translated, and that the screen draws again when the language changes. What it does not prove:
 * that every text the screen shows is in the dictionary (the counter does not see a text that arrives by a variable): the reading of the
 * screen in both languages, at the visual recheck, is the proof of that. One text is not the screen's: the warning of the shared album
 * picker when asked to search with no text goes through the option `emptyQueryMessage`, which the screen fills from the dictionary
 * (tested here); the picker of the series edit keeps its English until wave 5.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'

const service = vi.hoisted(() => ({ scanArtist: vi.fn(), search: vi.fn() }))
const toast = vi.hoisted(() => ({ warning: vi.fn(), error: vi.fn(), success: vi.fn(), info: vi.fn() }))

vi.mock('../../../public/js/services/album-search/AlbumSearchService.js', () => ({ albumSearchService: service }))
vi.mock('../../../public/js/services/SeriesService.js', () => ({ getSeriesService: vi.fn(() => ({ createSeries: async () => ({ id: 's1' }) })) }))
vi.mock('../../../public/js/stores/toasts.js', () => ({ default: toast }))

import { Start } from '../../../public/js/screens/start/Start'
import { StartController } from '../../../public/js/screens/start/StartController'
import { setLocale, PREVIEW_KEY, localeListenerCount } from '../../../public/js/i18n/t.js'
import { renderScreen } from '../../support/renderScreen'
import { albumSeriesStore } from '../../../public/js/stores/albumSeries.js'
import { asPhone } from '../../support/startScenarios.js'
import { countTsx } from '../../../scripts/lib/stringSites.mjs'

const FILES = [
    'public/js/screens/start/Start.tsx',
    'public/js/screens/start/Stage.tsx',
    'public/js/screens/start/Results.tsx',
    'public/js/screens/start/Dock.tsx',
    'public/js/screens/start/PasteList.tsx',
    'public/js/screens/start/Equalizer.tsx',
    'public/js/screens/start/text.ts',
    'public/js/screens/start/homeSeries.ts',
    'public/js/screens/start/homePaste.ts',
    'public/js/screens/start/StartController.ts'
]

describe('no text is written in the files of the screen', () => {
    for (const file of FILES) {
        it(`${file}: the counter of loose texts finds none`, () => {
            expect(countTsx(fs.readFileSync(file, 'utf8'), file)).toEqual([])
        })
    }
})

const FLOYD = ['The Wall', 'Animals', 'Meddle'].map((title, i) => ({ id: `a${i}`, title, artist: 'Pink Floyd', year: String(1979 - i), releaseDate: `${1979 - i}-01-01`, type: 'Album', coverUrl: null }))
const tick = () => new Promise(resolve => setImmediate(resolve))

async function open(phone: boolean) {
    asPhone(phone)
    vi.spyOn(albumSeriesStore, 'getDb').mockReturnValue({})
    service.scanArtist.mockResolvedValue({ albums: FLOYD, reclassified: null })
    const controller = new StartController()
    const screen = await renderScreen(Start, { controller }, { screen: 'start', view: { prepare: async () => { controller.initialize() }, dispose: () => controller.dispose() } })
    const text = () => screen.app.textContent ?? ''
    const press = (selector: string) => screen.act(async () => { document.querySelector<HTMLElement>(selector)!.click(); for (let i = 0; i < 4; i++) await tick() })
    const search = () => screen.act(async () => { await controller.search('Pink Floyd') })
    return { ...screen, controller, text, press, search }
}

describe('in Portuguese the screen speaks Portuguese', () => {
    beforeEach(async () => {
        window.localStorage.setItem(PREVIEW_KEY, 'pt')
        expect(await setLocale('pt')).toBe(true)
    })
    afterEach(async () => {
        document.body.innerHTML = ''
        vi.restoreAllMocks()
        await setLocale('en')
        window.localStorage.removeItem(PREVIEW_KEY)
    })

    it('the first visit, lean: the title, «What is a series?», the field, the one link, no steps and no bar', async () => {
        const screen = await open(false)
        const text = screen.text()
        expect(text).toContain('Escolha os álbuns.')
        expect(text).toContain('Nós misturamos as playlists.')
        expect(text).toContain('cole uma lista')
        expect(text).toContain('O que é uma série?')
        expect(text).not.toContain('Ache')
        expect(document.querySelector('#homeHow')).toBeNull()
        expect(document.querySelector('.home-dock')).toBeNull()
        expect(document.querySelector('#artistScanInput')!.getAttribute('placeholder')).toBe('Digite um artista')
        expect(document.querySelector('#btnScanArtist')!.textContent).toBe('Buscar')
        expect(text).not.toContain('Pick the albums.')
        await screen.leave()
    })

    it('the results and the dock: the chips, the line, «Add all», a cover, the suggested name, the count, «Create series»', async () => {
        const screen = await open(false)
        await screen.search()
        const text = screen.text()
        expect(text).toContain('Estúdio · 3')
        expect(text).toContain('3 álbuns de estúdio · os mais novos primeiro')
        expect(text).toContain('Adicionar todos os 3 álbuns de estúdio')
        expect(document.querySelector('#discographyGrid .home-card')!.getAttribute('aria-label')).toBe('The Wall, 1979. Clique para adicionar')
        await screen.press('#discographyGrid [data-id="a0"]')
        expect(document.querySelector('#discographyGrid [data-id="a0"]')!.getAttribute('aria-label')).toBe('The Wall, 1979, número 1 na sua série. Clique para tirar')
        expect((document.querySelector('#seriesNameInput') as HTMLInputElement).value).toBe('Seleção de Pink Floyd')
        expect(document.querySelector('.home-dock')!.textContent).toContain('sugerido · edite')
        expect(document.querySelector('.home-dock')!.textContent).toContain('1 álbum de 1 artista · a ordem conta')
        expect(document.querySelector('#btnCreateSeries')!.textContent).toBe('Criar série')
        await screen.press('#discographyGrid [data-id="a0"]')
        expect(document.querySelector('.home-undo')!.textContent).toContain('«The Wall» foi tirado.')
        await screen.leave()
    })

    it('a name the catalog gave or a person wrote is never translated', async () => {
        const screen = await open(false)
        await screen.search()
        expect(screen.text()).toContain('The Wall')
        expect(screen.text()).toContain('Pink Floyd')
        await screen.press('#discographyGrid [data-id="a0"]')
        await screen.press('#btnCreateSeries')
        expect(document.querySelector('.home-dock')!.textContent).toContain('«Seleção de Pink Floyd» foi salva')
        expect(document.querySelector('#homeAfter')!.textContent).toContain('«Seleção de Pink Floyd» está salva')
        await screen.leave()
    })

    it('the pasted list: the label, the line, the foot, the button', async () => {
        const screen = await open(false)
        await screen.controller.setMode('paste', 'Yes - Fragile\nRadiohead OK Computer')
        await screen.act(async () => {})
        const text = screen.text()
        expect(text).toContain('Sua lista · um álbum por linha, como Artista - Álbum')
        expect(text).toContain('2 linhas: 1 em condições de entrar, 1 a corrigir.')
        expect(text).toContain('ponha « - » entre o artista e o álbum')
        expect(text).toContain('pronta')
        expect(document.querySelector('#btnProcessBulk')!.textContent).toBe('Adicionar 1 álbum')
        await screen.leave()
    })

    it('«not found», the catalog that did not answer, and the warning of the picker when the field is empty', async () => {
        const screen = await open(false)
        service.scanArtist.mockResolvedValue({ albums: [], reclassified: null })
        await screen.act(async () => { await screen.controller.search('Zzz') })
        expect(screen.text()).toContain('Nenhum álbum encontrado para «Zzz».')
        await screen.act(async () => { await screen.controller.search('   ') })
        expect(toast.warning).toHaveBeenCalledWith('Digite primeiro o nome de um artista.')
        await screen.leave()
    })

    it('the phone: the action bar, the sheet and its foot', async () => {
        const screen = await open(true)
        await screen.search()
        await screen.press('#discographyGrid [data-id="a0"]')
        expect(screen.text()).toContain('Toque para editar ou reordenar')
        await screen.press('.home-dock__open')
        const sheet = document.querySelector('.sheet')!
        expect(sheet.querySelector('.sheet__title')!.textContent).toBe('Sua série1 álbum')
        expect(sheet.querySelector('.sheet__close')!.getAttribute('aria-label')).toBe('Pronto')
        expect(sheet.textContent).toContain('A ordem conta')
        expect(sheet.querySelector('#btnCreateSeriesSheet')!.textContent).toBe('Criar série')
        expect(document.querySelector('#discographyGrid [data-id="a0"]')!.getAttribute('aria-label')).toBe('The Wall, 1979, número 1 na sua série. Toque para tirar')
        await screen.leave()
    })

    it('draws again when the language changes', async () => {
        const screen = await open(false)
        expect(screen.text()).toContain('Escolha os álbuns.')
        await screen.act(async () => { await setLocale('en') })
        expect(screen.text()).toContain('Pick the albums.')
        expect(localeListenerCount()).toBeGreaterThan(0)
        await screen.leave()
    })
})

describe('in English it speaks the English it spoke', () => {
    afterEach(() => { document.body.innerHTML = ''; vi.restoreAllMocks() })

    it('the first visit and the empty-field warning', async () => {
        const screen = await open(false)
        expect(screen.text()).toContain('Pick the albums. We blend the playlists.')
        await screen.act(async () => { await screen.controller.search('') })
        expect(toast.warning).toHaveBeenCalledWith('Type an artist name first.')
        await screen.leave()
    })
})
