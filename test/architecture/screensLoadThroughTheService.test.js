/**
 * Fitness functions of F56 (ADR-0019, decision 1): the album load has one owner, and every screen
 * asks it. They read the source files and fail when a controller, a view or a component goes back
 * to loading albums by itself: importing the API client, calling a source, looping over the album
 * queries of a series, or writing an album into the shelf around the load.
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
        return /\.(js|ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts') ? [child] : [] // .ts/.tsx: the React screens (F83)
    })
}
/** The module specifiers a file imports, static and dynamic. */
const importsOf = (relative) => {
    const pattern = /(?:\b(?:import|export)\s+(?:[^'"]*?\sfrom\s+)?|\bimport\s*\(\s*)['"]([^'"]+)['"]/g
    return [...read(relative).matchAll(pattern)].map(match => match[1])
}
/** The source without its comments, so a rule is not broken (or kept) by what a comment says. */
const codeOf = (relative) => read(relative).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')
const importers = (files, isForbidden) => files.flatMap(file =>
    importsOf(file).filter(isForbidden).map(specifier => `${file} -> ${specifier}`))
const writing = (files, pattern) => files.flatMap(file =>
    (codeOf(file).match(pattern) || []).map(found => `${file}: ${found.trim()}`))

const ALL = listJs('').filter(file => !file.startsWith('vendor/'))
/** Everything that is a screen or decides for one. */
const SCREENS = [...listJs('controllers'), ...listJs('views'), ...listJs('components'), ...listJs('screens'), ...listJs('ui'), ...listJs('shell')]
const COMPOSITION = 'services/albums/albumLoading.js'
const ASKS = 'services/albums/AlbumAsks.js'

describe('every screen loads albums through the load service (F56)', () => {
    it('no controller, view or component imports the API client', () => {
        expect(importers(SCREENS, specifier => /api\/client/.test(specifier))).toEqual([])
    })

    it('the API client is wired in one place, where the album load is put together; the list can only shrink', () => {
        const KNOWN = [COMPOSITION]
        const importing = ALL.filter(file => importsOf(file).some(specifier => /api\/client(\.js)?$/.test(specifier)))

        expect(importing.sort()).toEqual(KNOWN)
    })

    it('no controller, view or component calls a source of albums or of ratings by itself', () => {
        // The calls that find an album or bring its ratings and popularity. They belong behind the
        // ports of the album load (services/albums/adapters), which gives them a queue and a state.
        const sourceCall = /\b(fetchAlbum|fetchMultipleAlbums|_fetchAlbumFromAPI|requestRatings|BEAenrichAlbum|enrichAlbumData|albumPopularity|getAlbumDetails|applyEnrichmentToAlbums?|applySpotifyData)\s*\(/g

        expect(writing(SCREENS, sourceCall)).toEqual([])
    })

    it('no controller, view or component loops over the album queries of a series to load them', () => {
        // A loop with a wait inside over `albumQueries` is a load of its own: `for (... albumQueries ...)`,
        // or `albumQueries.map(async ...)` / `.forEach(async ...)`.
        const ownLoop = /for\s*\([^)]*albumQueries[^)]*\)|albumQueries(?:\s*\|\|\s*\[\]\s*\))?\s*\.\s*(?:map|forEach)\(\s*async/g

        expect(writing(SCREENS, ownLoop)).toEqual([])
    })

    it('the blend and the playlists ask through the one door, and only their controllers do', () => {
        const askers = ['controllers/BlendingController.js', 'controllers/PlaylistsController.js']
        askers.forEach(file => {
            expect(importsOf(file).some(specifier => specifier.endsWith(COMPOSITION))).toBe(true)
            expect(codeOf(file)).toMatch(/albumAsks\.albumsOf\(/)
        })

        const screen = ['screens/playlists/Playlists.tsx', 'screens/playlists/PhoneParts.tsx', 'controllers/playlistExports.js',
            ...listJs('screens/blend'), ...listJs('components/playlists')]
        expect(importers(screen, specifier => /services\/albums\//.test(specifier))).toEqual([])
    })

    it('a series joins and leaves the load only through AlbumAsks, so no join is left without its leave', () => {
        const others = ALL.filter(file => file !== ASKS && file !== 'services/albums/AlbumLoadService.js')

        expect(writing(others, /\b(?:albumLoadService|loadService|service)\.(?:join|leave)\(\s*[^)'"`]/g)).toEqual([])
        expect(codeOf(ASKS)).toMatch(/this\.service\.join\(/)
        expect(codeOf(ASKS)).toMatch(/this\.service\.leave\(/)
    })

    it('AlbumAsks reaches the outside only through what it is given', () => {
        expect(importsOf(ASKS).filter(specifier => !/\/models\//.test(specifier))).toEqual([])
    })

    it('the albums shelf has one writer of albums: the projection of the album load', () => {
        expect(ALL.filter(file => /\.setAlbumsBySeries\(/.test(codeOf(file)))).toEqual([COMPOSITION])

        // The methods that put or took one album are gone from the shelf, and nobody calls them on it
        const oneAlbum = /albumsStore\.(?:addAlbumToSeries|addAlbum|removeAlbum|clearAlbumSeries|removeAlbumsBySeriesIdFromContext)\(/g
        expect(writing(ALL, oneAlbum)).toEqual([])
        expect(codeOf('stores/albums.js')).not.toMatch(/^\s+(?:addAlbumToSeries|addAlbum|removeAlbum|clearAlbumSeries|removeAlbumsBySeriesIdFromContext)\(/m)
    })

    it('the load store is written only by the load service', () => {
        const writes = /albumLoadStore\.(?:patchEntry|setSeriesEntries|setSeriesOrder|startGeneration|addGuest|removeGuest)\(/g

        expect(writing(ALL.filter(file => !file.startsWith('services/albums/') && file !== 'stores/albumLoad.js'), writes)).toEqual([])
    })
})
