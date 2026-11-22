/**
 * F71 (S-54) - "add the albums of my series": which albums go into the inventory and which do
 * not, decided by a pure function. One album once: the one identity rule (shared/albumIdentity.js,
 * first tier), the Apple Music id and the inventory's own album id say what "the same album" is.
 */
// F83 wave 6c: the English below is what `i18n/inventoryTexts.js` says over the codes the model gives (inventoryModelsGiveCodes.test.js): the very words the model wrote before.
import { describe, it, expect } from 'vitest'
import {
    SkipReason, ADDED_FROM_SERIES, inventoryAlbumFromQuery, findInInventory, planSeriesAlbums
} from '../../public/js/models/inventoryFromSeries.js'
import { confirmationText, nothingToAddText, progressText, outcomeText } from '../../public/js/i18n/inventoryTexts.js'

// Queries as the series store them: an object written by toAlbumQuery, or the text "Artist - Album"
const core = { artist: 'Stone Temple Pilots', title: 'Core', appleMusicId: '1440863531', year: 1992, coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/core/600x600bb.jpg' }
const coreRemastered = { artist: 'Stone Temple Pilots', title: 'Core (Remastered)', appleMusicId: '1255628838', year: 2017, coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/core-remastered/{w}x{h}bb.jpg' }
const purple = { artist: 'Stone Temple Pilots', album: 'Purple', appleMusicId: '1440862963', year: 1994, coverUrl: null }
const ten = 'Pearl Jam - Ten'
const tenAsObject = { artist: 'Pearl Jam', title: 'Ten', appleMusicId: '1053135953', year: 1991, coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/ten/600x600bb.jpg' }
const pageAndPlant = 'Page &amp; Plant - No Quarter'

const series = (name, albumQueries) => ({ id: `series-${name}`, name, albumQueries })

/** An item as "add from an album card" writes it: the loaded album is copied into albumData. */
const itemFromCard = ({ id, title, artist, owned = null, sourceId = null, ...rest }) => ({
    id: `inv-${id}`,
    title,
    artist,
    year: 1990,
    format: 'cd',
    owned,
    purchasePrice: null,
    currency: 'USD',
    notes: '',
    ...rest,
    albumData: { id, title, artist, tracks: [{ title: 'Track 1' }], metadata: sourceId ? { source: 'Apple Music', sourceId } : {} }
})

describe('the inventory album made from a series query', () => {
    it('carries what the query carries, and the id a loaded album of the same names would have', () => {
        expect(inventoryAlbumFromQuery(core)).toEqual({
            id: 'stone-temple-pilots_core',
            title: 'Core',
            artist: 'Stone Temple Pilots',
            year: 1992,
            coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/core/600x600bb.jpg',
            appleMusicId: '1440863531',
            metadata: { addedFrom: ADDED_FROM_SERIES }
        })
    })

    it('a text query gives the names only: no year, no cover, no Apple Music id', () => {
        expect(inventoryAlbumFromQuery(ten)).toEqual({
            id: 'pearl-jam_ten',
            title: 'Ten',
            artist: 'Pearl Jam',
            year: null,
            coverUrl: null,
            appleMusicId: null,
            metadata: { addedFrom: ADDED_FROM_SERIES }
        })
    })

    it('reads the query through the one reader: `album` as the title, HTML entities undone', () => {
        expect(inventoryAlbumFromQuery(purple).title).toBe('Purple')
        expect(inventoryAlbumFromQuery(pageAndPlant)).toMatchObject({ artist: 'Page & Plant', title: 'No Quarter' })
    })

    it('a cover address with the size left open gets a size', () => {
        expect(inventoryAlbumFromQuery(coreRemastered).coverUrl).toBe('https://is1-ssl.mzstatic.com/image/thumb/core-remastered/600x600bb.jpg')
    })

    it('a query with no artist or no title makes no album', () => {
        expect(inventoryAlbumFromQuery('Just A Title')).toBe(null)
        expect(inventoryAlbumFromQuery({ artist: 'Pearl Jam', title: '' })).toBe(null)
        expect(inventoryAlbumFromQuery(null)).toBe(null)
    })

    it('holds nothing Firestore refuses: no undefined', () => {
        const values = (object) => Object.values(object).flatMap(value => (value && typeof value === 'object' ? values(value) : [value]))
        ;[core, ten, purple, { artist: 'A', title: 'B' }].forEach(query => {
            expect(values(inventoryAlbumFromQuery(query))).not.toContain(undefined)
        })
    })
})

describe('which albums of the series go into the inventory', () => {
    it('every album of every series, when the inventory is empty', () => {
        const plan = planSeriesAlbums([series('Grunge', [core, ten]), series('Nineties', [purple])], [])

        expect(plan.toAdd.map(album => album.id)).toEqual(['stone-temple-pilots_core', 'pearl-jam_ten', 'stone-temple-pilots_purple'])
        expect(plan.skipped).toEqual([])
        expect(plan).toMatchObject({ seriesCount: 2, alreadyThere: 0, repeated: 0, incomplete: 0 })
    })

    it('the same album asked for in two series goes in once', () => {
        const plan = planSeriesAlbums([series('Grunge', [core, ten]), series('Nineties', [core, purple])], [])

        expect(plan.toAdd.map(album => album.title)).toEqual(['Core', 'Ten', 'Purple'])
        expect(plan.skipped).toEqual([
            { artist: 'Stone Temple Pilots', title: 'Core', series: 'Nineties', reason: SkipReason.REPEATED_IN_SERIES }
        ])
        expect(plan.repeated).toBe(1)
    })

    it('«Core» and «Core (Remastered)» are one album: the first one met goes in', () => {
        const plan = planSeriesAlbums([series('Grunge', [core]), series('Remasters', [coreRemastered])], [])

        expect(plan.toAdd.map(album => album.title)).toEqual(['Core'])
        expect(plan.skipped).toEqual([
            { artist: 'Stone Temple Pilots', title: 'Core (Remastered)', series: 'Remasters', reason: SkipReason.REPEATED_IN_SERIES }
        ])
    })

    it('«Core» is not «Core Memories», and not the «Core» of another artist', () => {
        const plan = planSeriesAlbums([series('Mix', [
            core,
            { artist: 'Stone Temple Pilots', title: 'Core Memories' },
            { artist: 'Persefone', title: 'Core' }
        ])], [])

        expect(plan.toAdd.map(album => `${album.artist} - ${album.title}`)).toEqual([
            'Stone Temple Pilots - Core', 'Stone Temple Pilots - Core Memories', 'Persefone - Core'
        ])
    })

    it('a text query and an object query of the same album are one album', () => {
        const plan = planSeriesAlbums([series('Grunge', [ten]), series('Seattle', [tenAsObject])], [])

        expect(plan.toAdd).toHaveLength(1)
        expect(plan.toAdd[0]).toMatchObject({ title: 'Ten', appleMusicId: null })
        expect(plan.skipped[0]).toMatchObject({ title: 'Ten', series: 'Seattle', reason: SkipReason.REPEATED_IN_SERIES })
    })

    it('an album already in the inventory is left out, whatever its status: found by the names', () => {
        const owned = itemFromCard({ id: 'stone-temple-pilots_core-remastered', title: 'Core (Remastered)', artist: 'Stone Temple Pilots', owned: true, purchasePrice: 80, currency: 'BRL', format: 'vinyl', notes: 'mint' })
        const inventory = [owned]
        const before = JSON.parse(JSON.stringify(inventory))

        const plan = planSeriesAlbums([series('Grunge', [core, ten])], inventory)

        expect(plan.toAdd.map(album => album.title)).toEqual(['Ten'])
        expect(plan.skipped).toEqual([
            { artist: 'Stone Temple Pilots', title: 'Core', series: 'Grunge', reason: SkipReason.ALREADY_IN_INVENTORY }
        ])
        expect(plan.alreadyThere).toBe(1)
        expect(inventory).toEqual(before) // the item is not touched: status, price, format and notes stay
    })

    it('an album already in the inventory is found by its Apple Music id, when the names differ', () => {
        const item = itemFromCard({ id: 'led-zeppelin_untitled', title: 'Untitled', artist: 'Led Zeppelin', sourceId: '1440863531' })

        expect(planSeriesAlbums([series('Grunge', [core])], [item]).toAdd).toEqual([])
    })

    it('an album already in the inventory is found by the inventory\'s own album id', () => {
        const item = { id: 'inv-1', title: 'Ten (Legacy)', artist: 'PJ', albumData: { id: 'pearl-jam_ten' } }

        expect(planSeriesAlbums([series('Grunge', [ten])], [item]).toAdd).toEqual([])
    })

    it('an album in the inventory that two series ask for counts once as "already there"', () => {
        const item = itemFromCard({ id: 'pearl-jam_ten', title: 'Ten', artist: 'Pearl Jam' })

        const plan = planSeriesAlbums([series('Grunge', [ten]), series('Seattle', [tenAsObject])], [item])

        expect(plan.toAdd).toEqual([])
        expect(plan.skipped.map(skip => skip.reason)).toEqual([SkipReason.ALREADY_IN_INVENTORY, SkipReason.ALREADY_IN_INVENTORY])
        expect(plan.alreadyThere).toBe(1)
    })

    it('an entry with no artist or no title is left out and said', () => {
        const plan = planSeriesAlbums([series('Odd', ['Just A Title', ten])], [])

        expect(plan.toAdd.map(album => album.title)).toEqual(['Ten'])
        expect(plan.skipped).toEqual([{ artist: '', title: 'Just A Title', series: 'Odd', reason: SkipReason.INCOMPLETE }])
        expect(plan.incomplete).toBe(1)
    })

    it('running it again after everything went in adds nothing (idempotence is the recovery)', () => {
        const all = [series('Grunge', [core, ten]), series('Nineties', [coreRemastered, purple, pageAndPlant])]
        const first = planSeriesAlbums(all, [])
        // what the cloud holds after the write: the item the repository makes for each album
        const written = first.toAdd.map((album, index) => ({ id: `inv-${index}`, title: album.title, artist: album.artist, owned: null, albumData: album }))

        const second = planSeriesAlbums(all, written)

        expect(first.toAdd).toHaveLength(4)
        expect(second.toAdd).toEqual([])
        expect(second.alreadyThere).toBe(4)
    })

    it('after a write that stopped half way, running it again plans only the rest', () => {
        const all = [series('Grunge', [core, ten, purple])]
        const first = planSeriesAlbums(all, [])
        const written = first.toAdd.slice(0, 2).map((album, index) => ({ id: `inv-${index}`, title: album.title, artist: album.artist, albumData: album }))

        expect(planSeriesAlbums(all, written).toAdd.map(album => album.title)).toEqual(['Purple'])
    })

    it('series with no albums, and no series at all, plan nothing', () => {
        expect(planSeriesAlbums([series('Empty', []), { id: 'x', name: 'No list' }], [])).toMatchObject({ toAdd: [], seriesCount: 0 })
        expect(planSeriesAlbums(undefined, undefined)).toMatchObject({ toAdd: [], skipped: [], seriesCount: 0 })
    })

    it('plans the 200 albums of 47 series against an inventory in well under a second', () => {
        const queries = Array.from({ length: 250 }, (_, index) => ({ artist: `Artist ${index % 200}`, title: `Album ${index % 200} (Remastered)`, appleMusicId: null }))
        const many = Array.from({ length: 47 }, (_, index) => series(`S${index}`, queries.filter((_, at) => at % 47 === index)))
        const inventory = Array.from({ length: 23 }, (_, index) => itemFromCard({ id: `artist-${index}_album-${index}`, title: `Album ${index}`, artist: `Artist ${index}` }))

        const started = performance.now()
        const plan = planSeriesAlbums(many, inventory)
        const took = performance.now() - started

        expect(plan.toAdd).toHaveLength(177)
        expect(plan.alreadyThere).toBe(23)
        expect(plan.repeated).toBe(27)
        expect(took).toBeLessThan(1000)
    })
})

describe('is this album in the inventory? (the question "add from an album card" asks)', () => {
    const inventory = [
        { id: 'inv-1', title: 'Core', artist: 'Stone Temple Pilots', owned: null, albumData: inventoryAlbumFromQuery(core) }
    ]

    it('a loaded album with the same id is there', () => {
        expect(findInInventory({ id: 'stone-temple-pilots_core', title: 'Core', artist: 'Stone Temple Pilots' }, inventory)?.id).toBe('inv-1')
    })

    it('a loaded edition of an album that came from a series is there: the names say so', () => {
        const loaded = { id: 'stone-temple-pilots_core-deluxe-edition', title: 'Core (Deluxe Edition)', artist: 'Stone Temple Pilots', metadata: { source: 'Apple Music', sourceId: '999' } }

        expect(findInInventory(loaded, inventory)?.id).toBe('inv-1')
    })

    it('a loaded album found under the Apple Music id the series stored is there', () => {
        const loaded = { id: 'stp_core-2', title: 'Core - 25th', artist: 'STP', metadata: { source: 'Apple Music', sourceId: 1440863531 } }

        expect(findInInventory(loaded, inventory)?.id).toBe('inv-1')
    })

    it('another album is not there', () => {
        expect(findInInventory({ id: 'pearl-jam_ten', title: 'Ten', artist: 'Pearl Jam' }, inventory)).toBe(null)
        expect(findInInventory({ id: 'x', title: 'Core', artist: '' }, inventory)).toBe(null) // no artist: the names prove nothing
    })

    it('an id of another source is not an Apple Music id', () => {
        const loaded = { id: 'x_y', title: 'Y', artist: 'X', metadata: { source: 'AI', sourceId: '1440863531' } }

        expect(findInInventory(loaded, inventory)).toBe(null)
    })
})

describe('what the person is told', () => {
    const plan = (numbers) => ({ toAdd: Array.from({ length: numbers.add }), seriesCount: numbers.series, alreadyThere: numbers.there || 0, repeated: numbers.repeated || 0, incomplete: numbers.incomplete || 0 })

    it('before the write: how many go in, from how many series, and what stays as it is', () => {
        expect(confirmationText(plan({ add: 176, series: 47, there: 23 })))
            .toBe('176 albums from your 47 series will be added as Not Owned. 23 albums already in your inventory stay as they are.')
        expect(confirmationText(plan({ add: 1, series: 1 })))
            .toBe('1 album from your 1 series will be added as Not Owned.')
        expect(confirmationText(plan({ add: 5, series: 2, there: 1, repeated: 3, incomplete: 1 })))
            .toBe('5 albums from your 2 series will be added as Not Owned. 1 album already in your inventory stays as it is. 3 entries that repeat an album of another series are added once. 1 entry with no artist or no title is left out.')
    })

    it('when there is nothing to add', () => {
        expect(nothingToAddText(plan({ add: 0, series: 47, there: 199 }))).toBe('Every album of your series is already in your inventory. Nothing was added.')
        expect(nothingToAddText(plan({ add: 0, series: 0 }))).toBe('Your series have no albums to add. Nothing was added.')
    })

    it('during the write', () => {
        expect(progressText({ added: 0, total: 176 })).toBe('Adding 176 albums…')
        expect(progressText({ added: 100, total: 176 })).toBe('Adding albums… 100 of 176')
    })

    it('at the end: all in, some in, or none in', () => {
        expect(outcomeText({ added: 176, total: 176, error: null })).toEqual({ ok: true, text: 'Added 176 albums as Not Owned.' })
        expect(outcomeText({ added: 1, total: 1, error: null })).toEqual({ ok: true, text: 'Added 1 album as Not Owned.' })
        expect(outcomeText({ added: 100, total: 176, error: 'offline' })).toEqual({
            ok: false,
            text: 'Added 100 of 176 albums as Not Owned, then a write failed. 76 albums were not added: run the action again to add the rest.'
        })
        expect(outcomeText({ added: 0, total: 176, error: 'offline' })).toEqual({
            ok: false,
            text: 'No album was added: the write failed and your inventory is as it was. Try again.'
        })
    })

    it('at the end, when the albums went in and the inventory could not be read again', () => {
        expect(outcomeText({ added: 176, total: 176, error: null, reloaded: false }))
            .toEqual({ ok: true, text: 'Added 176 albums as Not Owned. Reload the page to see them.' })
    })
})
