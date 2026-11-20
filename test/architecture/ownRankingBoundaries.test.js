/**
 * Fitness functions of the ranking design (arch.md, "Carga da tela de álbuns", seção 18) and of the
 * text rule of UAT-180. Like albumLoadBoundaries.test.js, they read the imports of the source files.
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
const importsOf = (relative) => {
    const found = []
    const pattern = /(?:import\s+(?:[^'"]*?\sfrom\s+)?|import\s*\(\s*)['"]([^'"]+)['"]/g
    let match
    const source = read(relative)
    while ((match = pattern.exec(source)) !== null) found.push(match[1])
    return found
}
const offenders = (files, isForbidden) => files.flatMap(file =>
    importsOf(file).filter(isForbidden).map(specifier => `${file} -> ${specifier}`))

describe('own ranking boundaries', () => {
    it('the rules of text and of ranking matches are pure: they import only other models', () => {
        expect(offenders(['models/text.js', 'models/ownRanking.js'], specifier => !specifier.startsWith('./'))).toEqual([])
    })

    it('the ranking modal only shows and reports: no repository, service, store or Firestore', () => {
        const forbidden = /(\/repositories\/|shared\/data\/|\/services\/|\/stores\/|\/api\/|firebase)/
        // Only the modal: TracksRankingComparison still talks to the Spotify services on its own.
        expect(offenders(['components/ranking/UserRankModal.js'], specifier => forbidden.test(specifier))).toEqual([])
    })

    it('the ranking service reaches the outside only through what it is given', () => {
        expect(importsOf('services/ranking/OwnRankingService.js')).toEqual([])
    })

    it('the store of ranked albums only holds state', () => {
        const forbidden = /(\/services\/|\/api\/|\/repositories\/|shared\/data\/|\/cache\/|firebase)/
        expect(offenders(['stores/ownRankings.js'], specifier => forbidden.test(specifier))).toEqual([])
    })

    it('the screen of the series does not reach the ranking repository or the ranking service', () => {
        const screen = [...listJs('components/series'), ...listJs('components/ui'), 'views/SeriesView.js', ...listJs('views/helpers')]
        const forbidden = /(UserRankingRepository|repositories\/userRankings|services\/ranking\/)/
        expect(offenders(screen, specifier => forbidden.test(specifier))).toEqual([])
    })

    it('the ranking repository is reached only where the services are put together; the known exceptions can only shrink', () => {
        // BlendingController and SeriesService left the list in F56: the blend asks the album load,
        // and the surgical injection is gone.
        const KNOWN = ['services/albums/albumLoading.js', 'services/ranking/ownRanking.js']
        // F78 (Ref-A): the class lives in shared/data/; the site's one instance in repositories/userRankings.js
        const importing = listJs('').filter(file => !file.startsWith('repositories/'))
            .filter(file => importsOf(file).some(specifier => /UserRankingRepository|repositories\/userRankings/.test(specifier)))
        expect(importing.sort()).toEqual([...KNOWN].sort())
    })

    it('text is not escaped for HTML on its way into a text node or into the data of the albums screen', () => {
        // escapeHtml belongs to an HTML template. These files draw with text nodes or hand data on,
        // so escaping there shows "&amp;" on screen or stores it (UAT-180).
        const plain = ['components/ranking/UserRankModal.js', 'components/series/SeriesEditModal.js',
            'controllers/HomeController.js', 'controllers/SeriesController.js',
            'views/helpers/SeriesComponentFactory.js', 'views/helpers/SeriesViewUpdater.js']
        expect(plain.filter(file => /escapeHtml\s*\(/.test(read(file)))).toEqual([])
    })
})
