/**
 * F83 wave 6a (REQ-08): the texts of the inventory screen come from the dictionary, in English and in Portuguese.
 *
 * What it proves: that no text is written in the files of the screen but the names of products and an address (the counter of loose texts of the
 * migration board finds only those), that every key the screen asks for exists in both dictionaries, that in Portuguese the title, the bar, the sheets,
 * the questions and the notices of the controller speak Portuguese, that a name a person wrote (title, artist) is never translated, and that the screen
 * draws again when the language changes. What it does not prove: that every text the screen shows is in the dictionary (the counter does not see a
 * text that arrives by a variable): the reading of the screen in both languages, at the visual recheck, is the proof of that. The sentences the MODELS
 * write (the labels of the values, the notices of a run, the notes of the totals, the names of the orders) are English until wave 6c.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

vi.mock('../../../public/js/services/inventory/inventoryWiring.js', async () => (await import('../../support/inventoryStandIns.js')).wiringModule)
vi.mock('../../../public/js/services/inventory/inventoryValueWiring.js', async () => (await import('../../support/inventoryStandIns.js')).valuesModule)
vi.mock('../../../public/js/services/OptimizedAlbumLoader.js', async () => (await import('../../support/inventoryStandIns.js')).loaderModule)
vi.mock('../../../public/js/components/Toast.js', async () => (await import('../../support/inventoryStandIns.js')).toastModule)
vi.mock('../../../public/js/services/DialogService.js', async () => (await import('../../support/inventoryStandIns.js')).dialogModule)

import { act } from 'react'
import { setLocale, PREVIEW_KEY, localeListenerCount, t } from '../../../public/js/i18n/t.js'
import { en } from '../../../public/js/i18n/en/index.js'
import { inventory as inventoryEn } from '../../../public/js/i18n/en/inventory.js'
import { inventory as inventoryPt } from '../../../public/js/i18n/pt/inventory.js'
import { countTsx } from '../../../scripts/lib/stringSites.mjs'
import { openInventory, press } from '../../support/inventoryHost'
import { ITEMS, world, outside } from '../../support/inventoryStandIns.js'
import { inventoryStore } from '../../../public/js/stores/inventory.js'
import { valuesWith } from '../../helpers/inventoryValuesStub.js'

const ROOT = 'public/js/screens/inventory'
const sources = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => (entry.isDirectory() ? sources(path.join(dir, entry.name)) : [path.join(dir, entry.name)])).filter(file => /\.tsx?$/.test(file))

/** The texts that are not the screen's: the names of products and an address. */
const NOT_TRANSLATED = new Set(['Discogs', 'Spotify', 'discogs.com/settings/seller'])

describe('no text is written in the files of the screen', () => {
    for (const file of sources(ROOT)) {
        it(`${file}: the counter of loose texts finds only names of products and an address`, () => {
            const loose = countTsx(fs.readFileSync(file, 'utf8'), file).filter((site: { text: string }) => !NOT_TRANSLATED.has(site.text))
            expect(loose).toEqual([])
        })
    }
})

