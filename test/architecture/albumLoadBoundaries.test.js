/**
 * Fitness functions of the album load design (arch.md, "Carga da tela de álbuns", seções 11 e 16).
 * They read the imports of the source files and fail when a boundary of the design is crossed,
 * so the design cannot spread again without a test turning red.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(process.cwd(), 'public/js')

const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8')
const listJs = (relativeDir) => {
    const dir = path.join(ROOT, relativeDir)
    if (!fs.existsSync(dir)) return []
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const child = path.join(relativeDir, entry.name)
        if (entry.isDirectory()) return listJs(child)
        return entry.name.endsWith('.js') ? [child] : []
    })
}
/** The module specifiers a file imports, static and dynamic. */
const importsOf = (relative) => {
    const source = read(relative)
    const found = []
    const pattern = /(?:import\s+(?:[^'"]*?\sfrom\s+)?|import\s*\(\s*)['"]([^'"]+)['"]/g
    let match
    while ((match = pattern.exec(source)) !== null) found.push(match[1])
    return found
}
const offenders = (files, isForbidden) => files.flatMap(file =>
    importsOf(file).filter(isForbidden).map(specifier => `${file} -> ${specifier}`))

describe('album load boundaries', () => {
    it('the queue knows nothing about the project', () => {
        expect(importsOf('utils/TaskQueue.js')).toEqual([])
    })

    it('"only the latest ask counts" knows nothing about the project either (F58)', () => {
        expect(importsOf('utils/LatestOnly.js')).toEqual([])
    })

    it('the rules of state, filter, paging and facts are pure: they import only other models', () => {
        const pure = ['models/albumLoadState.js', 'models/albumQuery.js', 'models/cloneAlbum.js',
            'models/seriesFilter.js', 'models/paging.js', 'models/albumFacts.js',
            'models/albumLoadHold.js', 'models/albumSourceAsk.js', 'models/albumAsk.js']

        expect(offenders(pure, specifier => !specifier.startsWith('./'))).toEqual([])
    })

    it('the load store only holds state: no service, API, repository, cache or Firestore', () => {
        const forbidden = /(\/services\/|\/api\/|\/repositories\/|shared\/data\/|\/cache\/|firebase)/

        expect(offenders(['stores/albumLoad.js'], specifier => forbidden.test(specifier))).toEqual([])
    })

    it('the load service and the facts service reach the outside only through what they are given', () => {
        const forbidden = /(\/api\/|\/repositories\/|shared\/data\/|\/cache\/|\/stores\/|\/components\/|\/views\/|firebase|MusicKit|Spotify)/
        const services = ['services/albums/AlbumLoadService.js', 'services/albums/LoadHold.js',
            'services/albums/AlbumAsks.js', 'services/series/SeriesFactsService.js']

        expect(offenders(services, specifier => forbidden.test(specifier))).toEqual([])
    })

    it('the adapters do not import Firestore, a store or the screen: their sources are injected', () => {
        const forbidden = /(firebase|\/stores\/|\/components\/|\/views\/|\/repositories\/|shared\/data\/)/

        expect(offenders(listJs('services/albums/adapters'), specifier => forbidden.test(specifier))).toEqual([])
    })

    it('only the composition file wires the load to the real sources', () => {
        const wiring = importsOf('services/albums/albumLoading.js')

        expect(wiring.some(specifier => specifier.includes('AlbumLoadService'))).toBe(true)
        const others = listJs('services/albums').filter(file => file !== 'services/albums/albumLoading.js')
        expect(offenders(others, specifier => /MusicKitService|UserRankingRepository|repositories\/userRankings|CacheManager/.test(specifier))).toEqual([])
    })

    it('the screen does not decide the load: components and views of the series never import the load service or the API client', () => {
        const screen = [...listJs('components/series'), ...listJs('components/ui'), 'views/SeriesView.js', ...listJs('views/helpers')]
        const forbidden = /(services\/albums\/|api\/client)/

        expect(offenders(screen, specifier => forbidden.test(specifier))).toEqual([])
    })

    it('the series controller no longer loads albums itself', () => {
        const controller = importsOf('controllers/SeriesController.js')

        expect(controller.filter(specifier => /api\/client|UserRankingRepository|repositories\/userRankings|OptimizedAlbumLoader|firebase/.test(specifier))).toEqual([])
    })
})
