/**
 * Fitness functions of F57 (arch.md, "Uma peça só para escolher álbuns"): one classifier says the
 * type of an album, one path scans an artist's albums, one picker shows them. They read the source
 * files and fail when a second classifier, a second scan path or a second picker appears.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(process.cwd(), 'public/js')

/** Every .js file under public/js, as a path relative to it. */
const sourceFiles = (dir = ROOT) => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(full)
    return entry.name.endsWith('.js') ? [path.relative(ROOT, full).split(path.sep).join('/')] : []
})
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8')
/** The source without its comments: a comment may name what the code must not do. */
const code = (relative) => read(relative).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')
/** The files whose code matches the pattern, except the ones allowed. */
const filesWith = (pattern, allowed = []) => sourceFiles().filter(file => !allowed.includes(file) && pattern.test(code(file)))

/** The module specifiers a file imports, static and dynamic. */
const importsOf = (relative) => {
    const found = []
    const pattern = /(?:import\s+(?:[^'"]*?\sfrom\s+)?|import\s*\(\s*)['"]([^'"]+)['"]/g
    const source = read(relative)
    let match
    while ((match = pattern.exec(source)) !== null) found.push(match[1])
    return found
}

const CLASSIFIER = 'models/albumType.js'
const PICKER_RULES = 'models/albumPicker.js'
const SCAN_SERVICE = 'services/album-search/AlbumSearchService.js'
const PICKER = 'components/album-picker/AlbumPickerController.js'
const PICKER_PANEL = 'components/album-picker/AlbumPickerPanel.js'
const CARD = 'views/renderers/DiscographyRenderer.js'
const START_CONTROLLER = 'screens/start/StartController.ts'
const START_CARD = 'screens/start/Results.tsx'
const CATALOG = ['services/MusicKitService.js', 'services/musickit/MusicKitCatalog.js']

describe('one classifier says the type of an album', () => {
    it('the classifier is pure: it imports nothing', () => {
        expect(importsOf(CLASSIFIER)).toEqual([])
    })

    it('only the scan service asks the classifier', () => {
        expect(filesWith(/\bclassifyAlbum\b/, [CLASSIFIER])).toEqual([SCAN_SERVICE])
    })

    it('no other module reads what the catalog says about the type of an album', () => {
        // the catalog adapter carries the fields; only the classifier reads them
        expect(filesWith(/\b(isSingle|isCompilation|contentTraits|genreNames)\b/, [CLASSIFIER, ...CATALOG])).toEqual([])
    })

    it('no other module names an album type: the screens use the picker rules', () => {
        const namesAType = /['"]Uncategorized['"]|\.type\s*[!=]==?\s*['"](?:Album|EP|Single|Live|Compilation)['"]/

        // the dictionaries say the heading «Uncategorized» of the albums that belong to no series: a heading, not a classification
        expect(filesWith(namesAType, [CLASSIFIER]).filter(file => !file.startsWith('i18n/'))).toEqual([])
    })

    it('the old classifiers are gone', () => {
        expect(fs.existsSync(path.join(ROOT, 'services/album-search/classification'))).toBe(false)
        expect(filesWith(/AlbumTypeClassifier|GenreGateStrategy|AIWhitelistStrategy|EditionFilter/)).toEqual([])
    })
})

describe('one path scans the albums of an artist', () => {
    it('only the scan service asks the catalog for the albums of an artist', () => {
        expect(filesWith(/\.getArtistAlbums\(/, CATALOG)).toEqual([SCAN_SERVICE])
    })

    it('only the picker asks the scan service', () => {
        expect(filesWith(/\.scanArtist\(/, [SCAN_SERVICE])).toEqual([PICKER])
    })

    it('the scan before F67 is gone', () => {
        expect(filesWith(/getArtistDiscography/)).toEqual([])
    })
})

describe('one picker shows them', () => {
    it('only the picker changes the state of a scan', () => {
        const transitions = /\b(startScan|scanFound|scanEmpty|scanFailed|scanReclassified)\b/

        expect(filesWith(transitions, ['models/scanState.js'])).toEqual([PICKER])
    })

    it('the picker is made in two frames only: the Start screen (React, F83 wave 4) and the block inside the series edit', () => {
        expect(filesWith(/new AlbumPickerController\(/)).toEqual([PICKER_PANEL])
        expect(code(START_CONTROLLER)).toMatch(/new AlbumPickerController\(/)
        expect(filesWith(/new AlbumPickerPanel\(/)).toEqual(['components/series/SeriesEditModal.js'])
    })

    it('the picker knows no screen: what a screen does with a pick comes in as onPick', () => {
        const screen = /(\/views\/|\/controllers\/|\/stores\/|\/series\/|\/home\/)/

        expect(importsOf(PICKER).filter(specifier => screen.test(specifier))).toEqual([])
        expect(importsOf(PICKER_RULES)).toEqual(['./albumType.js'])
    })

    it('one album card for the hand-made screens: only the discography renderer draws it; the Start screen has its own, in React', () => {
        expect(filesWith(/action:\s*['"]pick-album['"]/)).toEqual([CARD])
        expect(code(START_CARD)).toMatch(/data-action="pick-album"/)
    })

    it('one set of filters: only the picker rules name them', () => {
        // the English dictionary of the Start screen (F83 wave 4) says the names of the filters in words: a text, not a second set of filters
        expect(filesWith(/['"]Compendiums['"]|['"]Singles\/EPs['"]/, [PICKER_RULES, 'i18n/en/start.js'])).toEqual([])
    })

    it('the pickers before F57 are gone', () => {
        const gone = ['components/home/SearchController.js', 'controllers/HomeController.js', 'views/HomeView.js', 'components/series/ArtistScanner.js',
            'components/search/DiscographyToolbar.js', 'components/search/VariantPickerModal.js']

        expect(gone.filter(file => fs.existsSync(path.join(ROOT, file)))).toEqual([])
    })
})