describe('every key the screen asks for is in the dictionary, in both languages', () => {
    const asked = new Set<string>()
    const files = [...sources(ROOT), 'public/js/controllers/InventoryController.js', 'public/js/controllers/InventoryValues.js']
    for (const file of files) {
        for (const match of fs.readFileSync(file, 'utf8').matchAll(/\bt(?:Plural)?\(\s*'(inventory\.[A-Za-z.]+)'/g)) asked.add(match[1])
    }

    it('found the keys, and every one has its English text and its Portuguese text (a plural has both forms)', () => {
        expect(asked.size).toBeGreaterThan(80)
        const known = (dictionary: Record<string, string>, key: string) => key in dictionary || `${key}.other` in dictionary
        expect([...asked].filter(key => !known(inventoryEn, key))).toEqual([])
        expect([...asked].filter(key => !known(inventoryPt, key))).toEqual([])
    })

    it('English and Portuguese have the same keys, and the dictionary of the site holds them', () => {
        expect(Object.keys(inventoryPt).sort()).toEqual(Object.keys(inventoryEn).sort())
        expect(Object.keys(inventoryEn).every(key => key in en)).toBe(true)
    })
})

describe('the screen speaks the language of the site', () => {
    beforeEach(() => { localStorage.setItem(PREVIEW_KEY, 'pt'); world.reset() })
    afterEach(async () => {
        await setLocale('en')
        localStorage.removeItem(PREVIEW_KEY)
        document.body.innerHTML = ''
        document.querySelectorAll('.sheet').forEach(node => node.remove())
        inventoryStore.reset()
        vi.restoreAllMocks()
    })

    it('in Portuguese the title, the filters, the cards, the empty state, the sheets and the notices of the controller are Portuguese; a name stays as it is', async () => {
        world.values = valuesWith({ source: 'off', rates: null as never })
        const screen = await openInventory([{ ...ITEMS()[0], title: 'Dark Side <b>' }, ...ITEMS().slice(1)], { phone: false })
        expect(document.querySelector('h1')!.textContent).toContain('My Collection')

        expect(await setLocale('pt')).toBe(true)
        await act(async () => { await Promise.resolve() })
        const text = () => document.getElementById('app')!.textContent ?? ''
        expect(document.querySelector('h1')!.textContent).toContain('Minha coleção')
        expect((document.getElementById('inventorySearch') as HTMLInputElement).placeholder).toBe('Buscar na coleção...')
        expect(text()).toContain('Todos os formatos')
        expect(document.querySelector('.view-album-btn')!.getAttribute('title')).toBe('Ver')
        expect(document.querySelector('[data-line="4"]')!.textContent).toBeTruthy()
        expect(text()).toContain('Dark Side <b>')
        expect(document.querySelector('.inventory-card-wrapper h3 b')).toBeNull()
        expect(document.getElementById('addSeriesAlbumsBtn')!.textContent).toBe('Adicionar os álbuns das minhas séries')

        // the notice the controller says, the question it asks
        world.plan = { toAdd: [{ artist: 'A', title: 'B' }], skipped: [], alreadyThere: 0, repeated: 0, incomplete: 0, seriesCount: 1 } as never
        world.confirm.answer = false
        outside.length = 0
        await press(document.getElementById('addSeriesAlbumsBtn')!)
        const question = JSON.parse(outside.find(call => call[0] === 'dialog.confirm')![1] as string)
        expect(question.title).toBe('Adicionar os álbuns das suas séries?')
        expect(question.confirmText).toBe('Adicionar 1 álbum')
        await screen.destroy()
    })

    it('in Portuguese the sheets of the phone speak Portuguese', async () => {
        window.scrollTo = vi.fn() as never
        const screen = await openInventory(ITEMS(), { phone: true })
        expect(await setLocale('pt')).toBe(true)
        await act(async () => { await Promise.resolve() })
        await press(document.querySelector('[data-phone-action="filters"]') as HTMLElement)
        const sheet = document.querySelector('.sheet')!
        expect(sheet.querySelector('.sheet__title')!.textContent).toBe('Filtros e ordem')
        expect(sheet.querySelector('.sheet__close')!.getAttribute('aria-label')).toBe('Fechar')
        expect(sheet.textContent).toContain('Galeria')
        expect(sheet.querySelector('[data-role="filters-done"]')!.textContent).toBe('Mostrar 5 álbuns')
        await screen.destroy()
    })

    it('the screen is listening to the language only while it is open', async () => {
        const before = localeListenerCount()
        const screen = await openInventory(ITEMS(), { phone: false })
        expect(localeListenerCount()).toBeGreaterThan(before)
        await screen.destroy()
        expect(localeListenerCount()).toBe(before)
        expect(t('inventory.title')).toBe('My Collection')
    })
})
