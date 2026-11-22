/**
 * F83 wave 7a (REQ-08): the texts of the panel to generate again and of the pieces of ui/recipe/ come from the dictionary, in English and in Portuguese.
 *
 * What it proves: that no text is written in the files of the panel and the pieces (the counter of loose texts of the migration board finds none); that every
 * recipe of the registry has its name, its description and its label in both languages, and that the English is the metadata's of the algorithm (so the two
 * cannot drift apart: the metadata is what a generation writes into the name of a batch); that in Portuguese the panel speaks Portuguese and that the
 * screen draws it again when the language changes. What it does not prove: that the Portuguese is right: those texts are the agent's proposal, and wait for the owner.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'

vi.mock('../../../public/js/services/playlists/playlistsWiring.js', async () => (await import('../../support/playlistsScenarios.js')).wiring())
vi.mock('../../../public/js/ui/dialogs/dialogs', async () => ({ dialogService: { confirm: vi.fn(async () => true) } }))

import { Playlists, GeneratingFlag } from '../../../public/js/screens/playlists/Playlists'
import { PlaylistsController } from '../../../public/js/controllers/PlaylistsController.js'
import { setLocale, t, PREVIEW_KEY } from '../../../public/js/i18n/t.js'
import { en } from '../../../public/js/i18n/en/index.js'
import { pt } from '../../../public/js/i18n/pt/index.js'
import { getAllAlgorithms } from '../../../public/js/algorithms/index.js'
import { recipeKeyOf } from '../../../public/js/ui/recipe/RecipeCards'
import { renderScreen } from '../../support/renderScreen'
import { generated, asPhone, quiet, fakeService } from '../../support/playlistsScenarios.js'
import { countTsx } from '../../../scripts/lib/stringSites.mjs'

const FILES = [
    'public/js/screens/playlists/RegeneratePanel.tsx',
    'public/js/screens/playlists/regenerateMemory.ts',
    'public/js/ui/recipe/RecipeCards.tsx',
    'public/js/ui/recipe/Ingredients.tsx'
]

describe('no text is written in the files of the panel and the pieces', () => {
    for (const file of FILES) {
        it(`${file}: the counter of loose texts finds none`, () => {
            expect(countTsx(fs.readFileSync(file, 'utf8'), file)).toEqual([])
        })
    }
})

describe('every recipe of the registry has its words in both languages', () => {
    const recipes = getAllAlgorithms()

    it('the name, the description and the label of each, in en and pt', () => {
        expect(recipes.length).toBeGreaterThan(0)
        for (const recipe of recipes) {
            for (const part of ['name', 'description', 'badge']) {
                const key = `blend.recipes.${recipeKeyOf(recipe.id)}.${part}`
                expect(en[key as keyof typeof en], `en ${key}`).toBeTruthy()
                expect(pt[key as keyof typeof pt], `pt ${key}`).toBeTruthy()
            }
        }
    })

    it('the English is what the algorithm says of itself (the metadata is data and stays as it is)', () => {
        for (const recipe of recipes) {
            const base = `blend.recipes.${recipeKeyOf(recipe.id)}`
            expect(t(`${base}.name`), recipe.id).toBe(recipe.name)
            expect(t(`${base}.description`), recipe.id).toBe(recipe.description)
            expect(t(`${base}.badge`), recipe.id).toBe(recipe.badge)
        }
    })

    it('a recipe of the registry that has no words in a dictionary is accused by name', () => {
        const missing = (dictionary: Record<string, string>, id: string) => ['name', 'description', 'badge'].filter(part => !dictionary[`blend.recipes.${recipeKeyOf(id)}.${part}`])
        expect(missing(en, 'a-new-recipe')).toEqual(['name', 'description', 'badge'])
    })
})

async function open() {
    asPhone(false)
    quiet()
    window.history.replaceState({}, '', '/playlists')
    fakeService.begin(generated())
    const generating = new GeneratingFlag()
    const controller = new PlaylistsController(generating)
    const screen = await renderScreen(Playlists, { controller, generating }, { screen: 'playlists', view: { prepare: (params) => controller.initialize(params) } })
    return { ...screen, panel: () => document.querySelector('#regeneratePanelMount')!.textContent ?? '' }
}

describe('in Portuguese the panel speaks Portuguese, and draws again when the language changes', () => {
    beforeEach(async () => {
        window.localStorage.setItem(PREVIEW_KEY, 'pt')
        expect(await setLocale('pt')).toBe(true)
    })
    afterEach(async () => {
        document.body.innerHTML = ''
        await setLocale('en')
        window.localStorage.removeItem(PREVIEW_KEY)
    })

    it('the header, the count, the recipes, the sections and the button', async () => {
        const screen = await open()
        const text = screen.panel()
        expect(text).toContain('Reconfigure a sua mistura de playlists')
        expect(text).toContain('(3 playlists)')
        expect(text).toContain('RECOMENDADA')
        expect(text).toContain('Top Faixas por Popularidade no Spotify')
        expect(text).toContain('Duração alvo (minutos)')
        expect(text).toContain('Fonte do ranking')
        expect(text).toContain('Gerar as playlists de novo')
        expect(text).not.toContain('Reconfigure your')
        await screen.leave()
    })

    it('a Top N recipe: the Top #, the grouping and the structure in Portuguese', async () => {
        const screen = await open()
        await screen.act(async () => { document.querySelector<HTMLElement>('[data-recipe-id="top-n-user"]')!.click() })
        const text = screen.panel()
        expect(text).toContain('Escolha o seu Top nº')
        expect(text).toContain('Top 10')
        expect(text).toContain('Agrupamento das faixas')
        expect(text).toContain('Estrutura da playlist')
        expect(text).toContain('Uma playlist com todas as faixas')
        await screen.leave()
    })

    it('the language turned back to English draws the panel in English again, with what was chosen kept', async () => {
        const screen = await open()
        await screen.act(async () => { document.querySelector<HTMLElement>('[data-recipe-id="top-n-acclaimed"]')!.click() })
        await screen.act(async () => { await setLocale('en') })
        const text = screen.panel()
        expect(text).toContain('Reconfigure your Music Playlist Blend')
        expect(text).toContain('Regenerate Playlists')
        expect(text).toContain('Choose your Top #')
        await screen.leave()
    })
})
