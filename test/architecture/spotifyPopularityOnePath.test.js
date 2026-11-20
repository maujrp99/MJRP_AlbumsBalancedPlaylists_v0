/**
 * Fitness functions of F69 (UAT-206): the popularity of an album is asked of Spotify in ONE path,
 * the popularity source of the album load (services/albums/adapters/spotifyPopularitySource.js,
 * behind PopularityEnricher). There it has a queue, a state with three outcomes, a hold and a
 * cache. They read the source files and fail when a screen or another service asks on its own.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(process.cwd(), 'public/js')

const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8')
const listJs = (relativeDir) => fs.readdirSync(path.join(ROOT, relativeDir), { withFileTypes: true }).flatMap(entry => {
    const child = path.join(relativeDir, entry.name)
    if (entry.isDirectory()) return listJs(child)
    return entry.name.endsWith('.js') ? [child] : []
})
const importsOf = (relative) => {
    const pattern = /(?:\b(?:import|export)\s+(?:[^'"]*?\sfrom\s+)?|\bimport\s*\(\s*)['"]([^'"]+)['"]/g
    return [...read(relative).matchAll(pattern)].map(match => match[1])
}
const codeOf = (relative) => read(relative).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')

const ALL = listJs('').filter(file => !file.startsWith('vendor/'))
const SPOTIFY = 'services/SpotifyService.js'
const SOURCE = 'services/albums/adapters/spotifyPopularitySource.js'
const COMPOSITION = 'services/albums/albumLoading.js'
const filesWith = (pattern, files = ALL) => files.filter(file => pattern.test(codeOf(file))).sort()
const importing = (pattern) => ALL.filter(file => importsOf(file).some(specifier => pattern.test(specifier))).sort()

describe('one path asks Spotify for the popularity of an album (F69)', () => {
    it('only the popularity source of the album load calls the Spotify calls that find an album and read its popularity', () => {
        // (`getAlbumDetails` is also the name of a call of the Apple Music catalog: only Spotify's counts)
        const albumCall = /\.\s*(?:albumPopularity|searchAlbum|getAlbumTracksWithPopularity|enrichAlbumData)\s*\(|\b(?:SpotifyService|spotify)\s*\.\s*getAlbumDetails\s*\(/

        expect(filesWith(albumCall, ALL.filter(file => file !== SPOTIFY))).toEqual([SOURCE])
    })

    it('the popularity source is wired in one place, where the album load is put together', () => {
        expect(importing(/spotifyPopularitySource(\.js)?$/)).toEqual([COMPOSITION])
    })

    it('what Spotify answered is stored and read by that path only', () => {
        expect(importing(/stores\/SpotifyEnrichmentStore(\.js)?$/)).toEqual([COMPOSITION])
        expect(importing(/repositories\/SpotifyEnrichmentRepository(\.js)?$/)).toEqual(['stores/SpotifyEnrichmentStore.js'])
    })

    it('the background loop over the album queries is gone, and nothing listens for a signal to start one', () => {
        expect(fs.existsSync(path.join(ROOT, 'services/SpotifyEnrichmentService.js'))).toBe(false)
        expect(importing(/SpotifyEnrichmentService/)).toEqual([])
        expect(filesWith(/addEventListener\(\s*['"]spotify-auth-success['"]/)).toEqual([])
    })

    it('no screen writes Spotify data into an album: the helper that does it is used by the composition only', () => {
        expect(importing(/helpers\/SpotifyEnrichmentHelper(\.js)?$/)).toEqual([COMPOSITION])
        const screens = [...listJs('controllers'), ...listJs('views'), ...listJs('components')]
        expect(filesWith(/\.spotifyId\s*=[^=]|\.spotifyPopularity\s*=[^=]/, screens)).toEqual([])
    })

    it('the popularity source reaches the outside only through what it is given', () => {
        const allowed = /\/models\/|spotify\/spotifyErrors(\.js)?$/
        expect(importsOf(SOURCE).filter(specifier => !allowed.test(specifier))).toEqual([])
    })
})
