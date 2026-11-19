/**
 * Fitness functions of the saved playlists read (arch.md, "Leitura das playlists guardadas", F61).
 * They read the imports of the source files and fail when a boundary of the design is crossed:
 * one owner of the read, a store that only holds state, a screen that asks and does not read.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(process.cwd(), 'public/js')

/** The module specifiers a file imports, static and dynamic. */
const importsOf = (relative) => {
    const source = fs.readFileSync(path.join(ROOT, relative), 'utf8')
    const found = []
    const pattern = /(?:import\s+(?:[^'"]*?\sfrom\s+)?|import\s*\(\s*)['"]([^'"]+)['"]/g
    let match
    while ((match = pattern.exec(source)) !== null) found.push(match[1])
    return found
}
const offenders = (files, isForbidden) => files.flatMap(file =>
    importsOf(file).filter(isForbidden).map(specifier => `${file} -> ${specifier}`))

const SCREEN = [
    'views/SavedPlaylistsView.js',
    'components/playlists/SavedPlaylistsController.js',
    'components/playlists/SavedSeriesGroup.js',
    'components/playlists/SavedPlaylistCard.js',
    'components/playlists/SavedPlaylistRow.js',
    'components/playlists/SavedPlaylistActions.js'
]

describe('saved playlists read boundaries', () => {
    it('the rules of the list are pure: they import nothing', () => {
        expect(importsOf('models/savedPlaylists.js')).toEqual([])
    })

    it('the store only holds state: no service, repository, cache or Firestore', () => {
        const forbidden = /(\/services\/|\/api\/|\/repositories\/|\/cache\/|firebase)/

        expect(offenders(['stores/savedPlaylists.js'], specifier => forbidden.test(specifier))).toEqual([])
    })

    it('the reader reaches the outside only through what it is given', () => {
        const allowed = /(\/utils\/TaskQueue\.js|\/models\/savedPlaylists\.js)$/

        expect(offenders(['services/playlists/SavedPlaylistsReader.js'], specifier => !allowed.test(specifier))).toEqual([])
    })

    it('the adapter knows the repositories and nothing of Firestore, the stores or the screen', () => {
        const forbidden = /(firebase|\/stores\/|\/components\/|\/views\/)/

        expect(offenders(['services/playlists/adapters/RepositoryPlaylistsSource.js'], specifier => forbidden.test(specifier))).toEqual([])
    })

    it('the screen asks and does not read: no repository, no Firestore, no album loader, no source adapter', () => {
        const forbidden = /(\/repositories\/|firebase|OptimizedAlbumLoader|\/adapters\/|SavedPlaylistsReader\.js)/

        expect(offenders(SCREEN, specifier => forbidden.test(specifier))).toEqual([])
    })

    it('only the controller of the screen and the composition file know the reader', () => {
        const all = fs.readdirSync(ROOT, { recursive: true })
            .map(String)
            .filter(file => file.endsWith('.js') && !file.startsWith('vendor'))
        const knowing = all.filter(file => importsOf(file).some(specifier => /savedPlaylistsReading|SavedPlaylistsReader\.js/.test(specifier)))

        expect(knowing.sort()).toEqual([
            'components/playlists/SavedPlaylistsController.js',
            'services/playlists/savedPlaylistsReading.js'
        ])
    })
})
